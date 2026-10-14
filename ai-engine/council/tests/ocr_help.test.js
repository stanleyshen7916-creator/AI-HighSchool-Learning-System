// 2026-10-14：原文辨識協助包（審議改版第 3 階段）。
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

process.env.COUNCIL_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-help-'));
process.env.REMOTE_INDEX = 'off';
const ocrHelp = require('../services/ocrHelp');
const { app } = require('../server');

const SOURCE = [
  ocrHelp.fileMarker('p1.jpg'),
  '地球的內部分為地殼、地函與地核。地函的物質會緩慢對流，帶動上方的岩石圈移動，這是板塊運動的主要動力來源之一。',
  '',
  ocrHelp.fileMarker('p2.jpg'),
  '板塊在中洋脊分離，在海溝隱沒。岩石圈較為剛硬，軟流圈則具有可塑性，因此岩石圈能在軟流圈上緩慢移動。',
  '',
  ocrHelp.fileMarker('p3.jpg'),
  '模糊',
].join('\n');

describe('ocrHelp 模組', () => {
  test('segmentsOf 依檔案標記切段；stripMarkers 拿掉標記', () => {
    expect(ocrHelp.segmentsOf(SOURCE).map((s) => s.file)).toEqual(['p1.jpg', 'p2.jpg', 'p3.jpg']);
    expect(ocrHelp.stripMarkers(SOURCE)).not.toMatch(/檔案：/);
    expect(ocrHelp.stripMarkers(SOURCE)).toMatch(/^地球的內部/);
  });

  test('協助包只列出有可疑文字或幾乎沒有文字的照片', () => {
    const pack = ocrHelp.buildHelpPack(SOURCE, [{ text: '隱沒', reason: '疑似錯字' }]);
    expect(pack.pages.map((p) => p.file)).toEqual(['p2.jpg', 'p3.jpg']);
    expect(pack.prompt).toMatch(/=== p2\.jpg ===/);
    expect(pack.prompt).not.toMatch(/p1\.jpg/);
  });

  test('GPT 與 Gemini 一致 → 自動更正；三份都不同 → 衝突；兩份都有、OCR 漏掉 → 補回', () => {
    const src = `${ocrHelp.fileMarker('p2.jpg')}\n板塊在中洋脊分難，在海溝隱沒。岩石圈較為鋼硬。`;
    const gpt = '=== p2.jpg ===\n板塊在中洋脊分離，在海溝隱沒。岩石圈較為剛硬。軟流圈可塑性高。';
    const gem = '=== p2.jpg ===\n板塊在中洋脊分離，在海溝隱沒。岩石圈較為堅硬。軟流圈可塑性高。';
    const r = ocrHelp.mergeTranscriptions(src, gpt, gem);
    expect(r.corrections).toEqual([{ file: 'p2.jpg', from: '板塊在中洋脊分難，在海溝隱沒。', to: '板塊在中洋脊分離，在海溝隱沒。' }]);
    expect(r.conflicts).toEqual([{ id: 'X1', file: 'p2.jpg', local: '岩石圈較為鋼硬。', gpt: '岩石圈較為剛硬。', gemini: '岩石圈較為堅硬。' }]);
    expect(r.additions).toEqual([{ file: 'p2.jpg', text: '軟流圈可塑性高。' }]);
    expect(r.text).toMatch(/中洋脊分離/);
    expect(r.text).toMatch(/鋼硬/);
  });

  test('只有一張照片時，轉錄沒有檔名標題也能比對；只貼一份時差異交給管理者', () => {
    const src = `${ocrHelp.fileMarker('p1.jpg')}\n地函的物質會緩漫對流。`;
    const r = ocrHelp.mergeTranscriptions(src, '地函的物質會緩慢對流。', '');
    expect(r.corrections).toEqual([]);
    expect(r.conflicts).toHaveLength(1);
    expect(r.conflicts[0]).toMatchObject({ local: '地函的物質會緩漫對流。', gpt: '地函的物質會緩慢對流。', gemini: null });
  });
});

describe('/api/ocr-help 端點', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  test('check：可疑片段對回照片檔名', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ response: JSON.stringify({ suspicious_spans: [{ text: '隱沒', reason: '疑似錯字', suggested_correction: '隱沒' }] }) }),
    }));
    const res = await request(app).post('/api/ocr-help/check').send({ sourceText: SOURCE });
    expect(res.status).toBe(200);
    expect(res.body.pages.map((p) => p.file)).toContain('p3.jpg');
    expect(res.body.prompt).toMatch(/p3\.jpg/);
  });

  test('merge：單一檔案上傳（沒有標記）以 filename 比對，回傳的本文不含標記', async () => {
    const res = await request(app).post('/api/ocr-help/merge').send({
      sourceText: '地函的物質會緩漫對流。',
      filename: 'p1.jpg',
      gpt: '地函的物質會緩慢對流。',
      gemini: '地函的物質會緩慢對流。',
    });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('地函的物質會緩慢對流。');
    expect(res.body.corrections).toHaveLength(1);
  });

  test('缺少轉錄時回 400', async () => {
    const res = await request(app).post('/api/ocr-help/merge').send({ sourceText: 'x' });
    expect(res.status).toBe(400);
  });
});
