/* tests/regression/PetGameRegression.js — Sprint AI-134（真實 PO 需求）：
   "目前的首頁可否增加一個飼養寵物的小遊戲，巧巧老師的小提醒可以與寵物
   飼養結合，進行每日飼養提醒，而每日飼養的邏輯為依照教材完成度百分比
   的完成比例來做為成長的因子，並提供一些寵物的圖案，讓學生選擇"。

   確認方案（AskUserQuestion，使用者選擇）：
   - 成長機制：被動即時反映 — 寵物成長狀態直接對應
     AHS.StatisticsRuntime.overallMaterialCompletion()，不需要學生額外
     操作「餵食」。
   - 寵物圖案：PO 續提供正式插畫素材（老虎／恐龍，各 10 張 10%~100%
     成長階段圖，見 js/core/PetArt.js），先以 2 種圖案測試選擇流程。
   - 巧巧老師的小提醒：選了寵物後，首頁 Hero Card 既有的提醒泡泡文字
     改為寵物飼養主題（真實依當下完成度變化，不是固定文字）。

   Verifies:
   - AHS.StatisticsRuntime.overallMaterialCompletion()：Single Source —
     直接重用既有 materialCompletion()，對真實材料集合取平均、四捨五入；
     沒有教材時誠實回傳 0。
   - AHS.PetRuntime：2 種固定寵物圖案、選擇/持久化（跨頁面重新載入仍
     保留，且依 Workspace 隔離的既有 PersistenceAdapter 樣式）、無效
     id 被拒絕、growth() 的 percent 與 stageIndex 皆與
     overallMaterialCompletion() 完全一致（不是另外一套算法）。
   - AHS.PetWidget（真實 DOM 互動）：尚未選寵物時顯示 2 選項圖卡，點擊
     即選定並立即切換為成長畫面；「換一隻寵物」能回到選擇畫面重選。
   - Hero Card 巧巧老師提醒泡泡：選寵物前維持原本通用文案，選了寵物後
     真實變成寵物飼養主題（含寵物名稱與真實完成度百分比）。

   Run: node tests/regression/PetGameRegression.js */
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

/* g3s1（高三上學期）刻意選用 — docs/TeachingMaterials Repository 匯入
   管線目前只有 g1s2（公民）與 g2s1（國文）兩個學期有真實教材，g3s1 沒
   有任何 Repository 內容會被 TeachingMaterialLoader 自動載入，測試才能
   精準控制教材集合、驗證平均值計算，不被真實 Repository 教材干擾（與
   tests/regression/CombinedReviewRegression.js 刻意選用 g2s1 隔離
   tm_1-4（g1s2）同一種做法，方向相反、目的相同）。 */
const STUDENT_WORKSPACE = { studentId: "admin", schoolId: "cjsh", semesterIds: ["g3s1"] };

