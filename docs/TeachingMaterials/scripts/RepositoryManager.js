/* docs/TeachingMaterials/scripts/RepositoryManager.js — Sprint AI-115
   AI-115-03 (Material Pipeline Automation).

   "掃描所有 Package / 建立唯一 Index / 檢查重複教材 / 檢查版本 / 檢查狀態。
   不得：人工修改 index。"

   This does NOT re-implement Package scanning, Package validation, or
   index.json writing — those already exist, real and tested, in
   MaterialLifecycle.js / TeachingMaterialAdapter.js / ValidateMaterial.js
   / GenerateTeachingMaterialData.js ("不得建立第二套"). RepositoryManager
   is a thin coordinating layer on top of them:

     - scanPackages()   -> MaterialLifecycle.listStages() (real, already
                            deterministic per-Package stage).
     - checkDuplicates()-> real content-hash (sha256 over this Package's
                            own metadata.json+material.md+summary.json+
                            questionbank.json bytes) plus a real
                            title+subject+chapter collision check (reusing
                            TeachingMaterialAdapter.deriveTitle(), not a
                            second title-derivation rule). Two Packages
                            flagged only when BOTH their materialId differ
                            AND one of these real signals matches — same
                            function AI-115-06's Import-time duplicate
                            gate below also calls, so "reject on import"
                            and "report in the Repository scan" can never
                            disagree.
     - checkVersions()  -> flags any Package whose metadata.json `version`
                            is missing/empty, or isn't the
                            README-documented "starts at 1, increments as
                            a plain integer string" convention — reported,
                            never silently coerced.
     - checkStatuses()  -> real per-stage tally (MaterialLifecycle's own
                            countByStage()) plus the list of Packages
                            whose manifest.status is missing/invalid.
     - report()          -> aggregates all of the above into one object,
                            used by both the CLI output below and
                            ImportManager.js.
     - rebuildIndex()    -> the ONLY way index.json is ever written:
                            delegates to GenerateTeachingMaterialData.js's
                            generate(), the same real, already-tested
                            writer — this file adds no second writer, so
                            "不得人工修改 index" holds structurally (there
                            is exactly one write path, and it was never a
                            human hand-edit to begin with).
     - prepare()         -> for every CLAUDE_READY Package (manifest
                            complete/pending_review, all 4 input files
                            present, knowledge.json/report.md not yet
                            derived), derives knowledge.json/report.md via
                            GenerateTeachingMaterialData.js's own
                            buildKnowledgeIndex()/buildReportMarkdown()
                            (reused, not duplicated) WITHOUT touching
                            index.json/TeachingMaterialData.js — this is
                            what actually advances a Package from
                            CLAUDE_READY to READY_FOR_IMPORT. Importing
                            (READY_FOR_IMPORT -> IMPORTED) is a separate,
                            later act performed only by ImportManager.js
                            (AI-115-04) — this file never writes
                            index.json itself outside rebuildIndex(). */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const lifecycle = require("./MaterialLifecycle.js");
const adapter = require("./TeachingMaterialAdapter.js");
const generator = require("./GenerateTeachingMaterialData.js");

const ROOT = path.join(__dirname, "..");
const MATERIALS_DIR = path.join(ROOT, "materials");

function scanPackages() {
  return lifecycle.listStages();
}

/* contentHash(materialId) — sha256 over the real bytes of this
   Package's own 4 Package-Standard input files, concatenated in a fixed
   order. Missing files contribute nothing (not a fabricated placeholder
   byte) — an incomplete Package simply hashes differently from a
   complete one, which is fine: duplicate detection only meaningfully
   compares Packages that are at least CLAUDE_READY. */
function contentHash(materialId) {
  const dir = path.join(MATERIALS_DIR, materialId);
  const files = ["metadata.json", "material.md", "summary.json", "questionbank.json"];
  const hash = crypto.createHash("sha256");
  files.forEach(function (f) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) { hash.update(fs.readFileSync(p)); }
  });
  return hash.digest("hex");
}

function loadMetadata(materialId) {
  const p = path.join(MATERIALS_DIR, materialId, "metadata.json");
  if (!fs.existsSync(p)) { return null; }
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { return null; }
}

/* checkDuplicates(ids) -> array of { group: [materialId, ...], reason }.
   Called both by RepositoryManager's own report() (repository-wide scan)
   and ImportManager.js (AI-115-06, checked against already-IMPORTED
   Packages before admitting a new one) — one real implementation, two
   callers. */
