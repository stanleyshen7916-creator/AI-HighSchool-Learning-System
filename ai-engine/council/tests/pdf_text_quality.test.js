// 2026-11-18 AHS-UP2 P1-0：PDF 文字層品質判斷。
const { assessTextLayer, normalizeRadicals } = require('../services/pdfTextQuality');

const CLEAN = '國中時已學過圓弧長與扇形面積，接著介紹用弧度量表示弧長與扇形面積。如右圖，設圓 O 的半徑為 r，P 與 Q 為圓周上兩點，圓心角為 θ 弳，則弧長 s = rθ，扇形面積 A = r²θ/2。這個公式在後面的章節會一直使用，請務必熟悉。';
const KANA_NOISE = '第 1 章 三角函數 バーグ 已知銳角三角形 ABC 的外接圓半徑為 8 且外接圓圓心到 AB 的距離為 2 而到 BC 的距離為 7 求 sin ABC 的值是多少請說明理由並寫出計算過程';
const MATH_NOISE = 'sin zABL = sin ( x + P ) = = 1 + 3 5 1 1 x cos 2 x 2 L a b c 6 d e 8 f g sin 5 7 之 最 大 值 與 最 小 值 為 何 h i j k 9 m';

describe('assessTextLayer', () => {
  test('乾淨的中文文字層：不跑 MinerU', () => {
    const r = assessTextLayer([CLEAN, CLEAN, CLEAN, CLEAN]);
    expect(r.useMinerU).toBe(false);
    expect(r.reasons).toEqual([]);
  });

  test('含日文假名的頁數達 15%：改跑 MinerU，並說明原因', () => {
    const r = assessTextLayer([CLEAN, CLEAN, CLEAN, KANA_NOISE, CLEAN]);
    expect(r.useMinerU).toBe(true);
    expect(r.stats.kanaPages).toBe(1);
    expect(r.reasons.join('')).toMatch(/日文假名/);
  });

  test('少數頁有假名（低於 15%）不誤判', () => {
    const pages = new Array(10).fill(CLEAN);
    pages[3] = KANA_NOISE;
    expect(assessTextLayer(pages).useMinerU).toBe(false);
  });

  test('乾淨的數學頁（有 O、Q、s、A 這類變數、θ 與公式）不誤判', () => {
    expect(assessTextLayer([CLEAN, CLEAN, CLEAN, CLEAN, CLEAN]).useMinerU).toBe(false);
  });

  test('已知限制：亂碼但沒有假名的文字層抓不到，需用 always-mineru 覆寫', () => {
    expect(assessTextLayer([MATH_NOISE, MATH_NOISE, MATH_NOISE]).useMinerU).toBe(false);
    expect(assessTextLayer([MATH_NOISE, MATH_NOISE, MATH_NOISE], { policy: 'always-mineru' }).useMinerU).toBe(true);
  });

  test('幾乎沒有內容的頁（頁碼、空白）不計入頁數', () => {
    const r = assessTextLayer(['-- 1 of 4 --', '3', CLEAN, CLEAN]);
    expect(r.stats.pages).toBe(2);
    expect(r.useMinerU).toBe(false);
  });

  test('策略覆寫：always-mineru／trust-text-layer', () => {
    expect(assessTextLayer([CLEAN], { policy: 'always-mineru' }).useMinerU).toBe(true);
    expect(assessTextLayer([KANA_NOISE, KANA_NOISE], { policy: 'trust-text-layer' }).useMinerU).toBe(false);
  });

  test('環境變數 PDF_TEXT_LAYER_POLICY 生效', () => {
    process.env.PDF_TEXT_LAYER_POLICY = 'always-mineru';
    try {
      expect(assessTextLayer([CLEAN]).useMinerU).toBe(true);
    } finally {
      delete process.env.PDF_TEXT_LAYER_POLICY;
    }
  });
});

describe('normalizeRadicals', () => {
  test('康熙部首轉成一般漢字，其餘（含全形標點）不動', () => {
    expect(normalizeRadicals('三⾓函數，⾯積與⼼')).toBe('三角函數，面積與心');
    expect(normalizeRadicals('，。（）')).toBe('，。（）');
  });
});
