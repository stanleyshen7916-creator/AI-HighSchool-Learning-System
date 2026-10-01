// 為既有教材加題（2026-10-01）：SupplementBuilder、PackageBuilder.createSupplementDraft()、
// /api/platform/supplements/* 與產生平台資料時的合併。所有寫入都在學習平台的暫存副本，
// 並驗證既有教材包（含被加題的原教材）的每一個檔案都完全不變。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const request = require('supertest');
const { createPlatformCopy, hashTree, existingMaterialIds } = require('./platformFixture');

const PLATFORM = createPlatformCopy();
process.env.PLATFORM_ROOT = PLATFORM;

jest.mock('tesseract.js', () => ({ recognize: jest.fn() }));

const { parseQuestionText } = require('../platform/FinalParser');
const { similarity, normalizeStem } = require('../platform/SupplementBuilder');
const { app, packageBuilder } = require('../server');

const PARENT = 'tm_7';
const EXISTING_IDS = existingMaterialIds(PLATFORM);
const NEXT_ID = `tm_${Math.max(...EXISTING_IDS.map((id) => Number(id.slice(3)))) + 1}`;
const parentBank = JSON.parse(fs.readFileSync(path.join(PLATFORM, `docs/TeachingMaterials/materials/${PARENT}/questionbank.json`), 'utf8')).questions;
const EXISTING_STEM = parentBank[2].question;

function existingPackagesHash() {
  const all = hashTree(PLATFORM, 'docs/TeachingMaterials/materials');
  return Object.fromEntries(Object.entries(all).filter(([rel]) => EXISTING_IDS.includes(rel.split('/')[3])));
}
const BASELINE = existingPackagesHash();

function loadPlatformData() {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(path.join(PLATFORM, 'js/data/TeachingMaterialData.js'), 'utf8'), sandbox.window);
  return sandbox.window.AHS.TeachingMaterialData;
}

afterAll(() => {
  fs.rmSync(PLATFORM, { recursive: true, force: true });
});

const AUTHOR = [
  '以下是 5 題：',
  '',
  '## 第一部分',
  '**Q1.** 一圓的半徑為 3，圓心角為 2 弳的扇形，其弧長為多少？',
  '(A) 1.5　(B) 5　(C) 6　(D) 9',
  '答案：C',
  '詳解：弧長 s = rθ = 3 × 2 = 6。',
  '其他選項：1.5 是 r/θ，5 是 r+θ，9 是 r²。',
  '知識點：弧長公式',
  '難度：易',
  '',
  'Q2. 將 150° 換成弧度，下列何者正確？',
  '(A) 5π/6　(B) 2π/3　(C) 3π/4　(D) 7π/6',
  '答案：A',
  '詳解：150 × π/180 = 5π/6。',
  '知識點：度與弧度換算',
  '難度：中等偏易',
  '',
  `Q3. ${EXISTING_STEM}`,
  '(A) π 公分　(B) 2π 公分　(C) 3π 公分　(D) 6π 公分',
  '答案：B',
  '詳解：s = rθ = 6 × π/3 = 2π。',
  '',
  'Q4. 下列哪一個角與 −30° 同界？',
  '(A) 30°　(B) 330°　(C) 150°　(D) 210°',
  '答案：B',
  '詳解：−30° + 360° = 330°。',
  '知識點：同界角',
  '難度：難',
  '',
  'Q5. 半徑為 3、圓心角為 2 弳的扇形，弧長是多少？',
  '(A) 1.5　(B) 5　(C) 6　(D) 9',
  '答案：C',
  '詳解：s = rθ = 6。',
  '',
  `Q6. ${EXISTING_STEM.replace('6 公分', '4 公分').replace('π/3', 'π/2')}`,
  '(A) π 公分　(B) 2π 公分　(C) 4π 公分　(D) 8π 公分',
  '答案：B',
  '詳解：s = rθ = 4 × π/2 = 2π。',
].join('\n');

const SOLVER = ['Q1：C', 'Q2：(B)', '第3題 答案：B', 'Q4：有問題（−30° 的同界角不只一個選項）', 'Q5：C', '6. B'].join('\n');

