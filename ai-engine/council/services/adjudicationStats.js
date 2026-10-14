// ai-engine/council/services/adjudicationStats.js — 2026-10-14 送審比例統計（審議改版第 3 階段 ⑥，Project Owner 2026-10-11）。
//
// 掃描 outputs/*.adjudication.json，統計本機 Qwen 沒有定論、送到 Claude 最終審查的比例：
//   陳述：claimReview.pending（尚未回覆）＋ claimReview.resolved（已回覆：成立／刪除）
//   練習題：practice.pending ＋ practice.resolved（已收錄／已刪除），其餘為自動通過。
// 2026-10-12 以前的審議沒有這兩項紀錄，列為「舊版紀錄」，不計入比例。
const fs = require('fs');
const path = require('path');

function sum(list, fn) {
  return list.reduce((acc, x) => acc + fn(x), 0);
}

function rate(part, whole) {
  return whole ? Math.round((part / whole) * 1000) / 10 : null;
}

function statsOfRecord(record) {
  const claims = Array.isArray(record.claims) ? record.claims : [];
  const out = { mode: record.adjudication_mode || null, claimsTotal: claims.length, tracked: false };
  const cr = record.claimReview;
  if (cr) {
    out.tracked = true;
    const resolved = cr.resolved || [];
    const confirmed = sum(resolved, (r) => (r.confirmed || []).length);
    const removed = sum(resolved, (r) => (r.removed || []).length);
    out.claims = {
      total: claims.length,
      toClaude: (cr.pending || []).length + confirmed + removed,
      disagreement: claims.filter((c) => c.escalate).length,
      pending: (cr.pending || []).length, confirmed, removed,
    };
  }
  const pr = record.practice;
  if (pr) {
    out.tracked = true;
    const resolved = pr.resolved || [];
    const added = sum(resolved, (r) => (r.accepted || []).length);
    const dropped = sum(resolved, (r) => (r.dropped || []).length);
    const pending = (pr.pending || []).length;
    out.practice = {
      total: pr.total || 0, toClaude: pending + added + dropped,
      auto: (pr.total || 0) - (pending + added + dropped), pending, added, dropped,
    };
  }
  return out;
}

// 檔名：學校_年級_科目_單元_類別_Final.md
function subjectOf(filename) {
  const parts = String(filename).split('_');
  return parts.length >= 3 ? parts[2] : '其他';
}

function emptyBucket() {
  return {
    finals: 0,
    claims: { total: 0, toClaude: 0, disagreement: 0, pending: 0, confirmed: 0, removed: 0 },
    practice: { total: 0, toClaude: 0, auto: 0, pending: 0, added: 0, dropped: 0 },
  };
}

function addTo(bucket, s) {
  bucket.finals += 1;
  if (s.claims) Object.keys(bucket.claims).forEach((k) => { bucket.claims[k] += s.claims[k] || 0; });
  if (s.practice) Object.keys(bucket.practice).forEach((k) => { bucket.practice[k] += s.practice[k] || 0; });
}

function withRates(bucket) {
  return Object.assign({}, bucket, {
    claimEscalationRate: rate(bucket.claims.toClaude, bucket.claims.total),
    practiceEscalationRate: rate(bucket.practice.toClaude, bucket.practice.total),
    // Claude 回覆「成立」的比例：越高代表本機模型越常把正確內容判為沒有定論（過度保守）。
    claudeConfirmRate: rate(bucket.claims.confirmed, bucket.claims.confirmed + bucket.claims.removed),
  });
}

function computeStats(outputsDir) {
  const files = fs.existsSync(outputsDir) ? fs.readdirSync(outputsDir).filter((f) => f.endsWith('.adjudication.json')) : [];
  const overall = emptyBucket();
  const bySubject = {};
  const rows = [];
  let legacy = 0;
  let fallback = 0;
  files.forEach((f) => {
    let record;
    try { record = JSON.parse(fs.readFileSync(path.join(outputsDir, f), 'utf8')); } catch (_) { return; }
    const s = statsOfRecord(record);
    const final = f.replace(/\.adjudication\.json$/, '');
    if (s.mode !== 'llm_semantic') { fallback += 1; return; }
    if (!s.tracked) { legacy += 1; return; }
    const subject = subjectOf(final);
    addTo(overall, s);
    if (!bySubject[subject]) bySubject[subject] = emptyBucket();
    addTo(bySubject[subject], s);
    rows.push(Object.assign({ final, subject, at: fs.statSync(path.join(outputsDir, f)).mtime.toISOString() }, s));
  });
  rows.sort((a, b) => (a.at < b.at ? 1 : -1));
  const subjects = {};
  Object.keys(bySubject).forEach((k) => { subjects[k] = withRates(bySubject[k]); });
  return { overall: withRates(overall), bySubject: subjects, finals: rows, legacy, fallback };
}

module.exports = { computeStats, statsOfRecord, subjectOf };
