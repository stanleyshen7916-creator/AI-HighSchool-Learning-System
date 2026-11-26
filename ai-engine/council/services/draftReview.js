'use strict';
/* services/draftReview.js — 2026-11-26 AHS-A3：Claude 最後檢核（Claude 不寫初稿、不重寫全文）。

   流程：MinerU SOURCE → 本機模型 A、B 各寫初稿 → multiAi.js 本機交叉比對與 Qwen 裁決（無法判定的進「待 Claude 判定」）
        → 本檔 checkUnits：程式逐句對照 SOURCE（不耗 token）
        → buildFinalCheckPrompt：Claude 網頁版讀定稿、SOURCE 與程式標記，只逐句判定、指出錯誤
        → parseFinalCheck：解析回覆（S12：錯誤：… ／ 結論：通過｜需修正）
        → buildRevisionPrompt＋applyRevisions：本機模型只改被指出的句子，程式換回定稿
   修正最多 MAX_REVISION_ROUNDS 輪；仍不通過就標記需人工處理（nextStatus）。 */

const MAX_REVISION_ROUNDS = 2;
// 2026-11-26 實跑：0.35 會把大量「改寫正確」的題目標成低重疊（130 句標了 70 句），改 0.25；標記只是提醒。
const LOW_SUPPORT = 0.25;
const CONTENT_HEADING = /^##\s*([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬])/;
const OTHER_HEADING = /^#{1,6}\s/;
const ATTACH_TO_PREVIOUS = /^\s*(?:[（(][A-Ea-e][)）]|答案\s*[:：]|詳解\s*[:：]|解析\s*[:：])/;

