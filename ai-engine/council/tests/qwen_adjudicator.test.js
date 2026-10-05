const request = require('supertest');
const fs = require('fs');
const path = require('path');

const {
  assembleCouncilFinal,
  assembleClaimsIntoSections,
  applySourceTruthGate,
  parseClaimAdjudicationResponse,
  isContextSafe,
  estimateTokenCount,
  detectAttributionLeakage,
  findIncompleteSections,
  levenshteinDistance,
  findApproxMatch,
  FAILURE_REASON,
  VERDICTS,
  CONTEXT_SAFE_TOKEN_LIMIT,
  OLLAMA_NUM_CTX,
  OLLAMA_MAX_CTX,
  contextWindowFor,
  selectSourceWindow,
  computeSectionCoverage,
  computeDocumentCompleteness,
  CONTENT_SECTION_KEYS,
  generateCouncilMarkdown,
  checkSourcePlausibility,
  buildSourcePlausibilityPrompt,
  splitSourceIntoPlausibilityChunks,
  buildSpanRecheckPrompt,
  confirmSuspiciousSpans,
} = require('../services/multiAi');

const { app, safeSlug, assertInsideDir, OUTPUTS_DIR, PLATFORM_DIST_DIR } = require('../server');

const metadata = { school: '長榮高中', grade: '高二', subject: '國文', unit: 'L01' };
const drafts = {
  chatgpt: '①核心概念\nChatGPT 初稿內容。\n\n⑮Final Score\nSelf-QA: 90/100',
  gemini: '①核心概念\nGemini 初稿內容。\n\n⑮Final Score\nSelf-QA: 90/100',
  claude: '①核心概念\nClaude 初稿內容。\n\n⑮Final Score\nSelf-QA: 90/100',
};

// 真實、可查證的 SOURCE 片段：蒲松齡《聊齋志異》〈勞山道士〉結局段（公版古典文學），
// 本專案先前已對照原始課本 PDF 逐字覆核並記錄於 04_Final/S001-H2-CHI-L01-L03/CLAUDE_FINAL.md。
const CANON_SOURCE =
  '妻不信。王果去牆數尺，奔而入；及牆，虛若無物，回視，果在牆外矣。大喜，入謝。老道人曰：' +
  '「歸宜潔持，否則不驗。」遂助資斧遣之歸。抵家，自詡遇仙，堅壁所不能阻。妻不信，王效其作為，' +
  '去牆數尺，奔而入，頭觸硬壁，蹶然而踣。妻扶視之，額上墳起如巨卵焉。妻揶揄之。王慚忿，罵老道士之無良而已。';

function claimResponse(claims) {
  return { ok: true, json: async () => ({ response: JSON.stringify({ claims }) }) };
}

// Gate 2（分批抽取，見 services/multiAi.js 的 extractClaimsPerSection）：抽取階段現在是
// 「依 CONTENT_SECTION_KEYS 順序，對每一個有草稿內容的小節各自呼叫一次」，不再是單一
// 大呼叫。這個 helper 依 contentSectionKeys（這次測試的 drafts 實際上在哪些小節有內容，
// 決定 extractClaimsPerSection 會呼叫幾次、依什麼順序）模擬對應的呼叫序列：先依序模擬
// 每個小節各自的抽取回應（該小節有 claim 就回傳 claim，有 unresolved 就回傳 unresolved，
// 兩者都沒有就回傳空的——會被判定為 uncovered，符合真實行為），再接上既有的逐一驗證
// 回應佇列。claims/unresolvedSections 沿用既有的扁平陣列格式（各自帶 section 欄位），
// 不必為了分批而重寫每個測試的資料本身。
function verificationResponse(claim) {
  const body = {
    quoted_source_span: claim.quoted_source_span ?? null,
    verdict: claim.verdict,
    reason: claim.reason ?? '測試理由',
  };
  return { ok: true, json: async () => ({ response: JSON.stringify(body) }) };
}

function claimSectionsOf(claim) {
  return Array.isArray(claim.sections) && claim.sections.length > 0 ? claim.sections : [claim.section];
}

function mockFullPipeline(claims, unresolvedSections = [], contentSectionKeys = ['①核心概念']) {
  const fn = jest.fn();
  const orderedClaims = [];

  contentSectionKeys.forEach((sectionKey) => {
    const sectionClaims = claims.filter((c) => claimSectionsOf(c).includes(sectionKey));
    const unresolvedEntry = unresolvedSections.find((u) => u.section === sectionKey);
    const body = {
      claims: sectionClaims.map(({ claim_id, claim }) => ({ claim_id, claim })),
      unresolved: unresolvedEntry ? { reason: unresolvedEntry.reason } : null,
    };
    fn.mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify(body) }) });
    orderedClaims.push(...sectionClaims);
  });

  orderedClaims.forEach((claim) => {
    fn.mockResolvedValueOnce(verificationResponse(claim));
  });

  global.fetch = fn;
  return fn;
}

function buildAllSupportedClaims({ suffix = '' } = {}) {
  const titles = [
    '①核心概念',
    '②章節摘要',
    '③重點詞彙',
    '④文意理解',
    '⑤修辭手法',
    '⑥文化脈絡',
    '⑦作者背景',
    '⑧段落結構',
    '⑨延伸思考',
    '⑩易混淆概念',
    '⑪常考題型',
    '⑫易錯陷阱',
    '⑬跨課連結',
    '⑭Cross Review',
    '⑮Final Score',
  ];
  return titles.map((section, index) => ({
    claim_id: `c${index + 1}`,
    section,
    claim: `融合三方後關於「${section}」的統一敘述內容${suffix}，不含任何來源標籤。`,
    quoted_source_span: null,
    verdict: 'SUPPORTED',
    reason: '三方一致且無 SOURCE 衝突。',
    confidence: 0.9,
  }));
}

