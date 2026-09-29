// 教材上傳併入學習平台（2026-09-29）：FinalParser、PackageBuilder 與 /api/platform/* 端點。
// 所有寫入都發生在學習平台的暫存副本（tests/platformFixture.js），並驗證既有教材包的
// 每一個檔案在建立草稿、發布、刪除前後都完全不變。
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { createPlatformCopy, hashTree, existingMaterialIds } = require('./platformFixture');

const PLATFORM = createPlatformCopy();
process.env.PLATFORM_ROOT = PLATFORM;

jest.mock('tesseract.js', () => ({ recognize: jest.fn() }));

const { parseFinal } = require('../platform/FinalParser');
const { createPackageBuilder } = require('../platform/PackageBuilder');
const { app, OUTPUTS_DIR, DATA_DIR, UPLOAD_SESSIONS_DIR } = require('../server');

const SAMPLE_FINAL = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample_Final.md'), 'utf8');
const META = {
  school: 'cjsh', semester: 'g2s1', subject: '數學', grade: '高二',
  chapter: '第一章 三角函數', unit: '1-1 弧度量', materialType: 'TEXTBOOK',
};
const EXISTING_IDS = existingMaterialIds(PLATFORM);
const NEXT_ID = `tm_${Math.max(...EXISTING_IDS.map((id) => Number(id.slice(3)))) + 1}`;

// 既有教材包（tm_1 … 目前最大編號）所有檔案的雜湊：任何一步都不得改變。
function existingPackagesHash() {
  const all = hashTree(PLATFORM, 'docs/TeachingMaterials/materials');
  return Object.fromEntries(Object.entries(all).filter(([rel]) => EXISTING_IDS.includes(rel.split('/')[3])));
}
const BASELINE = existingPackagesHash();

afterAll(() => {
  fs.rmSync(PLATFORM, { recursive: true, force: true });
});

