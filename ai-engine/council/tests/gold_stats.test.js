// 2026-10-14：標準答案集（⑤）與送審比例統計（⑥）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'gold-stats-'));
process.env.COUNCIL_DATA_DIR = DATA;
process.env.REMOTE_INDEX = 'off';
const { app } = require('../server');
const { renderPracticeBlock } = require('../services/practiceAdjudicator');
const goldSet = require('../services/goldSet');
const { computeStats } = require('../services/adjudicationStats');
const { evaluate } = require('../tools/gold-eval');

const OUT = path.join(DATA, 'outputs');
const FILE = '長榮中學_高二_地球科學_板塊_課本_Final.md';
const SOURCE = '板塊在中洋脊分離，在海溝隱沒。';
const pending = [
  { question: '板塊在哪裡分離？', options: ['中洋脊', '海溝', '島弧'], answer: '海溝', reason: 'Qwen 獨立作答為 (A)，初稿答案為 (B)', checks: { qwen: 'A' } },
  { question: '地殼最厚處？', options: ['山脈', '海洋'], answer: '山脈', reason: 'Qwen 無法依教材原文判斷', checks: { qwen: null } },
];
const claims = [
  { claim: '板塊在海溝隱沒', verdict: 'INSUFFICIENT_EVIDENCE', reason: '沒提到', escalate: false },
  { claim: '板塊在島弧分離', verdict: 'UNSUPPORTED', reason: '無根據', escalate: true },
];

beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
  const marker = (c) => `⚠️尚待人工覆核（${c.verdict}）：${c.claim}`;
  fs.writeFileSync(path.join(OUT, FILE), `---\nschool: 長榮中學\ngrade: 高二\nsubject: 地球科學\nunit: 板塊\n---\n## ②章節摘要\n\n${claims.map(marker).join('\n\n')}\n\n## ⑪常考題型\n\n${renderPracticeBlock([], pending.length)}\n\n## ⑮Final Score\n`, 'utf8');
  fs.writeFileSync(path.join(OUT, `${FILE}.drafts.json`), JSON.stringify({ drafts: {}, sourceText: SOURCE }), 'utf8');
  fs.writeFileSync(path.join(OUT, `${FILE}.adjudication.json`), JSON.stringify({
    adjudication_mode: 'llm_semantic',
    claims: claims.concat([{ claim: '已驗證', verdict: 'SUPPORTED' }, { claim: '已驗證二', verdict: 'SUPPORTED' }]),
    practice: { total: 5, accepted: [], pending, resolved: [] },
    claimReview: { pending: claims, resolved: [] },
  }), 'utf8');
  fs.writeFileSync(path.join(OUT, '舊校_高二_國文_舊課_課本_Final.md.adjudication.json'), JSON.stringify({ adjudication_mode: 'llm_semantic', claims: [{ claim: 'x' }] }), 'utf8');
});

test('套用 Claude 回覆時，每筆裁決連同本文快照進標準答案集', async () => {
  const res = await request(app).post(`/api/finals/${encodeURIComponent(FILE)}/practice-review`)
    .send({ reply: 'P1：答案應為 A\nP2：無法判斷\nC1：成立\nC2：不成立' });
  expect(res.status).toBe(200);
  expect(res.body.goldRecorded).toBe(4);
  const rulings = goldSet.readRulings(DATA);
  expect(rulings.map((r) => [r.kind, r.ruling])).toEqual([
    ['practice', '答案應為 A'], ['practice', '無法判斷'], ['claim', '成立'], ['claim', '不成立'],
  ]);
  expect(rulings[0]).toMatchObject({ answer: 'A', qwen: 'A', subject: '地球科學', final: FILE });
  expect(rulings[3]).toMatchObject({ claim: '板塊在島弧分離', qwen: 'UNSUPPORTED', escalate: true });
  expect(goldSet.loadSource(DATA, rulings[0].sourceHash)).toBe(SOURCE);
});

test('送審比例：陳述 2/4 送 Claude、練習題 2/5；舊版紀錄不計入', () => {
  const s = computeStats(OUT);
  expect(s.overall.claims).toMatchObject({ total: 4, toClaude: 2, confirmed: 1, removed: 1, pending: 0, disagreement: 1 });
  expect(s.overall.claimEscalationRate).toBe(50);
  expect(s.overall.practice).toMatchObject({ total: 5, toClaude: 2, auto: 3, added: 1, dropped: 1 });
  expect(s.overall.practiceEscalationRate).toBe(40);
  expect(s.overall.claudeConfirmRate).toBe(50);
  expect(Object.keys(s.bySubject)).toEqual(['地球科學']);
  expect(s.legacy).toBe(1);
});

test('GET /api/stats/adjudication 附上標準答案集筆數', async () => {
  const res = await request(app).get('/api/stats/adjudication');
  expect(res.status).toBe(200);
  expect(res.body.gold).toMatchObject({ total: 4, scorable: 3 });
  expect(res.body.overall.claimEscalationRate).toBe(50);
});

test('回歸測試：只評有定論的裁決，計算一致率', async () => {
  const report = await evaluate(goldSet.readRulings(DATA), {
    loadSource: (h) => goldSet.loadSource(DATA, h),
    verifyClaim: async () => ({ verdict: 'SUPPORTED' }),
    solve: async () => 'A',
  });
  expect(report.total).toBe(3);
  expect(report.agreement).toEqual({ judged: 2, agree: 1, rate: 50 });
  expect(report.practiceAgreement).toEqual({ judged: 1, agree: 1, rate: 100 });
});