describe('Qwen2.5 Semantic Cross-Council Adjudicator（Claim-level, SOURCE-grounded）', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('Test A — 正常裁決：全部 claims SUPPORTED，mode=llm_semantic，qualityGate=PASS，finalScore 反映實際驗證比例', async () => {
    mockFullPipeline(buildAllSupportedClaims());

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('llm_semantic');
    expect(council.meta.finalScore).toBe(100);
    expect(council.meta.qualityGate).toBe('PASS');
    expect(council.meta.failureReason).toBeNull();
    expect(council.sections['①核心概念']).toContain('①核心概念');
  });

  test('Test NO-SOURCE — P0-01：未提供 Canonical SOURCE 內容時，一律 fallback，且完全不得呼叫 Ollama', async () => {
    global.fetch = jest.fn();

    const council = await assembleCouncilFinal(metadata, drafts, '');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.NO_SOURCE);
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');
  });

  test('Test KNOWN CONFLICT FIXTURE（Acceptance fixture，P0-02／STEP 12）— SOURCE 為「蹶然而踣」，兩個 claim 引用錯誤的「驀然而踣」（模擬多數意見一致但錯誤），一個 claim 引用正確的「蹶然而踣」：SOURCE evidence 必須凌駕多數決', async () => {
    const claims = [
      {
        claim_id: 'wrong-a',
        section: '②章節摘要',
        claim: '王生返家後試穿牆術，頭觸硬壁，驀然而踣。',
        quoted_source_span: '頭觸硬壁，驀然而踣',
        verdict: 'SUPPORTED', // 模型本身誤判為 SUPPORTED（模擬 majority-vote 偏誤）
        reason: 'ChatGPT 與 Gemini 初稿皆如此描述，故判定為 SUPPORTED。',
        confidence: 0.8,
      },
      {
        claim_id: 'wrong-b',
        section: '②章節摘要',
        claim: '王生返家後試穿牆術，頭觸硬壁，驀然而踣（重複陳述）。',
        quoted_source_span: '頭觸硬壁，驀然而踣',
        verdict: 'SUPPORTED',
        reason: '與另一份初稿一致。',
        confidence: 0.8,
      },
      {
        claim_id: 'correct-c',
        section: '②章節摘要',
        claim: '王生返家後試穿牆術，頭觸硬壁，蹶然而踣。',
        quoted_source_span: '頭觸硬壁，蹶然而踣',
        verdict: 'SUPPORTED',
        reason: 'Claude 初稿引用並註明已對照原始 PDF 頁 16 逐字覆核。',
        confidence: 0.95,
      },
    ];
    mockFullPipeline(claims, [], ['②章節摘要']);

    // 這個 fixture 的敘事前提是「ChatGPT 與 Gemini 初稿本身真的寫錯」，不是 Qwen 生成時自己
    // 誤植的雜訊，所以這裡必須用真的包含「驀然而踣」的初稿內容，draft cross-check（判斷
    // near-miss 究竟是真實跨初稿衝突、還是模型自己的生成雜訊）才能得到正確的輸入。
    const conflictDrafts = {
      chatgpt: '②章節摘要\n王生返家後試穿牆術，頭觸硬壁，驀然而踣。',
      gemini: '②章節摘要\n王生返家後試穿牆術，頭觸硬壁，驀然而踣（重複陳述）。',
      claude: '②章節摘要\n王生返家後試穿牆術，頭觸硬壁，蹶然而踣。',
    };
    const council = await assembleCouncilFinal(metadata, conflictDrafts, CANON_SOURCE);

    const wrongA = council.claims.find((c) => c.claim_id === 'wrong-a');
    const wrongB = council.claims.find((c) => c.claim_id === 'wrong-b');
    const correctC = council.claims.find((c) => c.claim_id === 'correct-c');

    // 禁止 majority vote：即使兩個 claim 意見一致，仍必須被判為 CONTRADICTED。
    expect(wrongA.verdict).toBe('CONTRADICTED');
    expect(wrongB.verdict).toBe('CONTRADICTED');
    expect(wrongA.overridden_by_source_truth_gate ?? wrongA.overridden).toBeTruthy();
    // 唯一符合 SOURCE 的 claim 必須維持（或被確認為）SUPPORTED。
    expect(correctC.verdict).toBe('SUPPORTED');

    // Final 內容只能包含 SOURCE 驗證通過的版本，錯誤版本不得進入 Final。
    expect(council.sections['②章節摘要']).toContain('蹶然而踣');
    expect(council.sections['②章節摘要']).not.toContain('驀然而踣');

    // 有 claim 被排除，不得偽裝成乾淨的 PASS。
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');
    expect(council.meta.hardFail).toBe(false);
  });

  test('Test UNSUPPORTED — 重要 claim 缺乏具體引用且模型自陳 UNSUPPORTED 時，仍納入 Final 但標示待覆核，且 Quality Gate 不得 PASS', async () => {
    // 共用 drafts fixture 只在①核心概念有實質內容（見檔案頂端），Gate 2 分批抽取下
    // 只會查詢這一個小節，所以兩個 claim 都放在這裡，聚焦測試「UNSUPPORTED claim
    // 會不會正確被納入 Final 並標示待覆核」本身，不需要湊出橫跨多小節的大量 claim。
    const claims = [
      {
        claim_id: 'c1',
        section: '①核心概念',
        claim: '融合後核心概念：三方一致的敘述。',
        quoted_source_span: null,
        verdict: 'SUPPORTED',
        reason: '三方一致',
        confidence: 0.9,
      },
      {
        claim_id: 'speculative',
        section: '①核心概念',
        claim: '本課極可能出現於明年學測（推測，無直接依據）。',
        quoted_source_span: null,
        verdict: 'UNSUPPORTED',
        reason: '純屬推測，SOURCE 未提及任何應試相關資訊。',
        confidence: 0.3,
      },
    ];
    mockFullPipeline(claims);

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('llm_semantic');
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');
    expect(council.sections['①核心概念']).toContain('⚠️尚待人工覆核（UNSUPPORTED）');
  });

  test('Test INSUFFICIENT-EVIDENCE — quoted_source_span 與 SOURCE 完全無相近內容時，deterministic gate 覆寫為 INSUFFICIENT_EVIDENCE', async () => {
    const claims = [
      // 共用的 drafts fixture（見檔案頂端）只在①核心概念有實質內容，Gate 2 的 section
      // coverage 檢查會要求這個小節也要有對應 claim，否則會被判定為 coverage 不完整
      // 而觸發 FAIL——這條額外的 SUPPORTED claim 讓本測試單純聚焦在「⑥文化脈絡那個
      // 誤判的 claim 會不會被 deterministic gate 正確降級」，不被 coverage 規則干擾。
      {
        claim_id: 'c-core',
        section: '①核心概念',
        claim: '王生入山學道，勞山道士傳授穿牆術。',
        quoted_source_span: null,
        verdict: 'SUPPORTED',
        reason: '概念性總結，無需逐字引用。',
        confidence: 0.9,
      },
      {
        claim_id: 'unrelated',
        // 共用 drafts fixture 只在①核心概念有實質內容，跟上面的 c-core 放同一個小節，
        // 兩個 claim 合併同一次抽取呼叫（真實情境下一個小節本來就可能對應多個 claim）。
        section: '①核心概念',
        claim: '本文提及量子力學的測不準原理。',
        quoted_source_span: '測不準原理與波粒二象性', // SOURCE 中完全不存在、也無近似片段
        verdict: 'SUPPORTED', // 模型誤判
        reason: '模型誤判為有依據。',
        confidence: 0.6,
      },
    ];
    mockFullPipeline(claims);

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    const unrelatedClaim = council.claims.find((c) => c.claim_id === 'unrelated');
    expect(unrelatedClaim.verdict).toBe('INSUFFICIENT_EVIDENCE');
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');
  });

  test('Test EMPTY-SPAN — quoted_source_span 為空字串／空白時視為概念性 claim（null），不得誤判為虛構 source_ref', async () => {
    const claims = [
      {
        claim_id: 'concept',
        // 共用 drafts fixture 只在①核心概念有實質內容（見檔案頂端），Gate 2 分批抽取下
        // 只會查詢這一個小節；原本寫④文意理解只是巧合沒對上，改成①核心概念聚焦測試本身
        // 要驗證的行為（quoted_source_span 空白時視為概念性 claim）。
        section: '①核心概念',
        claim: '本文以「潔持」寄寓誠敬修習之寓意。',
        quoted_source_span: '   ',
        verdict: 'SUPPORTED',
        reason: '概念性歸納，非逐字引用。',
        confidence: 0.7,
      },
    ];
    mockFullPipeline(claims);

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.claims[0].verdict).toBe('SUPPORTED');
    expect(council.claims[0].source_ref).toBeNull();
  });

  // 2026-10-04：以實際上傳的教材為主——SOURCE 很長時不再整份退回 fallback。
  test('Test C — 長 SOURCE（整本課本）：不退回 fallback，context window 依實際 prompt 放大，SOURCE 整份送進 Qwen', async () => {
    const longSource = `${CANON_SOURCE}

${'氣體壓力來自粒子撞擊器壁。'.repeat(1200)}`; // 約 1.6 萬字，舊版 8192 上限必定超過
    const fn = mockFullPipeline(buildAllSupportedClaims().slice(0, 1));
    const council = await assembleCouncilFinal(metadata, drafts, longSource);

    expect(council.mode).toBe('llm_semantic');
    expect(council.meta.failureReason).not.toBe(FAILURE_REASON.CONTEXT_OVERFLOW);
    expect(council.meta.sourceWindowed).toBe(false);
    const sent = fn.mock.calls.map(([, init]) => JSON.parse(init.body));
    expect(sent.length).toBeGreaterThan(0);
    sent.forEach((body) => {
      expect(body.prompt).toContain(longSource); // 完整 SOURCE，未截斷
      expect(body.options.num_ctx).toBeGreaterThan(OLLAMA_NUM_CTX);
      expect(body.options.num_ctx).toBeLessThanOrEqual(OLLAMA_MAX_CTX);
      expect(estimateTokenCount(body.prompt) + 1536).toBeLessThanOrEqual(body.options.num_ctx);
    });
  });

  test('Test C2 — SOURCE 超過模型最大 context：改送最相關段落（不截斷、不跳過），Final 標示 source_windowed', async () => {
    const filler = Array.from({ length: 400 }, (_, i) => `第${i}段：與本課無關的填充敘述內容，重複出現以撐大篇幅。`.repeat(6)).join('\n\n');
    const hugeSource = `${filler}

${CANON_SOURCE}

${filler}`;
    expect(estimateTokenCount(hugeSource)).toBeGreaterThan(CONTEXT_SAFE_TOKEN_LIMIT);
    const claims = [{ ...buildAllSupportedClaims()[0], claim: '老道人叮囑王生歸宜潔持，否則不驗。' }];
    const fn = mockFullPipeline(claims);
    const council = await assembleCouncilFinal(metadata, { ...drafts, claude: '①核心概念\n老道人曰歸宜潔持，否則不驗。' }, hugeSource);

    expect(council.mode).toBe('llm_semantic');
    expect(council.meta.sourceWindowed).toBe(true);
    expect(council.adjudicationRecord.source_windowed).toBe(true);
    fn.mock.calls.forEach(([, init]) => {
      const body = JSON.parse(init.body);
      expect(body.options.num_ctx).toBeLessThanOrEqual(OLLAMA_MAX_CTX);
      expect(estimateTokenCount(body.prompt)).toBeLessThanOrEqual(CONTEXT_SAFE_TOKEN_LIMIT);
      expect(body.prompt).toContain('歸宜潔持，否則不驗'); // 最相關的段落被選進來
    });
  });

  test('selectSourceWindow：放得下就原樣回傳；放不下時依原文順序挑最相關段落、不超過額度', () => {
    expect(selectSourceWindow(CANON_SOURCE, '潔持', 100000)).toEqual({ text: CANON_SOURCE, windowed: false });
    const paras = ['甲段：波以耳定律定溫下壓力與體積成反比。', '乙段：天氣晴朗適合郊遊。', '丙段：查理定律定壓下體積與絕對溫度成正比。'];
    const w = selectSourceWindow(paras.join('\n\n'), '波以耳定律 查理定律 壓力 體積', 62); // 放得下甲＋丙（含分隔），放不下三段
    expect(w.windowed).toBe(true);
    expect(w.text.indexOf('甲段')).toBeLessThan(w.text.indexOf('丙段'));
    expect(w.text).not.toContain('乙段');
  });

  test('contextWindowFor：短 prompt 用最小 window，長 prompt 放大，但不超過模型上限', () => {
    expect(contextWindowFor('短')).toBe(OLLAMA_NUM_CTX);
    expect(contextWindowFor('字'.repeat(20000))).toBeGreaterThanOrEqual(20000 + 1536);
    expect(contextWindowFor('字'.repeat(200000))).toBe(OLLAMA_MAX_CTX);
  });

  test('Test D — Ollama HTTP 500：明確錯誤處理並降級 fallback + PENDING_MANUAL_REVIEW', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.HTTP_ERROR);
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');
  });

  test('Test D-2 — Ollama response 帶 parsed.error 欄位：視為明確錯誤並降級', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ error: 'model not found' }) });

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.HTTP_ERROR);
  });

  test('Test E — Empty Response：response 為空字串時降級 fallback', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ response: '' }) });

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.EMPTY_RESPONSE);
  });

  test('Test F — Invalid JSON：Qwen 回應非合法 JSON（禁止 stub 成功）時降級 fallback', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ response: '這不是 JSON，只是一段散文敘述。' }) });

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.INVALID_JSON);
  });

  test('Test F-2 — Schema Invalid：claims 陣列為空或缺漏時降級 fallback', async () => {
    global.fetch = jest.fn().mockResolvedValue(claimResponse([]));

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.SCHEMA_INVALID);
  });

  test('Test F-3 — Schema Invalid：verdict 不在允許清單內（例如模型自創 "MAYBE"）時降級 fallback', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      claimResponse([
        { claim_id: 'c1', section: '①核心概念', claim: '內容', quoted_source_span: null, verdict: 'MAYBE', reason: 'x', confidence: 0.5 },
      ]),
    );

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.SCHEMA_INVALID);
  });

  test('Test G — 出現「ChatGPT 認為」等來源標籤殘留於 claim 內容：NOT PUBLISHED（fallback，非 llm_semantic）', async () => {
    const claims = buildAllSupportedClaims();
    claims[0] = { ...claims[0], claim: 'ChatGPT 認為核心概念是甲。' };
    mockFullPipeline(claims);

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.ATTRIBUTION_LEAKAGE);
  });

  test('Test TIMEOUT — Ollama 逾時：明確標示 OLLAMA_TIMEOUT 並降級，不得偽裝成功', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'TimeoutError';
      return Promise.reject(error);
    });

    const council = await assembleCouncilFinal(metadata, drafts, CANON_SOURCE);

    expect(council.mode).toBe('fallback_concat');
    expect(council.meta.failureReason).toBe(FAILURE_REASON.TIMEOUT);
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');
    expect(council.meta.finalScore).toBe('N/A');
  });

  test('Test HARD-FAIL — 防護性完整性檢查：若組裝後 Final 內容仍出現已排除的 CONTRADICTED claim 文字，必須 HARD FAIL（不得以格式完整矇混）', () => {
    const claims = [
      { claim_id: 'ok', section: '①核心概念', claim: '重複文字X', quoted_source_span: null, verdict: 'SUPPORTED', reason: 'ok', confidence: 0.9, overridden: false },
      { claim_id: 'bad', section: '①核心概念', claim: '重複文字X', quoted_source_span: '不存在的引用', verdict: 'CONTRADICTED', reason: 'bad', confidence: 0.9, overridden: true },
    ];

    const { hardFail } = assembleClaimsIntoSections(claims);
    expect(hardFail).toBe(true);
  });

  describe('applySourceTruthGate（Deterministic SOURCE Truth Gate 單元測試）', () => {
    test('quoted_source_span 與 SOURCE 逐字相符：確認 SUPPORTED，並回填 source_ref', () => {
      const claims = [{ claim_id: 'c1', section: null, claim: 'x', quoted_source_span: '頭觸硬壁，蹶然而踣', verdict: 'UNSUPPORTED', reason: 'y', confidence: 0.5 }];
      const gated = applySourceTruthGate(claims, CANON_SOURCE);
      expect(gated[0].verdict).toBe('SUPPORTED');
      expect(gated[0].source_ref).toBe('頭觸硬壁，蹶然而踣');
    });

    test('quoted_source_span 與 SOURCE 存在但內容不同（近似字串）：覆寫為 CONTRADICTED，且優先於任何模型自評 verdict', () => {
      const claims = [{ claim_id: 'c1', section: null, claim: 'x', quoted_source_span: '頭觸硬壁，驀然而踣', verdict: 'SUPPORTED', reason: '多數初稿一致', confidence: 0.9 }];
      const gated = applySourceTruthGate(claims, CANON_SOURCE);
      expect(gated[0].verdict).toBe('CONTRADICTED');
      expect(gated[0].source_ref).toBe('頭觸硬壁，蹶然而踣');
      expect(gated[0].overridden).toBe(true);
    });

    test('quoted_source_span 在 SOURCE 中完全找不到相近內容：INSUFFICIENT_EVIDENCE', () => {
      const claims = [{ claim_id: 'c1', section: null, claim: 'x', quoted_source_span: '完全不相關的量子力學敘述內容', verdict: 'SUPPORTED', reason: 'z', confidence: 0.5 }];
      const gated = applySourceTruthGate(claims, CANON_SOURCE);
      expect(gated[0].verdict).toBe('INSUFFICIENT_EVIDENCE');
    });
  });

  describe('parseClaimAdjudicationResponse（結構化 JSON 解析與 schema 驗證）', () => {
    test('可從夾帶前後贅字的回應中擷取 JSON 物件', () => {
      const raw = '好的，以下是裁決結果：\n' + JSON.stringify({ claims: [{ claim_id: 'c1', section: '①核心概念', claim: 'x', quoted_source_span: null, verdict: 'SUPPORTED', reason: 'y', confidence: 0.8 }] }) + '\n（結束）';
      const parsed = parseClaimAdjudicationResponse(raw);
      expect(parsed.claims).toHaveLength(1);
    });

    test('claims 為空陣列時拋出 SCHEMA_INVALID', () => {
      expect(() => parseClaimAdjudicationResponse(JSON.stringify({ claims: [] }))).toThrow();
      try {
        parseClaimAdjudicationResponse(JSON.stringify({ claims: [] }));
      } catch (error) {
        expect(error.reason).toBe(FAILURE_REASON.SCHEMA_INVALID);
      }
    });

    test('非 JSON 內容拋出 INVALID_JSON', () => {
      try {
        parseClaimAdjudicationResponse('完全不是 JSON');
      } catch (error) {
        expect(error.reason).toBe(FAILURE_REASON.INVALID_JSON);
      }
    });
  });

  describe('levenshteinDistance / findApproxMatch（近似比對工具函式）', () => {
    test('完全相同字串距離為 0', () => {
      expect(levenshteinDistance('蹶然而踣', '蹶然而踣')).toBe(0);
    });

    test('差一個字元距離為 1（驀 vs 蹶）', () => {
      expect(levenshteinDistance('驀然而踣', '蹶然而踣')).toBe(1);
    });

    test('findApproxMatch 可在較長 SOURCE 中找出「蹶然而踣」對應「驀然而踣」的近似片段', () => {
      const match = findApproxMatch('頭觸硬壁，驀然而踣', CANON_SOURCE);
      expect(match.matchedText).toBe('頭觸硬壁，蹶然而踣');
      expect(match.distance).toBe(1);
    });
  });

  describe('Context Safety Gate 工具函式', () => {
    test('短文本估算在安全上限內', () => {
      expect(isContextSafe('短文本')).toBe(true);
      expect(estimateTokenCount('短文本')).toBeGreaterThan(0);
    });

    test('超長文本估算超過安全上限', () => {
      const huge = 'x'.repeat(CONTEXT_SAFE_TOKEN_LIMIT * 3);
      expect(isContextSafe(huge)).toBe(false);
    });
  });

  describe('detectAttributionLeakage / findIncompleteSections 單元測試', () => {
    test('偵測 Gemini (Web) 觀點 殘留', () => {
      expect(detectAttributionLeakage({ x: '本節由 Gemini (Web) 觀點主導。' })).toBe(true);
    });

    test('無殘留標籤時回傳 false', () => {
      expect(detectAttributionLeakage({ x: '統一敘述，無來源標籤。' })).toBe(false);
    });

    test('缺少任一節時列出該節', () => {
      const sections = { '①核心概念': '內容', '⑭Cross Review': '' };
      expect(findIncompleteSections(sections)).toContain('⑭Cross Review');
    });
  });
});

