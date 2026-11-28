'use strict';
/* services/localWriter.js — 2026-11-26 AHS-A3：教材上傳的「寫」全部交給本機模型（Ollama），不呼叫任何外部 AI。
   取代原本貼到 ChatGPT／Gemini／Claude 網頁版寫初稿的步驟：
     writeDraft(prompt, 'A'|'B')  兩個不同的本機模型各依同一份出題 Prompt 寫一份初稿，交給 multiAi.js 交叉比對
     revise(prompt)              依 Claude 最後檢核的意見修正定稿（prompt 由 services/draftReview.js 產生）
     transcribe(pages)           原文辨識協助包：OCR 看不清楚的頁面由本機視覺模型逐字轉錄
   Claude 只做最後檢核，不寫初稿（services/draftReview.js）。
   模型：初稿 A LOCAL_WRITER_MODEL_A（預設 qwen3:8b）、初稿 B LOCAL_WRITER_MODEL_B（預設 gpt-oss:20b）、
   修正用 A；視覺 OLLAMA_VISION_MODEL（預設 qwen2.5vl:7b）。網址 LOCAL_WRITER_URL／OLLAMA_VISION_URL，未設定時退回 OLLAMA_URL。 */

const DEFAULT_TEXT_MODEL = 'qwen3:8b';
const DEFAULT_TEXT_MODEL_B = 'gpt-oss:20b';
const DEFAULT_VISION_MODEL = 'qwen2.5vl:7b';
const MIN_CTX = 8192;
const MAX_CTX = 32768;
/* 2026-11-28：1-1 空間概念實跑，引擎估 Prompt 約 11,700 tokens、實際 14,675，num_ctx 只給 20,480，
   初稿寫到一半超過 context，Ollama 靜默丟掉開頭（寫作指示）繼續寫（server.log「truncated = 1」）。
   改為：估算偏高，並保證 Prompt＋輸出放得進 num_ctx；
   初稿最多寫 16,384 tokens（15 節＋30 題＋30 變式題 8,192 不夠），放不下最少輸出量就直接拒絕，不再默默截斷。 */
// 實測（1-1 空間概念本文 16,484 字）：中文 qwen3 0.84、gpt-oss 0.95 token／字；其他字元 1.3～1.9 字／token
// （圖片雜湊最密）。估算取中文 1 token／字、其他 1.5 字／token，兩個模型都不會低估。
const CJK_TOKENS = 1;
const OTHER_CHARS_PER_TOKEN = 1.5;
const CTX_MARGIN = 1024;
const MIN_OUTPUT = 8192;
const DRAFT_OUTPUT = 16384;
const DRAFT_TIMEOUT_MS = 40 * 60 * 1000;
const PAGE_TIMEOUT_MS = 5 * 60 * 1000;

const TRANSCRIBE_PROMPT = [
  '請逐字轉錄這張課本／講義照片中的文字。規則：',
  '1. 完全依照片內容逐字抄寫，不得改寫、摘要、補字或修正原文的用字。',
  '2. 看不清楚的字以「□」代替，不要猜。',
  '3. 只輸出轉錄的文字，不要加任何說明。',
].join('\n');

const fallbackUrl = () => process.env.OLLAMA_URL || 'http://ollama:11434';
const textModel = (which = 'A') => (which === 'B'
  ? process.env.LOCAL_WRITER_MODEL_B || DEFAULT_TEXT_MODEL_B
  : process.env.LOCAL_WRITER_MODEL_A || DEFAULT_TEXT_MODEL);
const textUrl = () => process.env.LOCAL_WRITER_URL || fallbackUrl();
const visionModel = () => process.env.OLLAMA_VISION_MODEL || DEFAULT_VISION_MODEL;
const visionUrl = () => process.env.OLLAMA_VISION_URL || fallbackUrl();