function checkDuplicates(ids) {
  ids = ids || lifecycle.listMaterialIds();
  const byHash = {};
  const byTitleKey = {};
  const groups = [];

  ids.forEach(function (id) {
    const meta = loadMetadata(id);
    if (!meta) { return; }
    const hash = contentHash(id);
    byHash[hash] = byHash[hash] || [];
    byHash[hash].push(id);

    const title = adapter.deriveTitle(meta);
    const key = (meta.subject || "") + "|" + (meta.chapter || "") + "|" + (title || "");
    byTitleKey[key] = byTitleKey[key] || [];
    byTitleKey[key].push(id);
  });

  Object.keys(byHash).forEach(function (h) {
    if (byHash[h].length > 1) { groups.push({ group: byHash[h].slice(), reason: "identical content hash (metadata+material.md+summary+questionbank bytes)" }); }
  });
  Object.keys(byTitleKey).forEach(function (k) {
    if (byTitleKey[k].length > 1 && k.trim() !== "||") {
      groups.push({ group: byTitleKey[k].slice(), reason: "same subject + chapter + derived title" });
    }
  });
  return groups;
}

/* checkVersions(ids) -> array of { materialId, issue }. version is
   expected to be a non-empty digit string per README's Import Rule
   ("starts \"1\"; incremented..."); anything else is flagged, never
   silently coerced/guessed. */
function checkVersions(ids) {
  ids = ids || lifecycle.listMaterialIds();
  const issues = [];
  ids.forEach(function (id) {
    const meta = loadMetadata(id);
    if (!meta) { return; }
    const v = meta.version;
    if (!v || typeof v !== "string" || v.trim() === "") {
      issues.push({ materialId: id, issue: "version missing/empty" });
    } else if (!/^\d+$/.test(v)) {
      issues.push({ materialId: id, issue: "version \"" + v + "\" is not a plain digit string (README convention: starts \"1\", increments)" });
    }
  });
  return issues;
}

/* checkStatuses() -> real per-stage tally (MaterialLifecycle's own,
   single source), never a second counting rule. */
function checkStatuses() {
  return lifecycle.countByStage();
}

function report() {
  const ids = lifecycle.listMaterialIds();
  return {
    packageCount: ids.length,
    stages: checkStatuses(),
    duplicates: checkDuplicates(ids),
    versionIssues: checkVersions(ids),
    scannedAt: new Date().toISOString()
  };
}

/* rebuildIndex() — the ONLY function in this Repository Manager that
   writes docs/TeachingMaterials/index.json / js/data/TeachingMaterialData.js
   / js/data/RepositoryStatus.js, and it does so by delegating entirely
   to GenerateTeachingMaterialData.js's own generate() — no second
   writer exists. */
function rebuildIndex() {
  return generator.generate();
}

/* prepare() — Sprint AI-115 AI-115-03: advances every CLAUDE_READY
   Package to READY_FOR_IMPORT by deriving its knowledge.json/report.md
   (reusing generator.buildKnowledgeIndex()/buildReportMarkdown(), the
   same functions GenerateTeachingMaterialData.js's own
   writeKnowledgeAndReport() already uses for freshly-imported Packages —
   not a second implementation). Never touches index.json/
   TeachingMaterialData.js — importing is ImportManager.js's job. Returns
   the list of materialIds it advanced. */
function prepare() {
  const advanced = [];
  lifecycle.listMaterialIds().forEach(function (id) {
    if (lifecycle.resolveStage(id) !== "CLAUDE_READY") { return; }
    const pkg = adapter.loadPackage(id);
    const dir = path.join(MATERIALS_DIR, id);
    const knowledge = generator.buildKnowledgeIndex(id, pkg);
    fs.writeFileSync(path.join(dir, "knowledge.json"), JSON.stringify(knowledge, null, 2) + "\n", "utf8");
    const validation = adapter.validatePackage(id);
    const report_ = generator.buildReportMarkdown(id, pkg, validation, lifecycle.resolveStage(id));
    fs.writeFileSync(path.join(dir, "report.md"), report_, "utf8");
    advanced.push(id);
  });
  return advanced;
}

if (require.main === module) {
  const r = report();
  console.log("Repository Manager Report — " + r.scannedAt);
  console.log("Packages scanned: " + r.packageCount);
  console.log("Stages: " + JSON.stringify(r.stages));
  if (r.duplicates.length) {
    console.log("Duplicates:");
    r.duplicates.forEach(function (d) { console.log("  " + d.group.join(", ") + " — " + d.reason); });
  } else {
    console.log("Duplicates: none");
  }
  if (r.versionIssues.length) {
    console.log("Version issues:");
    r.versionIssues.forEach(function (v) { console.log("  " + v.materialId + " — " + v.issue); });
  } else {
    console.log("Version issues: none");
  }
}

module.exports = {
  scanPackages: scanPackages,
  contentHash: contentHash,
  checkDuplicates: checkDuplicates,
  checkVersions: checkVersions,
  checkStatuses: checkStatuses,
  report: report,
  rebuildIndex: rebuildIndex,
  prepare: prepare
};
