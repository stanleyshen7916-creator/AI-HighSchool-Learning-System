const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { PDFParse } = require('pdf-parse');
const Tesseract = require('tesseract.js');
const crypto = require('crypto');
const {
  runTriCouncil,
  checkOllamaAvailable,
  assembleCouncilFinal,
  generateCouncilMarkdown,
  DEFAULT_ADJUDICATION_TIMEOUT_MS,
} = require('./services/multiAi');

const { createPackageBuilder } = require('./platform/PackageBuilder');
const { createGitPublishQueue } = require('./platform/GitPublishQueue');

const app = express();
const PORT = process.env.PORT || 3000;
const ENGINE_VERSION = require('./package.json').version;

// 2026-09-29 併入學習平台：引擎程式碼移至 ai-engine/council/，執行期資料（上傳暫存、
// Final.md、MinerU 佇列、模型快取）一律放在 COUNCIL_DATA_DIR，不再散落在程式碼目錄。
// 目錄名稱沿用 AI-Study-Council 原本的根目錄配置，所以把 COUNCIL_DATA_DIR 指向舊的
// AI-Study-Council 資料夾即可直接沿用既有的 Final.md、catalog 與 MinerU 輸出，不需搬移。
const DATA_DIR = path.resolve(process.env.COUNCIL_DATA_DIR || path.join(__dirname, 'data'));
// 學習平台 repo 根目錄：教材包寫入 docs/TeachingMaterials/，上傳頁由這裡靜態提供。
const PLATFORM_ROOT = path.resolve(process.env.PLATFORM_ROOT || path.join(__dirname, '..', '..'));

const OUTPUTS_DIR = path.join(DATA_DIR, 'outputs');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
// 原始上傳檔（位元組完全相同、保留原檔名）依上傳批次保存，建立教材包時複製進 source/。
const UPLOAD_SESSIONS_DIR = path.join(DATA_DIR, 'upload_sessions');
const FINAL_BACKUP_DIR = path.join(DATA_DIR, '04_Final');
const PLATFORM_DIST_DIR = path.join(DATA_DIR, 'platform_dist');
const CATALOG_PATH = path.join(PLATFORM_DIST_DIR, 'catalog.json');
const MINERU_OUTPUTS_DIR = path.join(DATA_DIR, 'mineru_outputs');
const REVIEW_ENGINE = 'AI-Study-Council Cross-Reviewer v1.1';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const packageBuilder = createPackageBuilder({ platformRoot: PLATFORM_ROOT, dataDir: DATA_DIR });
const gitPublishQueue = createGitPublishQueue({ dataDir: DATA_DIR, platformRoot: PLATFORM_ROOT });

// 瀏覽器來源檢查：引擎沒有登入機制、只綁在本機，但使用者的瀏覽器開著其他網站時，
// 那些網站仍可對 localhost 發出「簡單請求」（例如 multipart 表單 POST）。凡是帶 Origin
// 標頭（瀏覽器發出的請求）且不在允許清單內的請求一律拒絕；curl／測試等非瀏覽器用戶端
// 不帶 Origin，不受影響。
const ALLOWED_ORIGINS = new Set([
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  'https://stanleyshen7916-creator.github.io',
  ...String(process.env.COUNCIL_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  if (!ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: `來源 ${origin} 不在教材上傳引擎的允許清單內` });
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Chrome Private Network Access：公開網站（GitHub Pages）呼叫 localhost 前的預檢需要這個標頭。
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
});

app.use(express.json({ limit: '5mb' }));
// 供前端讀取 MinerU 解析後的教材圖片（縮圖預覽用），唯讀靜態掛載
app.use('/mineru_outputs', express.static(MINERU_OUTPUTS_DIR));

const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.txt', '.md', '.pdf', '.png', '.jpg', '.jpeg']);

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
      cb(new Error(`不支援的檔案格式：${ext}`));
      return;
    }
    cb(null, true);
  },
});

// imageSource：tesseract.js 的 recognize() 接受檔案路徑字串或 Buffer，兩種呼叫端都用得到
// （原始圖片上傳傳檔案路徑；PDF 掃描頁 fallback 則傳渲染後的頁面 PNG Buffer）。
async function ocrImage(imageSource) {
  // cachePath：traineddata 放在資料目錄（AI-Study-Council 根目錄原本就有這兩個檔案），
  // 指向舊資料夾時可直接沿用，不必重新下載。
  // tesseract.js 固定 6.0.1：7.0.0 載入多語言（chi_tra+eng）時第二個語言會以亂碼檔名
  // 載入失敗，實際只用 chi_tra 辨識（2026-09-29 以真實掃描頁在容器內實測）。
  const { data } = await Tesseract.recognize(imageSource, 'chi_tra+eng', { cachePath: DATA_DIR });
  const boxText = (data.words || []).map((word) => word.text).join(' ');
  return [data.text, boxText].filter(Boolean).join('\n').trim();
}

