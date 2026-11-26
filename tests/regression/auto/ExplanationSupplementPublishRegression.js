/* tests/regression/auto/ExplanationSupplementPublishRegression.js - 2026-11-22 AHS-UP2 P2-4.

   Publishing an uploaded teaching material regenerates
   js/data/ExplanationSupplementData.js so students can see its worked-solution supplement:
   - the generated data holds the published material's supplement entries;
   - the data file is listed in changedPaths (so the auto PR carries it);
   - a draft that is not published yet never leaks into the data;
   - if regeneration fails the publish still succeeds, with a warning;
   - a material without any supplement leaves the data alone.

   Everything runs on a throw-away copy of the platform, never the real files.
   Run: node tests/regression/auto/ExplanationSupplementPublishRegression.js */
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
const WITHOUT = ["# T", "## ⑪常考題型", q(1, "題目甲 tanθ = ？", "單行舊格式詳解。")].join("\n\n");

function setup() {
  const platform = createPlatformCopy();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ahs-pub-"));
  return { platform, builder: createPackageBuilder({ platformRoot: platform, dataDir }) };
}
function draftOf(builder, markdown) {
  return builder.createDraft({ finalFilename: "f_Final.md", finalMarkdown: markdown, metadata: META });
}
function loadData(platform) {
  const file = path.join(platform, DATA_REL);
  if (!fs.existsSync(file)) { return null; }
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox.window);
  return sandbox.window.AHS.ExplanationSupplementData;
}

console.log("ExplanationSupplementPublish Regression - P2-4");

console.log("\n[1] publishing generates the student-facing data");
{
  const { platform, builder } = setup();
  const draft = draftOf(builder, WITH);
  const id = draft.materialId;
  const baseline = require(path.join(platform, "docs", "TeachingMaterials", "scripts", "GenerateExplanationSupplement.js")).generate({ check: true }).count;
  check("no data file before publishing", loadData(platform) === null);
  const result = builder.publish(id);
  const data = loadData(platform);
  check("data holds this material's supplement (concept and steps)", !!data && !!data[id + "_q1"] && data[id + "_q1"].concept === "由 sinθ 補鄰邊。" && data[id + "_q1"].steps.length === 2);
  check("all other entries stay the same, this material adds exactly 1", !!data && Object.keys(data).filter((k) => k.indexOf(id + "_") === 0).length === 1 && Object.keys(data).filter((k) => k.indexOf(id + "_") !== 0).length === baseline);
  check("question 2 without a supplement is not generated", !!data && !data[id + "_q2"]);
  check("changedPaths lists the supplement file and the data file", result.changedPaths.indexOf("docs/TeachingMaterials/explanations/" + id + ".json") !== -1 && result.changedPaths.indexOf(DATA_REL) !== -1);
  check("no warning", !result.supplementWarning);
}

console.log("\n[2] drafts that are not published stay out");
{
  const { platform, builder } = setup();
  const first = draftOf(builder, WITH);
  const other = draftOf(builder, WITH);
  builder.publish(first.materialId);
  const data = loadData(platform);
  check("the published material has its supplement", !!data && !!data[first.materialId + "_q1"]);
  check("another draft's supplement is not in the data", !!data && !data[other.materialId + "_q1"]);
}

console.log("\n[3] a generation failure only warns");
{
  const { platform, builder } = setup();
  const draft = draftOf(builder, WITH);
  const id = draft.materialId;
  const file = path.join(platform, "docs/TeachingMaterials/explanations/" + id + ".json");
  const broken = JSON.parse(fs.readFileSync(file, "utf8"));
  broken.entries[0].questionId = id + "_q99";
  fs.writeFileSync(file, JSON.stringify(broken));
  const result = builder.publish(id);
  check("the material is still published", result.status === "published");
  check("a warning reports the failed generation", /詳解補強資料產生失敗/.test(result.supplementWarning || ""));
  check("changedPaths does not list the data file", result.changedPaths.indexOf(DATA_REL) === -1);
}

console.log("\n[4] a material without supplement leaves the data alone");
{
  const { platform, builder } = setup();
  const draft = draftOf(builder, WITHOUT);
  const result = builder.publish(draft.materialId);
  check("no data file is generated", loadData(platform) === null);
  check("changedPaths lists neither the data file nor a supplement file", result.changedPaths.indexOf(DATA_REL) === -1 && !result.changedPaths.some((p) => /explanations\//.test(p)));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
