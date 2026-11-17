// 2026-11-17 A13 圖卡：只送 MinerU 切圖給視覺模型，結果存 figure_cards.json。
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

process.env.COUNCIL_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'figure-cards-'));
process.env.REMOTE_INDEX = 'off';
process.env.OLLAMA_VISION_URL = 'http://vision.test:11435';
const figureCards = require('../services/figureCards');
const { app } = require('../server');

const ID = 'figcard_demo';
const imagesDir = path.join(process.env.COUNCIL_DATA_DIR, 'mineru_outputs', ID, 'images');

function mockFetch(responses) {
  const calls = [];
  const impl = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return { ok: true, status: 200, json: async () => ({ response: next }) };
  };
  return { impl, calls };
}

beforeEach(() => {
  fs.rmSync(path.join(process.env.COUNCIL_DATA_DIR, 'mineru_outputs'), { recursive: true, force: true });
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.writeFileSync(path.join(imagesDir, 'a.png'), 'PNG-A');
  fs.writeFileSync(path.join(imagesDir, 'b.png'), 'PNG-B');
  figureCards.fetchImpl = undefined;
});

describe('figureCards 模組', () => {
  test('以 A13 參數呼叫視覺模型，Prompt 要求看不清寫「無法辨識」，圖以 base64 送出', async () => {
    const { impl, calls } = mockFetch(['折線圖：橫軸時間(s)，縱軸速度(m/s)']);
    const r = await figureCards.describeFigure(path.join(imagesDir, 'a.png'), { fetchImpl: impl });
    expect(r.description).toContain('折線圖');
    expect(r.unreadable).toBe(false);
    expect(calls[0].url).toBe('http://vision.test:11435/api/generate');
    expect(calls[0].body.model).toBe('qwen2.5vl:7b');
    expect(calls[0].body.options).toEqual({ temperature: 0.1, repeat_penalty: 1.15, num_predict: 800 });
    expect(calls[0].body.images).toEqual([Buffer.from('PNG-A').toString('base64')]);
    expect(calls[0].body.prompt).toMatch(/無法辨識/);
  });

  test('重複行去除；整段只有「無法辨識」→ unreadable', async () => {
    const { impl } = mockFetch(['無法辨識\n無法辨識\n無法辨識']);
    const r = await figureCards.describeFigure(path.join(imagesDir, 'a.png'), { fetchImpl: impl });
    expect(r.description).toBe('無法辨識');
    expect(r.unreadable).toBe(true);
  });

  test('單張失敗只標記該張，不中斷整批', async () => {
    const { impl } = mockFetch([new Error('ECONNREFUSED'), '座標圖：x 軸 0 到 10，y 軸 0 到 5']);
    const cards = await figureCards.buildFigureCards(imagesDir, ['a.png', 'b.png'], { fetchImpl: impl });
    expect(cards[0].error).toMatch(/ECONNREFUSED/);
    expect(cards[1].description).toContain('座標圖');
  });
});

describe('/api/materials/:id/figure-cards', () => {
  test('POST 產生並存檔，GET 讀回；再次 POST 不重做已完成的圖（force 才重做）', async () => {
    const m1 = mockFetch(['圖一：長方形，邊長 3 與 4', '圖二：表格，三列兩欄']);
    figureCards.fetchImpl = m1.impl;
    const post = await request(app).post(`/api/materials/${ID}/figure-cards`).send({});
    expect(post.status).toBe(200);
    expect(post.body).toMatchObject({ count: 2, generated: 2, failed: 0 });
    expect(fs.existsSync(path.join(process.env.COUNCIL_DATA_DIR, 'mineru_outputs', ID, 'figure_cards.json'))).toBe(true);

    const get = await request(app).get(`/api/materials/${ID}/figure-cards`);
    expect(get.body.cards.map((c) => c.filename)).toEqual(['a.png', 'b.png']);

    const m2 = mockFetch([]);
    figureCards.fetchImpl = m2.impl;
    const again = await request(app).post(`/api/materials/${ID}/figure-cards`).send({});
    expect(again.body.generated).toBe(0);
    expect(m2.calls).toHaveLength(0);

    const m3 = mockFetch(['新一', '新二']);
    figureCards.fetchImpl = m3.impl;
    const forced = await request(app).post(`/api/materials/${ID}/figure-cards`).send({ force: true });
    expect(forced.body.generated).toBe(2);
  });

  test('沒有切圖 → 404；不合法識別碼不會跳出資料夾', async () => {
    const none = await request(app).post('/api/materials/no_such_material/figure-cards').send({});
    expect(none.status).toBe(404);
    const get = await request(app).get('/api/materials/no_such_material/figure-cards');
    expect(get.body.count).toBe(0);
  });
});
