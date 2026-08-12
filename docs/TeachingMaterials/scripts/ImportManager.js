/* docs/TeachingMaterials/scripts/ImportManager.js — Sprint AI-115
   AI-115-04 (Import Manager) + AI-115-05 (Import Validation) +
   AI-115-06 (Duplicate Detection) + AI-115-08 (Import Log) +
   AI-115-09 (Rollback).

   "Repository -> Import -> MaterialRuntime -> SummaryRuntime ->
   QuestionRuntime -> StatisticsRuntime -> LearningStateRuntime。不得：
   直接寫入 Runtime。所有 Import 必須經由 Import Manager。"

   Runtime reality check (flagged, not silently reinterpreted): every
   Runtime named above is BROWSER-side `window.AHS` code — this Node
   script has no access to it, and never will (this app has no server,
   no fetch, per CLAUDE.md). The only real bridge from an offline
   Package into those Runtimes is js/runtime/TeachingMaterialLoader.js,
   which already writes to MaterialRuntime/SummaryRuntime/
   QuestionRuntime and NOTHING else does (confirmed: it is the sole
   caller of AHS.MaterialRuntime.add() for the Teaching-Material-Package
   track — the separate MaterialCenter user-upload path is a distinct,
   pre-existing feature, out of this Sprint's "不得修改既有 Learning
   Workflow" scope). StatisticsRuntime/LearningStateRuntime are, by this
   whole codebase's own Single-Source discipline, PURE computed views
   over MaterialRuntime/QuestionRuntime/WrongBookRuntime — they need no
   explicit write-through at all; they see an imported material the
   moment MaterialRuntime does. So "不得直接寫入 Runtime" for a Node
   script can only honestly mean: **this file is the sole gate that
   decides which Packages become visible to that browser bridge at all**
   — i.e. the sole writer of js/data/TeachingMaterialData.js /
   docs/TeachingMaterials/index.json for any Package advancing from
   READY_FOR_IMPORT to IMPORTED. Verified end-to-end (Package -> this
   file -> TeachingMaterialLoader -> MaterialRuntime/SummaryRuntime/
   QuestionRuntime -> StatisticsRuntime/LearningStateRuntime, all real)
   by tests/regression/MaterialPipelineRegression.js (AI-115-10).

   importAll() flow per candidate (every Package currently at
   READY_FOR_IMPORT — RAW/ANALYZING/CLAUDE_READY/ARCHIVED Packages are
   not attempted at all, no log entry):
     1. AI-115-06 Duplicate Detection — RepositoryManager.checkDuplicates()
        across the WHOLE repository (not just candidates); reused, not
        re-implemented. Within a duplicate group, the lexicographically
        smallest materialId (== the earliest-assigned tm_<seq>, since ids
        are assigned sequentially) is kept; every other member is
        rejected as a duplicate of it.
     2. AI-115-05 Import Validation — validateForImport(): metadata.json/
        summary.json/questionbank.json/knowledge.json/report.md must all
        exist (real files, not re-derived here) AND
        TeachingMaterialAdapter.validatePackage() (== ValidateMaterial.js)
        must PASS AND the root index.json must itself parse as valid
        JSON (the "index" file in AI-115-05's checklist — this
        Repository has exactly ONE index.json, AI-115-03's own "建立唯一
        Index", never a per-Package file — flagged interpretation, not
        silently assumed). Missing anything -> Import FAIL for that
        Package alone (never a partial write, never blocks other
        Packages).
     3. Every Package that passes both gates is included in ONE
        generate({ skipIds }) call — skipIds excludes every non-IMPORTED,
        non-passing Package, so a Package still at RAW/ANALYZING/
        CLAUDE_READY (not yet advanced by RepositoryManager.prepare())
        can never slip into TeachingMaterialData.js/index.json through
        this path, even though GenerateTeachingMaterialData.js's own
        lower-level ValidateMaterial.js gate alone wouldn't catch that
        (it has no concept of Lifecycle Stage).
     4. AI-115-09 Rollback — TeachingMaterialData.js / index.json /
        RepositoryStatus.js are backed up (in memory) before the
        generate() call. If it throws for any reason, all three are
        restored byte-for-byte from that backup before this function
        returns/rethrows — Runtime-visible state (what the browser will
        actually load next) never reflects a partial write.
     5. AI-115-08 Import Log — docs/TeachingMaterials/import-log.json
        (a plain, git-tracked JSON array, same "generated, always
        re-readable" convention as index.json) gets one entry per
        attempted Package this run: { time, materialId, version, result,
        error }. result is one of SUCCESS / FAIL_VALIDATION /
        FAIL_DUPLICATE / FAIL_ROLLBACK. */
"use strict";
const fs = require("fs");
const path = require("path");
const lifecycle = require("./MaterialLifecycle.js");
const adapter = require("./TeachingMaterialAdapter.js");
const repoManager = require("./RepositoryManager.js");
const generator = require("./GenerateTeachingMaterialData.js");

const ROOT = path.join(__dirname, "..");
const MATERIALS_DIR = path.join(ROOT, "materials");
const LOG_FILE = path.join(ROOT, "import-log.json");

function loadMetadata(materialId) {
  const p = path.join(MATERIALS_DIR, materialId, "metadata.json");
  if (!fs.existsSync(p)) { return null; }
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { return null; }
}

/* validateForImport(materialId) -> { valid, errors: [string] }.
   AI-115-05. Never re-derives knowledge.json/report.md itself — that is
   RepositoryManager.prepare()'s job (CLAUDE_READY -> READY_FOR_IMPORT);
   this only CHECKS they already exist. */
