/* tests/regression/VisualLessonRegression.js — 2026-10-21 圖解教材（互動）.

   - js/data/VisualLessonData.js: every lesson file exists, every card id
     exists in its lesson page, lessons belong to real tm_N packages;
   - the lesson page itself: no forbidden browser APIs, supports the
     embed (?embed=1) and single-card (?card=Fn) modes and reports height;
   - AHS.VisualLesson: material lookup, keyword matching, every 1-1～1-4
     question of tm_7 maps to the expected formula card;
   - 教材中心: a material with a lesson opens the full-screen reader
     (公式目錄 + 教材頁 + 文字教材 tab); others keep the preview modal;
   - 學習助教: searching a concept adds the formula card; quiz feedback gets
     a 看互動圖解 toggle;
   - materials.html / tutor.html load the data, util, frame and CSS.

   Run: node tests/regression/VisualLessonRegression.js */
"use strict";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
/* 舊版教材庫（data/materials/*.js）的紀錄 id，圖解教材也可以對應它們 */
const REPO_RECORD_IDS = fs.readdirSync(path.join(REPO, "data/materials")).filter((f) => /\.js$/.test(f))
  .map((f) => (/var ID = "([^"]+)"/.exec(fs.readFileSync(path.join(REPO, "data/materials", f), "utf8")) || [])[1]).filter(Boolean);
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
require(path.join(REPO, "js/data/TeachingMaterialData.js"));
require(path.join(REPO, "js/data/VisualLessonData.js"));
require(path.join(REPO, "js/utils/VisualLesson.js"));
require(path.join(REPO, "js/ui/VisualLessonFrame.js"));
const VL = AHS.VisualLesson;
const LESSON = AHS.VisualLessonData[0];

console.log("VisualLesson Regression — 圖解教材（互動）");

