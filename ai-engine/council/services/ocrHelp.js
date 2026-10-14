// ai-engine/council/services/ocrHelp.js — 2026-10-14 原文辨識協助包（審議改版第 3 階段，Project Owner 2026-10-11）。
//
// 教材本文（SOURCE）來自 OCR，認錯字時正確的初稿反而會被判矛盾或證據不足。流程：
//   1. 上傳時每個檔案的文字前插入 <!-- 檔案：檔名 --> 標記，之後才知道哪段文字來自哪張照片。
//   2. 找出看不清楚的頁面：本機 Qwen 的原文合理性檢查（checkSourcePlausibility）找到可疑片段，
//      或該檔 OCR 幾乎沒有文字。
//   3. 協助包只列出這些頁面的檔名（Project Owner 決定：只記錄無法判讀的頁面）；管理者把照片
//      交給 ChatGPT 與 Gemini 網頁版逐字轉錄（不使用 API），再把兩份結果貼回。
//   4. 逐句比對三份文字（本機 OCR、GPT、Gemini）：GPT 與 Gemini 一致且與 OCR 不同 → 自動更正；
//      三份都不一樣 → 列出讓管理者選定；OCR 漏掉、但 GPT 與 Gemini 都有的句子 → 補回。
const MARKER = /<!--\s*檔案：(.+?)\s*-->/g;
const SHORT_OCR_CHARS = 40;

function fileMarker(filename) {
  return `<!-- 檔案：${filename} -->`;
}

// SOURCE -> [{ file, start, end, text }]；沒有標記時整份視為一段（file 為 null）。
function segmentsOf(sourceText) {
  const text = String(sourceText || '');
  const marks = [];
  let m;
  MARKER.lastIndex = 0;
  while ((m = MARKER.exec(text)) !== null) marks.push({ file: m[1], at: m.index, after: m.index + m[0].length });
  if (!marks.length) return [{ file: null, start: 0, end: text.length, text }];
  return marks.map((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].at : text.length;
    return { file: mk.file, start: mk.after, end, text: text.slice(mk.after, end) };
  });
}

// 審議時不需要檔案標記，送進模型前拿掉。
function stripMarkers(sourceText) {
  return String(sourceText || '').replace(/[ \t]*<!--\s*檔案：.+?\s*-->[ \t]*\n?/g, '');
}

function visibleLength(t) {
  return String(t || '').replace(/\s/g, '').length;
}

// 可疑片段與 OCR 幾乎沒有文字的檔案 -> 協助包。
function buildHelpPack(sourceText, suspiciousSpans) {
  const segs = segmentsOf(sourceText);
  const byFile = new Map();
  const add = (seg, reason) => {
    const key = seg.file || '（整份教材本文）';
    if (!byFile.has(key)) byFile.set(key, { file: seg.file, reasons: [] });
    if (byFile.get(key).reasons.indexOf(reason) === -1) byFile.get(key).reasons.push(reason);
  };
  segs.forEach((seg) => { if (seg.file && visibleLength(seg.text) < SHORT_OCR_CHARS) add(seg, 'OCR 幾乎沒有辨識出文字'); });
  (suspiciousSpans || []).forEach((sp) => {
    const at = String(sourceText).indexOf(sp.text);
    const seg = at === -1 ? null : segs.find((s) => at >= s.start && at < s.end);
    if (seg) add(seg, `疑似認錯字：「${sp.text}」${sp.reason ? `（${sp.reason}）` : ''}`);
  });
  const order = segs.map((s) => s.file);
  const pages = Array.from(byFile.values()).sort((a, b) => order.indexOf(a.file) - order.indexOf(b.file));
  const named = pages.filter((p) => p.file);
  const prompt = named.length ? [
    '請逐字轉錄我附上的課本／講義照片中的文字。規則：',
    '1. 完全依照片內容逐字抄寫，不得改寫、摘要、補字或修正原文的用字。',
    '2. 看不清楚的字以「□」代替，不要猜。',
    '3. 每張照片的轉錄以「=== 檔名 ===」開頭，依下列順序輸出：',
    ...named.map((p) => `=== ${p.file} ===`),
    '',
    '需要轉錄的照片（請依檔名上傳）：',
    ...named.map((p) => `- ${p.file}`),
  ].join('\n') : null;
  return { pages, prompt };
}

