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
  return cjk + Math.ceil((s.length - cjk) / 2.5);
}
function contextFor(prompt, numPredict) {
  const need = estimateTokens(prompt) + numPredict + 512;
  return Math.min(MAX_CTX, Math.max(MIN_CTX, Math.ceil(need / 2048) * 2048));
}
function stripThinking(text) {
  return String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

async function generate({ prompt, images, model, url, numPredict = 8192, temperature = 0.3, timeoutMs = DRAFT_TIMEOUT_MS, fetchImpl = fetch }) {
  if (!String(prompt || '').trim()) throw new Error('缺少 Prompt');
  if (estimateTokens(prompt) + numPredict > MAX_CTX) throw new Error('教材本文太長，超過本機模型可處理的長度，請分段上傳');
  const body = {
    model,
    prompt,
    stream: false,
    options: { temperature, num_predict: numPredict, num_ctx: contextFor(prompt, numPredict), repeat_penalty: 1.1 },
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
  return { text, model };
}

function writeDraft(prompt, which = 'A', options = {}) {
  if (which !== 'A' && which !== 'B') throw new Error('初稿只有 A、B 兩份');
  return generate({ prompt, model: options.model || textModel(which), url: options.url || textUrl(), numPredict: 8192, temperature: 0.4, fetchImpl: options.fetchImpl });
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
};
