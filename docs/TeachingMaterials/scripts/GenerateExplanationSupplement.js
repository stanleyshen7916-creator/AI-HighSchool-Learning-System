/* docs/TeachingMaterials/scripts/GenerateExplanationSupplement.js —
   2026-10-01 數學詳解補強.

   Uploaded teaching-material packages are never modified. Richer worked
   solutions (concept, numbered steps, common mistakes, figures drawn from
   the questions' real coordinates) live in a separate overlay keyed by
   questionId:

     docs/TeachingMaterials/explanations/build/*.js        (source)
       -> docs/TeachingMaterials/explanations/tm_N.json     (reviewable data)
       -> js/data/ExplanationSupplementData.js              (loaded by pages)

   Every entry is validated before anything is written: the questionId must
   exist in that package's questionbank.json, steps must be non-empty, and
   each figure must be a plain <svg> with no script, event handler, external
   reference or foreignObject. The original question text is copied in so
   pages can still match old 知識弱點 records that predate questionId.

   Usage: node docs/TeachingMaterials/scripts/GenerateExplanationSupplement.js
          (--check: exit 1 if the generated files are out of date, write nothing) */
"use strict";
const fs = require("fs");
const path = require("path");
const { writeIfChanged } = require("./GenerateTeachingMaterialData.js");

const REPO_ROOT = path.join(__dirname, "..", "..", "..");
const MATERIALS_DIR = path.join(__dirname, "..", "materials");
const EXPLANATIONS_DIR = path.join(__dirname, "..", "explanations");
const OUTPUT_FILE = path.join(REPO_ROOT, "js", "data", "ExplanationSupplementData.js");
const SOURCES = [
  { materialId: "tm_7", module: "MathTm7.js" },
  { materialId: "tm_1", module: "MathTm1.js" },
  { materialId: "tm_11", module: "PhysicsTm11.js" }
];

const UNSAFE_SVG = [/<script/i, /\son[a-z]+\s*=/i, /javascript:/i, /<foreignObject/i, /(?:xlink:)?href\s*=/i, /<iframe/i, /<image/i];

function validateSvg(svg) {
  const errors = [];
  if (typeof svg !== "string" || !/^<svg[\s>]/.test(svg) || !/<\/svg>$/.test(svg)) { errors.push("不是單一 <svg> 元素"); }
  UNSAFE_SVG.forEach((re) => { if (re.test(svg || "")) { errors.push("SVG 含不允許的內容：" + re); } });
  return errors;
}

function validateEntry(entry, bank) {
  const errors = [];
  const q = bank[entry.questionId];
  if (!q) { errors.push("questionbank 中找不到此題"); }
  if (!entry.concept || typeof entry.concept !== "string") { errors.push("缺少 concept"); }
  if (!Array.isArray(entry.steps) || !entry.steps.length || entry.steps.some((s) => !s || typeof s !== "string")) { errors.push("steps 不得為空"); }
  if (entry.pitfalls && !Array.isArray(entry.pitfalls)) { errors.push("pitfalls 必須是陣列"); }
  (entry.figures || []).forEach((f, i) => {
    validateSvg(f.svg).forEach((e) => errors.push("figures[" + i + "] " + e));
    if (!f.caption) { errors.push("figures[" + i + "] 缺少說明文字"); }
  });
  return errors;
}

function build() {
  const byMaterial = {};
  const all = {};
  const errors = [];
  SOURCES.forEach((src) => {
    const bankFile = path.join(MATERIALS_DIR, src.materialId, "questionbank.json");
    const bank = {};
    JSON.parse(fs.readFileSync(bankFile, "utf8")).questions.forEach((q) => { bank[q.questionId] = q; });
    const items = require(path.join(EXPLANATIONS_DIR, "build", src.module));
    byMaterial[src.materialId] = items.map((entry) => {
      validateEntry(entry, bank).forEach((e) => errors.push(src.materialId + " / " + entry.questionId + "：" + e));
      if (all[entry.questionId]) { errors.push(entry.questionId + "：重複"); }
      const out = {
        questionId: entry.questionId,
        materialId: src.materialId,
        question: bank[entry.questionId] ? bank[entry.questionId].question : "",
        concept: entry.concept,
        steps: entry.steps,
        pitfalls: entry.pitfalls || [],
        note: entry.note || "",
        figures: (entry.figures || []).map((f) => ({ svg: f.svg, caption: f.caption }))
      };
      all[entry.questionId] = out;
      return out;
    });
  });
  return { byMaterial, all, errors };
}

function render(result) {
  const files = {};
  Object.keys(result.byMaterial).forEach((id) => {
    files[path.join(EXPLANATIONS_DIR, id + ".json")] =
      JSON.stringify({ materialId: id, entries: result.byMaterial[id] }, null, 2) + "\n";
  });
  const header =
    "/* js/data/ExplanationSupplementData.js — GENERATED FILE, do not hand-edit.\n" +
    "   Produced by docs/TeachingMaterials/scripts/GenerateExplanationSupplement.js\n" +
    "   from docs/TeachingMaterials/explanations/build/. Richer worked solutions\n" +
    "   keyed by questionId; the teaching-material packages are not modified.\n" +
    "   Shown by js/utils/ExplanationSupplement.js. */\n" +
    "window.AHS = window.AHS || {};\n";
  files[OUTPUT_FILE] = header + "AHS.ExplanationSupplementData = " + JSON.stringify(result.all, null, 2) + ";\n";
  return files;
}

function generate(options) {
  options = options || {};
  const result = build();
  if (result.errors.length) {
    result.errors.forEach((e) => console.error("  FAIL  " + e));
    throw new Error("詳解補強資料驗證失敗（" + result.errors.length + " 項）");
  }
  const files = render(result);
  const stale = Object.keys(files).filter((f) => {
    let existing = null;
    try { existing = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n"); } catch (e) { existing = null; }
    return existing !== files[f];
  });
  if (!options.check) { Object.keys(files).forEach((f) => writeIfChanged(f, files[f])); }
  return { count: Object.keys(result.all).length, stale: stale.map((f) => path.relative(REPO_ROOT, f)) };
}

module.exports = { generate, validateSvg };

if (require.main === module) {
  const check = process.argv.indexOf("--check") !== -1;
  const r = generate({ check });
  if (check) {
    if (r.stale.length) { console.error("過期，請重新產生：" + r.stale.join(", ")); process.exit(1); }
    console.log("ExplanationSupplementData 已是最新（" + r.count + " 題）");
  } else {
    console.log("ExplanationSupplementData：" + r.count + " 題" + (r.stale.length ? "，已更新 " + r.stale.join(", ") : "，無變更"));
  }
}
