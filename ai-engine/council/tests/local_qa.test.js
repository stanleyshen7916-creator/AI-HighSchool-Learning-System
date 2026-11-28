'use strict';
/* 佇列 9：關卡 5（本機自主 QA）、金標準 C、關卡 6（Claude 抽樣）、校準、串接。模型一律是假的，不連 Ollama。 */
const { loadConfig } = require('../platform/QualityRules');
const L = require('../platform/LocalQA');
const { runPipeline } = require('../platform/QualityPipeline');

const cfg = loadConfig();
const q = (o) => Object.assign({ id: 'q1', questionId: 'q1', type: 'single_choice', question: '下列何者是羅馬共和時期保障平民權益的官職？', options: ['執政官', '護民官', '獨裁官', '監察官'], answer: 'B', explanation: '護民官保障平民。難度：易', section: '1-3' }, o);
const GOOD = 'EXPLANATION: YES\nCORRECT: B\nABSURD: NONE\nSCOPE: IN\nBLOOM: 記憶';
/* 假審題模型：作答題回 answers 依序的字母；檢查題回 check。 */
function fakeReview({ answers = ['B', 'B', 'B'], check = GOOD } = {}) {
  let i = 0;
  const calls = [];
  const fn = async (prompt, opt) => { calls.push({ prompt, opt }); return /ANSWER: 字母/.test(prompt) ? `ANSWER: ${answers[i++ % answers.length]}` : check; };
  fn.calls = calls;
  return fn;
}

