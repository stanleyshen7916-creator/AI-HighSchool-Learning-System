/* tests/regression/auto/run.js - 2026-11-22 (PLAT / M2 pilot).

   Auto-discovery runner. Runs every *.js file in this folder (except this one), sorted by file
   name, each as its own `node` process. Any failure makes this runner exit non-zero.

   Why it exists: VAB tasks add their acceptance tests here instead of editing the very long
   scripts.test line in package.json. A task therefore never has to touch package.json.

   Run: node tests/regression/auto/run.js */
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DIR = __dirname;
const SELF = path.basename(__filename);
const files = fs.readdirSync(DIR)
  .filter((f) => /\.js$/.test(f) && f !== SELF)
  .sort();

console.log("Auto-discovered regression tests: " + files.length);
const failed = [];
files.forEach((f) => {
  console.log("\n--- " + f);
  const r = spawnSync(process.execPath, [path.join(DIR, f)], { stdio: "inherit" });
  if (r.status !== 0) { failed.push(f); }
});

if (failed.length) {
  console.log("\nAuto-discovered tests FAILED: " + failed.join(", "));
  process.exit(1);
}
console.log("\nAuto-discovered tests: all " + files.length + " passed");
