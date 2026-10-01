/* tests/regression/ValidatorOutputRegression.js — 2026-10-01.

   TeachingMaterialAdapter.validatePackage() runs ValidateMaterial.js as a
   child process and reads its PASS/FAIL summary through a pipe. The
   validator used to end with process.exit(), which on Linux can drop
   unflushed pipe output: CI intermittently regenerated tm_4/report.md as
   "Validation：0 PASS / 0 FAIL" (the engine tests then saw an existing
   package change). Every package's summary must come through, every time.

   Run: node tests/regression/ValidatorOutputRegression.js */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const adapter = require(path.join(REPO, "docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js"));
const source = fs.readFileSync(path.join(REPO, "docs/TeachingMaterials/scripts/ValidateMaterial.js"), "utf8");

console.log("ValidatorOutput Regression — 驗證結果完整傳回");
check("ValidateMaterial.js 結尾不用 process.exit()（改用 exitCode）", !/process\.exit\(fail/.test(source) && /process\.exitCode = fail === 0/.test(source));

/* tm_4 has the longest output; run it several times through the pipe */
const runs = [1, 2, 3, 4, 5].map(() => adapter.validatePackage("tm_4"));
check("tm_4 驗證 5 次都完整取得 PASS 數", runs.every((r) => r.valid && r.pass > 300 && r.fail === 0));
check("5 次結果一致", new Set(runs.map((r) => r.pass)).size === 1);
const bad = adapter.validatePackage("tm_999");
check("不存在的教材仍回報失敗（exitCode 1）", bad.valid === false);
const report = fs.readFileSync(path.join(REPO, "docs/TeachingMaterials/materials/tm_4/report.md"), "utf8");
check("tm_4/report.md 記錄的是真實 PASS 數", report.indexOf("Validation：" + runs[0].pass + " PASS / 0 FAIL") !== -1);

console.log("\nValidatorOutputRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