// ---------------------------------------------------------------------------
// Gate 2 — Council Adjudication Section Completeness
//
// 真實發生過的失敗案例：13 個有實質內容的小節，claim 抽取階段只產生 1 個 claim，
// 其餘 12 個小節完全空白，但因為那 1 個 claim 剛好 SUPPORTED，final_score 仍是 100、
// quality_gate 仍是 PASS。舊版 adjudicationRecord.validation.sections_complete 欄位
// 也只是 `mode === 'llm_semantic'`，從未真的檢查過小節是否完整——這個欄位形同虛設。
// 這裡的測試直接針對這個真實案例建立迴歸測試，避免同樣的事再發生一次而沒人發現。
// ---------------------------------------------------------------------------
describe('Gate 2 — Council Section Coverage（section-level completeness）', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const metadata = { school: '長榮高中', grade: '高二', subject: '歷史', unit: '序篇' };

  const CANON_SOURCE_13 =
    '①核心概念的來源內容。②章節摘要的來源內容。③重點詞彙的來源內容。④文意理解的來源內容。' +
    '⑤修辭手法的來源內容。⑥文化脈絡的來源內容。⑦作者背景的來源內容。⑧段落結構的來源內容。' +
    '⑨延伸思考的來源內容。⑩易混淆概念的來源內容。⑪常考題型的來源內容。⑫易錯陷阱的來源內容。' +
    '⑬跨課連結的來源內容。';

  // 三份初稿在①~⑬每個小節都有實質內容（每份措辭略有不同，模擬三個獨立來源）。
  function buildDraftsWithAllThirteenSections() {
    const build = (label) =>
      CONTENT_SECTION_KEYS.map((key) => `${key}\n${label}對「${key}」的說明內容。`).join('\n\n');
    return {
      chatgpt: build('ChatGPT'),
      gemini: build('Gemini'),
      claude: build('Claude'),
    };
  }

  test('迴歸測試 1：13 個有內容的小節只抽出 1 個 claim → coverage 明確回報未覆蓋、quality_gate 不得 PASS', async () => {
    const drafts13 = buildDraftsWithAllThirteenSections();
    const claims = [
      {
        claim_id: 'c1',
        section: '①核心概念',
        claim: '融合後的核心概念敘述。',
        quoted_source_span: '①核心概念的來源內容。',
        verdict: 'SUPPORTED',
        reason: '逐字對照 SOURCE',
        confidence: 0.9,
      },
    ];
    mockFullPipeline(claims);

    const council = await assembleCouncilFinal(metadata, drafts13, CANON_SOURCE_13);

    expect(council.meta.sectionCoverage.total_sections).toBe(13);
    expect(council.meta.sectionCoverage.sections_with_source_content).toBe(13);
    expect(council.meta.sectionCoverage.sections_with_claims).toBe(1);
    expect(council.meta.sectionCoverage.coverage_rate).toBeLessThan(100);
    expect(council.meta.sectionCoverage.uncovered_sections).toHaveLength(12);
    // 每一個未覆蓋的小節都必須明確列出，不能只給一個總數字。
    expect(council.meta.sectionCoverage.uncovered_sections.map((s) => s.section_id)).toContain('②章節摘要');
    expect(council.meta.sectionCoverage.uncovered_sections.map((s) => s.section_id)).toContain('⑬跨課連結');
    expect(council.meta.qualityGate).not.toBe('PASS');
    expect(council.meta.qualityGate).toBe('FAIL');
  });

  test('迴歸測試 2：三份初稿對①②③提供相同／近似內容並合併為較少的 claim → claim 數量可以下降，但①②③的 section coverage 不能消失', async () => {
    const drafts3 = {
      chatgpt: '①核心概念\nChatGPT 對核心概念的描述。\n\n②章節摘要\nChatGPT 的摘要。\n\n③重點詞彙\nChatGPT 列的詞彙。',
      gemini: '①核心概念\nGemini 對核心概念的描述。\n\n②章節摘要\nGemini 的摘要。\n\n③重點詞彙\nGemini 列的詞彙。',
      claude: '①核心概念\nClaude 對核心概念的描述。\n\n②章節摘要\nClaude 的摘要。\n\n③重點詞彙\nClaude 列的詞彙。',
    };
    const source3 = '①核心概念合併後內容。②章節摘要合併後內容。③重點詞彙合併後內容。';
    // 抽取階段把三份初稿對同一小節的說法合併成「一個」claim（而不是三份各自一個，
    // 共 9 個）——claim 總數從理論上限的 9 降到 3，但涵蓋的小節仍是①②③全部三個。
    const claims = [
      { claim_id: 'c1', section: '①核心概念', claim: '合併後的核心概念敘述。', quoted_source_span: '①核心概念合併後內容。', verdict: 'SUPPORTED', reason: '三方一致，合併為一', confidence: 0.9 },
      { claim_id: 'c2', section: '②章節摘要', claim: '合併後的章節摘要。', quoted_source_span: '②章節摘要合併後內容。', verdict: 'SUPPORTED', reason: '三方一致，合併為一', confidence: 0.9 },
      { claim_id: 'c3', section: '③重點詞彙', claim: '合併後的重點詞彙。', quoted_source_span: '③重點詞彙合併後內容。', verdict: 'SUPPORTED', reason: '三方一致，合併為一', confidence: 0.9 },
    ];
    mockFullPipeline(claims, [], ['①核心概念', '②章節摘要', '③重點詞彙']);

    const council = await assembleCouncilFinal(metadata, drafts3, source3);

    expect(claims.length).toBeLessThan(9); // 確認這個情境真的有「合併」發生
    expect(council.meta.sectionCoverage.sections_with_source_content).toBe(3);
    expect(council.meta.sectionCoverage.sections_with_claims).toBe(3);
    expect(council.meta.sectionCoverage.coverage_rate).toBe(100);
    expect(council.meta.sectionCoverage.uncovered_sections).toHaveLength(0);
  });

  test('迴歸測試 3a：某小節有內容，但模型「什麼都沒回報」（沒有 claim、也沒有 unresolved 狀態）→ 不得捏造，仍須記錄為真正的缺口（非「不存在」）', async () => {
    const drafts2 = {
      chatgpt: '①核心概念\nChatGPT 對核心概念的描述。\n\n④文意理解\n這段語意含糊，難以形成明確陳述。',
      gemini: '①核心概念\nGemini 對核心概念的描述。\n\n④文意理解\n同樣含糊不清。',
      claude: '①核心概念\nClaude 對核心概念的描述。\n\n④文意理解\n三方對這段的理解分歧，無法整合成單一陳述。',
    };
    const source2 = '①核心概念的來源內容。④文意理解的來源內容其實與初稿描述不同，難以直接對應。';
    // 模擬模型完全沒處理到④文意理解：沒有 claim，也沒有把它列進 unresolved_sections——
    // 這才是這個 Gate 真正要抓的缺口（模型什麼都沒回報，不是誠實判定證據不足）。
    const claims = [
      { claim_id: 'c1', section: '①核心概念', claim: '融合後的核心概念敘述。', quoted_source_span: '①核心概念的來源內容。', verdict: 'SUPPORTED', reason: '逐字對照 SOURCE', confidence: 0.9 },
    ];
    // ④文意理解也有草稿內容，extractClaimsPerSection 一定會被呼叫到；明確模擬它的回應
    // 是「什麼都沒有」（見下方 mockFullPipeline 對沒有對應 claim／unresolved 的小節的行為）。
    mockFullPipeline(claims, [], ['①核心概念', '④文意理解']);

    const council = await assembleCouncilFinal(metadata, drafts2, source2);

    // 不得捏造：Final 內容裡不能出現④文意理解的任何「假裝已驗證」的陳述文字。
    expect(council.sections['④文意理解']).not.toContain('ChatGPT');
    expect(council.sections['④文意理解']).not.toContain('Gemini');
    expect(council.claims.some((c) => c.section === '④文意理解')).toBe(false);

    // 仍須記錄：這個小節不是「不存在」，是「有內容但完全沒被處理到」，必須跟「已誠實
    // 判定證據不足」（見迴歸測試 3b）區分開來，不能混為一談。
    const uncovered = council.meta.sectionCoverage.uncovered_sections.find((s) => s.section_id === '④文意理解');
    expect(uncovered).toBeDefined();
    expect(uncovered.reason).toBe('NO_CLAIM_OR_STATUS_REPORTED');
    expect(council.meta.sectionCoverage.unresolved_sections).toHaveLength(0);
    expect(council.meta.qualityGate).toBe('FAIL');
  });

  test('迴歸測試 3b：某小節有內容，模型明確回報 unresolved（而非沉默跳過）→ 不算「缺口」，記錄為已處理但待覆核，quality_gate 降級而非 FAIL', async () => {
    const drafts2 = {
      chatgpt: '①核心概念\nChatGPT 對核心概念的描述。\n\n④文意理解\n這段語意含糊，難以形成明確陳述。',
      gemini: '①核心概念\nGemini 對核心概念的描述。\n\n④文意理解\n同樣含糊不清。',
      claude: '①核心概念\nClaude 對核心概念的描述。\n\n④文意理解\n三方對這段的理解分歧，無法整合成單一陳述。',
    };
    const source2 = '①核心概念的來源內容。④文意理解的來源內容其實與初稿描述不同，難以直接對應。';
    const claims = [
      { claim_id: 'c1', section: '①核心概念', claim: '融合後的核心概念敘述。', quoted_source_span: '①核心概念的來源內容。', verdict: 'SUPPORTED', reason: '逐字對照 SOURCE', confidence: 0.9 },
    ];
    // 模型這次誠實回報④文意理解為 unresolved（依新版 prompt 規則 5／6），而不是沉默跳過。
    const unresolvedSections = [{ section: '④文意理解', reason: '三方初稿對這段的理解分歧過大，無法整合成單一可驗證陳述' }];
    mockFullPipeline(claims, unresolvedSections, ['①核心概念', '④文意理解']);

    const council = await assembleCouncilFinal(metadata, drafts2, source2);

    // 不得捏造：依然不能在 Final 內容裡出現④文意理解「假裝已驗證」的陳述文字。
    expect(council.sections['④文意理解']).not.toContain('ChatGPT');
    expect(council.claims.some((c) => c.section === '④文意理解')).toBe(false);

    // 明確回報過的 unresolved 小節，不應該出現在 uncovered_sections（那是「完全沒處理」
    // 的缺口），而應該出現在 unresolved_sections（「已處理，判定證據不足」）。
    expect(council.meta.sectionCoverage.uncovered_sections.find((s) => s.section_id === '④文意理解')).toBeUndefined();
    const unresolved = council.meta.sectionCoverage.unresolved_sections.find((s) => s.section_id === '④文意理解');
    expect(unresolved).toBeDefined();
    expect(unresolved.reason).toContain('分歧');
    expect(council.meta.sectionCoverage.coverage_rate).toBe(100); // 兩個有內容小節都「處理過」了

    // 有明確回報的 unresolved 小節仍不得 PASS，但跟「完全沒處理」的缺口不是同一等級：
    // 不是 hardFail、也沒有真正的 uncovered_sections，所以降級為人工覆核而非直接 FAIL。
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');
  });

  // Gate 2（分批抽取）之後，抽取階段一次只問一個小節（見 extractClaimsPerSection），
  // 所以真實模型輸出「不可能」再產生 sections 陣列跨兩個小節的 claim——每次呼叫都只知道
  // 一個小節，parseSectionClaimResponse 也會強制把 section/sections 覆寫回那一個小節。
  // 但下游（computeSectionCoverage／assembleClaimsIntoSections／generateCouncilMarkdown）
  // 仍然保留這個能力的支援，是刻意的防禦性設計，不是死碼——直接建構一個帶 sections 陣列
  // 的 claim 物件（略過已經不會產生這種資料的抽取階段），驗證三者處理這種輸入時仍然一致。
  test('迴歸測試 4：一個 claim 的 sections 陣列橫跨多個小節時（下游防禦性支援，非分批抽取的真實輸出）→ computeSectionCoverage／assembleClaimsIntoSections／generateCouncilMarkdown 三者結果必須一致', () => {
    const multiSectionClaim = {
      claim_id: 'c1',
      section: '①核心概念',
      sections: ['①核心概念', '②章節摘要'],
      claim: '本課同時涵蓋核心概念與章節重點的統一敘述。',
      verdict: 'SUPPORTED',
    };
    const draftSectionMaps = {
      gpt: { '①核心概念': '內容', '②章節摘要': '內容' },
      gemini: {},
      claude: {},
    };

    // 1) computeSectionCoverage：兩個小節都必須算「有 claim 覆蓋」，沒有任何一個是缺口。
    const coverage = computeSectionCoverage(draftSectionMaps, [multiSectionClaim]);
    expect(coverage.sections_with_claims).toBe(2);
    expect(coverage.uncovered_sections).toHaveLength(0);
    expect(coverage.coverage_rate).toBe(100);

    // 2) assembleClaimsIntoSections：同一份 claim 文字必須「真的」同時寫進兩個小節。
    const { sections } = assembleClaimsIntoSections([multiSectionClaim]);
    expect(sections['①核心概念']).toContain('本課同時涵蓋核心概念與章節重點的統一敘述');
    expect(sections['②章節摘要']).toContain('本課同時涵蓋核心概念與章節重點的統一敘述');

    // 3) generateCouncilMarkdown：最終輸出的 Final.md 正文，兩個小節底下也都必須看得到
    //    這段內容——跟 council.sections 的結果必須一致，不能在組裝成 markdown 時又漏掉。
    const markdown = generateCouncilMarkdown({
      school: metadata.school,
      grade: metadata.grade,
      subject: metadata.subject,
      unit: metadata.unit,
      category: '課本',
      council: { mode: 'llm_semantic', sections, contributions: {}, meta: {} },
    });
    const coreSectionBlock = markdown.split('## ①核心概念')[1].split('## ②章節摘要')[0];
    const summarySectionBlock = markdown.split('## ②章節摘要')[1].split('## ③重點詞彙')[0];
    expect(coreSectionBlock).toContain('本課同時涵蓋核心概念與章節重點的統一敘述');
    expect(summarySectionBlock).toContain('本課同時涵蓋核心概念與章節重點的統一敘述');
  });

  // 依 index 把①~⑬切成「claimed／unresolved／uncovered」三組，組出貼近真實規模（13 小節、
  // 兩位數 claim）的 fixture，而不是只用一兩個小節的玩具案例——這樣才能同時驗證三種狀態
  // 共存時，computeSectionCoverage／computeDocumentCompleteness／assembleClaimsIntoSections／
  // generateCouncilMarkdown／quality_gate 五者是否彼此一致。
  function buildMixedCoverageClaims(claimedCount, unresolvedCount) {
    const claimedKeys = CONTENT_SECTION_KEYS.slice(0, claimedCount);
    const unresolvedKeys = CONTENT_SECTION_KEYS.slice(claimedCount, claimedCount + unresolvedCount);
    const uncoveredKeys = CONTENT_SECTION_KEYS.slice(claimedCount + unresolvedCount);

    const claims = claimedKeys.map((key, i) => ({
      claim_id: `c${i + 1}`,
      section: key,
      claim: `融合後關於「${key}」的統一敘述。`,
      quoted_source_span: `${key}的來源內容。`,
      verdict: 'SUPPORTED',
      reason: '逐字對照 SOURCE',
      confidence: 0.9,
    }));
    const unresolvedSections = unresolvedKeys.map((key) => ({
      section: key,
      reason: `三方初稿對「${key}」的理解分歧過大，無法整合成單一可驗證陳述`,
    }));

    return { claims, unresolvedSections, claimedKeys, unresolvedKeys, uncoveredKeys };
  }

  test('迴歸測試 5a：13 小節 = 10 claimed + 3 unresolved + 0 uncovered → 全部小節都已被處理，quality_gate 不是 FAIL，但因為有 unresolved 仍不是 PASS', async () => {
    const { claims, unresolvedSections, unresolvedKeys } = buildMixedCoverageClaims(10, 3);
    mockFullPipeline(claims, unresolvedSections, CONTENT_SECTION_KEYS);

    const council = await assembleCouncilFinal(metadata, buildDraftsWithAllThirteenSections(), CANON_SOURCE_13);
    const coverage = council.meta.sectionCoverage;

    // computeSectionCoverage
    expect(coverage.sections_with_claims).toBe(10);
    expect(coverage.sections_unresolved).toBe(3);
    expect(coverage.uncovered_sections).toHaveLength(0); // 0 uncovered
    expect(coverage.coverage_rate).toBe(100); // 10 + 3 = 13，全部小節都處理過

    // unresolved ≠ uncovered：3 個 unresolved 小節必須出現在 unresolved_sections，
    // 一個都不能同時出現在 uncovered_sections。
    const unresolvedIds = coverage.unresolved_sections.map((s) => s.section_id);
    expect(unresolvedIds.sort()).toEqual([...unresolvedKeys].sort());
    unresolvedKeys.forEach((key) => {
      expect(coverage.uncovered_sections.find((s) => s.section_id === key)).toBeUndefined();
    });

    // computeDocumentCompleteness：unresolved 不可被偽裝成「已完成」——document completeness
    // 必須明顯低於 coverage_rate（只有真正 SUPPORTED 的 10 個小節才算數，3 個 unresolved 不算）。
    expect(council.meta.documentCompleteness).toBe(Math.round((10 / 13) * 100));
    expect(council.meta.documentCompleteness).toBeLessThan(coverage.coverage_rate);

    // assembleClaimsIntoSections（council.sections）：unresolved 小節不得出現任何「假裝已驗證」
    // 的捏造內容，應維持預設的「建議人工覆核」佔位文字。
    unresolvedKeys.forEach((key) => {
      expect(council.sections[key]).toBe('（本輪未產生對應章節之已驗證內容，建議人工覆核）');
    });

    // quality_gate：沒有真正的缺口（uncovered=0），不是 hardFail，所以不得 FAIL；
    // 但存在 unresolved，代表文件仍不完整，也不得 PASS。
    expect(council.meta.qualityGate).not.toBe('FAIL');
    expect(council.meta.qualityGate).not.toBe('PASS');
    expect(council.meta.qualityGate).toBe('PENDING_MANUAL_REVIEW');

    // generateCouncilMarkdown：Final.md 必須清楚列出 unresolved sections，且不得出現
    // Uncovered Sections 區塊（因為這個情境裡沒有真正的缺口）。
    const markdown = generateCouncilMarkdown({
      school: metadata.school,
      grade: metadata.grade,
      subject: metadata.subject,
      unit: metadata.unit,
      category: '課本',
      council,
    });
    expect(markdown).toContain('Unresolved Sections');
    unresolvedKeys.forEach((key) => expect(markdown).toContain(key));
    expect(markdown).not.toContain('Uncovered Sections');
  });

  test('迴歸測試 5b：13 小節 = 10 claimed + 2 unresolved + 1 uncovered → 唯一真正的缺口必須觸發 FAIL，且與 unresolved 明確區分', async () => {
    const { claims, unresolvedSections, unresolvedKeys, uncoveredKeys } = buildMixedCoverageClaims(10, 2);
    mockFullPipeline(claims, unresolvedSections, CONTENT_SECTION_KEYS);

    const council = await assembleCouncilFinal(metadata, buildDraftsWithAllThirteenSections(), CANON_SOURCE_13);
    const coverage = council.meta.sectionCoverage;

    expect(uncoveredKeys).toHaveLength(1); // fixture 本身只留 1 個小節完全沒被處理到

    // computeSectionCoverage：10 claimed、2 unresolved、剛好 1 uncovered。
    expect(coverage.sections_with_claims).toBe(10);
    expect(coverage.sections_unresolved).toBe(2);
    expect(coverage.uncovered_sections).toHaveLength(1);
    expect(coverage.uncovered_sections[0].section_id).toBe(uncoveredKeys[0]);
    expect(coverage.coverage_rate).toBe(Math.round((12 / 13) * 100));

    // unresolved ≠ uncovered：明確區分，唯一的缺口不得出現在 unresolved_sections，
    // 兩個 unresolved 小節也不得出現在 uncovered_sections。
    expect(coverage.unresolved_sections.map((s) => s.section_id)).not.toContain(uncoveredKeys[0]);
    unresolvedKeys.forEach((key) => {
      expect(coverage.uncovered_sections.find((s) => s.section_id === key)).toBeUndefined();
    });

    // uncovered 必須觸發 FAIL（即使同時有 unresolved 小節，真正的缺口優先權更高）。
    expect(council.meta.qualityGate).toBe('FAIL');

    // generateCouncilMarkdown：Final.md 必須同時、分開列出 Unresolved Sections 與
    // Uncovered Sections 兩個區塊，缺口小節只能出現在 Uncovered，不能混進 Unresolved。
    const markdown = generateCouncilMarkdown({
      school: metadata.school,
      grade: metadata.grade,
      subject: metadata.subject,
      unit: metadata.unit,
      category: '課本',
      council,
    });
    expect(markdown).toContain('Unresolved Sections');
    expect(markdown).toContain('Uncovered Sections');
    const unresolvedBlock = markdown.split('Unresolved Sections')[1].split('Uncovered Sections')[0];
    const uncoveredBlock = markdown.split('Uncovered Sections')[1];
    unresolvedKeys.forEach((key) => expect(unresolvedBlock).toContain(key));
    expect(unresolvedBlock).not.toContain(uncoveredKeys[0]);
    expect(uncoveredBlock).toContain(uncoveredKeys[0]);
  });
});

