'use strict';
/* services/draftFormat.js — 2026-11-28 AHS-B1：本機初稿的輸出格式檢查與補寫提示。
   11/26 A3 實跑：模型 B（gpt-oss:20b）只寫 12/15 節、變式題只有題幹（缺選項／答案／詳解）、
   標題層級「# ①」「①」混用。初稿寫完就檢查；有缺漏時只請模型補寫缺的部分（不重寫整份，省本機算力），
   補寫後仍有缺漏就把問題列在結果裡，讓上傳頁顯示、由人決定。

     checkDraft(text, { questions = 30 }) -> { ok, missingSections, headingStyles, mixedHeadings,
                                               questions: { found, incomplete }, variants: { found, incomplete } }
     repairPrompt(originalPrompt, report) -> 只要求補寫缺漏部分的提示詞（null＝不需要補寫）
     appendRepair(draft, repairText)      -> 補寫內容接在原稿後面 */
const { extractSectionsFromDraft } = require('./multiAi');

const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮';
const HEADING_RE = /^[ \t]*(#{1,6}[ \t]*|\*\*[ \t]*)?([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮])/;

function headingStyleOf(line) {
  const m = HEADING_RE.exec(line);
  if (!m) return null;
  const prefix = (m[1] || '').trim();
  if (!prefix) return '①';
  return prefix.startsWith('**') ? '**①' : `${prefix} ①`;
}

/* 題目區塊：從「Q12.」「**V3.**」開始到下一題或下一個章節標題為止。 */
function blocksOf(text, kind) {
  const lines = String(text || '').split(/\r?\n/);
  const start = new RegExp(`^\\s*(?:\\*\\*\\s*)?${kind}\\s*(\\d+)\\s*[.．、:：]`);
  const blocks = [];
  let cur = null;
  lines.forEach((line) => {
    const m = start.exec(line);
    if (m) { cur = { n: Number(m[1]), lines: [line] }; blocks.push(cur); return; }
    if (!cur) return;
    if (HEADING_RE.test(line) || /^\s*#{1,6}\s/.test(line) || /^\s*(?:\*\*\s*)?[QV]\s*\d+\s*[.．、:：]/.test(line)) { cur = null; return; }
    cur.lines.push(line);
  });
  return blocks;
}

function blockProblems(block) {
  const body = block.lines.join('\n');
  const options = (body.match(/[（(]\s*[A-E]\s*[)）]/g) || []).length;
  const missing = [];
  if (options < 2) missing.push('選項');
  if (!/答案\s*[:：]\s*\S/.test(body)) missing.push('答案');
  if (!/詳解\s*[:：]\s*\S/.test(body)) missing.push('詳解');
  return missing;
}

function checkDraft(text, options = {}) {
  const want = options.questions || 30;
  const sections = extractSectionsFromDraft(text || '');
  const keys = Object.keys(sections);
  const missingSections = keys.filter((k) => !String(sections[k] || '').trim());
  const styles = {};
  String(text || '').split(/\r?\n/).forEach((line) => {
    const s = headingStyleOf(line);
    if (s) styles[s] = (styles[s] || 0) + 1;
  });
  const headingStyles = Object.keys(styles);
  const check = (kind) => {
    const blocks = blocksOf(text, kind);
    const seen = new Set(blocks.map((b) => b.n));
    const incomplete = blocks.map((b) => ({ n: b.n, missing: blockProblems(b) })).filter((b) => b.missing.length)
      .map((b) => `${kind}${b.n}（缺${b.missing.join('、')}）`);
    const absent = [];
    for (let i = 1; i <= want; i += 1) if (!seen.has(i)) absent.push(`${kind}${i}`);
    return { found: seen.size, incomplete, absent };
  };
  const questions = check('Q');
  const variants = check('V');
  const ok = !missingSections.length && headingStyles.length <= 1 && !questions.incomplete.length && !questions.absent.length
    && !variants.incomplete.length && !variants.absent.length;
  return { ok, missingSections, headingStyles, mixedHeadings: headingStyles.length > 1, questions, variants };
}

function summary(report) {
  const parts = [];
  if (report.missingSections.length) parts.push(`缺少章節：${report.missingSections.join('、')}`);
  if (report.questions.absent.length) parts.push(`缺少練習題：${report.questions.absent.join('、')}`);
  if (report.questions.incomplete.length) parts.push(`練習題欄位不全：${report.questions.incomplete.join('、')}`);
  if (report.variants.absent.length) parts.push(`缺少變式題：${report.variants.absent.join('、')}`);
  if (report.variants.incomplete.length) parts.push(`變式題欄位不全：${report.variants.incomplete.join('、')}`);
  if (report.mixedHeadings) parts.push(`章節標題格式不一致（${report.headingStyles.join('、')}）`);
  return parts;
}

/* 只補寫缺的部分。標題格式不一致不需要補寫（解析端已容錯），只在報告裡記錄。 */
function repairPrompt(originalPrompt, report) {
  const items = summary(Object.assign({}, report, { mixedHeadings: false }));
  if (!items.length) return null;
  return [
    String(originalPrompt || ''),
    '',
    '【補寫】你上一次的輸出有以下缺漏。這次只輸出缺漏的部分，不要重寫已完成的內容：',
    ...items.map((x) => `- ${x}`),
    '- 章節標題一律用「## ①核心概念」這種格式（兩個井號＋圈號數字＋章節名稱）。',
    '- 練習題與變式題每一題都要有 (A)(B)(C)(D) 選項、「答案：」與「詳解：」，寫在該題下方。',
    '- 補寫的變式題放在「## 變式題」標題下。',
  ].join('\n');
}

function appendRepair(draft, repairText) {
  const extra = String(repairText || '').trim();
  return extra ? `${String(draft || '').replace(/\s+$/, '')}\n\n${extra}\n` : draft;
}

module.exports = { checkDraft, repairPrompt, appendRepair, summary, CIRCLED };