describe('FinalParser', () => {
  const parsed = parseFinal(SAMPLE_FINAL);

  test('讀取 frontmatter 與 Quality Gate', () => {
    expect(parsed.qualityGate).toBe('PASS');
    expect(parsed.finalScore).toBe('97');
    expect(parsed.frontmatter.run_id).toBe('00000000-0000-4000-8000-000000000000');
    expect(parsed.title).toBe('數學 測試單元 Final');
  });

  test('核心概念、重點詞彙、易錯陷阱逐字擷取；佔位章節視為空白', () => {
    expect(parsed.summary.coreConcepts).toEqual(['弧度是以弧長與半徑的比值定義的角度量。', '一個圓周角等於 2π 弳。']);
    expect(parsed.summary.keywords).toEqual(expect.arrayContaining(['弳', '扇形面積']));
    expect(parsed.summary.pitfalls).toEqual(['忘記把角度換成弧度再代入扇形公式。']);
    expect(parsed.placeholderSections).toContain('②章節摘要');
    expect(parsed.summary.keyPoints).toEqual([]);
  });

  test('題目：答案表格＋詳解、同行選項、分行選項＋行內答案；答案一律存選項文字', () => {
    const byNumber = Object.fromEntries(parsed.questions.map((q) => [q.number, q]));
    expect(Object.keys(byNumber).map(Number).sort()).toEqual([1, 2, 4]);
    expect(byNumber[1]).toMatchObject({
      question: '已知圓心角為 5π/6 弳，求其角度為多少度？',
      options: ['100°', '120°', '150°', '165°'],
      answer: '150°',
      explanation: '5π/6 × (180°/π) = 150°。',
      section: '1-1｜弧度量',
    });
    expect(byNumber[4]).toMatchObject({ options: ['π', '2π', '3π'], answer: '2π', explanation: '弧長 = rθ = 6 × π/3 = 2π。' });
  });

  test('缺答案的題目不收錄，並留下警告（不猜答案）', () => {
    expect(parsed.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Q3')]));
  });

  test('沒有條列時，核心概念退回擷取段落，略過「XX 認為：」標籤行', () => {
    const r = parseFinal('## ①核心概念\n\nChatGPT 認為：\n第一段內容。\n\nClaude 認為：\n第二段內容。\n');
    expect(r.summary.coreConcepts).toEqual(['第一段內容。', '第二段內容。']);
    expect(r.questions).toEqual([]);
    expect(r.warnings).toEqual(expect.arrayContaining([expect.stringContaining('題庫為空')]));
  });
});

describe('PackageBuilder', () => {
  const dataDir = fs.mkdtempSync(path.join(DATA_DIR, 'builder-'));
  const builder = createPackageBuilder({ platformRoot: PLATFORM, dataDir });
  const lifecycle = () => require(path.join(PLATFORM, 'docs/TeachingMaterials/scripts/MaterialLifecycle.js'));
  const materialDir = (id) => path.join(PLATFORM, 'docs/TeachingMaterials/materials', id);
  let draftId;

  test('教材資訊不正確時拒絕，且不建立任何資料夾', () => {
    const before = existingMaterialIds(PLATFORM).length;
    expect(() => builder.createDraft({ finalFilename: 'x_Final.md', finalMarkdown: SAMPLE_FINAL, metadata: { ...META, school: 'nope' } })).toThrow('學校');
    expect(() => builder.createDraft({ finalFilename: 'x_Final.md', finalMarkdown: SAMPLE_FINAL, metadata: { ...META, subject: '天文學' } })).toThrow('科目');
    // EXAM 規定所有題目須為 ORIGINAL 原題，Council 的 AI 題目不能標成考卷
    expect(() => builder.createDraft({ finalFilename: 'x_Final.md', finalMarkdown: SAMPLE_FINAL, metadata: { ...META, materialType: 'EXAM' } })).toThrow('教材類型');
    expect(existingMaterialIds(PLATFORM).length).toBe(before);
  });

  test('建立草稿：新增下一個編號、狀態 draft（ANALYZING，學生看不到），既有教材包完全不變', () => {
    const draft = builder.createDraft({
      finalFilename: '長榮高中_高二_數學_測試單元_課本_Final.md',
      finalMarkdown: SAMPLE_FINAL,
      extraSourceFiles: [],
      metadata: META,
    });
    draftId = draft.materialId;
    expect(draftId).toBe(NEXT_ID);
    expect(draft.manifestStatus).toBe('draft');
    expect(draft.stage).toBe('ANALYZING');
    expect(draft.questions).toHaveLength(3);
    expect(draft.questions[0]).toMatchObject({ questionSource: 'AI_GENERATED', origin: 'AI', type: 'single_choice', answer: '150°', page: null });
    expect(draft.metadata).toMatchObject({ school: 'cjsh', semester: 'g2s1', subject: '數學', materialType: 'TEXTBOOK' });
    expect(draft.sourceFiles).toEqual(['長榮高中_高二_數學_測試單元_課本_Final.md']);
    expect(fs.readFileSync(path.join(materialDir(draftId), 'material.md'), 'utf8')).toContain('Quality Gate：PASS');
    expect(existingPackagesHash()).toEqual(BASELINE);
  });

  test('只能操作自己建立的草稿：既有教材包不能發布或刪除', () => {
    expect(() => builder.publish('tm_1')).toThrow('不是由教材上傳建立的草稿');
    expect(() => builder.deleteDraft('tm_3')).toThrow('不是由教材上傳建立的草稿');
    expect(fs.existsSync(materialDir('tm_3'))).toBe(true);
    expect(existingPackagesHash()).toEqual(BASELINE);
  });

  test('驗證未通過時不發布，並還原為草稿', () => {
    const summaryFile = path.join(materialDir(draftId), 'summary.json');
    const good = fs.readFileSync(summaryFile, 'utf8');
    fs.writeFileSync(summaryFile, JSON.stringify({ materialId: draftId }));
    expect(() => builder.publish(draftId)).toThrow('驗證未通過');
    expect(lifecycle().resolveStage(draftId)).toBe('ANALYZING');
    expect(JSON.parse(fs.readFileSync(path.join(materialDir(draftId), 'manifest.json'), 'utf8')).status).toBe('draft');
    fs.writeFileSync(summaryFile, good);
  }, 120000);

  test('發布：經既有匯入流程進入平台資料，既有教材包完全不變', () => {
    const result = builder.publish(draftId);
    expect(result.stage).toBe('IMPORTED');
    expect(result.status).toBe('published');
    expect(result.changedPaths).toContain('js/data/TeachingMaterialData.js');

    const index = JSON.parse(fs.readFileSync(path.join(PLATFORM, 'docs/TeachingMaterials/index.json'), 'utf8'));
    expect(index.materials.map((m) => m.materialId)).toContain(draftId);
    const data = fs.readFileSync(path.join(PLATFORM, 'js/data/TeachingMaterialData.js'), 'utf8');
    expect(data).toContain(`"materialId": "${draftId}"`);
    expect(data).toContain('已知圓心角為 5π/6 弳');
    expect(existingPackagesHash()).toEqual(BASELINE);
  }, 180000);

  test('已發布的教材包不能再發布或刪除', () => {
    expect(() => builder.publish(draftId)).toThrow('只能發布草稿');
    expect(() => builder.deleteDraft(draftId)).toThrow('不能刪除');
    expect(fs.existsSync(materialDir(draftId))).toBe(true);
  });

  test('刪除草稿：只移除該草稿資料夾', () => {
    const draft = builder.createDraft({ finalFilename: 'b_Final.md', finalMarkdown: SAMPLE_FINAL, metadata: META });
    expect(fs.existsSync(materialDir(draft.materialId))).toBe(true);
    expect(builder.deleteDraft(draft.materialId).status).toBe('deleted');
    expect(fs.existsSync(materialDir(draft.materialId))).toBe(false);
    expect(fs.existsSync(materialDir(draftId))).toBe(true);
    expect(existingPackagesHash()).toEqual(BASELINE);
  });

  test('另有教材包等待匯入時拒絕發布，避免一併發布', () => {
    const other = builder.createDraft({ finalFilename: 'c_Final.md', finalMarkdown: SAMPLE_FINAL, metadata: META });
    const mine = builder.createDraft({ finalFilename: 'd_Final.md', finalMarkdown: SAMPLE_FINAL, metadata: META });
    const manifestFile = path.join(materialDir(other.materialId), 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    fs.writeFileSync(manifestFile, JSON.stringify({ ...manifest, status: 'complete' }));
    expect(lifecycle().resolveStage(other.materialId)).toBe('CLAUDE_READY');
    expect(() => builder.publish(mine.materialId)).toThrow(other.materialId);
    expect(lifecycle().resolveStage(mine.materialId)).toBe('ANALYZING');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    builder.deleteDraft(other.materialId);
    builder.deleteDraft(mine.materialId);
  });
});

describe('API：來源檢查', () => {
  test('不在允許清單的瀏覽器來源一律 403（防止其他網站操作本機引擎）', async () => {
    const res = await request(app).post('/api/platform/drafts').set('Origin', 'https://evil.example').send({});
    expect(res.status).toBe(403);
  });

  test('GitHub Pages 正式站可呼叫，含 Private Network Access 預檢', async () => {
    const res = await request(app)
      .options('/api/upload')
      .set('Origin', 'https://stanleyshen7916-creator.github.io')
      .set('Access-Control-Request-Private-Network', 'true');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://stanleyshen7916-creator.github.io');
    expect(res.headers['access-control-allow-private-network']).toBe('true');
  });

  test('GET /api/health', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const res = await request(app).get('/api/health');
    global.fetch = originalFetch;
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ engine: 'ahs-council', ollama: false, mineru: false });
  });
});

