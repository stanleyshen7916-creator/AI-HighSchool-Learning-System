// Node 內建 fetch（底層 undici）預設 headersTimeout / bodyTimeout 皆為 300000ms（5 分鐘），
// 與呼叫端自訂的 AbortSignal.timeout(timeoutMs) 完全獨立、互不知情。真實 Qwen2.5 claim
// adjudication（含較長 SOURCE／初稿）實測可能超過 5 分鐘，undici 的預設值會搶先中止連線，
// 讓呼叫端收到普通連線錯誤（誤判為 OLLAMA_CONNECTION_ERROR），而非真正逾時。
// 明確調高 undici 全域 dispatcher 逾時，確保「是否逾時」只由 DEFAULT_ADJUDICATION_TIMEOUT_MS
// 這個唯一、有意設計的安全上限決定。
const { Agent, setGlobalDispatcher } = require('undici');
setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));

const SECTION_DEFS = [
  { num: '①', title: '核心概念' },
  { num: '②', title: '章節摘要' },
  { num: '③', title: '重點詞彙' },
  { num: '④', title: '文意理解' },
  { num: '⑤', title: '修辭手法' },
  { num: '⑥', title: '文化脈絡' },
  { num: '⑦', title: '作者背景' },
  { num: '⑧', title: '段落結構' },
  { num: '⑨', title: '延伸思考' },
  { num: '⑩', title: '易混淆概念' },
  { num: '⑪', title: '常考題型' },
  { num: '⑫', title: '易錯陷阱' },
  { num: '⑬', title: '跨課連結' },
  { num: '⑭', title: 'Cross Review' },
  { num: '⑮', title: 'Final Score' },
];

function keyOf(def) {
  return def.num + def.title;
}

const SECTION_KEYS = SECTION_DEFS.map(keyOf);

// Gate 2（section-level completeness）：①~⑬ 是從三方初稿抽取實質教材內容的小節；
// ⑭Cross Review、⑮Final Score 是管線自己產生的流程／裁決摘要小節，不是從初稿內容
// 抽取claim的對象，計算「小節覆蓋率」時必須排除，否則分母會被稀釋、覆蓋率虛高。
const CONTENT_SECTION_KEYS = SECTION_KEYS.slice(0, 13);

// 2026-10-04：context window 依「實際送出的 prompt」決定，不再固定 8192。
// 過去固定 8192 tokens，整本課本（例如 22 頁照片 OCR）的 SOURCE 一放進 prompt 就超過，
// 每個小節都被跳過、整份退回 fallback_concat（OLLAMA_CONTEXT_OVERFLOW）。本地模型沒有
// 計費或配額限制，唯一的上限是模型本身：qwen2.5 原生 context 為 32768，可用環境變數
// OLLAMA_MAX_CTX 調整。OLLAMA_NUM_CTX 是最小 window（短 prompt 不必配置大 KV cache，
// 6 GB 顯卡上速度較快）。
const OLLAMA_NUM_CTX = 8192;
const OLLAMA_MAX_CTX = Math.max(OLLAMA_NUM_CTX, Number(process.env.OLLAMA_MAX_CTX) || 32768);
// 保留給模型輸出（claims JSON）的 token 額度，避免 prompt（含 Canonical SOURCE）佔滿整個
// context window 導致輸出被截斷。Claim JSON 通常比舊版純敘述輸出更長（含 provenance 欄位），
// 保留額度略高於舊版。
const CONTEXT_OUTPUT_RESERVE_TOKENS = 1536;
const CONTEXT_SAFE_TOKEN_LIMIT = OLLAMA_MAX_CTX - CONTEXT_OUTPUT_RESERVE_TOKENS;

// 沒有 tokenizer 時的保守估算：Qwen 對中日韓文字約 1 字 ≤ 1 token，其他字元約 3～4 字元
// 1 token；這裡用 1 字 1 token、其他 2.5 字元 1 token，寧可高估。高估很重要：prompt
// 超過 num_ctx 時 Ollama 會「靜默」從開頭截掉內容（SOURCE 在前面），不會報錯。
const CJK_RE = /[　-〿㐀-鿿豈-﫿＀-￯]/g;

// 2026-10-04 實測（化學第三章，Tesseract OCR）：舊算法（其他字元 2.5 字 1 token）估約 3 萬，
// Ollama 實際 4 萬多 tokens，每次都被截掉開頭。OCR 文字在中文字之間夾大量空白，又有大量
// 數字與符號；Qwen 的數字一位一個 token，空白與符號也常各自成 token。所以數字、空白、
// 符號各算 1 token，只有英文字母以 3 字元 1 token 估，最後乘 TOKEN_ESTIMATE_MARGIN 保留餘裕。
const ONE_TOKEN_EACH_RE = /[0-9\s!-/:-@[-`{-~]/g;
const TOKEN_ESTIMATE_MARGIN = Number(process.env.OLLAMA_TOKEN_ESTIMATE_MARGIN) || 1.15;

function estimateTokenCount(text) {
  const str = String(text ?? '');
  const cjk = (str.match(CJK_RE) || []).length;
  const oneEach = (str.match(ONE_TOKEN_EACH_RE) || []).length;
  const rest = str.length - cjk - oneEach;
  return Math.ceil((cjk + oneEach + rest / 3) * TOKEN_ESTIMATE_MARGIN);
}

// 這次呼叫需要的 context window：prompt＋輸出額度，以 2048 為單位，介於最小與最大之間。
function contextWindowFor(promptText) {
  const needed = estimateTokenCount(promptText) + CONTEXT_OUTPUT_RESERVE_TOKENS;
  return Math.min(OLLAMA_MAX_CTX, Math.max(OLLAMA_NUM_CTX, Math.ceil(needed / 2048) * 2048));
}

// SOURCE 連模型最大 context 都放不下時（極長的教材），不跳過也不截斷：把 SOURCE 切成段落，
// 依與這次要處理的內容（小節初稿／單一陳述）的字詞重疊度挑出最相關的段落，依原文順序
// 組成這次呼叫的 SOURCE，直到填滿可用額度。整份 SOURCE 仍是唯一 Truth Anchor——逐字比對
// （applySourceTruthGate）一律對完整 SOURCE 進行；Final.md 會標示 source_windowed。
function splitSourceParagraphs(sourceText, maxChars = 800) {
  const parts = [];
  String(sourceText).split(/\n\s*\n|\n(?=#)/).forEach((para) => {
    const text = para.trim();
    if (!text) return;
    for (let i = 0; i < text.length; i += maxChars) parts.push(text.slice(i, i + maxChars));
  });
  return parts;
}

function bigramsOf(text) {
  const set = new Set();
  const str = String(text || '').replace(/\s+/g, '');
  for (let i = 0; i < str.length - 1; i += 1) set.add(str.slice(i, i + 2));
  return set;
}

// 段落之間的分隔也要計入額度（+1 吸收逐段 ceil 的進位誤差）。
const WINDOW_SEPARATOR = '\n\n…\n\n';
const WINDOW_SEPARATOR_TOKENS = estimateTokenCount(WINDOW_SEPARATOR) + 1;

function selectSourceWindow(sourceText, focusText, maxTokens) {
  if (estimateTokenCount(sourceText) <= maxTokens) return { text: sourceText, windowed: false };
  const focus = bigramsOf(focusText);
  const paragraphs = splitSourceParagraphs(sourceText).map((text, index) => {
    let hits = 0;
    bigramsOf(text).forEach((bg) => { if (focus.has(bg)) hits += 1; });
    return { text, index, score: hits / Math.sqrt(text.length + 1), tokens: estimateTokenCount(text) + WINDOW_SEPARATOR_TOKENS };
  });
  const chosen = [];
  let used = 0;
  paragraphs.slice().sort((a, b) => b.score - a.score || a.index - b.index).forEach((p) => {
    if (used + p.tokens <= maxTokens) { chosen.push(p); used += p.tokens; }
  });
  chosen.sort((a, b) => a.index - b.index);
  return { text: chosen.map((p) => p.text).join(WINDOW_SEPARATOR), windowed: true };
}

// 依 SOURCE 實際長度組 prompt：放得下就給完整 SOURCE；放不下就給最相關的段落。
// 連「不含 SOURCE 的部分」都超過上限（初稿某小節異常龐大）時回傳 null，由呼叫端誠實
// 記錄 CONTEXT_OVERFLOW。
function fitSourceIntoPrompt(build, sourceText, focusText) {
  const full = build(sourceText);
  if (isContextSafe(full)) return { prompt: full, windowed: false };
  const overhead = estimateTokenCount(build(''));
  const budget = CONTEXT_SAFE_TOKEN_LIMIT - overhead - 64;
  if (budget < 512) return null;
  const window = selectSourceWindow(sourceText, focusText, budget);
  const prompt = build(window.text);
  return isContextSafe(prompt) ? { prompt, windowed: window.windowed } : null;
}

function isContextSafe(promptText, safeLimit = CONTEXT_SAFE_TOKEN_LIMIT) {
  return estimateTokenCount(promptText) <= safeLimit;
}

// 真實 Ollama 硬體量測（GTX 1660 Ti，qwen2.5:7b-instruct-q4_K_M，無 timeout 上限）：
// 完整 semantic claim adjudication 實際耗時約 412 秒。4 秒／600 秒等「縮短測試時間」式
// timeout 一律不可接受；此常數只作為「可靠 long-running 機制」的內部安全上限，
// 真正的非阻塞行為由呼叫端（server.js 的 job queue）負責，不得讓瀏覽器同步阻塞。
// 2026-10-04：大份 SOURCE 在 6 GB 顯卡上（模型部分跑在 CPU）單次呼叫實測 8～15 分鐘，
// 15 分鐘上限讓部分小節逾時而缺漏。改為預設 60 分鐘，可用 OLLAMA_ADJUDICATION_TIMEOUT_MS 調整。
const DEFAULT_ADJUDICATION_TIMEOUT_MS = Number(process.env.OLLAMA_ADJUDICATION_TIMEOUT_MS) || 3600000; // 60 分鐘

// Semantic Cross-Council Adjudicator 允許的裁決結果——僅此四種，不得自創其他狀態。
const VERDICTS = Object.freeze({
  SUPPORTED: 'SUPPORTED',
  CONTRADICTED: 'CONTRADICTED',
  UNSUPPORTED: 'UNSUPPORTED',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
});
const VALID_VERDICTS = new Set(Object.values(VERDICTS));

// 明確、可追溯的 fallback / 拒絕原因代碼；不得以 undefined.trim() 等二次例外碰巧觸發 fallback。
const FAILURE_REASON = Object.freeze({
  NO_SOURCE: 'NO_CANONICAL_SOURCE',
  CONTEXT_OVERFLOW: 'OLLAMA_CONTEXT_OVERFLOW',
  HTTP_ERROR: 'OLLAMA_HTTP_ERROR',
  EMPTY_RESPONSE: 'OLLAMA_EMPTY_RESPONSE',
  TIMEOUT: 'OLLAMA_TIMEOUT',
  CONNECTION_ERROR: 'OLLAMA_CONNECTION_ERROR',
  INVALID_JSON: 'CLAIM_RESPONSE_INVALID_JSON',
  SCHEMA_INVALID: 'CLAIM_RESPONSE_SCHEMA_INVALID',
  ATTRIBUTION_LEAKAGE: 'SOURCE_ATTRIBUTION_LEAKAGE',
  SOURCE_TRUTH_GATE_HARD_FAIL: 'SOURCE_TRUTH_GATE_HARD_FAIL',
});

// ChatGPT/Gemini/Claude 觀點標籤不得殘留於 Qwen 語意裁決後的正式內容（Source Attribution Leakage Gate）。
const ATTRIBUTION_LEAK_PATTERNS = [
  /ChatGPT\s*(?:\(Web\))?\s*(?:觀點|認為)/,
  /Gemini\s*(?:\(Web\))?\s*(?:觀點|認為)/,
  /Claude\s*(?:\(Web\))?\s*(?:觀點|認為)/,
];

function detectAttributionLeakage(sections) {
  const combined = Object.values(sections || {}).join('\n');
  return ATTRIBUTION_LEAK_PATTERNS.some((pattern) => pattern.test(combined));
}

function findIncompleteSections(sections) {
  return SECTION_DEFS.filter((def) => {
    const value = sections?.[keyOf(def)];
    return typeof value !== 'string' || value.trim().length === 0;
  }).map((def) => keyOf(def));
}

function extractSectionsFromDraft(draftText) {
  const sections = {};
  SECTION_DEFS.forEach((def) => {
    sections[keyOf(def)] = '';
  });

  if (!draftText || typeof draftText !== 'string') {
    return sections;
  }

  const headerRegex = /(?:^|\r?\n)\s*(?:##\s*)?([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮])[\s　]*([^\r\n]*)/g;
  const matches = [];
  let match;

  while ((match = headerRegex.exec(draftText)) !== null) {
    const num = match[1];
    const rawTitle = (match[2] || '').trim();

    const def = SECTION_DEFS.find((item) => {
      if (item.num !== num) return false;
      if (!rawTitle) return true;
      return rawTitle.replace(/^[\s　:：\-—]+/, '').startsWith(item.title);
    });

    if (!def) continue;

    matches.push({
      key: keyOf(def),
      headerStart: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const nextStart =
      i + 1 < matches.length ? matches[i + 1].headerStart : draftText.length;

    sections[current.key] = draftText
      .slice(current.contentStart, nextStart)
      .trim();
  }

  return sections;
}

async function checkOllamaAvailable(url = process.env.OLLAMA_URL || 'http://ollama:11434') {
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function failure(message, reason) {
  const error = new Error(message);
  error.reason = reason;
  return error;
}

async function callOllamaAdjudication(
  prompt,
  model = 'qwen2.5:7b-instruct-q4_K_M',
  url = process.env.OLLAMA_URL || 'http://ollama:11434',
  timeoutMs = DEFAULT_ADJUDICATION_TIMEOUT_MS,
) {
  const numCtx = contextWindowFor(prompt);
  let response;
  try {
    // format: 'json' 必須明確指定：實測（qwen2.5:7b-instruct-q4_K_M，較新版 Ollama/llama-server）
    // 若不指定，模型輸出 ```json 圍欄區塊會被 server 內建的 tool-call 樣板解析器
    // （common_chat_peg_parse）誤判為不合法輸出，導致生成在約第 100 個 token 處被強制中止
    // （甚至截斷在多位元組字元中間），claims JSON 永遠不完整、100% 觸發
    // CLAIM_RESPONSE_INVALID_JSON。加上 format: 'json' 走 grammar-constrained JSON 解碼，
    // 繞過該樣板解析器，才能真正取得完整回應。
    // num_predict 明確指定為輸出額度上限，與 CONTEXT_SAFE_TOKEN_LIMIT 用同一個常數，
    // 確保「安全門檻允許送出」與「模型實際被允許輸出多少」一致。
    // temperature: 0（greedy decoding，非 0.1）：SOURCE Truth Gate 要求 quoted_source_span
    // 逐字元與 SOURCE 相符，任何取樣隨機性都可能讓模型選到形似但錯誤的罕見字（例如「弳」
    // 誤植為「弹」），導致本來正確的 Claim 被判 CONTRADICTED。裁決任務要的是精確重現，
    // 不是文字多樣性，temperature=0 消除這個誤差來源。
    response = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0, num_ctx: numCtx, num_predict: CONTEXT_OUTPUT_RESERVE_TOKENS },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    // AbortSignal.timeout() 觸發時，Node/undici 拋出的錯誤名稱依版本可能是
    // TimeoutError 或 AbortError；其餘 fetch 例外（ECONNREFUSED、DNS 失敗等）視為連線錯誤。
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw failure(`Ollama 逾時（timeoutMs=${timeoutMs}）：${error.message}`, FAILURE_REASON.TIMEOUT);
    }
    throw failure(`Ollama 連線失敗：${error?.message || error}`, FAILURE_REASON.CONNECTION_ERROR);
  }

  if (!response.ok) {
    throw failure(`Ollama HTTP ${response.status}`, FAILURE_REASON.HTTP_ERROR);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw failure(`Ollama response 非合法 JSON：${error?.message || error}`, FAILURE_REASON.EMPTY_RESPONSE);
  }

  if (data && data.error) {
    throw failure(`Ollama error: ${data.error}`, FAILURE_REASON.HTTP_ERROR);
  }

  if (!data || typeof data.response !== 'string') {
    throw failure('Ollama response 缺少 response 欄位', FAILURE_REASON.EMPTY_RESPONSE);
  }

  if (data.response.trim().length === 0) {
    throw failure('Ollama response 為空字串', FAILURE_REASON.EMPTY_RESPONSE);
  }

  // 估算仍可能偏低：Ollama 回報實際讀入的 prompt tokens 已填滿 num_ctx，代表開頭（SOURCE）
  // 被截掉了。這種結果不完整，不得採用，明確以 CONTEXT_OVERFLOW 失敗並記錄實際數字，
  // 供調整 OLLAMA_TOKEN_ESTIMATE_MARGIN。
  if (Number(data.prompt_eval_count) >= numCtx - CONTEXT_OUTPUT_RESERVE_TOKENS) {
    console.warn(`[council] prompt 被 Ollama 截斷：實際 ${data.prompt_eval_count} tokens，估算 ${estimateTokenCount(prompt)}，num_ctx ${numCtx}`);
    throw failure(
      `Ollama 截斷了 prompt（實際 ${data.prompt_eval_count} tokens ≥ num_ctx ${numCtx} − 輸出額度），結果不完整`,
      FAILURE_REASON.CONTEXT_OVERFLOW,
    );
  }

  return data.response;
}

