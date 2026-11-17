// ai-engine/council/services/figureCards.js — 2026-11-17 A13 圖卡：只把 MinerU 切圖送給本機視覺模型。
//
// 目的：出題 Prompt 只帶「圖卡文字」、不帶原圖（省 token），學生作答時仍看原圖（教材包 figures/）。
// 設計：
//   - 只處理 mineru_outputs/<教材識別碼>/images/ 的切圖（不送整個跨頁），一張圖一次呼叫。
//   - 參數沿用看板 A13：temperature 0.1、repeat_penalty 1.15、num_predict 800；
//     Prompt 要求只描述看得到的文字與數據，看不清寫「無法辨識」，不推測。
//   - 視覺模型網址 OLLAMA_VISION_URL（本機 GPU，例如 http://host.docker.internal:11435），
//     未設定時退回 OLLAMA_URL。模型預設 qwen2.5vl:7b（OLLAMA_VISION_MODEL 可覆寫）。
//   - fetchImpl 可注入，測試不需要真的 Ollama。單張失敗只記錄在該張，不中斷整批。
const fs = require('fs');
const path = require('path');

const DEFAULT_MODEL = 'qwen2.5vl:7b';
const DEFAULT_TIMEOUT_MS = 180000;
const OPTIONS = { temperature: 0.1, repeat_penalty: 1.15, num_predict: 800 };
const UNREADABLE = '無法辨識';

const PROMPT = [
  '你是高中教材的圖片說明員。請用繁體中文描述這張教材切圖。',
  '規則：',
  '1. 只描述看得到的內容：圖的類型（如折線圖、幾何圖、表格、實驗裝置）、圖中的文字標籤、數值、單位、座標軸、箭頭方向。',
  '2. 看不清楚的文字或數字，直接寫「' + UNREADABLE + '」，不要推測、不要補完、不要編造。',
  '3. 不要解題、不要加入教材以外的知識。',
  '4. 簡潔，條列即可，不要重複同一句話。',
].join('\n');

function visionUrl() {
  return process.env.OLLAMA_VISION_URL || process.env.OLLAMA_URL || 'http://ollama:11434';
}

function visionModel() {
  return process.env.OLLAMA_VISION_MODEL || DEFAULT_MODEL;
}

// 去掉模型常見的整段重複行（repeat_penalty 之外的保險）。
function dedupeLines(text) {
  const seen = new Set();
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => {
      if (!l || seen.has(l)) return false;
      seen.add(l);
      return true;
    })
    .join('\n');
}

async function describeFigure(imagePath, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const url = options.url || visionUrl();
  const model = options.model || visionModel();
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const image = fs.readFileSync(imagePath).toString('base64');

  const response = await fetchImpl(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: PROMPT, images: [image], stream: false, options: OPTIONS }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  const description = dedupeLines(data && data.response);
  if (!description) throw new Error('視覺模型沒有回傳內容');
  return {
    description,
    // 整段都在說看不清楚（沒有其他可用內容）→ 標記為待人工／待升級視覺處理。
    unreadable: description.replace(new RegExp(UNREADABLE, 'g'), '').replace(/[\s，。、：:；;．.\-－—]/g, '').length < 8,
  };
}

async function buildFigureCards(imagesDir, filenames, options = {}) {
  const cards = [];
  for (const filename of filenames) {
    const card = { filename };
    try {
      Object.assign(card, await describeFigure(path.join(imagesDir, filename), options));
    } catch (error) {
      card.error = String((error && error.message) || error);
    }
    cards.push(card);
  }
  return cards;
}

module.exports = { describeFigure, buildFigureCards, dedupeLines, PROMPT, OPTIONS, UNREADABLE, DEFAULT_MODEL };
