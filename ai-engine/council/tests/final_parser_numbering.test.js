const { parseFinal } = require('../platform/FinalParser');

// 2026-10-06：三方初稿各自從 Q1 編號。過去題號重複只保留第一題（3×10 題只剩 10 題）；
// 現在改編到最後，題幹相同才視為重複，重編號的題目必須有寫在題目下方的答案。
const q = (n, stem, answer = 'B') => `**Q${n}.** ${stem}\n(A) 甲　(B) 乙　(C) 丙　(D) 丁\n答案：${answer}\n詳解：因為${stem}`;

describe('FinalParser 三方練習題合併', () => {
  test('題號重複時改編號收錄，題幹相同不重複收錄', () => {
    const md = ['# T', '## ⑪常考題型',
      q(1, '題目一'), q(2, '題目二'),
      q(1, '題目三'), q(2, '題目一'),
      q(1, '題目四', 'C'),
    ].join('\n\n');
    const r = parseFinal(md);
    expect(r.questions.map((x) => [x.number, x.question, x.answer])).toEqual([
      [1, '題目一', '乙'], [2, '題目二', '乙'], [3, '題目三', '乙'], [4, '題目四', '丙'],
    ]);
    expect(r.warnings.some((w) => /與 Q1 題幹相同/.test(w))).toBe(true);
  });

  test('重編號的題目沒有寫在題目下方的答案時不收錄（避免套到別家同號題目的答案）', () => {
    const md = ['# T', '## ⑪常考題型', q(1, '題目一'),
      '**Q1.** 題目二\n(A) 甲　(B) 乙　(C) 丙　(D) 丁',
      '## 答案', '1. B'].join('\n\n');
    const r = parseFinal(md);
    expect(r.questions.map((x) => x.question)).toEqual(['題目一']);
    expect(r.warnings.some((w) => /答案沒有寫在題目下方/.test(w))).toBe(true);
  });
});