// pdf-parse 的 getText() 只讀「PDF 內嵌的文字層」——課本掃描/拍照後直接存成 PDF 的頁面本質上
// 是一張圖片，通常完全沒有文字層，getText() 對這種 PDF 會回傳幾乎空白的內容（實測發現，有些
// 掃描流程會在頁面上留下像「-- 1 of 2 --」這種頁碼章戳，混在內嵌文字層裡，讓回傳字串看起來
// 「不是空的」，但其實完全沒有課本正文）。這裡不看原始字元數，而是數「真正的文字字元」
// （\p{L}，涵蓋中文單字與英文字母，但不含純數字／破折號／空白），因為章戳類雜訊通常只有
// 個位數個字母，跟真正一頁課文（幾十到幾百個中文字）差距懸殊，比單純比較字串長度更抗雜訊。
const PDF_MEANINGFUL_CHAR_THRESHOLD = 8;

// 頁碼章戳（「-- 1 of 4 --」）先移除再計數：每頁的「of」算 2 個字母，4 頁以上的純掃描
// PDF 就會湊滿門檻、被誤判成「有文字層」而不走 OCR（2026-09-29 以真實 4 頁掃描檔實測發現）。
const PAGE_MARKER = /--\s*\d+\s+of\s+\d+\s*--/gi;

function countMeaningfulChars(text) {
  return (String(text ?? '').replace(PAGE_MARKER, '').match(/\p{L}/gu) || []).length;
}

// 可用環境變數覆寫（例如測試環境指向隔離的 tmp 目錄）：這台機器上曾經實測遇到真正的
// mineru-parser 容器剛好在跑、共用同一份 bind mount 目錄，導致 `npx jest` 在本機執行時
// 意外偵測到「真實」心跳並嘗試對一個測試不會真正建立的 job 進行長時間輪詢，測試因此掛住。
// 測試環境必須能指向完全隔離的目錄，不得依賴「這台機器目前有沒有在跑 Docker」這種環境狀態。
// 注意：變數名稱刻意跟既有的 MINERU_OUTPUTS_DIR（見上方，教材圖片靜態伺服用途）分開，
// 雖然預設值指向同一個實體目錄樹，但語意上是兩個不同用途，不應該共用同一個環境變數名稱。
const MINERU_INPUTS_DIR = process.env.MINERU_QUEUE_INPUTS_DIR || path.join(DATA_DIR, 'mineru_inputs');
const MINERU_OUTPUTS_QUEUE_DIR = process.env.MINERU_QUEUE_OUTPUTS_DIR || path.join(DATA_DIR, 'mineru_outputs');
// tools/mineru_watch.sh 每次迴圈（含 2 秒 sleep）都會更新這個心跳檔；沒看到近期心跳
// 就代表 mineru-parser 容器沒在跑，直接放棄改用 Tesseract fallback，不浪費時間空等逾時。
const MINERU_HEARTBEAT_STALE_MS = 10000;
// CPU pipeline 每次 mineru CLI 呼叫都要重新把模型載入記憶體（tools/mineru_watch.sh 是
// 逐一啟動獨立行程，非常駐 API server），實測（含首次下載權重）約 100 秒，這裡保留數倍
// 餘裕；權重快取後應該遠低於這個時間，逾時只在服務真的卡住時才會觸發。
const MINERU_POLL_TIMEOUT_MS = 5 * 60 * 1000;
const MINERU_POLL_INTERVAL_MS = 2000;

function isMineruWatcherAlive(outputsDir) {
  try {
    const stat = fs.statSync(path.join(outputsDir, '.heartbeat'));
    return Date.now() - stat.mtimeMs < MINERU_HEARTBEAT_STALE_MS;
  } catch {
    return false;
  }
}