describe('擷取出題結果', () => {
  test('「## 小節」不會讓題目漏掉；知識點與難度另外擷取；詳解保留多行', () => {
    const r = parseQuestionText(AUTHOR);
    expect(r.questions.map((q) => q.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(r.questions[0]).toMatchObject({
      answer: '6', knowledgePoint: '弧長公式', difficulty: '易', section: '第一部分',
      explanation: '弧長 s = rθ = 3 × 2 = 6。 其他選項：1.5 是 r/θ，5 是 r+θ，9 是 r²。',
    });
    expect(r.questions[1].difficulty).toBe('中等');
    expect(r.questions[3].difficulty).toBe('難');
  });

  test('重複比對：去掉空白標點後相似度', () => {
    expect(similarity(normalizeStem('半徑 3，圓心角 2 弳的扇形弧長？'), normalizeStem('半徑3圓心角2弳的扇形弧長'))).toBe(1);
    expect(similarity(normalizeStem('求 sin 30° 的值'), normalizeStem('求 cos 60° 的值'))).toBeLessThan(0.85);
  });
});

describe('SupplementBuilder', () => {
  const sb = packageBuilder.supplements;

  test('可加題的教材：只列已上架的原教材（不含封存）', () => {
    const list = sb.listParents();
    const ids = list.map((m) => m.materialId);
    expect(ids).toContain(PARENT);
    expect(ids).not.toContain('tm_6');
    expect(list.find((m) => m.materialId === PARENT)).toMatchObject({ subject: '數學', questionCount: parentBank.length, supplementCount: 0 });
  });

  test('出題 Prompt：含教材重點、既有題目、難度分布與固定格式', () => {
    const r = sb.authorPrompt({ parentId: PARENT, count: 10 });
    expect(r.difficulty).toEqual({ 易: 3, 中等: 5, 難: 2 });
    expect(r.prompt).toContain('出 10 題「全新」的單選練習題');
    expect(r.prompt).toContain(EXISTING_STEM.slice(0, 20));
    expect(r.prompt).toContain('核心概念：');
    expect(r.prompt).toContain('知識點：…');
    expect(sb.authorPrompt({ parentId: PARENT, count: 4, difficulty: { 易: 1, 中等: 1, 難: 2 } }).difficulty).toEqual({ 易: 1, 中等: 1, 難: 2 });
    expect(() => sb.authorPrompt({ parentId: PARENT, count: 0 })).toThrow('題數');
    expect(() => sb.authorPrompt({ parentId: 'tm_6', count: 5 })).toThrow('封存');
    expect(() => sb.authorPrompt({ parentId: 'tm_999', count: 5 })).toThrow('找不到');
  });

  test('作答 Prompt：只有題目與選項，沒有答案、詳解', () => {
    const r = sb.solverPrompt({ authorText: AUTHOR });
    expect(r.count).toBe(6);
    expect(r.prompt).toContain('Q1. 一圓的半徑為 3');
    expect(r.prompt).toContain('(A) 1.5　(B) 5　(C) 6　(D) 9');
    expect(r.prompt).not.toMatch(/答案：[A-E]|詳解|知識點：弧長/);
    expect(() => sb.solverPrompt({ authorText: '沒有題目' })).toThrow('擷取不到');
  });

  test('核對：一致 → 可加入；不一致／有問題 → 需人工確認；重複 → 不能加入', () => {
    const r = sb.check({ parentId: PARENT, authorText: AUTHOR, solvers: [{ id: 'claude-fresh', text: SOLVER }] });
    const byNo = Object.fromEntries(r.questions.map((q) => [q.number, q]));
    expect(byNo[1]).toMatchObject({ status: 'ok', answerKey: 'C', reasons: [] });
    expect(byNo[2].status).toBe('review');
    expect(byNo[2].reasons).toContain('Claude（新對話）答 B，出題答案為 A');
    expect(byNo[3].status).toBe('duplicate');
    expect(byNo[3].reasons[0]).toContain(`與既有題目 ${parentBank[2].questionId} 重複`);
    expect(byNo[4].status).toBe('review');
    expect(byNo[4].reasons[0]).toContain('認為題目有問題');
    expect(byNo[5].status).toBe('duplicate');
    expect(byNo[5].reasons).toContain('與本批 Q1 重複');
    expect(byNo[6].status).toBe('review');
    expect(byNo[6].reasons).toEqual([expect.stringContaining(`與既有題目 ${parentBank[2].questionId} 相似`)]);
    expect(r.counts).toEqual({ ok: 1, review: 3, duplicate: 2 });
  });

  test('三方模式：任何一方答案不同都要人工確認；沒有作答結果時全部需人工確認', () => {
    const r = sb.check({
      parentId: PARENT, authorText: AUTHOR,
      solvers: [{ id: 'claude-fresh', text: SOLVER }, { id: 'chatgpt', text: 'Q1：C' }, { id: 'gemini', text: 'Q1：D' }],
    });
    const q1 = r.questions.find((q) => q.number === 1);
    expect(q1.status).toBe('review');
    expect(q1.reasons).toEqual(['Gemini答 D，出題答案為 C']);
    expect(r.questions.find((q) => q.number === 2).reasons).toContain('ChatGPT沒有作答本題');
    const none = sb.check({ parentId: PARENT, authorText: AUTHOR, solvers: [] });
    expect(none.questions.find((q) => q.number === 1).reasons).toEqual(['尚未獨立作答核對']);
  });
});

describe('補充題庫草稿 → 發布 → 併入原教材題庫', () => {
  let draftId;

  test('只收錄勾選且不重複的題目；原教材不變', () => {
    expect(() => packageBuilder.createSupplementDraft({
      parentId: PARENT, authorText: AUTHOR, solvers: [{ id: 'claude-fresh', text: SOLVER }], accept: [3, 5],
    })).toThrow('沒有勾選');

    const draft = packageBuilder.createSupplementDraft({
      parentId: PARENT, authorText: AUTHOR, solvers: [{ id: 'claude-fresh', text: SOLVER }], mode: 'single', accept: [1, 2, 3],
    });
    draftId = draft.materialId;
    expect(draftId).toBe(NEXT_ID);
    expect(draft).toMatchObject({ kind: 'supplement', supplementOf: PARENT, manifestStatus: 'draft', stage: 'ANALYZING' });
    expect(draft.questions.map((q) => q.question)).toEqual([
      '一圓的半徑為 3，圓心角為 2 弳的扇形，其弧長為多少？', '將 150° 換成弧度，下列何者正確？',
    ]);
    expect(draft.questions[0]).toMatchObject({
      questionId: `${draftId}_q1`, questionSource: 'AI_GENERATED', origin: 'AI', knowledgePoint: '弧長公式', difficulty: '易', answer: '6',
    });
    expect(draft.metadata).toMatchObject({ source: '補充題庫', subject: '數學', semester: 'g2s1', materialType: 'REFERENCE' });
    expect(draft.sourceFiles.sort()).toEqual(['author.md', 'check-report.json', 'solver-claude-fresh.md']);
    expect(draft.warnings.join()).toContain('Q2 經人工確認後收錄');
    const related = JSON.parse(fs.readFileSync(path.join(PLATFORM, `docs/TeachingMaterials/materials/${draftId}/related.json`), 'utf8'));
    expect(related.related).toEqual([{ materialId: PARENT, reason: expect.stringContaining('補充題庫') }]);
    expect(existingPackagesHash()).toEqual(BASELINE);
  });

  test('草稿階段：下一批出題已把草稿題目算進既有題目（避免重複出題）', () => {
    expect(packageBuilder.supplements.authorPrompt({ parentId: PARENT, count: 5 }).existingCount).toBe(parentBank.length + 2);
    const again = packageBuilder.supplements.check({ parentId: PARENT, authorText: AUTHOR, solvers: [] });
    expect(again.questions.find((q) => q.number === 1).status).toBe('duplicate');
  });

  test('發布：題目併入原教材題庫，補充題庫本身不是一份教材；原教材檔案不變', () => {
    const result = packageBuilder.publish(draftId);
    expect(result.stage).toBe('IMPORTED');
    const data = loadPlatformData();
    expect(data.map((e) => e.materialId)).not.toContain(draftId);
    const parent = data.find((e) => e.materialId === PARENT);
    expect(parent.questions).toHaveLength(parentBank.length + 2);
    expect(parent.questions.slice(-2)).toEqual([
      expect.objectContaining({ id: `${draftId}_q1`, materialId: PARENT, supplementId: draftId, knowledgePoint: '弧長公式', difficulty: '易' }),
      expect.objectContaining({ id: `${draftId}_q2`, materialId: PARENT, supplementId: draftId }),
    ]);
    const index = JSON.parse(fs.readFileSync(path.join(PLATFORM, 'docs/TeachingMaterials/index.json'), 'utf8'));
    expect(index.materials.find((m) => m.materialId === draftId)).toMatchObject({ supplementOf: PARENT, lifecycleStage: 'IMPORTED' });
    expect(index.materials.find((m) => m.materialId === PARENT).supplementOf).toBeUndefined();
    expect(packageBuilder.supplements.listParents().map((m) => m.materialId)).not.toContain(draftId);
    expect(packageBuilder.supplements.listParents().find((m) => m.materialId === PARENT).supplementCount).toBe(2);
    expect(() => packageBuilder.supplements.authorPrompt({ parentId: draftId, count: 5 })).toThrow('本身是補充題庫');
    expect(existingPackagesHash()).toEqual(BASELINE);
  }, 180000);
});

describe('/api/platform/supplements', () => {
  test('教材清單、Prompt 與核對端點', async () => {
    const parents = await request(app).get('/api/platform/supplements/parents');
    expect(parents.status).toBe(200);
    expect(parents.body.materials.map((m) => m.materialId)).toContain(PARENT);

    const prompt = await request(app).post('/api/platform/supplements/author-prompt').send({ parentId: PARENT, count: 5 });
    expect(prompt.status).toBe(200);
    expect(prompt.body.prompt).toContain('出 5 題');
    const bad = await request(app).post('/api/platform/supplements/author-prompt').send({ parentId: PARENT, count: 99 });
    expect(bad.status).toBe(400);

    const solver = await request(app).post('/api/platform/supplements/solver-prompt').send({ authorText: AUTHOR });
    expect(solver.body.count).toBe(6);
    const check = await request(app).post('/api/platform/supplements/check')
      .send({ parentId: PARENT, authorText: AUTHOR, solvers: [{ id: 'claude-fresh', text: SOLVER }] });
    expect(check.status).toBe(200);
    expect(check.body.questions).toHaveLength(6);
    const draft = await request(app).post('/api/platform/supplements/drafts')
      .send({ parentId: PARENT, authorText: AUTHOR, solvers: [], accept: [] });
    expect(draft.status).toBe(400);
    expect(existingPackagesHash()).toEqual(BASELINE);
  });
});
