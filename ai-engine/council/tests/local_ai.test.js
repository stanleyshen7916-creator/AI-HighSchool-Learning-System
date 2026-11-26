// 2026-11-26 AHS-A3：兩份本機初稿（services/localWriter.js）＋程式逐句對照與 Claude 最後檢核（services/draftReview.js）。
// 不連 Ollama：global.fetch 一律換成假的，並檢查只打到本機 Ollama 網址（沒有任何外部 AI 呼叫）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

process.env.COUNCIL_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'local-ai-'));
process.env.REMOTE_INDEX = 'off';
process.env.OLLAMA_URL = 'http://ollama.test:11434';
const localWriter = require('../services/localWriter');
const draftReview = require('../services/draftReview');
const { app } = require('../server');

const OUTPUTS = path.join(process.env.COUNCIL_DATA_DIR, 'outputs');
const SOURCE = '希臘神話豐富的故事性是歐洲文化藝術的創作題材。宙斯是眾神之王，住在奧林帕斯山。';
const FINAL = [
  '---', 'school: 長榮', 'grade: 高二', 'subject: 歷史', 'unit: 第1章', '---', '',
  '# 歷史 第1章 Final', '',
  '## ①核心概念', '', '希臘神話是歐洲文化藝術的創作題材。宙斯住在火星上。', '',
  '## ⑪常考題型', '', '**Q1.** 宙斯住在哪裡？', '(A) 奧林帕斯山 (B) 火星', '答案：A', '詳解：課本說「宙斯是眾神之王，住在奧林帕斯山」', '',
  '## ⑭Cross Review', '', '不檢查這一節。', '',
].join('\n');

let calls = [];
function fakeOllama(reply) {
  calls = [];
  global.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    return { ok: true, json: async () => ({ response: typeof reply === 'function' ? reply(body) : reply }) };
  };
}
afterEach(() => { delete global.fetch; });

async function waitJob(jobId) {
  for (let i = 0; i < 50; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app).get(`/api/local-ai/jobs/${jobId}`);
    if (res.body.status === 'completed' || res.body.status === 'failed') return res.body;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('job did not finish');
}

describe('localWriter：兩個不同的本機模型各寫一份初稿', () => {
  test('A 用 qwen3（不思考）、B 用 gpt-oss（low），回覆去掉 <think>', async () => {
    fakeOllama('<think>想一想</think>①核心概念\n內容');
    const a = await localWriter.writeDraft('寫初稿', 'A');
    const b = await localWriter.writeDraft('寫初稿', 'B');
    expect([a.model, b.model]).toEqual(['qwen3:8b', 'gpt-oss:20b']);
    expect(a.text).toBe('①核心概念\n內容');
    expect(calls[0].body.think).toBe(false);
    expect(calls[1].body.think).toBe('low');
    expect(calls.every((c) => c.url === 'http://ollama.test:11434/api/generate')).toBe(true);
    expect(() => localWriter.writeDraft('x', 'C')).toThrow('A、B');
  });

  test('context 依 Prompt 長度調整；超過本機模型上限就拒絕', async () => {
    fakeOllama('ok');
    await localWriter.writeDraft('短', 'A');
    expect(calls[0].body.options.num_ctx).toBe(10240);
    await expect(localWriter.writeDraft('字'.repeat(localWriter.MAX_CTX), 'A')).rejects.toThrow('教材本文太長');
  });

  test('轉錄：每頁「=== 檔名 ===」分段，單頁失敗不中斷', async () => {
    let n = 0;
    global.fetch = async () => { n += 1; return n === 2 ? { ok: false, status: 500 } : { ok: true, json: async () => ({ response: `第${n}頁文字` }) }; };
    const r = await localWriter.transcribe([{ name: 'p1.jpg', buffer: Buffer.from('a') }, { name: 'p2.jpg', buffer: Buffer.from('b') }, { name: 'p3.jpg', buffer: Buffer.from('c') }]);
    expect(r.text).toBe('=== p1.jpg ===\n第1頁文字\n\n=== p3.jpg ===\n第3頁文字');
    expect(r.failed).toEqual([{ name: 'p2.jpg', error: 'Ollama HTTP 500' }]);
    expect(r.model).toBe('qwen2.5vl:7b');
  });
});