// 把 filePath（PDF 掃描頁或原始圖片）交給 MinerU 佇列（tools/mineru_watch.sh）處理：
// 複製一份到 inputsDir 並輪詢 outputsDir/<jobId>/ocr/<jobId>.md 直到出現 .done／.error。
// 實測（真實課本掃描頁，見 commit 紀錄）MinerU 的繁體中文辨識品質遠優於 Tesseract——
// Tesseract 對有裝飾底紋／複雜版面的照片頁常把背景圖案誤判成大量雜訊字元，MinerU 則能
// 正確重現整段課文，僅有極少數簡繁混用的小瑕疵。options 供測試注入獨立的 tmp 目錄／
// jobId／輪詢間隔，不需要真的啟動 mineru-parser 容器就能驗證輪詢邏輯本身。
async function runMinerU(filePath, ext, options = {}) {
  const inputsDir = options.inputsDir || MINERU_INPUTS_DIR;
  const outputsDir = options.outputsDir || MINERU_OUTPUTS_QUEUE_DIR;
  const pollIntervalMs = options.pollIntervalMs || MINERU_POLL_INTERVAL_MS;
  const pollTimeoutMs = options.pollTimeoutMs ?? MINERU_POLL_TIMEOUT_MS;

  if (!isMineruWatcherAlive(outputsDir)) {
    throw new Error('MinerU 佇列服務未偵測到心跳（mineru-parser 容器可能未啟動）');
  }

  const jobId = options.jobId || `mineru-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  fs.mkdirSync(inputsDir, { recursive: true });
  fs.copyFileSync(filePath, path.join(inputsDir, `${jobId}${ext}`));

  const jobOutputDir = path.join(outputsDir, jobId);
  const donePath = path.join(jobOutputDir, '.done');
  const errorPath = path.join(jobOutputDir, '.error');
  const mdPath = path.join(jobOutputDir, 'ocr', `${jobId}.md`);

  const deadline = Date.now() + pollTimeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(errorPath)) {
      throw new Error(`MinerU 解析失敗（詳見 ${jobOutputDir}/mineru.log）`);
    }
    if (fs.existsSync(donePath)) {
      return fs.readFileSync(mdPath, 'utf8');
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`MinerU 解析逾時（超過 ${pollTimeoutMs}ms 未完成）`);
}

async function ocrPdfPagesWithTesseract(parser) {
  // 內嵌文字層幾乎沒有真正的文字：比照 .png/.jpg 分支，把每一頁渲染成圖片後改用
  // Tesseract OCR，而不是直接把幾乎空白的內容當成「解析完成」回傳給使用者。
  const screenshots = await parser.getScreenshot({ imageBuffer: true });
  const pageTexts = [];
  // 依序（不平行）逐頁 OCR：避免對這台機器同時發起多個高負載 OCR 工作。
  for (const page of screenshots.pages) {
    // eslint-disable-next-line no-await-in-loop
    const text = await ocrImage(Buffer.from(page.data));
    pageTexts.push(`-- ${page.pageNumber} of ${screenshots.total} --\n${text}`);
  }
  return pageTexts.join('\n\n');
}

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf8');
  }

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();

      if (countMeaningfulChars(result.text) >= PDF_MEANINGFUL_CHAR_THRESHOLD) {
        return result.text;
      }

      try {
        return await runMinerU(filePath, ext);
      } catch (error) {
        console.warn(`MinerU 解析失敗，退回 Tesseract（辨識品質較低）：${error.message}`);
        return await ocrPdfPagesWithTesseract(parser);
      }
    } finally {
      await parser.destroy();
    }
  }

  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
    try {
      return await runMinerU(filePath, ext);
    } catch (error) {
      console.warn(`MinerU 解析失敗，退回 Tesseract（辨識品質較低）：${error.message}`);
      return ocrImage(filePath);
    }
  }

  throw new Error(`不支援的檔案格式：${ext}`);
}

const FINAL_ITEMS = [
  '①核心概念',
  '②章節摘要',
  '③重點詞彙',
  '④文意理解',
  '⑤修辭手法',
  '⑥文化脈絡',
  '⑦作者背景',
  '⑧段落結構',
  '⑨延伸思考',
  '⑩易混淆概念',
  '⑪常考題型',
  '⑫易錯陷阱',
  '⑬跨課連結',
  '⑭Cross Review',
  '⑮Final Score',
];

function sanitizeSegment(value) {
  const cleaned = String(value ?? '').trim().replace(/[^\p{L}\p{N}_-]/gu, '_');
  return cleaned || 'unknown';
}

// safeSlug：與 sanitizeSegment 邏輯一致，供檔名／目錄用途語意化命名（Path Traversal 防護第一層）。
const safeSlug = sanitizeSegment;

// assertInsideDir：Path Traversal 防護第二層（defense-in-depth）。即使 safeSlug 已濾除路徑字元，
// 仍以 path.resolve() 正規化後比對是否仍位於 baseDir 內，涵蓋 Windows/Linux 混合分隔符與符號連結等情形。
// 驗證失敗時拋出例外，呼叫端必須視為 400/404，不得繼續寫檔或讀檔。
function assertInsideDir(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedBase, resolvedTarget);
  const isInside = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (!isInside) {
    throw new Error(`Path traversal 偵測：${targetPath} 不在允許目錄 ${baseDir} 內`);
  }
  return resolvedTarget;
}

// 教材識別碼：與 Final.md 檔名前綴規則一致，用於對應 mineru_outputs/<materialId>/images/
function buildMaterialId(school, grade, subject, unit, category) {
  return [school, grade, subject, unit, category].map(sanitizeSegment).join('_');
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);

function listImageFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort();
}

function buildSectionContent(title, text) {
  const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
  if (title === '①核心概念') {
    return `根據來源文本節錄之核心概念摘要：\n\n> ${preview || '（無提供文本）'}`;
  }
  if (title === '⑮Final Score') {
    return 'Self-QA：90 / 100';
  }
  return `（待補充：${title} 相關內容分析）`;
}

function generateStudyMarkdown({ school, grade, subject, unit, category, engine, text, council }) {
  const safeSchool = school ?? '';
  const safeGrade = grade ?? '';
  const safeSubject = subject ?? '';
  const safeUnit = unit ?? '';
  const safeCategory = category ?? '';
  const safeEngine = engine ?? '';
  const safeText = text ?? '';
  const generatedAt = new Date().toISOString();

  const sections = council?.sections ?? {};
  const meta = council?.meta ?? {};
  const phase1Scores = meta.phase1Scores ?? {};

  const header = [
    '---',
    `school: ${safeSchool}`,
    `grade: ${safeGrade}`,
    `subject: ${safeSubject}`,
    `unit: ${safeUnit}`,
    `category: ${safeCategory}`,
    `engine: ${safeEngine}`,
    `review_engine: ${REVIEW_ENGINE}`,
    `ai_team: ${meta.team ?? 'GPT + Gemini + Claude'}`,
    `review_mode: ${meta.reviewMode ?? 'Independent → Cross Review → Adjudication'}`,
    `council_pipeline: ${meta.pipeline ?? 'Council Pipeline: SIMULATED'}`,
    `generated_at: ${generatedAt}`,
    `source_length: ${safeText.length}`,
    'version: 1.0',
    '---',
    '',
    `# ${safeSubject} ${safeUnit} Final`,
    '',
    `學校：${safeSchool}`,
    `年級：${safeGrade}`,
    `科目：${safeSubject}`,
    `單元：${safeUnit}`,
    `教材類別：${safeCategory}`,
    `AI 引擎：${safeEngine}`,
    `審查引擎：${REVIEW_ENGINE}`,
    `產出 AI 團隊：${meta.team ?? 'GPT + Gemini + Claude'}`,
    `審查模式：${meta.reviewMode ?? 'Independent → Cross Review → Adjudication'}`,
    `審議管線：${meta.pipeline ?? 'Council Pipeline: SIMULATED'}`,
    '',
  ].join('\n');

  const body = FINAL_ITEMS
    .map((title) => `## ${title}\n\n${sections[title] ?? `（待補充：${title} 相關內容分析）`}`)
    .join('\n\n');

  const phaseAudit = [
    '### 審查紀錄',
    '',
    `Phase 1 獨立初稿自評：GPT ${phase1Scores.GPT ?? 'N/A'}/100；Gemini ${phase1Scores.Gemini ?? 'N/A'}/100；Claude ${phase1Scores.Claude ?? 'N/A'}/100`,
    'Phase 2 交叉比對修訂：GPT-Revised；Gemini-Revised；Claude-Revised',
    `Phase 3 首席審議裁決：Quality Gate ${meta.qualityGate ?? 'PENDING_MANUAL_REVIEW'}`,
    '',
    `Self-QA：${meta.finalScore ?? 'N/A'} / 100`,
  ].join('\n');

  return `${header}\n${body}\n\n${phaseAudit}\n`;
}

