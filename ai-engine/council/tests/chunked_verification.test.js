// 2026-10-13 審議改版第 2 階段：長 SOURCE 分段裁決再彙整（③④）。
const { verifyClaimAgainstSource, verifyAllClaims, splitSourceChunks, isContextSafe, buildClaimVerificationPrompt } = require('../services/multiAi');

const filler = (n, tag) => Array.from({ length: n }, (_, i) => `${tag}第${i}段：這是一段與題目無關的課文敘述，內容描述季風、洋流與氣候的一般性質，用來讓教材原文超過模型一次能讀的長度。`).join('\n\n');
const KEY = '蒲松齡，字留仙，別號柳泉，山東淄川人。';
const LONG = [filler(400, '甲'), KEY, filler(400, '乙')].join('\n\n');

let calls;
function mockOllama(handler) {
  calls = [];
  global.fetch = async (url, opts) => {
    const prompt = JSON.parse(opts.body).prompt;
    calls.push(prompt);
    return { ok: true, json: async () => ({ response: JSON.stringify(handler(prompt)), prompt_eval_count: 10 }) };
  };
}
afterEach(() => { delete global.fetch; });

test('長 SOURCE 確實超過一次可讀長度，且切段後每段都放得下、段落之間有重疊', () => {
  expect(isContextSafe(buildClaimVerificationPrompt(LONG, 'x'))).toBe(false);
  const chunks = splitSourceChunks(LONG, 6000);
  expect(chunks.length).toBeGreaterThan(2);
  chunks.forEach((c) => expect(isContextSafe(buildClaimVerificationPrompt(c, 'x'))).toBe(true));
  expect(chunks.some((c) => c.includes(KEY))).toBe(true);
  expect(chunks[1].startsWith(chunks[0].slice(-200))).toBe(true);
});

test('分段裁決：先查最相關的段落，逐字命中就成立', async () => {
  mockOllama((p) => (p.includes(KEY)
    ? { verdict: 'SUPPORTED', quoted_source_span: KEY, reason: '原文寫明' }
    : { verdict: 'INSUFFICIENT_EVIDENCE', quoted_source_span: null, reason: '沒提到' }));
  const r = await verifyClaimAgainstSource(LONG, '蒲松齡的字為留仙', 'm', 'http://x', 1000);
  expect(r.verdict).toBe('SUPPORTED');
  expect(r.quoted_source_span).toBe(KEY);
  expect(r.chunked.checked).toBe(1);
});

test('分段裁決：每段都沒提到 → 證據不足；只檢查與陳述相關的段落', async () => {
  mockOllama(() => ({ verdict: 'INSUFFICIENT_EVIDENCE', quoted_source_span: null, reason: '沒提到' }));
  const r = await verifyClaimAgainstSource(LONG, '杜甫被尊為詩聖', 'm', 'http://x', 1000);
  expect(r.verdict).toBe('INSUFFICIENT_EVIDENCE');
  expect(r.chunked.checked).toBe(r.chunked.relevant);
  expect(r.chunked.relevant).toBeLessThan(r.chunked.total);
});

test('模型判「矛盾」但理由是原文沒提到 → 改判證據不足', async () => {
  mockOllama(() => ({ verdict: 'CONTRADICTED', quoted_source_span: null, reason: 'CANONICAL SOURCE 中未提及蒲松齡的相关信息。' }));
  const r = await verifyClaimAgainstSource('王生返家後頭觸硬壁，驀然而踣。', '蒲松齡二十歲考中進士', 'm', 'http://x', 1000);
  expect(r.verdict).toBe('INSUFFICIENT_EVIDENCE');
});

test('分段裁決：有段落支持、也有段落牴觸 → 交 Claude 審查', async () => {
  const SRC = [filler(300, '甲'), '颱風路徑與太平洋高壓的關係：高壓強時颱風偏西。', filler(300, '丙'), '颱風路徑與太平洋高壓的關係：高壓強時颱風偏北。', filler(300, '乙')].join('\n\n');
  mockOllama((full) => { const p = full.split('【陳述】')[0]; return (p.includes('偏西') && !p.includes('偏北') ? { verdict: 'SUPPORTED', quoted_source_span: null, reason: '似乎支持' }
    : p.includes('偏北') && !p.includes('偏西') ? { verdict: 'CONTRADICTED', quoted_source_span: null, reason: '說法不同' }
      : { verdict: 'INSUFFICIENT_EVIDENCE', quoted_source_span: null }); });
  const r = await verifyClaimAgainstSource(SRC, '颱風路徑與太平洋高壓的關係：高壓強時颱風偏西', 'm', 'http://x', 1000);
  expect(r.escalate).toBe(true);
  expect(r.verdict).toBe('INSUFFICIENT_EVIDENCE');
  expect(r.reason).toMatch(/分段裁決結論不一致/);
});

test('換個問法再判斷（④）：結論相反 → 改判證據不足並交 Claude 審查；一致則維持', async () => {
  const SHORT = '王生返家後頭觸硬壁，驀然而踣。';
  mockOllama((p) => (p.includes('是否與【教材原文】衝突')
    ? { conflict: p.includes('穿牆成功'), reason: '第二次' }
    : { verdict: 'SUPPORTED', quoted_source_span: null, reason: '第一次' }));
  const out = await verifyAllClaims([{ claim: '王生返家穿牆成功', section: '②章節摘要' }, { claim: '王生返家後撞牆跌倒', section: '②章節摘要' }], SHORT, 'm', 'http://x', 1000);
  expect(out[0]).toMatchObject({ verdict: 'INSUFFICIENT_EVIDENCE', escalate: true });
  expect(out[0].reason).toMatch(/兩次判斷不一致/);
  expect(out[1].verdict).toBe('SUPPORTED');
  expect(out[1].escalate).toBeUndefined();
});

test('逐字命中 SOURCE 的成立結果不再重問', async () => {
  const SHORT = '王生返家後頭觸硬壁，驀然而踣。';
  mockOllama((p) => (p.includes('是否與【教材原文】衝突') ? { conflict: true } : { verdict: 'SUPPORTED', quoted_source_span: '頭觸硬壁，驀然而踣', reason: 'x' }));
  const out = await verifyAllClaims([{ claim: '王生撞牆', section: '②章節摘要' }], SHORT, 'm', 'http://x', 1000);
  expect(out[0].verdict).toBe('SUPPORTED');
  expect(calls).toHaveLength(1);
});
