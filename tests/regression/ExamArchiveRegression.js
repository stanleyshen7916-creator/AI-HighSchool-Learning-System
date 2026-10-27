/* tests/regression/ExamArchiveRegression.js — 2026-10-27 月考資料.

   - js/data/ExamArchive*.js: every question has an answer, a basis
     (確認／推論), an explanation and a lessonRef that resolves to a real
     圖解教材 card or a declared gap; passageRefs exist; numbers are unique;
     every figure file exists; no student-identifying text is published;
   - exam-archive.html loads the data files after ExamArchiveData.js and
     before the component;
   - AHS.ExamArchive renders one tab per subject, passages once, and keeps
     the explanation collapsed.

   Run: node tests/regression/ExamArchiveRegression.js */
"use strict";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
const FILES = ["Chinese", "English", "Math", "Chemistry", "Biology", "EarthScience"].map((n) => "js/data/ExamArchive" + n + ".js");
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
require(path.join(REPO, "js/core/UI.js"));
require(path.join(REPO, "js/data/VisualLessonData.js"));
require(path.join(REPO, "js/data/ExamArchiveData.js"));
FILES.forEach((f) => require(path.join(REPO, f)));
require(path.join(REPO, "js/components/ExamArchive.js"));
const D = AHS.ExamArchiveData;

console.log("ExamArchive Regression — 月考資料");

console.log("\n[1] 題目資料");
{
  check("115-1 第一次段考：六科", D.subjects.filter((s) => s.examId === "115-1-m1").length === 6);
  const cardOk = (ref) => {
    if (ref.indexOf("gap:") === 0) { return !!D.gaps[ref.slice(4)]; }
    const [id, card] = ref.split("#");
    const lesson = AHS.VisualLessonData.filter((l) => l.lessonId === id)[0];
    return !!lesson && lesson.cards.some((c) => c.id === card);
  };
  D.subjects.forEach((s) => {
    const qs = s.sections.reduce((a, sec) => a.concat(sec.questions), []);
    check(s.name + "：題號不重複", new Set(qs.map((q) => q.no)).size === qs.length);
    check(s.name + "：每題有答案、解析、考點", qs.every((q) => q.answer && q.explanation && q.topic));
    check(s.name + "：答案依據只有【確認】或【推論】", qs.every((q) => q.basis === "確認" || q.basis === "推論"));
    check(s.name + "：對應教材卡片或缺口都存在", qs.every((q) => cardOk(q.lessonRef)));
    check(s.name + "：題組文本都存在", qs.every((q) => !q.passageRef || (s.passages && s.passages[q.passageRef])));
    const figs = qs.map((q) => q.figure).concat(Object.values(s.passages || {}).reduce((a, p) => a.concat([p.figure, p.figure2]), [])).filter(Boolean);
    check(s.name + "：附圖檔都存在（" + figs.length + " 張）", figs.every((f) => fs.existsSync(path.join(REPO, f))));
    check(s.name + "：選擇題都有選項或題組選項", qs.every((q) => q.type === "fill" || q.type === "essay" || q.options || q.table || ((s.passages || {})[q.passageRef] || {}).wordBank || ((s.passages || {})[q.passageRef] || {}).options));
  });
  /* 只放題目：不放整份考卷照片，也不放學生的姓名、班級、座號、作答或得分 */
  const src = FILES.map((f) => fs.readFileSync(path.join(REPO, f), "utf8")).join("\n");
  check("沒有學生作答欄位", !/\b(studentAnswer|student|handScore|score)\s*:/.test(src));
  check("沒有姓名、班級、座號欄位", !/(班級|座號|姓名)\s*[:：]/.test(src));
  const assets = fs.readdirSync(path.join(REPO, "assets/exam-archive/115-1-m1"), { recursive: true }).filter((f) => /\.(png|svg|jpe?g)$/.test(f));
  check("沒有整份照片（只有 png／svg 附圖）", assets.every((f) => /\.(png|svg)$/.test(f)));
}

console.log("\n[2] 頁面");
{
  const html = fs.readFileSync(path.join(REPO, "exam-archive.html"), "utf8");
  const order = ["js/data/ExamArchiveData.js"].concat(FILES, ["js/components/ExamArchive.js", "js/pages/AppExamArchive.js"]).map((f) => html.indexOf('src="' + f + '"'));
  check("exam-archive.html 依序載入資料、元件、頁面", order.every((i, k) => i !== -1 && (k === 0 || i > order[k - 1])));
  check("載入 VisualLessonData（對應教材連結）", html.indexOf('src="js/data/VisualLessonData.js"') !== -1 && html.indexOf('src="js/data/VisualLessonData.js"') < order[order.length - 2]);
  const cfg = fs.readFileSync(path.join(REPO, "js/data/AppConfig.js"), "utf8");
  const shell = fs.readFileSync(path.join(REPO, "js/ui/AppShell.js"), "utf8");
  check("AppConfig nav 與 AppShell ROUTES 都有 examarchive", /id: "examarchive", label: "月考資料"/.test(cfg) && /examarchive: "exam-archive\.html"/.test(shell));
}

console.log("\n[3] 元件");
{
  const root = AHS.ExamArchive.create();
  document.body.appendChild(root);
  const tabs = root.querySelectorAll(".xa-tab");
  check("六個科目分頁", tabs.length === 6);
  check("預設顯示第一科，且分頁標記選取", tabs[0].getAttribute("aria-selected") === "true" && root.querySelectorAll(".xa-q").length > 0);
  check("解析預設收合", root.querySelectorAll(".xa-expl").length > 0 && root.querySelectorAll(".xa-expl[open]").length === 0);
  const passages = root.querySelectorAll(".xa-q--passage").length;
  check("國文題組文本各只出現一次（4 組）", passages === 4);
  const english = [...tabs].findIndex((t) => /英文/.test(t.textContent));
  tabs[english].click();
  check("切換到英文：50 題", root.querySelectorAll(".xa-q:not(.xa-q--passage)").length === 50);
  check("文意選填顯示字庫", /against the rules/.test(root.querySelector(".xa-wordbank").textContent));
  const links = [...root.querySelectorAll(".xa-lesson a")].map((a) => a.getAttribute("href"));
  check("對應教材連結指向真實檔案", links.length > 0 && links.every((h) => fs.existsSync(path.join(REPO, h.split("#")[0]))));
  check("缺口題顯示「平台缺口」", root.querySelectorAll(".xa-gap").length > 0);
  check("【推論】標示", /【推論】/.test(root.textContent));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
