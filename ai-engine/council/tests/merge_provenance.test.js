// 2026-10-13 審議改版第 3 階段：三家整合（出處、事實型／教學型、整合依據）。
const { provenanceOf, markTeachingSupplements, computeMergeReport, assembleClaimsIntoSections, generateCouncilMarkdown } = require('../services/multiAi');

const snippets = {
  gpt: '蒲松齡，字留仙，號柳泉，著有聊齋志異。',
  gemini: '聊齋志異是文言短篇小說集，作者蒲松齡字留仙。',
  claude: '記憶口訣：留仙柳泉聊齋志異，一口氣背下作者資料。',
};

test('出處由程式判斷：多家都寫到 → 列出多家；只有一家寫到 → 獨家', () => {
  expect(provenanceOf('蒲松齡字留仙', snippets).sort()).toEqual(['ChatGPT', 'Gemini']);
  expect(provenanceOf('記憶口訣：留仙柳泉聊齋志異', snippets)).toEqual(['Claude']);
  expect(provenanceOf('完全無關的句子', { gpt: 'abc' })).toEqual([]);
});

test('教學型內容沒有教材依據但不矛盾 → 教學補充；事實型仍待覆核；不一致者仍交 Claude', () => {
  const out = markTeachingSupplements([
    { claim: 'a', type: 'teaching', verdict: 'INSUFFICIENT_EVIDENCE' },
    { claim: 'b', type: 'fact', verdict: 'INSUFFICIENT_EVIDENCE' },
    { claim: 'c', type: 'teaching', verdict: 'CONTRADICTED' },
    { claim: 'd', type: 'teaching', verdict: 'INSUFFICIENT_EVIDENCE', escalate: true },
  ]);
  expect(out.map((c) => !!c.teaching_supplement)).toEqual([true, false, false, false]);
  const { sections } = assembleClaimsIntoSections(out.map((c) => ({ ...c, section: '⑫易錯陷阱', sections: ['⑫易錯陷阱'] })));
  expect(sections['⑫易錯陷阱']).toMatch(/【教學補充】a/);
  expect(sections['⑫易錯陷阱']).toMatch(/⚠️尚待人工覆核（INSUFFICIENT_EVIDENCE）：b/);
  expect(sections['⑫易錯陷阱']).not.toMatch(/c$/m);
});

test('整合依據寫進 ⑭：各家採用條數與獨家貢獻', () => {
  const claims = [
    { claim: '蒲松齡字留仙', verdict: 'SUPPORTED', origins: ['ChatGPT', 'Gemini'] },
    { claim: '記憶口訣：留仙柳泉', verdict: 'INSUFFICIENT_EVIDENCE', teaching_supplement: true, origins: ['Claude'] },
    { claim: '被排除的', verdict: 'CONTRADICTED', origins: ['ChatGPT'] },
  ];
  const r = computeMergeReport(claims);
  expect(r).toMatchObject({ adopted: 2, teaching: 1 });
  expect(r.byDraft.ChatGPT).toEqual({ adopted: 1, exclusive: [] });
  expect(r.byDraft.Claude).toEqual({ adopted: 1, exclusive: ['記憶口訣：留仙柳泉'] });
  const md = generateCouncilMarkdown({ school: 's', grade: 'g', subject: '國文', unit: 'u', category: 'c', council: { sections: {}, meta: {}, mergeReport: r } });
  expect(md).toMatch(/整合依據：正文共採用 2 條陳述（其中教學補充 1 條）/);
  expect(md).toMatch(/- Claude：採用 1 條，獨家貢獻 1 條：「記憶口訣：留仙柳泉」/);
});

test('獨家內容不遺漏：模型只抽出一家的說法時，程式補入其他家獨有的句子', async () => {
  const { extractClaimsPerSection } = require('../services/multiAi');
  global.fetch = async () => ({ ok: true, json: async () => ({ response: JSON.stringify({ claims: [{ claim_id: 'c1', claim: '蒲松齡，字留仙，號柳泉，山東淄川人。', type: 'fact' }] }), prompt_eval_count: 10 }) });
  const sec = (t) => ({ '⑦作者背景': t });
  const r = await extractClaimsPerSection({}, '原文', {
    gpt: sec('蒲松齡，字留仙，號柳泉，山東淄川人。'),
    gemini: sec('蒲松齡十九歲考中秀才第一名，之後屢試不第。'),
    claude: sec('記憶口訣：「留仙柳泉寫聊齋」，一句記住字、號與作品。'),
  }, 'm', 'http://x', 1000);
  delete global.fetch;
  const added = r.claims.filter((c) => c.auto_added);
  expect(added.map((c) => [c.origins[0], c.type])).toEqual([['Gemini', 'fact'], ['Claude', 'teaching']]);
  expect(r.claims.filter((c) => !c.auto_added)[0].origins).toEqual(['ChatGPT']);
});
