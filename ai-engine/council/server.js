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
  checkSourcePlausibility,
  assembleCouncilFinal,
  generateCouncilMarkdown,
  DEFAULT_ADJUDICATION_TIMEOUT_MS,
} = require('./services/multiAi');

const { createPackageBuilder } = require('./platform/PackageBuilder');
const { createGitPublishQueue } = require('./platform/GitPublishQueue');
const { createWrongBookNotesJob } = require('./platform/WrongBookNotesJob');
const practiceAdjudicator = require('./services/practiceAdjudicator');
const ocrHelp = require('./services/ocrHelp');
const localWriter = require('./services/localWriter');
const draftReview = require('./services/draftReview');
const figureCards = require('./services/figureCards');
const figureRecheck = require('./services/figureRecheck');
const pdfTextQuality = require('./services/pdfTextQuality');
const mineruContentList = require('./services/mineruContentList');
const pageQuality = require('./services/pageQuality');
const goldSet = require('./services/goldSet');
const { computeStats } = require('./services/adjudicationStats');
const { parseFrontmatter } = require('./platform/FinalParser');

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
const wrongBookNotesJob = createWrongBookNotesJob({ dataDir: DATA_DIR });

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
// 2026-11-21：逾時改為「基礎逾時＋每頁加時」取較大者，兩個值都可用環境變數覆寫（毫秒）；
// 無法判斷頁數時（圖片＝1 頁）只用基礎逾時。
function positiveIntFromEnv(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
// 2026-11-18 AHS-UP2 P1-0b：實測 CPU 上 9 頁數學 PDF（含 368 組公式辨識）約 7 分鐘，24 頁預估約 20 分鐘，
// 第一次執行還要下載模型；5 分鐘會讓多頁 PDF 逾時後靜默退回文字層。預設基礎逾時 60 分鐘，可用 MINERU_POLL_TIMEOUT_MS 覆寫。
const MINERU_POLL_TIMEOUT_MS = positiveIntFromEnv('MINERU_POLL_TIMEOUT_MS', 60 * 60 * 1000);
const MINERU_PER_PAGE_TIMEOUT_MS = positiveIntFromEnv('MINERU_PER_PAGE_TIMEOUT_MS', 60 * 1000);
const MINERU_POLL_INTERVAL_MS = 2000;

function mineruTimeoutMs(pageCount, baseMs = MINERU_POLL_TIMEOUT_MS, perPageMs = MINERU_PER_PAGE_TIMEOUT_MS) {
  const pages = Number.isFinite(pageCount) && pageCount > 0 ? Math.floor(pageCount) : 0;
  return Math.max(baseMs, pages * perPageMs);
}

// mineru CLI 的進度條會寫進 job 目錄的 mineru.log（例如 "Layout Predict: 40%|...| 4/10"）。
// 取最後一個「n/m」當作目前進度；解析不到就回 null（進度只是顯示用，不影響結果）。
function readMineruProgress(jobOutputDir) {
  try {
    const log = fs.readFileSync(path.join(jobOutputDir, 'mineru.log'), 'utf8').slice(-4000);
    const matches = [...log.matchAll(/(\d+)\s*\/\s*(\d+)/g)].filter((m) => Number(m[2]) > 0 && Number(m[1]) <= Number(m[2]));
    if (matches.length === 0) return null;
    const last = matches[matches.length - 1];
    return { current: Number(last[1]), total: Number(last[2]) };
  } catch {
    return null;
  }
}

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
  const pollTimeoutMs = options.pollTimeoutMs ?? mineruTimeoutMs(options.pageCount);

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
      // 2026-11-16 B1：MinerU 切出的圖（ocr/images/*）交給呼叫端收集，否則只留在 job 目錄、平台用不到。
      if (Array.isArray(options.images)) {
        const imgDir = path.join(jobOutputDir, 'ocr', 'images');
        listImageFiles(imgDir).forEach((name) => options.images.push(path.join(imgDir, name)));
      }
      // 2026-11-21：保留 MinerU 的結構化輸出（逐頁區塊、表格、公式、座標），供逐頁預覽與校正使用。
      if (options.structured && typeof options.structured === 'object') {
        const contentListPath = path.join(jobOutputDir, 'ocr', `${jobId}_content_list.json`);
        const middlePath = path.join(jobOutputDir, 'ocr', `${jobId}_middle.json`);
        if (fs.existsSync(contentListPath)) options.structured.contentListPath = contentListPath;
        if (fs.existsSync(middlePath)) options.structured.middlePath = middlePath;
      }
      if (typeof options.onProgress === 'function') options.onProgress({ stage: 'done' });
      // 2026-11-18 AHS-UP2 P1-1：content_list.json 分流（LaTeX／HTML 表格／切圖＋頁碼），失敗不影響文字結果。
      if (Array.isArray(options.blocks)) {
        try {
          const cjPath = path.join(jobOutputDir, 'ocr', `${jobId}_content_list.json`);
          if (fs.existsSync(cjPath)) {
            const raw = JSON.parse(fs.readFileSync(cjPath, 'utf8'));
            // 2026-11-18 AHS-UP2 P1-5：品質閘——逐頁可信度，低信心頁才需要管理者提供原檔。
            options.blocks.push({ ...mineruContentList.splitContentList(raw), quality: pageQuality.assessPages(raw) });
          }
        } catch (error) {
          console.warn(`content_list.json 解析失敗（略過結構化分流）：${error.message}`);
        }
      }
      return fs.readFileSync(mdPath, 'utf8');
    }
    if (typeof options.onProgress === 'function') {
      options.onProgress({ stage: 'ocr', ...(readMineruProgress(jobOutputDir) || {}) });
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

async function extractTextFromFile(filePath, opts = {}) {
  const ext = path.extname(filePath).toLowerCase();
  // opts：images（收集切圖）、structured（收集 content_list／middle 路徑）、onProgress（進度回報）。
  const mineruOpts = (extra = {}) => ({ images: opts.images, blocks: opts.blocks, structured: opts.structured, onProgress: opts.onProgress, ...extra });

  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(filePath, 'utf8');
  }

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();

      if (countMeaningfulChars(result.text) >= PDF_MEANINGFUL_CHAR_THRESHOLD) {
        // 2026-11-18 AHS-UP2 P1-0：有文字層不代表可信。掃描／拍照後的 PDF 常帶一層品質很差的 OCR 文字層
        // （公式亂碼、無圖片），過去完全不跑 MinerU。這裡先判斷文字層品質，亂碼徵兆明顯就改走 MinerU
        // （LaTeX＋切圖）；MinerU 失敗時退回「已把康熙部首轉成一般漢字」的文字層，而不是更差的 Tesseract。
        const quality = pdfTextQuality.assessTextLayer((result.pages || []).map((page) => page.text));
        if (!quality.useMinerU) {
          return pdfTextQuality.normalizeRadicals(result.text);
        }
        console.warn(`PDF 文字層品質可疑，改走 MinerU：${quality.reasons.join('；')}`);
        try {
          return await runMinerU(filePath, ext, mineruOpts({ pageCount: result.total }));
        } catch (error) {
          console.warn(`MinerU 解析失敗，沿用 PDF 文字層（品質可疑，公式可能亂碼）：${error.message}`);
          return pdfTextQuality.normalizeRadicals(result.text);
        }
      }

      try {
        return await runMinerU(filePath, ext, mineruOpts({ pageCount: result.total }));
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
      return await runMinerU(filePath, ext, mineruOpts({ pageCount: 1 }));
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
    `ai_team: ${meta.team ?? '本機模型 A + 本機模型 B'}`,
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
    `產出 AI 團隊：${meta.team ?? '本機模型 A + 本機模型 B'}`,
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
    `Phase 1 獨立初稿自評：本機模型 A ${phase1Scores.LocalA ?? 'N/A'}/100；本機模型 B ${phase1Scores.LocalB ?? 'N/A'}/100`,
    'Phase 2 交叉比對修訂：LocalA-Revised；LocalB-Revised',
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
  // 2026-11-26 AHS-A3：兩份初稿都由本機模型撰寫（localA、localB）。舊前端／舊資料的 chatgpt、claude 欄位依序對應 A、B，Gemini 不再使用。
  const localA = drafts?.localA ?? drafts?.chatgpt;
  const localB = drafts?.localB ?? drafts?.claude;

  if (!school || !grade || !subject || !unit || !category) {
    return { error: 'school, grade, subject, unit, category 為必填欄位' };
  }
  if (!localA?.trim() || !localB?.trim()) {
    return { error: '請提供本機模型 A、B 兩份初稿內容' };
  }

  return {
    metadata: { school, grade, subject, unit, category },
    drafts: { localA, localB },
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

  const council = await assembleCouncilFinal(metadata, drafts, ocrHelp.stripMarkers(sourceText), { timeoutMs, sourceRef, sourceId, runId });
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
  // 2026-10-06：保存這次的初稿（2026-11-26 起為本機模型 A、B 兩份）。審議結果不理想或題目遺失時，可在上傳頁
  // 「使用既有的 Final.md」直接載回初稿重跑，不必重新產生；建立教材包時也一併放進 source/。
  fs.writeFileSync(path.join(OUTPUTS_DIR, `${filename}.drafts.json`), JSON.stringify({
    savedAt: new Date().toISOString(), runId, metadata, sourceRef: sourceRef || null, drafts,
    // 2026-10-14：一併保存教材本文，標準答案集（goldSet）記錄裁決時需要當時的本文快照。
    sourceText: ocrHelp.stripMarkers(sourceText),
  }, null, 2), 'utf8');

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

// 2026-11-17 A13 圖卡：只把該教材的 MinerU 切圖送給本機視覺模型（OLLAMA_VISION_URL），
// 結果存 mineru_outputs/<id>/figure_cards.json，供出題 Prompt 帶「圖卡文字」而非原圖。
// GET 讀已存的圖卡；POST 產生（body.force=true 才重做已有的圖；單張失敗只標記該張）。
function figureCardsFile(materialId) {
  const imagesDir = assertInsideDir(MINERU_OUTPUTS_DIR, path.join(MINERU_OUTPUTS_DIR, materialId, 'images'));
  return { imagesDir, cardsPath: path.join(MINERU_OUTPUTS_DIR, materialId, 'figure_cards.json') };
}

function readFigureCards(cardsPath) {
  try {
    return JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
  } catch {
    return { cards: [] };
  }
}

app.get('/api/materials/:id/figure-cards', (req, res) => {
  const materialId = safeSlug(req.params.id);
  let paths;
  try {
    paths = figureCardsFile(materialId);
  } catch {
    return res.status(400).json({ error: '不合法的教材識別碼' });
  }
  const saved = readFigureCards(paths.cardsPath);
  return res.status(200).json({ materialId, count: saved.cards.length, cards: saved.cards });
});

app.post('/api/materials/:id/figure-cards', express.json(), async (req, res) => {
  const materialId = safeSlug(req.params.id);
  let paths;
  try {
    paths = figureCardsFile(materialId);
  } catch {
    return res.status(400).json({ error: '不合法的教材識別碼' });
  }
  const files = listImageFiles(paths.imagesDir);
  if (files.length === 0) {
    return res.status(404).json({ error: '此教材尚無解析後的切圖，無法產生圖卡' });
  }
  const force = !!(req.body && req.body.force);
  const saved = readFigureCards(paths.cardsPath);
  const done = new Map(saved.cards.filter((c) => c.description && !c.error).map((c) => [c.filename, c]));
  const todo = force ? files : files.filter((f) => !done.has(f));
  const fresh = await figureCards.buildFigureCards(paths.imagesDir, todo, { fetchImpl: figureCards.fetchImpl });
  const byName = new Map(fresh.map((c) => [c.filename, c]));
  const cards = files.map((f) => byName.get(f) || done.get(f));
  fs.mkdirSync(path.dirname(paths.cardsPath), { recursive: true });
  fs.writeFileSync(paths.cardsPath, JSON.stringify({ generatedAt: new Date().toISOString(), cards }, null, 2));
  const failed = cards.filter((c) => c.error).length;
  const unreadable = cards.filter((c) => c.unreadable).length;
  return res.status(200).json({ materialId, count: cards.length, generated: todo.length, failed, unreadable, cards });
});

// 多檔案上傳：依原始檔名排序後逐一解析文字，再依序合併成單一教材本文。
// .md/.txt 直接讀取內文；.pdf/圖片交由 extractTextFromFile 解析（PDF 文字擷取 / OCR），
// 各檔案間以空行分隔，藉此在合併結果中保留頁面／檔案邊界。
async function extractTextFromFiles(files, opts = {}) {
  const sorted = [...files].sort((a, b) => a.originalname.localeCompare(b.originalname, 'zh-Hant'));
  const parts = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const file = sorted[i];
    const structured = {};
    if (typeof opts.onProgress === 'function') opts.onProgress({ file: i + 1, fileCount: sorted.length, filename: file.originalname });
    const onProgress = typeof opts.onProgress === 'function'
      ? (info) => opts.onProgress({ file: i + 1, fileCount: sorted.length, filename: file.originalname, ...info })
      : undefined;
    // eslint-disable-next-line no-await-in-loop
    const text = await extractTextFromFile(file.path, { ...opts, structured, onProgress });
    parts.push({ filename: file.originalname, text, structured: structured.contentListPath ? structured : null });
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
function keepOriginals(files, savedNames) {
  const sessionId = crypto.randomUUID();
  const sessionDir = assertInsideDir(UPLOAD_SESSIONS_DIR, path.join(UPLOAD_SESSIONS_DIR, sessionId));
  fs.mkdirSync(sessionDir, { recursive: true });
  const used = new Set();
  files.forEach((file) => {
    let name = path.basename(decodeOriginalName(file.originalname)) || `file${path.extname(file.path)}`;
    while (used.has(name)) name = `_${name}`;
    used.add(name);
    fs.copyFileSync(file.path, assertInsideDir(sessionDir, path.join(sessionDir, name)));
    if (Array.isArray(savedNames)) savedNames.push({ originalname: file.originalname, saved: name });
  });
  return sessionId;
}

// ---- 2026-11-21 MinerU 結構化輸出、逐頁預覽與上傳進度 --------------------------------

const PROGRESS_ID_PATTERN = /^[\w-]{8,64}$/;
const PROGRESS_TTL_MS = 10 * 60 * 1000;
const uploadProgress = new Map();

function setUploadProgress(id, info) {
  if (!id) return;
  uploadProgress.set(id, { ...(uploadProgress.get(id) || {}), ...info, updatedAt: Date.now() });
  for (const [key, value] of uploadProgress) {
    if (Date.now() - value.updatedAt > PROGRESS_TTL_MS) uploadProgress.delete(key);
  }
}

// MinerU content_list.json：每個區塊帶 page_idx（從 0 起算）。轉成「第 n 頁有哪些區塊」供前端逐頁對照。
function contentListToPages(list) {
  const pages = new Map();
  (Array.isArray(list) ? list : []).forEach((item) => {
    const index = Number.isInteger(item && item.page_idx) ? item.page_idx : 0;
    if (!pages.has(index)) pages.set(index, []);
    const type = item.type || 'text';
    const text = type === 'table'
      ? String(item.table_body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : String(item.text || '');
    pages.get(index).push({
      type,
      text,
      level: item.text_level || 0,
      image: type === 'image' ? String(item.img_path || '') : undefined,
    });
  });
  return [...pages.keys()].sort((a, b) => a - b).map((index) => ({ page: index + 1, blocks: pages.get(index) }));
}

// 把本次上傳每個檔案的 MinerU 結構化輸出收進 mineru_outputs/<sessionId>/structured/，並寫 index.json。
function saveStructuredOutputs(sessionId, parts, savedNames) {
  const entries = [];
  const dir = path.join(MINERU_OUTPUTS_DIR, sessionId, 'structured');
  parts.forEach((part, order) => {
    if (!part.structured || !part.structured.contentListPath) return;
    const match = savedNames.find((n) => n.originalname === part.filename);
    const baseName = `${String(order + 1).padStart(2, '0')}_${safeSlug(path.basename(part.filename, path.extname(part.filename)))}`;
    fs.mkdirSync(dir, { recursive: true });
    const entry = { index: entries.length, filename: part.filename, saved: match ? match.saved : part.filename, contentList: `${baseName}.content_list.json` };
    fs.copyFileSync(part.structured.contentListPath, path.join(dir, entry.contentList));
    if (part.structured.middlePath) {
      entry.middle = `${baseName}.middle.json`;
      fs.copyFileSync(part.structured.middlePath, path.join(dir, entry.middle));
    }
    entries.push(entry);
  });
  if (entries.length) fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ files: entries }, null, 2));
  return entries.length;
}

function readStructuredIndex(sessionId) {
  const dir = assertInsideDir(MINERU_OUTPUTS_DIR, path.join(MINERU_OUTPUTS_DIR, safeSlug(String(sessionId)), 'structured'));
  try {
    return { dir, files: JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')).files || [] };
  } catch {
    return { dir, files: [] };
  }
}

app.get('/api/upload/progress/:id', (req, res) => {
  if (!PROGRESS_ID_PATTERN.test(req.params.id)) return res.status(400).json({ error: '進度識別碼格式不正確' });
  const info = uploadProgress.get(req.params.id);
  if (!info) return res.status(404).json({ error: '找不到這個上傳的進度' });
  return res.status(200).json(info);
});

// 逐頁資料：每個檔案的頁面區塊（文字、公式、表格、圖片）。沒有 MinerU 結構化輸出時回空陣列。
app.get('/api/uploads/:sessionId/pages', (req, res) => {
  const { dir, files } = readStructuredIndex(req.params.sessionId);
  const result = files.map((entry) => {
    let pages = [];
    try {
      pages = contentListToPages(JSON.parse(fs.readFileSync(path.join(dir, entry.contentList), 'utf8')));
    } catch {
      pages = [];
    }
    return { index: entry.index, filename: entry.filename, pageCount: pages.length, pages };
  });
  return res.status(200).json({ sessionId: req.params.sessionId, files: result });
});

// 下載 MinerU 原始結構化 JSON（kind=content_list｜middle）。
app.get('/api/uploads/:sessionId/files/:index/structured/:kind', (req, res) => {
  const { dir, files } = readStructuredIndex(req.params.sessionId);
  const entry = files.find((f) => String(f.index) === req.params.index);
  const name = entry && (req.params.kind === 'middle' ? entry.middle : req.params.kind === 'content_list' ? entry.contentList : null);
  if (!name) return res.status(404).json({ error: '找不到這份結構化輸出' });
  return res.status(200).sendFile(assertInsideDir(dir, path.join(dir, name)));
});

// 該檔案第 n 頁的原圖：PDF 即時渲染成 PNG，圖片檔直接回傳。
app.get('/api/uploads/:sessionId/files/:index/pages/:page/image', async (req, res) => {
  const { files } = readStructuredIndex(req.params.sessionId);
  const entry = files.find((f) => String(f.index) === req.params.index);
  const page = Number.parseInt(req.params.page, 10);
  if (!entry || !Number.isInteger(page) || page < 1) return res.status(404).json({ error: '找不到這一頁' });
  let originalPath;
  try {
    const sessionDir = assertInsideDir(UPLOAD_SESSIONS_DIR, path.join(UPLOAD_SESSIONS_DIR, safeSlug(String(req.params.sessionId))));
    originalPath = assertInsideDir(sessionDir, path.join(sessionDir, entry.saved));
  } catch {
    return res.status(404).json({ error: '找不到原始檔' });
  }
  if (!fs.existsSync(originalPath)) return res.status(404).json({ error: '找不到原始檔' });
  if (path.extname(originalPath).toLowerCase() !== '.pdf') return res.status(200).sendFile(originalPath);
  const parser = new PDFParse({ data: fs.readFileSync(originalPath) });
  try {
    const shot = await parser.getScreenshot({ partial: [page], imageBuffer: true });
    if (!shot.pages.length) return res.status(404).json({ error: '找不到這一頁' });
    res.set('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(shot.pages[0].data));
  } catch (error) {
    return res.status(500).json({ error: `頁面渲染失敗：${error.message}` });
  } finally {
    await parser.destroy();
  }
});

// ---- 2026-11-21 MinerU 漏圖補查（本機視覺模型，說明見 services/figureRecheck.js）---------------------

const recheckRunning = new Set();

function mineruImageCountsByPage(contentListPath) {
  const counts = new Map();
  try {
    JSON.parse(fs.readFileSync(contentListPath, 'utf8')).forEach((item) => {
      if (item && item.type === 'image' && Number.isInteger(item.page_idx)) {
        counts.set(item.page_idx + 1, (counts.get(item.page_idx + 1) || 0) + 1);
      }
    });
  } catch {
    // 讀不到 content_list 就當作每頁 0 張（補查結果仍可參考）
  }
  return counts;
}

async function runFigureRecheck(sessionId, progressId) {
  const { dir, files } = readStructuredIndex(sessionId);
  const sessionDir = assertInsideDir(UPLOAD_SESSIONS_DIR, path.join(UPLOAD_SESSIONS_DIR, safeSlug(String(sessionId))));
  const options = { fetchImpl: figureRecheck.fetchImpl };
  const resultFiles = [];
  for (let i = 0; i < files.length; i += 1) {
    const entry = files[i];
    const originalPath = assertInsideDir(sessionDir, path.join(sessionDir, entry.saved));
    const counts = mineruImageCountsByPage(path.join(dir, entry.contentList));
    const progress = (current, total) => setUploadProgress(progressId, { stage: 'recheck', file: i + 1, fileCount: files.length, filename: entry.filename, current, total });
    const pages = [];
    if (path.extname(originalPath).toLowerCase() === '.pdf') {
      const parser = new PDFParse({ data: fs.readFileSync(originalPath) });
      try {
        let total = 1;
        for (let page = 1; page <= total; page += 1) {
          // 逐頁渲染（高解析，約 2.5 倍），避免一次把整份 PDF 的圖留在記憶體。
          // eslint-disable-next-line no-await-in-loop
          const shot = await parser.getScreenshot({ partial: [page], imageBuffer: true, scale: 2.5 });
          total = shot.total || total;
          progress(page, total);
          if (!shot.pages.length) break;
          // eslint-disable-next-line no-await-in-loop
          const [result] = await figureRecheck.recheckPages([{ page, mineruCount: counts.get(page) || 0, buffer: Buffer.from(shot.pages[0].data) }], options);
          pages.push(result);
        }
      } finally {
        await parser.destroy();
      }
    } else {
      progress(1, 1);
      const [result] = await figureRecheck.recheckPages([{ page: 1, mineruCount: counts.get(1) || 0, buffer: fs.readFileSync(originalPath) }], options);
      pages.push(result);
    }
    resultFiles.push({ index: entry.index, filename: entry.filename, pages });
  }
  const result = { generatedAt: new Date().toISOString(), model: figureRecheck.visionModel(), files: resultFiles };
  fs.writeFileSync(path.join(dir, 'recheck.json'), JSON.stringify(result, null, 2));
  return result;
}

// 背景執行（每頁數十秒，整份可能數分鐘）：回 202，進度用 GET /api/upload/progress/:progressId，結果用 GET .../recheck。
app.post('/api/uploads/:sessionId/recheck', (req, res) => {
  const { files } = readStructuredIndex(req.params.sessionId);
  if (!files.length) return res.status(404).json({ error: '這次上傳沒有 MinerU 逐頁資料，無法補查' });
  if (recheckRunning.has(req.params.sessionId)) return res.status(409).json({ error: '這次上傳的補查正在進行中' });
  const progressId = PROGRESS_ID_PATTERN.test(String(req.query.progressId || '')) ? String(req.query.progressId) : null;
  recheckRunning.add(req.params.sessionId);
  setUploadProgress(progressId, { stage: 'recheck' });
  runFigureRecheck(req.params.sessionId, progressId)
    .then(() => setUploadProgress(progressId, { stage: 'finished' }))
    .catch((error) => {
      console.warn(`漏圖補查失敗：${error.message}`);
      setUploadProgress(progressId, { stage: 'error', error: String(error.message || error) });
    })
    .finally(() => recheckRunning.delete(req.params.sessionId));
  return res.status(202).json({ started: true });
});

app.get('/api/uploads/:sessionId/recheck', (req, res) => {
  const { dir } = readStructuredIndex(req.params.sessionId);
  let result = { files: [] };
  try {
    result = JSON.parse(fs.readFileSync(path.join(dir, 'recheck.json'), 'utf8'));
  } catch {
    result = { files: [] };
  }
  return res.status(200).json({ running: recheckRunning.has(req.params.sessionId), ...result });
});

app.post('/api/upload', upload.array('files'), async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: '請選擇要上傳的檔案' });
  }

  // 前端帶 ?progressId=<id> 時，解析期間可輪詢 GET /api/upload/progress/<id> 取得進度。
  const progressId = PROGRESS_ID_PATTERN.test(String(req.query.progressId || '')) ? String(req.query.progressId) : null;

  try {
    files.forEach((file) => { file.originalname = decodeOriginalName(file.originalname); });
    const minerImages = [];
    const minerBlocks = [];
    setUploadProgress(progressId, { stage: 'start', fileCount: files.length });
    const parts = await extractTextFromFiles(files, {
      images: minerImages,
      blocks: minerBlocks,
      onProgress: progressId ? (info) => setUploadProgress(progressId, info) : undefined,
    });
    // 2026-10-14：多個檔案時每段前加上檔案標記，原文辨識協助包才能把可疑文字對回是哪張照片。
    const mergedText = parts.length > 1
      ? parts.map((part) => `${ocrHelp.fileMarker(part.filename)}\n${part.text}`).join('\n\n')
      : parts.map((part) => part.text).join('\n\n');
    const savedNames = [];
    const sessionId = keepOriginals(files, savedNames);
    const structuredCount = saveStructuredOutputs(sessionId, parts, savedNames);
    setUploadProgress(progressId, { stage: 'finished' });
    // 2026-11-16 B1：MinerU 切圖保存到 mineru_outputs/<sessionId>/images/（檔名不變，與本文的 ![](images/檔名) 一致），
    // 供「下載本教材圖片 zip」與建立草稿時【圖：檔名】的附圖來源。
    const imagesDir = path.join(MINERU_OUTPUTS_DIR, sessionId, 'images');
    if (minerImages.length) fs.mkdirSync(imagesDir, { recursive: true });
    minerImages.forEach((p) => fs.copyFileSync(p, path.join(imagesDir, path.basename(p))));
    // 2026-11-18 AHS-UP2 P1-1：結構化分流結果（LaTeX／表格／切圖＋頁碼）存 mineru_outputs/<sessionId>/content_blocks.json。
    if (minerBlocks.length) fs.writeFileSync(path.join(MINERU_OUTPUTS_DIR, sessionId, 'content_blocks.json'), JSON.stringify({ generatedAt: new Date().toISOString(), files: minerBlocks }, null, 2));
    return res.status(200).json({
      text: mergedText,
      sessionId,
      imagesId: sessionId,
      imageCount: minerImages.length,
      structuredCount,
      pageQuality: {
        lowPages: minerBlocks.flatMap((b) => b.quality.lowPages),
        suspectPages: minerBlocks.flatMap((b) => b.quality.suspectPages),
        totalPages: minerBlocks.reduce((n, b) => n + b.quality.totalPages, 0),
      },
      blockCounts: minerBlocks.reduce((a, b) => ({ equations: a.equations + b.counts.equations, tables: a.tables + b.counts.tables, images: a.images + b.counts.images }), { equations: 0, tables: 0, images: 0 }),
      files: parts.map((part) => ({ filename: part.filename, length: part.text.length })),
    });
  } catch (error) {
    setUploadProgress(progressId, { stage: 'error' });
    return res.status(500).json({ error: `檔案解析失敗：${error.message}` });
  } finally {
    files.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
});

// 2026-10-14 原文辨識協助包：找出 OCR 看不清楚的照片。2026-11-26 AHS-A3 起由本機視覺模型轉錄（POST /api/local-ai/jobs kind=transcribe），不再交給網頁版 AI。
// 單一檔案上傳的教材本文沒有檔案標記，此時以 filename 當作整份本文的檔名。
function withFileMarker(sourceText, filename) {
  const text = String(sourceText || '');
  return filename && !ocrHelp.segmentsOf(text)[0].file ? `${ocrHelp.fileMarker(filename)}\n${text}` : text;
}

app.post('/api/ocr-help/check', async (req, res) => {
  const { sourceText, filename } = req.body || {};
  if (!sourceText || !String(sourceText).trim()) return res.status(400).json({ error: '缺少教材本文' });
  const text = withFileMarker(sourceText, filename);
  try {
    const plausibility = await checkSourcePlausibility(ocrHelp.stripMarkers(text));
    const pack = ocrHelp.buildHelpPack(text, plausibility.suspiciousSpans);
    return res.status(200).json({ checked: plausibility.checked !== false, reason: plausibility.reason || null, ...pack });
  } catch (error) {
    return res.status(500).json({ error: `原文合理性檢查失敗：${error.message}` });
  }
});

// 本機視覺模型的轉錄（local；舊前端的 gpt／gemini／claude 欄位仍接受）與 OCR 逐句比對，回傳更正後的教材本文與待選定的衝突。
app.post('/api/ocr-help/merge', (req, res) => {
  const { sourceText, filename } = req.body || {};
  const local = req.body?.local || req.body?.gpt || '';
  const second = req.body?.second || req.body?.claude || req.body?.gemini || '';
  if (!sourceText || (!local && !second)) return res.status(400).json({ error: '需要教材本文與至少一份轉錄' });
  const text = withFileMarker(sourceText, filename);
  const result = ocrHelp.mergeTranscriptions(text, local, second);
  if (text !== String(sourceText)) result.text = ocrHelp.stripMarkers(result.text);
  return res.status(200).json(result);
});

// ---- 2026-11-26 AHS-A3 本機模型工作（services/localWriter.js）--------------------------------------
// 全部走本機 Ollama，不呼叫任何外部 AI。一次只跑一個工作（本機只能載入一個模型），其餘排隊。
//   kind=drafts      { prompt }               本機模型 A、B 各寫一份初稿 → { localA, localB, models }
//   kind=author      { prompt }               補題：本機模型 A 出題 → { text, model }
//   kind=solve       { prompt }               補題：本機模型 B 獨立作答 → { text, model }
//   kind=transcribe  { sessionId, files[] }   原文辨識協助包：本機視覺模型轉錄 → { text, failed, model }
const localJobs = new Map();
let localQueue = Promise.resolve();

function transcribePagesFor(sessionId, files) {
  const sessionDir = assertInsideDir(UPLOAD_SESSIONS_DIR, path.join(UPLOAD_SESSIONS_DIR, safeSlug(String(sessionId))));
  return files.map((name) => {
    const p = assertInsideDir(sessionDir, path.join(sessionDir, path.basename(String(name))));
    if (!fs.existsSync(p)) throw new Error(`找不到上傳的原始檔：${name}`);
    if (!/\.(png|jpe?g|webp|bmp|gif)$/i.test(p)) throw new Error(`本機轉錄只支援照片檔：${name}`);
    return { name: path.basename(String(name)), buffer: fs.readFileSync(p) };
  });
}

async function runLocalJob(job, body) {
  if (body.kind === 'drafts') {
    job.step = 'A';
    const a = await localWriter.writeDraft(body.prompt, 'A');
    job.step = 'B';
    const b = await localWriter.writeDraft(body.prompt, 'B');
    return { localA: a.text, localB: b.text, models: { localA: a.model, localB: b.model } };
  }
  if (body.kind === 'author') return localWriter.writeDraft(body.prompt, 'A');
  if (body.kind === 'solve') return localWriter.writeDraft(body.prompt, 'B');
  return localWriter.transcribe(transcribePagesFor(body.sessionId, body.files), {
    onProgress: (done, total) => { job.step = `${done}/${total}`; },
  });
}

app.post('/api/local-ai/jobs', (req, res) => {
  const body = req.body || {};
  if (['drafts', 'author', 'solve'].indexOf(body.kind) >= 0 && !String(body.prompt || '').trim()) return res.status(400).json({ error: '缺少 Prompt' });
  if (body.kind === 'transcribe') {
    if (!body.sessionId || !Array.isArray(body.files) || !body.files.length) return res.status(400).json({ error: '缺少上傳識別碼或要轉錄的檔名' });
    try { transcribePagesFor(body.sessionId, body.files); } catch (error) { return res.status(400).json({ error: error.message }); }
  } else if (['drafts', 'author', 'solve'].indexOf(body.kind) < 0) {
    return res.status(400).json({ error: 'kind 必須是 drafts、author、solve 或 transcribe' });
  }
  const job = { jobId: crypto.randomUUID(), kind: body.kind, status: 'queued', step: null, createdAt: new Date().toISOString(), result: null, error: null };
  localJobs.set(job.jobId, job);
  localQueue = localQueue.then(async () => {
    job.status = 'running';
    try {
      job.result = await runLocalJob(job, body);
      job.status = 'completed';
    } catch (error) {
      job.error = error.message || String(error);
      job.status = 'failed';
    }
    job.updatedAt = new Date().toISOString();
  });
  return res.status(202).json({ jobId: job.jobId, status: job.status });
});

app.get('/api/local-ai/jobs/:jobId', (req, res) => {
  const job = localJobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'job 不存在' });
  return res.status(200).json(job);
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

// 2026-10-06：這份 Final.md 審議時保存的三方初稿（2026-10-06 以後跑的審議才有）。
app.get('/api/finals/:filename/drafts', (req, res) => {
  try {
    const p = `${finalPathFor(req.params.filename)}.drafts.json`;
    if (!fs.existsSync(p)) return res.status(404).json({ error: '這份 Final.md 沒有保存三方初稿（2026-10-06 以前的審議不會保存）' });
    return res.status(200).json(JSON.parse(fs.readFileSync(p, 'utf8')));
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

// 2026-10-12（審議改版第 1 階段）：練習題的「Claude 最終審查包」。
// 交叉審議時沒有通過自動裁決的練習題存在 <Final>.adjudication.json 的 practice.pending。
// GET 產生要貼到 Claude 網頁版的 Prompt；POST 貼回 Claude 的回覆後套用：正確、答案應為 X
// 收錄到 Final.md，刪除、無法判斷不收錄；沒有回覆到的題目留在待審。
function practiceRecordFor(filename) {
  const finalPath = finalPathFor(filename);
  const recordPath = assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, `${path.basename(finalPath)}.adjudication.json`));
  if (!fs.existsSync(recordPath)) throw new Error('這份 Final.md 沒有審議紀錄（adjudication.json）');
  const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  if (!record.practice && !record.claimReview) throw new Error('這份 Final.md 沒有自動裁決紀錄（2026-10-12 以前的審議，或審議未完成語意裁決）');
  return { finalPath, recordPath, record };
}

app.get('/api/finals/:filename/practice-review', (req, res) => {
  try {
    const { finalPath, record } = practiceRecordFor(req.params.filename);
    const { frontmatter } = parseFrontmatter(fs.readFileSync(finalPath, 'utf8'));
    const practice = record.practice || { total: 0, accepted: [], pending: [], resolved: [] };
    const pending = practice.pending || [];
    // 2026-10-13（第 2 階段）：沒有定論的陳述一併放進審查包（C1、C2…）。
    const claims = (record.claimReview && record.claimReview.pending) || [];
    return res.status(200).json({
      total: practice.total,
      accepted: (practice.accepted || []).length,
      pending: pending.map((p, i) => ({ id: `P${i + 1}`, question: p.question, reason: p.reason, origins: p.origins })),
      claims: claims.map((c, i) => ({ id: `C${i + 1}`, claim: c.claim, reason: c.reason, escalate: !!c.escalate })),
      resolved: practice.resolved || [],
      prompt: pending.length || claims.length ? practiceAdjudicator.buildClaudeReviewPrompt(frontmatter, pending, claims) : null,
    });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

app.post('/api/finals/:filename/practice-review', (req, res) => {
  let ctx;
  try {
    ctx = practiceRecordFor(req.params.filename);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
  const reply = req.body && req.body.reply;
  if (typeof reply !== 'string' || !reply.trim()) return res.status(400).json({ error: '請貼上 Claude 的回覆' });
  const { finalPath, recordPath, record } = ctx;
  const practice = record.practice || { total: 0, accepted: [], pending: [], resolved: [] };
  const pending = practice.pending || [];
  const claims = (record.claimReview && record.claimReview.pending) || [];
  const result = practiceAdjudicator.applyClaudeReview(pending, reply);
  let content = fs.readFileSync(finalPath, 'utf8');
  const claimResult = practiceAdjudicator.applyClaimReview(content, claims, reply);
  if (!result.accepted.length && !result.dropped.length && !claimResult.confirmed.length && !claimResult.removed.length) {
    return res.status(400).json({ error: '回覆中找不到「P1：正確」或「C1：成立」這種格式的逐題結果，請確認貼上的是 Claude 的回覆' });
  }
  content = claimResult.markdown;
  const accepted = (practice.accepted || []).concat(result.accepted);
  const stillPending = pending.filter((_, i) => result.unanswered.indexOf(i + 1) !== -1);
  if (record.practice && (result.accepted.length || result.dropped.length)) {
    const updated = practiceAdjudicator.replacePracticeBlock(content, accepted, stillPending.length);
    if (updated === null) return res.status(409).json({ error: 'Final.md 中找不到練習題區塊（<!-- practice:start --> … <!-- practice:end -->），可能已被手動刪除' });
    content = updated;
  }
  const backup = `${finalPath}.orig`;
  if (!fs.existsSync(backup)) fs.copyFileSync(finalPath, backup);
  fs.writeFileSync(finalPath, content, 'utf8');
  if (record.practice) {
    record.practice.accepted = accepted;
    record.practice.pending = stillPending;
    record.practice.resolved = (record.practice.resolved || []).concat([{
      at: new Date().toISOString(),
      accepted: result.accepted.map((p) => ({ question: p.question, claude: p.claude })),
      dropped: result.dropped.map((d) => ({ question: d.item.question, verdict: d.verdict })),
    }]);
  }
  if (record.claimReview) {
    record.claimReview.pending = claims.filter((_, i) => claimResult.unanswered.indexOf(i + 1) !== -1);
    record.claimReview.resolved = (record.claimReview.resolved || []).concat([{
      at: new Date().toISOString(),
      confirmed: claimResult.confirmed.map((c) => c.claim),
      removed: claimResult.removed.map((r) => ({ claim: r.claim.claim, verdict: r.verdict })),
    }]);
  }
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf8');
  // 2026-10-14（⑤）：每一筆裁決進標準答案集，附上當時的教材本文快照（2026-10-14 以前的審議沒有保存本文）。
  let goldRecorded = 0;
  try {
    const draftsPath = `${finalPath}.drafts.json`;
    const saved = fs.existsSync(draftsPath) ? JSON.parse(fs.readFileSync(draftsPath, 'utf8')) : {};
    const { frontmatter } = parseFrontmatter(content);
    goldRecorded = goldSet.appendRulings(DATA_DIR, goldSet.rulingsFrom({
      final: path.basename(finalPath), frontmatter, sourceHash: goldSet.saveSource(DATA_DIR, saved.sourceText),
      practiceResult: result, claimResult,
    }));
  } catch (error) {
    console.warn(`標準答案集記錄失敗（不影響審查結果）：${error.message}`);
  }
  return res.status(200).json({
    goldRecorded,
    added: result.accepted.length, dropped: result.dropped.length, stillPending: stillPending.length,
    accepted: accepted.length, content,
    claimsConfirmed: claimResult.confirmed.length, claimsRemoved: claimResult.removed.length,
    claimsPending: record.claimReview ? record.claimReview.pending.length : 0,
  });
});

// ---- 2026-11-26 AHS-A3 Claude 最後檢核（services/draftReview.js）------------------------------------
// GET  產生檢核包：程式逐句對照 SOURCE（不耗 token）的標記＋要貼到 Claude 網頁版的 Prompt。
// POST { reply } 貼回 Claude 的判定：通過 → passed；需修正且修正未滿 2 輪 → needs_revision；滿 2 輪 → needs_human（需人工處理）。
// POST .../revise 由本機模型 A 只修正被指出的句子，換回 Final.md（備份 .orig），修正輪數 +1，之後再檢核一次。
function finalCheckContext(filename) {
  const finalPath = finalPathFor(filename);
  const recordPath = assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, `${path.basename(finalPath)}.adjudication.json`));
  const record = fs.existsSync(recordPath) ? JSON.parse(fs.readFileSync(recordPath, 'utf8')) : {};
  const draftsPath = `${finalPath}.drafts.json`;
  const saved = fs.existsSync(draftsPath) ? JSON.parse(fs.readFileSync(draftsPath, 'utf8')) : {};
  const content = fs.readFileSync(finalPath, 'utf8');
  const check = draftReview.checkUnits(content, saved.sourceText || '');
  const state = record.finalCheck || { status: 'pending', revisionsDone: 0, rounds: [] };
  const pendingCount = ((record.practice && record.practice.pending) || []).length + ((record.claimReview && record.claimReview.pending) || []).length;
  return { finalPath, recordPath, record, saved, content, check, state, pendingCount };
}

function saveFinalCheck(ctx, state) {
  ctx.record.finalCheck = state;
  fs.writeFileSync(ctx.recordPath, JSON.stringify(ctx.record, null, 2), 'utf8');
  const catalog = readCatalog();
  const entry = catalog.items.find((item) => item.filename === path.basename(ctx.finalPath));
  if (entry) {
    entry.final_check = state.status;
    if (state.status === 'needs_human') entry.qualityGate = 'PENDING_MANUAL_REVIEW';
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  }
}

app.get('/api/finals/:filename/final-check', (req, res) => {
  let ctx;
  try { ctx = finalCheckContext(req.params.filename); } catch (error) { return res.status(404).json({ error: error.message }); }
  const { frontmatter } = parseFrontmatter(ctx.content);
  return res.status(200).json({
    status: ctx.state.status, revisionsDone: ctx.state.revisionsDone, maxRevisions: draftReview.MAX_REVISION_ROUNDS,
    units: ctx.check.units.length, flagged: ctx.check.flagged, pendingCount: ctx.pendingCount,
    flags: ctx.check.units.filter((u) => u.flags.length).map((u) => ({ id: u.id, section: u.section, text: u.text, flags: u.flags })),
    prompt: draftReview.buildFinalCheckPrompt({ metadata: frontmatter, sourceText: ctx.saved.sourceText, units: ctx.check.units, round: ctx.state.rounds.length + 1, pendingCount: ctx.pendingCount }),
  });
});

app.post('/api/finals/:filename/final-check', (req, res) => {
  let ctx;
  try { ctx = finalCheckContext(req.params.filename); } catch (error) { return res.status(404).json({ error: error.message }); }
  if (ctx.state.status === 'passed' || ctx.state.status === 'needs_human') return res.status(409).json({ error: `這份定稿的最後檢核已結束（${ctx.state.status}）` });
  let parsed;
  try { parsed = draftReview.parseFinalCheck(req.body && req.body.reply, ctx.check.units); } catch (error) { return res.status(400).json({ error: error.message }); }
  const status = draftReview.nextStatus(parsed.verdict, ctx.state.revisionsDone);
  const state = {
    status, revisionsDone: ctx.state.revisionsDone,
    rounds: ctx.state.rounds.concat([{ at: new Date().toISOString(), verdict: parsed.verdict, issues: parsed.issues.map((x) => Object.assign({ text: (ctx.check.units.find((u) => u.id === x.id) || {}).text }, x)) }]),
  };
  saveFinalCheck(ctx, state);
  return res.status(200).json({ status, revisionsDone: state.revisionsDone, maxRevisions: draftReview.MAX_REVISION_ROUNDS, issues: parsed.issues });
});

const reviseRunning = new Set();
app.post('/api/finals/:filename/final-check/revise', async (req, res) => {
  let ctx;
  try { ctx = finalCheckContext(req.params.filename); } catch (error) { return res.status(404).json({ error: error.message }); }
  if (ctx.state.status !== 'needs_revision') return res.status(409).json({ error: '目前沒有需要修正的檢核意見' });
  const last = ctx.state.rounds[ctx.state.rounds.length - 1];
  const issues = last.issues.filter((x) => ctx.content.indexOf(x.text) >= 0);
  if (reviseRunning.has(ctx.finalPath)) return res.status(409).json({ error: '這份定稿正在修正中' });
  reviseRunning.add(ctx.finalPath);
  try {
    const units = ctx.check.units.filter((u) => issues.some((x) => x.text === u.text));
    const idOf = (x) => (units.find((u) => u.text === x.text) || {}).id;
    const current = issues.map((x) => ({ id: idOf(x), comment: x.comment })).filter((x) => x.id);
    const revision = await localWriter.revise(draftReview.buildRevisionPrompt({ sourceText: ctx.saved.sourceText, units, issues: current }));
    const applied = draftReview.applyRevisions(ctx.content, units, revision.text, current.map((x) => x.id));
    const backup = `${ctx.finalPath}.orig`;
    if (!fs.existsSync(backup)) fs.copyFileSync(ctx.finalPath, backup);
    fs.writeFileSync(ctx.finalPath, applied.markdown, 'utf8');
    const state = Object.assign({}, ctx.state, { status: 'pending', revisionsDone: ctx.state.revisionsDone + 1 });
    state.rounds[state.rounds.length - 1].revision = { model: revision.model, applied: applied.applied, skipped: applied.skipped };
    saveFinalCheck(ctx, state);
    return res.status(200).json({ status: state.status, revisionsDone: state.revisionsDone, applied: applied.applied, skipped: applied.skipped, content: applied.markdown });
  } catch (error) {
    return res.status(500).json({ error: `本機模型修正失敗：${error.message}` });
  } finally {
    reviseRunning.delete(ctx.finalPath);
  }
});

// 2026-10-14（⑥）：送 Claude 最終審查的比例，以及標準答案集（⑤）累積的筆數。
app.get('/api/stats/adjudication', (req, res) => {
  try {
    return res.status(200).json(Object.assign(computeStats(OUTPUTS_DIR), { gold: goldSet.summarize(goldSet.readRulings(DATA_DIR)) }));
  } catch (error) {
    return res.status(500).json({ error: `統計失敗：${error.message}` });
  }
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
// 2026-10-09：GitHub main 上實際已上線的教材（index.json）。用途：
//  1. 新教材編號一併排除雲端已用的編號（PackageBuilder.setRemoteIds）。
//  2. 上傳紀錄顯示每份教材是否真的上線，而不是只顯示「已發布」。
// 抓不到（離線）時沿用上次結果；從未成功過則 materials 為 null，上傳頁顯示「無法確認」。
const GITHUB_REPO = process.env.GITHUB_REPO || 'stanleyshen7916-creator/AI-HighSchool-Learning-System';
const remoteIndex = { at: 0, materials: null, error: null };
// 測試（jest）與 REMOTE_INDEX=off 時不連網。
const REMOTE_INDEX_ENABLED = !process.env.JEST_WORKER_ID && process.env.REMOTE_INDEX !== 'off';
async function refreshRemoteIndex(maxAgeMs) {
  if (!REMOTE_INDEX_ENABLED) return remoteIndex;
  if (remoteIndex.materials && Date.now() - remoteIndex.at < maxAgeMs) return remoteIndex;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/docs/TeachingMaterials/index.json?t=${Date.now()}`,
      { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    remoteIndex.materials = Array.isArray(json.materials) ? json.materials : [];
    remoteIndex.at = Date.now();
    remoteIndex.error = null;
    packageBuilder.setRemoteIds(remoteIndex.materials.map((m) => m.materialId));
  } catch (error) {
    remoteIndex.error = error.message;
  } finally {
    clearTimeout(timer);
  }
  return remoteIndex;
}
refreshRemoteIndex(0);
setInterval(() => refreshRemoteIndex(0), 10 * 60 * 1000).unref();

// 上傳紀錄每一列的上線狀態：online 已上線／conflict 編號被雲端其他教材使用／pushing 送上
// GitHub 中／stalled 推送程式沒有在執行／failed 推送失敗／offline 未上線／unknown 無法確認。
function liveStatus(draft) {
  if (draft.status !== 'published') return null;
  const job = gitPublishQueue.latestFor(draft.materialId);
  if (job && job.status === 'pending') {
    return { state: job.publisherAlive === false && !job.progress ? 'stalled' : 'pushing', progress: job.progress || null };
  }
  if (!remoteIndex.materials) return { state: 'unknown', error: remoteIndex.error };
  const remote = remoteIndex.materials.find((m) => m.materialId === draft.materialId);
  const local = packageBuilder.materialMetadata(draft.materialId);
  if (remote && local && (remote.school !== local.school || remote.subject !== local.subject || remote.chapter !== local.chapter)) {
    return { state: 'conflict', remote: { school: remote.school, subject: remote.subject, chapter: remote.chapter } };
  }
  if (remote) return { state: 'online' };
  if (job && job.status === 'failed') return { state: 'failed', error: job.error || null, pr: job.pr || null };
  return { state: 'offline' };
}

app.post('/api/platform/drafts', async (req, res) => {
  await refreshRemoteIndex(60 * 1000);
  const body = req.body || {};
  try {
    const finalPath = finalPathFor(body.finalFilename);
    const adjudicationPath = `${finalPath}.adjudication.json`;
    const draft = packageBuilder.createDraft({
      finalFilename: path.basename(finalPath),
      finalMarkdown: fs.readFileSync(finalPath, 'utf8'),
      extraSourceFiles: [
        ...(fs.existsSync(adjudicationPath) ? [{ name: path.basename(adjudicationPath), path: adjudicationPath }] : []),
        ...(fs.existsSync(`${finalPath}.drafts.json`) ? [{ name: path.basename(`${finalPath}.drafts.json`), path: `${finalPath}.drafts.json` }] : []),
        ...uploadSessionFiles(body.uploadSessionId),
      ],
      metadata: body.metadata || {},
      // 2026-11-16 A7：題幹【圖：檔名】的來源——MinerU 切圖（mineru_outputs/<Final 前綴>/images）與本次上傳的原始檔。
      figureDirs: [
        path.join(MINERU_OUTPUTS_DIR, safeSlug(path.basename(finalPath).replace(/_Final\.md$/i, '')), 'images'),
        ...(body.uploadSessionId ? [path.join(MINERU_OUTPUTS_DIR, safeSlug(String(body.uploadSessionId)), 'images')] : []),
        ...(body.uploadSessionId ? [path.join(UPLOAD_SESSIONS_DIR, safeSlug(String(body.uploadSessionId)))] : []),
      ],
    });
    return res.status(201).json(draft);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.get('/api/platform/drafts', async (req, res) => {
  await refreshRemoteIndex(60 * 1000);
  res.status(200).json({
    drafts: packageBuilder.listDrafts().map((d) => Object.assign({}, d, { live: liveStatus(d) })),
    publisherAlive: gitPublishQueue.publisherAlive(),
  });
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

// 2026-11-06：知識弱點頁「產生重點整理」按鈕。實際產生由主機上的
// tools/wrongbook-notes.ps1（Claude Code）執行，引擎只排請求、回報進度。
app.post('/api/platform/wrongbook-notes/run', (req, res) => {
  try {
    return res.status(200).json(wrongBookNotesJob.requestRun());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/platform/wrongbook-notes/status', (req, res) => {
  return res.status(200).json(wrongBookNotesJob.status());
});

app.get('/api/platform/git-jobs/:jobId', (req, res) => {
  try {
    return res.status(200).json(gitPublishQueue.status(req.params.jobId));
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

// 2026-10-06：從平台永久刪除已上架的教材（教材中心的管理者刪除），連同補充題庫，並排入
// 自動 PR 上架。誤刪只能重新上傳。
app.post('/api/platform/materials/:materialId/delete', (req, res) => {
  if (req.body?.confirm !== true) return res.status(400).json({ error: '缺少刪除確認' });
  let result;
  try {
    result = packageBuilder.deletePublished(req.params.materialId);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  try {
    result.gitJobId = gitPublishQueue.enqueueTask(`delete-${result.materialId}`, result.changedPaths,
      `chore: 從平台刪除 ${result.removed.join('、')}（${result.title}）

由教材中心的管理者刪除，自動推送（ai-engine/council）。
`);
    result.gitPublisherAlive = gitPublishQueue.publisherAlive();
  } catch (error) {
    result.gitQueueError = error.message;
  }
  return res.status(200).json(result);
});

// 模擬月考：管理者把某校某學期某科的範圍設為全體預設（2026-10-05）。寫入
// js/data/MonthExamConfig.js，並和發布教材一樣排入自動 PR 上架。
const MONTH_EXAM_CONFIG_PATH = path.join(PLATFORM_ROOT, 'js', 'data', 'MonthExamConfig.js');
const MONTH_EXAM_CONFIG_MARKER = 'AHS.MonthExamConfig = ';

function readMonthExamConfig() {
  const text = fs.readFileSync(MONTH_EXAM_CONFIG_PATH, 'utf8');
  const start = text.indexOf(MONTH_EXAM_CONFIG_MARKER);
  if (start === -1) throw new Error('MonthExamConfig.js 格式不符，未修改');
  const json = text.slice(start + MONTH_EXAM_CONFIG_MARKER.length).replace(/;\s*$/, '');
  return { head: text.slice(0, start), config: JSON.parse(json) };
}

app.post('/api/platform/month-exam-config', (req, res) => {
  const { key, subject, materialIds } = req.body || {};
  if (!/^[a-z0-9]+\|[a-z0-9]+$/i.test(String(key || ''))) return res.status(400).json({ error: '學校／學期不正確' });
  if (typeof subject !== 'string' || !subject.trim() || subject.length > 20) return res.status(400).json({ error: '科目不正確' });
  if (!Array.isArray(materialIds) || !materialIds.length
    || !materialIds.every((id) => /^tm_\d+$/.test(id) && fs.existsSync(path.join(PLATFORM_ROOT, 'docs/TeachingMaterials/materials', id)))) {
    return res.status(400).json({ error: '範圍內的教材不正確或不存在' });
  }
  let doc;
  try { doc = readMonthExamConfig(); } catch (error) { return res.status(500).json({ error: error.message }); }
  doc.config.ranges = doc.config.ranges || {};
  doc.config.ranges[key] = { ...(doc.config.ranges[key] || {}), [subject]: materialIds };
  fs.writeFileSync(MONTH_EXAM_CONFIG_PATH, `${doc.head}${MONTH_EXAM_CONFIG_MARKER}${JSON.stringify(doc.config, null, 2)};\n`, 'utf8');
  const result = { key, subject, materialIds };
  try {
    result.gitJobId = gitPublishQueue.enqueueTask('monthexam-range', ['js/data/MonthExamConfig.js'],
      `feat: 模擬月考預設範圍 ${key} ${subject}：${materialIds.join('、')}\n\n由模擬月考專區設定後自動推送（ai-engine/council）。\n`);
    result.gitPublisherAlive = gitPublishQueue.publisherAlive();
  } catch (error) {
    result.gitQueueError = error.message;
  }
  return res.status(200).json(result);
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
app.post('/api/platform/supplements/drafts', async (req, res) => {
  await refreshRemoteIndex(60 * 1000);
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
  mineruTimeoutMs,
  readMineruProgress,
  contentListToPages,
  runFigureRecheck,
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
