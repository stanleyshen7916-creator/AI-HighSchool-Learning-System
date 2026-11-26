'use strict';
/* AHS-QB1 品質關卡 1–4（platform/QualityGates.js）。模型全部用假的，不連 Ollama。 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { gateStructure, gateSource, gateBlind, createDedupeIndex, createEmbedCache, runGates, answerIndex, evidenceOf, difficultyOf, letterOf } = require('../platform/QualityGates');

const good = (over = {}) => Object.assign({
  id: 'tm_x_q1', type: 'single_choice', question: '希臘神話與歐洲文化有什麼關聯？',
  options: ['政治制度的起源', '基督教教義的來源', '羅馬法的核心', '藝術創作的重要題材'],
  answer: '藝術創作的重要題材', difficulty: '易', knowledgePoint: '1-1 眾神國度',
  explanation: '課本說神話是藝術題材。出處：第1章「希臘神話豐富的故事性是歐洲文化藝術的創作題材」',
}, over);
const SOURCE = '神話孕育著文化的根源，如希臘神話豐富的故事性是歐洲文化藝術的創作題材。';

describe('answerIndex / evidenceOf / difficultyOf / letterOf', () => {
  test('answer as text, letter or labelled option', () => {
    expect(answerIndex(good())).toBe(3);
    expect(answerIndex(good({ answer: 'B' }))).toBe(1);
    expect(answerIndex(good({ options: ['(A) 甲', '(B) 乙'], answer: '(B) 乙' }))).toBe(1);
    expect(answerIndex(good({ answer: '不存在' }))).toBe(-1);
  });
  test('evidence from quote field or the 出處 part of the explanation', () => {
    expect(evidenceOf(good())).toBe('希臘神話豐富的故事性是歐洲文化藝術的創作題材');
    expect(evidenceOf(good({ quote: '原文一句話在這裡' }))).toBe('原文一句話在這裡');
    expect(evidenceOf(good({ explanation: '沒有出處的詳解' }))).toBe('');
  });
  test('difficulty from the field or from 難度： in old explanations', () => {
    expect(difficultyOf(good())).toBe('易');
    expect(difficultyOf(good({ difficulty: undefined, explanation: '詳解。難度：中 出處：…' }))).toBe('中');
    expect(difficultyOf(good({ difficulty: undefined }))).toBeNull();
  });
  test('letterOf reads ANSWER: X or a bare letter', () => {
    expect(letterOf('想一想…\nANSWER: C')).toBe('C');
    expect(letterOf('B')).toBe('B');
    expect(letterOf('我不確定')).toBeNull();
  });
});

describe('gate 1 structure', () => {
  test('a complete question passes', () => { expect(gateStructure(good())).toEqual([]); });
  test.each([
    ['duplicate options', { options: ['甲', '甲', '丙', '丁'], answer: '丙' }, '選項重複'],
    ['answer matches no option', { answer: '戊' }, '答案對不到恰好一個選項'],
    ['missing explanation', { explanation: '' }, '缺詳解'],
    ['missing chapter tag', { knowledgePoint: '', section: '' }, '缺章節標籤'],
    ['missing difficulty', { difficulty: undefined }, '缺難度標籤'],
    ['bad difficulty', { difficulty: '超難' }, '難度標籤不正確：超難'],
    ['figure flagged missing', { figureMissing: true }, '引用附圖但沒有圖'],
    ['stem says 如圖 without a figure', { question: '如圖所示，下列何者正確？' }, '引用附圖但沒有圖'],
    ['not a choice question', { type: 'essay' }, '題型 essay 不在本關卡範圍（只檢查選擇題）'],
  ])('%s', (_n, over, reason) => { expect(gateStructure(good(over))).toContain(reason); });
  test('a figure that is present is fine', () => {
    expect(gateStructure(good({ question: '如圖所示，下列何者正確？', figureSvg: '<svg/>' }))).toEqual([]);
  });
});

describe('gate 2 source', () => {
  test('no evidence fails without calling the model', async () => {
    const judge = jest.fn();
    expect(await gateSource(good({ explanation: '沒有出處的詳解很長' }), { judge })).toEqual(['缺教材原文依據']);
    expect(judge).not.toHaveBeenCalled();
  });
  test('evidence that is not in the source text is treated as made up', async () => {
    expect(await gateSource(good({ quote: '課本裡根本沒有這一句話喔' }), { sourceText: SOURCE })).toEqual(['依據不在教材原文裡（可能是模型捏造）']);
  });
  test('model says the answer follows from the evidence', async () => {
    const judge = jest.fn(async () => '可以推出。\nVERDICT: YES');
    expect(await gateSource(good(), { sourceText: SOURCE, judge })).toEqual([]);
    expect(judge.mock.calls[0][0]).toContain('希臘神話豐富的故事性');
    expect(judge.mock.calls[0][0]).toContain('答案：(D)');
  });
  test('model says no / gives no verdict', async () => {
    expect(await gateSource(good(), { judge: async () => 'VERDICT: NO' })).toEqual(['依據推不出答案']);
    expect(await gateSource(good(), { judge: async () => '嗯' })).toEqual(['出處判定沒有結論']);
  });
});

describe('gate 3 blind', () => {
  test('the prompt never shows the answer or the explanation', async () => {
    const answer = jest.fn(async () => 'ANSWER: D');
    expect(await gateBlind(good(), { answer })).toEqual([]);
    const p = answer.mock.calls[0][0];
    expect(p).not.toContain('課本說神話是藝術題材');
    expect(p).not.toMatch(/答案[:：]/);
  });
  test('a different letter fails, no letter fails', async () => {
    expect(await gateBlind(good(), { answer: async () => 'ANSWER: A' })).toEqual(['盲答選 A，答案是 D']);
    expect(await gateBlind(good(), { answer: async () => '不知道' })).toEqual(['盲答沒有給出選項']);
  });
});

describe('gate 4 dedupe', () => {
  test('bigram similarity catches a near copy, not a different question', async () => {
    const idx = createDedupeIndex();
    await idx.add(good({ id: 'old_1' }));
    expect((await idx.check(good({ id: 'new_1', question: '希臘神話與歐洲文化有何關聯？' }))).reasons[0]).toMatch(/與 old_1 太相似/);
    expect((await idx.check(good({ id: 'new_2', question: '羅馬共和時期的護民官有什麼職權？', options: ['否決權', '鑄幣權', '宣戰權', '徵稅權'], answer: '否決權' }))).reasons).toEqual([]);
  });
  test('an embedding function is used when given', async () => {
    const embed = jest.fn(async (t) => (t.includes('甲') ? [1, 0] : [0.99, 0.1]));
    const idx = createDedupeIndex({ embed, threshold: 0.95 });
    await idx.add(good({ id: 'old', question: '甲甲甲甲甲甲' }));
    expect((await idx.check(good({ id: 'new', question: '乙乙乙乙乙乙' }))).reasons[0]).toMatch(/與 old 太相似/);
    expect(embed).toHaveBeenCalledTimes(2);
  });
  test('a question is never a duplicate of itself', async () => {
    const idx = createDedupeIndex();
    await idx.add(good());
    expect((await idx.check(good())).reasons).toEqual([]);
  });
});

describe('embedding cache (gate 4, bge-m3)', () => {
  const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qg-cache-')), 'bge-m3.json');
  test('the same text is embedded once, the vector survives a save and reload', async () => {
    const file = tmp();
    const embed = jest.fn(async (t) => [t.length, 0.5, -0.25]);
    const c1 = createEmbedCache(embed, { file, model: 'bge-m3' });
    expect(await c1.embed('甲乙丙')).toEqual([3, 0.5, -0.25]);
    expect(await c1.embed('甲乙丙')).toEqual([3, 0.5, -0.25]);
    expect(embed).toHaveBeenCalledTimes(1);
    expect(c1.save()).toBe(true);
    expect(c1.save()).toBe(false);                     // nothing new to write
    const c2 = createEmbedCache(embed, { file, model: 'bge-m3' });
    expect(await c2.embed('甲乙丙')).toEqual([3, 0.5, -0.25]);
    expect(embed).toHaveBeenCalledTimes(1);
    expect(c2.stats()).toEqual({ hits: 1, misses: 0, size: 1 });
  });
  test('a cache made with another model is ignored', async () => {
    const file = tmp();
    const c1 = createEmbedCache(async () => [1, 2], { file, model: 'old-model' });
    await c1.embed('文字');
    c1.save();
    const embed = jest.fn(async () => [3, 4]);
    expect(await createEmbedCache(embed, { file, model: 'bge-m3' }).embed('文字')).toEqual([3, 4]);
    expect(embed).toHaveBeenCalledTimes(1);
  });
  test('runGates uses the cached embed for dedupe', async () => {
    const embed = jest.fn(async (t) => (t.includes('希臘') ? [1, 0] : [0, 1]));
    const cache = createEmbedCache(embed);
    const { results } = await runGates([good({ id: 'new', question: '希臘神話與歐洲文化有何關聯？' })], { embed: cache.embed, existing: [good({ id: 'old' })] });
    expect(results[0]).toMatchObject({ failedAt: 'dedupe' });
    expect(results[0].reasons[0]).toMatch(/與 old 太相似（1\.00）/);
  });
});

describe('runGates', () => {
  test('stops at the first failing gate, counts eliminations, reports pass rate', async () => {
    const answer = jest.fn(async (p) => (p.includes('護民官') ? 'ANSWER: B' : 'ANSWER: D'));
    const judge = jest.fn(async () => 'VERDICT: YES');
    const qs = [
      good({ id: 'a' }),
      good({ id: 'b', explanation: '' }),                                   // gate 1
      good({ id: 'c', explanation: '沒有出處但很長的詳解' }),                 // gate 2
      good({ id: 'd', question: '羅馬共和時期的護民官有什麼職權？', options: ['否決權', '鑄幣權', '宣戰權', '徵稅權'], answer: '否決權' }), // gate 3
      good({ id: 'e', question: '希臘神話與歐洲文化有何關聯？' }),          // gate 4 (duplicate of a)
    ];
    const { results, report } = await runGates(qs, { judge, answer });
    expect(results.map((r) => r.failedAt)).toEqual([null, 'structure', 'source', 'blind', 'dedupe']);
    expect(report).toEqual({ generated: 5, eliminated: { structure: 1, source: 1, blind: 1, dedupe: 1 }, passed: 1, passRate: 0.2 });
    expect(judge).toHaveBeenCalledTimes(3);           // a, d, e — b and c stopped before gate 2's model call
  });
  test('existing bank questions take part in dedupe', async () => {
    const { results } = await runGates([good({ id: 'new' })], { existing: [good({ id: 'old' })] });
    expect(results[0]).toMatchObject({ passed: false, failedAt: 'dedupe' });
  });
  test('a model error eliminates the question with the reason, the run goes on', async () => {
    const { results } = await runGates([good({ id: 'x' }), good({ id: 'y', question: '完全不同的另一題題目內容？' })], {
      judge: async () => { throw new Error('timeout'); },
    });
    expect(results.map((r) => r.reasons[0])).toEqual(['關卡執行錯誤：timeout', '關卡執行錯誤：timeout']);
  });
});