describe('API：上傳 → 建立草稿 → 預覽 → 刪除', () => {
  const finalName = '長榮高中_高二_數學_API測試_課本_Final.md';
  let sessionId;
  let materialId;

  beforeAll(() => {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUTS_DIR, finalName), SAMPLE_FINAL, 'utf8');
  });

  test('上傳時保留原始檔（位元組相同、中文檔名）', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('課本內容', 'utf8'), { filename: '第一章 課本.txt' });
    expect(res.status).toBe(200);
    sessionId = res.body.sessionId;
    const kept = path.join(UPLOAD_SESSIONS_DIR, sessionId, '第一章 課本.txt');
    expect(fs.readFileSync(kept, 'utf8')).toBe('課本內容');
  });

  test('路徑穿越的 Final 檔名被拒絕', async () => {
    const res = await request(app).post('/api/platform/drafts').send({ finalFilename: '../../etc/passwd', metadata: META });
    expect(res.status).toBe(400);
  });

  test('建立草稿：source/ 含 Final.md 與原始上傳檔', async () => {
    const res = await request(app).post('/api/platform/drafts').send({ finalFilename: finalName, uploadSessionId: sessionId, metadata: META });
    expect(res.status).toBe(201);
    materialId = res.body.materialId;
    expect(res.body.sourceFiles.sort()).toEqual([finalName, '第一章 課本.txt'].sort());
    expect(res.body.stage).toBe('ANALYZING');

    const list = await request(app).get('/api/platform/drafts');
    expect(list.body.drafts.map((d) => d.materialId)).toContain(materialId);
    const one = await request(app).get(`/api/platform/drafts/${materialId}`);
    expect(one.body.questions).toHaveLength(3);
  });

  test('刪除草稿', async () => {
    const res = await request(app).delete(`/api/platform/drafts/${materialId}`);
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(PLATFORM, 'docs/TeachingMaterials/materials', materialId))).toBe(false);
    expect(existingPackagesHash()).toEqual(BASELINE);
  });
});