describe('draftReview：程式逐句對照 SOURCE＋Claude 最後檢核', () => {
  test('只檢核 ①～⑬；題目連同選項、答案、詳解算一個單位；原文找不到的內容與引句會被標記', () => {
    const { units, flagged } = draftReview.checkUnits(FINAL, SOURCE);
    expect(units.map((u) => u.id)).toEqual(['S1', 'S2', 'S3']);
    expect(units[2].text).toMatch(/^\*\*Q1\.\*\*[\s\S]*詳解/);
    expect(units[1].flags[0]).toMatch(/重疊低/);
    expect(flagged).toBe(1);
    const fake = draftReview.checkUnits('## ①核心概念\n課本說「這句話根本不在原文裡」。', SOURCE);
    expect(fake.units[0].flags).toContain('引句不在教材原文：「這句話根本不在原文裡」');
  });

  test('Prompt 要求只判定、不重寫，並附原文與程式標記', () => {
    const { units } = draftReview.checkUnits(FINAL, SOURCE);
    const p = draftReview.buildFinalCheckPrompt({ metadata: { subject: '歷史' }, sourceText: SOURCE, units, round: 2, pendingCount: 3 });
    expect(p).toMatch(/第 2 輪/);
    expect(p).toMatch(/不要重寫全文/);
    expect(p).toMatch(/S2［①核心概念］［程式標記：與教材原文重疊低/);
    expect(p).toMatch(/另有 3 項「待 Claude 判定」/);
    expect(p).toContain(SOURCE);
  });

  test('回覆解析：列了錯誤卻寫通過 → 仍需修正；沒有結論 → 拒絕', () => {
    const { units } = draftReview.checkUnits(FINAL, SOURCE);
    expect(draftReview.parseFinalCheck('都對。\n結論：通過', units)).toEqual({ verdict: 'passed', issues: [] });
    expect(draftReview.parseFinalCheck('S2：錯誤：應為奧林帕斯山\nS99：不存在\n結論：通過', units))
      .toEqual({ verdict: 'needs_revision', issues: [{ id: 'S2', comment: '錯誤：應為奧林帕斯山' }] });
    expect(() => draftReview.parseFinalCheck('S2：錯誤', units)).toThrow('結論');
  });

  test('修正最多 2 輪，第 3 次仍不通過 → 需人工處理', () => {
    expect(draftReview.nextStatus('passed', 2)).toBe('passed');
    expect(draftReview.nextStatus('needs_revision', 0)).toBe('needs_revision');
    expect(draftReview.nextStatus('needs_revision', 1)).toBe('needs_revision');
    expect(draftReview.nextStatus('needs_revision', 2)).toBe('needs_human');
  });

  test('本機模型只換回被指出的句子；可刪除；沒回的列 skipped', () => {
    const { units } = draftReview.checkUnits(FINAL, SOURCE);
    const r = draftReview.applyRevisions(FINAL, units, 'S2：宙斯住在奧林帕斯山。\nS1：不該改', ['S2', 'S3']);
    expect(r.applied).toEqual(['S2']);
    expect(r.skipped).toEqual(['S3']);
    expect(r.markdown).toContain('宙斯住在奧林帕斯山。');
    expect(r.markdown).not.toContain('宙斯住在火星上');
    expect(r.markdown).toContain('希臘神話是歐洲文化藝術的創作題材。');
    expect(draftReview.applyRevisions(FINAL, units, 'S2：刪除', ['S2']).markdown).not.toContain('宙斯住在火星上');
  });
});

describe('POST /api/local-ai/jobs', () => {
  test('drafts：本機模型 A、B 依序各寫一份，回傳兩份與模型名稱', async () => {
    fakeOllama((body) => `①核心概念\n${body.model} 的初稿`);
    const res = await request(app).post('/api/local-ai/jobs').send({ kind: 'drafts', prompt: '出題 Prompt' });
    expect(res.status).toBe(202);
    const job = await waitJob(res.body.jobId);
    expect(job.status).toBe('completed');
    expect(job.result).toEqual({ localA: '①核心概念\nqwen3:8b 的初稿', localB: '①核心概念\ngpt-oss:20b 的初稿', models: { localA: 'qwen3:8b', localB: 'gpt-oss:20b' } });
    expect(calls.map((c) => c.url)).toEqual(['http://ollama.test:11434/api/generate', 'http://ollama.test:11434/api/generate']);
  });

  test('參數檢查：缺 Prompt、未知 kind、轉錄找不到上傳檔或不是照片', async () => {
    expect((await request(app).post('/api/local-ai/jobs').send({ kind: 'drafts' })).status).toBe(400);
    expect((await request(app).post('/api/local-ai/jobs').send({ kind: 'chatgpt', prompt: 'x' })).status).toBe(400);
    expect((await request(app).post('/api/local-ai/jobs').send({ kind: 'transcribe', sessionId: 'nope', files: ['p1.jpg'] })).body.error).toMatch(/找不到上傳的原始檔/);
    const sessionDir = path.join(process.env.COUNCIL_DATA_DIR, 'upload_sessions', 's1');
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(path.join(sessionDir, 'a.pdf'), 'x');
    expect((await request(app).post('/api/local-ai/jobs').send({ kind: 'transcribe', sessionId: 's1', files: ['a.pdf'] })).body.error).toMatch(/只支援照片/);
  });

  test('transcribe：讀上傳的照片交給本機視覺模型', async () => {
    const sessionDir = path.join(process.env.COUNCIL_DATA_DIR, 'upload_sessions', 's2');
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(path.join(sessionDir, 'p1.jpg'), 'img');
    fakeOllama('地函的物質會緩慢對流。');
    const res = await request(app).post('/api/local-ai/jobs').send({ kind: 'transcribe', sessionId: 's2', files: ['p1.jpg'] });
    const job = await waitJob(res.body.jobId);
    expect(job.result.text).toBe('=== p1.jpg ===\n地函的物質會緩慢對流。');
    expect(calls[0].body.images).toEqual([Buffer.from('img').toString('base64')]);
  });
});

