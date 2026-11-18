// 2026-11-18 AHS-UP2 P1-5：品質閘（逐頁可信度）。
const { assessPages, equationLooksGarbled } = require('../services/pageQuality');

const t = (page_idx, text) => ({ type: 'text', text, page_idx });

describe('assessPages', () => {
  test('正常頁不標記', () => {
    const r = assessPages([t(0, '弧度量中，弧長等於半徑乘以圓心角'), { type: 'equation', text: '$$ s = r \\theta $$', page_idx: 0 }]);
    expect(r.lowPages).toEqual([]);
    expect(r.suspectPages).toEqual([]);
    expect(r.needsOriginalRatio).toBe(0);
  });

  test('中間缺頁（MinerU 沒辨識到內容）列為低信心', () => {
    const r = assessPages([t(0, '第一頁文字內容'), t(2, '第三頁文字內容')]);
    expect(r.totalPages).toBe(3);
    expect(r.lowPages.map((p) => p.page)).toEqual([2]);
    expect(r.needsOriginalRatio).toBeCloseTo(0.333, 2);
  });

  test('只有圖片沒有文字：低信心', () => {
    const r = assessPages([{ type: 'image', img_path: 'images/a.jpg', page_idx: 0 }]);
    expect(r.lowPages[0].reasons.join('')).toMatch(/只有圖片/);
  });

  test('含假名的文字：扣分並列入抽查', () => {
    const r = assessPages([t(0, '已知銳角三角形 ABC バーグ 的外接圓半徑為 8 求 sin 的值')]);
    expect(r.suspectPages[0].reasons.join('')).toMatch(/假名/);
  });

  test('單一疑似錯誤公式只列抽查，不強制要原檔', () => {
    const r = assessPages([t(0, '文字內容足夠長度的一段說明'), { type: 'equation', text: '$$ \\frac { \\sin } { \\cos \\theta } $$', page_idx: 0 }]);
    expect(r.lowPages).toEqual([]);
    expect(r.suspectPages[0].page).toBe(1);
  });

  test('壞資料不丟例外', () => {
    expect(assessPages(null).totalPages).toBe(0);
    expect(assessPages([null, {}, { type: 'text' }]).totalPages).toBe(0);
  });
});

describe('equationLooksGarbled', () => {
  test('大括號不成對、三角函數缺引數、陣列大半是空格', () => {
    expect(equationLooksGarbled('\\frac { 1 } { 2')).toBe(true);
    expect(equationLooksGarbled('\\frac { \\sin } { \\cos \\theta }')).toBe(true);
    expect(equationLooksGarbled('\\begin{array} { l } { } & { } & { } & { } & { } & { x } \\\\ { } \\end{array}')).toBe(true);
    expect(equationLooksGarbled('s = r \\theta')).toBe(false);
  });
});
