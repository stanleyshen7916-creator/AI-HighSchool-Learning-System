// ai-engine/council/services/pdfTextQuality.js — 2026-11-18 AHS-UP2 P1-0：PDF 文字層品質判斷。
//
// 背景：掃描／拍照後存成 PDF 的課本，常帶有一層「OCR 出來的文字層」。過去引擎只要文字層有 ≥ 8 個字就直接
// 採用、完全不跑 MinerU，結果公式與符號嚴重亂碼（例如 θ→8、∠→L、整串公式變成雜訊），也不會切出圖片，
// 管理者只好把原始檔手動丟給 ChatGPT／Claude。2026-11-18 以兩份真實數學 PDF（共 33 頁）量測：
//   - 33 頁中有 24 頁含日文假名（繁中數學課本不應出現，是 OCR 雜訊的強訊號）；
//   - 每一頁都含「康熙部首」相容字（⾓⾯⼼ 等，U+2F00–2FDF），代表文字層來自特定 PDF 產生器；
//   - 符號比例、「孤立的 1～2 字元英數 token」比例都無法區分：乾淨的數學頁（有 O、Q、s、A 這類變數）與
//     亂碼頁落在同一個區間（0.12～0.38），用了會讓乾淨教材也被誤判，所以不用。
//
// 判斷（只看訊號、不假裝能判斷文字「對不對」）：
//   含日文假名的頁數 ÷ 有內容的頁數 ≥ KANA_PAGE_RATIO → 文字層不可信，useMinerU = true，並回傳可讀的原因。
// 已知限制：亂碼但沒有假名的文字層抓不到。只有兩份 PDF 的校準資料、沒有逐字標準答案，所以提供
// PDF_TEXT_LAYER_POLICY 環境變數覆寫：auto（預設）／always-mineru／trust-text-layer；之後有更多基準
// 教材再補訊號（AHS-UP2 P1-5 品質閘）。
'use strict';

const KANA = /[぀-ヿ]/g;
const KANA_PAGE_RATIO = 0.15;
const MIN_PAGE_CHARS = 20;

// 康熙部首（U+2F00–2FDF）與 CJK 部首補充（U+2E80–2EFF）的 NFKC 對應就是一般的漢字。
// 只轉這兩個區塊，不能對整份文字做 NFKC（會把全形標點「，」變成半形「,」）。
function normalizeRadicals(text) {
  return String(text ?? '').replace(/[⺀-⿟]/g, (ch) => ch.normalize('NFKC'));
}

function pageSignals(pageText) {
  const text = normalizeRadicals(pageText);
  return { chars: text.replace(/\s+/g, '').length, kana: (text.match(KANA) || []).length };
}

// pageTexts: 每頁一個字串。回傳 { useMinerU, reasons[], stats }
function assessTextLayer(pageTexts, options = {}) {
  const policy = options.policy || process.env.PDF_TEXT_LAYER_POLICY || 'auto';
  const pages = (pageTexts || []).map(pageSignals).filter((p) => p.chars >= MIN_PAGE_CHARS);
  const total = pages.length;
  const stats = { policy, pages: total, kanaPages: 0 };
  if (policy === 'always-mineru') return { useMinerU: true, reasons: ['策略設為 always-mineru'], stats };
  if (policy === 'trust-text-layer') return { useMinerU: false, reasons: ['策略設為 trust-text-layer'], stats };
  if (!total) return { useMinerU: false, reasons: [], stats };

  stats.kanaPages = pages.filter((p) => p.kana > 0).length;
  const reasons = [];
  if (stats.kanaPages / total >= KANA_PAGE_RATIO) {
    reasons.push(`文字層有 ${stats.kanaPages}／${total} 頁含日文假名（OCR 雜訊的徵兆）`);
  }
  return { useMinerU: reasons.length > 0, reasons, stats };
}

module.exports = { assessTextLayer, normalizeRadicals, pageSignals, KANA_PAGE_RATIO };