function loadPage(htmlFile, opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) { return; }
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, {
    url: "https://ahs.test/" + htmlFile,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  /* Sprint AI-142: jsdom has no window.fetch — now that real Supabase
     config is committed (js/data/SupabaseConfig.js), any code path that
     reaches AHS.SupabaseClient would otherwise throw a synchronous
     ReferenceError instead of the graceful network-failure rejection
     the real code already handles via .catch(). Stub it to fail
     immediately so every test stays offline/deterministic (this sandbox
     has no real outbound access to Supabase anyway) without touching
     any Supabase source file. */
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify(opts.workspace || STUDENT_WORKSPACE));
  if (opts.seedSession) {
    Object.entries(opts.seedSession).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function click(node) {
  node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function carriedSession(win) {
  const carried = {};
  for (let i = 0; i < win.sessionStorage.length; i++) {
    const k = win.sessionStorage.key(i);
    carried[k] = JSON.parse(win.sessionStorage.getItem(k));
  }
  return carried;
}

console.log("Pet Game Regression — Sprint AI-134（首頁飼養寵物小遊戲，成長依教材完成度）");

/* ---- 1. overallMaterialCompletion() — Single Source，重用 materialCompletion() -- */
console.log("\n[1] AHS.StatisticsRuntime.overallMaterialCompletion() — 對真實教材集合取平均，重用既有 materialCompletion()");
{
  const { window, consoleErrors } = loadPage("index.html");
  const AHS = window.AHS;

  check("沒有任何真實教材時，誠實回傳 0（不是假造進度）", AHS.StatisticsRuntime.overallMaterialCompletion() === 0);

  const m1 = AHS.MaterialRuntime.add({ title: "教材A", subject: "math", grade: "高一", category: "講義" });
  check("新增 1 筆未讀教材，完成度仍為 0", AHS.StatisticsRuntime.overallMaterialCompletion() === 0);

  const m2 = AHS.MaterialRuntime.add({ title: "教材B", subject: "math", grade: "高一", category: "講義" });
  AHS.MaterialRuntime.startLearning(m2.id, { progress: 100 });
  check("教材A(0%) + 教材B(閱讀完成 20%) 平均 = 10%",
    AHS.StatisticsRuntime.overallMaterialCompletion() === 10);

  AHS.HistoryRuntime.record({
    examId: "teaching_material_" + m2.id, subject: "math", title: "t", chapter: "c",
    score: 100, accuracy: 100, correctCount: 1, totalCount: 1
  });
  check("教材B 補上真實測驗紀錄且無未精熟錯題後變 100% — 教材A(0%) + 教材B(100%) 平均 = 50%",
    AHS.StatisticsRuntime.overallMaterialCompletion() === 50);

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2. AHS.PetRuntime — 寵物圖案選擇與持久化 -------------------------- */
console.log("\n[2] AHS.PetRuntime — 2 種固定寵物圖案，選擇後依 Workspace 持久化，無效 id 被拒絕");
{
  const { window } = loadPage("index.html");
  const AHS = window.AHS;

  const species = AHS.PetRuntime.listSpecies();
  check("真實提供 2 種寵物圖案", species.length === 2);
  const ids = species.map((s) => s.id).sort();
  check("圖案 id 真實為 tiger/dinosaur", JSON.stringify(ids) === JSON.stringify(["dinosaur", "tiger"]));

  check("尚未選擇前，getSelectedSpecies() 誠實為 null", AHS.PetRuntime.getSelectedSpecies() === null);

  check("selectSpecies('tiger') 真實成功", AHS.PetRuntime.selectSpecies("tiger") === true);
  check("選擇後 getSelectedSpecies() 真實變為 'tiger'", AHS.PetRuntime.getSelectedSpecies() === "tiger");

  check("selectSpecies('dragon')（不存在的圖案）真實被拒絕", AHS.PetRuntime.selectSpecies("dragon") === false);
  check("無效選擇不影響先前已選定的寵物", AHS.PetRuntime.getSelectedSpecies() === "tiger");

  const carried = carriedSession(window);
  const { window: win2 } = loadPage("index.html", { seedSession: carried });
  check("重新載入頁面（真實跨 Session 持久化）後，選擇的寵物仍是 'tiger'",
    win2.AHS.PetRuntime.getSelectedSpecies() === "tiger");
}

/* ---- 3. growth() — percent/stageIndex 與 overallMaterialCompletion() 完全一致 -- */
console.log("\n[3] AHS.PetRuntime.growth() — percent 與既有 overallMaterialCompletion() 完全一致，stageIndex 分段正確");
{
  function stageCase(label, buildMaterials, expectedPercent, expectedStage) {
    const { window } = loadPage("index.html");
    const AHS = window.AHS;
    AHS.PetRuntime.selectSpecies("tiger");
    buildMaterials(AHS);
    const growth = AHS.PetRuntime.growth();
    check(label + " — percent 與 overallMaterialCompletion() 一致（" + growth.percent + "%）",
      growth.percent === AHS.StatisticsRuntime.overallMaterialCompletion() && growth.percent === expectedPercent);
    check(label + " — stageIndex 正確（" + growth.stageLabel + "）", growth.stageIndex === expectedStage);
  }

  stageCase("20%（蛋・2，10 階段第 1 格）", (AHS) => {
    const m = AHS.MaterialRuntime.add({ title: "m", subject: "math", grade: "高一", category: "講義" });
    AHS.MaterialRuntime.startLearning(m.id, { progress: 100 });
  }, 20, 1);

  stageCase("40%（幼年・2，10 階段第 3 格）", (AHS) => {
    const a = AHS.MaterialRuntime.add({ title: "a", subject: "math", grade: "高一", category: "講義" });
    const b = AHS.MaterialRuntime.add({ title: "b", subject: "math", grade: "高一", category: "講義" });
    AHS.MaterialRuntime.startLearning(b.id, { progress: 100 });
    const c = AHS.MaterialRuntime.add({ title: "c", subject: "math", grade: "高一", category: "講義" });
    AHS.MaterialRuntime.startLearning(c.id, { progress: 100 });
    AHS.HistoryRuntime.record({ examId: "teaching_material_" + c.id, subject: "math", title: "t", chapter: "c", score: 100, accuracy: 100, correctCount: 1, totalCount: 1 });
  }, 40, 3);

  stageCase("60%（成長・1，10 階段第 5 格）", (AHS) => {
    const a = AHS.MaterialRuntime.add({ title: "a", subject: "math", grade: "高一", category: "講義" });
    AHS.MaterialRuntime.startLearning(a.id, { progress: 100 });
    const b = AHS.MaterialRuntime.add({ title: "b", subject: "math", grade: "高一", category: "講義" });
    AHS.MaterialRuntime.startLearning(b.id, { progress: 100 });
    AHS.HistoryRuntime.record({ examId: "teaching_material_" + b.id, subject: "math", title: "t", chapter: "c", score: 100, accuracy: 100, correctCount: 1, totalCount: 1 });
  }, 60, 5);

  stageCase("100%（成熟・2，10 階段第 9 格）", (AHS) => {
    const a = AHS.MaterialRuntime.add({ title: "a", subject: "math", grade: "高一", category: "講義" });
    AHS.MaterialRuntime.startLearning(a.id, { progress: 100 });
    AHS.HistoryRuntime.record({ examId: "teaching_material_" + a.id, subject: "math", title: "t", chapter: "c", score: 100, accuracy: 100, correctCount: 1, totalCount: 1 });
  }, 100, 9);
}

/* ---- 4. AHS.PetWidget — 真實 DOM 互動：選擇畫面 <-> 成長畫面 ------------ */
console.log("\n[4] AHS.PetWidget（首頁）— 尚未選寵物顯示 2 選項，點擊即選定並切換成長畫面，可換一隻重選");
{
  const { window, consoleErrors } = loadPage("index.html");
  const doc = window.document;

  const options = doc.querySelectorAll(".pet-widget__option");
  check("尚未選寵物時，真實顯示 2 個可選圖案", options.length === 2);
  check("尚未選寵物時，不顯示成長畫面", doc.querySelectorAll(".pet-widget__stage").length === 0);

  const bubbleTitleBeforePick = doc.querySelector(".hero-card__bubble-title").textContent;
  click(options[0]);
  check("點擊圖案後，選項畫面真實消失", doc.querySelectorAll(".pet-widget__option").length === 0);
  const stage = doc.querySelector(".pet-widget__stage");
  check("點擊圖案後，真實切換為成長畫面", !!stage);
  check("成長畫面真實顯示完成度百分比文字",
    !!doc.querySelector(".pet-widget__stage-pct") && doc.querySelector(".pet-widget__stage-pct").textContent.indexOf("完成度") !== -1);
  check("Runtime 真實記下了剛才點擊選定的寵物", !!window.AHS.PetRuntime.getSelectedSpecies());
  check("同一個 Session 內剛選定寵物，Hero Card 泡泡標題立即真實同步更新（不需重新整理頁面）",
    doc.querySelector(".hero-card__bubble-title").textContent !== bubbleTitleBeforePick &&
    doc.querySelector(".hero-card__bubble-title").textContent === "巧巧老師的每日飼養提醒");

  const changeBtn = doc.querySelector(".pet-widget__change");
  check("成長畫面真實提供「換一隻寵物」按鈕", !!changeBtn);
  click(changeBtn);
  check("點擊「換一隻寵物」後，真實回到 2 選項的選擇畫面", doc.querySelectorAll(".pet-widget__option").length === 2);

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 5. Hero Card 巧巧老師提醒泡泡 — 選寵物後真實變寵物飼養主題 -------- */
console.log("\n[5] Hero Card 巧巧老師的小提醒 — 選寵物前維持原文案，選寵物後真實變為寵物飼養主題");
{
  const { window: winBefore } = loadPage("index.html");
  const bubbleTitleBefore = winBefore.document.querySelector(".hero-card__bubble-title");
  check("尚未選寵物時，提醒泡泡標題維持原本通用文案「巧巧老師的小提醒」",
    !!bubbleTitleBefore && bubbleTitleBefore.textContent === "巧巧老師的小提醒");

  winBefore.AHS.PetRuntime.selectSpecies("dinosaur");
  const carried = carriedSession(winBefore);
  const { window: winAfter, consoleErrors } = loadPage("index.html", { seedSession: carried });
  const doc = winAfter.document;
  const bubbleTitle = doc.querySelector(".hero-card__bubble-title");
  const bubbleText = doc.querySelector(".hero-card__bubble-text");
  check("選了寵物並重新載入後，提醒泡泡標題真實改為寵物飼養主題",
    !!bubbleTitle && bubbleTitle.textContent === "巧巧老師的每日飼養提醒");
  check("提醒泡泡內文真實包含寵物名稱「恐龍」", !!bubbleText && bubbleText.textContent.indexOf("恐龍") !== -1);
  check("提醒泡泡內文真實包含當下完成度百分比文字", !!bubbleText && bubbleText.textContent.indexOf("教材完成度") !== -1);
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\nPetGameRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
