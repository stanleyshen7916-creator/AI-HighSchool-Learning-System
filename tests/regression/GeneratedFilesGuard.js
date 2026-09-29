/* tests/regression/GeneratedFilesGuard.js — shared by the pipeline
   regressions that drive the real Repository generator
   (MaterialPipelineRegression.js, RepositoryFoundation.js).

   Those suites add a temporary Package, import it, then remove it and
   regenerate. The regenerated content matches the committed content, but
   the generatedAt/updatedAt timestamps don't — so every `npm test` used to
   leave index.json, TeachingMaterialData.js, RepositoryStatus.js and every
   Package's knowledge.json/report.md dirty in git. guard() snapshots the
   exact bytes of every generated file up front and restores them when the
   process exits, so a test run never modifies the real, already-imported
   teaching materials on disk.

   Usage (first thing after the requires): require("./GeneratedFilesGuard.js").guard(); */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
const TM_ROOT = path.join(REPO, "docs", "TeachingMaterials");

function generatedFiles() {
  const files = [
    path.join(TM_ROOT, "index.json"),
    path.join(TM_ROOT, "import-log.json"),
    path.join(REPO, "js", "data", "TeachingMaterialData.js"),
    path.join(REPO, "js", "data", "RepositoryStatus.js")
  ];
  const materialsDir = path.join(TM_ROOT, "materials");
  fs.readdirSync(materialsDir, { withFileTypes: true }).forEach(function (entry) {
    if (!entry.isDirectory()) { return; }
    files.push(path.join(materialsDir, entry.name, "knowledge.json"));
    files.push(path.join(materialsDir, entry.name, "report.md"));
  });
  return files;
}

function guard() {
  const snapshot = generatedFiles().map(function (file) {
    return { file: file, bytes: fs.existsSync(file) ? fs.readFileSync(file) : null };
  });
  process.on("exit", function () {
    snapshot.forEach(function (s) {
      if (s.bytes === null) {
        fs.rmSync(s.file, { force: true });
      } else if (!fs.existsSync(s.file) || !fs.readFileSync(s.file).equals(s.bytes)) {
        fs.mkdirSync(path.dirname(s.file), { recursive: true });
        fs.writeFileSync(s.file, s.bytes);
      }
    });
  });
}

module.exports = { guard: guard, generatedFiles: generatedFiles };
