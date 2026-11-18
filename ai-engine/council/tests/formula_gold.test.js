// 2026-11-18 AHS-UP2 M2：公式標準答案比對。
const { normalizeLatex, similarity, evaluateFormulas } = require('../services/formulaGold');
const gold = require('./fixtures/formula_gold.json');

describe('formulaGold', () => {
  test('正規化忽略空白、left/right、displaystyle、大括號、結尾標點', () => {
    expect(normalizeLatex('\\frac { 1 } { 2 } .')).toBe(normalizeLatex('\\dfrac{1}{2}'));
    expect(normalizeLatex('\\left( x \\right)')).toBe('(x)');
  });

  test('相似度：相同為 1，差一個符號略低', () => {
    expect(similarity('\\sin x', '\\sin{x}')).toBe(1);
    expect(similarity('\\sin x+1', '\\sin x-1')).toBeLessThan(1);
  });

  test('evaluateFormulas：缺漏算失敗、依門檻判定', () => {
    const items = [{ source: 'a', index: 0, page: 1, latex: 'x=1' }, { source: 'a', index: 1, page: 1, latex: 'y=2' }];
    const r = evaluateFormulas(items, { a: ['x = 1'] });
    expect(r.passed).toBe(1);
    expect(r.results[1].missing).toBe(true);
  });

  test('標準答案檔結構：17 組、每組有來源／順序／頁碼／LaTeX', () => {
    expect(gold.items).toHaveLength(17);
    gold.items.forEach((g) => {
      expect(typeof g.latex).toBe('string');
      expect(Number.isInteger(g.index)).toBe(true);
      expect(Number.isInteger(g.page)).toBe(true);
    });
  });
});