// ---------------------------------------------------------------------------
// Claim-level Semantic Cross-Council Adjudication
//
// Canonical SOURCE 是唯一 Truth Anchor。Qwen2.5 不是第四份 Draft、不是投票者，
// 是 Semantic Cross-Council Adjudicator：對三方 Draft 抽取出的 Claim 逐一比對
// Canonical SOURCE evidence 後裁決，裁決優先序固定為
//   Canonical SOURCE evidence > SOURCE-grounded semantic reasoning >
//   Claim-level evidence > Draft quality > Cross-draft agreement（majority vote 禁止使用）。
// ---------------------------------------------------------------------------

function buildClaimAdjudicationPrompt(metadata, sourceText, drafts) {
  return [
    '你是 AI-Study-Council 的 Semantic Cross-Council Adjudicator（語意裁決者）。',
    '你不是第四份初稿，也不是投票者；你的任務是針對三方初稿中的每一個 Claim（陳述），',
    '對照下方【CANONICAL SOURCE】逐一裁決，並輸出結構化 JSON。',
    '',
    '裁決優先順序（固定，不得更動）：',
    '1. Canonical SOURCE evidence（唯一 Truth Anchor）',
    '2. SOURCE-grounded semantic reasoning',
    '3. Claim-level evidence',
    '4. Draft 本身品質',
    '5. 三方初稿是否一致（禁止使用：不得因為兩份初稿意見相同就判定為正確，即禁止 majority vote）',
    '',
    '範例（必須遵守的行為）：',
    '若 SOURCE 寫「頭觸硬壁，驀然而踣」，',
    '而 ChatGPT 初稿與 Gemini 初稿都寫「頭觸硬壁，蹶然而踣」（兩份意見相同），',
    'Claude 初稿寫「頭觸硬壁，驀然而踣」且引用 SOURCE 頁碼，',
    '你必須裁決「驀然而踣」為正確（SUPPORTED），「蹶然而踣」為錯誤（CONTRADICTED）——',
    '即使那是兩份初稿一致的說法。不得因為兩票對一票而選擇「蹶然而踣」。',
    '',
    `學校：${metadata.school}　年級：${metadata.grade}　科目：${metadata.subject}　單元：${metadata.unit}`,
    '',
    '【CANONICAL SOURCE（唯一 Truth Anchor，逐字引用時必須與此完全一致）】',
    sourceText,
    '',
    '【ChatGPT 初稿】',
    drafts.chatgpt || '',
    '',
    '【Gemini 初稿】',
    drafts.gemini || '',
    '',
    '【Claude 初稿】',
    drafts.claude || '',
    '',
    '請將三方初稿中的重要 Claim 抽取出來（可合併重複／近似重複的 Claim 為同一項），',
    '這個階段「只負責抽取與初步分類」，不需要裁決 verdict、不需要逐字引用 SOURCE——',
    '這兩件事會由後續針對「單一 Claim」的獨立步驟處理（避免同時處理多個 Claim 時，',
    '逐字引用罕見字元的精確度下降）。',
    '',
    '【Section Coverage 規則（Gate 2，不得省略任何一步）】',
    '這一步曾經發生過真實的失敗案例：三份初稿共 13 個有內容的小節，最後只抽出 1 個',
    'claim，其餘 12 個小節完全沒有任何 claim、變成空白——原因是過度套用「合併近似',
    'Claim」，把整份初稿壓縮成極少數幾條，而不是逐小節檢查。以下規則就是為了避免',
    '同樣的事再發生一次：',
    '1. 先逐一檢查①~⑬每一個小節：這個小節在三份初稿裡「是否曾經出現過任何實質內容」',
    '   （哪怕只有一句話）。',
    '2. 只要一個小節在任一份初稿裡有實質內容，就「必須」為該小節產生至少一個 claim——',
    '   即使三份初稿講的是同一件事，也要有一個 claim 對應到這個小節，不能因為合併',
    '   就讓這個小節完全消失、一個 claim 都沒有。',
    '3. 「合併重複／近似重複的 Claim」只能發生在「同一個小節內部」（例如三份初稿都在',
    '   ①核心概念裡描述同一件事），不得把不同小節的內容合併成同一條 claim——即使兩個',
    '   小節聽起來相關，也要各自產生各自的 claim，因為合併會讓其中一個小節的覆蓋率',
    '   消失，且合併出來的敘述在 SOURCE 中往往找不到逐字對應的段落。',
    '4. 如果同一個 claim 內容確實同時對應到多個小節，可以在 "sections" 陣列裡列出全部',
    '   對應的小節（見下方 schema），不要只挑一個。',
    '5. 如果一個小節「確實有內容」，但三份初稿的說法你認為不足以形成一個可驗證的',
    '   claim（例如內容太模糊、太片段、三方分歧過大無法整合），「不得」為了湊數而捏造',
    '   或過度延伸出一個 claim。但也「不得」什麼都不回報、直接略過——這正是這一步曾經',
    '   真正發生過的失敗模式（省略等同於讓這個小節憑空消失）。正確做法：把這個小節列進',
    '   "unresolved_sections" 陣列，簡短說明為什麼無法形成可驗證 claim（見下方 schema）。',
    '6. 換句話說，①~⑬ 裡「每一個」在三份初稿中有實質內容的小節，最後都必須能在你的',
    '   輸出裡找到——要嘛出現在某個 claim 的 "section"/"sections" 裡，要嘛出現在',
    '   "unresolved_sections" 裡。不得有任何一個有內容的小節，兩邊都找不到。',
    '',
    '「只」輸出一個 JSON 物件，不得輸出任何 JSON 以外的文字：',
    '',
    '{',
    '  "claims": [',
    '    {',
    '      "claim_id": "c1",',
    '      "section": "①核心概念",',
    '      "sections": ["①核心概念"],',
    '      "claim": "融合後的最終陳述文字（繁體中文，不得出現 ChatGPT/Gemini/Claude 字樣）"',
    '    }',
    '  ],',
    '  "unresolved_sections": [',
    '    {',
    '      "section": "④文意理解",',
    '      "reason": "三份初稿對這段的理解分歧過大，無法整合成一個可驗證的陳述"',
    '    }',
    '  ]',
    '}',
    '',
    '"section" 是主要對應小節，"sections" 是這個 claim 實際對應到的「所有」小節（通常',
    '跟 "section" 只有一個、內容相同；只有當這個 claim 確實同時支持多個小節時才會有',
    '一個以上的元素）。"claims"／"unresolved_sections" 裡出現的每一個小節字串都必須是',
    '下列 15 個字串之一，且同一個小節不應該同時出現在兩邊：',
    SECTION_KEYS.join('、'),
  ].join('\n');
}

