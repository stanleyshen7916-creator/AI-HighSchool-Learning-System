/* tests/regression/SplitDataHarness.js — queue 9.4 T7 (2026-11-27). Shared by the jsdom page loaders.

   Pages load js/data/TeachingMaterialIndex.js / js/data/ExplanationSupplementIndex.js and fetch each material's content
   with a dynamic <script> (TeachingMaterialContentLoader), which jsdom with runScripts "outside-only" never runs. Call
   this right after evaluating each page script: when that script was one of the two index files, every split file
   behind it is evaluated too — the same data the old whole TeachingMaterialData.js / ExplanationSupplementData.js
   gave — so a page initializes synchronously exactly as before.

   Usage: window.eval(code); require("./SplitDataHarness.js")(window, pathOrSrc); */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
const SPLIT = {
  "js/data/TeachingMaterialIndex.js": "js/data/materials-content",
  "js/data/ExplanationSupplementIndex.js": "js/data/explanations-content"
};

module.exports = function evalSplitData(win, file) {
  const rel = path.relative(REPO, path.resolve(REPO, String(file))).split(path.sep).join("/");
  const dir = SPLIT[rel];
  if (!dir) { return; }
  fs.readdirSync(path.join(REPO, dir)).filter((n) => /^tm_\d+\.js$/.test(n)).sort()
    .forEach((n) => win.eval(fs.readFileSync(path.join(REPO, dir, n), "utf8")));
};