function validateForImport(materialId) {
  const dir = path.join(MATERIALS_DIR, materialId);
  const errors = [];
  ["metadata.json", "summary.json", "questionbank.json", "knowledge.json", "report.md"].forEach(function (f) {
    if (!fs.existsSync(path.join(dir, f))) { errors.push("missing " + f); }
  });
  const validation = adapter.validatePackage(materialId);
  if (!validation.valid) { errors.push("ValidateMaterial.js: " + validation.fail + " FAIL(s)"); }
  const indexFile = generator.INDEX_FILE;
  try { JSON.parse(fs.readFileSync(indexFile, "utf8")); }
  catch (e) { errors.push("root index.json is not valid JSON: " + e.message); }
  return { valid: errors.length === 0, errors: errors };
}

/* duplicateLoserMap() -> { materialId: winnerMaterialId } for every
   Package that loses a duplicate-group tie-break (AI-115-06). Reuses
   RepositoryManager.checkDuplicates() — one real implementation. */
function duplicateLoserMap() {
  const groups = repoManager.checkDuplicates();
  const losers = {};
  groups.forEach(function (g) {
    const sorted = g.group.slice().sort();
    const winner = sorted[0];
    sorted.slice(1).forEach(function (id) { losers[id] = losers[id] || winner; });
  });
  return losers;
}

function readIfExists(p) {
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

function restoreOrRemove(p, backup) {
  if (backup === null) {
    if (fs.existsSync(p)) { fs.unlinkSync(p); }
  } else {
    fs.writeFileSync(p, backup);
  }
}

function appendLog(entries) {
  let log = { imports: [] };
  if (fs.existsSync(LOG_FILE)) {
    try { log = JSON.parse(fs.readFileSync(LOG_FILE, "utf8")); }
    catch (e) { log = { imports: [] }; }
  }
  if (!Array.isArray(log.imports)) { log.imports = []; }
  log.imports = log.imports.concat(entries);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2) + "\n", "utf8");
}

/* importAll() -> { imported: [materialId], skipped: [{materialId, reason}], log: [entry] } */
function importAll() {
  const now = new Date().toISOString();
  const ids = lifecycle.listMaterialIds();
  const losers = duplicateLoserMap();
  const logEntries = [];
  const skipped = [];
  const toKeep = []; // materialIds allowed into this generate() call

  ids.forEach(function (id) {
    const stage = lifecycle.resolveStage(id);
    if (stage === "IMPORTED") { toKeep.push(id); return; } // already-imported Packages stay, no new log entry
    if (stage !== "READY_FOR_IMPORT") { return; } // RAW/ANALYZING/CLAUDE_READY/ARCHIVED — not attempted this run

    const meta = loadMetadata(id);
    const version = (meta && meta.version) || null;

    if (losers[id]) {
      const entry = { time: now, materialId: id, version: version, result: "FAIL_DUPLICATE", error: "duplicate of " + losers[id] };
      logEntries.push(entry);
      skipped.push({ materialId: id, reason: entry.error });
      return;
    }

    const check = validateForImport(id);
    if (!check.valid) {
      const entry = { time: now, materialId: id, version: version, result: "FAIL_VALIDATION", error: check.errors.join("; ") };
      logEntries.push(entry);
      skipped.push({ materialId: id, reason: entry.error });
      return;
    }

    toKeep.push(id);
    logEntries.push({ time: now, materialId: id, version: version, result: "SUCCESS", error: null });
  });

  const skipIds = ids.filter(function (id) { return toKeep.indexOf(id) === -1; });

  /* AI-115-09 Rollback — backup every file generate() can touch before
     calling it; restore all of them verbatim if it throws. */
  const statusFile = path.join(path.dirname(generator.OUTPUT_FILE), "RepositoryStatus.js");
  const backup = {
    data: readIfExists(generator.OUTPUT_FILE),
    index: readIfExists(generator.INDEX_FILE),
    status: readIfExists(statusFile)
  };

  const newlyImported = logEntries.filter(function (e) { return e.result === "SUCCESS"; }).map(function (e) { return e.materialId; });

  try {
    generator.generate({ skipIds: skipIds });
  } catch (e) {
    /* Each restore attempt is independent and best-effort: if the same
       underlying failure that broke the original write (e.g. a genuine
       disk-full condition) also breaks a restore-write to that same
       path, that must never prevent the OTHER two files from being
       restored, and must never swallow the original error or skip the
       Import Log entry — "必須 Rollback。Runtime 保持一致" has to hold
       even in a worse-than-expected failure, not just the simple case. */
    [
      [generator.OUTPUT_FILE, backup.data],
      [generator.INDEX_FILE, backup.index],
      [statusFile, backup.status]
    ].forEach(function (pair) {
      try { restoreOrRemove(pair[0], pair[1]); }
      catch (restoreErr) { /* best-effort — original error below still surfaces */ }
    });
    const failEntries = newlyImported.map(function (id) {
      const meta = loadMetadata(id);
      return { time: now, materialId: id, version: (meta && meta.version) || null, result: "FAIL_ROLLBACK", error: String((e && e.message) || e) };
    });
    appendLog(logEntries.filter(function (e) { return e.result !== "SUCCESS"; }).concat(failEntries));
    throw e;
  }

  appendLog(logEntries);
  return { imported: newlyImported, skipped: skipped, log: logEntries };
}

if (require.main === module) {
  const result = importAll();
  console.log("ImportManager — imported: " + result.imported.length + ", skipped: " + result.skipped.length);
  result.skipped.forEach(function (s) { console.log("  SKIP " + s.materialId + " — " + s.reason); });
}

module.exports = {
  importAll: importAll,
  validateForImport: validateForImport,
  duplicateLoserMap: duplicateLoserMap,
  LOG_FILE: LOG_FILE
};