console.log("\n[1] 資料與教材頁");
{
  check("至少一份圖解教材", AHS.VisualLessonData.length >= 1);
  AHS.VisualLessonData.forEach((l) => {
    const file = path.join(REPO, l.href);
    const exists = fs.existsSync(file);
    check(l.lessonId + "：教材頁存在", exists);
    if (!exists) { return; }
    const own = fs.readFileSync(file, "utf8");
    /* lessons share docs/TeachingMaterials/lessons/shared/ (boot, runtime, css) */
    const shared = ["LessonBoot.js", "LessonRuntime.js", "lesson.css"].map((n) => fs.readFileSync(path.join(path.dirname(file), "shared", n), "utf8")).join("\n");
    check(l.lessonId + "：載入共用引擎（boot／runtime／css）", /src="shared\/LessonBoot\.js"/.test(own) && /src="shared\/LessonRuntime\.js"/.test(own) && /href="shared\/lesson\.css"/.test(own));
    const html = own + "\n" + shared;
    check(l.lessonId + "：每張卡片都在教材頁中", l.cards.every((c) => html.indexOf('id="' + c.id + '"') !== -1));
    check(l.lessonId + "：卡片 id 不重複", new Set(l.cards.map((c) => c.id)).size === l.cards.length);
    check(l.lessonId + "：每張卡片都屬於某一節", l.cards.every((c) => l.sections.some((s) => s.id === c.section)));
    check(l.lessonId + "：對應的教材包都存在", l.materialIds.every((id) => /^tm_\d+$/.test(id)
      ? fs.existsSync(path.join(REPO, "docs/TeachingMaterials/materials", id, "metadata.json"))
      : REPO_RECORD_IDS.indexOf(id) !== -1));
    const js = html.replace(/\/\*[\s\S]*?\*\//g, "");
    check(l.lessonId + "：沒有禁用的瀏覽器 API", !/\blocalStorage\b|\bindexedDB\b|\bfetch\s*\(|XMLHttpRequest|^\s*(import|export)\s/m.test(js));
    check(l.lessonId + "：支援 embed／card 模式並回報高度", /is-embed/.test(html) && /is-card/.test(html) && /ahs-visual-lesson:height/.test(html));
    check(l.lessonId + "：每張卡片都有可作答的小試身手與逐步圖解",
      l.cards.every((c) => new RegExp('data-q="' + c.id + '"').test(html) && html.indexOf('id="s-' + c.id + '"') !== -1));
  });
}

console.log("\n[2] 查詢與比對");
{
  check("tm_7 找得到圖解教材", VL.forMaterial("tm_7") === LESSON);
  check("補充題庫 tm_57 也對應同一份", VL.forMaterial({ originKey: "tm_57" }) === LESSON);
  check("題目 id tm_7_q3 對應到教材", VL.forMaterial("tm_7_q3") === LESSON);
  check("其他教材沒有圖解教材", VL.forMaterial("tm_3") === null && VL.forMaterial("tm_4") === null);
  check("舊版教材庫的紀錄也對應得到（生物第1章）", (VL.forMaterial({ id: "mat_9", originKey: "biology-g11-origin-and-evolution-of-life" }) || {}).lessonId === "BIO_H2_CellOriginPlants");
  check("一包一課的教材包：題目沒提到關鍵詞時對應該課卡片（tm_66 → 燭之武 F13）", (VL.forQuestion({ id: "tm_66_q99", knowledgePoint: "練習題", text: "下列文句何者正確？" }) || { card: {} }).card.id === "F13");
  check("一包一課的教材包：關鍵詞只在同一節內比對（「比喻」不會跑到第二課）", (VL.forQuestion({ id: "tm_67_q99", text: "這句話運用了比喻" }) || { card: {} }).card.id === "F12");
  check("舊版教材庫的題目 id（…-q3）也找得到教材", (VL.forQuestion({ id: "chinese-g11-laoshan-daoshi-q3", knowledgePoint: "異史氏曰" }) || { card: {} }).card.id === "F1");
  check("沒登錄的舊版教材庫紀錄不對應", VL.forMaterial({ originKey: "civics-g10-ch5-6-exam-20260730" }) === null && VL.forMaterial({ id: "mat_1" }) === null);
  check("「疊合」→ 疊合公式", (VL.match("疊合") || {}).card.id === "F14");
  check("「倍角公式」→ 二倍角", (VL.match("倍角公式") || {}).card.id === "F12");
  check("「兩直線夾角」→ F11", (VL.match("兩直線夾角") || {}).card.id === "F11");
  check("與教材無關的字不會配對", VL.match("光合作用") === null);
  check("不在學生教材範圍時不配對", VL.match("疊合", { materialIds: ["tm_11"] }) === null);
  const expect = {
    "1-1 弧度量：弧度轉度數": "F3", "1-1 弧度量：弧長公式": "F1", "1-1 弧度量：扇形面積公式": "F2",
    "1-2 三角函數的圖形：一般正弦函數振幅與週期": "F7", "1-2 三角函數的圖形：正切函數性質": "F9",
    "1-3 和角公式：特殊角精確值": "F10", "1-3 倍角公式：二倍角計算": "F12", "1-3 半角公式：象限判斷": "F13",
    "1-3 兩直線夾角公式": "F11", "1-4 正餘弦疊合：基本疊合求最大值": "F14", "1-4 正餘弦疊合：限定區間求極值": "F15"
  };
  const tm7 = AHS.TeachingMaterialData.filter((e) => e.materialId === "tm_7")[0];
  const byKp = {};
  tm7.questions.forEach((q) => { byKp[q.knowledgePoint] = q; });
  Object.keys(expect).forEach((kp) => {
    const q = byKp[kp];
    const m = q && VL.forQuestion({ id: q.id, knowledgePoint: q.knowledgePoint, text: q.question });
    check("題目「" + kp + "」→ " + expect[kp], !!m && m.card.id === expect[kp]);
  });
  const chapterQs = tm7.questions.filter((q) => /^1-[1-4]/.test(q.knowledgePoint || ""));
  check("tm_7 課本 23 題全部對應到公式卡片", chapterQs.length === 23 &&
    chapterQs.every((q) => VL.forQuestion({ id: q.id, knowledgePoint: q.knowledgePoint, text: q.question })));
}

{
  const cov = require(path.join(REPO, "docs/TeachingMaterials/scripts/VisualLessonCoverage.js")).report();
  const withLesson = cov.filter((r) => r.lesson);
  check("覆蓋率：有圖解教材的教材，每一題都對應到卡片（" + withLesson.map((r) => r.materialId + " " + r.matched + "/" + r.questions).join("、") + "）",
    withLesson.length >= 1 && withLesson.every((r) => r.questions > 0 && r.matched === r.questions));
}

check("產生器：lessons/src 的教材頁都已重新產生（BuildVisualLesson --check）",
  require(path.join(REPO, "docs/TeachingMaterials/scripts/BuildVisualLesson.js")).run([], true).length === 0);

console.log("\n[3] 畫面元件");
{
  const one = AHS.VisualLessonFrame.card(LESSON, "F14");
  check("單一公式：iframe 載入 card 模式", /\?card=F14&theme=light$/.test(one.querySelector("iframe").getAttribute("src")));
  check("單一公式：不存在的卡片回傳 null", AHS.VisualLessonFrame.card(LESSON, "F99") === null);
  const tog = AHS.VisualLessonFrame.cardToggle(LESSON, "F12");
  const btn = tog.querySelector("button");
  check("看互動圖解：一開始不載入 iframe", !tog.querySelector("iframe"));
  btn.click();
  check("看互動圖解：點了才展開", !!tog.querySelector("iframe") && btn.getAttribute("aria-expanded") === "true");
  btn.click();
  check("看互動圖解：再點收合", tog.querySelector(".vlesson").hasAttribute("hidden"));
  const f = one.querySelector("iframe");
  document.body.appendChild(one);
  window.dispatchEvent(new window.MessageEvent("message", { data: { type: "ahs-visual-lesson:height", height: 777 }, source: f.contentWindow }));
  check("單一公式：依教材頁回報的高度調整", f.style.height === "781px" || f.contentWindow === null);
}

console.log("\n[4] 教材中心與學習助教");
{
  const prev = fs.readFileSync(path.join(REPO, "js/ui/MaterialPreview.js"), "utf8");
  check("預覽：有圖解教材時改開全螢幕閱讀畫面", /AHS\.VisualLessonReader\.open\(/.test(prev));
  const card = fs.readFileSync(path.join(REPO, "js/ui/MaterialCard.js"), "utf8");
  check("教材卡片：顯示互動圖解標籤", /mat-card__lesson/.test(card));
  const tutor = fs.readFileSync(path.join(REPO, "js/components/AiTutor.js"), "utf8");
  check("學習助教：查觀念後附上公式卡片", /pushWithVisual\(/.test(tutor) && /VisualLessonFrame\.card\(/.test(tutor));
  check("學習助教：出題詳解附上看互動圖解", /visualForQuestion\(q\)/.test(tutor) && /cardToggle\(/.test(tutor));
  [["materials.html", "js/ui/VisualLessonReader.js"], ["tutor.html", "js/ui/VisualLessonFrame.js"]].forEach(([page, ui]) => {
    const html = fs.readFileSync(path.join(REPO, page), "utf8");
    const i = (s) => html.indexOf(s);
    check(page + "：載入資料、工具、元件與 CSS（順序正確）",
      i("js/core/UI.js") < i(ui) && i("js/data/VisualLessonData.js") < i("js/utils/VisualLesson.js") &&
      i("js/utils/VisualLesson.js") < i(ui) && i("css/components/visual-lesson.css") !== -1);
  });
  const mp = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" });
  const w = mp.window; w.AHS = {};
  ["js/core/UI.js", "js/core/Icons.js", "js/data/AppConfig.js", "js/data/VisualLessonData.js", "js/utils/VisualLesson.js", "js/ui/VisualLessonReader.js", "js/ui/MaterialPreview.js"].forEach((f) => {
    w.eval(fs.readFileSync(path.join(REPO, f), "utf8"));
  });
  if (!w.AHS.Subjects) { w.AHS.Subjects = { math: { name: "數學" } }; }
  w.document.body.appendChild(w.document.createElement("div"));
  const reader = w.AHS.MaterialPreview.open({ id: "m1", originKey: "tm_7", title: "第1章：三角函數（很長的教材名稱）", subject: "math", grade: "高二", fileType: "" }, function () {});
  w.document.body.appendChild(reader);
  check("閱讀畫面（tm_7）：全螢幕、短標題、完整名稱在提示", reader.classList.contains("vreader") &&
    reader.querySelector(".vreader__title").textContent === "第1章 三角函數・圖解教材" &&
    reader.querySelector(".vreader__heading").getAttribute("title") === "第1章：三角函數（很長的教材名稱）");
  check("閱讀畫面：iframe 載入 embed 模式", /\?embed=1&theme=light$/.test(reader.querySelector(".vreader__frame").getAttribute("src")));
  const items = reader.querySelectorAll(".vreader__item");
  check("閱讀畫面：公式目錄 15 項、分 4 節", items.length === 15 && reader.querySelectorAll(".vreader__group").length === 4);
  check("閱讀畫面：下拉選單 15 項（窄螢幕用）", reader.querySelectorAll(".vreader__jump option").length === 15);
  check("閱讀畫面：預設第一個公式為目前位置", items[0].classList.contains("is-active"));
  items[9].click();
  check("閱讀畫面：點目錄切換目前位置", items[9].classList.contains("is-active") && !items[0].classList.contains("is-active") && reader.querySelector(".vreader__jump").value === "F10");
  const fw = reader.querySelector(".vreader__frame").contentWindow;
  w.dispatchEvent(new w.MessageEvent("message", { data: { type: "ahs-visual-lesson:state", active: "F3", done: ["F1", "F2"] }, source: fw }));
  check("閱讀畫面：依教材頁回報更新位置與進度", !fw || (items[2].classList.contains("is-active") &&
    items[0].classList.contains("is-done") && reader.querySelector(".vreader__progress-text").textContent === "已完成 2 / 15"));
  const tabs = reader.querySelectorAll(".vreader__tab");
  tabs[1].click();
  check("閱讀畫面：切到文字教材與練習", reader.querySelector("#vreader-pane-lesson").hasAttribute("hidden") && !reader.querySelector("#vreader-pane-text").hasAttribute("hidden"));
  check("閱讀畫面：開啟時鎖住背景捲動", w.document.body.style.overflow === "hidden");
  reader.querySelector(".vreader__back").click();
  check("閱讀畫面：返回教材中心會關閉並還原捲動", !reader.parentNode && w.document.body.style.overflow === "");
  const plain = w.AHS.MaterialPreview.open({ id: "m2", originKey: "tm_3", title: "高一公民考卷", subject: "math", fileType: "" }, function () {});
  check("預覽視窗（其他教材）：維持原本的小視窗", plain.classList.contains("mat-preview__overlay") && !plain.querySelector(".vreader__nav"));
}

console.log("\nVisualLessonRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
