const { parseFinal } = require('../platform/FinalParser');

// 2026-11-19 AHS-UP2 P2-2：詳解擴充標記（規格 Specifications_ExplanationSupplementUpload_v0.1.md）
const head = (n = 1) => `**Q${n}.** 若 sinθ = 3/5，θ 為銳角，則 tanθ = ？\n(A) 3/4　(B) 4/3　(C) 3/5　(D) 4/5\n答案：A\n`;
const parse = (explanationBlock) => parseFinal(['# T', '## ⑪常考題型', head() + explanationBlock].join('\n\n'));
const first = (r) => r.questions[0];
const supplementWarnings = (r) => r.warnings.filter((w) => /詳解擴充/.test(w));

describe('FinalParser 詳解擴充', () => {
  test('完整標記：拆出解題關鍵、步驟、易錯、補充，扁平詳解照舊保留', () => {
    const r = parse([
      '詳解：', '解題關鍵：由 sinθ 求對邊與斜邊，再補鄰邊。', '步驟：',
      '(1) 設對邊 3、斜邊 5。', '(2) 鄰邊 = √(5² − 3²) = 4。', '(3) tanθ = 3/4。',
      '易錯：把 tanθ 寫成 鄰邊/對邊。', '易錯：忘了開根號。', '補充：可用 3-4-5 直角三角形驗算。',
    ].join('\n'));
    expect(first(r).explanationSupplement).toEqual({
      concept: '由 sinθ 求對邊與斜邊，再補鄰邊。',
      steps: ['設對邊 3、斜邊 5。', '鄰邊 = √(5² − 3²) = 4。', 'tanθ = 3/4。'],
      pitfalls: ['把 tanθ 寫成 鄰邊/對邊。', '忘了開根號。'],
      note: '可用 3-4-5 直角三角形驗算。',
    });
    expect(first(r).explanation).toMatch(/解題關鍵.*步驟.*易錯/);
    expect(supplementWarnings(r)).toEqual([]);
  });

  test('舊格式（單行詳解、只有易錯）不產生補強也不警告', () => {
    const a = parse('詳解：tanθ = 對邊/鄰邊 = 3/4。');
    const b = parse('詳解：\n(1) 設對邊 3。\n(2) 鄰邊 4。\n(3) tanθ = 3/4。\n易錯：把對邊鄰邊弄反。');
    [a, b].forEach((r) => {
      expect(first(r).explanationSupplement).toBeUndefined();
      expect(supplementWarnings(r)).toEqual([]);
    });
    expect(first(a).explanation).toBe('tanθ = 對邊/鄰邊 = 3/4。');
  });

  test('缺解題關鍵：整題不產生補強並警告', () => {
    const r = parse('詳解：\n步驟：\n(1) 甲。\n(2) 乙。');
    expect(first(r).explanationSupplement).toBeUndefined();
    expect(supplementWarnings(r)[0]).toMatch(/Q1：詳解擴充不完整（缺解題關鍵）/);
  });

  test('步驟不足 2 步：不產生補強並警告（題目本身仍收錄）', () => {
    const r = parse('詳解：\n解題關鍵：重點。\n步驟：\n(1) 只有一步。');
    expect(r.questions).toHaveLength(1);
    expect(first(r).explanationSupplement).toBeUndefined();
    expect(supplementWarnings(r)[0]).toMatch(/步驟不足 2 步/);
  });

  test('步驟編號跳號或重複視為排版錯誤，不產生補強', () => {
    ['(1) 甲。\n(3) 乙。', '(1) 甲。\n(1) 乙。'].forEach((steps) => {
      const r = parse('詳解：\n解題關鍵：重點。\n步驟：\n' + steps);
      expect(first(r).explanationSupplement).toBeUndefined();
      expect(supplementWarnings(r)[0]).toMatch(/步驟編號不連續/);
    });
  });

  test('標記出現在行中不算；多行步驟與其他編號寫法', () => {
    const mid = parse('詳解：先看題目，易錯：這句在行中不是標記。');
    expect(first(mid).explanationSupplement).toBeUndefined();
    expect(supplementWarnings(mid)).toEqual([]);
    const r = parse('詳解：\n**解題關鍵：** 重點。\n**步驟：**\n1. 第一步\n   接續說明\n2) 第二步');
    expect(first(r).explanationSupplement.steps).toEqual(['第一步 接續說明', '第二步']);
    const circled = parse('詳解：\n解題關鍵：重點。\n步驟：\n① 甲\n② 乙\n③ 丙');
    expect(first(circled).explanationSupplement.steps).toEqual(['甲', '乙', '丙']);
  });

  test('知識點／難度行結束詳解區塊，不被併入補強', () => {
    const r = parse('詳解：\n解題關鍵：重點。\n步驟：\n(1) 甲。\n(2) 乙。\n易錯：錯一。\n知識點：三角函數\n難度：易');
    expect(first(r).explanationSupplement.pitfalls).toEqual(['錯一。']);
    expect(first(r).knowledgePoint).toBe('三角函數');
    expect(first(r).difficulty).toBe('易');
  });

  test('變式題本期不產生補強', () => {
    const md = ['# T', '## ⑪常考題型', head() + '詳解：解。', '## 變式題',
      '**V1.** 若 cosθ = 4/5，θ 為銳角，則 tanθ = ？\n(A) 3/4　(B) 4/3　(C) 3/5　(D) 4/5\n答案：A\n詳解：\n解題關鍵：重點。\n步驟：\n(1) 甲。\n(2) 乙。'].join('\n\n');
    const r = parseFinal(md);
    expect(r.variants).toHaveLength(1);
    expect(r.variants[0].explanationSupplement).toBeUndefined();
  });
});
