/* docs/TeachingMaterials/scripts/MaterialLifecycle.js — Sprint AI-113
   AI-806, re-defined to Sprint AI-115 AI-115-01's exact 6-stage list.

   Real, deterministic lifecycle for a Package, computed purely from
   files that already exist on disk plus the already-generated
   index.json — nothing here is a stored field a human keeps in sync by
   hand, and nothing is inferred/guessed. resolveStage() is a pure
   function returning exactly ONE of STAGES — by construction (a single
   if/else chain, never two conditions both able to hold), a Package can
   never appear to be "in" two lifecycle stages at once, which is what
   AI-115-01's "所有教材必須只有一個生命週期。不得：同時存在多個生命週期"
   actually requires: not a rule to enforce elsewhere, but a property
   this resolver's own shape guarantees.

   RAW              — Package folder exists, metadata.json missing.
   ANALYZING        — metadata.json exists, but manifest.json is
                       missing/status="draft" (Claude still analyzing),
                       OR summary.json / questionbank.json / material.md
                       are missing, OR manifest.status is neither
                       "complete" nor "pending_review" (defensive; the
                       schema enum should prevent this).
   CLAUDE_READY      — manifest.status is "complete" or "pending_review"
                       (per the OCR Rule, "pending_review" already means
                       Claude's own analysis pass is done, only human
                       review of a low-confidence OCR question remains —
                       still real analysis completion, not "still
                       analyzing") and every Package Standard input file
                       (AI-115-02) is present, but knowledge.json/
                       report.md have not been derived yet.
   READY_FOR_IMPORT  — knowledge.json/report.md exist (derived by
                       RepositoryManager.prepare(), Sprint AI-115
                       AI-115-03 — validated, ready), but this Package is
                       not yet in the generated root index.json.
   IMPORTED          — present in the current docs/TeachingMaterials/
                       index.json (i.e. ImportManager.js's importAll()
                       has included it — js/data/TeachingMaterialData.js
                       carries the same real data). Whether it is also
                       genuinely bridged into the live browser Runtime
                       (AHS.MaterialRuntime via
                       js/runtime/TeachingMaterialLoader.js) can only be
                       observed in a browser — tests/regression/
                       RepositoryFoundation.js's own checks are that
                       confirmation; this function honestly reports
                       IMPORTED as its own maximum for offline/Node
                       tooling and never fabricates a further state it
                       can't verify.
   ARCHIVED          — manifest.json's own `archived: true` flag is set
                       (Sprint AI-115 addition to Manifest.schema.json).
                       The only real, explicit signal used — never
                       inferred from age or usage. Checked after
                       confirming the Package reached at least
                       CLAUDE_READY, since archiving an incomplete
                       analysis has no real meaning. ImportManager.js
                       never imports/re-imports an ARCHIVED Package;
                       GenerateTeachingMaterialData.js excludes it from
                       js/data/TeachingMaterialData.js / index.json even
                       if it was previously IMPORTED. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MATERIALS_DIR = path.join(ROOT, "materials");
const INDEX_FILE = path.join(ROOT, "index.json");

const STAGES = [
  "RAW",
  "ANALYZING",
  "CLAUDE_READY",
  "READY_FOR_IMPORT",
  "IMPORTED",
  "ARCHIVED"
];

function loadJson(p) {
  if (!fs.existsSync(p)) { return null; }
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { return null; }
}

function isIndexed(materialId) {
  const index = loadJson(INDEX_FILE);
  if (!index || !Array.isArray(index.materials)) { return false; }
  return index.materials.some(function (m) { return m.materialId === materialId; });
}

/* resolveStage(materialId) — one of STAGES, or null if the Package
   folder itself doesn't exist. */
function resolveStage(materialId) {
  const dir = path.join(MATERIALS_DIR, materialId);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) { return null; }

  const has = function (f) { return fs.existsSync(path.join(dir, f)); };
  if (!has("metadata.json")) { return "RAW"; }

  const manifest = loadJson(path.join(dir, "manifest.json"));
  if (!manifest || manifest.status === "draft") { return "ANALYZING"; }
  if (!has("summary.json") || !has("questionbank.json") || !has("material.md")) { return "ANALYZING"; }
  if (manifest.status !== "complete" && manifest.status !== "pending_review") { return "ANALYZING"; }

  if (manifest.archived === true) { return "ARCHIVED"; }

  if (isIndexed(materialId)) { return "IMPORTED"; }
  if (!has("knowledge.json") || !has("report.md")) { return "CLAUDE_READY"; }
  return "READY_FOR_IMPORT";
}

function listMaterialIds() {
  if (!fs.existsSync(MATERIALS_DIR)) { return []; }
  return fs.readdirSync(MATERIALS_DIR, { withFileTypes: true })
    .filter(function (e) { return e.isDirectory(); })
    .map(function (e) { return e.name; })
    .filter(function (name) { return /^tm_\d+$/.test(name); })
    .sort();
}

function listStages() {
  return listMaterialIds().map(function (id) { return { materialId: id, stage: resolveStage(id) }; });
}

/* countByStage() — Sprint AI-115 AI-115-07 (Repository Dashboard): real
   tally used by both the CLI output below and
   GenerateTeachingMaterialData.js's writeRepositoryStatus(). */
function countByStage() {
  const counts = {};
  STAGES.forEach(function (s) { counts[s] = 0; });
  listStages().forEach(function (s) { if (s.stage && counts[s.stage] !== undefined) { counts[s.stage] += 1; } });
  return counts;
}

if (require.main === module) {
  const target = process.argv[2];
  if (target) {
    console.log(target + ": " + resolveStage(target));
  } else {
    listStages().forEach(function (s) { console.log(s.materialId + ": " + s.stage); });
  }
}

module.exports = {
  resolveStage: resolveStage,
  listStages: listStages,
  listMaterialIds: listMaterialIds,
  countByStage: countByStage,
  STAGES: STAGES
};
