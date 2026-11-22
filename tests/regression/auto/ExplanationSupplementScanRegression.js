/* tests/regression/auto/ExplanationSupplementScanRegression.js - 2026-11-22 AHS-UP2 P2-4.

   GenerateExplanationSupplement.scanUploadedSources picks up the
   explanations/tm_N.json files written by the upload flow:
   - only files that have no hand-written build module (not in coveredIds);
   - only materials that are already published (isPublished), never drafts;
   - broken files are reported as errors instead of crashing the generator;
   - the repository as it is today still generates the same data.

   Run: node tests/regression/auto/ExplanationSupplementScanRegression.js */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO = path.join(__dirname, "..", "..", "..");
const gen = require(path.join(REPO, "docs/TeachingMaterials/scripts/GenerateExplanationSupplement.js"));
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

console.log("ExplanationSupplementScan Regression - P2-4");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ahs-scan-"));
const put = (name, body) => fs.writeFileSync(path.join(dir, name), typeof body === "string" ? body : JSON.stringify(body));
const entry = (id) => ({ questionId: id, concept: "c", steps: ["a", "b"] });
put("tm_9001.json", { materialId: "tm_9001", entries: [entry("tm_9001_q1"), entry("tm_9001_q2")] });
put("tm_9002.json", { materialId: "tm_9002", entries: [entry("tm_9002_q1")] });
put("tm_7.json", { materialId: "tm_7", entries: [entry("tm_7_q1")] });
put("tm_9003.json", { materialId: "tm_9999", entries: [] });
put("tm_9004.json", "{ not json");
put("tm_9005.json", { materialId: "tm_9005", entries: "x" });
put("tm_9006.json", { materialId: "tm_9006", entries: [null] });
put("notes.txt", "x");
put("tm_x.json", "{}");
const published = new Set(["tm_9001", "tm_7", "tm_9003", "tm_9004", "tm_9005", "tm_9006"]);

console.log("\n[1] scan");
{
  const r = gen.scanUploadedSources(dir, new Set(["tm_7"]), (id) => published.has(id));
  check("only published uploads without a build module are picked up (tm_9001)", r.sources.length === 1 && r.sources[0].materialId === "tm_9001");
  check("the two questions of tm_9001 come through unchanged", r.sources[0].items.length === 2 && r.sources[0].items[1].questionId === "tm_9001_q2");
  check("a draft (tm_9002) is neither picked up nor reported", !r.sources.some((s) => s.materialId === "tm_9002") && !r.errors.some((e) => /tm_9002/.test(e)));
  check("tm_7 (has a build module) is not picked up twice", !r.sources.some((s) => s.materialId === "tm_7"));
  check("each of the four broken files reports one error", r.errors.length === 4 && [9003, 9004, 9005, 9006].every((n) => r.errors.some((e) => e.indexOf("tm_" + n + ".json") === 0)));
  check("file names that are not tm_N.json are ignored", !r.errors.some((e) => /notes|tm_x/.test(e)));
}

console.log("\n[2] the current repo is unaffected");
{
  const r = gen.generate({ check: true });
  check("generated data is still up to date, at least 516 questions", r.stale.length === 0 && r.count >= 516);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
