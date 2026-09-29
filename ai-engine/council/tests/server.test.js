jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({ text: '這是 PDF 測試文字內容' }),
    // 預設不會被呼叫到（上面 getText 已經回傳足夠的「真正文字」，見
    // countMeaningfulChars／PDF_MEANINGFUL_CHAR_THRESHOLD），只是提供一個安全預設值，
    // 避免哪個測試不小心觸發 OCR fallback 時因為這裡沒有 mock 而丟出無關的錯誤。
    getScreenshot: jest.fn().mockResolvedValue({
      total: 1,
      pages: [{ pageNumber: 1, data: Buffer.from('fake-page-png') }],
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('tesseract.js', () => ({
  recognize: jest.fn().mockResolvedValue({
    data: {
      text: '這是 OCR 辨識文字',
      words: [{ text: '這是' }, { text: 'OCR' }, { text: '辨識文字' }],
    },
  }),
}));

const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

// 必須在 require('../server') 之前設定：server.js 的 MinerU 佇列目錄常數是模組載入時
// 就讀取環境變數決定的常數。指向隔離的 tmp 目錄，避免這台機器上如果剛好有真正的
// mineru-parser 容器在跑（共用同一份 repo 內 mineru_outputs/ bind mount），讓測試
// 意外偵測到「真實」心跳、對測試從未真正建立的 job 進行長時間輪詢而掛住——測試結果
// 不應該取決於「這台機器目前有沒有在跑 Docker」這種環境狀態。
const MINERU_TEST_QUEUE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'mineru-queue-test-'));
process.env.MINERU_QUEUE_INPUTS_DIR = path.join(MINERU_TEST_QUEUE_ROOT, 'inputs');
process.env.MINERU_QUEUE_OUTPUTS_DIR = path.join(MINERU_TEST_QUEUE_ROOT, 'outputs');

afterAll(() => {
  fs.rmSync(MINERU_TEST_QUEUE_ROOT, { recursive: true, force: true });
});

const {
  app,
  generateStudyMarkdown,
  runTriCouncil,
  readCatalog,
  CATALOG_PATH,
  PLATFORM_DIST_DIR,
  MINERU_OUTPUTS_DIR,
  buildMaterialId,
  countMeaningfulChars,
  PDF_MEANINGFUL_CHAR_THRESHOLD,
  runMinerU,
  isMineruWatcherAlive,
} = require('../server');
const { extractSectionsFromDraft } = require('../services/multiAi');

const UPLOADS_DIR = path.join(process.env.COUNCIL_DATA_DIR, 'uploads');

// 2026-09-29（移入學習平台時修正）：services/multiAi.js 在 ecaf8f1 改為「依小節分批抽取
// claim，再逐一驗證」，原本「每次呼叫都回傳同一包 claims」的 mock 已不符合實際協定，
// 使這三個測試在 AI-Study-Council 原 repo 就已失敗。改為依 prompt 內容回應：
//   - 小節抽取 prompt（「這一次「只」需要處理一個小節：X」）→ 回傳屬於 X 的 claims
//   - 單一 claim 驗證 prompt → 回傳該 claim 的 quoted_source_span／verdict
function ollamaMock(claims) {
  return async (url, init) => {
    const prompt = JSON.parse((init && init.body) || '{}').prompt || '';
    const section = /這一次「只」需要處理一個小節：(.+?)。/.exec(prompt);
    if (section) {
      const sectionClaims = claims.filter((c) => c.section === section[1]);
      const body = { claims: sectionClaims.map(({ claim_id, claim }) => ({ claim_id, claim })), unresolved: null };
      return { ok: true, json: async () => ({ response: JSON.stringify(body) }) };
    }
    const claim = claims.slice().sort((a, b) => b.claim.length - a.claim.length).find((c) => prompt.includes(c.claim));
    const body = claim
      ? { quoted_source_span: claim.quoted_source_span, verdict: claim.verdict, reason: claim.reason }
      : { quoted_source_span: null, verdict: 'UNSUPPORTED', reason: 'mock：找不到對應 claim' };
    return { ok: true, json: async () => ({ response: JSON.stringify(body) }) };
  };
}