/* 沒有 tokenizer 時的保守估算（與 multiAi.js 相同原則：寧可高估，Ollama 超過 num_ctx 會靜默截掉開頭）。 */
function estimateTokens(text) {
  const s = String(text || '');
  const cjk = (s.match(/[　-〿㐀-鿿豈-﫿＀-￯]/g) || []).length;
  return Math.ceil(cjk * CJK_TOKENS + (s.length - cjk) / OTHER_CHARS_PER_TOKEN);
}
function contextFor(prompt, numPredict) {
  const need = estimateTokens(prompt) + numPredict + CTX_MARGIN;
  return Math.min(MAX_CTX, Math.max(MIN_CTX, Math.ceil(need / 2048) * 2048));
}
/* 想寫 wanted tokens；context 放不下時縮到放得下的量，連 minimum 都放不下就拒絕。 */
function outputBudget(prompt, wanted, minimum = Math.min(wanted, MIN_OUTPUT)) {
  const room = MAX_CTX - estimateTokens(prompt) - CTX_MARGIN;
  if (room < minimum) throw new Error('教材本文太長，超過本機模型可處理的長度，請分段上傳');
  return Math.min(wanted, room);
}
function stripThinking(text) {
  return String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

async function generate({ prompt, images, model, url, numPredict = 8192, temperature = 0.3, timeoutMs = DRAFT_TIMEOUT_MS, fetchImpl = fetch }) {
  if (!String(prompt || '').trim()) throw new Error('缺少 Prompt');
  const budget = outputBudget(prompt, numPredict);
  const body = {
    model,
    prompt,
    stream: false,
    options: { temperature, num_predict: budget, num_ctx: contextFor(prompt, budget), repeat_penalty: 1.1 },
  };
  if (images) body.images = images;
  if (/qwen3/i.test(model)) body.think = false;
  if (/gpt-oss/i.test(model)) body.think = 'low';
  const response = await fetchImpl(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  const text = stripThinking(data && data.response);
  if (!text) throw new Error('本機模型沒有回傳內容');
  // done_reason＝length：寫到輸出上限被切斷（後續格式檢查會補寫缺漏的部分）
  return { text, model, truncated: Boolean(data && data.done_reason === 'length') };
}

function writeDraft(prompt, which = 'A', options = {}) {
  if (which !== 'A' && which !== 'B') throw new Error('初稿只有 A、B 兩份');
  return generate({ prompt, model: options.model || textModel(which), url: options.url || textUrl(), numPredict: DRAFT_OUTPUT, temperature: 0.4, fetchImpl: options.fetchImpl });
}

function revise(prompt, options = {}) {
  return generate({ prompt, model: options.model || textModel(), url: options.url || textUrl(), numPredict: 8192, temperature: 0.2, fetchImpl: options.fetchImpl });
}

/* pages: [{ name, buffer }] → 「=== 檔名 ===」分段的轉錄（與 services/ocrHelp.js parseTranscriptions 相同格式）。
   單頁失敗不中斷整批，該頁以「□」標示並回報在 failed。 */
async function transcribe(pages, options = {}) {
  const model = options.model || visionModel();
  const url = options.url || visionUrl();
  const parts = [];
  const failed = [];
  for (const page of pages) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { text } = await generate({
        prompt: TRANSCRIBE_PROMPT, images: [page.buffer.toString('base64')], model, url,
        numPredict: 2048, temperature: 0, timeoutMs: PAGE_TIMEOUT_MS, fetchImpl: options.fetchImpl,
      });
      parts.push(`=== ${page.name} ===\n${text}`);
    } catch (error) {
      failed.push({ name: page.name, error: error.message });
    }
    if (options.onProgress) options.onProgress(parts.length + failed.length, pages.length);
  }
  return { text: parts.join('\n\n'), model, failed };
}

module.exports = {
  writeDraft, revise, transcribe, generate, estimateTokens, contextFor, stripThinking,
  textModel, visionModel, TRANSCRIBE_PROMPT, DEFAULT_TEXT_MODEL, DEFAULT_TEXT_MODEL_B, DEFAULT_VISION_MODEL, MAX_CTX,
  outputBudget, DRAFT_OUTPUT,
};