const norm = (s) => String(s == null ? '' : s).replace(/[\s，。、；：「」『』（）()《》〈〉！？!?,.;:'"`~\-—_…·*>#|]/g, '').toLowerCase();
function bigrams(s) {
  const t = norm(s);
  const out = new Set();
  for (let i = 0; i < t.length - 1; i += 1) out.add(t.slice(i, i + 2));
  return out;
}

/* 定稿中要檢核的單位：①～⑬ 的內容逐句切開；選項、答案、詳解行併入前一題（一題一個單位）。
   frontmatter、⑭⑮ 與其他標題不列入。每個單位記下它在 markdown 中的原文（供修正時換回）。 */
function extractUnits(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const units = [];
  let section = null;
  let inFront = lines[0] === '---';
  lines.forEach((line, i) => {
    if (inFront) { if (i > 0 && line === '---') inFront = false; return; }
    const head = CONTENT_HEADING.exec(line);
    if (head) { section = line.replace(/^##\s*/, '').trim(); return; }
    if (OTHER_HEADING.test(line)) { if (!/^###/.test(line)) section = null; return; }
    // 引擎自己加的說明（> 開頭，例如「另有 N 題未通過自動裁決」）與 HTML 註解不是教材內容，不檢核。
    if (!section || !line.trim() || /^(<!--|>)/.test(line.trim())) return;
    if (ATTACH_TO_PREVIOUS.test(line) && units.length && units[units.length - 1].section === section) {
      units[units.length - 1].text += `\n${line}`;
      return;
    }
    const pieces = /^\s*(?:\*\*)?Q?\d+[.．、]/.test(line) ? [line] : line.split(/(?<=[。！？])/).filter((p) => p.trim());
    pieces.forEach((p) => units.push({ section, text: p }));
  });
  return units.map((u, i) => Object.assign(u, { id: `S${i + 1}` }));
}

/* 程式逐句對照 SOURCE（不耗 token）：雙字組覆蓋率，與「」引句是否逐字出現在 SOURCE。 */
function checkUnits(markdown, sourceText) {
  const src = norm(sourceText);
  const srcBigrams = bigrams(sourceText);
  const units = extractUnits(markdown).map((u) => {
    const b = bigrams(u.text);
    let hit = 0;
    b.forEach((x) => { if (srcBigrams.has(x)) hit += 1; });
    const support = b.size ? hit / b.size : 1;
    const flags = [];
    if (src && support < LOW_SUPPORT) flags.push(`與教材原文重疊低（${Math.round(support * 100)}%）`);
    (u.text.match(/「([^」]{6,})」/g) || []).forEach((q) => {
      const inner = q.slice(1, -1);
      if (src && !src.includes(norm(inner))) flags.push(`引句不在教材原文：${q}`);
    });
    return Object.assign(u, { support: Math.round(support * 100) / 100, flags });
  });
  return { units, flagged: units.filter((u) => u.flags.length).length };
}

/* pendingItems：multiAi 本機裁決後仍「待 Claude 判定」的練習題／陳述（P1、C1…，沿用既有審查包），只用來提醒 Claude。 */
function buildFinalCheckPrompt({ metadata = {}, sourceText, units, round = 1, pendingCount = 0 }) {
  const lines = units.map((u) => `${u.id}［${u.section}］${u.flags.length ? `［程式標記：${u.flags.join('；')}］` : ''}\n${u.text}`);
  return [
    `你是高中教材的最後檢核者（第 ${round} 輪）。下面的定稿由兩個本機模型各寫一份初稿、交叉比對後合併而成。`,
    '你的工作只有「逐句判定」：根據【教材原文】檢查每個編號（S1、S2…）的內容是否正確。',
    '規則：',
    '1. 不要重寫全文，不要提供新版本；只指出錯在哪裡、應依據教材原文哪一句。',
    '2. 只列出有錯的編號，格式一行一個：「S12：錯誤：原因（依據：「教材原文」）」。',
    '3. 練習題的編號若答案或詳解有錯，同樣列出，並寫出正確答案。',
    '4. 「程式標記」只是提醒（例如與原文重疊低），教學補充不算錯；你要自己判斷。',
    '5. 最後一行只寫「結論：通過」或「結論：需修正」。沒有任何錯誤才可以寫通過。',
    pendingCount ? `（另有 ${pendingCount} 項「待 Claude 判定」的練習題／陳述，請在上傳頁的「待 Claude 判定」區塊處理。）` : '',
    '',
    `學校：${metadata.school || ''}　年級：${metadata.grade || ''}　科目：${metadata.subject || ''}　單元：${metadata.unit || ''}`,
    '',
    '【教材原文】',
    String(sourceText || '（未提供）'),
    '',
    '【定稿（逐句編號）】',
    lines.join('\n\n'),
  ].filter((l, i, all) => l !== '' || all[i - 1] !== '').join('\n');
}

function parseFinalCheck(replyText, units) {
  const text = String(replyText || '');
  const ids = new Set(units.map((u) => u.id));
  const issues = [];
  text.split(/\r?\n/).forEach((line) => {
    const m = /^\s*[-*•]?\s*(S\d+)\s*[:：]\s*(.+)$/.exec(line);
    if (m && ids.has(m[1]) && !issues.some((x) => x.id === m[1])) issues.push({ id: m[1], comment: m[2].trim() });
  });
  const verdicts = [...text.matchAll(/結論\s*[:：]\s*(通過|需修正)/g)];
  if (!verdicts.length) throw new Error('回覆中找不到「結論：通過」或「結論：需修正」，請確認貼上的是 Claude 的完整回覆');
  const said = verdicts[verdicts.length - 1][1];
  // 列了錯誤卻寫通過，視為需修正（不能讓檢核變鬆）。
  return { verdict: said === '通過' && !issues.length ? 'passed' : 'needs_revision', issues };
}

function nextStatus(verdict, revisionsDone) {
  if (verdict === 'passed') return 'passed';
  return revisionsDone >= MAX_REVISION_ROUNDS ? 'needs_human' : 'needs_revision';
}

function buildRevisionPrompt({ sourceText, units, issues }) {
  const byId = new Map(units.map((u) => [u.id, u]));
  const items = issues.filter((x) => byId.has(x.id)).map((x) => `${x.id}\n原句：${byId.get(x.id).text}\n檢核意見：${x.comment}`);
  return [
    '你是教材撰寫者。下列句子經檢核指出錯誤，請只依【教材原文】修正這些句子。',
    '規則：',
    '1. 只改被指出的句子，其他內容不用輸出。',
    '2. 修正後的內容必須能在教材原文找到依據；不確定就刪除該句。',
    '3. 練習題整題輸出（題幹、選項、答案、詳解，格式與原句相同）。',
    '4. 輸出格式：每個編號一段，第一行「S12：」，下一行起是修正後的內容；要刪除就寫「S12：刪除」。',
    '',
    '【教材原文】',
    String(sourceText || ''),
    '',
    '【需要修正的句子】',
    items.join('\n\n'),
  ].join('\n');
}

/* 解析本機模型的修正並換回 markdown（只換被指出的單位；找不到原句的列入 skipped）。 */
function applyRevisions(markdown, units, revisionText, issueIds) {
  const wanted = new Set(issueIds);
  const byId = new Map(units.map((u) => [u.id, u]));
  const blocks = {};
  let current = null;
  String(revisionText || '').replace(/\r\n/g, '\n').split('\n').forEach((line) => {
    const m = /^\s*(S\d+)\s*[:：]\s*(.*)$/.exec(line);
    if (m && wanted.has(m[1])) { current = m[1]; blocks[current] = m[2] ? [m[2]] : []; return; }
    if (current) blocks[current].push(line);
  });
  const crlf = /\r\n/.test(markdown);
  let out = String(markdown).replace(/\r\n/g, '\n');
  const applied = [];
  const skipped = [];
  Object.keys(blocks).forEach((id) => {
    const unit = byId.get(id);
    const revised = blocks[id].join('\n').trim();
    if (!unit || !revised || out.indexOf(unit.text) < 0) { skipped.push(id); return; }
    out = out.replace(unit.text, revised === '刪除' ? '' : revised);
    applied.push(id);
  });
  issueIds.forEach((id) => { if (!blocks[id] && skipped.indexOf(id) < 0) skipped.push(id); });
  if (applied.length) out = out.replace(/\n{3,}/g, '\n\n'); // 刪除句子後留下的空行收成一行
  return { markdown: crlf ? out.replace(/\n/g, '\r\n') : out, applied, skipped };
}

module.exports = {
  MAX_REVISION_ROUNDS, LOW_SUPPORT, extractUnits, checkUnits, buildFinalCheckPrompt, parseFinalCheck,
  nextStatus, buildRevisionPrompt, applyRevisions,
};
