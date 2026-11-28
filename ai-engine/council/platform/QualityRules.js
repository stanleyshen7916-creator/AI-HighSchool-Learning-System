'use strict';
/* platform/QualityRules.js — AHS 佇列 9（2026-11-26，分支開發，12/1 合併 A4 後接上）：品質標準中「能用程式判定」的部分。
   原則：能用程式判定的就不交給模型；模型自述的分數一律不採信；缺欄位、讀不到資料一律判定不通過（fail-closed）。

     A. leakChecks          防洩題（長度、字詞、收斂、絕對詞、選項結構），併入關卡 1
     B. bloomDistribution   認知層次分布由程式從題目的 bloom 標籤重算，偏差超過門檻就退回補題
     D. explanationClaims   詳解拆成論述，逐項對照 SOURCE，找不到依據的標「待複核」，併入關卡 2
     E. examCoverage / extraneousLoad   月考組卷層級的涵蓋度與無關負擔
   門檻在 config/quality-gates.json。 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'config', 'quality-gates.json');
function loadConfig(file = CONFIG_FILE) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

const norm = (s) => String(s == null ? '' : s).replace(/[\s，。、；：「」『』（）()《》〈〉！？!?,.;:'"`~\-—_…·*]/g, '').toLowerCase();
const stripLabel = (o) => String(o == null ? '' : o).replace(/^\s*[（(]?\s*[A-Ha-h]\s*[)）.．、]\s*/, '').trim();
const LETTERS = 'ABCDEFGH';
function bigrams(s) { const t = norm(s); const out = new Set(); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out; }
function jaccard(a, b) { let n = 0; a.forEach((x) => { if (b.has(x)) n++; }); const u = a.size + b.size - n; return u ? n / u : 0; }
// 題幹常見的功能詞，不算「關鍵詞」
const STEM_STOP = new Set(['下列', '列何', '何者', '哪一', '一項', '哪個', '敘述', '正確', '錯誤', '關於', '根據', '課本', '內容', '說明', '最能', '下何', '選項', '以下', '請問', '是什', '什麼', '何種', '應該']);

