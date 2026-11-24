// ai-engine/council/services/figureRecheck.js — 2026-11-21 MinerU 漏圖補查。
//
// 背景：MinerU 對「題目內嵌的小圖」偶爾沒切到（實測 50.pdf：9 張圖找到 7 張，漏的是題幹裡的扇形圖與半圓圖）。
// 做法：每一頁渲染成高解析圖、切成 2×3 小塊，逐塊問本機視覺模型「這塊有幾個圖形」，
// 再與 MinerU content_list 該頁的 image 數量比對；視覺模型看到的比較多 → 標示「這頁可能有圖沒抽到」。
//
// 限制（實測得知）：
//   - 整頁縮圖（約 600px）視覺模型常回空陣列；必須放大並切塊才可用。
//   - 視覺模型回傳的座標不可靠，這裡只採用「數量」與「描述」，不用座標裁圖。
//   - 這是提示，不是判決：切塊邊界的圖可能被重複計數，最後由管理者看頁面決定。
// 全部在本機視覺模型執行，不使用任何雲端 token。fetchImpl 可注入，測試不需要真的 Ollama。
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const DEFAULT_MODEL = 'qwen2.5vl:7b';
const DEFAULT_TIMEOUT_MS = 180000;
const OPTIONS = { temperature: 0.1, num_predict: 600 };

const PROMPT = [
  '這是一頁高中教材的局部照片。請找出畫面上所有「圖形」（幾何圖、函數圖、統計圖表、照片、示意圖、實驗裝置）。',
  '不要包含純文字、數學算式、題號、頁碼、標題色塊。',
  '只輸出 JSON 陣列，每個元素 {"bbox_2d":[x1,y1,x2,y2],"label":"圖形的簡短描述"}。沒有圖形就輸出 []。',
].join('\n');

function visionUrl() {
  return process.env.OLLAMA_VISION_URL || process.env.OLLAMA_URL || 'http://ollama:11434';
}

function visionModel() {
  return process.env.OLLAMA_VISION_MODEL || DEFAULT_MODEL;
}

// cols×rows 切塊（預設 2×3，不重疊）。太小的圖（任一邊 < 64px）不切，整張當一塊。
// 實測（50.pdf）2×2 對第 7 頁的兩個扇形圖會漏看，改 2×3 讓每塊更小、視覺模型較容易注意到小圖。
function tilesFor(width, height, cols = 2, rows = 3) {
  if (!(width >= 64 && height >= 64)) return [{ x: 0, y: 0, w: Math.max(width, 1), h: Math.max(height, 1) }];
  const tiles = [];
  for (let r = 0; r < rows; r += 1) {
    const y0 = Math.floor((height * r) / rows);
    const y1 = Math.floor((height * (r + 1)) / rows);
    for (let c = 0; c < cols; c += 1) {
      const x0 = Math.floor((width * c) / cols);
      const x1 = Math.floor((width * (c + 1)) / cols);
      tiles.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
  }
  return tiles;
}

// 從模型回覆取出 JSON 陣列（容忍 ```json 圍欄與前後說明）；解析失敗回 null（不能當成「0 張圖」）。
function parseFigureReply(text) {
  const raw = String(text || '');
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(body.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({ label: String(item.label || '').trim() }));
  } catch {
    return null;
  }
}

async function askTile(pngBuffer, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const response = await fetchImpl(`${options.url || visionUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model || visionModel(),
      stream: false,
      options: OPTIONS,
      messages: [{ role: 'user', content: PROMPT, images: [pngBuffer.toString('base64')] }],
    }),
    signal: AbortSignal.timeout(options.timeoutMs || DEFAULT_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  const figures = parseFigureReply(data && data.message && data.message.content);
  if (figures === null) throw new Error('視覺模型回覆不是可解析的 JSON');
  return figures;
}

// 一頁：切塊 → 逐塊詢問 → 合計。任一塊失敗就整頁記錄 error（不猜測成 0 張）。
async function recheckPage(pageBuffer, options = {}) {
  const image = await loadImage(pageBuffer);
  const labels = [];
  for (const tile of tilesFor(image.width, image.height)) {
    const canvas = createCanvas(tile.w, tile.h);
    canvas.getContext('2d').drawImage(image, tile.x, tile.y, tile.w, tile.h, 0, 0, tile.w, tile.h);
    // eslint-disable-next-line no-await-in-loop
    const figures = await askTile(canvas.toBuffer('image/png'), options);
    figures.forEach((f) => labels.push(f.label));
  }
  return { vlmCount: labels.length, labels };
}

// 比對 MinerU 與視覺模型：視覺模型看到的比 MinerU 抽到的多 → suspect。
function compareCounts(mineruCount, vlmCount) {
  return { mineruCount, vlmCount, suspect: vlmCount > mineruCount };
}

// pages：[{ page, mineruCount, buffer }]（buffer 是該頁的高解析圖）。依序處理，單頁失敗只標記該頁。
async function recheckPages(pages, options = {}) {
  const results = [];
  for (let i = 0; i < pages.length; i += 1) {
    const { page, mineruCount, buffer } = pages[i];
    const entry = { page, mineruCount };
    try {
      // eslint-disable-next-line no-await-in-loop
      const found = await recheckPage(buffer, options);
      Object.assign(entry, compareCounts(mineruCount, found.vlmCount), { labels: found.labels });
    } catch (error) {
      entry.error = String((error && error.message) || error);
    }
    results.push(entry);
    if (typeof options.onProgress === 'function') options.onProgress({ current: i + 1, total: pages.length });
  }
  return results;
}

module.exports = {
  tilesFor,
  parseFigureReply,
  askTile,
  recheckPage,
  recheckPages,
  compareCounts,
  PROMPT,
  OPTIONS,
  DEFAULT_MODEL,
  visionUrl,
  visionModel,
  fetchImpl: undefined,
};