// Gate 2（分批抽取）：真實驗證發現，即使 buildClaimAdjudicationPrompt 已經加上完整性規則，
// 一次要求模型自己逐一檢查①~⑬全部 13 個小節，實測（真實 Ollama、真實 SOURCE）仍然只顧到
// 2 個小節——不是規則寫得不夠清楚，是「同時追蹤 13 件事」這個任務本身對這顆模型來說負荷
// 太重。這裡改成同一種思路已經證明有效兩次的做法（checkSourcePlausibility 分塊、
// verifyAllClaims 逐一裁決）：不要求模型自己記得檢查全部小節，改由程式碼的迴圈保證
// 「每個小節都會被單獨問一次」——完整性變成結構上的保證，不是拜託模型自律的期望。
// 每次呼叫只給「這一個小節」在三份初稿裡的內容，但完整 SOURCE 仍然整份給——因為裁決
// 一個小節的 claim 時，佐證可能出現在 SOURCE 任何地方，不能只給對應片段。
function buildSectionClaimExtractionPrompt(metadata, sourceText, sectionKey, draftSnippets) {
  return [
    '你是 AI-Study-Council 的 Semantic Cross-Council Adjudicator（語意裁決者）。',
    '你不是第四份初稿，也不是投票者；你的任務是針對三方初稿中的 Claim（陳述），',
    '對照下方【CANONICAL SOURCE】逐一裁決，並輸出結構化 JSON。',
    '',
    '這一次「只」需要處理一個小節：' + sectionKey + '。下面只會給你三份初稿裡',
    '屬於這個小節的內容，不是整份初稿——請專注在這一個小節上。',
    '',
    '裁決優先順序（固定，不得更動）：',
    '1. Canonical SOURCE evidence（唯一 Truth Anchor）',
    '2. SOURCE-grounded semantic reasoning',
    '3. Claim-level evidence',
    '4. Draft 本身品質',
    '5. 三方初稿是否一致（禁止使用：不得因為兩份初稿意見相同就判定為正確，即禁止 majority vote）',
    '',
    `學校：${metadata.school}　年級：${metadata.grade}　科目：${metadata.subject}　單元：${metadata.unit}`,
    '',
    '【CANONICAL SOURCE（唯一 Truth Anchor，逐字引用時必須與此完全一致）】',
    sourceText,
    '',
    `【三方初稿中，屬於「${sectionKey}」的內容】`,
    'ChatGPT：',
    draftSnippets.chatgpt || '（這份初稿在這個小節沒有內容）',
    '',
    'Gemini：',
    draftSnippets.gemini || '（這份初稿在這個小節沒有內容）',
    '',
    'Claude：',
    draftSnippets.claude || '（這份初稿在這個小節沒有內容）',
    '',
    '請把上面三份初稿中，屬於這個小節的重要 Claim 抽取出來（可合併重複／近似重複的',
    '說法為同一項——三方講的是同一件事時，合併成一個 claim，不要各自重複列出）。',
    '這個階段「只負責抽取與初步分類」，不需要裁決 verdict、不需要逐字引用 SOURCE——',
    '這兩件事會由後續針對「單一 Claim」的獨立步驟處理。',
    '',
    '這個小節「一定」有內容（至少一份初稿寫了東西），所以你「必須」在下面兩者之一',
    '回應：抽出至少一個 claim，或是回報 unresolved（三方說法都不足以形成一個可驗證',
    '的陳述時使用——不得為了湊數而捏造或過度延伸，直接誠實回報 unresolved 即可，',
    '不要什麼都不回應）。',
    '',
    '「只」輸出一個 JSON 物件，不得輸出任何 JSON 以外的文字：',
    '',
    '有 claim 時：',
    '{ "claims": [ { "claim_id": "c1", "claim": "融合後的陳述文字（繁體中文，不得出現 ChatGPT/Gemini/Claude 字樣）" } ] }',
    '',
    '無法形成可驗證 claim 時：',
    '{ "claims": [], "unresolved": { "reason": "簡短說明為什麼三方說法不足以形成可驗證陳述" } }',
  ].join('\n');
}

// 依序（不平行）逐小節送出獨立、聚焦的抽取請求，理由同 verifyAllClaims／
// checkSourcePlausibility 上方註解（單一 inference slot，平行送出會讓精確度下降）。
// 三份初稿在某個小節完全沒有內容時直接跳過，不浪費一次 Ollama 呼叫，也不需要問模型
// 「這裡沒東西」這種顯而易見的事——computeSectionCoverage 本來就只把「有內容」的
// 小節算進分母，沒內容的小節從一開始就不在覆蓋率的要求範圍內。
// 單一小節呼叫失敗（逾時／連線錯誤／回應不合法）不中斷整個流程：跳過這個小節，讓
// 下游的 computeSectionCoverage 依三份初稿內容自動判定為「有內容但未覆蓋」，誠實
// 反映在 quality_gate（見 assembleCouncilFinal）——不得因為某幾個小節呼叫失敗就假裝
// 整份都沒問題，也不得因此讓整個裁決直接失敗，犧牲掉已經成功處理的其他小節。
async function extractClaimsPerSection(metadata, sourceText, draftSectionMaps, model, url, timeoutMs) {
  const claims = [];
  const unresolvedSections = [];
  let anySectionSucceeded = false;
  let anySectionAttempted = false;
  let lastFailureReason = null;
  let sourceWindowed = false;

  for (const sectionKey of CONTENT_SECTION_KEYS) {
    const snippets = {
      chatgpt: draftSectionMaps.gpt?.[sectionKey] || '',
      gemini: draftSectionMaps.gemini?.[sectionKey] || '',
      claude: draftSectionMaps.claude?.[sectionKey] || '',
    };

    const hasContent = Object.values(snippets).some((text) => text.trim().length > 0);
    if (!hasContent) continue; // 三份都沒寫，不是缺口，不需要問模型

    anySectionAttempted = true;
    // SOURCE 放得下就整份給；超過模型最大 context 時給與這個小節最相關的段落
    // （fitSourceIntoPrompt）。只有初稿這個小節本身就超過上限時才跳過並記錄。
    const fitted = fitSourceIntoPrompt(
      (src) => buildSectionClaimExtractionPrompt(metadata, src, sectionKey, snippets),
      sourceText,
      Object.values(snippets).join('\n'),
    );
    if (!fitted) {
      lastFailureReason = FAILURE_REASON.CONTEXT_OVERFLOW;
      continue;
    }
    const { prompt } = fitted;
    if (fitted.windowed) sourceWindowed = true;

    let raw;
    try {
      // eslint-disable-next-line no-await-in-loop
      raw = await callOllamaAdjudication(prompt, model, url, timeoutMs);
    } catch (error) {
      lastFailureReason = error?.reason || FAILURE_REASON.CONNECTION_ERROR;
      continue;
    }

    let parsedSection;
    try {
      parsedSection = parseSectionClaimResponse(raw, sectionKey);
    } catch (error) {
      lastFailureReason = error?.reason || FAILURE_REASON.SCHEMA_INVALID;
      continue;
    }

    anySectionSucceeded = true;
    claims.push(...parsedSection.claims);
    unresolvedSections.push(...parsedSection.unresolvedSections);
  }

  return { claims, unresolvedSections, anySectionAttempted, anySectionSucceeded, lastFailureReason, sourceWindowed };
}

function extractJsonObject(raw) {
  const text = String(raw ?? '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw failure('Qwen 回應中找不到 JSON 物件', FAILURE_REASON.INVALID_JSON);
  }
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    throw failure(`Qwen 回應 JSON 解析失敗：${error?.message || error}`, FAILURE_REASON.INVALID_JSON);
  }
}

// P0-10：抽取階段（多 Claim 同時處理）只負責「找出 Claim 並分類」，不再要求 verdict／
// quoted_source_span——實測同時裁決＋逐字引用會讓罕見字元精確度下降。這兩件事延後到
// verifyClaimAgainstSource（單一 Claim、低負載）處理，此函式因此不再強制要求 verdict：
// 若回應仍帶有 verdict（例如舊格式、或測試 fixture），只在「有提供但不合法」時才視為
// SCHEMA_INVALID；完全沒提供 verdict 是新設計下的正常情況。
// 共用的單一 claim 物件解析邏輯：parseClaimAdjudicationResponse（舊版一次全文抽取，仍保留
// 供獨立單元測試／schema 驗證使用）與 parseSectionClaimResponse（Gate 2 分批抽取，見下方）
// 共用同一套欄位驗證規則，避免兩處各自維護一份、久了不同步。
function parseClaimObject(raw_claim, index) {
  const claim = raw_claim && typeof raw_claim === 'object' ? raw_claim : {};
  if (typeof claim.claim !== 'string' || claim.claim.trim().length === 0) {
    throw failure(`第 ${index + 1} 個 claim 缺少 claim 文字`, FAILURE_REASON.SCHEMA_INVALID);
  }
  if (claim.verdict !== undefined && claim.verdict !== null && !VALID_VERDICTS.has(claim.verdict)) {
    throw failure(
      `第 ${index + 1} 個 claim 的 verdict「${claim.verdict}」不在允許清單內`,
      FAILURE_REASON.SCHEMA_INVALID,
    );
  }

  const section = SECTION_KEYS.includes(claim.section) ? claim.section : null;
  // Gate 2：一個 claim 可能同時對應多個小節（見 buildClaimAdjudicationPrompt 的
  // sections 規則）。只採信 SECTION_KEYS 允許清單內的值，過濾掉模型自創的字串；
  // 沒有提供合法 sections 陣列時，退回只用 section 這個單一小節（維持舊格式相容）。
  const sectionsRaw = Array.isArray(claim.sections) ? claim.sections.filter((s) => SECTION_KEYS.includes(s)) : [];
  const sections = sectionsRaw.length > 0 ? [...new Set(sectionsRaw)] : section ? [section] : [];
  const confidenceRaw = Number(claim.confidence);
  const confidence = Number.isFinite(confidenceRaw) ? Math.min(1, Math.max(0, confidenceRaw)) : 0.5;

  return {
    claim_id: typeof claim.claim_id === 'string' && claim.claim_id ? claim.claim_id : `c${index + 1}`,
    section,
    sections,
    claim: claim.claim.trim(),
    quoted_source_span:
      typeof claim.quoted_source_span === 'string' && claim.quoted_source_span.trim()
        ? claim.quoted_source_span.trim()
        : null,
    verdict: VALID_VERDICTS.has(claim.verdict) ? claim.verdict : null,
    reason: typeof claim.reason === 'string' && claim.reason.trim() ? claim.reason.trim() : '（模型未提供理由）',
    confidence,
    overridden: false,
  };
}

function parseUnresolvedSectionsArray(rawArray) {
  // Gate 2：模型誠實回報「這個小節有內容，但無法形成可驗證 claim」的小節——不是捏造出來
  // 的 claim（不會進 verifyAllClaims／SOURCE Truth Gate，因為根本沒有可驗證的引用可比對），
  // 只是明確記錄「這裡曾經被檢查過，結論是證據不足」，跟「模型根本沒提到這個小節」
  // （後續 computeSectionCoverage 判定為 NO_CLAIM_OR_STATUS_REPORTED）是不同等級的問題。
  return Array.isArray(rawArray)
    ? rawArray
        .filter((item) => item && SECTION_KEYS.includes(item.section))
        .map((item) => ({
          section: item.section,
          reason:
            typeof item.reason === 'string' && item.reason.trim() ? item.reason.trim() : '（模型未說明原因）',
        }))
    : [];
}

function parseClaimAdjudicationResponse(raw) {
  const parsed = extractJsonObject(raw);

  if (!parsed || !Array.isArray(parsed.claims) || parsed.claims.length === 0) {
    throw failure('Qwen 回應缺少非空的 claims 陣列', FAILURE_REASON.SCHEMA_INVALID);
  }

  const claims = parsed.claims.map((raw_claim, index) => parseClaimObject(raw_claim, index));
  const unresolvedSections = parseUnresolvedSectionsArray(parsed.unresolved_sections);

  return { claims, unresolvedSections };
}

