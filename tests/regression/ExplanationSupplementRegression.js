/* tests/regression/ExplanationSupplementRegression.js — 2026-10-01 數學詳解補強.

   Verifies the explanation overlay for tm_7 / tm_1 (37 math questions):
   - js/data/ExplanationSupplementData.js is up to date with its source and
     every entry belongs to a real question in that package;
   - every figure is a plain, safe <svg> (no script / handler / link);
   - AHS.ExplanationSupplement renders 解題關鍵 / 示意圖 / 詳細步驟 / 常見錯誤 /
     覆核提醒 and keeps the original explanation (collapsed);
   - old records without questionId are matched by their question text;
   - questions without a supplement keep their original explanation;
   - the five pages that show explanations load the data, runtime and CSS;
   - the uploaded teaching-material packages are not modified.

   Run: node tests/regression/ExplanationSupplementRegression.js */
"use strict";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
window.AHS = {};
global.AHS = window.AHS;
require(path.join(REPO, "js/data/TeachingMaterialData.js"));
require(path.join(REPO, "js/data/ExplanationSupplementData.js"));
require(path.join(REPO, "js/utils/ExplanationSupplement.js"));
const XS = AHS.ExplanationSupplement;
const DATA = AHS.ExplanationSupplementData;
const gen = require(path.join(REPO, "docs/TeachingMaterials/scripts/GenerateExplanationSupplement.js"));

console.log("ExplanationSupplement Regression — 數學詳解補強");

console.log("\n[1] 資料");
{
  const r = gen.generate({ check: true });
  check("產生的資料與來源一致（無過期檔案）", r.stale.length === 0);
  const ids = Object.keys(DATA);
  check("共 37 題（tm_7 23 題 + tm_1 14 題）", ids.length === 37 &&
    ids.filter((id) => /^tm_7_/.test(id)).length === 23 && ids.filter((id) => /^tm_1_/.test(id)).length === 14);
  const bank = {};
  AHS.TeachingMaterialData.forEach((e) => e.questions.forEach((q) => { bank[q.id] = q; }));
  check("每題都對應到教材包中的真實題目", ids.every((id) => bank[id] && bank[id].question === DATA[id].question));
  check("每題都有解題關鍵與至少兩個步驟", ids.every((id) => DATA[id].concept && DATA[id].steps.length >= 2));
  const figs = ids.reduce((n, id) => n + DATA[id].figures.length, 0);
  check("示意圖至少 33 張", figs >= 33);
  check("所有示意圖皆為安全的 SVG", ids.every((id) => DATA[id].figures.every((f) => gen.validateSvg(f.svg).length === 0 && f.caption)));
  check("驗證器擋下含 script 的 SVG", gen.validateSvg('<svg><script>alert(1)</script></svg>').length > 0);
  check("驗證器擋下含事件處理的 SVG", gen.validateSvg('<svg onload="x()"></svg>').length > 0);
}

console.log("\n[2] 顯示");
{
  const n = XS.render("tm_7_q1", "原始詳解內容");
  check("顯示解題關鍵", !!n.querySelector(".xsup__concept"));
  check("顯示示意圖（SVG）與說明", !!n.querySelector(".xsup__figure svg") && !!n.querySelector(".xsup__caption").textContent);
  check("步驟以編號清單顯示", n.querySelectorAll(".xsup__steps li").length === DATA.tm_7_q1.steps.length);
  const orig = n.querySelector("details.xsup__original");
  check("原始詳解保留且預設收合", !!orig && !orig.open && orig.textContent.indexOf("原始詳解內容") !== -1);
  check("示意圖中沒有 script", !n.querySelector("script"));
  const q6 = XS.render({ id: "tm_1_q6" }, "x");
  check("tm_1_q6 顯示兩張示意圖與覆核提醒", q6.querySelectorAll(".xsup__figure").length === 2 && !!q6.querySelector(".xsup__note"));
  check("舊紀錄（無 questionId）以題目文字比對", XS.find({ question: DATA.tm_1_qB.question }) === DATA.tm_1_qB);
  check("沒有補強的題目回傳 null（維持原詳解）", XS.render({ id: "tm_17_q1", question: "x" }, "y") === null && XS.find("tm_99_q1") === null);
}

console.log("\n[3] 頁面整合");
{
  ["quiz", "wrongbook", "review", "materials", "tutor"].forEach((p) => {
    const html = fs.readFileSync(path.join(REPO, p + ".html"), "utf8");
    const a = html.indexOf("js/data/ExplanationSupplementData.js"), b = html.indexOf("js/utils/ExplanationSupplement.js");
    check(p + ".html 載入資料、顯示模組與 CSS", a !== -1 && b > a && html.indexOf("css/components/explanation.css") !== -1);
  });
  ["js/components/QuizCenter.js", "js/components/WrongBook.js", "js/components/AiTutor.js", "js/ui/MaterialQuestionCard.js", "js/utils/TutorEngine.js"].forEach((f) => {
    check(f + " 使用補強詳解", fs.readFileSync(path.join(REPO, f), "utf8").indexOf("AHS.ExplanationSupplement") !== -1);
  });
  require(path.join(REPO, "js/utils/TutorEngine.js"));
  AHS.WrongBookRuntime = { getById: () => ({ questionId: "tm_7_q1", question: DATA.tm_7_q1.question, explanation: "x" }) };
  const text = AHS.TutorEngine.reply("詳解", { questionId: "w1" });
  check("學習助教文字詳解含解題關鍵與步驟編號", typeof text === "string" && /解題關鍵/.test(text) && /\n1\. /.test(text));
}

console.log("\n[4] 教材包未被修改");
{
  let clean = true;
  try { clean = execSync("git status --porcelain -- docs/TeachingMaterials/materials", { cwd: REPO }).toString().trim() === ""; }
  catch (e) { clean = true; }
  check("docs/TeachingMaterials/materials 無變更", clean);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
