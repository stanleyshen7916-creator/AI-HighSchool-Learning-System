// 2026-11-18 AHS-UP2 P1-1：MinerU content_list.json 分流。
// equation → LaTeX、table → HTML、image → 切圖檔名；每筆帶頁碼（1 起算）與前後文，
// 供後續圖卡／出題 Prompt／品質閘使用。純函式，不碰檔案系統與網路。

const CONTEXT_CHARS = 80;

function toText(value) {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(' ');
  return typeof value === 'string' ? value.trim() : '';
}

// MinerU 的 equation 文字是 "$$\n…\n$$"，去掉定界符只留 LaTeX 本體。
function stripLatexDelimiters(text) {
  return String(text || '').replace(/^\s*\${1,2}/, '').replace(/\${1,2}\s*$/, '').trim();
}

function pageOf(item) {
  return Number.isInteger(item.page_idx) ? item.page_idx + 1 : null;
}

function nearestText(items, index, step) {
  for (let i = index + step; i >= 0 && i < items.length; i += step) {
    if (items[i].type === 'text') {
      const text = toText(items[i].text);
      if (text) return step < 0 ? text.slice(-CONTEXT_CHARS) : text.slice(0, CONTEXT_CHARS);
    }
  }
  return '';
}

function imageFileName(item) {
  return typeof item.img_path === 'string' && item.img_path ? item.img_path.split('/').pop() : '';
}

function splitContentList(contentList) {
  const items = Array.isArray(contentList) ? contentList.filter((it) => it && typeof it === 'object') : [];
  const result = { equations: [], tables: [], images: [], pages: 0, counts: { equations: 0, tables: 0, images: 0, discarded: 0 } };
  let maxPage = 0;

  items.forEach((item, index) => {
    const page = pageOf(item);
    if (page && page > maxPage) maxPage = page;
    const context = { before: nearestText(items, index, -1), after: nearestText(items, index, 1) };
    if (item.type === 'equation') {
      const latex = stripLatexDelimiters(item.text);
      if (latex) result.equations.push({ page, latex, ...context });
    } else if (item.type === 'table') {
      const html = typeof item.table_body === 'string' ? item.table_body.trim() : '';
      // 沒有 HTML 內容的表格仍保留切圖，讓管理者／VLM 還有東西可看。
      result.tables.push({ page, html, image: imageFileName(item), caption: toText(item.table_caption), ...context });
    } else if (item.type === 'image') {
      const file = imageFileName(item);
      if (file) result.images.push({ page, file, caption: toText(item.image_caption), footnote: toText(item.image_footnote), ...context });
    } else if (item.type === 'discarded') {
      result.counts.discarded += 1;
    }
  });

  result.pages = maxPage;
  result.counts.equations = result.equations.length;
  result.counts.tables = result.tables.length;
  result.counts.images = result.images.length;
  return result;
}

module.exports = { splitContentList, stripLatexDelimiters };