// generateCouncilMarkdown 已移除本地重複實作（P0-09）：唯一 Canonical Final Generator
// 現在只存在於 services/multiAi.js，並於檔案頂端 require 匯入，避免兩套 Final 產生邏輯
// 互相漂移（過去正是因為這裡的舊版本與 multiAi.js 的新版本不同步，導致正式 endpoint
// 從未真正輸出 Failure Reason / HARD FAIL 等強化欄位）。

function readCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    return { items: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch (error) {
    return { items: [] };
  }
}

function writeCatalogEntry(entry) {
  fs.mkdirSync(PLATFORM_DIST_DIR, { recursive: true });
  const catalog = readCatalog();
  const items = catalog.items.filter((item) => item.filename !== entry.filename);
  items.push(entry);
  fs.writeFileSync(CATALOG_PATH, JSON.stringify({ items }, null, 2), 'utf8');
  return { items };
}

// Sync 路徑的內部 timeout：刻意設短（非 4 秒但也不是 15 分鐘），讓走錯路徑的呼叫端
// 快速拿到 PENDING_MANUAL_REVIEW 而不是把瀏覽器同步阻塞十幾分鐘。真正的 Real Semantic
// Cross-Council（會實際等待 Qwen 完整跑完）必須走下面的 async job 端點（P0-06）。
const SYNC_ADJUDICATION_TIMEOUT_MS = 20000;

function validateAssembleCouncilPayload(body) {
  const { school, grade, subject, unit, category, sourceText, sourceRef, drafts } = body || {};
  const chatgpt = drafts?.chatgpt;
  const gemini = drafts?.gemini;
  const claude = drafts?.claude;

  if (!school || !grade || !subject || !unit || !category) {
    return { error: 'school, grade, subject, unit, category 為必填欄位' };
  }
  if (!chatgpt?.trim() || !gemini?.trim() || !claude?.trim()) {
    return { error: '請提供 ChatGPT (Web)、Gemini (Web)、Claude (Web) 三方初稿內容' };
  }

  return {
    metadata: { school, grade, subject, unit, category },
    drafts: { chatgpt, gemini, claude },
    sourceText: sourceText || '',
    sourceRef: sourceRef || null,
  };
}