describe('/api/finals/:filename/final-check', () => {
  const name = 'x_高二_歷史_第1章_課本_Final.md';
  beforeAll(() => {
    fs.mkdirSync(OUTPUTS, { recursive: true });
    fs.writeFileSync(path.join(OUTPUTS, name), FINAL);
    fs.writeFileSync(path.join(OUTPUTS, `${name}.drafts.json`), JSON.stringify({ sourceText: SOURCE }));
    fs.writeFileSync(path.join(OUTPUTS, `${name}.adjudication.json`), JSON.stringify({ practice: { pending: [{}] }, claimReview: { pending: [] } }));
  });

  test('需修正 → 本機修正 → 再檢核；修正滿 2 輪仍不通過 → 需人工處理', async () => {
    const get = await request(app).get(`/api/finals/${encodeURIComponent(name)}/final-check`);
    expect(get.body).toMatchObject({ status: 'pending', revisionsDone: 0, maxRevisions: 2, units: 3, flagged: 1, pendingCount: 1 });
    expect(get.body.prompt).toMatch(/最後檢核者（第 1 輪）/);

    const bad = await request(app).post(`/api/finals/${encodeURIComponent(name)}/final-check`).send({ reply: '沒有結論' });
    expect(bad.status).toBe(400);

    for (let round = 1; round <= 2; round += 1) {
      // eslint-disable-next-line no-await-in-loop
      const units = (await request(app).get(`/api/finals/${encodeURIComponent(name)}/final-check`)).body;
      expect(units.revisionsDone).toBe(round - 1);
      // eslint-disable-next-line no-await-in-loop
      const post = await request(app).post(`/api/finals/${encodeURIComponent(name)}/final-check`).send({ reply: 'S2：錯誤：宙斯不住火星\n結論：需修正' });
      expect(post.body.status).toBe('needs_revision');
      fakeOllama(`S2：宙斯住在奧林帕斯山（第${round}次修正）。`);
      // eslint-disable-next-line no-await-in-loop
      const rev = await request(app).post(`/api/finals/${encodeURIComponent(name)}/final-check/revise`);
      expect(rev.body).toMatchObject({ status: 'pending', revisionsDone: round, applied: ['S2'] });
      expect(calls[0].body.model).toBe('qwen3:8b');
    }
    const last = await request(app).post(`/api/finals/${encodeURIComponent(name)}/final-check`).send({ reply: 'S2：錯誤\n結論：需修正' });
    expect(last.body.status).toBe('needs_human');
    expect((await request(app).post(`/api/finals/${encodeURIComponent(name)}/final-check`).send({ reply: '結論：通過' })).status).toBe(409);
    expect((await request(app).post(`/api/finals/${encodeURIComponent(name)}/final-check/revise`)).status).toBe(409);
    const content = fs.readFileSync(path.join(OUTPUTS, name), 'utf8');
    expect(content).toContain('宙斯住在奧林帕斯山（第2次修正）。');
    expect(fs.existsSync(path.join(OUTPUTS, `${name}.orig`))).toBe(true);
    const record = JSON.parse(fs.readFileSync(path.join(OUTPUTS, `${name}.adjudication.json`), 'utf8'));
    expect(record.finalCheck.rounds).toHaveLength(3);
    expect(record.finalCheck.status).toBe('needs_human');
  });
});
