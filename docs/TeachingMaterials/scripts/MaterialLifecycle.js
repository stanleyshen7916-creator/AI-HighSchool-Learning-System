/* docs/TeachingMaterials/scripts/MaterialLifecycle.js — Sprint AI-113
   AI-806 (Platform Hardening — Teaching Material Pipeline).

   Real, deterministic 6-stage lifecycle for a Package, computed purely
   from files that already exist on disk plus the already-generated
   index.json — nothing here is a new stored field a human has to keep
   in sync by hand, and nothing is inferred/guessed. This is what lets
   "平台可以直接辨識教材目前狀態" (AI-806's own wording) be true: any
   tool in this Repository's offline pipeline (ValidateMaterial.js,
   GenerateTeachingMaterialData.js, or a human) can call resolveStage()
   and get the real, current answer.

   RAW               — Package folder exists, metadata.json missing.
   WAITING_ANALYSIS  — metadata.json exists, but summary.json/
                       questions.json are missing, OR manifest.json is
                       missing/status != "complete" (per Manifest.
                       schema.json's own description: "draft" = Claude
                       still analyzing, "pending_review" = analysis
                       produced but at least one question still needs
                       human review before this is the official
                       Repository entry — both real reasons a Package
                       isn't ready yet, not two different stages this
                       Sprint's 6-state list asks for).
   CLAUDE_READY      — manifest.status === "complete": Claude's analysis
                       is done and internally consistent, but this
                       Package is not (yet, as of the moment this is
                       checked) reflected in the generated index.json.
   WAITING_IMPORT    — same as CLAUDE_READY in this implementation:
                       "ready but not yet in the generated output" IS
                       what Waiting Import means for an offline,
                       run-on-demand generator (there is no background
                       queue to be separately "waiting" in) — reported
                       as CLAUDE_READY_WAITING_IMPORT so both real facts
                       stay visible instead of picking one arbitrarily.
   RUNTIME_READY     — present in the current docs/TeachingMaterials/
                       index.json (i.e. GenerateTeachingMaterialData.js
                       has included it — js/data/TeachingMaterialData.js
                       carries the same real data).
   COMPLETED         — NOT decidable from Node/offline tooling: whether
                       a Package is actually bridged into the live
                       browser Runtime (AHS.MaterialRuntime via
                       js/runtime/TeachingMaterialLoader.js) can only be
                       observed in a browser — tests/regression/
                       RepositoryFoundation.js's own [1]/[3-5] checks
                       are that confirmation. This function honestly
                       reports RUNTIME_READY as its own maximum and
                       never fabricates a COMPLETED it can't verify. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MATERIALS_DIR = path.join(ROOT, "materials");
const INDEX_FILE = path.join(ROOT, "index.json");

const STAGES = [
  "RAW",
  "WAITING_ANALYSIS",
  "CLAUDE_READY_WAITING_IMPORT",
  "RUNTIME_READY"
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
  if (!has("summary.json") || !has("questions.json")) { return "WAITING_ANALYSIS"; }

  const manifest = loadJson(path.join(dir, "manifest.json"));
  if (!manifest || manifest.status !== "complete") { return "WAITING_ANALYSIS"; }

  if (isIndexed(materialId)) { return "RUNTIME_READY"; }
  return "CLAUDE_READY_WAITING_IMPORT";
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

if (require.main === module) {
  const target = process.argv[2];
  if (target) {
    console.log(target + ": " + resolveStage(target));
  } else {
    listStages().forEach(function (s) { console.log(s.materialId + ": " + s.stage); });
  }
}

module.exports = { resolveStage: resolveStage, listStages: listStages, listMaterialIds: listMaterialIds, STAGES: STAGES };
