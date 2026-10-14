// ai-engine/council/services/goldSet.js — 2026-10-14 標準答案集（審議改版第 3 階段 ⑤，Project Owner 2026-10-11）。
//
// 每次在上傳頁貼回 Claude 審查結果（管理者可先修改回覆再套用），逐題記錄：題目或陳述、
// Qwen 原本的判定、最終裁決，以及當時的教材本文快照。累積下來就是一份回歸測試集：
// 換模型（例如第 4 階段離峰改用 14B）或改 Prompt 前後，用 tools/gold-eval.js 重跑一次，
// 看本機模型與最終裁決的一致率有沒有變好。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LETTERS = 'ABCDE';

function goldDir(dataDir) {
  return path.join(dataDir, 'gold');
}

// 教材本文以內容雜湊存一份，同一份本文的多筆裁決共用。
function saveSource(dataDir, sourceText) {
  const text = String(sourceText || '');
  if (!text.trim()) return null;
  const hash = crypto.createHash('sha1').update(text, 'utf8').digest('hex');
  const dir = path.join(goldDir(dataDir), 'sources');
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, `${hash}.txt`);
  if (!fs.existsSync(p)) fs.writeFileSync(p, text, 'utf8');
  return hash;
}

function loadSource(dataDir, hash) {
  if (!hash || !/^[0-9a-f]{40}$/.test(hash)) return null;
  const p = path.join(goldDir(dataDir), 'sources', `${hash}.txt`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function letterOf(q, answer) {
  const i = (q.options || []).indexOf(answer);
  return i === -1 ? null : LETTERS[i];
}

// practice-review 套用結果 -> 標準答案集紀錄
function rulingsFrom({ final, frontmatter, sourceHash, practiceResult, claimResult }) {
  const at = new Date().toISOString();
  const base = {
    at, final, subject: (frontmatter && frontmatter.subject) || null, unit: (frontmatter && frontmatter.unit) || null, sourceHash: sourceHash || null,
  };
  const out = [];
  (practiceResult ? practiceResult.accepted : []).forEach((p) => out.push(Object.assign({}, base, {
    kind: 'practice', question: p.question, options: p.options,
    qwen: (p.checks && p.checks.qwen) || null, qwenReason: p.reason || null,
    ruling: p.claude, answer: letterOf(p, p.answer),
  })));
  (practiceResult ? practiceResult.dropped : []).forEach((d) => out.push(Object.assign({}, base, {
    kind: 'practice', question: d.item.question, options: d.item.options,
    qwen: (d.item.checks && d.item.checks.qwen) || null, qwenReason: d.item.reason || null,
    ruling: d.verdict, answer: null,
  })));
  (claimResult ? claimResult.confirmed : []).forEach((c) => out.push(Object.assign({}, base, {
    kind: 'claim', claim: c.claim, qwen: c.verdict || null, qwenReason: c.reason || null, escalate: !!c.escalate, ruling: '成立',
  })));
  (claimResult ? claimResult.removed : []).forEach((r) => out.push(Object.assign({}, base, {
    kind: 'claim', claim: r.claim.claim, qwen: r.claim.verdict || null, qwenReason: r.claim.reason || null, escalate: !!r.claim.escalate, ruling: r.verdict,
  })));
  return out;
}

function appendRulings(dataDir, rulings) {
  if (!rulings.length) return 0;
  fs.mkdirSync(goldDir(dataDir), { recursive: true });
  fs.appendFileSync(path.join(goldDir(dataDir), 'rulings.jsonl'), rulings.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  return rulings.length;
}

function readRulings(dataDir) {
  const p = path.join(goldDir(dataDir), 'rulings.jsonl');
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.trim()).map((l) => {
    try { return JSON.parse(l); } catch (_) { return null; }
  }).filter(Boolean);
}

// 回歸測試的預期結果：陳述「成立」→ 本機模型應判 SUPPORTED；「不成立」→ 不應判 SUPPORTED；
// 「無法判斷」連 Claude 都無法確定，不列入評分。練習題有最終答案（正確／答案應為 X）才評分。
function expectationOf(r) {
  if (r.kind === 'claim') {
    if (r.ruling === '成立') return { supported: true };
    if (r.ruling === '不成立') return { supported: false };
    return null;
  }
  return r.answer ? { answer: r.answer } : null;
}

function summarize(rulings) {
  const claims = rulings.filter((r) => r.kind === 'claim');
  const practice = rulings.filter((r) => r.kind === 'practice');
  const count = (list, key) => list.reduce((acc, r) => { acc[r[key]] = (acc[r[key]] || 0) + 1; return acc; }, {});
  return {
    total: rulings.length,
    scorable: rulings.filter((r) => expectationOf(r) && r.sourceHash).length,
    claims: { total: claims.length, byRuling: count(claims, 'ruling') },
    practice: { total: practice.length, byRuling: count(practice.map((p) => Object.assign({}, p, { ruling: /^答案應為/.test(p.ruling) ? '答案應為 X' : p.ruling })), 'ruling') },
  };
}

module.exports = { saveSource, loadSource, rulingsFrom, appendRulings, readRulings, expectationOf, summarize, goldDir };
