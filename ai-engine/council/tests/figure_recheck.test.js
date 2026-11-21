// 2026-11-21 MinerU 漏圖補查：切塊、回覆解析、比對、單頁／多頁流程（視覺模型以 fetchImpl 注入，不需要真的 Ollama）。
const { createCanvas } = require('@napi-rs/canvas');
const figureRecheck = require('../services/figureRecheck');

function pagePng(width = 400, height = 600) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  return canvas.toBuffer('image/png');
}

function okReply(content) {
  return { ok: true, status: 200, json: async () => ({ message: { content } }) };
}

describe('tilesFor', () => {
  test('預設切成 2 欄×3 列、不重疊且剛好蓋滿', () => {
    const tiles = figureRecheck.tilesFor(401, 601);
    expect(tiles).toHaveLength(6);
    expect(tiles.reduce((sum, t) => sum + t.w * t.h, 0)).toBe(401 * 601);
  });

  test('可指定欄列數', () => {
    expect(figureRecheck.tilesFor(400, 600, 2, 2)).toHaveLength(4);
  });

  test('太小的圖不切，整張當一塊', () => {
    expect(figureRecheck.tilesFor(40, 600)).toEqual([{ x: 0, y: 0, w: 40, h: 600 }]);
  });
});

describe('parseFigureReply', () => {
  test('容忍 ```json 圍欄與前後說明', () => {
    const text = '以下是結果：\n```json\n[{"bbox_2d":[1,2,3,4],"label":"半圓"}]\n```';
    expect(figureRecheck.parseFigureReply(text)).toEqual([{ label: '半圓' }]);
  });

  test('空陣列是合法的「沒有圖形」', () => {
    expect(figureRecheck.parseFigureReply('[]')).toEqual([]);
  });

  test('不是 JSON 陣列時回 null，不能當成 0 張圖', () => {
    expect(figureRecheck.parseFigureReply('我看不到圖')).toBeNull();
    expect(figureRecheck.parseFigureReply('[{broken')).toBeNull();
    expect(figureRecheck.parseFigureReply('')).toBeNull();
  });
});

describe('compareCounts', () => {
  test('視覺模型看到的比 MinerU 多才 suspect', () => {
    expect(figureRecheck.compareCounts(1, 2)).toEqual({ mineruCount: 1, vlmCount: 2, suspect: true });
    expect(figureRecheck.compareCounts(2, 2).suspect).toBe(false);
    expect(figureRecheck.compareCounts(3, 1).suspect).toBe(false);
  });
});

describe('recheckPage / recheckPages', () => {
  test('逐塊詢問 6 次並合計數量與描述', async () => {
    const replies = ['[]', '[{"bbox_2d":[0,0,1,1],"label":"扇形"}]', '[]', '[{"label":"半圓"}]', '[]', '[]'];
    const fetchImpl = jest.fn(async () => okReply(replies.shift()));
    const result = await figureRecheck.recheckPage(pagePng(), { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(result).toEqual({ vlmCount: 2, labels: ['扇形', '半圓'] });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.messages[0].images).toHaveLength(1);
    expect(body.stream).toBe(false);
  });

  test('recheckPages：MinerU 少抽 → suspect；單頁失敗只標記該頁並繼續', async () => {
    let call = 0;
    const fetchImpl = jest.fn(async () => {
      call += 1;
      // 第 1 頁（前 6 次）每塊都回 1 個圖；第 2 頁第一次呼叫就失敗
      if (call <= 6) return okReply('[{"label":"圖"}]');
      return { ok: false, status: 500, json: async () => ({}) };
    });
    const progress = [];
    const results = await figureRecheck.recheckPages(
      [{ page: 1, mineruCount: 1, buffer: pagePng() }, { page: 2, mineruCount: 0, buffer: pagePng() }],
      { fetchImpl, onProgress: (p) => progress.push(p) },
    );
    expect(results[0]).toMatchObject({ page: 1, mineruCount: 1, vlmCount: 6, suspect: true });
    expect(results[1].page).toBe(2);
    expect(results[1].error).toContain('Ollama HTTP 500');
    expect(progress).toEqual([{ current: 1, total: 2 }, { current: 2, total: 2 }]);
  });

  test('視覺模型回覆無法解析：記錄 error，不假裝成 0 張', async () => {
    const fetchImpl = jest.fn(async () => okReply('看不清楚'));
    const [result] = await figureRecheck.recheckPages([{ page: 1, mineruCount: 0, buffer: pagePng() }], { fetchImpl });
    expect(result.error).toContain('JSON');
    expect(result.suspect).toBeUndefined();
  });
});