const FINAL_TITLES = [
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

describe('extractSectionsFromDraft（章節切片正則）', () => {
  test('圈號數字與標題文字間含半形空格時仍可正確切片（例如 Claude 慣用「## ① 核心概念」格式）', () => {
    const draft = [
      '## ① 核心概念',
      'Claude 撰寫的核心概念內容。',
      '',
      '## ⑮ Final Score',
      'Self-QA: 96/100',
    ].join('\n');

    const sections = extractSectionsFromDraft(draft);
    expect(sections['①核心概念']).toBe('Claude 撰寫的核心概念內容。');
    expect(sections['⑮Final Score']).toBe('Self-QA: 96/100');
  });

  test('圈號數字與標題文字間含全形空格時仍可正確切片', () => {
    const draft = [
      '##①　核心概念',
      '全形空格分隔的核心概念內容。',
      '',
      '## ⑪常考題型',
      '常考題型內容。',
    ].join('\n');

    const sections = extractSectionsFromDraft(draft);
    expect(sections['①核心概念']).toBe('全形空格分隔的核心概念內容。');
    expect(sections['⑪常考題型']).toBe('常考題型內容。');
  });

  test('無空格的既有標題格式（如「①核心概念」）仍維持正確切片，不因本次修正而退化', () => {
    const draft = ['①核心概念', '無空格格式內容。'].join('\n');
    const sections = extractSectionsFromDraft(draft);
    expect(sections['①核心概念']).toBe('無空格格式內容。');
  });
});

describe('generateStudyMarkdown + runTriCouncil（三階段三方審議管線）', () => {
  test('包含全部 15 項 Final 結構標題、Self-QA 標籤、學校/科目/單元/教材類別/AI 引擎，以及 Phase1~Phase3 完整審查紀錄', async () => {
    const council = await runTriCouncil('測試文本，長度足夠讓三方初稿判定為完整內容，不觸發扣分規則。', {
      school: '長榮高中',
      grade: '高二',
      subject: '國文',
      unit: 'L01',
      category: '課本',
    });

    const markdown = generateStudyMarkdown({
      school: '長榮高中',
      grade: '高二',
      subject: '國文',
      unit: 'L01',
      category: '課本',
      engine: 'Claude 3.5 Sonnet (Anthropic)',
      text: '測試文本，長度足夠讓三方初稿判定為完整內容，不觸發扣分規則。',
      council,
    });

    FINAL_TITLES.forEach((title) => {
      expect(markdown).toContain(title);
    });
    expect(markdown).toMatch(/Self-QA/);
    expect(markdown).toContain('學校：長榮高中');
    expect(markdown).toContain('年級：高二');
    expect(markdown).toContain('科目：國文');
    expect(markdown).toContain('單元：L01');
    expect(markdown).toContain('教材類別：課本');
    expect(markdown).toContain('AI 引擎：Claude 3.5 Sonnet (Anthropic)');
    expect(markdown).toContain('審查引擎：AI-Study-Council Cross-Reviewer v1.1');

    // Phase 1 獨立初稿自評、Phase 2 交叉比對修訂、Phase 3 首席審議裁決，三階段紀錄需完整出現
    expect(markdown).toContain('Phase 1 獨立初稿自評');
    expect(markdown).toContain('GPT 100/100');
    expect(markdown).toContain('Gemini 100/100');
    expect(markdown).toContain('Claude 100/100');
    expect(markdown).toContain('Phase 2 交叉比對修訂');
    expect(markdown).toContain('GPT-Revised');
    expect(markdown).toContain('Gemini-Revised');
    expect(markdown).toContain('Claude-Revised');
    expect(markdown).toContain('Phase 3 首席審議裁決');
    expect(markdown).toContain('Quality Gate');

    // 誠實標示：必須明確標註為模擬管線，且不得出現舊版「[Claude] 已核定／無捏造」式的偽驗證聲稱
    expect(markdown).toContain('Council Pipeline: SIMULATED');
    expect(markdown).not.toMatch(/\[Claude\]|\[GPT\]|\[Gemini\]/);
    expect(markdown).not.toContain('無捏造');

    // 分數需為規則式動態計算：完整輸入時三方初稿均 100 分，Quality Gate 加成後仍為 100（非寫死 ≥98 的固定值）
    expect(markdown).toContain('Self-QA：100 / 100');
    expect(markdown).toContain('Quality Gate 判定：通過（≥98）');
  });

  test('來源文本為空時，Phase 1 三方初稿自評應誠實扣分，Quality Gate 最終分數低於 98（證明非寫死固定值）', async () => {
    const council = await runTriCouncil('', { school: '長榮高中', subject: '國文', unit: 'L01' });

    expect(council.meta.phase1Scores.GPT).toBeLessThan(95);
    expect(council.meta.phase1Scores.Gemini).toBeLessThan(95);
    expect(council.meta.phase1Scores.Claude).toBeLessThan(95);
    expect(council.meta.finalScore).toBeLessThan(98);
    expect(council.sections['⑮Final Score']).toContain('未提供來源文本');
    expect(council.sections['⑮Final Score']).toContain('未通過，建議人工覆核');
  });
});

describe('POST /api/analyze', () => {
  const FINAL_BACKUP_DIR = path.join(process.env.COUNCIL_DATA_DIR, '04_Final');

  const cleanupGenerated = (filename) => {
    const outputFile = path.join(process.env.COUNCIL_DATA_DIR, 'outputs', filename);
    const backupFile = path.join(FINAL_BACKUP_DIR, filename);
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
  };

  test('純文字情境：回應 200，檔名正確，內容含學校/年級/教材類別/AI 引擎，並同步備份至 04_Final/', async () => {
    const school = '竹圍高中';
    const grade = '高一';
    const subject = '測試科目';
    const unit = '測試單元';
    const category = '講義';
    const engine = 'GPT-4o (OpenAI)';
    const filename = `${school}_${grade}_${subject}_${unit}_${category}_Final.md`;
    const outputFile = path.join(process.env.COUNCIL_DATA_DIR, 'outputs', filename);
    const backupFile = path.join(FINAL_BACKUP_DIR, filename);

    try {
      const res = await request(app)
        .post('/api/analyze')
        .send({ school, grade, subject, unit, category, engine, text: '這是一段測試來源文字。' });

      expect(res.status).toBe(200);
      expect(res.body.filename).toBe(filename);
      expect(fs.existsSync(outputFile)).toBe(true);

      const fileContent = fs.readFileSync(outputFile, 'utf8');
      expect(fileContent).toContain(`學校：${school}`);
      expect(fileContent).toContain(`年級：${grade}`);
      expect(fileContent).toContain(`教材類別：${category}`);
      expect(fileContent).toContain(`AI 引擎：${engine}`);
      expect(fileContent).toContain('審查引擎：AI-Study-Council Cross-Reviewer v1.1');
      expect(fileContent).toContain('產出 AI 團隊：');
      expect(fileContent).toContain('審查模式：');
      expect(fileContent).toContain('審議管線：Council Pipeline: SIMULATED');
      expect(fileContent).toContain('Phase 1 獨立初稿自評');
      expect(fileContent).toContain('Phase 2 交叉比對修訂');
      expect(fileContent).toContain('Phase 3 首席審議裁決');
      expect(fileContent).not.toMatch(/\[Claude\]|\[GPT\]|\[Gemini\]/);
      expect(fileContent).not.toContain('無捏造');

      if (fs.existsSync(FINAL_BACKUP_DIR)) {
        expect(fs.existsSync(backupFile)).toBe(true);
        expect(fs.readFileSync(backupFile, 'utf8')).toBe(fileContent);
      }
    } finally {
      cleanupGenerated(filename);
    }
  });

  test('檔案上傳情境：先透過 /api/upload 擷取文字，再送入 /api/analyze 仍回應 200', async () => {
    const school = '長榮高中';
    const grade = '高二';
    const subject = '國文';
    const unit = 'L02';
    const category = '課本';
    const engine = 'Gemini 1.5 Pro (Google)';
    const filename = `${school}_${grade}_${subject}_${unit}_${category}_Final.md`;

    try {
      const uploadRes = await request(app)
        .post('/api/upload')
        .attach('files', Buffer.from('上傳檔案來源文字測試', 'utf8'), 'source.txt');

      expect(uploadRes.status).toBe(200);

      const analyzeRes = await request(app)
        .post('/api/analyze')
        .send({ school, grade, subject, unit, category, engine, text: uploadRes.body.text });

      expect(analyzeRes.status).toBe(200);
      expect(analyzeRes.body.filename).toBe(filename);
      expect(analyzeRes.body.content).toContain(`AI 引擎：${engine}`);
    } finally {
      cleanupGenerated(filename);
    }
  });
});

describe('POST /api/assemble-council（Qwen Semantic Cross-Council Adjudication，SOURCE-grounded）', () => {
  const school = '長榮高中';
  const grade = '高二';
  const subject = '國文';
  const unit = 'L03';
  const category = '課本';
  const filename = `${school}_${grade}_${subject}_${unit}_${category}_Final.md`;
  const outputFile = path.join(process.env.COUNCIL_DATA_DIR, 'outputs', filename);
  const distFile = path.join(PLATFORM_DIST_DIR, filename);
  const adjudicationFile = path.join(process.env.COUNCIL_DATA_DIR, 'outputs', `${filename}.adjudication.json`);
  const platformIndexDir = path.join(PLATFORM_DIST_DIR, buildMaterialId(school, grade, subject, unit, category));

  let catalogExistedBefore;
  let catalogSnapshot;
  const originalFetch = global.fetch;

  beforeEach(() => {
    catalogExistedBefore = fs.existsSync(CATALOG_PATH);
    catalogSnapshot = catalogExistedBefore ? fs.readFileSync(CATALOG_PATH, 'utf8') : null;
    // 預設模擬 Ollama 未啟動（連線失敗），確保既有測試走保底規則拼接模式，行為具決定性、不依賴真實網路。
    global.fetch = jest.fn().mockRejectedValue(new Error('連線失敗（測試環境：Ollama 未啟動）'));
  });

  afterEach(() => {
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    if (fs.existsSync(distFile)) fs.unlinkSync(distFile);
    if (fs.existsSync(adjudicationFile)) fs.unlinkSync(adjudicationFile);
    if (fs.existsSync(platformIndexDir)) fs.rmSync(platformIndexDir, { recursive: true, force: true });

    if (catalogExistedBefore) {
      fs.writeFileSync(CATALOG_PATH, catalogSnapshot, 'utf8');
    } else if (fs.existsSync(CATALOG_PATH)) {
      fs.unlinkSync(CATALOG_PATH);
    }
    global.fetch = originalFetch;
  });

  const sourceText =
    '妻不信。王果去牆數尺，奔而入；及牆，虛若無物，回視，果在牆外矣。大喜，入謝。老道人曰：' +
    '「歸宜潔持，否則不驗。」遂助資斧遣之歸。抵家，自詡遇仙，堅壁所不能阻。妻不信，王效其作為，' +
    '去牆數尺，奔而入，頭觸硬壁，蹶然而踣。妻扶視之，額上墳起如巨卵焉。妻揶揄之。王慚忿，罵老道士之無良而已。';

  const chatgptDraft = [
    '①核心概念',
    'ChatGPT 認為核心概念是甲。',
    '',
    '②章節摘要',
    '王生返家試術，頭觸硬壁，驀然而踣。',
    '',
    '⑪常考題型',
    '常考題型一：解釋甲的意義。',
    '',
    '⑮Final Score',
    'Self-QA: 96/100',
  ].join('\n');

  const geminiDraft = [
    '①核心概念',
    'Gemini 補充核心概念的批判性檢視。',
    '',
    '②章節摘要',
    '王生試術失敗，頭觸硬壁，驀然而踣。',
    '',
    '⑤修辭手法',
    'Gemini 分析修辭手法：比喻與排比。',
    '',
    '⑮Final Score',
    'Self-QA: 97/100',
  ].join('\n');

  const claudeDraft = [
    '①核心概念',
    'Claude 從結構完整性角度整理核心概念。',
    '',
    '②章節摘要',
    '王生返家試術，頭觸硬壁，蹶然而踣（對照課本原文）。',
    '',
    '⑪常考題型',
    '常考題型二：分析乙的結構。',
    '',
    '⑬跨課連結',
    'Claude 補充跨課連結說明。',
    '',
    '⑮Final Score',
    'Self-QA: 98/100',
  ].join('\n');


  const allSupportedClaims = [
    { claim_id: 'c1', section: '①核心概念', claim: '融合後核心概念：王生入勞山拜師習得穿牆術。', quoted_source_span: null, verdict: 'SUPPORTED', reason: '三方一致', confidence: 0.9 },
    { claim_id: 'c2', section: '②章節摘要', claim: '王生返家後試穿牆術，頭觸硬壁，蹶然而踣。', quoted_source_span: '頭觸硬壁，蹶然而踣', verdict: 'SUPPORTED', reason: '逐字對照 SOURCE', confidence: 0.95 },
    { claim_id: 'c3', section: '⑪常考題型', claim: '常考題型：解釋甲的意義；分析乙的結構。', quoted_source_span: null, verdict: 'SUPPORTED', reason: '合併自 ChatGPT 與 Claude 初稿', confidence: 0.8 },
    { claim_id: 'c4', section: '⑬跨課連結', claim: 'Claude 補充之跨課連結說明已納入。', quoted_source_span: null, verdict: 'SUPPORTED', reason: '僅 Claude 提供，SOURCE 未牴觸', confidence: 0.7 },
    { claim_id: 'c6', section: '⑤修辭手法', claim: '本段以對比手法凸顯王生前後的落差。', quoted_source_span: null, verdict: 'SUPPORTED', reason: 'SOURCE 情節前後對照', confidence: 0.8 },
    { claim_id: 'c5', section: '⑮Final Score', claim: '本輪 claim 全數通過 SOURCE 驗證。', quoted_source_span: null, verdict: 'SUPPORTED', reason: '彙總', confidence: 0.9 },
  ];

  test('三方初稿完整且 Qwen 回傳合法 claims 時：回應 200，Final.md 含 Mode/Sources/Adjudicator/adjudication_mode 標記，且同步發布至 outputs/、platform_dist/ 與 *.adjudication.json，並更新 catalog.json', async () => {
    global.fetch = jest.fn().mockImplementation(ollamaMock(allSupportedClaims));

    const res = await request(app)
      .post('/api/assemble-council')
      .send({
        school,
        grade,
        subject,
        unit,
        category,
        sourceText,
        drafts: { chatgpt: chatgptDraft, gemini: geminiDraft, claude: claudeDraft },
      });

    expect(res.status).toBe(200);
    expect(res.body.filename).toBe(filename);

    const markdown = res.body.content;
    expect(markdown).toContain(`年級：${grade}`);
    expect(markdown).toContain('Mode: Qwen Semantic Cross-Council Adjudication');
    expect(markdown).toContain('Sources: ChatGPT (Web) + Gemini (Web) + Claude (Web)');
    expect(markdown).toContain('adjudication_mode: "llm_semantic"');
    expect(markdown).toContain('王生入勞山拜師習得穿牆術');
    expect(markdown).toContain('蹶然而踣');

    FINAL_TITLES.forEach((title) => {
      expect(markdown).toContain(title);
    });

    expect(fs.existsSync(outputFile)).toBe(true);
    expect(fs.existsSync(distFile)).toBe(true);
    expect(fs.existsSync(adjudicationFile)).toBe(true);
    expect(fs.readFileSync(distFile, 'utf8')).toBe(markdown);

    const adjudicationRecord = JSON.parse(fs.readFileSync(adjudicationFile, 'utf8'));
    expect(adjudicationRecord.adjudication_mode).toBe('llm_semantic');
    expect(Array.isArray(adjudicationRecord.claims)).toBe(true);
    expect(adjudicationRecord.claims.length).toBeGreaterThan(0);
    adjudicationRecord.claims.forEach((claim) => {
      expect(claim).toHaveProperty('claim_id');
      expect(claim).toHaveProperty('source_ref');
      expect(claim).toHaveProperty('verdict');
      expect(claim).toHaveProperty('reason');
      expect(claim).toHaveProperty('confidence');
    });

    const catalog = readCatalog();
    const entry = catalog.items.find((item) => item.filename === filename);
    expect(entry).toBeDefined();
    expect(entry.mode).toBe('Qwen Semantic Cross-Council Adjudication');
    expect(entry.adjudication_mode).toBe('llm_semantic');
    expect(entry.qualityGate).toBe('PASS');
    expect(entry.path).toBe(`platform_dist/${filename}`);
    expect(entry.adjudication_path).toBe(`outputs/${filename}.adjudication.json`);
    expect(entry.grade).toBe(grade);
  });

  test('重複發布同一份教材時，catalog.json 以檔名為鍵覆蓋更新而非重複累加', async () => {
    global.fetch = jest.fn().mockImplementation(ollamaMock(allSupportedClaims));
    const payload = {
      school,
      grade,
      subject,
      unit,
      category,
      sourceText,
      drafts: { chatgpt: chatgptDraft, gemini: geminiDraft, claude: claudeDraft },
    };

    await request(app).post('/api/assemble-council').send(payload);
    await request(app).post('/api/assemble-council').send(payload);

    const catalog = readCatalog();
    const matches = catalog.items.filter((item) => item.filename === filename);
    expect(matches).toHaveLength(1);
  });

  test('缺少任一方初稿時回應 400，不寫入 outputs/ 或 platform_dist/', async () => {
    const res = await request(app)
      .post('/api/assemble-council')
      .send({
        school,
        grade,
        subject,
        unit,
        category,
        sourceText,
        drafts: { chatgpt: chatgptDraft, gemini: '', claude: claudeDraft },
      });

    expect(res.status).toBe(400);
    expect(fs.existsSync(outputFile)).toBe(false);
    expect(fs.existsSync(distFile)).toBe(false);
  });

  test('缺少必填 metadata（科目）時回應 400', async () => {
    const res = await request(app)
      .post('/api/assemble-council')
      .send({
        school,
        grade,
        subject: '',
        unit,
        category,
        sourceText,
        drafts: { chatgpt: chatgptDraft, gemini: geminiDraft, claude: claudeDraft },
      });

    expect(res.status).toBe(400);
  });

  test('缺少必填 metadata（年級）時回應 400', async () => {
    const res = await request(app)
      .post('/api/assemble-council')
      .send({
        school,
        subject,
        unit,
        category,
        sourceText,
        drafts: { chatgpt: chatgptDraft, gemini: geminiDraft, claude: claudeDraft },
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('grade');
  });

  test('未提供 sourceText（Canonical SOURCE）時：不得呼叫 Ollama，直接安全降級為 fallback_concat + PENDING_MANUAL_REVIEW（P0-01）', async () => {
    const res = await request(app)
      .post('/api/assemble-council')
      .send({
        school,
        grade,
        subject,
        unit,
        category,
        drafts: { chatgpt: chatgptDraft, gemini: geminiDraft, claude: claudeDraft },
      });

    expect(res.status).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
    const markdown = res.body.content;
    expect(markdown).toContain('Mode: Human-in-the-Loop Tri-Web Council');
    expect(markdown).toContain('adjudication_mode: "fallback_concat"');
    expect(markdown).toContain('quality_gate: "PENDING_MANUAL_REVIEW"');
    expect(markdown).toContain('ChatGPT 認為核心概念是甲');
  });

  test('Known Conflict Fixture（STEP 12 Acceptance fixture）— 兩份初稿一致但錯誤的引用「驀然而踣」不得因為多數決獲勝，Final.md 必須採用 SOURCE 驗證通過的「蹶然而踣」', async () => {
    const conflictClaims = [
      { claim_id: 'wrong-a', section: '②章節摘要', claim: '頭觸硬壁，驀然而踣。', quoted_source_span: '頭觸硬壁，驀然而踣', verdict: 'SUPPORTED', reason: 'ChatGPT 與 Gemini 初稿一致', confidence: 0.8 },
      { claim_id: 'wrong-b', section: '②章節摘要', claim: '（重複）頭觸硬壁，驀然而踣。', quoted_source_span: '頭觸硬壁，驀然而踣', verdict: 'SUPPORTED', reason: '與另一份初稿一致', confidence: 0.8 },
      { claim_id: 'correct-c', section: '②章節摘要', claim: '頭觸硬壁，蹶然而踣。', quoted_source_span: '頭觸硬壁，蹶然而踣', verdict: 'SUPPORTED', reason: 'Claude 初稿並引用 SOURCE 頁碼', confidence: 0.95 },
    ];
    global.fetch = jest.fn().mockImplementation(ollamaMock(conflictClaims));

    const res = await request(app)
      .post('/api/assemble-council')
      .send({
        school,
        grade,
        subject,
        unit,
        category,
        sourceText,
        drafts: { chatgpt: chatgptDraft, gemini: geminiDraft, claude: claudeDraft },
      });

    expect(res.status).toBe(200);
    const markdown = res.body.content;
    expect(markdown).toContain('蹶然而踣');
    expect(markdown).not.toContain('驀然而踣');
    // 三個 claim 只有一個通過 SOURCE 驗證：分批裁決後的 Quality Gate 為 FAIL（舊版為
    // PENDING_MANUAL_REVIEW）。這個測試要保證的是「絕不 PASS」。
    expect(markdown).toMatch(/quality_gate: "(PENDING_MANUAL_REVIEW|FAIL)"/);

    const adjudicationRecord = JSON.parse(fs.readFileSync(adjudicationFile, 'utf8'));
    const wrongA = adjudicationRecord.claims.find((c) => c.claim_id === 'wrong-a');
    const correctC = adjudicationRecord.claims.find((c) => c.claim_id === 'correct-c');
    expect(wrongA.verdict).toBe('CONTRADICTED');
    expect(correctC.verdict).toBe('SUPPORTED');
  });

  test('Ollama 服務未啟動／逾時／顯存不足時：自動降級為規則拼接模式，仍成功產出 Final.md 且明確標示 failure_reason', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED: Ollama 服務未啟動'));

    const res = await request(app)
      .post('/api/assemble-council')
      .send({
        school,
        grade,
        subject,
        unit,
        category,
        sourceText,
        drafts: { chatgpt: chatgptDraft, gemini: geminiDraft, claude: claudeDraft },
      });

    expect(res.status).toBe(200);
    const markdown = res.body.content;
    expect(markdown).toContain('Mode: Human-in-the-Loop Tri-Web Council');
    expect(markdown).toContain('adjudication_mode: "fallback_concat"');
    expect(markdown).toContain('Failure Reason：OLLAMA_CONNECTION_ERROR');
    // 降級後仍須完成真實交叉比對（非模擬佔位文字）
    expect(markdown).toContain('ChatGPT 認為核心概念是甲');
  });
});

describe('POST /api/assemble-council/jobs（P0-06 Async Job — 可靠的 long-running execution mechanism）', () => {
  const school = '長榮高中';
  const grade = '高二';
  const subject = '國文';
  const unit = 'L03-JOB';
  const category = '課本';
  const filename = `${school}_${grade}_${subject}_${unit}_${category}_Final.md`;
  const outputFile = path.join(process.env.COUNCIL_DATA_DIR, 'outputs', filename);
  const distFile = path.join(PLATFORM_DIST_DIR, filename);
  const adjudicationFile = path.join(process.env.COUNCIL_DATA_DIR, 'outputs', `${filename}.adjudication.json`);
  const platformIndexDir = path.join(PLATFORM_DIST_DIR, buildMaterialId(school, grade, subject, unit, category));
  const originalFetch = global.fetch;

  afterEach(() => {
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    if (fs.existsSync(distFile)) fs.unlinkSync(distFile);
    if (fs.existsSync(adjudicationFile)) fs.unlinkSync(adjudicationFile);
    if (fs.existsSync(platformIndexDir)) fs.rmSync(platformIndexDir, { recursive: true, force: true });
    global.fetch = originalFetch;
  });

  test('POST 立即回傳 202 與 jobId（不阻塞），GET 輪詢可觀察 queued/running → completed 狀態轉換', async () => {
    // Ollama 呼叫先卡在 gate 上，證明 POST 不會等裁決完成；打開 gate 後，分批抽取與
    // 逐一驗證的多次呼叫都立即回應（分批裁決會呼叫 Ollama 多次，不只一次）。
    let resolveFetch;
    const gate = new Promise((resolve) => { resolveFetch = resolve; });
    const respond = ollamaMock([
      { claim_id: 'c1', section: '①核心概念', claim: '非同步 job 測試內容。', quoted_source_span: null, verdict: 'SUPPORTED', reason: 'x', confidence: 0.8 },
    ]);
    global.fetch = jest.fn().mockImplementation(async (url, init) => {
      await gate;
      return respond(url, init);
    });

    const createRes = await request(app)
      .post('/api/assemble-council/jobs')
      .send({
        school,
        grade,
        subject,
        unit,
        category,
        sourceText: '任意 SOURCE 內容供非同步測試使用。',
        drafts: { chatgpt: '①核心概念\nA', gemini: '①核心概念\nB', claude: '①核心概念\nC' },
      });

    expect(createRes.status).toBe(202);
    expect(createRes.body.jobId).toBeTruthy();
    expect(['queued', 'running']).toContain(createRes.body.status);

    const jobId = createRes.body.jobId;
    const runningRes = await request(app).get(`/api/assemble-council/jobs/${jobId}`);
    expect(runningRes.status).toBe(200);
    expect(['queued', 'running']).toContain(runningRes.body.status);

    resolveFetch();
    let doneRes = await request(app).get(`/api/assemble-council/jobs/${jobId}`);
    for (let i = 0; i < 100 && ['queued', 'running'].includes(doneRes.body.status); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      doneRes = await request(app).get(`/api/assemble-council/jobs/${jobId}`);
    }
    expect(['completed', 'pending_manual_review']).toContain(doneRes.status === 200 ? doneRes.body.status : null);
    expect(doneRes.body.result.filename).toBe(filename);
  });

  test('查詢不存在的 jobId 回應 404', async () => {
    const res = await request(app).get('/api/assemble-council/jobs/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/upload', () => {
  afterEach(() => {
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.readdirSync(UPLOADS_DIR).forEach((file) => {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
      });
    }
  });

  test('上傳 .txt 檔案直接讀取文字，並清理暫存檔', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('純文字內容測試', 'utf8'), 'sample.txt');

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('純文字內容測試');
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  test('上傳 .md 檔案直接讀取文字，並清理暫存檔', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('# 標題\n內容', 'utf8'), 'sample.md');

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('# 標題\n內容');
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  test('上傳 .pdf 檔案透過 pdf-parse 解析文字，並清理暫存檔', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('%PDF-1.4 fake content'), 'sample.pdf');

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('這是 PDF 測試文字內容');
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  // 真實案例：使用者上傳掃描/拍照課本頁存成的 PDF（例如直接把手機相簿的照片存成單頁 PDF）。
  // 這種 PDF 本質上是一張圖片，pdf-parse 的 getText() 讀不到內嵌文字層，只會拿到近乎空白
  // 的內容（有時混著掃描流程本身蓋的頁碼章戳，例如「-- 1 of 1 --」，但那不是課本正文）。
  // 過去這種情況會讓使用者以為「解析完成」卻拿到空白教材本文；現在必須自動改用 OCR。
  test('上傳 .pdf 但內嵌文字層幾乎是空的（掃描/拍照課本頁）：自動改用 OCR 逐頁辨識，而非回傳空白內容', async () => {
    const { PDFParse } = require('pdf-parse');
    PDFParse.mockImplementationOnce(() => ({
      getText: jest.fn().mockResolvedValue({ text: '-- 1 of 1 --\n\n' }),
      getScreenshot: jest.fn().mockResolvedValue({
        total: 1,
        pages: [{ pageNumber: 1, data: Buffer.from('fake-scanned-page-png') }],
      }),
      destroy: jest.fn().mockResolvedValue(undefined),
    }));

    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('%PDF-1.4 scanned photo page'), 'scanned.pdf');

    expect(res.status).toBe(200);
    expect(res.body.text).toContain('這是 OCR 辨識文字');
    expect(res.body.text).toContain('-- 1 of 1 --');
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  test('上傳圖片檔透過 OCR 辨識，合併文字與文字框內容，並清理暫存檔', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('fake png bytes'), 'sample.png');

    expect(res.status).toBe(200);
    expect(res.body.text).toContain('這是 OCR 辨識文字');
    expect(res.body.text).toContain('這是 OCR 辨識文字');
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  test('不支援的檔案格式回應 400', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('binary'), 'sample.exe');

    expect(res.status).toBe(400);
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  test('一次上傳多個 .txt/.md 檔案：依檔名順序合併內文，並清理所有暫存檔', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('第二段內容', 'utf8'), 'b-second.txt')
      .attach('files', Buffer.from('第一段內容', 'utf8'), 'a-first.txt');

    expect(res.status).toBe(200);
    // 依檔名排序（a-first.txt 在 b-second.txt 之前）合併，而非依上傳順序
    expect(res.body.text).toBe('第一段內容\n\n第二段內容');
    expect(res.body.files).toEqual([
      { filename: 'a-first.txt', length: '第一段內容'.length },
      { filename: 'b-second.txt', length: '第二段內容'.length },
    ]);
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  test('一次上傳多個圖片檔：逐一 OCR 解析並合併文字，保留各檔案內容區塊', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('fake png bytes 1'), 'page1.png')
      .attach('files', Buffer.from('fake png bytes 2'), 'page2.png');

    expect(res.status).toBe(200);
    expect(res.body.files).toHaveLength(2);
    expect(res.body.files.map((f) => f.filename)).toEqual(['page1.png', 'page2.png']);
    // 兩頁的 OCR 結果皆應出現在合併文字中
    const occurrences = res.body.text.split('這是 OCR 辨識文字').length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
    expect(fs.readdirSync(UPLOADS_DIR)).toHaveLength(0);
  });

  test('未選擇任何檔案時回應 400', async () => {
    const res = await request(app).post('/api/upload').send();

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('請選擇要上傳的檔案');
  });
});

describe('countMeaningfulChars（判斷 PDF 內嵌文字層是否「幾乎是空的」的字元計數工具）', () => {
  test('真正的課文內容遠超過門檻值', () => {
    expect(countMeaningfulChars('每個人都喜歡聽故事，因為故事情節生動')).toBeGreaterThanOrEqual(
      PDF_MEANINGFUL_CHAR_THRESHOLD,
    );
  });

  test('掃描頁常見的頁碼章戳（例如 "-- 1 of 2 --"）遠低於門檻值，不能被當成真正的文字內容', () => {
    expect(countMeaningfulChars('-- 1 of 2 --\n\n\n\n-- 2 of 2 --')).toBeLessThan(PDF_MEANINGFUL_CHAR_THRESHOLD);
  });

  test('純空白／換行：0', () => {
    expect(countMeaningfulChars('\n\n   \n\n')).toBe(0);
  });

  test('中英文混合各自逐字計數', () => {
    expect(countMeaningfulChars('AI 有 2 個字')).toBe('AI有個字'.length);
  });
});

describe('runMinerU / isMineruWatcherAlive（MinerU 佇列輪詢邏輯，真實檔案系統，不 mock fs）', () => {
  let tmpRoot;
  let inputsDir;
  let outputsDir;
  let sourceFile;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mineru-test-'));
    inputsDir = path.join(tmpRoot, 'inputs');
    outputsDir = path.join(tmpRoot, 'outputs');
    fs.mkdirSync(outputsDir, { recursive: true });
    sourceFile = path.join(tmpRoot, 'source.pdf');
    fs.writeFileSync(sourceFile, 'fake pdf bytes');
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  function touchHeartbeat() {
    fs.writeFileSync(path.join(outputsDir, '.heartbeat'), String(Date.now()));
  }

  test('isMineruWatcherAlive：心跳檔存在且新鮮時回傳 true', () => {
    touchHeartbeat();
    expect(isMineruWatcherAlive(outputsDir)).toBe(true);
  });

  test('isMineruWatcherAlive：心跳檔不存在時回傳 false（服務未啟動）', () => {
    expect(isMineruWatcherAlive(outputsDir)).toBe(false);
  });

  test('isMineruWatcherAlive：心跳檔存在但已過期時回傳 false', () => {
    const heartbeatPath = path.join(outputsDir, '.heartbeat');
    fs.writeFileSync(heartbeatPath, 'old');
    const staleTime = new Date(Date.now() - 60000);
    fs.utimesSync(heartbeatPath, staleTime, staleTime);
    expect(isMineruWatcherAlive(outputsDir)).toBe(false);
  });

  test('沒有心跳（模擬 mineru-parser 容器未啟動）：立即失敗，不進入輪詢等待', async () => {
    const start = Date.now();
    await expect(
      runMinerU(sourceFile, '.pdf', { inputsDir, outputsDir, jobId: 'job-no-heartbeat', pollTimeoutMs: 5000 }),
    ).rejects.toThrow('心跳');
    expect(Date.now() - start).toBeLessThan(1000);
  });

  test('.done 標記已存在：立即讀回對應的 markdown 內容，不需等待', async () => {
    touchHeartbeat();
    const jobId = 'job-already-done';
    const ocrDir = path.join(outputsDir, jobId, 'ocr');
    fs.mkdirSync(ocrDir, { recursive: true });
    fs.writeFileSync(path.join(ocrDir, `${jobId}.md`), '# 真正的課文內容');
    fs.writeFileSync(path.join(outputsDir, jobId, '.done'), '');

    const text = await runMinerU(sourceFile, '.pdf', { inputsDir, outputsDir, jobId, pollTimeoutMs: 5000 });
    expect(text).toBe('# 真正的課文內容');
    // 來源檔案應該已經複製進佇列輸入目錄，供 watch loop 撿取
    expect(fs.existsSync(path.join(inputsDir, `${jobId}.pdf`))).toBe(true);
  });

  test('.done 標記在輪詢期間才出現（模擬 watch loop 正在處理）：輪詢到之後正確讀回結果', async () => {
    touchHeartbeat();
    const jobId = 'job-completes-later';

    setTimeout(() => {
      const ocrDir = path.join(outputsDir, jobId, 'ocr');
      fs.mkdirSync(ocrDir, { recursive: true });
      fs.writeFileSync(path.join(ocrDir, `${jobId}.md`), '延遲完成的內容');
      fs.writeFileSync(path.join(outputsDir, jobId, '.done'), '');
    }, 50);

    const text = await runMinerU(sourceFile, '.pdf', {
      inputsDir,
      outputsDir,
      jobId,
      pollIntervalMs: 10,
      pollTimeoutMs: 5000,
    });
    expect(text).toBe('延遲完成的內容');
  });

  test('.error 標記出現：拋出錯誤，不得假裝成功回傳空白', async () => {
    touchHeartbeat();
    const jobId = 'job-fails';
    fs.mkdirSync(path.join(outputsDir, jobId), { recursive: true });
    fs.writeFileSync(path.join(outputsDir, jobId, '.error'), 'FAILED');

    await expect(
      runMinerU(sourceFile, '.pdf', { inputsDir, outputsDir, jobId, pollTimeoutMs: 5000 }),
    ).rejects.toThrow('MinerU 解析失敗');
  });

  test('心跳存在但一直沒有 .done／.error：逾時後拋出錯誤', async () => {
    touchHeartbeat();
    await expect(
      runMinerU(sourceFile, '.pdf', {
        inputsDir,
        outputsDir,
        jobId: 'job-times-out',
        pollIntervalMs: 10,
        pollTimeoutMs: 50,
      }),
    ).rejects.toThrow('逾時');
  });
});

describe('多模態圖片配套下載機制 GET /api/materials/:id/images(/download)', () => {
  const materialId = buildMaterialId('長榮高中', '高一', '數學', 'L05', '課本');
  const imagesDir = path.join(MINERU_OUTPUTS_DIR, materialId, 'images');

  afterEach(() => {
    const materialRoot = path.join(MINERU_OUTPUTS_DIR, materialId);
    if (fs.existsSync(materialRoot)) {
      fs.rmSync(materialRoot, { recursive: true, force: true });
    }
  });

  test('教材尚無解析圖片時，清單 API 回應 200 且 images 為空陣列', async () => {
    const res = await request(app).get(`/api/materials/${encodeURIComponent(materialId)}/images`);

    expect(res.status).toBe(200);
    expect(res.body.materialId).toBe(materialId);
    expect(res.body.count).toBe(0);
    expect(res.body.images).toEqual([]);
  });

  test('教材尚無解析圖片時，下載 API 回應 404', async () => {
    const res = await request(app).get(`/api/materials/${encodeURIComponent(materialId)}/images/download`);
    expect(res.status).toBe(404);
  });

  test('教材已有 MinerU 解析圖片時：清單 API 列出檔案與縮圖路徑，下載 API 回傳可解壓的 zip', async () => {
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.writeFileSync(path.join(imagesDir, 'fig1.png'), Buffer.from('fake-png-bytes-1'));
    fs.writeFileSync(path.join(imagesDir, 'fig2.jpg'), Buffer.from('fake-jpg-bytes-2'));
    fs.writeFileSync(path.join(imagesDir, 'notes.txt'), 'should be ignored, not an image');

    const listRes = await request(app).get(`/api/materials/${encodeURIComponent(materialId)}/images`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.count).toBe(2);
    const filenames = listRes.body.images.map((img) => img.filename).sort();
    expect(filenames).toEqual(['fig1.png', 'fig2.jpg']);
    listRes.body.images.forEach((img) => {
      expect(img.url).toContain(`/mineru_outputs/${materialId}/images/`);
      expect(img.thumbnailUrl).toBeTruthy();
    });

    const downloadRes = await request(app)
      .get(`/api/materials/${encodeURIComponent(materialId)}/images/download`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toBe('application/zip');
    expect(downloadRes.headers['content-disposition']).toContain('images.zip');
    expect(downloadRes.headers['content-disposition']).toContain(
      `filename*=UTF-8''${encodeURIComponent(materialId)}_images.zip`,
    );
    // ZIP 檔案的 local file header 簽章為 'PK\x03\x04'
    expect(downloadRes.body.slice(0, 4).toString('hex')).toBe('504b0304');
  });
});
