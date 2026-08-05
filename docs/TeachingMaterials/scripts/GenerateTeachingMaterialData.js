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
const lifecycle = require("./MaterialLifecycle.js");

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
  /* Sprint AI-115 AI-115-01: an ARCHIVED Package (manifest.archived ===
     true) is never (re-)included — a material once archived stops being
     an active Runtime-imported material, regardless of whether it was
     IMPORTED before. */
  if (pkg.manifest && pkg.manifest.archived === true) {
    console.warn("SKIP " + materialId + ": archived (manifest.archived === true)");
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
    rawMetadata: pkg.metadata,
    /* pkg/validation — Sprint AI-113 AI-807: used only to (re)generate
       this Package's own knowledge.json/report.md (writeKnowledgeAndReport
       below), never written into TeachingMaterialData.js either. */
    pkg: pkg,
    validation: validation
  };
}

/* buildKnowledgeIndex(materialId, pkg) — Sprint AI-113 AI-807. Real,
   derived rollup: every knowledgePoint comes from questions.json's own
   per-question knowledgePoint field (Sprint AI-112 optional field);
   cross-referenced against summary.json's coreConcepts only to mark
   source "both" when the same term is also mentioned there — never a
   fabricated or hand-authored second list. Honestly empty when no
   question in this Package carries a knowledgePoint yet. */
function buildKnowledgeIndex(materialId, pkg) {
  var coreConcepts = (pkg.summary && Array.isArray(pkg.summary.coreConcepts)) ? pkg.summary.coreConcepts : [];
  var questions = (pkg.questionBank && Array.isArray(pkg.questionBank.questions)) ? pkg.questionBank.questions : [];

  var counts = {};
  questions.forEach(function (q) {
    var name = q.knowledgePoint ? String(q.knowledgePoint).trim() : "";
    if (!name) { return; }
    if (!counts[name]) { counts[name] = 0; }
    counts[name] += 1;
  });

  var knowledgePoints = Object.keys(counts).sort().map(function (name) {
    var inSummary = coreConcepts.some(function (c) { return String(c).indexOf(name) !== -1; });
    return { name: name, source: inSummary ? "both" : "question", refCount: counts[name] };
  });

  return { materialId: materialId, knowledgePoints: knowledgePoints, generatedAt: new Date().toISOString() };
}

/* buildReportMarkdown(materialId, pkg, validation, stage) — Sprint
   AI-113 AI-807. Real, deterministic Markdown summary of this Package's
   own metadata/status/content counts — every line traces to a real
   field already in this Package, nothing composed. */
function buildReportMarkdown(materialId, pkg, validation, stage) {
  var meta = pkg.metadata || {};
  var manifest = pkg.manifest || {};
  var summary = pkg.summary || {};
  var questionBank = pkg.questionBank || {};
  var lines = [
    "# " + materialId + " — Teaching Material Package Report",
    "",
    "Auto-generated by GenerateTeachingMaterialData.js — do not hand-edit; re-run the",
    "generator after any Repository change and this file regenerates with it.",
    "",
    "## Metadata",
    "- 科目：" + (meta.subject || "（未設定）"),
    "- 年級：" + (meta.grade || "（未設定）"),
    "- 章節：" + (meta.chapter || "（未設定）") + (meta.unit ? " / " + meta.unit : ""),
    "- 教材類型：" + (meta.materialType || "（未設定）"),
    "- 版本：" + (meta.version || "（未設定）"),
    "",
    "## Package Status",
    "- Manifest status：" + (manifest.status || "（未設定）"),
    "- Lifecycle Stage：" + (stage || "（無法判斷）"),
    "- Validation：" + (validation.pass || 0) + " PASS / " + (validation.fail || 0) + " FAIL",
    "",
    "## Content Summary",
    "- 核心概念：" + ((summary.coreConcepts || []).length) + " 項",
    "- 題目數：" + ((questionBank.questions || []).length) + " 題",
    ""
  ];
  return lines.join("\n");
}

/* writeKnowledgeAndReport(entries) — Sprint AI-113 AI-807. Writes
   knowledge.json + report.md into each successfully-generated Package's
   own folder (materials/<id>/), real content derived above, resolved
   against the just-written index.json so report.md's own Lifecycle
   Stage line reflects this run's real result (RUNTIME_READY for every
   entry present here — see MaterialLifecycle.js's own header for why
   that's the correct, non-fabricated answer at this exact point). */
function writeKnowledgeAndReport(entries) {
  entries.forEach(function (e) {
    var dir = path.join(MATERIALS_DIR, e.materialId);
    var knowledge = buildKnowledgeIndex(e.materialId, e.pkg);
    fs.writeFileSync(path.join(dir, "knowledge.json"), JSON.stringify(knowledge, null, 2) + "\n", "utf8");
    var stage = lifecycle.resolveStage(e.materialId);
    var report = buildReportMarkdown(e.materialId, e.pkg, e.validation, stage);
    fs.writeFileSync(path.join(dir, "report.md"), report, "utf8");
  });
}

/* generate(options) — options.skipIds (Sprint AI-115 AI-115-06,
   additive, backward compatible: every existing call with no arguments
   behaves exactly as before). ImportManager.js's own duplicate-detection
   gate is the only real caller — a Package flagged as a duplicate of
   another (same content hash, or same subject+chapter+derived title) is
   excluded from this run so generate() never bakes two "same real
   material" entries into TeachingMaterialData.js/index.json, even though
   both individually pass ValidateMaterial.js. */