describe('computeSectionCoverage / computeDocumentCompleteness（單元測試，schema 驗證）', () => {
  const sectionMapWithContent = (keys) => {
    const map = {};
    CONTENT_SECTION_KEYS.forEach((key) => {
      map[key] = keys.includes(key) ? `${key} 的內容。` : '';
    });
    return map;
  };

  test('schema：回傳結構符合 total_sections / sections_with_source_content / sections_with_claims / sections_unresolved / coverage_rate / uncovered_sections / unresolved_sections', () => {
    const drafts = { gpt: sectionMapWithContent(['①核心概念']), gemini: {}, claude: {} };
    const claims = [{ claim_id: 'c1', section: '①核心概念', sections: ['①核心概念'], verdict: 'SUPPORTED' }];

    const coverage = computeSectionCoverage(drafts, claims);

    expect(coverage).toEqual({
      total_sections: 13,
      sections_with_source_content: 1,
      sections_with_claims: 1,
      sections_unresolved: 0,
      coverage_rate: 100,
      uncovered_sections: [],
      unresolved_sections: [],
    });
  });

  test('明確回報的 unresolved_sections：不計入 sections_with_claims，但算進 coverage_rate（已處理，非缺口）', () => {
    const drafts = { gpt: sectionMapWithContent(['①核心概念', '④文意理解']), gemini: {}, claude: {} };
    const claims = [{ claim_id: 'c1', section: '①核心概念', sections: ['①核心概念'], verdict: 'SUPPORTED' }];
    const unresolvedSections = [{ section: '④文意理解', reason: '三方分歧過大' }];

    const coverage = computeSectionCoverage(drafts, claims, unresolvedSections);

    expect(coverage.sections_with_claims).toBe(1);
    expect(coverage.sections_unresolved).toBe(1);
    expect(coverage.coverage_rate).toBe(100);
    expect(coverage.uncovered_sections).toHaveLength(0);
    expect(coverage.unresolved_sections).toEqual([{ section_id: '④文意理解', section_title: '④文意理解', reason: '三方分歧過大' }]);
  });

  test('同一小節同時出現在 claims 與 unresolved_sections：claim 優先，不重複計入 unresolved', () => {
    const drafts = { gpt: sectionMapWithContent(['①核心概念']), gemini: {}, claude: {} };
    const claims = [{ claim_id: 'c1', section: '①核心概念', sections: ['①核心概念'], verdict: 'SUPPORTED' }];
    const unresolvedSections = [{ section: '①核心概念', reason: '模型自相矛盾的回報' }];

    const coverage = computeSectionCoverage(drafts, claims, unresolvedSections);

    expect(coverage.sections_with_claims).toBe(1);
    expect(coverage.sections_unresolved).toBe(0);
    expect(coverage.unresolved_sections).toHaveLength(0);
  });

  test('一個 claim 同時支持多個小節（sections 陣列）：兩個小節都算有覆蓋', () => {
    const drafts = { gpt: sectionMapWithContent(['①核心概念', '②章節摘要']), gemini: {}, claude: {} };
    const claims = [
      { claim_id: 'c1', section: '①核心概念', sections: ['①核心概念', '②章節摘要'], verdict: 'SUPPORTED' },
    ];

    const coverage = computeSectionCoverage(drafts, claims);

    expect(coverage.sections_with_claims).toBe(2);
    expect(coverage.uncovered_sections).toHaveLength(0);
  });

  test('沒有任何小節有內容時，coverage_rate 為 null（避免除以零）', () => {
    const coverage = computeSectionCoverage({ gpt: {}, gemini: {}, claude: {} }, []);
    expect(coverage.sections_with_source_content).toBe(0);
    expect(coverage.coverage_rate).toBeNull();
  });

  test('computeDocumentCompleteness：只計入真正 SUPPORTED 的小節，INSUFFICIENT_EVIDENCE 不計入', () => {
    const coverage = computeSectionCoverage(
      { gpt: sectionMapWithContent(['①核心概念', '②章節摘要']), gemini: {}, claude: {} },
      [],
    );
    const claims = [
      { claim_id: 'c1', section: '①核心概念', sections: ['①核心概念'], verdict: 'SUPPORTED' },
      { claim_id: 'c2', section: '②章節摘要', sections: ['②章節摘要'], verdict: 'INSUFFICIENT_EVIDENCE' },
    ];

    expect(computeDocumentCompleteness(coverage, claims)).toBe(50);
  });

  test('assembleClaimsIntoSections：一個 claim 的 sections 陣列有多個小節時，同一份文字必須寫進每一個小節', () => {
    const claims = [
      {
        claim_id: 'c1',
        section: '①核心概念',
        sections: ['①核心概念', '②章節摘要'],
        claim: '同時涵蓋兩個小節的統一敘述。',
        verdict: 'SUPPORTED',
      },
    ];

    const { sections } = assembleClaimsIntoSections(claims);

    expect(sections['①核心概念']).toContain('同時涵蓋兩個小節的統一敘述');
    expect(sections['②章節摘要']).toContain('同時涵蓋兩個小節的統一敘述');
  });

  test('assembleClaimsIntoSections：沒有 sections 陣列時退回單一 section 欄位（舊格式相容）', () => {
    const claims = [{ claim_id: 'c1', section: '③重點詞彙', claim: '僅對應單一小節。', verdict: 'SUPPORTED' }];

    const { sections } = assembleClaimsIntoSections(claims);

    expect(sections['③重點詞彙']).toContain('僅對應單一小節');
    expect(sections['①核心概念']).not.toContain('僅對應單一小節');
  });
});