// Gate 2（分批抽取，見 extractClaimsPerSection 上方註解）：每次呼叫只問「一個」小節，
// 所以 schema 比 parseClaimAdjudicationResponse 簡單很多——不需要 section／sections
// 欄位（呼叫端已經知道這次問的是哪個小節，直接指定，不採信模型自己回報的小節字串，
// 避免模型張冠李戴），也不需要 unresolved_sections 陣列（最多就一個小節、一個 unresolved
// 物件）。「完全沒有 claim、也沒有 unresolved」視為 SCHEMA_INVALID——我們明確只問了這一個
// 小節，模型不回答等同於沒有正確處理這次請求，不能靜默當成「這個小節沒事」。
function parseSectionClaimResponse(raw, sectionKey) {
  const parsed = extractJsonObject(raw);
  const rawClaims = Array.isArray(parsed?.claims) ? parsed.claims : [];

  const claims = rawClaims.map((raw_claim, index) => {
    const parsedClaim = parseClaimObject(raw_claim, index);
    // 這次呼叫只問了 sectionKey 這一個小節，不採信模型自己回報的 section／sections——
    // 呼叫端本來就知道答案，用呼叫端的值覆寫，避免模型張冠李戴到別的小節。
    return { ...parsedClaim, section: sectionKey, sections: [sectionKey] };
  });

  const unresolvedRaw =
    parsed && parsed.unresolved && typeof parsed.unresolved === 'object' ? parsed.unresolved : null;
  const unresolvedSections = unresolvedRaw
    ? [
        {
          section: sectionKey,
          reason:
            typeof unresolvedRaw.reason === 'string' && unresolvedRaw.reason.trim()
              ? unresolvedRaw.reason.trim()
              : '（模型未說明原因）',
        },
      ]
    : [];

  if (claims.length === 0 && unresolvedSections.length === 0) {
    throw failure(
      `Qwen 針對小節「${sectionKey}」的回應既沒有 claims 也沒有 unresolved，未正確處理這次請求`,
      FAILURE_REASON.SCHEMA_INVALID,
    );
  }

  return { claims, unresolvedSections };
}

// Levenshtein edit distance——用於「近似但不相同」的引用比對（例如「蹶然」vs「驀然」）。
function levenshteinDistance(a, b) {
  const s = String(a ?? '');
  const t = String(b ?? '');
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) prev[j] = j;

  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// 在 sourceText 中尋找與 needle 長度相近、編輯距離最小的片段（滑動視窗）。
// 用來偵測「SOURCE 其實有近似但不同的內容」（真衝突），而非「SOURCE 完全沒提到」（證據不足）。
function findApproxMatch(needle, sourceText) {
  const n = String(needle ?? '');
  const src = String(sourceText ?? '');
  if (n.length === 0 || src.length === 0) return null;

  let best = null;
  const windowSizes = new Set([n.length, Math.max(1, n.length - 1), n.length + 1]);

  windowSizes.forEach((windowSize) => {
    if (windowSize <= 0 || windowSize > src.length) return;
    for (let i = 0; i + windowSize <= src.length; i += 1) {
      const candidate = src.slice(i, i + windowSize);
      const distance = levenshteinDistance(n, candidate);
      if (!best || distance < best.distance) {
        best = { distance, matchedText: candidate, index: i };
      }
      if (best.distance === 0) return;
    }
  });

  return best;
}

// Final SOURCE Truth Gate（deterministic 層）：SOURCE evidence 優先於 Draft agreement，
// 不依賴模型是否「聽話」——對每一個帶有 quoted_source_span 的 Claim，直接以字串比對／
// 編輯距離對照 Canonical SOURCE，必要時覆寫模型自己給出的 verdict。
//
// allDraftsText（選填，預設空字串——3 個既有單元測試直接以 2 個參數呼叫本函式，
// 行為必須維持完全不變）：實測發現 near-miss（edit distance 很小）有兩種完全不同的成因，
// 不能用同一套規則處理：
//   (a) 三方初稿中「真的」有一方寫錯（例如「蹶然而踣」實際出現在 ChatGPT／Gemini 初稿中）——
//       這是真實的跨初稿衝突，即使只差一兩個字也必須嚴格判 CONTRADICTED（P0-02 acceptance fixture）。
//   (b) 三方初稿全部都寫對，錯字是 Qwen 自己在同一次生成內部產生的字元誤植（例如「弳」被生成成
//       「弹」，但三份原始初稿裡完全找不到「弹」這個字）——這不是任何一方初稿真正主張的內容，只是
//       模型自己的生成雜訊，不該被當成「初稿衝突」而降級，應直接採用我們已經算出的 SOURCE 正確
//       片段修正為 SUPPORTED。
// 判斷依據：near-miss 片段是否「實際出現在三份原始初稿的任一份」——出現過，代表真的有初稿這樣主張，
// 維持嚴格 CONTRADICTED；三份都沒出現過，代表是模型自己生成時的誤植，予以自動修正。
function applySourceTruthGate(claims, sourceText, allDraftsText = '') {
  const src = String(sourceText ?? '');
  const draftsText = String(allDraftsText ?? '');

  const gatedClaims = claims.map((claim) => {
    if (!claim.quoted_source_span) {
      // 無具體引用的概念性 Claim：交由模型的語意判斷，僅確保欄位完整。
      return { ...claim, source_ref: null };
    }

    const span = claim.quoted_source_span;

    if (src.includes(span)) {
      return {
        ...claim,
        verdict: VERDICTS.SUPPORTED,
        source_ref: span,
        reason: `SOURCE 逐字包含此引用，判定為 SUPPORTED（deterministic SOURCE Truth Gate 確認）。原理由：${claim.reason}`,
        overridden: claim.verdict !== VERDICTS.SUPPORTED,
      };
    }

    const approx = findApproxMatch(span, src);
    const nearMatchThreshold = Math.max(1, Math.ceil(span.length * 0.25));

    if (approx && approx.distance > 0 && approx.distance <= nearMatchThreshold) {
      const spanAssertedByAnyDraft = draftsText.length > 0 && draftsText.includes(span);

      if (!spanAssertedByAnyDraft && draftsText.length > 0) {
        return {
          ...claim,
          verdict: VERDICTS.SUPPORTED,
          source_ref: approx.matchedText,
          quoted_source_span: approx.matchedText,
          reason: `模型輸出的引用「${span}」與 SOURCE 實際內容「${approx.matchedText}」僅有些微字元差異（edit distance=${approx.distance}），` +
            `且三方初稿原文皆未出現這個版本的說法，判定為模型生成過程中的字元誤植（而非任何一方初稿真正主張的內容），` +
            `自動採用 SOURCE 原文修正為 SUPPORTED（deterministic SOURCE Truth Gate 確認）。`,
          overridden: claim.verdict !== VERDICTS.SUPPORTED,
        };
      }

      return {
        ...claim,
        verdict: VERDICTS.CONTRADICTED,
        source_ref: approx.matchedText,
        reason: `SOURCE 實際內容為「${approx.matchedText}」，與 claim 引用「${span}」不符（edit distance=${approx.distance}，deterministic SOURCE Truth Gate 覆寫，優先於任何 Draft 共識）。`,
        overridden: true,
      };
    }

    return {
      ...claim,
      verdict: VERDICTS.INSUFFICIENT_EVIDENCE,
      source_ref: null,
      reason: `SOURCE 中找不到與引用「${span}」相近的內容，證據不足，不得視為已驗證事實（deterministic SOURCE Truth Gate 覆寫）。`,
      overridden: claim.verdict !== VERDICTS.INSUFFICIENT_EVIDENCE,
    };
  });

  return gatedClaims;
}

// 實測發現（qwen2.5:7b-instruct-q4_K_M）：模型在單一請求中同時抽取＋裁決多個 claim 時，
// 罕見字元的逐字複製精確度會下降（例如「弳」誤植為「弹」），但單獨要求它逐字複製「同一句話」
// 時可 100% 正確重現。可見這是「多工同時處理」造成的精確度衰減，不是模型或量化本身無法產生
// 該字元。因此對每一個被 deterministic SOURCE Truth Gate 判為 CONTRADICTED／
// INSUFFICIENT_EVIDENCE 的 claim，用「單一 claim、低負載」的聚焦請求重新確認一次逐字引用，
// 只有在第二次獨立確認也真的逐字命中 SOURCE 時才改判 SUPPORTED——絕不因為重試而放寬標準，
// 重試失敗一律維持原本（較嚴格）的裁決結果。
// P0-10：單一 Claim 的裁決 prompt——抽取階段（buildClaimAdjudicationPrompt）已不再要求
// verdict／逐字引用，這兩件事統一由這裡（針對單一 Claim、低負載）負責，是實際決定
// verdict 的唯一步驟，不是抽取階段的附屬檢查。
function buildClaimVerificationPrompt(sourceText, claimText) {
  return [
    '你是 AI-Study-Council 的 Semantic Cross-Council Adjudicator，正在裁決「單一一個」Claim（陳述）。',
    '你的任務：對照下方 CANONICAL SOURCE，判斷這個陳述是否成立，並盡可能給出可逐字核對的原文依據。',
    '',
    '裁決規則：',
    '1. 若這個陳述直接改寫自 SOURCE 中「某一段連續原文」，請將該段原文「逐字」複製到',
    '   quoted_source_span——每一個字元都必須與 SOURCE 完全相同，不得用意思相近、外觀相近或',
    '   發音相近的字取代，包括標點與罕見字；verdict 請填 SUPPORTED。',
    '2. 若這個陳述是綜合 SOURCE 中「多個不連續部分」得出的結論、沒有單一連續原文可逐字引用，',
    '   quoted_source_span 請填 null，並依你對 SOURCE 整體內容的理解直接判斷 verdict。',
    '3. 若 SOURCE 的內容與這個陳述的說法「確實不同」（真實衝突，不是你自己不確定），',
    '   quoted_source_span 請填 null，verdict 請填 CONTRADICTED。',
    '4. 若 SOURCE 完全沒有提到與這個陳述相關的內容，quoted_source_span 請填 null，',
    '   verdict 請填 INSUFFICIENT_EVIDENCE。',
    '',
    'verdict 只能是以下四種之一：SUPPORTED、CONTRADICTED、UNSUPPORTED、INSUFFICIENT_EVIDENCE。',
    '',
    '只輸出一個 JSON 物件，不得輸出任何其他文字：',
    '{ "quoted_source_span": "..." 或 null, "verdict": "...", "reason": "簡短理由" }',
    '',
    '【CANONICAL SOURCE（唯一 Truth Anchor，逐字引用時必須與此完全一致）】',
    sourceText,
    '',
    '【陳述】',
    claimText,
  ].join('\n');
}

async function verifyClaimAgainstSource(sourceText, claimText, model, url, timeoutMs) {
  const fitted = fitSourceIntoPrompt((src) => buildClaimVerificationPrompt(src, claimText), sourceText, claimText);
  if (!fitted) throw failure('單一 Claim 裁決 prompt 超過模型最大 context', FAILURE_REASON.CONTEXT_OVERFLOW);
  const raw = await callOllamaAdjudication(fitted.prompt, model, url, timeoutMs);
  const parsed = extractJsonObject(raw);
  return {
    windowed: fitted.windowed,
    quoted_source_span:
      typeof parsed.quoted_source_span === 'string' && parsed.quoted_source_span.trim()
        ? parsed.quoted_source_span.trim()
        : null,
    verdict: VALID_VERDICTS.has(parsed.verdict) ? parsed.verdict : null,
    reason: typeof parsed.reason === 'string' && parsed.reason.trim() ? parsed.reason.trim() : null,
  };
}

// 抽取階段只找出 Claim、不裁決；這裡才是真正決定每個 Claim verdict／引用的地方，
// 對「每一個」抽取出的 Claim 都執行（不只是失敗重試），確保全部 Claim 都用低負載、
// 單一聚焦的方式裁決，而不是讓抽取階段那個「同時處理多個 Claim」的大請求順便兼職。
// 必須依序（不得 Promise.all 平行送出）——理由見 retryDowngradedClaims 的註解：
// 這個部署的 Ollama/llama-server 只有一個 inference slot，平行送出共用長 SOURCE 前綴的
// 請求會讓 prompt cache／slot 重用機制使罕見字元的生成結果變得不穩定。
async function verifyAllClaims(claims, sourceText, model, url, timeoutMs) {
  const results = [];
  for (const claim of claims) {
    let verification;
    try {
      verification = await verifyClaimAgainstSource(sourceText, claim.claim, model, url, timeoutMs);
    } catch (error) {
      // 單一 Claim 的裁決呼叫本身失敗（逾時／連線錯誤等）：不得偽裝成功，
      // 標示為 INSUFFICIENT_EVIDENCE 並在 reason 中誠實記錄失敗原因，交由人工覆核。
      results.push({
        ...claim,
        quoted_source_span: null,
        verdict: VERDICTS.INSUFFICIENT_EVIDENCE,
        reason: `單一 Claim 裁決呼叫失敗（${error?.reason || 'UNKNOWN'}），無法完成 SOURCE-grounded 驗證，交由人工覆核。`,
        confidence: 0,
      });
      continue;
    }

    results.push({
      ...claim,
      quoted_source_span: verification.quoted_source_span,
      verdict: verification.verdict || VERDICTS.INSUFFICIENT_EVIDENCE,
      reason: verification.reason || '（模型未提供理由）',
      confidence: verification.verdict ? 1 : 0,
      ...(verification.windowed ? { source_windowed: true } : {}),
    });
  }
  return results;
}