function generate(options) {
  options = options || {};
  var skipIds = {};
  (options.skipIds || []).forEach(function (id) { skipIds[id] = true; });
  var ids = listMaterialIds().filter(function (id) { return !skipIds[id]; });
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
  /* school/semester passthrough — Sprint AI-120 (Workspace Repository
     Integration) AI-120-01. TeachingMaterialAdapter.convertMaterial()'s
     own output shape is untouched (still "不得修改
     TeachingMaterialAdapter API") — this only clones its result and
     copies 2 already-present, optional rawMetadata fields onto it so
     js/runtime/TeachingMaterialLoader.js (browser side) has something
     real to filter Repository bridging by. No generation/validation
     logic changed, no new required field, no schema touched. */
  var dataEntries = entries.map(function (e) {
    var material = e.material;
    var meta = e.rawMetadata || {};
    if (meta.school || meta.semester) {
      material = Object.assign({}, e.material);
      if (meta.school) { material.school = meta.school; }
      if (meta.semester) { material.semester = meta.semester; }
    }
    return { materialId: e.materialId, material: material, summary: e.summary, questions: e.questions, related: e.related };
  });
  var body = "window.AHS = window.AHS || {};\n" +
    "AHS.TeachingMaterialData = " + JSON.stringify(dataEntries, null, 2) + ";\n";

  fs.writeFileSync(OUTPUT_FILE, header + body, "utf8");
  console.log("Generated " + path.relative(REPO_ROOT, OUTPUT_FILE) + " — " + entries.length + " material(s) included (" + ids.length + " scanned).");

  writeIndex(entries);
  writeKnowledgeAndReport(entries);
  writeRepositoryStatus();
  return entries.length;
}

/* writeRepositoryStatus() — Sprint AI-115 AI-115-07 (Repository
   Dashboard). The browser (this is a static, no-backend, no-fetch app —
   see CLAUDE.md) can only ever see whatever a Node script bakes into a
   static js/data/*.js file; it has no way to ask the filesystem "how
   many Packages are RAW right now" on its own. This writes
   js/data/RepositoryStatus.js, the exact same "offline-generate a
   static data file" pattern TeachingMaterialData.js/index.json already
   use, so js/ui/SettingsPanel.js's Repository section can show real
   per-stage counts (AHS.RepositoryStatus.counts) without inventing a
   second architecture. Scans EVERY Package (via MaterialLifecycle.js),
   not just the ones this run successfully included — RAW/ANALYZING/
   CLAUDE_READY/READY_FOR_IMPORT Packages are real too, just not yet
   Runtime-visible; the Dashboard's whole point is showing they exist. */
function writeRepositoryStatus() {
  var counts = lifecycle.countByStage();
  var outFile = path.join(REPO_ROOT, "js", "data", "RepositoryStatus.js");
  var header = [
    "/* js/data/RepositoryStatus.js — GENERATED FILE, do not hand-edit.",
    "   Produced by docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js",
    "   (Sprint AI-115 AI-115-07 Repository Dashboard). Real per-lifecycle-stage",
    "   Package counts (docs/TeachingMaterials/scripts/MaterialLifecycle.js),",
    "   scanned at generation time — re-run the generator after any Repository",
    "   change for this to stay current. Plain static data, <script>-tagged like",
    "   every other js/data/*.js file — no fetch/XHR/require. */",
    ""
  ].join("\n");
  var body = "window.AHS = window.AHS || {};\n" +
    "AHS.RepositoryStatus = " + JSON.stringify({ counts: counts, generatedAt: new Date().toISOString() }, null, 2) + ";\n";
  fs.writeFileSync(outFile, header + body, "utf8");
  console.log("Generated " + path.relative(REPO_ROOT, outFile) + " — " + JSON.stringify(counts));
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
        /* school/semester — Sprint AI-119 (Platform Core Baseline) §8/§9:
           metadata-level Repository classification (School -> Semester
           -> Subject -> Material), added to metadata.json's own schema
           without re-Importing or changing any materialId. Optional
           (null when a Package predates this field and hasn't been
           migrated) — never fabricated when absent. */
        school: meta.school || null,
        semester: meta.semester || null,
        subject: meta.subject || null,
        grade: meta.grade || null,
        chapter: meta.chapter || null,
        materialType: meta.materialType || null,
        version: meta.version || null,
        /* Sprint AI-115 AI-115-01: tautologically IMPORTED — being
           listed in this generated index IS what that stage means (see
           MaterialLifecycle.js). Earlier stages (RAW/ANALYZING/
           CLAUDE_READY/READY_FOR_IMPORT) only apply to Packages NOT yet
           here — check those with MaterialLifecycle.js directly. */
        lifecycleStage: "IMPORTED"
      };
    })
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log("Generated " + path.relative(REPO_ROOT, INDEX_FILE) + " — " + index.materials.length + " material(s) indexed.");
}

if (require.main === module) {
  generate();
}

module.exports = {
  generate: generate,
  listMaterialIds: listMaterialIds,
  buildEntry: buildEntry,
  writeRepositoryStatus: writeRepositoryStatus,
  /* Sprint AI-115 AI-115-03: exported so RepositoryManager.js's prepare()
     can derive a single Package's knowledge.json/report.md ahead of
     import (CLAUDE_READY -> READY_FOR_IMPORT) without a second,
     duplicate implementation ("不得建立第二套"). */
  buildKnowledgeIndex: buildKnowledgeIndex,
  buildReportMarkdown: buildReportMarkdown,
  OUTPUT_FILE: OUTPUT_FILE,
  INDEX_FILE: INDEX_FILE
};
