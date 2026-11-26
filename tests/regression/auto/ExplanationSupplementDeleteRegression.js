/* tests/regression/auto/ExplanationSupplementDeleteRegression.js - 2026-11-22 AHS-UP2 P2-4.

   Deleting a published uploaded teaching material also removes its worked-solution supplement
   from js/data/ExplanationSupplementData.js, and the data file is listed in
   changedPaths so the auto PR carries the removal. Deleting a draft, or a
   material that never had a supplement, leaves the data alone.

   Everything runs on a throw-away copy of the platform, never the real files.
   Run: node tests/regression/auto/ExplanationSupplementDeleteRegression.js */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");

const COUNCIL = path.join(__dirname, "..", "..", "..", "ai-engine", "council");
const { createPlatformCopy } = require(path.join(COUNCIL, "tests", "platformFixture.js"));
const { createPackageBuilder } = require(path.join(COUNCIL, "platform", "PackageBuilder.js"));
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const DATA_REL = "js/data/ExplanationSupplementData.js";
const META = { school: "cjsh", semester: "g2s1", subject: "數學", grade: "高二", chapter: "Acceptance Test Chapter", unit: "Acceptance Test Unit", materialType: "TEXTBOOK" };
const q = (n, stem, explanation) => "**Q" + n + ".** " + stem + "\n(A) 3/4　(B) 4/3　(C) 3/5　(D) 4/5\n答案：A\n詳解：" + explanation;
const FULL = "\n解題關鍵：由 sinθ 補鄰邊。\n步驟：\n(1) 設對邊 3、斜邊 5。\n(2) 鄰邊 = 4。\n易錯：把對邊鄰邊弄反。";
const WITH = ["# T", "## ⑪常考題型", q(1, "題目甲 tanθ = ？", FULL), q(2, "題目乙 tanθ = ？", "單行舊格式詳解。")].join("\n\n");

function setup() {
  const platform = createPlatformCopy();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ahs-del-"));
  return { platform, builder: createPackageBuilder({ platformRoot: platform, dataDir }) };
}
function draftOf(builder) {
  return builder.createDraft({ finalFilename: "f_Final.md", finalMarkdown: WITH, metadata: META });
}
function loadData(platform) {
  const file = path.join(platform, DATA_REL);
  if (!fs.existsSync(file)) { return null; }
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox.window);
  return sandbox.window.AHS.ExplanationSupplementData;
}

console.log("ExplanationSupplementDelete Regression - P2-4");

console.log("\n[1] deleting a published upload");
{
  const { platform, builder } = setup();
  const id = draftOf(builder).materialId;
  builder.publish(id);
  check("after publishing, the data has this material's supplement", !!loadData(platform) && !!loadData(platform)[id + "_q1"]);
  const others = Object.keys(loadData(platform) || {}).filter((k) => k.indexOf(id + "_") !== 0).length;
  const result = builder.deletePublished(id);
  const data = loadData(platform);
  check("after deleting, its supplement is gone from the data", !!data && Object.keys(data).filter((k) => k.indexOf(id + "_") === 0).length === 0);
  check("other supplements are untouched (same count as before the delete)", !!data && Object.keys(data).length === others);
  check("the supplement file is deleted", !fs.existsSync(path.join(platform, "docs/TeachingMaterials/explanations/" + id + ".json")));
  check("changedPaths lists the supplement file and the data file", result.changedPaths.indexOf("docs/TeachingMaterials/explanations/" + id + ".json") !== -1 && result.changedPaths.indexOf(DATA_REL) !== -1);
  check("no warning", !result.supplementWarning);
}

console.log("\n[2] materials and drafts without a supplement leave the data alone");
{
  const { platform, builder } = setup();
  const result = builder.deletePublished("tm_10");
  check("deleting a material without an uploaded supplement: changedPaths has no data file", result.changedPaths.indexOf(DATA_REL) === -1);
  const draftId = draftOf(builder).materialId;
  builder.deleteDraft(draftId);
  check("deleting a draft: no data file is generated", loadData(platform) === null);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
