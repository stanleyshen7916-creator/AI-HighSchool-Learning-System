// 2026-11-18 AHS-UP2 P1-5：品質閘。依 MinerU content_list.json 逐頁估計「辨識可信度」，
// 低於門檻的頁列給管理者（只有這些頁才需要原檔人工處理），其餘不用再手動上傳原檔。
// 這是啟發式訊號，不是真正的辨識正確率；門檻只用 2 份數學 PDF 校準，之後要用更多基準教材調整（M1）。

const LOW_CONFIDENCE_THRESHOLD = 0.6;
const KANA = /[぀-ヿ]/g;

function equationLooksGarbled(latex) {
  const s = String(latex || '');
  if (/\\mathfrak|\\mathop\s*\{\s*\\mathrm\s*\{\s*[a-z](\s+[a-z])+/.test(s)) return true;
  // 三角函數名稱單獨當分子／分母（缺引數），例如 \frac { \sin } { \cos \theta }：實測把「π/6 —sin→ sin π/6」讀錯時的樣子。
  if (/\\frac\s*\{\s*\\(sin|cos|tan|cot|sec|csc)\s*\}/.test(s)) return true;
  // 陣列公式一半以上的儲存格是空的：多行推導被讀成空白列（實測 50.pdf 第 4 頁）。
  const cells = s.match(/\{[^{}]*\}/g) || [];
  if (/\\begin\{array\}/.test(s) && cells.length >= 6 && cells.filter((c) => /^\{\s*\}$/.test(c)).length / cells.length > 0.5) return true;
  const opens = (s.match(/\{/g) || []).length;
  const closes = (s.match(/\}/g) || []).length;
  return opens !== closes;
}

function assessPages(contentList, { threshold = LOW_CONFIDENCE_THRESHOLD } = {}) {
  const items = Array.isArray(contentList) ? contentList.filter((it) => it && Number.isInteger(it.page_idx)) : [];
  const maxIdx = items.reduce((m, it) => Math.max(m, it.page_idx), -1);
  const pages = [];
  for (let idx = 0; idx <= maxIdx; idx += 1) {
    const on = items.filter((it) => it.page_idx === idx);
    const reasons = [];
    let penalty = 0;
    const kept = on.filter((it) => it.type !== 'discarded');
    const textLen = kept.filter((it) => it.type === 'text').reduce((n, it) => n + String(it.text || '').length, 0);
    const equations = kept.filter((it) => it.type === 'equation');
    const hasImage = kept.some((it) => it.type === 'image' || it.type === 'table');

    if (!on.length) {
      penalty += 1;
      reasons.push('MinerU 沒有辨識到任何內容');
    } else {
      if (!textLen && !equations.length && hasImage) {
        penalty += 0.7;
        reasons.push('只有圖片，沒有可讀文字');
      }
      const garbled = equations.filter((it) => equationLooksGarbled(it.text)).length;
      if (garbled) {
        penalty += Math.min(0.6, 0.3 * garbled);
        reasons.push(`${garbled} 組公式疑似辨識錯誤`);
      }
      const discarded = on.length - kept.length;
      if (on.length >= 4 && discarded / on.length > 0.5) {
        penalty += 0.3;
        reasons.push('超過一半的區塊被判為雜訊');
      }
      const allText = kept.filter((it) => it.type === 'text').map((it) => it.text).join('');
      const kana = (allText.match(KANA) || []).length;
      if (allText.length && kana / allText.length > 0.02) {
        penalty += 0.3;
        reasons.push('文字含日文假名（常見的亂碼徵兆）');
      }
    }
    const confidence = Math.max(0, Number((1 - penalty).toFixed(2)));
    pages.push({ page: idx + 1, confidence, low: confidence < threshold, reasons });
  }
  const lowPages = pages.filter((p) => p.low);
  return {
    threshold,
    pages,
    totalPages: pages.length,
    lowPages: lowPages.map((p) => ({ page: p.page, confidence: p.confidence, reasons: p.reasons })),
    // 有疑點但未達「需原檔」門檻的頁：請管理者抽查，不強制人工處理。
    suspectPages: pages.filter((p) => !p.low && p.confidence < 1).map((p) => ({ page: p.page, confidence: p.confidence, reasons: p.reasons })),
    needsOriginalRatio: pages.length ? Number((lowPages.length / pages.length).toFixed(3)) : 0,
  };
}

module.exports = { assessPages, equationLooksGarbled, LOW_CONFIDENCE_THRESHOLD };
