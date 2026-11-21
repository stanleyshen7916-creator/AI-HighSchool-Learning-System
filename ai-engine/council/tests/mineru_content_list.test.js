// 2026-11-18 AHS-UP2 P1-1：MinerU content_list.json 分流。
const { splitContentList, stripLatexDelimiters } = require('../services/mineruContentList');

const LIST = [
  { type: 'text', text: '弧度量中，弧長 s 等於半徑乘以圓心角', page_idx: 0 },
  { type: 'equation', text: '$$\ns { = } r \theta \ .\n$$', text_format: 'latex', page_idx: 0 },
  { type: 'text', text: '如右圖所示', page_idx: 0 },
  { type: 'image', img_path: 'images/abc.jpg', image_caption: ['圖一'], image_footnote: [], page_idx: 1 },
  { type: 'table', img_path: 'images/t.jpg', table_caption: [], table_body: '<table><tr><td>1</td></tr></table>', page_idx: 2 },
  { type: 'table', img_path: 'images/t2.jpg', table_body: '', page_idx: 2 },
  { type: 'discarded', text: '頁碼', page_idx: 2 },
  { type: 'equation', text: '$$ $$', page_idx: 2 },
];

describe('splitContentList', () => {
  const r = splitContentList(LIST);

  test('equation 取 LaTeX（去掉 $$）、頁碼 1 起算、帶前後文', () => {
    expect(r.equations).toHaveLength(1);
    expect(r.equations[0].latex).toBe('s { = } r \theta \ .');
    expect(r.equations[0].page).toBe(1);
    expect(r.equations[0].before).toMatch(/弧長/);
    expect(r.equations[0].after).toBe('如右圖所示');
  });

  test('image 取切圖檔名與圖說；table 取 HTML 並保留切圖', () => {
    expect(r.images[0]).toMatchObject({ file: 'abc.jpg', page: 2, caption: '圖一' });
    expect(r.tables[0].html).toContain('<table>');
    expect(r.tables[1]).toMatchObject({ html: '', image: 't2.jpg' });
  });

  test('統計與總頁數；discarded 只計數、空 LaTeX 不收', () => {
    expect(r.counts).toEqual({ equations: 1, tables: 2, images: 1, discarded: 1 });
    expect(r.pages).toBe(3);
  });

  test('非陣列／壞資料不丟例外', () => {
    expect(splitContentList(null).counts.images).toBe(0);
    expect(splitContentList([null, 3, {}]).pages).toBe(0);
  });

  test('stripLatexDelimiters', () => {
    expect(stripLatexDelimiters('$x$')).toBe('x');
  });
});