// 共用執行邏輯：sync endpoint 與 async job worker 都呼叫這裡，確保兩條路徑
// 使用同一套 Canonical Final Generator 與同一套 provenance 落地邏輯（P0-09）。
async function runAssembleCouncil({ metadata, drafts, sourceText, sourceRef }, { timeoutMs } = {}) {
  const { school, grade, subject, unit, category } = metadata;
  // SOURCE ID：重用既有 buildMaterialId 慣例（與 mineru_outputs/<id>/images/ 同一套 id），
  // 讓同一份教材在 MinerU 圖片、Final.md、platform_dist 之間共用同一個穩定識別碼（P2/P3）。
  const sourceId = buildMaterialId(school, grade, subject, unit, category);
  // Run ID：每次實際執行一次 Council 裁決都產生一個新的識別碼，確保 Final.md／
  // adjudication.json／platform_dist index 三者可證明屬於同一次 run（P11）。
  const runId = crypto.randomUUID();

  const council = await assembleCouncilFinal(metadata, drafts, sourceText, { timeoutMs, sourceRef, sourceId, runId });
  const markdown = generateCouncilMarkdown({ school, grade, subject, unit, category, council });
  const filename = `${safeSlug(school)}_${safeSlug(grade)}_${safeSlug(subject)}_${safeSlug(unit)}_${safeSlug(category)}_Final.md`;

  const outputsPath = assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, filename));
  const distPath = assertInsideDir(PLATFORM_DIST_DIR, path.join(PLATFORM_DIST_DIR, filename));
  const adjudicationFilename = `${filename}.adjudication.json`;
  const adjudicationOutputsPath = assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, adjudicationFilename));
  // P3／Section 9：每次正式 run 也要有 platform_dist/<id>/index.md 型式的輸出，供以
  // SOURCE ID 為主鍵的平台消費端讀取；既有的扁平 <slug>_Final.md + catalog.json 維持不變
  // （不重新設計現有平台格式），這是新增、不是取代。
  const platformIndexDir = assertInsideDir(PLATFORM_DIST_DIR, path.join(PLATFORM_DIST_DIR, sourceId));
  const platformIndexPath = assertInsideDir(platformIndexDir, path.join(platformIndexDir, 'index.md'));

  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  fs.writeFileSync(outputsPath, markdown, 'utf8');
  // P0-05 Provenance：每一次 assemble-council 都必須留下可追溯的 claim-level
  // adjudication record，不得只有 Final.md 而沒有可查核的裁決過程。
  fs.writeFileSync(adjudicationOutputsPath, JSON.stringify(council.adjudicationRecord, null, 2), 'utf8');

  fs.mkdirSync(PLATFORM_DIST_DIR, { recursive: true });
  fs.writeFileSync(distPath, markdown, 'utf8');
  fs.mkdirSync(platformIndexDir, { recursive: true });
  fs.writeFileSync(platformIndexPath, markdown, 'utf8');

  const catalogEntry = {
    filename,
    school,
    grade,
    subject,
    unit,
    category,
    source_id: sourceId,
    run_id: runId,
    mode: council.meta.mode,
    sources: council.meta.sources,
    adjudicator: council.meta.adjudicator,
    adjudication_mode: council.meta.adjudication_mode,
    qualityGate: council.meta.qualityGate,
    finalScore: council.meta.finalScore,
    failureReason: council.meta.failureReason,
    generated_at: new Date().toISOString(),
    path: `platform_dist/${filename}`,
    platform_index_path: `platform_dist/${sourceId}/index.md`,
    adjudication_path: `outputs/${adjudicationFilename}`,
  };
  const catalog = writeCatalogEntry(catalogEntry);

  return {
    filename,
    content: markdown,
    catalogEntry,
    catalog,
    sourceId,
    runId,
    platformIndexPath: `platform_dist/${sourceId}/index.md`,
    adjudicationRecord: council.adjudicationRecord,
    adjudicationPath: `outputs/${adjudicationFilename}`,
  };
}

app.post('/api/assemble-council', async (req, res) => {
  const validated = validateAssembleCouncilPayload(req.body);
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  let result;
  try {
    result = await runAssembleCouncil(validated, { timeoutMs: SYNC_ADJUDICATION_TIMEOUT_MS });
  } catch (error) {
    return res.status(400).json({ error: error.message || '不合法的檔名或路徑' });
  }

  return res.status(200).json(result);
});

// P0-06：可靠的 long-running execution mechanism。真正的 Real Semantic Cross-Council
// （Canonical SOURCE 完整送入 Qwen、實測約需數分鐘）必須走這裡，而不是把 HTTP 請求
// 同步阻塞到逾時。POST 建立 job 立即回傳 202，實際 Ollama 呼叫在背景執行；
// GET 輪詢 job 狀態，狀態至少涵蓋 queued/running/completed/failed/pending_manual_review。
const assembleCouncilJobs = new Map();

app.post('/api/assemble-council/jobs', (req, res) => {
  const validated = validateAssembleCouncilPayload(req.body);
  if (validated.error) {
    return res.status(400).json({ error: validated.error });
  }

  const jobId = crypto.randomUUID();
  const job = {
    jobId,
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: null,
    error: null,
  };
  assembleCouncilJobs.set(jobId, job);

  job.status = 'running';
  job.updatedAt = new Date().toISOString();

  runAssembleCouncil(validated, { timeoutMs: DEFAULT_ADJUDICATION_TIMEOUT_MS })
    .then((result) => {
      job.result = result;
      job.updatedAt = new Date().toISOString();
      job.status = result.catalogEntry.qualityGate === 'PENDING_MANUAL_REVIEW' ? 'pending_manual_review' : 'completed';
    })
    .catch((error) => {
      job.error = error.message || String(error);
      job.updatedAt = new Date().toISOString();
      job.status = 'failed';
    });

  return res.status(202).json({ jobId, status: job.status });
});

