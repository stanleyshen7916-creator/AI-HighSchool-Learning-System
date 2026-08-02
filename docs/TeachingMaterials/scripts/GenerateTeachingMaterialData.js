/* docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js —
   Sprint v1.4 "First Real Material Workflow" · Module A (Offline
   Generator).

   Scans docs/TeachingMaterials/materials/ for Packages, converts each
   through the existing, unmodified TeachingMaterialAdapter.js (no
   Adapter API change — this script only calls its already-exported
   functions), and writes js/data/TeachingMaterialData.js: a plain
   static JS data file, loaded via <script> tag exactly like
   js/data/MockData.js / ExamData.js / QuotesData.js / TasksData.js
   already are. This is the resolution to the "how does Repository JSON
   reach the browser" problem flagged during EO-S1.2-001/Sprint v1.3:
   no fetch(), no XHR, no bundler, no build tool — the JSON is inlined
   into a checked-in JS file by this offline Node script instead, run
   manually (or by Claude) whenever the Repository changes, per this
   Sprint's own "可手動執行。可由 Claude 執行" instruction.

   Judgment call (flagged, not specified by the Sprint): a Package is
   skipped (with a console.warn, not included in the generated data) if
   ValidateMaterial.js reports any FAIL for it — never inline data this
   script can't confirm is schema-valid. metadata.json missing/unparsable
   is treated the same way. Neither check duplicates ValidateMaterial.js's
   own logic; both simply call TeachingMaterialAdapter.validatePackage(),
   which already reuses it.

   Usage: node docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js */
"use strict";
const fs = require("fs");
const path = require("path");
const adapter = require("./TeachingMaterialAdapter.js");

const REPO_ROOT = path.join(__dirname, "..", "..", "..");
const MATERIALS_DIR = path.join(__dirname, "..", "materials");
const OUTPUT_FILE = path.join(REPO_ROOT, "js", "data", "TeachingMaterialData.js");
/* Sprint AI-112 AI-703 (Repository Index): docs/TeachingMaterials/index.json
   existed since EO-S1.1-001 as a human-readable manifest but no script ever
   wrote to it — it was, in practice, hand-maintainable, directly
   contradicting its own "不得人工修改" requirement. This generator is the
   single place that already walks every real Package, so it now also
   rewrites index.json from the exact same real data used for
   TeachingMaterialData.js — one real source, two generated views, still
   genuinely empty until real material exists (never pre-populated). */
const INDEX_FILE = path.join(__dirname, "..", "index.json");

function listMaterialIds() {
  if (!fs.existsSync(MATERIALS_DIR)) { return []; }
  return fs.readdirSync(MATERIALS_DIR, { withFileTypes: true })
    .filter(function (entry) { return entry.isDirectory(); })
    .map(function (entry) { return entry.name; })
    .filter(function (name) { return /^tm_\d+$/.test(name); })
    .sort();
}

function buildEntry(materialId) {
  var pkg = adapter.loadPackage(materialId);
  if (!pkg.metadata) {
    console.warn("SKIP " + materialId + ": metadata.json missing or invalid JSON");
    return null;
  }
  var validation = adapter.validatePackage(materialId);
  if (!validation.valid) {
    console.warn("SKIP " + materialId + ": ValidateMaterial.js reported " + validation.fail + " FAIL(s) — not included");
    return null;
  }
  return {
    materialId: materialId,
    material: adapter.convertMaterial(pkg.metadata),
    summary: adapter.convertSummary(pkg.summary, pkg.metadata),
    questions: adapter.convertQuestions(pkg.questionBank),
    related: adapter.convertRelated(pkg.related),
    /* Raw metadata (materialType/keywords/difficulty/source/version) —
       used only to build index.json below, never written into
       TeachingMaterialData.js itself (stripped out there, see generate()). */
    rawMetadata: pkg.metadata
  };
}

function generate() {
  var ids = listMaterialIds();
  var entries = [];
  ids.forEach(function (id) {
    var entry = buildEntry(id);
    if (entry) { entries.push(entry); }
  });

  var header = [
    "/* js/data/TeachingMaterialData.js — GENERATED FILE, do not hand-edit.",
    "   Produced by docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js",
    "   from docs/TeachingMaterials/materials/ via the unmodified",
    "   TeachingMaterialAdapter.js. Re-run the generator (and commit the",
    "   result) after any Repository change; this file itself is plain",
    "   static data — no fetch/XHR/require, same convention every other",
    "   js/data/*.js file in this repo already uses.",
    "   Usage: node docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js */",
    ""
  ].join("\n");
  var dataEntries = entries.map(function (e) {
    return { materialId: e.materialId, material: e.material, summary: e.summary, questions: e.questions, related: e.related };
  });
  var body = "window.AHS = window.AHS || {};\n" +
    "AHS.TeachingMaterialData = " + JSON.stringify(dataEntries, null, 2) + ";\n";

  fs.writeFileSync(OUTPUT_FILE, header + body, "utf8");
  console.log("Generated " + path.relative(REPO_ROOT, OUTPUT_FILE) + " — " + entries.length + " material(s) included (" + ids.length + " scanned).");

  writeIndex(entries);
  return entries.length;
}

/* AI-703: index.json — one real, auto-generated record per included
   Package (never per scanned-but-skipped/invalid folder), drawn from the
   same real metadata.json the JS data file above already used. */
function writeIndex(entries) {
  var index = {
    "$comment": "Knowledge Index — auto-generated by GenerateTeachingMaterialData.js. Do not hand-edit; re-run the generator after any Repository change.",
    version: 1,
    updatedAt: entries.length ? new Date().toISOString() : null,
    materials: entries.map(function (e) {
      var meta = e.rawMetadata || {};
      return {
        materialId: e.materialId,
        subject: meta.subject || null,
        grade: meta.grade || null,
        chapter: meta.chapter || null,
        materialType: meta.materialType || null,
        version: meta.version || null
      };
    })
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log("Generated " + path.relative(REPO_ROOT, INDEX_FILE) + " — " + index.materials.length + " material(s) indexed.");
}

if (require.main === module) {
  generate();
}

module.exports = { generate: generate, listMaterialIds: listMaterialIds, buildEntry: buildEntry };
