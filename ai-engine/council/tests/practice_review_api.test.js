// 2026-10-12：/api/finals/:filename/practice-review（Claude 最終審查包）端點。
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'practice-review-'));
process.env.COUNCIL_DATA_DIR = DATA;
process.env.REMOTE_INDEX = 'off';
const { app } = require('../server');
const { renderPracticeBlock } = require('../services/practiceAdjudicator');

const FILE = '長榮中學_高二_數學_三角函數_課本_Final.md';
const OUT = path.join(DATA, 'outputs');
const accepted = [{ question: '已通過的題目？', options: ['甲', '乙'], answer: '甲', origins: ['Claude'], checks: {} }];
const pending = ['待審一？', '待審二？', '待審三？'].map((s) => ({ question: s, options: ['甲', '乙', '丙'], answer: '乙', origins: ['ChatGPT'], reason: 'Qwen 無法依教材原文判斷', checks: {} }));

beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, FILE), `---\nschool: 長榮中學\ngrade: 高二\nsubject: 數學\nunit: 三角函數\n---\n# Final\n\n## ⑪常考題型\n\n${renderPracticeBlock(accepted, pending.length)}\n\n## ⑮Final Score\n`, 'utf8');
  fs.writeFileSync(path.join(OUT, `${FILE}.adjudication.json`), JSON.stringify({ practice: { total: 4, accepted, pending, resolved: [] } }), 'utf8');
});

test('GET 產生審查包', async () => {
  const res = await request(app).get(`/api/finals/${encodeURIComponent(FILE)}/practice-review`);
  expect(res.status).toBe(200);
  expect(res.body.pending.map((p) => p.id)).toEqual(['P1', 'P2', 'P3']);
  expect(res.body.prompt).toMatch(/長榮中學 高二 數學 三角函數/);
});

test('POST 套用 Claude 回覆：收錄、刪除、未回覆留待審', async () => {
  const res = await request(app).post(`/api/finals/${encodeURIComponent(FILE)}/practice-review`).send({ reply: 'P1：答案應為 C\nP2：無法判斷' });
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ added: 1, dropped: 1, stillPending: 1, accepted: 2 });
  const md = fs.readFileSync(path.join(OUT, FILE), 'utf8');
  expect(md).toMatch(/\*\*Q2\.\*\* 待審一？[\s\S]*答案：C/);
  expect(md).not.toMatch(/待審二/);
  expect(fs.existsSync(path.join(OUT, `${FILE}.orig`))).toBe(true);
  const rec = JSON.parse(fs.readFileSync(path.join(OUT, `${FILE}.adjudication.json`), 'utf8'));
  expect(rec.practice.pending.map((p) => p.question)).toEqual(['待審三？']);
  expect(rec.practice.resolved[0].dropped[0].verdict).toBe('無法判斷');
});

test('回覆格式不對時拒絕', async () => {
  const res = await request(app).post(`/api/finals/${encodeURIComponent(FILE)}/practice-review`).send({ reply: '看起來都對' });
  expect(res.status).toBe(400);
});