function answerIndex(q) {
  const opts = (q.options || []).map(stripLabel);
  const a = String(q.answer == null ? '' : q.answer).trim();
  if (/^[A-H]$/i.test(a)) { const i = LETTERS.indexOf(a.toUpperCase()); return i < opts.length ? i : -1; }
  const m = /^\s*[（(]\s*([A-H])\s*[)）]/i.exec(a);
  if (m) { const i = LETTERS.indexOf(m[1].toUpperCase()); return i < opts.length ? i : -1; }
  const hits = opts.map((o, i) => (norm(o) === norm(a) ? i : -1)).filter((i) => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}

/* A. 防洩題。回傳 { fail: [...], warn: [...] }；fail 併入關卡 1 淘汰，warn 只記錄。 */
function leakChecks(q, cfg, subject) {
  const c = cfg.leak;
  const fail = [], warn = [];
  const opts = (q.options || []).map(stripLabel);
  const ai = answerIndex(q);
  if (opts.length < 2 || ai < 0) return { fail: ['防洩題檢查：選項或答案讀不出來'], warn };
  const right = opts[ai];
  const wrong = opts.filter((_, i) => i !== ai);
  const len = (s) => norm(s).length;
  // 1. 長度洩題
  const avg = wrong.reduce((n, o) => n + len(o), 0) / wrong.length;
  const ratio = avg ? len(right) / avg : 0;
  if (ratio > c.lengthFail) fail.push(`長度洩題：正確選項是其他選項平均的 ${ratio.toFixed(2)} 倍`);
  else if (ratio > c.lengthWarn) warn.push(`長度偏長：正確選項是其他選項平均的 ${ratio.toFixed(2)} 倍`);
  // 2. 字詞洩題：題幹關鍵詞只出現在正確選項
  const stemKeys = [...bigrams(q.question)].filter((b) => !STEM_STOP.has(b) && /[一-鿿A-Za-z]{2}/.test(b));
  const rightB = bigrams(right);
  const wrongB = wrong.map(bigrams);
  const leaked = stemKeys.filter((b) => rightB.has(b) && wrongB.every((w) => !w.has(b)));
  if (leaked.length >= c.minLeakBigrams) fail.push(`字詞洩題：題幹的「${leaked.slice(0, 4).join('、')}」只出現在正確選項`);
  // 3. 收斂洩題：正確選項與其他選項共用最多元素
  const sims = opts.map((o, i) => { const s = opts.filter((_, j) => j !== i).map((p) => jaccard(bigrams(o), bigrams(p))); return s.reduce((a, b) => a + b, 0) / s.length; });
  const best = sims.indexOf(Math.max(...sims));
  if (opts.length >= 3 && best === ai && sims[ai] >= c.convergenceWarn) warn.push(`收斂洩題：正確選項與其他選項重疊最多（${sims[ai].toFixed(2)}）`);
  // 4. 絕對詞只出現在錯誤選項
  const abs = c.absoluteWords.filter((w) => wrong.some((o) => o.includes(w)) && !right.includes(w));
  if (abs.length && wrong.filter((o) => c.absoluteWords.some((w) => o.includes(w))).length === wrong.length) warn.push(`絕對詞只出現在錯誤選項：${abs.join('、')}`);
  // 5. 選項結構：長短差太多、單一選項超過字數上限
  const lens = opts.map(len);
  if (Math.min(...lens) > 0 && Math.max(...lens) / Math.min(...lens) > c.lengthSpreadWarn) warn.push('選項長短差距過大，語法結構可能不一致');
  const max = c.maxOptionChars[subject] || c.maxOptionChars.default;
  const tooLong = opts.map((o, i) => (len(o) > max ? LETTERS[i] : null)).filter(Boolean);
  if (tooLong.length) warn.push(`選項 ${tooLong.join('、')} 超過 ${max} 字`);
  return { fail, warn };
}

/* B. 認知層次分布：只用題目上的 bloom 標籤（由程式計數，不採信模型報告的比例）。
   沒有標籤的題目算「未標」，未標就不可能通過（fail-closed）。 */
function bloomDistribution(questions, cfg) {
  const { levels, target, maxDeviation } = cfg.bloom;
  const counts = Object.fromEntries(levels.map((l) => [l, 0]));
  let unlabeled = 0;
  for (const q of questions) { if (levels.includes(q.bloom)) counts[q.bloom]++; else unlabeled++; }
  const total = questions.length;
  const dist = Object.fromEntries(levels.map((l) => [l, total ? counts[l] / total : 0]));
  const deviations = Object.fromEntries(levels.map((l) => [l, Math.round((dist[l] - target[l]) * 1000) / 1000]));
  const short = levels.filter((l) => deviations[l] < -maxDeviation);
  const over = levels.filter((l) => deviations[l] > maxDeviation);
  const ok = total > 0 && unlabeled === 0 && !short.length && !over.length;
  return { total, counts, unlabeled, dist, deviations, short, over, ok };
}

/* D. 詳解逐項驗證：去掉「難度」「出處」後，依句號切成論述，每個論述的雙字組要有 minSupport 比例出現在 SOURCE。 */
function explanationClaims(q, sourceText, cfg) {
  const c = cfg.claims;
  if (!String(sourceText || '').trim()) return { claims: [], unsupported: [], review: ['沒有教材原文可對照詳解'] };
  const body = String(q.explanation || '').replace(/難度\s*[:：]\s*[易中難]/g, '').split(/出處\s*[:：]/)[0];
  const claims = body.split(/(?<=[。！？；])|\n/).map((s) => s.trim()).filter((s) => norm(s).length >= c.minChars);
  const src = bigrams(sourceText);
  const unsupported = [];
  for (const s of claims) {
    const b = bigrams(s);
    let hit = 0; b.forEach((x) => { if (src.has(x)) hit++; });
    const support = b.size ? hit / b.size : 0;
    if (support < c.minSupport) unsupported.push({ claim: s, support: Math.round(support * 100) / 100 });
  }
  return { claims, unsupported, review: unsupported.length ? [`詳解有 ${unsupported.length} 個論述在原文找不到依據`] : [] };
}

/* E. 月考組卷：涵蓋度（卷上的知識點 ÷ 範圍內知識點）與無關負擔（數理題幹過長）。 */
function examCoverage(paper, scopeKnowledgePoints, cfg) {
  const scope = [...new Set(scopeKnowledgePoints.filter(Boolean))];
  const covered = new Set(paper.map((q) => q.knowledgePoint).filter((k) => scope.includes(k)));
  const coverage = scope.length ? covered.size / scope.length : 0;
  return { coverage: Math.round(coverage * 1000) / 1000, covered: covered.size, scope: scope.length, missing: scope.filter((k) => !covered.has(k)), ok: scope.length > 0 && coverage >= cfg.exam.minCoverage };
}
function extraneousLoad(q, subject, cfg) {
  const max = cfg.exam.maxStemChars[subject];
  if (!max) return [];
  const n = norm(q.question).length;
  return n > max ? [`題幹 ${n} 字，超過 ${subject} 的 ${max} 字上限（可能在測閱讀而不是本科能力）`] : [];
}

module.exports = { loadConfig, CONFIG_FILE, leakChecks, bloomDistribution, explanationClaims, examCoverage, extraneousLoad, answerIndex, stripLabel, norm, bigrams };