describe('關卡 5 本機自主 QA', () => {
  test('3 次一致＋檢查全過 → pass，作答用 3 種溫度', async () => {
    const review = fakeReview();
    const r = await L.gateLocalQA(q(), { review, cfg });
    expect(r.status).toBe('pass');
    expect(r.bloom).toBe('記憶');
    expect(review.calls.filter((c) => /ANSWER: 字母/.test(c.prompt)).map((c) => c.opt.temperature)).toEqual([0, 0.4, 0.8]);
  });
  test('1 一致性：2 次一致 → 待複核；1 次 → 淘汰', async () => {
    expect((await L.gateLocalQA(q(), { review: fakeReview({ answers: ['B', 'B', 'C'] }), cfg })).status).toBe('review');
    const f = await L.gateLocalQA(q(), { review: fakeReview({ answers: ['B', 'C', 'C'] }), cfg });
    expect(f.status).toBe('fail');
    expect(f.reasons.join()).toMatch(/只有 1 次/);
  });
  test('2 詳解不支持答案：模型作答也不同意 → 淘汰；3 次作答都同意答案 → 只標待複核（單次判斷不能單獨淘汰）', async () => {
    const NO = GOOD.replace('EXPLANATION: YES', 'EXPLANATION: NO');
    const f = await L.gateLocalQA(q(), { review: fakeReview({ answers: ['B', 'B', 'C'], check: NO }), cfg });
    expect(f.status).toBe('fail');
    expect(f.reasons.join()).toMatch(/詳解不支持/);
    const r = await L.gateLocalQA(q(), { review: fakeReview({ check: NO }), cfg });
    expect(r.status).toBe('review');
    expect(r.review.join()).toMatch(/詳解不支持.*待複核/);
  });
  test('3 選項品質：單選題 CORRECT 填兩個字母 → 無效、重問，仍無效 → 不採用、待複核；以上皆是 → 淘汰（不呼叫模型）；沒有誘答力 → 只記錄（notes），仍通過', async () => {
    const two = fakeReview({ answers: ['B', 'D', 'B'], check: GOOD.replace('CORRECT: B', 'CORRECT: B, D') });
    const r2 = await L.gateLocalQA(q(), { review: two, cfg });
    expect(r2.status).toBe('review');
    expect(r2.review.join()).toMatch(/CORRECT 欄重問後仍無效/);
    expect(two.calls.filter((c) => /只寫一個字母。）$/.test(c.prompt))).toHaveLength(1);
    expect((await L.gateLocalQA(q(), { review: fakeReview({ check: GOOD.replace('CORRECT: B', 'CORRECT: B, D') }), cfg })).status).toBe('review');
    expect((await L.gateLocalQA(q(), { review: fakeReview({ check: GOOD.replace('CORRECT: B', 'CORRECT: D') }), cfg })).reasons.join()).toMatch(/正確選項是 D，答案是 B/);
    const lazy = fakeReview();
    const r = await L.gateLocalQA(q({ options: ['執政官', '護民官', '獨裁官', '以上皆是'] }), { review: lazy, cfg });
    expect(r.reasons.join()).toMatch(/偷懶選項/);
    expect(lazy.calls).toHaveLength(0);
    const absurd = await L.gateLocalQA(q(), { review: fakeReview({ check: GOOD.replace('ABSURD: NONE', 'ABSURD: D') }), cfg });
    expect(absurd.status).toBe('pass');
    expect(absurd.notes.join()).toMatch(/D 可能沒有誘答力/);
  });
  test('4 超出範圍（未佐證）→ 淘汰；3 次作答都同意 → 待複核', async () => {
    const OUT = GOOD.replace('SCOPE: IN', 'SCOPE: OUT');
    expect((await L.gateLocalQA(q(), { review: fakeReview({ answers: ['B', 'B', 'A'], check: OUT }), cfg })).reasons.join()).toMatch(/超出單元範圍/);
    expect((await L.gateLocalQA(q(), { review: fakeReview({ check: OUT }), cfg })).status).toBe('review');
  });
  test('5 題幹提到圖但沒有圖 → 淘汰；標記缺圖 → 淘汰；已用文字描述圖表 → 待複核', async () => {
    expect((await L.gateLocalQA(q({ question: '如圖所示，下列何者是保障平民的官職？' }), { review: fakeReview(), cfg })).reasons.join()).toMatch(/提到圖表但沒有圖/);
    expect(L.figureProblem(q({ question: '（依原課本附圖以文字描述）甲：…，下圖何者正確？', figureMissing: true }))).toBe('fail');
    const described = await L.gateLocalQA(q({ question: '依據下表羅馬官職的比較（執政官：統領軍隊；護民官：保障平民），下列何者保障平民？' }), { review: fakeReview(), cfg });
    expect(described.status).toBe('review');
    expect(described.review.join()).toMatch(/已用文字描述/);
    expect(L.figureProblem(q({ question: '如圖所示，下列何者正確？', figureSvg: '<svg/>' }))).toBeNull();
  });
  test('題目自帶科目（跨科目金標準）→ 審查提示用題目自己的科目', async () => {
    const review = fakeReview();
    await L.gateLocalQA(q({ subject: '數學' }), { review, cfg, meta: { subject: '歷史', grade: '高二' } });
    expect(review.calls.find((c) => /審查員/.test(c.prompt)).prompt).toMatch(/科目：數學/);
  });
  test('缺欄位：重問一次，仍缺 → 淘汰（fail-closed）；沒有審題模型 → 淘汰', async () => {
    const half = fakeReview({ check: 'EXPLANATION: YES\nCORRECT: B' });
    const r = await L.gateLocalQA(q(), { review: half, cfg });
    expect(r.reasons.join()).toMatch(/缺欄位：SCOPE、BLOOM/);
    expect(half.calls.filter((c) => /缺少欄位/.test(c.prompt))).toHaveLength(1);
    expect((await L.gateLocalQA(q(), { cfg })).status).toBe('fail');
  });
  test('CORRECT 欄解析：只接受符合題型的格式（11/28，cloud 11/27）', async () => {
    const single = q();
    const multi = q({ type: 'multiple_choice', answer: '(A)(C)' });
    expect(L.correctLetters('B', single)).toEqual({ letters: ['B'], invalid: false });
    expect(L.correctLetters('(B)', single)).toEqual({ letters: ['B'], invalid: false });
    expect(L.correctLetters('B, D', single).invalid).toBe(true);            // 單選只能一個字母
    expect(L.correctLetters('A,B,C,D', single).invalid).toBe(true);         // 一次列出全部選項
    expect(L.correctLetters('A,B,C,D', multi).invalid).toBe(true);
    expect(L.correctLetters('A, C', multi)).toEqual({ letters: ['A', 'C'], invalid: false });
    expect(L.correctLetters('E', single).invalid).toBe(true);               // 超出 4 個選項
    expect(L.correctLetters('我認為是 B', single).invalid).toBe(true);       // 不是純字母
    expect(L.checkPrompt(single, {})).toMatch(/單選題只寫一個字母/);
    expect(L.checkPrompt(multi, {})).toMatch(/所有選項字母/);
    // 第一次列出全部選項、重問後只回一個字母 → 採用重問結果，照常判斷
    let n = 0;
    const fixed = async (prompt) => (/ANSWER: 字母/.test(prompt) ? 'ANSWER: B'
      : (n++ === 0 ? GOOD.replace('CORRECT: B', 'CORRECT: A, B, C, D') : GOOD));
    const r = await L.gateLocalQA(q(), { review: fixed, cfg });
    expect(r.status).toBe('pass');
    expect(n).toBe(2);
  });
  test('漏檢反例會放進審查提示', () => {
    expect(L.checkPrompt(q(), {}, ['tm_1_q6：答案應為 C'])).toMatch(/過去本機審查放行、但後來被判定有錯[\s\S]*tm_1_q6/);
  });
});