app.get('/api/assemble-council/jobs/:jobId', (req, res) => {
  const job = assembleCouncilJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'job 不存在' });
  }
  return res.status(200).json(job);
});

app.post('/api/analyze', async (req, res) => {
  const { school, grade, subject, unit, category, engine, text } = req.body || {};

  if (!school || !grade || !subject || !unit || !category || !engine || !text) {
    return res.status(400).json({ error: 'school, grade, subject, unit, category, engine, text 為必填欄位' });
  }

  const council = await runTriCouncil(text, { school, grade, subject, unit, category, engine });
  const markdown = generateStudyMarkdown({ school, grade, subject, unit, category, engine, text, council });
  const filename = `${safeSlug(school)}_${safeSlug(grade)}_${safeSlug(subject)}_${safeSlug(unit)}_${safeSlug(category)}_Final.md`;

  let outputsPath;
  try {
    outputsPath = assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, filename));
  } catch {
    return res.status(400).json({ error: '不合法的檔名或路徑' });
  }

  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  fs.writeFileSync(outputsPath, markdown, 'utf8');

  if (fs.existsSync(FINAL_BACKUP_DIR)) {
    fs.writeFileSync(assertInsideDir(FINAL_BACKUP_DIR, path.join(FINAL_BACKUP_DIR, filename)), markdown, 'utf8');
  }

  return res.status(200).json({ filename, content: markdown });
});

app.get('/api/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  let filePath;
  try {
    filePath = assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, filename));
  } catch {
    return res.status(400).json({ error: '不合法的檔案路徑' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '檔案不存在' });
  }

  return res.download(filePath, filename);
});

// 多模態圖片配套下載機制：列出該教材（MinerU 解析）之圖片清單與縮圖路徑
app.get('/api/materials/:id/images', (req, res) => {
  const materialId = safeSlug(req.params.id);
  let imagesDir;
  try {
    imagesDir = assertInsideDir(MINERU_OUTPUTS_DIR, path.join(MINERU_OUTPUTS_DIR, materialId, 'images'));
  } catch {
    return res.status(400).json({ error: '不合法的教材識別碼' });
  }
  const thumbsDir = path.join(imagesDir, 'thumbnails');

  const files = listImageFiles(imagesDir);
  const images = files.map((filename) => {
    const hasThumbnail = fs.existsSync(path.join(thumbsDir, filename));
    const encodedName = encodeURIComponent(filename);
    return {
      filename,
      path: `mineru_outputs/${materialId}/images/${filename}`,
      url: `/mineru_outputs/${materialId}/images/${encodedName}`,
      thumbnailUrl: hasThumbnail
        ? `/mineru_outputs/${materialId}/images/thumbnails/${encodedName}`
        : `/mineru_outputs/${materialId}/images/${encodedName}`,
    };
  });

  return res.status(200).json({ materialId, count: images.length, images });
});

// 將該教材 mineru_outputs/<id>/images/ 內的圖片打包為 zip 供使用者一鍵下載
app.get('/api/materials/:id/images/download', (req, res) => {
  const materialId = safeSlug(req.params.id);
  let imagesDir;
  try {
    imagesDir = assertInsideDir(MINERU_OUTPUTS_DIR, path.join(MINERU_OUTPUTS_DIR, materialId, 'images'));
  } catch {
    return res.status(400).json({ error: '不合法的教材識別碼' });
  }
  const files = listImageFiles(imagesDir);

  if (files.length === 0) {
    return res.status(404).json({ error: '此教材尚無解析後的圖片可供下載' });
  }

  // Content-Disposition 標頭僅允許 ASCII，materialId 可能含中文，故提供 ASCII 備援檔名，
  // 並以 RFC 6266 filename* 參數附上 UTF-8 編碼後的完整檔名供支援的瀏覽器使用。
  const asciiFallbackName = materialId.replace(/[^\x20-\x7E]/g, '_') || 'material';
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallbackName}_images.zip"; filename*=UTF-8''${encodeURIComponent(materialId)}_images.zip`,
  );

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (error) => {
    if (!res.headersSent) {
      res.status(500).json({ error: `打包圖片失敗：${error.message}` });
    } else {
      res.end();
    }
  });

  archive.pipe(res);
  files.forEach((filename) => {
    archive.file(path.join(imagesDir, filename), { name: filename });
  });
  return archive.finalize();
});

// 多檔案上傳：依原始檔名排序後逐一解析文字，再依序合併成單一教材本文。
// .md/.txt 直接讀取內文；.pdf/圖片交由 extractTextFromFile 解析（PDF 文字擷取 / OCR），
// 各檔案間以空行分隔，藉此在合併結果中保留頁面／檔案邊界。
async function extractTextFromFiles(files) {
  const sorted = [...files].sort((a, b) => a.originalname.localeCompare(b.originalname, 'zh-Hant'));
  const parts = [];
  for (const file of sorted) {
    const text = await extractTextFromFile(file.path);
    parts.push({ filename: file.originalname, text });
  }
  return parts;
}