// verifyAllClaims 已經對每個 Claim 各自做過一次低負載裁決，理論上罕見字元精確度已經很高；
// 這裡是防禦性的「第二次獨立確認」，只在 deterministic SOURCE Truth Gate 仍判定
// CONTRADICTED／INSUFFICIENT_EVIDENCE 時才觸發，作為最後一道保險。只看重試回傳的
// quoted_source_span 是否能逐字命中 SOURCE，不採信重試呼叫自己回報的 verdict——
// verdict 一律由 deterministic 比對決定，不冒然因為重試而放寬標準。
async function retryDowngradedClaims(claims, sourceText, model, url, timeoutMs) {
  const src = String(sourceText ?? '');
  const results = [];

  // 必須依序（await 逐一執行），不得 Promise.all 平行送出：實測 Ollama/llama-server 在這個
  // 部署只有單一 inference slot，平行送出多個共用同一段長 SOURCE 前綴的請求時，其 prompt
  // cache／slot 重用機制會讓罕見字元的生成結果變得不穩定（同一顆模型、同一份 prompt，
  // 序列執行 100% 正確、平行執行卻會出錯）。平行送出對這個單 slot 部署也沒有效能好處
  // （server 內部本來就會排隊序列化），所以序列執行沒有代價。
  for (const claim of claims) {
    const isDowngraded =
      claim.overridden &&
      (claim.verdict === VERDICTS.CONTRADICTED || claim.verdict === VERDICTS.INSUFFICIENT_EVIDENCE);
    if (!isDowngraded) {
      results.push(claim);
      continue;
    }

    let verification;
    try {
      verification = await verifyClaimAgainstSource(src, claim.claim, model, url, timeoutMs);
    } catch {
      results.push(claim); // 重試本身失敗（逾時／連線錯誤等）：維持原判定，不冒然改判
      continue;
    }

    const refinedSpan = verification.quoted_source_span;

    if (refinedSpan && src.includes(refinedSpan)) {
      results.push({
        ...claim,
        verdict: VERDICTS.SUPPORTED,
        source_ref: refinedSpan,
        quoted_source_span: refinedSpan,
        reason: `第一次單一 Claim 裁決仍逐字引用失真，第二次獨立重新確認，SOURCE 逐字包含「${refinedSpan}」，修正為 SUPPORTED。`,
        overridden: false,
        requoted: true,
      });
      continue;
    }

    results.push(claim); // 重試仍無法逐字命中 SOURCE：真實不符，維持原判定
  }

  return results;
}

// Claim Verification Score：既有語意不變（抽取出的 claims 裡，驗證通過的比例）。
// Gate 2 之後這個數字「只」代表已抽取 claim 的品質，不再兼職代表整份教材是否完整
// 處理過——那件事由下面的 computeSectionCoverage／computeDocumentCompleteness 負責。
function computeFinalScoreFromClaims(claims) {
  if (!Array.isArray(claims) || claims.length === 0) return 'N/A';
  const supported = claims.filter((c) => c.verdict === VERDICTS.SUPPORTED).length;
  return Math.round((supported / claims.length) * 100);
}

// 一個 claim 實際對應到的小節清單：優先採用 sections 陣列（見 buildClaimAdjudicationPrompt
// 的多小節規則），沒有的話退回單一 section 欄位（相容舊資料／舊測試 fixture）。
function sectionsOfClaim(claim) {
  if (Array.isArray(claim.sections) && claim.sections.length > 0) {
    return claim.sections.filter((s) => CONTENT_SECTION_KEYS.includes(s));
  }
  return claim.section && CONTENT_SECTION_KEYS.includes(claim.section) ? [claim.section] : [];
}

// Gate 2（真實案例驅動）：13 個有內容的小節，實測發生過「只抽出 1 個 claim，其餘 12 個
// 小節完全空白，但 quality_gate 仍然 PASS」的失敗——因為原本的 final_score 只看「已抽取
// claim 裡驗證通過的比例」，從未檢查「有沒有把每個有內容的小節都抽出來」。
//
// 這裡刻意不相信模型自己回報「我抽完了」，而是用 deterministic 的方式獨立判斷：直接
// 重用三份初稿已經解析好的 section map（extractSectionsFromDraft 的輸出），只要任一份
// 初稿在某個小節底下有非空白內容，就視為該小節「有實質內容」，再跟 claims 實際涵蓋到
// 的小節集合做差集——不論模型有沒有誠實回報，這個檢查都不會被繞過。
//
// unresolvedSections（parseClaimAdjudicationResponse 解析出的 unresolved_sections）是
// 模型「明確」回報「這個小節有內容，但我無法形成可驗證 claim」——這跟「模型什麼都沒
// 回報」是完全不同等級的問題：前者是誠實的裁決結果，該被記錄但不算是真正的缺口；
// 後者才是這個 Gate 真正要抓的、原本會被靜默吃掉的漏洞。兩者共用一個小節時，
// claim 優先（已經有真正可驗證的內容，不需要再看 unresolved 狀態）。
function computeSectionCoverage(draftSectionMaps, claims, unresolvedSections = []) {
  const contentSections = new Set();
  [draftSectionMaps.gpt, draftSectionMaps.gemini, draftSectionMaps.claude].forEach((sections) => {
    CONTENT_SECTION_KEYS.forEach((key) => {
      if (sections && typeof sections[key] === 'string' && sections[key].trim()) {
        contentSections.add(key);
      }
    });
  });

  const claimedSections = new Set();
  (claims || []).forEach((claim) => {
    sectionsOfClaim(claim).forEach((key) => claimedSections.add(key));
  });

  const unresolvedMap = new Map(
    (unresolvedSections || [])
      .filter((u) => u && CONTENT_SECTION_KEYS.includes(u.section))
      .map((u) => [u.section, u.reason || '（模型未說明原因）']),
  );

  const resolvedSections = new Set([...claimedSections, ...unresolvedMap.keys()]);

  const uncoveredSections = CONTENT_SECTION_KEYS.filter(
    (key) => contentSections.has(key) && !resolvedSections.has(key),
  ).map((key) => ({
    section_id: key,
    section_title: key,
    // NO_CLAIM_OR_STATUS_REPORTED：小節在初稿中確實有內容，但模型既沒有產生對應 claim，
    // 也沒有把它列進 unresolved_sections 明確說明——這才是真正的缺口（模型完全沒處理到
    // 這個小節），不是「已經檢查過、判定證據不足」那種誠實結果。
    reason: 'NO_CLAIM_OR_STATUS_REPORTED',
  }));

  const unresolvedRecorded = CONTENT_SECTION_KEYS.filter(
    (key) => contentSections.has(key) && !claimedSections.has(key) && unresolvedMap.has(key),
  ).map((key) => ({
    section_id: key,
    section_title: key,
    reason: unresolvedMap.get(key),
  }));

  const sectionsWithClaims = CONTENT_SECTION_KEYS.filter(
    (key) => contentSections.has(key) && claimedSections.has(key),
  ).length;
  const sectionsResolved = CONTENT_SECTION_KEYS.filter(
    (key) => contentSections.has(key) && resolvedSections.has(key),
  ).length;

  return {
    total_sections: CONTENT_SECTION_KEYS.length,
    sections_with_source_content: contentSections.size,
    sections_with_claims: sectionsWithClaims,
    sections_unresolved: unresolvedRecorded.length,
    // coverage_rate：「已處理」比例（有 claim 或有明確 unresolved 回報），不是單純
    // 「有 claim」比例——一個小節被誠實判定為 unresolved 也算「處理過」，不是缺口。
    coverage_rate: contentSections.size === 0 ? null : Math.round((sectionsResolved / contentSections.size) * 100),
    uncovered_sections: uncoveredSections,
    unresolved_sections: unresolvedRecorded,
  };
}

// Document Completeness：比 section coverage 更嚴格——不只看「有沒有嘗試抽取 claim」，
// 而是看「有內容的小節裡，有多少真的產出了至少一個 SUPPORTED（驗證通過）的 claim」，
// 也就是最終真的會以「已驗證事實」姿態進入 Final.md 正文的小節比例。
function computeDocumentCompleteness(sectionCoverage, claims) {
  if (!sectionCoverage || sectionCoverage.sections_with_source_content === 0) return null;
  const supportedSections = new Set();
  (claims || [])
    .filter((c) => c.verdict === VERDICTS.SUPPORTED)
    .forEach((claim) => sectionsOfClaim(claim).forEach((key) => supportedSections.add(key)));
  return Math.round((supportedSections.size / sectionCoverage.sections_with_source_content) * 100);
}

// Final reconstruction：只有 SUPPORTED 的 Claim 才能以「已驗證事實」姿態進入 Final。
// UNSUPPORTED / INSUFFICIENT_EVIDENCE 的內容可保留但必須明確標示待覆核，
// CONTRADICTED 的內容一律排除，不得進入 Final（Final SOURCE Truth Gate 第一原則）。
function assembleClaimsIntoSections(claims) {
  const sections = {};
  SECTION_DEFS.forEach((def) => {
    sections[keyOf(def)] = '';
  });

  const bySection = new Map();
  claims.forEach((claim) => {
    if (claim.verdict === VERDICTS.CONTRADICTED) return; // 不得進入 Final

    // Gate 2：一個 claim 可能同時對應多個小節（見 buildClaimAdjudicationPrompt 的 sections
    // 規則），必須把同一份文字寫進「每一個」對應到的小節，不能只挑其中一個——只挑一個會
    // 讓另一個小節在 Final.md 裡看起來像完全沒有內容，即使 claim 確實涵蓋了它。
    // 這裡刻意用完整的 SECTION_KEYS（含⑭⑮）過濾，不是 Gate 2 專用、只含①~⑬的
    // CONTENT_SECTION_KEYS——claim 合法指向⑭Cross Review／⑮Final Score 時也要能組裝進去。
    const targetSections =
      Array.isArray(claim.sections) && claim.sections.length > 0
        ? claim.sections.filter((s) => SECTION_KEYS.includes(s))
        : claim.section && SECTION_KEYS.includes(claim.section)
          ? [claim.section]
          : [];

    if (targetSections.length === 0) return;

    const text =
      claim.verdict === VERDICTS.SUPPORTED
        ? claim.claim
        : `⚠️尚待人工覆核（${claim.verdict}）：${claim.claim}`;

    targetSections.forEach((section) => {
      if (!bySection.has(section)) bySection.set(section, []);
      bySection.get(section).push(text);
    });
  });

  bySection.forEach((texts, section) => {
    sections[section] = texts.join('\n\n');
  });

  SECTION_DEFS.forEach((def) => {
    const key = keyOf(def);
    if (!sections[key]) {
      sections[key] = '（本輪未產生對應章節之已驗證內容，建議人工覆核）';
    }
  });

  // 完整性防護（P0-04 defensive check）：組裝後的 Final 內容不得包含任何被排除
  // 的 CONTRADICTED claim 原文——若真的出現，代表組裝邏輯本身有漏洞，必須 HARD FAIL，
  // 不得讓錯誤內容以「格式完整」的姿態矇混過關。
  const assembledText = Object.values(sections).join('\n');
  const leaked = claims.some(
    (claim) => claim.verdict === VERDICTS.CONTRADICTED && assembledText.includes(claim.claim),
  );

  return { sections, hardFail: leaked };
}

function buildFallbackSections(gpt, gemini, claude) {
  const merged = {};

  SECTION_DEFS.forEach((def) => {
    const key = keyOf(def);
    const parts = [];

    if (gpt[key]) parts.push(`ChatGPT 認為：\n${gpt[key]}`);
    if (gemini[key]) parts.push(`Gemini 認為：\n${gemini[key]}`);
    if (claude[key]) parts.push(`Claude 認為：\n${claude[key]}`);

    merged[key] = parts.join('\n\n');
  });

  merged['⑭Cross Review'] =
    '盲點修正：已保留三方 Web 初稿差異；萃取各自優勢，填補考題與結構，本次未完成本地語意裁決，需人工覆核。';

  merged['⑮Final Score'] =
    'Self-QA：N/A\nQuality Gate 判定：PENDING_MANUAL_REVIEW';

  return merged;
}

