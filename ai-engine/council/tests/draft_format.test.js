'use strict';
/* 2026-11-28 AHS-B1：本機初稿格式檢查（services/draftFormat.js）。 */
const F = require('../services/draftFormat');

const TITLES = ['核心概念', '章節摘要', '重點詞彙', '文意理解', '修辭手法', '文化脈絡', '作者背景', '段落結構',
  '延伸思考', '易混淆概念', '常考題型', '易錯陷阱', '跨課連結', 'Cross Review', 'Final Score'];
const q = (k, n, o = {}) => [
  `**${k}${n}.** 題幹 ${n}`,
  o.noOptions ? '' : '(A) 甲　(B) 乙　(C) 丙　(D) 丁',
  o.noAnswer ? '' : '答案：B',
  o.noExplanation ? '' : '詳解：因為乙。',
].filter(Boolean).join('\n');
function draft({ sections = 15, heading = (i, t) => `## ${F.CIRCLED[i]}${t}`, questions = 30, variants = 30, variantOpts = {} } = {}) {
  const out = [];
  for (let i = 0; i < sections; i += 1) {
    out.push(heading(i, TITLES[i]));
    out.push(i === 10 ? Array.from({ length: questions }, (_, j) => q('Q', j + 1)).join('\n\n') : `${TITLES[i]}的內容。`);
  }
  out.push('## 變式題');
  out.push(Array.from({ length: variants }, (_, j) => q('V', j + 1, variantOpts)).join('\n\n'));
  return out.join('\n\n');
}

describe('本機初稿格式檢查', () => {
  test('完整初稿 → ok，不需要補寫', () => {
    const r = F.checkDraft(draft());
    expect(r.ok).toBe(true);
    expect(r.missingSections).toEqual([]);
    expect(r.questions.found).toBe(30);
    expect(r.variants.found).toBe(30);
    expect(F.repairPrompt('原提示', r)).toBeNull();
  });
  test('11/26 A3 實跑情況：只寫 12 節、變式題只有題幹、標題層級混用 → 全部抓到', () => {
    const text = draft({ sections: 12, heading: (i, t) => (i % 2 ? `# ${F.CIRCLED[i]}${t}` : `${F.CIRCLED[i]}${t}`),
      variantOpts: { noOptions: true, noAnswer: true, noExplanation: true } });
    const r = F.checkDraft(text);
    expect(r.ok).toBe(false);
    expect(r.missingSections).toEqual(['⑬跨課連結', '⑭Cross Review', '⑮Final Score']);
    expect(r.mixedHeadings).toBe(true);
    expect(r.variants.incomplete).toHaveLength(30);
    expect(r.variants.incomplete[0]).toBe('V1（缺選項、答案、詳解）');
    const p = F.repairPrompt('原提示', r);
    expect(p).toMatch(/^原提示/);
    expect(p).toMatch(/缺少章節：⑬跨課連結、⑭Cross Review、⑮Final Score/);
    expect(p).toMatch(/變式題欄位不全：V1（缺選項、答案、詳解）/);
    expect(p).not.toMatch(/標題格式不一致/);   // 標題格式只記錄，不為它補寫
    expect(F.summary(r).join()).toMatch(/章節標題格式不一致/);
  });
  test('缺題與單題缺詳解', () => {
    const text = draft({ questions: 28 }).replace('**Q3.** 題幹 3\n(A) 甲　(B) 乙　(C) 丙　(D) 丁\n答案：B\n詳解：因為乙。', '**Q3.** 題幹 3\n(A) 甲　(B) 乙　(C) 丙　(D) 丁\n答案：B');
    const r = F.checkDraft(text);
    expect(r.questions.absent).toEqual(['Q29', 'Q30']);
    expect(r.questions.incomplete).toEqual(['Q3（缺詳解）']);
  });
  test('補寫內容接在原稿後面，接上後重新檢查會通過', () => {
    const partial = draft({ variants: 20 });
    const r1 = F.checkDraft(partial);
    expect(r1.variants.absent).toHaveLength(10);
    const extra = Array.from({ length: 10 }, (_, j) => q('V', j + 21)).join('\n\n');
    const r2 = F.checkDraft(F.appendRepair(partial, `## 變式題\n${extra}`));
    expect(r2.ok).toBe(true);
  });
  test('# ① 與 **①** 寫法也算章節（與 multiAi 解析一致）', () => {
    const r = F.checkDraft(draft({ heading: (i, t) => `**${F.CIRCLED[i]}${t}**` }));
    expect(r.missingSections).toEqual([]);
    expect(r.headingStyles).toEqual(['**①']);
  });
});