describe('C 金標準', () => {
  const pool = [1, 2, 3, 4].map((i) => q({ id: `o${i}`, questionId: `o${i}`, questionSource: 'ORIGINAL' })).concat([q({ id: 'ai', questionId: 'ai', questionSource: 'AI_GENERATED' })]);
  test('只用有官方答案的原題；每題一份正本、一份答案被改錯的副本', () => {
    const items = L.buildGoldItems(pool, 2, () => 0.3);
    expect(items).toHaveLength(4);
    expect(items.filter((x) => x.gold === 'corrupted').every((x) => x.q.answer !== 'B')).toBe(true);
    expect(items.every((x) => /^gold_/.test(x.q.questionId))).toBe(true);
  });
  test('混入比例與計分：正本被淘汰＝誤判；改錯副本通過＝漏檢', () => {
    const items = L.buildGoldItems(pool, 4, () => 0.3);
    const { batch, goldIds } = L.mixGold(Array.from({ length: 16 }, (_, i) => q({ id: `r${i}`, questionId: `r${i}` })), items, 0.2, () => 0.5);
    const g = Object.keys(goldIds).length;
    expect(g / batch.length).toBeGreaterThanOrEqual(cfg.gold.minRatio);
    expect(g / batch.length).toBeLessThanOrEqual(cfg.gold.maxRatio);
    const s = L.scoreGold([{ id: 'gold_0_ok', status: 'fail' }, { id: 'gold_1_ok', status: 'pass' }, { id: 'gold_0_bad', status: 'pass' }, { id: 'gold_1_bad', status: 'fail' }],
      { gold_0_ok: 'correct', gold_1_ok: 'correct', gold_0_bad: 'corrupted', gold_1_bad: 'corrupted' });
    expect(s).toEqual({ correctItems: 2, falseRejectRate: 0.5, corruptedItems: 2, missRate: 0.5 });
  });
  test('缺原圖、題組拆散、詳解字母與答案不符的原題不能當金標準；金標準記下來源題號', () => {
    expect(L.goldEligible(q({ questionSource: 'ORIGINAL' }))).toBe(true);
    expect(L.goldEligible(q({ questionSource: 'ORIGINAL', question: '如圖，下列何者正確？', figureMissing: true }))).toBe(false);
    expect(L.goldEligible(q({ questionSource: 'ORIGINAL', question: '承上題，該官職的主要權力為何？' }))).toBe(false);
    expect(L.goldEligible(q({ questionSource: 'ORIGINAL', explanation: '因此正確答案為 C。' }))).toBe(false);
    expect(L.buildGoldItems(pool, 1, () => 0.3)[0].from).toMatch(/^o\d$/);
  });
});

/* 11/27 cloud：金標準是官方原題，被淘汰＝關卡誤殺。回歸測試：題庫裡每一題可當金標準的原題，
   遇到「答得出正確答案、但對詳解／範圍／選項很挑剔」的審題模型，都不得被淘汰；
   同一題答案被改錯的副本仍要被淘汰（漏檢不能因此變多）。 */
describe('金標準題不得被淘汰（全題庫回歸）', () => {
  const fs = require('fs');
  const path = require('path');
  const DIR = path.join(__dirname, '..', '..', '..', 'docs', 'TeachingMaterials', 'materials');
  const gold = fs.readdirSync(DIR).filter((d) => fs.existsSync(path.join(DIR, d, 'questionbank.json')))
    .flatMap((d) => JSON.parse(fs.readFileSync(path.join(DIR, d, 'questionbank.json'), 'utf8')).questions || [])
    .filter(L.goldEligible);
  const picky = (want) => fakeReview({ answers: [want], check: `EXPLANATION: NO\nCORRECT: ${want}, ${want === 'A' ? 'B' : 'A'}\nABSURD: A\nSCOPE: OUT\nBLOOM: 理解` });
  test('題庫有足夠的金標準原題', () => {
    expect(gold.length).toBeGreaterThan(500);
  });
  test('每一題金標準正本都不被淘汰；改錯副本都被淘汰', async () => {
    const killed = [], missed = [];
    for (const g of gold) {
      const want = L.answerLetter(g);
      // eslint-disable-next-line no-await-in-loop
      const ok = await L.gateLocalQA(g, { review: picky(want), cfg, meta: { subject: '歷史' } });
      if (ok.status === 'fail') killed.push(`${g.questionId}：${ok.reasons.join('；')}`);
      const wrong = 'ABCDEFGH'.split('').find((l) => l !== want);
      // eslint-disable-next-line no-await-in-loop
      const bad = await L.gateLocalQA(Object.assign({}, g, { answer: wrong }), { review: picky(want), cfg });
      if (bad.status !== 'fail') missed.push(g.questionId);
    }
    expect(killed).toEqual([]);
    expect(missed).toEqual([]);
  });
});