describe('checkSourcePlausibility / splitSourceIntoPlausibilityChunks（SOURCE OCR 語意合理性檢查，段落分塊）', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function plausibilityResponse(spans) {
    return { ok: true, json: async () => ({ response: JSON.stringify({ suspicious_spans: spans }) }) };
  }

  function recheckResponse(stillSuspicious) {
    return {
      ok: true,
      json: async () => ({ response: JSON.stringify({ still_suspicious: stillSuspicious, reason: '第二次覆核理由' }) }),
    };
  }

  // 每個 chunk 一個 { spans, confirmations } 項目：spans 是該塊第一次判斷回傳的候選，
  // confirmations 是對應每個候選、第二次覆核回傳的 still_suspicious（未提供則預設 true），
  // 呼叫順序需與實際程式碼一致：先整塊的抽取呼叫，再依序每個候選各自的覆核呼叫。
  function mockPlausibilityPipeline(perChunk) {
    const fn = jest.fn();
    perChunk.forEach(({ spans, confirmations = [] }) => {
      fn.mockResolvedValueOnce(plausibilityResponse(spans));
      spans.forEach((_, idx) => {
        const stillSuspicious = confirmations[idx] !== undefined ? confirmations[idx] : true;
        fn.mockResolvedValueOnce(recheckResponse(stillSuspicious));
      });
    });
    global.fetch = fn;
    return fn;
  }

  // 依序把每個片段各自的回應排進 fetch mock 佇列，順序須與 splitSourceIntoPlausibilityChunks
  // 對同一份 sourceText 實際切出的片段順序一致（呼叫端是逐一 await，不是平行送出）。
  function mockChunkedPlausibility(spansPerChunk) {
    const fn = jest.fn();
    spansPerChunk.forEach((spans) => fn.mockResolvedValueOnce(plausibilityResponse(spans)));
    global.fetch = fn;
    return fn;
  }

  describe('splitSourceIntoPlausibilityChunks', () => {
    test('空字串回傳空陣列', () => {
      expect(splitSourceIntoPlausibilityChunks('')).toEqual([]);
    });

    test('多個短段落會被聚合進同一塊，直到累積超過目標大小才切下一塊', () => {
      const chunks = splitSourceIntoPlausibilityChunks('第一段。\n\n第二段。', 400);
      expect(chunks).toEqual(['第一段。\n\n第二段。']);
    });

    test('單一段落本身就超過目標大小時，獨立成一塊，不與其他段落合併也不從中間硬切', () => {
      const longParagraph = 'A'.repeat(50);
      const chunks = splitSourceIntoPlausibilityChunks(`短段。\n\n${longParagraph}\n\n短段二。`, 20);
      expect(chunks).toContain(longParagraph);
      expect(chunks.some((c) => c.length === 50)).toBe(true);
    });

    test('切出的片段依序拼回可還原每一段原文內容（不遺漏、不重複段落）', () => {
      const source = ['第一段內容。', '第二段內容。', '第三段內容。'].join('\n\n');
      const chunks = splitSourceIntoPlausibilityChunks(source, 8);
      expect(chunks.join('\n\n')).toBe(source);
    });
  });

  test('分塊逐一檢查：把每塊回傳的 suspicious_spans 合併回單一結果，且依原文位置判斷 foundInSource', async () => {
    const source = ['甲段落內容合理。', '弳 誤植為 强，語意不合理。'].join('\n\n');
    // 第一塊沒有可疑之處，第二塊抓到一個 —— 驗證合併邏輯不會因為某一塊是空陣列而漏掉其他塊的結果。
    mockChunkedPlausibility([
      [],
      [{ text: '强', reason: '語意不合理，應為弳', suggested_correction: '弳' }],
    ]);

    const result = await checkSourcePlausibility(source, { timeoutMs: 5000, chunkCharTarget: 8 });

    expect(result.checked).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.suspiciousSpans).toHaveLength(1);
    expect(result.suspiciousSpans[0]).toMatchObject({
      text: '强',
      suggestedCorrection: '弳',
      foundInSource: true,
    });
  });

  test('部分片段呼叫失敗（例如逾時）：仍合併其餘成功片段的結果，不整體判定失敗', async () => {
    const source = ['第一段。', '第二段。'].join('\n\n');
    const fn = jest.fn();
    fn.mockRejectedValueOnce(Object.assign(new Error('timeout'), { reason: FAILURE_REASON.TIMEOUT }));
    fn.mockResolvedValueOnce(plausibilityResponse([{ text: '第二段', reason: '測試理由', suggested_correction: null }]));
    global.fetch = fn;

    const result = await checkSourcePlausibility(source, { timeoutMs: 5000, chunkCharTarget: 4 });

    expect(result.checked).toBe(true);
    expect(result.suspiciousSpans).toHaveLength(1);
    expect(result.suspiciousSpans[0].text).toBe('第二段');
  });

  test('每一塊都呼叫失敗：誠實回報整體檢查失敗，不得偽裝成功回傳空陣列', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('連線失敗'));

    const result = await checkSourcePlausibility('第一段。\n\n第二段。', { timeoutMs: 5000 });

    expect(result.checked).toBe(false);
    expect(result.reason).toBe(FAILURE_REASON.CONNECTION_ERROR);
    expect(result.suspiciousSpans).toEqual([]);
  });

  test('空 SOURCE：完全不呼叫 Ollama，直接回報 NO_CANONICAL_SOURCE', async () => {
    global.fetch = jest.fn();

    const result = await checkSourcePlausibility('   ');

    expect(result.checked).toBe(false);
    expect(result.reason).toBe(FAILURE_REASON.NO_SOURCE);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('模型回報的可疑片段本身含生成雜訊（罕見字誤植，如 applySourceTruthGate 記錄過的同一種現象）：' +
    '找不到逐字相符時，用編輯距離比對回 SOURCE 真正的原文，而非直接採信模型自己重新生成的版本', async () => {
    const source = '弧度制中，一個完整圓周角為 2π 強，半圓角為 π 弳。';
    // 模型指出的可疑片段本身把「弳」誤植成「弢」（單一字元差異），SOURCE 中完全沒有「弢」。
    mockChunkedPlausibility([[{ text: '半圓角為 π 弢。', reason: '語意不合理', suggested_correction: null }]]);

    const result = await checkSourcePlausibility(source, { timeoutMs: 5000 });

    expect(result.suspiciousSpans).toHaveLength(1);
    expect(result.suspiciousSpans[0].text).toBe('半圓角為 π 弳。');
    expect(result.suspiciousSpans[0].foundInSource).toBe(true);
  });

  test('模型回報的可疑片段與 SOURCE 差距過大（非單純生成雜訊）：不強行修正，如實標示 foundInSource=false', async () => {
    const source = '弧度制中，一個完整圓周角為 2π 強，半圓角為 π 弳。';
    mockChunkedPlausibility([[{ text: '完全不相關的量子力學敘述內容', reason: '語意不合理', suggested_correction: null }]]);

    const result = await checkSourcePlausibility(source, { timeoutMs: 5000 });

    expect(result.suspiciousSpans).toHaveLength(1);
    expect(result.suspiciousSpans[0].text).toBe('完全不相關的量子力學敘述內容');
    expect(result.suspiciousSpans[0].foundInSource).toBe(false);
  });

  test('第二次獨立覆核判定 still_suspicious=false：過濾掉該候選，不出現在最終結果中（過濾「字罕見但讀得通」的假警報）', async () => {
    const source = '弧度制中，一個完整圓周角為 2π 強，半圓角為 π 弳。';
    mockPlausibilityPipeline([
      {
        spans: [{ text: '半圓角為 π 弳。', reason: '「弳」字少見', suggested_correction: null }],
        confirmations: [false],
      },
    ]);

    const result = await checkSourcePlausibility(source, { timeoutMs: 5000 });

    expect(result.checked).toBe(true);
    expect(result.suspiciousSpans).toHaveLength(0);
  });

  test('第二次獨立覆核判定 still_suspicious=true：保留該候選於最終結果', async () => {
    const source = '弧度制中，一個完整圓周角為 2π 強，半圓角為 π 弳。';
    mockPlausibilityPipeline([
      {
        spans: [{ text: '一個完整圓周角為 2π 強', reason: '語意不合理', suggested_correction: '一個完整圓周角為 2π 弳' }],
        confirmations: [true],
      },
    ]);

    const result = await checkSourcePlausibility(source, { timeoutMs: 5000 });

    expect(result.suspiciousSpans).toHaveLength(1);
    expect(result.suspiciousSpans[0].text).toBe('一個完整圓周角為 2π 強');
  });

  test('第二次覆核呼叫本身失敗（逾時／連線錯誤）：保守維持原判定，不得悄悄放行第一次抓到的真正問題', async () => {
    const source = '弧度制中，一個完整圓周角為 2π 強，半圓角為 π 弳。';
    const fn = jest.fn();
    fn.mockResolvedValueOnce(plausibilityResponse([{ text: '一個完整圓周角為 2π 強', reason: '語意不合理', suggested_correction: null }]));
    fn.mockRejectedValueOnce(new Error('覆核呼叫逾時'));
    global.fetch = fn;

    const result = await checkSourcePlausibility(source, { timeoutMs: 5000 });

    expect(result.suspiciousSpans).toHaveLength(1);
  });

  test('confirmSuspiciousSpans：直接單元測試（不經 checkSourcePlausibility），確認依序呼叫且正確過濾', async () => {
    const fn = jest.fn();
    fn.mockResolvedValueOnce(recheckResponse(true));
    fn.mockResolvedValueOnce(recheckResponse(false));
    global.fetch = fn;

    const candidates = [
      { text: '候選一', reason: '理由一', suggestedCorrection: null, foundInSource: true },
      { text: '候選二', reason: '理由二', suggestedCorrection: null, foundInSource: true },
    ];

    const confirmed = await confirmSuspiciousSpans(candidates, '原始片段文字', 'qwen2.5:7b-instruct-q4_K_M', 'http://test', 5000);

    expect(confirmed).toHaveLength(1);
    expect(confirmed[0].text).toBe('候選一');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('buildSpanRecheckPrompt 逐字包含原始片段語境、被標記文字與第一次理由', () => {
    const prompt = buildSpanRecheckPrompt('弧度制中，一個完整圓周角為 2π 強，半圓角為 π 弳。', {
      text: '2π 強',
      reason: '語意不合理，疑似誤植',
    });
    expect(prompt).toContain('弧度制中，一個完整圓周角為 2π 強，半圓角為 π 弳。');
    expect(prompt).toContain('2π 強');
    expect(prompt).toContain('語意不合理，疑似誤植');
  });

  test('buildSourcePlausibilityPrompt 逐字包含傳入的片段文字', () => {
    const prompt = buildSourcePlausibilityPrompt('弳 誤植為 强');
    expect(prompt).toContain('弳 誤植為 强');
  });
});

describe('Test H — Path Traversal 防護', () => {
  const CATALOG_PATH = path.join(PLATFORM_DIST_DIR, 'catalog.json');
  let catalogExistedBefore;
  let catalogSnapshot;

  beforeEach(() => {
    catalogExistedBefore = fs.existsSync(CATALOG_PATH);
    catalogSnapshot = catalogExistedBefore ? fs.readFileSync(CATALOG_PATH, 'utf8') : null;
  });

  afterEach(() => {
    if (catalogExistedBefore) {
      fs.writeFileSync(CATALOG_PATH, catalogSnapshot, 'utf8');
    } else if (fs.existsSync(CATALOG_PATH)) {
      fs.unlinkSync(CATALOG_PATH);
    }
  });

  test('assertInsideDir 拒絕 ../../evil（POSIX 樣式）', () => {
    expect(() => assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, '..', '..', 'evil'))).toThrow();
  });

  test('assertInsideDir 拒絕以絕對路徑跳出 baseDir', () => {
    expect(() => assertInsideDir(OUTPUTS_DIR, '/etc/cron.d/evil')).toThrow();
  });

  test('assertInsideDir 允許 baseDir 內的合法路徑', () => {
    expect(() => assertInsideDir(OUTPUTS_DIR, path.join(OUTPUTS_DIR, 'ok.md'))).not.toThrow();
  });

  test('safeSlug 濾除路徑分隔字元，"../../evil" 與 "..\\\\..\\\\evil" 均不含斜線或反斜線', () => {
    expect(safeSlug('../../evil')).not.toMatch(/[/\\]/);
    expect(safeSlug('..\\..\\evil')).not.toMatch(/[/\\]/);
  });

  test('POST /api/assemble-council 以惡意 school/unit metadata 嘗試路徑穿越，仍只會寫入 outputs/ 與 platform_dist/ 內部，不得逸出目錄', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Ollama 未啟動（測試環境）'));

    const maliciousMetadata = {
      school: '../../evil',
      grade: '..\\..\\evil',
      subject: '國文',
      unit: '../../../etc/cron.d/evil',
      category: '課本',
    };

    const res = await request(app)
      .post('/api/assemble-council')
      .send({ ...maliciousMetadata, drafts });

    expect(res.status).toBe(200);

    const filename = res.body.filename;
    const writtenOutputsPath = path.join(OUTPUTS_DIR, filename);
    const writtenDistPath = path.join(PLATFORM_DIST_DIR, filename);
    const writtenAdjudicationPath = path.join(OUTPUTS_DIR, `${filename}.adjudication.json`);
    const writtenPlatformIndexPath = path.join(process.env.COUNCIL_DATA_DIR, res.body.platformIndexPath);
    const writtenPlatformIndexDir = path.dirname(writtenPlatformIndexPath);

    expect(path.resolve(writtenOutputsPath).startsWith(path.resolve(OUTPUTS_DIR) + path.sep)).toBe(true);
    expect(path.resolve(writtenDistPath).startsWith(path.resolve(PLATFORM_DIST_DIR) + path.sep)).toBe(true);
    expect(path.resolve(writtenPlatformIndexPath).startsWith(path.resolve(PLATFORM_DIST_DIR) + path.sep)).toBe(true);
    expect(fs.existsSync(path.resolve(OUTPUTS_DIR, '..', '..', 'evil'))).toBe(false);
    expect(fs.existsSync('/etc/cron.d/evil')).toBe(false);

    fs.unlinkSync(writtenOutputsPath);
    fs.unlinkSync(writtenDistPath);
    if (fs.existsSync(writtenAdjudicationPath)) fs.unlinkSync(writtenAdjudicationPath);
    if (fs.existsSync(writtenPlatformIndexDir)) fs.rmSync(writtenPlatformIndexDir, { recursive: true, force: true });
  });

  test('GET /api/download/:filename 以 ../../etc/passwd 樣式嘗試逸出 outputs/，回應 400 或 404，不得回傳目錄外檔案', async () => {
    const res = await request(app).get('/api/download/' + encodeURIComponent('../../../etc/passwd'));
    expect([400, 404]).toContain(res.status);
  });
});

describe('Upload Temp Cleanup — 解析失敗路徑仍須清理暫存檔（try/finally）', () => {
  const UPLOADS_DIR = path.join(process.env.COUNCIL_DATA_DIR, 'uploads');

  test('.pdf 解析拋出例外時，仍回應 500 並清空 uploads/ 暫存檔', async () => {
    jest.resetModules();
    jest.doMock('pdf-parse', () => ({
      PDFParse: jest.fn().mockImplementation(() => ({
        getText: jest.fn().mockRejectedValue(new Error('PDF 損毀，解析失敗')),
        destroy: jest.fn().mockResolvedValue(undefined),
      })),
    }));
    jest.doMock('tesseract.js', () => ({
      recognize: jest.fn().mockResolvedValue({ data: { text: '', words: [] } }),
    }));

    // eslint-disable-next-line global-require
    const { app: freshApp } = require('../server');

    const res = await request(freshApp)
      .post('/api/upload')
      .attach('files', Buffer.from('%PDF-1.4 corrupt'), 'broken.pdf');

    expect(res.status).toBe(500);
    expect(fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : []).toHaveLength(0);

    jest.dontMock('pdf-parse');
    jest.dontMock('tesseract.js');
    jest.resetModules();
  });
});
