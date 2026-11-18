// 2026-11-18 AHS-UP2 P1-6b：審議管線辨識數理科章節標題（同圈號接受別名）。
const { extractSectionsFromDraft } = require('../services/multiAi');

const STEM_DRAFT = [
  '## ①核心概念', '核心A',
  '## ②章節摘要', '摘要B',
  '## ③重要定義與公式', '公式C',
  '## ④例題與解題步驟', '例題D',
  '## ⑤計算技巧與驗算', '技巧E',
  '## ⑥圖形與符號說明', '符號F',
  '## ⑦前置知識與單位', '先備G',
  '## ⑧公式推導脈絡', '推導H',
  '## ⑪常考題型', '題目I',
].join('\n');

describe('extractSectionsFromDraft 章節別名', () => {
  test('數理科標題：③～⑧ 各自成為獨立小節，不再被併進②章節摘要', () => {
    const s = extractSectionsFromDraft(STEM_DRAFT);
    expect(s['②章節摘要']).toBe('摘要B');
    expect(s['③重點詞彙']).toBe('公式C');
    expect(s['④文意理解']).toBe('例題D');
    expect(s['⑤修辭手法']).toBe('技巧E');
    expect(s['⑥文化脈絡']).toBe('符號F');
    expect(s['⑦作者背景']).toBe('先備G');
    expect(s['⑧段落結構']).toBe('推導H');
    expect(s['⑪常考題型']).toBe('題目I');
  });

  test('國文標題完全不受影響', () => {
    const chinese = ['## ③重點詞彙', 'A', '## ④文意理解', 'B', '## ⑤修辭手法', 'C'].join('\n');
    const s = extractSectionsFromDraft(chinese);
    expect(s['③重點詞彙']).toBe('A');
    expect(s['④文意理解']).toBe('B');
    expect(s['⑤修辭手法']).toBe('C');
  });

  test('標題前後有冒號、破折號、空白也能辨識；別名必須對上圈號（⑤的別名放在③不算）', () => {
    const s = extractSectionsFromDraft(['## ③：重要定義與公式', 'X', '## ③計算技巧與驗算', 'Y'].join('\n'));
    expect(s['③重點詞彙']).toContain('X');
    // ③ 底下的「計算技巧與驗算」是⑤的別名，圈號不符 → 不是新小節，內容併回前一節
    expect(s['⑤修辭手法']).toBe('');
    expect(s['③重點詞彙']).toContain('計算技巧與驗算');
  });
});