describe('關卡 6 Claude 抽樣與校準', () => {
  const rows = [
    ...Array.from({ length: 20 }, (_, i) => ({ id: `a${i}`, unit: 'U1', status: 'pass' })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `b${i}`, unit: 'U2', status: 'pass' })),
    { id: 'r1', unit: 'U1', status: 'review' }, { id: 'f1', unit: 'U1', status: 'fail' },
  ];
  test('每單元抽 10%（至少 1 題）＋所有待複核，淘汰的題目不抽', () => {
    const s = L.selectSample(rows, 0.1, () => 0.5);
    expect(s.sampled.filter((x) => x.startsWith('a'))).toHaveLength(2);
    expect(s.sampled.filter((x) => x.startsWith('b'))).toHaveLength(1);
    expect(s.review).toEqual(['r1']);
    expect(s.all).not.toContain('f1');
  });
  test('抽樣包與回覆解析；缺回覆的題號會列出', () => {
    const pack = L.buildClaudePack([{ id: 'a1', q: q(), note: '一致性 2/3' }]);
    expect(pack).toMatch(/Qa1[\s\S]*答案：\(B\)[\s\S]*本機 QA：一致性 2\/3/);
    const p = L.parseClaudeReview('Qa1：正確\nQa2：答案錯誤：應為 C，課本寫…\n完成', ['a1', 'a2', 'a3']);
    expect(p.verdicts.a2).toEqual({ verdict: '答案錯誤', note: '應為 C，課本寫…' });
    expect(p.missing).toEqual(['a3']);
  });
  test('抽到一題答案錯誤 → 該單元整批退回；漏檢率＝本機通過但 Claude 判錯 ÷ 抽到的本機通過題', () => {
    const r = L.applyClaudeReview(rows, { a1: { verdict: '答案錯誤' }, a2: { verdict: '正確' }, b1: { verdict: '正確' }, r1: { verdict: '正確' } });
    expect(r.units.find((u) => u.unit === 'U1')).toMatchObject({ returned: true, wrong: ['a1'] });
    expect(r.units.find((u) => u.unit === 'U2').returned).toBe(false);
    expect(r.missRate).toBeCloseTo(1 / 3);
  });
  test('抽樣比例：連續 3 批 < 2% → 5%；任一批 > 5% → 20% 並回報；其餘 10%', () => {
    expect(L.nextSamplingRate([], cfg).rate).toBe(0.1);
    expect(L.nextSamplingRate([{ missRate: 0.01 }, { missRate: 0 }, { missRate: 0.015 }], cfg).rate).toBe(0.05);
    expect(L.nextSamplingRate([{ missRate: 0.01 }, { missRate: 0 }], cfg).rate).toBe(0.1);
    const up = L.nextSamplingRate([{ missRate: 0 }, { missRate: 0.06 }], cfg);
    expect(up).toMatchObject({ rate: 0.2, escalate: true });
  });
});

describe('串接 1–6', () => {
  test('淘汰、待複核、通過、Bloom、金標準與抽樣都進報告', async () => {
    const SRC = '羅馬共和時期，平民爭取權益，設立護民官，可以否決對平民不利的法案。';
    const qs = [
      q({ id: 'ok', questionId: 'ok', explanation: '平民爭取權益，設立護民官。難度：易 出處：「平民爭取權益，設立護民官」' }),
      q({ id: 'leak', questionId: 'leak', options: ['執政官', '負責保障平民權益並可否決不利法案的護民官', '獨裁官', '監察官'], explanation: '設立護民官。難度：易 出處：「平民爭取權益，設立護民官」' }),
      q({ id: 'claim', questionId: 'claim', question: '羅馬共和時期，哪一個官職可以否決對平民不利的法案？', explanation: '凱撒在高盧戰爭中擴張了羅馬版圖。難度：易 出處：「平民爭取權益，設立護民官」' }),
    ];
    const goldPool = [1, 2, 3].map((i) => q({ id: `o${i}`, questionId: `o${i}`, questionSource: 'ORIGINAL' }));
    const review = fakeReview();
    const out = await runPipeline(qs, { review, sourceText: SRC, cfg, goldPool, meta: { subject: '歷史' }, rng: () => 0.5 });
    const st = Object.fromEntries(out.rows.map((r) => [r.id, r.status]));
    expect(st).toEqual({ ok: 'pass', leak: 'fail', claim: 'review' });
    expect(out.rows.find((r) => r.id === 'leak').failedAt).toBe('structure');
    expect(out.report.eliminated.structure).toBe(1);
    expect(out.report.bloom.counts['記憶']).toBe(2);
    expect(out.report.gold.corruptedItems).toBeGreaterThan(0);
    expect(out.sample.review).toEqual(['claim']);
    expect(out.goldRows.every((g) => /^gold_/.test(g.id))).toBe(true);
  });
});