// multer（busboy）預設以 latin1 解讀 multipart 檔名，中文檔名會變成亂碼；
// 若重新以 UTF-8 解碼後沒有出現替代字元，就採用 UTF-8 版本。
function decodeOriginalName(name) {
  const raw = String(name || '');
  if (!/[\u0080-ÿ]/.test(raw)) return raw;
  const utf8 = Buffer.from(raw, 'latin1').toString('utf8');
  return utf8.includes('�') ? raw : utf8;
}

// 保留原始上傳檔：位元組完全相同、保留原檔名（僅取 basename 防止路徑穿越），
// 供之後建立教材包時放進 source/（教材包標準：source/ 是原始上傳檔）。
function keepOriginals(files) {
  const sessionId = crypto.randomUUID();
  const sessionDir = assertInsideDir(UPLOAD_SESSIONS_DIR, path.join(UPLOAD_SESSIONS_DIR, sessionId));
  fs.mkdirSync(sessionDir, { recursive: true });
  const used = new Set();
  files.forEach((file) => {
    let name = path.basename(decodeOriginalName(file.originalname)) || `file${path.extname(file.path)}`;
    while (used.has(name)) name = `_${name}`;
    used.add(name);
    fs.copyFileSync(file.path, assertInsideDir(sessionDir, path.join(sessionDir, name)));
  });
  return sessionId;
}

app.post('/api/upload', upload.array('files'), async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: '請選擇要上傳的檔案' });
  }

  try {
    files.forEach((file) => { file.originalname = decodeOriginalName(file.originalname); });
    const parts = await extractTextFromFiles(files);
    const mergedText = parts.map((part) => part.text).join('\n\n');
    const sessionId = keepOriginals(files);
    return res.status(200).json({
      text: mergedText,
      sessionId,
      files: parts.map((part) => ({ filename: part.filename, length: part.text.length })),
    });
  } catch (error) {
    return res.status(500).json({ error: `檔案解析失敗：${error.message}` });
  } finally {
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
});

// ---- 學習平台整合（2026-09-29）----------------------------------------------

app.get('/api/health', async (req, res) => {
  let ollama = false;
  try {
    ollama = await checkOllamaAvailable();
  } catch {
    ollama = false;
  }
  res.status(200).json({
    engine: 'ahs-council',
    version: ENGINE_VERSION,
    mineru: isMineruWatcherAlive(MINERU_OUTPUTS_QUEUE_DIR),
    ollama: !!ollama,
    dataDir: DATA_DIR,
  });
});

// 既有 Final.md 清單（含 AI-Study-Council 過去產出的），供「從既有 Final 建立教材包」。
app.get('/api/catalog', (req, res) => {
  res.status(200).json(readCatalog());
});

function finalPathFor(filename) {
  const base = path.basename(String(filename || ''));
  if (!base.endsWith('_Final.md')) throw new Error('只接受 *_Final.md 檔案');
  const candidates = [OUTPUTS_DIR, PLATFORM_DIST_DIR].map((dir) => assertInsideDir(dir, path.join(dir, base)));
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error(`找不到 ${base}`);
  return found;
}

