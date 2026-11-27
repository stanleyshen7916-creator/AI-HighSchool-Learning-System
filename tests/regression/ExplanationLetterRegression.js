/* tests/regression/ExplanationLetterRegression.js — 教訓庫（2026-11-27）：
   詳解不得寫出與答案不符的選項字母。選項在出題時可能被打亂，詳解若寫「正確答案為 C」，
   字母就可能和實際答案對不上。詳解應寫答案文字，不寫字母。 */
"use strict";
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "..", "..", "docs", "TeachingMaterials", "materials");
const pat = /(?:正確)?答案(?:為|是)\s*[（(]?([A-E])[)）]?(?![A-Za-z])/;
const bad = [];
fs.readdirSync(DIR).forEach(function (m) {
  const f = path.join(DIR, m, "questionbank.json");
  if (!fs.existsSync(f)) { return; }
  (JSON.parse(fs.readFileSync(f, "utf8")).questions || []).forEach(function (q) {
    const hit = pat.exec(q.explanation || ""); const opts = q.options || [];
    if (!hit || !opts.length) { return; }
    if (opts[hit[1].charCodeAt(0) - 65] !== q.answer) { bad.push(q.questionId + "（寫 " + hit[1] + "）"); }
  });
});
console.log((bad.length ? "  FAIL" : "  PASS") + "  詳解寫的選項字母都與答案一致" + (bad.length ? "：" + bad.join("、") : ""));
console.log("\n" + (bad.length ? 0 : 1) + " passed, " + (bad.length ? 1 : 0) + " failed");
process.exit(bad.length ? 1 : 0);