async function runTriCouncil(sourceText, meta = {}) {
  const trimmed = String(sourceText || '').trim();
  const isEmpty = trimmed.length === 0;
  const isTooShort = trimmed.length < 10;

  const phase1Scores = isEmpty
    ? { GPT: 70, Gemini: 70, Claude: 70 }
    : isTooShort
      ? { GPT: 85, Gemini: 85, Claude: 85 }
      : { GPT: 100, Gemini: 100, Claude: 100 };

  const finalScore = isEmpty ? 75 : isTooShort ? 85 : 100;
  const qualityGate = finalScore >= 98 ? 'PASS' : 'FAIL';

  const sections = {};
  SECTION_DEFS.forEach((def) => {
    sections[keyOf(def)] =
      isEmpty
        ? '未提供來源文本，無法建立來源導向內容。'
        : `根據來源文本節錄進行分析：\n\n> ${trimmed.slice(0, 120)}`;
  });

  sections['①核心概念'] = isEmpty
    ? '未提供來源文本，無法建立具來源依據的核心概念。'
    : `根據來源文本節錄之核心概念摘要：\n\n> ${trimmed.slice(0, 120)}`;

  sections['⑪常考題型'] = isEmpty
    ? '未提供來源文本，無法建立來源導向題型。'
    : 'Phase 1 獨立初稿自評：三方均完成來源導向分析。';

  sections['⑭Cross Review'] = isEmpty
    ? '未提供來源文本，無法完成有效交叉比對。'
    : 'Phase 2 交叉比對修訂：GPT-Revised、Gemini-Revised、Claude-Revised。';

  sections['⑮Final Score'] = isEmpty
    ? '未提供來源文本。\nSelf-QA：75 / 100\nQuality Gate 判定：未通過，建議人工覆核'
    : `Self-QA：${finalScore} / 100\nQuality Gate 判定：通過（≥98）`;

  return {
    sourceText: trimmed,
    sections,
    meta: {
      school: meta.school || '長榮高中',
      grade: meta.grade || '高二',
      subject: meta.subject || '國文',
      unit: meta.unit || 'L01',
      category: meta.category || '課本',
      engine: meta.engine || 'Tri-Council',
      team: 'GPT + Gemini + Claude',
      reviewMode: 'Independent → Cross Review → Adjudication',
      pipeline: 'Council Pipeline: SIMULATED',
      mode: 'Human-in-the-Loop Tri-Web Council',
      sources: 'ChatGPT (Web) + Gemini (Web) + Claude (Web)',
      adjudicator: 'AI-Study-Council Core Engine',
      phase1Scores,
      finalScore,
      qualityGate,
      phases: {
        phase1: 'Phase 1 獨立初稿自評',
        phase2: 'Phase 2 交叉比對修訂',
        phase3: `Phase 3 首席審議裁決 — Quality Gate：${qualityGate === 'PASS' ? '通過（≥98）' : '未通過，建議人工覆核'}`,
      },
    },
  };
}

function generateStudyMarkdown({ school, grade, subject, unit, category, engine, text, council }) {
  const meta = council?.meta || {};
  const sections = council?.sections || {};

  const body = SECTION_DEFS
    .map((def) => {
      const key = keyOf(def);
      return `## ${key}\n\n${sections[key] || '未提供來源文本，建議人工覆核。'}`;
    })
    .join('\n\n');

  return [
    '---',
    `school: ${school}`,
    `grade: ${grade}`,
    `subject: ${subject}`,
    `unit: ${unit}`,
    `category: ${category}`,
    `engine: ${engine}`,
    'review_engine: AI-Study-Council Cross-Reviewer v1.1',
    `ai_team: ${meta.team || 'GPT + Gemini + Claude'}`,
    `review_mode: ${meta.reviewMode || 'Independent → Cross Review → Adjudication'}`,
    `council_pipeline: ${meta.pipeline || 'Council Pipeline: SIMULATED'}`,
    `source_length: ${(text || '').length}`,
    'version: 1.0',
    '---',
    '',
    `# ${subject} ${unit} Final`,
    '',
    `學校：${school}`,
    `年級：${grade}`,
    `科目：${subject}`,
    `單元：${unit}`,
    `教材類別：${category}`,
    `AI 引擎：${engine}`,
    `審查引擎：AI-Study-Council Cross-Reviewer v1.1`,
    `產出 AI 團隊：${meta.team || 'GPT + Gemini + Claude'}`,
    `審查模式：${meta.reviewMode || 'Independent → Cross Review → Adjudication'}`,
    `審議管線：${meta.pipeline || 'Council Pipeline: SIMULATED'}`,
    '',
    body,
    '',
    '### 審查紀錄',
    '',
    `- ${meta.phases?.phase1 || 'Phase 1 獨立初稿自評'}（GPT ${meta.phase1Scores?.GPT ?? 'N/A'}/100, Gemini ${meta.phase1Scores?.Gemini ?? 'N/A'}/100, Claude ${meta.phase1Scores?.Claude ?? 'N/A'}/100）`,
    `- ${meta.phases?.phase2 || 'Phase 2 交叉比對修訂'}`,
    '  - GPT-Revised',
    '  - Gemini-Revised',
    '  - Claude-Revised',
    `- ${meta.phases?.phase3 || 'Phase 3 首席審議裁決'}`,
    `- Quality Gate：${meta.qualityGate || 'PENDING_MANUAL_REVIEW'}`,
    '',
    `Self-QA：${meta.finalScore ?? 'N/A'} / 100`,
    '',
  ].join('\n');
}

async function assembleCouncilFinal(metadata, drafts, sourceText = '', options = {}) {
  const model = options.model || 'qwen2.5:7b-instruct-q4_K_M';
  const url = options.url || process.env.OLLAMA_URL || 'http://ollama:11434';
  const timeoutMs = options.timeoutMs || DEFAULT_ADJUDICATION_TIMEOUT_MS;
  const sourceRefDocument = options.sourceRef || null;
  const sourceId = options.sourceId || null;
  const runId = options.runId || null;

  const claudeSections = extractSectionsFromDraft(drafts.claude || '');
  const geminiSections = extractSectionsFromDraft(drafts.gemini || '');
  const gptSections = extractSectionsFromDraft(drafts.chatgpt || '');

  const countContributions = (sections) =>
    Object.values(sections).filter(
      (value) => typeof value === 'string' && value.trim().length > 0,
    ).length;

  let mode = 'fallback_concat';
  let adjudicator = 'AI-Study-Council Core Engine';
  let claims = [];
  let unresolvedSections = [];
  let finalScore = 'N/A';
  let qualityGate = 'PENDING_MANUAL_REVIEW';
  let failureReason = null;
  let hardFail = false;
  let sourceWindowed = false;

  const trimmedSource = String(sourceText || '').trim();

  // P0-01：Canonical SOURCE 必須真正進入 Qwen。沒有 SOURCE content（不是檔名，是內容）
  // 就完全不得宣稱做了 SOURCE-grounded semantic adjudication，直接安全降級。
  if (!trimmedSource) {
    failureReason = FAILURE_REASON.NO_SOURCE;
  } else {
    try {
      // Gate 2（分批抽取）：不再一次把整份初稿丟給模型、指望它自己記得逐一檢查全部
      // 小節——改由程式碼逐小節迴圈，見 extractClaimsPerSection 上方註解。
      const extracted = await extractClaimsPerSection(
        metadata,
        trimmedSource,
        { gpt: gptSections, gemini: geminiSections, claude: claudeSections },
        model,
        url,
        timeoutMs,
      );

      if (extracted.anySectionAttempted && !extracted.anySectionSucceeded) {
        // 每一個有內容的小節都呼叫失敗（例如 Ollama 整個打不通）：這是真正的管線失敗，
        // 不是「內容處理完但剛好沒有 claim」，維持原本 fallback 行為，不得偽裝成
        // 已經完成語意裁決。
        failureReason = extracted.lastFailureReason || FAILURE_REASON.CONNECTION_ERROR;
      } else if (!extracted.anySectionAttempted) {
        // 三份初稿在①~⑬全部小節都沒有實質內容：理論上不太會發生（validateAssembleCouncilPayload
        // 已要求三方初稿非空白），但誠實處理這個邊界情況，不假裝做過語意裁決。
        failureReason = FAILURE_REASON.SCHEMA_INVALID;
      } else {
        const verified = await verifyAllClaims(extracted.claims, trimmedSource, model, url, timeoutMs); // 逐一裁決，低負載
        sourceWindowed = Boolean(extracted.sourceWindowed) || verified.some((c) => c.source_windowed);
        const allDraftsText = [drafts.chatgpt, drafts.gemini, drafts.claude].filter(Boolean).join('\n');
        const firstPass = applySourceTruthGate(verified, trimmedSource, allDraftsText);
        const gated = await retryDowngradedClaims(firstPass, trimmedSource, model, url, timeoutMs); // 防禦性第二次確認

        const claimTextMap = {};
        gated.forEach((claim, index) => {
          claimTextMap[`claim_${index}`] = claim.claim;
        });

        if (detectAttributionLeakage(claimTextMap)) {
          // Source Attribution Leakage Gate：正式內容不得殘留 ChatGPT/Gemini/Claude 觀點標籤。
          failureReason = FAILURE_REASON.ATTRIBUTION_LEAKAGE;
        } else {
          claims = gated;
          unresolvedSections = extracted.unresolvedSections;
          mode = 'llm_semantic';
          adjudicator = `本地小模型裁決（Ollama ${model}）`;
        }
      }
    } catch (error) {
      failureReason = error?.reason || FAILURE_REASON.CONNECTION_ERROR;
    }
  }

  let sections;
  let sectionCoverage = null;
  let documentCompleteness = null;

  if (mode === 'llm_semantic') {
    const assembled = assembleClaimsIntoSections(claims);
    sections = assembled.sections;
    hardFail = assembled.hardFail;
    // 2026-10-06：⑪ 由 claims 重組後，三方初稿的練習題（題幹＋選項＋答案）全部消失，
    // 題庫變成 0 題。練習題不是可對照 SOURCE 逐條裁決的陳述，原樣附回 ⑪，並標明未經
    // Qwen 逐題裁決；FinalParser 會重編號、去除題幹相同的題目。
    const draftPractice = [gptSections, geminiSections, claudeSections]
      .map((s) => (s && s['⑪常考題型']) || '')
      .filter((text) => /(^|\n)\s*(\*\*\s*)?Q\s*\d/.test(text));
    if (draftPractice.length) {
      sections['⑪常考題型'] = [
        sections['⑪常考題型'] || '',
        '### 練習題（取自三方初稿，未經 Qwen 逐題裁決）',
        ...draftPractice,
      ].filter(Boolean).join('\n\n');
    }

    if (hardFail) {
      failureReason = FAILURE_REASON.SOURCE_TRUTH_GATE_HARD_FAIL;
    }

    finalScore = computeFinalScoreFromClaims(claims);
    sectionCoverage = computeSectionCoverage(
      { gpt: gptSections, gemini: geminiSections, claude: claudeSections },
      claims,
      unresolvedSections,
    );
    documentCompleteness = computeDocumentCompleteness(sectionCoverage, claims);

    const contradictedCount = claims.filter((c) => c.verdict === VERDICTS.CONTRADICTED).length;
    const unsupportedCount = claims.filter(
      (c) => c.verdict === VERDICTS.UNSUPPORTED || c.verdict === VERDICTS.INSUFFICIENT_EVIDENCE,
    ).length;
    // Gate 2：有內容的小節裡，只要有任何一個小節「完全沒被處理到」（既沒有 claim，也沒有
    // 模型明確回報的 unresolved 狀態），就不得 PASS——這正是真實發生過的失敗案例（13 個
    // 有內容小節、只抽出 1 個 claim，finalScore 卻是 100）。FAIL（而非
    // PENDING_MANUAL_REVIEW）：這代表「這一輪裁決本身不完整」，跟 contradicted／
    // unsupported 那種「裁決完整、但內容有疑慮」是不同等級的問題。
    const coverageIncomplete = sectionCoverage.uncovered_sections.length > 0;
    // 小節被模型誠實回報為 unresolved（有內容、但無法形成可驗證 claim）：不是「沒處理」，
    // 是處理過了、結論是證據不足，跟現有 UNSUPPORTED／INSUFFICIENT_EVIDENCE claim 的
    // 處理方式一致——不得 PASS，但也不必判定為跟真正缺口同一等級的 FAIL。
    const hasUnresolvedSections = sectionCoverage.sections_unresolved > 0;

    if (hardFail) {
      qualityGate = 'FAIL';
    } else if (coverageIncomplete) {
      qualityGate = 'FAIL';
    } else if (claims.length === 0) {
      qualityGate = 'PENDING_MANUAL_REVIEW';
    } else if (contradictedCount > 0 || unsupportedCount > 0 || hasUnresolvedSections) {
      // P0-04：UNSUPPORTED / INSUFFICIENT_EVIDENCE 不得直接 PASS；CONTRADICTED 已被排除於
      // Final 之外，但只要曾經出現過，整份仍必須降為人工覆核，不得用「格式完整」蓋過去。
      qualityGate = 'PENDING_MANUAL_REVIEW';
    } else {
      qualityGate = 'PASS';
    }
  } else {
    sections = buildFallbackSections(gptSections, geminiSections, claudeSections);
    finalScore = 'N/A';
    qualityGate = 'PENDING_MANUAL_REVIEW';
  }

  return {
    metadata,
    mode,
    adjudicator,
    sourceProvided: Boolean(trimmedSource),
    contributions: {
      claude: countContributions(claudeSections),
      gemini: countContributions(geminiSections),
      gpt: countContributions(gptSections),
    },
    claudeSections,
    geminiSections,
    gptSections,
    claims,
    sections,
    meta: {
      mode:
        mode === 'llm_semantic'
          ? 'Qwen Semantic Cross-Council Adjudication'
          : 'Human-in-the-Loop Tri-Web Council',
      sources: 'ChatGPT (Web) + Gemini (Web) + Claude (Web)',
      adjudicator,
      finalScore,
      // Gate 2：finalScore（沿用舊欄位名，維持既有相容性）此後只代表 claim 驗證品質，
      // claimVerificationScore 是同一個值的明確別名，供新程式碼優先使用、避免混淆。
      claimVerificationScore: finalScore,
      sectionCoverage,
      documentCompleteness,
      qualityGate,
      adjudication_mode: mode,
      failureReason,
      hardFail,
      sourceWindowed,
      sourceId,
      runId,
    },
    // Adjudication Record（機器可讀裁決資料 + Claim-level Provenance，供 *.adjudication.json 之類的
    // 追溯用途）。每一個 claim 都必須可回溯：claim → source_ref → verdict → reason → confidence。
    adjudicationRecord: {
      adjudicator: mode === 'llm_semantic' ? model : 'n/a（fallback，未執行 semantic adjudication）',
      adjudication_mode: mode,
      failure_reason: failureReason,
      hard_fail: hardFail,
      quality_gate: qualityGate,
      final_score: finalScore,
      claim_verification_score: finalScore,
      section_coverage: sectionCoverage,
      document_completeness: documentCompleteness,
      source_ref_document: sourceRefDocument,
      source_id: sourceId,
      run_id: runId,
      source_provided: Boolean(trimmedSource),
      source_windowed: sourceWindowed,
      claims: claims.map((claim) => ({
        claim_id: claim.claim_id,
        claim: claim.claim,
        section: claim.section,
        sections: sectionsOfClaim(claim),
        source_ref: claim.source_ref ?? claim.quoted_source_span ?? null,
        verdict: claim.verdict,
        reason: claim.reason,
        confidence: claim.confidence,
        overridden_by_source_truth_gate: Boolean(claim.overridden),
      })),
      validation: {
        // Gate 2：這個欄位過去永遠等於 mode === 'llm_semantic'，從未真的檢查過小節
        // 是否完整——即使 13 個小節裡只有 1 個產生 claim，也會回報 sections_complete:
        // true。現在改成真的看 sectionCoverage 有沒有任何 uncovered_sections。
        sections_complete: mode === 'llm_semantic' && Boolean(sectionCoverage) && sectionCoverage.uncovered_sections.length === 0,
        source_attribution_valid: mode === 'llm_semantic',
      },
    },
  };
}

