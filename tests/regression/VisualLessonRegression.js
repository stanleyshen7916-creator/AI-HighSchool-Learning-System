/* tests/regression/VisualLessonRegression.js — 2026-10-21 圖解教材（互動）.

   - js/data/VisualLessonData.js: every lesson file exists, every card id
     exists in its lesson page, lessons belong to real tm_N packages;
   - the lesson page itself: no forbidden browser APIs, supports the
     embed (?embed=1) and single-card (?card=Fn) modes and reports height;
   - AHS.VisualLesson: material lookup, keyword matching, every 1-1～1-4
     question of tm_7 maps to the expected formula card;
   - 教材中心: a material with a lesson opens on the 互動圖解 tab, others
     are unchanged; the card shows a 互動圖解 badge;
   - 學習助教: searching a concept adds the formula card; quiz feedback gets
     a 看互動圖解 toggle;
   - materials.html / tutor.html load the data, util, frame and CSS.

   Run: node tests/regression/VisualLessonRegression.js */
"use strict";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

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
    const html = fs.readFileSync(file, "utf8");
    check(l.lessonId + "：每張卡片都在教材頁中", l.cards.every((c) => html.indexOf('id="' + c.id + '"') !== -1));
    check(l.lessonId + "：卡片 id 不重複", new Set(l.cards.map((c) => c.id)).size === l.cards.length);
    check(l.lessonId + "：每張卡片都屬於某一節", l.cards.every((c) => l.sections.some((s) => s.id === c.section)));
    check(l.lessonId + "：對應的教材包都存在", l.materialIds.every((id) => fs.existsSync(path.join(REPO, "docs/TeachingMaterials/materials", id, "metadata.json"))));
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
  check("其他教材沒有圖解教材", VL.forMaterial("tm_11") === null && VL.forMaterial("tm_70") === null);
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

console.log("\n[3] 畫面元件");
{
  const full = AHS.VisualLessonFrame.full(LESSON);
  const frame = full.querySelector("iframe");
  check("完整教材：iframe 載入 embed 模式", frame && /\?embed=1&theme=light$/.test(frame.getAttribute("src")));
  check("完整教材：跳到公式選單列出全部卡片", full.querySelectorAll("select option[value^=F]").length === LESSON.cards.length);
  const sel = full.querySelector("select");
  sel.value = "F10"; sel.dispatchEvent(new window.Event("change"));
  check("完整教材：選公式後跳到該卡片", /#F10$/.test(frame.getAttribute("src")));
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
  check("預覽視窗：有圖解教材時加入分頁", /lessonTabs\(lesson, bodyChildren\)/.test(prev) && /互動圖解/.test(prev) && /文字教材與練習/.test(prev));
  const card = fs.readFileSync(path.join(REPO, "js/ui/MaterialCard.js"), "utf8");
  check("教材卡片：顯示互動圖解標籤", /mat-card__lesson/.test(card));
  const tutor = fs.readFileSync(path.join(REPO, "js/components/AiTutor.js"), "utf8");
  check("學習助教：查觀念後附上公式卡片", /pushVisual\(text\)/.test(tutor) && /VisualLessonFrame\.card\(/.test(tutor));
  check("學習助教：出題詳解附上看互動圖解", /visualForQuestion\(q\)/.test(tutor) && /cardToggle\(/.test(tutor));
  ["materials.html", "tutor.html"].forEach((page) => {
    const html = fs.readFileSync(path.join(REPO, page), "utf8");
    const i = (s) => html.indexOf(s);
    check(page + "：載入資料、工具、元件與 CSS（順序正確）",
      i("js/core/UI.js") < i("js/ui/VisualLessonFrame.js") && i("js/data/VisualLessonData.js") < i("js/utils/VisualLesson.js") &&
      i("js/utils/VisualLesson.js") < i("js/ui/VisualLessonFrame.js") && i("css/components/visual-lesson.css") !== -1);
  });
  const mp = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" });
  const w = mp.window; w.AHS = {};
  ["js/core/UI.js", "js/core/Icons.js", "js/data/AppConfig.js", "js/data/VisualLessonData.js", "js/utils/VisualLesson.js", "js/ui/VisualLessonFrame.js", "js/ui/MaterialPreview.js"].forEach((f) => {
    w.eval(fs.readFileSync(path.join(REPO, f), "utf8"));
  });
  if (!w.AHS.Subjects) { w.AHS.Subjects = { math: { name: "數學" } }; }
  const withLesson = w.AHS.MaterialPreview.open({ id: "m1", originKey: "tm_7", title: "三角函數", subject: "math", fileType: "" }, function () {});
  const tabs = withLesson.querySelectorAll(".mat-preview__tab");
  check("預覽視窗（tm_7）：兩個分頁、預設互動圖解", tabs.length === 2 && tabs[0].getAttribute("aria-selected") === "true" && !!withLesson.querySelector("#mat-preview-panel-lesson iframe"));
  tabs[1].click();
  check("預覽視窗（tm_7）：切到文字教材", withLesson.querySelector("#mat-preview-panel-lesson").hasAttribute("hidden") && !withLesson.querySelector("#mat-preview-panel-text").hasAttribute("hidden"));
  check("預覽視窗（tm_7）：加寬", withLesson.querySelector(".mat-preview").classList.contains("mat-preview--lesson"));
  const plain = w.AHS.MaterialPreview.open({ id: "m2", originKey: "tm_11", title: "直線運動", subject: "math", fileType: "" }, function () {});
  check("預覽視窗（其他教材）：維持原樣", !plain.querySelector(".mat-preview__tab") && !plain.querySelector(".mat-preview--lesson"));
}

console.log("\nVisualLessonRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
