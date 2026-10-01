/* tests/regression/SupplementMergeRegression.js — 2026-10-01 為既有教材加題.

   GenerateTeachingMaterialData.js mergeSupplements(): a 補充題庫 Package
   (metadata.source === "補充題庫", one related.json link) is not a material
   of its own — its questions join the parent's bank (materialId rewritten
   to the parent, supplementId kept), and it is dropped when the parent is
   not included. Ordinary materials, including ones with normal related
   links, are untouched. The full create → publish → merge flow against a
   copy of the platform is covered by ai-engine/council/tests/supplement.test.js.

   Run: node tests/regression/SupplementMergeRegression.js */
"use strict";
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const { mergeSupplements } = require(path.join(REPO, "docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js"));

function entry(id, opts) {
  opts = opts || {};
  return {
    materialId: id,
    material: { title: id },
    summary: {},
    questions: (opts.q || []).map((n) => ({ id: id + "_q" + n, materialId: id, question: id + " 題 " + n })),
    related: opts.related || [],
    rawMetadata: { source: opts.source || "課本" }
  };
}

console.log("SupplementMerge Regression — 補充題庫併入原教材");
const origWarn = console.warn;
const warnings = [];
console.warn = (m) => warnings.push(String(m));

const parent = entry("tm_7", { q: [1, 2] });
const other = entry("tm_8", { q: [1], related: [{ materialId: "tm_7", reason: "同一章" }] });
const sup = entry("tm_20", { q: [1, 2, 3], source: "補充題庫", related: [{ materialId: "tm_7", reason: "補充題庫：…" }] });
const orphan = entry("tm_21", { q: [1], source: "補充題庫", related: [{ materialId: "tm_99", reason: "補充題庫：…" }] });
const before = JSON.stringify([parent, other, sup, orphan]);
const out = mergeSupplements([parent, other, sup, orphan]);
console.warn = origWarn;

const ids = out.map((e) => e.materialId);
check("補充題庫不會成為一份教材", ids.indexOf("tm_20") === -1 && ids.indexOf("tm_21") === -1);
check("一般教材（含一般的關聯教材）照常保留", JSON.stringify(ids) === JSON.stringify(["tm_7", "tm_8"]) && out[1].questions.length === 1);
const merged = out[0].questions;
check("補充題目接在原教材題目之後", merged.length === 5 && merged[0].id === "tm_7_q1" && merged[2].id === "tm_20_q1");
check("補充題目的 materialId 改為原教材，保留 supplementId", merged.slice(2).every((q) => q.materialId === "tm_7" && q.supplementId === "tm_20"));
check("原教材找不到時略過並警告", warnings.some((w) => /tm_21/.test(w)));
check("不修改輸入資料", JSON.stringify([parent, other, sup, orphan]) === before);
check("沒有補充題庫時輸出與輸入相同", JSON.stringify(mergeSupplements([parent, other])) === JSON.stringify([parent, other]));

console.log("\nSupplementMergeRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
