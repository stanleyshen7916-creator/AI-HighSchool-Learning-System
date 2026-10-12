// 2026-10-12 審議改版第 1 階段：練習題自動裁決＋Claude 最終審查包。
const {
  adjudicatePractice, renderPracticeBlock, buildClaudeReviewPrompt, applyClaudeReview, replacePracticeBlock,
} = require('../services/practiceAdjudicator');
const { parseQuestionText, parseFinal } = require('../platform/FinalParser');

const SOURCE = '弧長公式 s = rθ，其中 θ 以弳為單位。扇形面積為二分之一 r 平方 θ。';
const q = (n, stem, opts, ans) => [`**Q${n}.** ${stem}`, ...opts.map((o, i) => `(${'ABCD'[i]}) ${o}`), `答案：${ans}`, ''].join('\n');

const drafts = {
  chatgpt: [
    q(1, '半徑 2、圓心角 3 弳的弧長為何？', ['5', '6', '8', '12'], 'B'),
    q(2, '扇形面積公式為何？', ['rθ', '½r²θ', 'r²θ', '2rθ'], 'B'),
    q(3, '選項重複的題目？', ['甲', '甲', '乙', '丙'], 'C'),
  ].join('\n'),
  gemini: q(1, '扇形面積公式為何？', ['rθ', '½r²θ', 'r²θ', '2rθ'], 'C'),
  claude: q(1, '弧長公式中 θ 的單位為何？', ['度', '弳', '百分度', '轉'], 'B'),
};

function fakeModel(answers) {
  return {
    callModel: async (prompt) => {
      const stem = Object.keys(answers).find((k) => prompt.includes(k));
      return JSON.stringify({ answer: stem ? answers[stem] : null, quoted_source_span: '弧長公式 s = rθ', reason: 'test' });
    },
    fitSource: (build) => ({ prompt: build(SOURCE) }),
  };
}

describe('practiceAdjudicator', () => {
  test('格式、三方比對、Qwen 獨立作答依序判斷', async () => {
    const r = await adjudicatePractice(drafts, SOURCE, fakeModel({ '弧長為何': 'B', 'θ 的單位': 'C' }));
    expect(r.total).toBe(4);
    expect(r.accepted.map((x) => x.question)).toEqual(['半徑 2、圓心角 3 弳的弧長為何？']);
    const reasons = r.pending.map((p) => p.reason).join('\n');
    expect(reasons).toMatch(/三方答案不一致（ChatGPT：B、Gemini：C）/);
    expect(reasons).toMatch(/格式不符：選項內容重複/);
    expect(reasons).toMatch(/Qwen 獨立作答為 \(C\)，初稿答案為 \(B\)/);
    expect(r.accepted[0].checks.quote).toBe('弧長公式 s = rθ');
  });

  test('模型呼叫失敗時不收錄，列入待審', async () => {
    const r = await adjudicatePractice({ chatgpt: drafts.claude }, SOURCE, {
      callModel: async () => { throw Object.assign(new Error('x'), { reason: 'OLLAMA_TIMEOUT' }); },
      fitSource: (build) => ({ prompt: build(SOURCE) }),
    });
    expect(r.accepted).toHaveLength(0);
    expect(r.pending[0].reason).toMatch(/Qwen 作答失敗（OLLAMA_TIMEOUT）/);
  });

  test('收錄區塊可被 FinalParser 讀回，答案正確', async () => {
    const r = await adjudicatePractice(drafts, SOURCE, fakeModel({ '弧長為何': 'B', 'θ 的單位': 'B' }));
    const block = renderPracticeBlock(r.accepted, r.pending.length);
    const parsed = parseQuestionText(block).questions;
    expect(parsed.map((x) => x.answer)).toEqual(['6', '弳']);
    const md = `---\nschool: 長榮中學\n---\n# T\n\n## ⑪常考題型\n\n${block}\n\n## ⑮Final Score\n\nx\n`;
    expect(parseFinal(md).questions).toHaveLength(2);
  });

  test('Claude 審查包與回覆套用：正確／答案應為／刪除／無法判斷／未回覆', () => {
    const base = { options: ['甲', '乙', '丙', '丁'], answer: '乙', origins: ['ChatGPT'], reason: 'r', checks: {} };
    const pending = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'].map((s) => Object.assign({ question: s }, base));
    const prompt = buildClaudeReviewPrompt({ school: '長榮中學', subject: '數學', unit: '三角函數' }, pending);
    expect(prompt).toMatch(/P1：正確/);
    expect(prompt).toMatch(/## P5（出自 ChatGPT/);
    const r = applyClaudeReview(pending, 'P1：正確\nP2：答案應為 C\n- P3：刪除\nP4：無法判斷');
    expect(r.accepted.map((x) => [x.question, x.answer])).toEqual([['Q1', '乙'], ['Q2', '丙']]);
    expect(r.dropped.map((d) => d.verdict)).toEqual(['刪除', '無法判斷']);
    expect(r.unanswered).toEqual([5]);
  });

  test('replacePracticeBlock 只換掉練習題區塊', () => {
    const acc = [{ question: '題', options: ['甲', '乙'], answer: '乙' }];
    const md = `前文\n${renderPracticeBlock([], 3)}\n後文`;
    const out = replacePracticeBlock(md, acc, 0);
    expect(out.startsWith('前文\n')).toBe(true);
    expect(out.endsWith('\n後文')).toBe(true);
    expect(out).toMatch(/答案：B/);
    expect(out).not.toMatch(/尚未收錄/);
    expect(replacePracticeBlock('沒有區塊', acc, 0)).toBeNull();
  });
});