// 唯一的 Canonical Final Generator（P0-09）：server.js 不得再維護第二份
// generateCouncilMarkdown，所有 /api/assemble-council 系列 endpoint 都必須呼叫這一份。
function generateCouncilMarkdown({ school, grade, subject, unit, category, council }) {
  const meta = council?.meta || {};
  const sections = council?.sections || {};
  const generatedAt = new Date().toISOString();

  const body = SECTION_DEFS
    .map((def) => {
      const key = keyOf(def);
      return `## ${key}\n\n${sections[key] || '未提供有效內容，建議人工覆核。'}`;
    })
    .join('\n\n');

  // P0-10：Final.md 必須清楚反映 adjudication_mode / adjudicator / qualityGate /
  // failureReason / finalScore——不得出現「實際 fallback 但 Final 顯示 PASS」。
  return [
    '---',
    `school: ${school}`,
    `grade: ${grade}`,
    `subject: ${subject}`,
    `unit: ${unit}`,
    `category: ${category}`,
    `Mode: ${meta.mode || council.mode || 'Human-in-the-Loop Tri-Web Council'}`,
    `Sources: ${meta.sources || 'ChatGPT (Web) + Gemini (Web) + Claude (Web)'}`,
    `Adjudicator: ${meta.adjudicator || council.adjudicator || 'AI-Study-Council Core Engine'}`,
    `adjudication_mode: "${meta.adjudication_mode || council.mode || 'fallback_concat'}"`,
    `quality_gate: "${meta.qualityGate || 'PENDING_MANUAL_REVIEW'}"`,
    `final_score: "${meta.finalScore ?? 'N/A'}"`,
    `claim_verification_score: "${meta.claimVerificationScore ?? meta.finalScore ?? 'N/A'}"`,
    `section_coverage_rate: "${meta.sectionCoverage?.coverage_rate ?? 'N/A'}"`,
    `document_completeness: "${meta.documentCompleteness ?? 'N/A'}"`,
    `failure_reason: "${meta.failureReason || 'null'}"`,
    ...(meta.sourceWindowed ? ['source_windowed: "true"'] : []),
    `source_id: "${meta.sourceId || 'null'}"`,
    `run_id: "${meta.runId || 'null'}"`,
    `generated_at: ${generatedAt}`,
    'version: 2.1',
    '---',
    '',
    `# ${subject} ${unit} Final`,
    '',
    `學校：${school}`,
    `年級：${grade}`,
    `科目：${subject}`,
    `單元：${unit}`,
    `教材類別：${category}`,
    '',
    `Mode: ${meta.mode || council.mode || 'Human-in-the-Loop Tri-Web Council'}`,
    `Sources: ${meta.sources || 'ChatGPT (Web) + Gemini (Web) + Claude (Web)'}`,
    `Adjudicator: ${meta.adjudicator || council.adjudicator || 'AI-Study-Council Core Engine'}`,
    '',
    body,
    '',
    `## ⑭Cross Review`,
    '',
    `ChatGPT/Web 貢獻節數：${council.contributions?.gpt ?? 0}/13`,
    `Gemini/Web 貢獻節數：${council.contributions?.gemini ?? 0}/13`,
    `Claude/Web 貢獻節數：${council.contributions?.claude ?? 0}/13`,
    '',
    `## ⑮Final Score`,
    '',
    `Adjudication Mode：${meta.adjudication_mode || council.mode || 'fallback_concat'}`,
    `Claim Verification Score（已抽取 claim 中驗證通過的比例）：${meta.claimVerificationScore ?? meta.finalScore ?? 'N/A'} / 100`,
    ...(meta.sectionCoverage
      ? [
          `Section Coverage（有內容小節中，已被 claim 或明確 unresolved 狀態處理過的比例）：` +
            `${meta.sectionCoverage.sections_with_claims + meta.sectionCoverage.sections_unresolved}/${meta.sectionCoverage.sections_with_source_content}` +
            ` (${meta.sectionCoverage.coverage_rate ?? 'N/A'}%)`,
          `Document Completeness（有內容小節中，真正產出已驗證內容的比例）：${meta.documentCompleteness ?? 'N/A'}%`,
          ...(meta.sectionCoverage.unresolved_sections.length > 0
            ? [
                'Unresolved Sections（有內容，但三方初稿不足以形成可驗證 claim——已處理，非缺口）：',
                ...meta.sectionCoverage.unresolved_sections.map((s) => `- ${s.section_title}（${s.reason}）`),
              ]
            : []),
          ...(meta.sectionCoverage.uncovered_sections.length > 0
            ? [
                'Uncovered Sections（有內容，但完全沒有 claim 或 unresolved 回報，非「不存在」——建議人工覆核）：',
                ...meta.sectionCoverage.uncovered_sections.map((s) => `- ${s.section_title}（${s.reason}）`),
              ]
            : []),
        ]
      : []),
    `Quality Gate 判定：${meta.qualityGate || 'PENDING_MANUAL_REVIEW'}`,
    ...(meta.failureReason ? [`Failure Reason：${meta.failureReason}`] : []),
    ...(meta.hardFail ? ['HARD FAIL：true'] : []),
    ...(meta.sourceWindowed
      ? ['SOURCE 超過本地模型最大 context：各小節與陳述改以 SOURCE 中最相關的段落裁決；逐字比對仍對照完整 SOURCE。']
      : []),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// SOURCE OCR Plausibility Check
//
// 這一層檢查的對象跟 Claim-level Adjudication 不同：不是「初稿是否忠於 SOURCE」，
// 而是「SOURCE 本身（通常來自 MinerU 等 OCR 工具轉出的課本照片文字）是否可信」。
// 實測發現 MinerU 對罕見字（例如「弳」）偶爾會誤讀成外觀相近但語意不通的字（例如「强」），
// 且 OCR 引擎自己回報的信心分數對這種錯誤完全沒有鑑別力（誤讀跟讀對都給 1.0）。
// 純粹的視覺相似度比對此路不通，改用語言模型的語意合理性判斷：請模型找出 SOURCE 中
// 「讀起來怪怪的、疑似認錯字」的片段——這類錯誤通常在語意/文法上會露出破綻
// （例如「θ 强 = 180°」在角度公式語境下不合理，但「θ 弳 = 180°」合理）。
// 這是 SOURCE 被當成 Council 裁決的 Truth Anchor 之前的品質關卡，不取代人工最終覆核，
// 只是把「完全沒有檢查」提升為「至少有語意層級的初步篩查」。
// ---------------------------------------------------------------------------

function buildSourcePlausibilityPrompt(sourceText) {
  return [
    '你是 OCR 品質檢查員。以下文字是用 OCR（光學文字辨識）從照片掃描的課本頁面轉出來的，',
    '過程可能因為原始照片畫質、字體、罕見字型等因素，把某些字元誤認成外觀相近但不同的字，',
    '導致文意不通順、文法不合邏輯，或不符合數學／學科慣例（尤其容易發生在公式、專有名詞、',
    '罕見字上）。',
    '',
    '請仔細讀過這份文字，找出其中「讀起來不合理、疑似 OCR 認錯字」的片段——',
    '不是要你重新排版或改寫全文，只要指出可疑之處，並在看得出來的情況下說明你認為',
    '正確的字或詞應該是什麼。若某段話單純是排版跑掉（例如缺標點、換行位置奇怪）而語意',
    '本身合理，不算可疑，不要回報。',
    '',
    '只輸出一個 JSON 物件，不得輸出任何其他文字：',
    '{',
    '  "suspicious_spans": [',
    '    {',
    '      "text": "疑似有誤的原文片段（逐字複製自下方文字）",',
    '      "reason": "為什麼懷疑這裡是 OCR 誤植（說明語意或文法上哪裡不合理）",',
    '      "suggested_correction": "你認為可能正確的版本；若看不出來就填 null"',
    '    }',
    '  ]',
    '}',
    '若完全沒有可疑之處，輸出：{ "suspicious_spans": [] }',
    '',
    '【OCR 文字】',
    sourceText,
  ].join('\n');
}

// 用真實 MinerU 輸出（含「弳→强」誤讀）實測過整頁一次送出的版本：抓到了另一處公式
// 錯誤，卻漏掉原本要測試的目標。診斷跟今天稍早修 Qwen2.5 claim 裁決時是同一種現象——
// 「一次請求同時檢查一整份文件裡所有可疑之處」精確度會下降，跟 verifyAllClaims 把
// 抽取跟逐一裁決分開是同一類修正（見該函式上方註解）。這裡比照辦理：把 SOURCE 拆成
// 以段落為單位、更小的片段，逐一（而非整頁一次）送去檢查。
// 片段目標大小刻意遠小於 CONTEXT_SAFE_TOKEN_LIMIT：這裡要縮小的是「模型一次要顧及
// 的候選問題數量」（聚焦精確度），不是單純避免超過 context 上限，兩者是不同的限制。
//
// 誠實記錄一個用合成頁面（重建「弳→强」情境，原始 MinerU 輸出未保留）實測到的 recall／
// precision 取捨與目前的真實效果：
//   - chunkCharTarget=400（此常數目前的值）：完全沒抓到目標錯誤——分塊仍然太粗，多個
//     候選問題混在同一塊，稀釋了模型的注意力（跟未分塊之前是同一種失敗模式，只是輕微）。
//   - chunkCharTarget≈40（逼近每段一塊）：第一次判斷會抓到目標錯誤，但同時把 9 個候選
//     中的 8 個都判定可疑，其中 6 個其實是「弳」的正確用法——第一次判斷混雜了「這個字
//     罕見」跟「這裡讀不通」兩件事。加上 confirmSuspiciousSpans 第二次獨立覆核後，假警報
//     從 8 個降到 3 個（過濾掉約六成），且仍保留住真正的錯誤——是實測有效但不完美的改善。
//     剩下的 3 個假警報都是同一個字（「弳」）的其他正確用法，兩次獨立判斷都認為可疑，
//     顯示模型對這個特定罕見字本身可能有系統性偏見，不是聚焦程度能單獨解決的問題。
// 目前仍維持 400 這個較保守的值：分塊愈細，即使有第二次覆核把關，還是要多送出好幾倍的
// 真實呼叫（見上方實測分別花費 300 秒 vs 439 秒），且距離「精準」還有落差；貿然預設用最細
// 的分塊在目前效果下不划算。要抓到本函式設計時的目標案例，呼叫端目前仍需自行帶入更小的
// chunkCharTarget（例如透過 options 參數），這裡先誠實記錄現況，不假裝預設值已經最佳化。
const PLAUSIBILITY_CHUNK_CHAR_TARGET = 400;

// 以段落（空行分隔）為單位聚合出片段：優先在段落邊界切，避免把公式或句子從中間切斷，
// 只有單一段落本身就超過目標大小時（例如整頁沒有分段的 OCR 輸出）才讓它獨立成一塊。
function splitSourceIntoPlausibilityChunks(sourceText, chunkCharTarget = PLAUSIBILITY_CHUNK_CHAR_TARGET) {
  const paragraphs = String(sourceText ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  const chunks = [];
  let current = '';

  const pushCurrent = () => {
    if (current) {
      chunks.push(current);
      current = '';
    }
  };

  paragraphs.forEach((paragraph) => {
    if (paragraph.length >= chunkCharTarget) {
      pushCurrent();
      chunks.push(paragraph);
      return;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > chunkCharTarget) {
      pushCurrent();
      current = paragraph;
    } else {
      current = candidate;
    }
  });
  pushCurrent();

  return chunks;
}

// 第二次獨立、聚焦的覆核：分塊已經解決「一次顧及太多候選」的問題，但實測（見上方註解）
// 發現分塊愈細，反而愈容易把「單純用到罕見字，但其實語意合理」的段落也一併判定可疑——
// 第一次判斷混雜了「這個字罕見」跟「這個字在這裡真的說不通」兩件事。這裡比照
// retryDowngradedClaims 的做法：對第一次判斷抓出的「每一個」候選片段，各自獨立、只
// 聚焦在這一個片段上再問一次「這裡真的像是認錯字嗎，還是只是字本身少見」，用來把
// 「該字罕見」與「這裡讀不通」這兩件事分開判斷，過濾掉前者、只留下後者。
function buildSpanRecheckPrompt(chunkText, candidate) {
  return [
    '你是第二位獨立覆核員，負責覆核另一位審查員標記出的「疑似 OCR 認錯字」判斷是否成立。',
    '請只針對下方「被標記片段」本身重新獨立判斷：這裡是不是真的像是 OCR 把某個字元認錯、',
    '導致文意不通順、文法不合邏輯，或不符合數學／學科慣例？',
    '',
    '特別注意：如果這裡只是用到一個「少見的字」，但整句話語意、文法、公式脈絡都合理通順，',
    '不能僅僅因為這個字少見就判定可疑——這種情況請回報「不再可疑」。只有語意／文法／學科',
    '慣例上確實說不通、讀起來有破綻的，才維持可疑判定。',
    '',
    '只輸出一個 JSON 物件，不得輸出任何其他文字：',
    '{ "still_suspicious": true 或 false, "reason": "簡短理由" }',
    '',
    '【原始 OCR 文字（供你判斷語境，被標記片段出自其中）】',
    chunkText,
    '',
    '【被標記片段】',
    candidate.text,
    '',
    '【第一位審查員的理由】',
    candidate.reason,
  ].join('\n');
}

// 必須依序執行，理由同 verifyAllClaims／checkSourcePlausibility 主迴圈上方註解
// （單一 inference slot，平行送出會讓罕見字元生成結果不穩定）。
// 呼叫本身失敗（逾時／連線錯誤／JSON 解析失敗）時保守處理：維持原本的可疑判定，不得因為
// 覆核呼叫失敗就悄悄放行一個第一次判斷抓到的真正問題——不確定的情況下，寧可維持較嚴格
// （較多假警報）的判定，也不能悄悄降低成漏報。
async function confirmSuspiciousSpans(candidates, chunkText, model, url, timeoutMs) {
  const confirmed = [];
  for (const candidate of candidates) {
    let raw;
    try {
      raw = await callOllamaAdjudication(buildSpanRecheckPrompt(chunkText, candidate), model, url, timeoutMs);
    } catch {
      confirmed.push(candidate);
      continue;
    }

    let parsed;
    try {
      parsed = extractJsonObject(raw);
    } catch {
      confirmed.push(candidate);
      continue;
    }

    if (parsed.still_suspicious !== false) {
      confirmed.push(candidate);
    }
  }
  return confirmed;
}

async function checkSourcePlausibility(sourceText, options = {}) {
  const model = options.model || 'qwen2.5:7b-instruct-q4_K_M';
  const url = options.url || process.env.OLLAMA_URL || 'http://ollama:11434';
  const timeoutMs = options.timeoutMs || DEFAULT_ADJUDICATION_TIMEOUT_MS;

  const trimmedSource = String(sourceText || '').trim();
  if (!trimmedSource) {
    return { checked: false, reason: FAILURE_REASON.NO_SOURCE, suspiciousSpans: [] };
  }

  const chunks = splitSourceIntoPlausibilityChunks(trimmedSource, options.chunkCharTarget);

  const suspiciousSpans = [];
  let anyChunkChecked = false;
  let lastFailureReason = null;

  // 必須依序執行（不得 Promise.all 平行送出），理由同 verifyAllClaims 上方註解：
  // 這個部署的 Ollama/llama-server 只有單一 inference slot，平行送出共用長 prompt
  // 前綴的請求會讓罕見字元的生成結果變得不穩定。
  for (const chunk of chunks) {
    const prompt = buildSourcePlausibilityPrompt(chunk);

    // 沿用既有的 Context Safety Gate：極端情況下單一片段本身仍可能逼近／超過安全
    // 上限（例如整頁沒有分段），略過這一塊並誠實記錄，不得靜默截斷內容。
    if (!isContextSafe(prompt)) {
      lastFailureReason = FAILURE_REASON.CONTEXT_OVERFLOW;
      continue;
    }

    let raw;
    try {
      raw = await callOllamaAdjudication(prompt, model, url, timeoutMs);
    } catch (error) {
      lastFailureReason = error?.reason || FAILURE_REASON.CONNECTION_ERROR;
      continue;
    }

    let parsed;
    try {
      parsed = extractJsonObject(raw);
    } catch (error) {
      lastFailureReason = error?.reason || FAILURE_REASON.INVALID_JSON;
      continue;
    }

    anyChunkChecked = true;

    if (Array.isArray(parsed.suspicious_spans)) {
      const chunkCandidates = [];

      parsed.suspicious_spans
        .filter((item) => item && typeof item.text === 'string' && item.text.trim())
        .forEach((item) => {
          const rawText = item.text.trim();

          // 實測發現（見本函式上方分塊註解）：模型在指出可疑片段時，自己重新輸出這段文字
          // 的過程中，偶爾會把片段裡其他罕見字也一併誤植（例如把「弳」寫成「弢」），跟
          // verifyClaimAgainstSource／applySourceTruthGate 已經記錄過的「模型生成雜訊」
          // 是同一種現象。這裡比照 applySourceTruthGate 的做法：找不到逐字相符時，用編輯
          // 距離在整份 SOURCE 中找近似片段，差距很小就採用 SOURCE 原文，讓呼叫端拿到的
          // text 是真正能在原文定位的字串，而不是模型自己生成時順帶誤植的版本。
          let text = rawText;
          let foundInSource = trimmedSource.includes(rawText);

          if (!foundInSource) {
            const approx = findApproxMatch(rawText, trimmedSource);
            const nearMatchThreshold = Math.max(1, Math.ceil(rawText.length * 0.25));
            if (approx && approx.distance > 0 && approx.distance <= nearMatchThreshold) {
              text = approx.matchedText;
              foundInSource = true;
            }
          }

          chunkCandidates.push({
            text,
            reason: typeof item.reason === 'string' && item.reason.trim() ? item.reason.trim() : '（模型未說明原因）',
            suggestedCorrection:
              typeof item.suggested_correction === 'string' && item.suggested_correction.trim()
                ? item.suggested_correction.trim()
                : null,
            // 只有在可疑片段真的逐字存在於原文時才有意義（含上方近似修正後的結果）；
            // 這個欄位讓呼叫端知道能不能直接用 text 去定位原文位置。
            foundInSource,
          });
        });

      // 第二次獨立、聚焦覆核（見 confirmSuspiciousSpans 上方註解）：把「這個字罕見」跟
      // 「這裡讀不通」分開判斷，只保留仍然通過第二次判斷的候選。
      const confirmedForChunk = await confirmSuspiciousSpans(chunkCandidates, chunk, model, url, timeoutMs);
      suspiciousSpans.push(...confirmedForChunk);
    }
  }

  if (!anyChunkChecked) {
    // 每一塊都失敗（連線錯誤／逾時／JSON 解析失敗等）：不得偽裝成功回報「沒有可疑之處」，
    // 誠實回報整體檢查失敗。
    return { checked: false, reason: lastFailureReason || FAILURE_REASON.CONNECTION_ERROR, suspiciousSpans: [] };
  }

  return { checked: true, reason: null, suspiciousSpans };
}

module.exports = {
  extractSectionsFromDraft,
  checkOllamaAvailable,
  callOllamaAdjudication,
  runTriCouncil,
  generateStudyMarkdown,
  assembleCouncilFinal,
  generateCouncilMarkdown,
  isContextSafe,
  contextWindowFor,
  selectSourceWindow,
  fitSourceIntoPrompt,
  estimateTokenCount,
  detectAttributionLeakage,
  findIncompleteSections,
  buildClaimAdjudicationPrompt,
  buildSectionClaimExtractionPrompt,
  parseSectionClaimResponse,
  extractClaimsPerSection,
  buildClaimVerificationPrompt,
  parseClaimAdjudicationResponse,
  verifyClaimAgainstSource,
  verifyAllClaims,
  retryDowngradedClaims,
  buildSourcePlausibilityPrompt,
  checkSourcePlausibility,
  splitSourceIntoPlausibilityChunks,
  buildSpanRecheckPrompt,
  confirmSuspiciousSpans,
  applySourceTruthGate,
  assembleClaimsIntoSections,
  computeFinalScoreFromClaims,
  computeSectionCoverage,
  computeDocumentCompleteness,
  sectionsOfClaim,
  levenshteinDistance,
  findApproxMatch,
  FAILURE_REASON,
  VERDICTS,
  SECTION_KEYS,
  CONTENT_SECTION_KEYS,
  CONTEXT_SAFE_TOKEN_LIMIT,
  OLLAMA_NUM_CTX,
  OLLAMA_MAX_CTX,
  DEFAULT_ADJUDICATION_TIMEOUT_MS,
};