app.get('/api/finals/:filename', (req, res) => {
  try {
    const p = finalPathFor(req.params.filename);
    return res.status(200).json({ filename: path.basename(p), content: fs.readFileSync(p, 'utf8') });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

// 2026-10-04：在上傳頁的預覽中修正 Final.md（例如章節判讀錯誤）後存回原檔。
// 第一次修改前把引擎產出的原始版本保留為 <檔名>.orig，之後的修改都不覆蓋它。
app.put('/api/finals/:filename', (req, res) => {
  let p;
  try {
    p = finalPathFor(req.params.filename);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
  const content = req.body && req.body.content;
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Final.md 內容不可為空白' });
  }
  const backup = `${p}.orig`;
  if (!fs.existsSync(backup)) fs.copyFileSync(p, backup);
  fs.writeFileSync(p, content, 'utf8');
  return res.status(200).json({ filename: path.basename(p), content, backup: path.basename(backup) });
});

function uploadSessionFiles(sessionId) {
  if (!sessionId) return [];
  if (!/^[0-9a-f-]{36}$/.test(String(sessionId))) throw new Error('不合法的上傳批次代碼');
  const dir = assertInsideDir(UPLOAD_SESSIONS_DIR, path.join(UPLOAD_SESSIONS_DIR, sessionId));
  if (!fs.existsSync(dir)) throw new Error('找不到這次上傳的原始檔（可能已被清除），請重新上傳');
  return fs.readdirSync(dir).map((name) => ({ name, path: path.join(dir, name) }));
}

// 建立教材包「草稿」：只會新增一個全新的 tm_N 資料夾（manifest.status = draft，
// 學生端看不到），絕不覆寫或修改任何既有教材包。
app.post('/api/platform/drafts', (req, res) => {
  const body = req.body || {};
  try {
    const finalPath = finalPathFor(body.finalFilename);
    const adjudicationPath = `${finalPath}.adjudication.json`;
    const draft = packageBuilder.createDraft({
      finalFilename: path.basename(finalPath),
      finalMarkdown: fs.readFileSync(finalPath, 'utf8'),
      extraSourceFiles: [
        ...(fs.existsSync(adjudicationPath) ? [{ name: path.basename(adjudicationPath), path: adjudicationPath }] : []),
        ...uploadSessionFiles(body.uploadSessionId),
      ],
      metadata: body.metadata || {},
    });
    return res.status(201).json(draft);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/platform/drafts', (req, res) => {
  res.status(200).json({ drafts: packageBuilder.listDrafts() });
});

app.get('/api/platform/drafts/:materialId', (req, res) => {
  try {
    return res.status(200).json(packageBuilder.getDraft(req.params.materialId));
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

app.post('/api/platform/drafts/:materialId/publish', (req, res) => {
  let result;
  try {
    result = packageBuilder.publish(req.params.materialId, { confirmExisting: req.body?.confirmExisting === true });
  } catch (error) {
    // 409：平台上已有同章教材，需管理者確認後帶 confirmExisting 重送
    return res.status(error.code === 'EXISTING_MATERIAL' ? 409 : 400).json({ error: error.message });
  }
  // 發布已完成；接著排隊由主機的推送程式 commit + push（見 platform/GitPublishQueue.js）。
  // 排隊失敗不影響發布本身，回報給上傳頁即可。
  try {
    result.gitJobId = gitPublishQueue.enqueue(result.materialId || req.params.materialId, result.changedPaths);
    result.gitPublisherAlive = gitPublishQueue.publisherAlive();
  } catch (error) {
    result.gitQueueError = error.message;
  }
  return res.status(200).json(result);
});

app.get('/api/platform/git-jobs/:jobId', (req, res) => {
  try {
    return res.status(200).json(gitPublishQueue.status(req.params.jobId));
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

app.delete('/api/platform/drafts/:materialId', (req, res) => {
  try {
    return res.status(200).json(packageBuilder.deleteDraft(req.params.materialId));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// 為既有教材加題（2026-10-01）：產生出題／作答 Prompt、核對貼回來的結果，最後建立一份
// 「補充題庫」草稿（新的 tm_N，原教材不修改），之後沿用上面的草稿預覽／發布／刪除端點。
function supplementRoute(handler) {
  return (req, res) => {
    try {
      return res.status(200).json(handler(req.body || {}));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };
}

app.get('/api/platform/supplements/parents', (req, res) => {
  res.status(200).json({ materials: packageBuilder.supplements.listParents() });
});
app.post('/api/platform/supplements/author-prompt', supplementRoute((b) => packageBuilder.supplements.authorPrompt(b)));
app.post('/api/platform/supplements/solver-prompt', supplementRoute((b) => packageBuilder.supplements.solverPrompt(b)));
app.post('/api/platform/supplements/check', supplementRoute((b) => packageBuilder.supplements.check(b)));
app.post('/api/platform/supplements/drafts', (req, res) => {
  try {
    return res.status(201).json(packageBuilder.createSupplementDraft(req.body || {}));
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// 學習平台本身（含 upload.html）：以 http://localhost:3000/upload.html 開啟時與 API 同源，
// 不受瀏覽器跨來源／混合內容限制。dotfiles 預設忽略（.git 不會被提供）。
app.use(express.static(PLATFORM_ROOT, { dotfiles: 'ignore', index: 'index.html' }));
// 缺少的 .js（例如刻意不存在的 js/data/SupabaseConfig.local.js）比照 GitHub Pages 回一般 404，
// 不回 express 預設的 HTML 錯誤頁（瀏覽器會因 MIME 不符額外報錯）。
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.endsWith('.js')) {
    return res.status(404).type('application/javascript').send('');
  }
  return next();
});

app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message || '上傳失敗' });
  }
  return next();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI Study Council Agent listening on port ${PORT}`);
  });
}

module.exports = {
  app,
  generateStudyMarkdown,
  generateCouncilMarkdown,
  extractTextFromFile,
  extractTextFromFiles,
  countMeaningfulChars,
  PDF_MEANINGFUL_CHAR_THRESHOLD,
  runMinerU,
  isMineruWatcherAlive,
  MINERU_INPUTS_DIR,
  MINERU_OUTPUTS_QUEUE_DIR,
  runTriCouncil,
  assembleCouncilFinal,
  readCatalog,
  CATALOG_PATH,
  PLATFORM_DIST_DIR,
  MINERU_OUTPUTS_DIR,
  OUTPUTS_DIR,
  UPLOADS_DIR,
  UPLOAD_SESSIONS_DIR,
  DATA_DIR,
  PLATFORM_ROOT,
  packageBuilder,
  FINAL_BACKUP_DIR,
  buildMaterialId,
  safeSlug,
  assertInsideDir,
};