// 「=== 檔名 ===」分段的轉錄 -> { 檔名: 文字 }
function parseTranscriptions(text) {
  const out = {};
  const re = /^\s*={3,}\s*(.+?)\s*={3,}\s*$/gm;
  const heads = [];
  let m;
  while ((m = re.exec(String(text || ''))) !== null) heads.push({ file: m[1], at: m.index, after: m.index + m[0].length });
  heads.forEach((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].at : String(text).length;
    out[h.file] = String(text).slice(h.after, end).trim();
  });
  return out;
}

function sentences(text) {
  return String(text || '').split(/\n+|(?<=[。！？；])/).map((s) => s.trim()).filter((s) => visibleLength(s) >= 2);
}

function norm(s) {
  return String(s || '').replace(/[\s　]/g, '');
}

function bigrams(s) {
  const set = new Set();
  const t = norm(s);
  for (let i = 0; i < t.length - 1; i += 1) set.add(t.slice(i, i + 2));
  return set;
}

function similarity(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return norm(a) === norm(b) ? 1 : 0;
  let hit = 0;
  A.forEach((x) => { if (B.has(x)) hit += 1; });
  return (2 * hit) / (A.size + B.size);
}

function bestMatch(sentence, candidates) {
  let best = null;
  let score = 0;
  candidates.forEach((c) => {
    const s = similarity(sentence, c);
    if (s > score) { score = s; best = c; }
  });
  return score >= 0.5 ? best : null;
}

// 三方比對。回傳自動更正後的 SOURCE、更正清單、待選定的衝突、補回的句子。
function mergeTranscriptions(sourceText, gptText, geminiText) {
  let text = String(sourceText || '');
  // 只有一張照片時網頁版常省略「=== 檔名 ===」，整份轉錄就屬於那張照片。
  const named = segmentsOf(text).filter((s) => s.file);
  const parse = (t) => {
    const out = parseTranscriptions(t);
    if (!Object.keys(out).length && String(t || '').trim() && named.length === 1) out[named[0].file] = String(t).trim();
    return out;
  };
  const gpt = parse(gptText);
  const gem = parse(geminiText);
  const corrections = [];
  const conflicts = [];
  const additions = [];
  // 由後往前處理各段，避免位移影響前面段落的位置。
  segmentsOf(text).slice().reverse().forEach((seg) => {
    if (!seg.file || (!gpt[seg.file] && !gem[seg.file])) return;
    const gs = sentences(gpt[seg.file]);
    const ms = sentences(gem[seg.file]);
    let segText = seg.text;
    sentences(seg.text).forEach((local) => {
      const g = bestMatch(local, gs);
      const m = bestMatch(local, ms);
      if (g && m && norm(g) === norm(m) && norm(g) !== norm(local)) {
        segText = segText.replace(local, g);
        corrections.push({ file: seg.file, from: local, to: g });
      } else if (g && m && norm(g) !== norm(m) && norm(g) !== norm(local) && norm(m) !== norm(local)) {
        conflicts.push({ file: seg.file, local, gpt: g, gemini: m });
      } else if (!gs.length !== !ms.length && (g || m) && norm(g || m) !== norm(local)) {
        // 只貼回一份轉錄：沒有第二方可以確認，差異一律交給管理者選定。
        conflicts.push({ file: seg.file, local, gpt: g, gemini: m });
      }
    });
    const localSentences = sentences(segText);
    const missing = gs.filter((g) => !bestMatch(g, localSentences) && ms.some((m) => norm(m) === norm(g)));
    if (missing.length) {
      segText = `${segText.replace(/\s+$/, '')}\n${missing.join('\n')}\n`;
      missing.forEach((s) => additions.push({ file: seg.file, text: s }));
    }
    text = text.slice(0, seg.start) + segText + text.slice(seg.end);
  });
  conflicts.reverse().forEach((c, i) => { c.id = `X${i + 1}`; });
  return { text, corrections: corrections.reverse(), conflicts, additions: additions.reverse() };
}

module.exports = { fileMarker, stripMarkers, segmentsOf, buildHelpPack, parseTranscriptions, mergeTranscriptions, similarity };
