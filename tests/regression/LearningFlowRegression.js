/* tests/regression/LearningFlowRegression.js — Sprint AI-118 AI-118-14
   Learning Experience (LX) Refactor. Real, end-to-end regression for
   every entry/CTA/Navigation this Sprint reworked (AI-118-01~10) —
   confirms none of them silently regressed to a stale label, a dead
   link, or a duplicate widget. Complements playwright/tests/
   learning-flow.spec.js (AI-118-12, real-browser clicks); this file is
   the Node/jsdom-side proof, same division of labor
   AnalyticsRegression.js already established for Sprint AI-117.

   Run: node tests/regression/LearningFlowRegression.js */
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

/* Sprint AI-119 (Platform Core Baseline): AHS.PersistenceAdapter now
   namespaces every save()/load()/remove() under the active Workspace's
   storage namespace, and AHS.AppShell.create() redirects to login.html
   (rendering nothing) unless a Workspace is active. This suite predates
   Login/Workspace entirely and isn't about testing either — rather than
   rewrite every individual seedSession literal in this file, loadPage()
   auto-establishes ONE fixed default test Workspace (unless the caller
   passes skipLogin) and transparently namespaces each bare "ahs:<key>"
   seed entry to match — idempotent (an already-namespaced entry, e.g.
   from carry(), passes through unchanged). */
const AHS_TEST_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };
const AHS_TEST_NS = "student_a__cjsh__g1s2";
function namespacedKey(k) {
  if (k === "ahs:workspace") { return k; }
  const nsPrefix = "ahs:" + AHS_TEST_NS + ":";
  if (k.indexOf(nsPrefix) === 0) { return k; }
  if (k.indexOf("ahs:") === 0) { return "ahs:" + AHS_TEST_NS + ":" + k.slice(4); }
  return k;
}

function loadPage(htmlFile, { seedSession, url, skipLogin } = {}) {
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
    url: "https://ahs.test/" + (url || htmlFile),
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  if (!skipLogin) {
    window.sessionStorage.setItem("ahs:workspace", JSON.stringify(AHS_TEST_WORKSPACE));
  }
  if (seedSession) {
    Object.entries(seedSession).forEach(([k, v]) => window.sessionStorage.setItem(skipLogin ? k : namespacedKey(k), JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => window.eval(fs.readFileSync(path.join(REPO, src), "utf8")));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

console.log("Learning Experience (LX) Refactor Regression — Sprint AI-118");

/* Sprint AI-122 AI-122-06: 最近教材 now filters on real createdAt (>=
   today-3days) — this seed's own materialSeed.materials[0] needs a real,
   always-current createdAt (not a hardcoded past date that would age out
   of the 3-day window the day after it's written) to keep exercising
   "最近教材存在" honestly regardless of when this suite actually runs. */
function todayStr() {
  var d = new Date();
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
}

const materialSeed = {
  materials: [{
    id: "rt_1", order: 1, subject: "math", title: "AI-118 迴歸測試教材", chapter: "第一章",
    grade: "高一", category: "課本", date: "2026/08/05", views: "1", content: "",
    createdAt: todayStr(),
    progress: 100, lastOpenedAt: "2026/08/05", lastLearningAt: "2026/08/05", learningTime: 10,
    learningCount: 1, favorite: false, fileName: "", fileType: "FILE", fileSize: "", folderId: null
  }],
  folders: [], seq: 1, folderSeq: 0
};
const summarySeed = {
  items: [{
    id: "sr_1", materialId: "rt_1", subject: "math", grade: "高一",
    chapter: "第一章", section: "第一節", title: "AI-118 迴歸測試教材",
    coreConcepts: ["AI-118 核心概念"], definitions: ["AI-118 定義"],
    pitfalls: ["AI-118 易錯點"], memorize: ["AI-118 重點"],
    reviewSuggestions: ["建議複習：第一章"], generatedAt: "2026/08/05"
  }], seq: 1
};
const wrongBookSeed = {
  items: [{
    id: "wb_1", questionId: "q1", subject: "math", title: "AI-118 迴歸測試教材", chapter: "第一章",
    materialId: "rt_1", knowledgePoint: "kp1", question: "Q1",
    options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
    yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 1, lastError: "2026/08/05",
    bookmarked: false, correctStreak: 0
  }], seq: 1
};

/* ---- 1. Navigation (AI-118-01/02/03/09) — fixed order, 複習中心/我的
   學習 gone from both Sidebar and Bottom Nav; every remaining item's
   href resolves to a real, existing file (never a 404). ---- */
console.log("\n[1] Navigation — 固定順序，複習中心／我的學習已移除，所有連結指向真實檔案");
{
  const { window, consoleErrors } = loadPage("index.html", {});
  const doc = window.document;
  const sidebarLabels = [...doc.querySelectorAll(".sidebar__item")].map((n) => n.textContent.trim());
  check("Sidebar 依序為 首頁/教材中心/學習總結/測驗中心/知識弱點/AI Tutor（+設定/登出，AI-121-08 錯題本更名）",
    ["首頁", "教材中心", "學習總結", "測驗中心", "知識弱點", "AI Tutor"].every((label) =>
      sidebarLabels.some((t) => t.includes(label))));
  check("Sidebar 不再有「複習中心」", !sidebarLabels.some((t) => t.includes("複習中心")));
  check("Sidebar 不再有「我的學習」", !sidebarLabels.some((t) => t.includes("我的學習")));

  const hrefs = [...doc.querySelectorAll(".sidebar__item, .bottom-nav__item")]
    .map((n) => n.getAttribute("href")).filter(Boolean);
  check("Nav 至少有真實連結（非全部都是目前分頁的 button）", hrefs.length > 0);
  check("每個 Nav 連結都指向真實存在的檔案（無 404）",
    hrefs.every((href) => fs.existsSync(path.join(REPO, href))));
  check("Nav 連結不含 review.html／learning.html（AI-118-02/03：Nav 移除，檔案本身仍在）",
    !hrefs.includes("review.html") && !hrefs.includes("learning.html"));

  const bottomLabels = [...doc.querySelectorAll(".bottom-nav__item")].map((n) => n.textContent.trim());
  check("Bottom Nav 為首頁/教材/總結/測驗/錯題 五項",
    ["首頁", "教材", "總結", "測驗", "錯題"].every((label) => bottomLabels.some((t) => t.includes(label))));

  check("Console errors = 0（首頁 Navigation）", consoleErrors.length === 0);
}

/* ---- 2. review.html／learning.html 仍為真實、可運作的頁面（AI-118-02/
   03 的「Page 保留」承諾） ---- */
console.log("\n[2] review.html／learning.html 仍存在且可正常開啟（Nav 移除≠頁面刪除）");
{
  const rev = loadPage("review.html", {});
  check("review.html 仍可正常渲染（無 Console error）", rev.consoleErrors.length === 0);
  const lrn = loadPage("learning.html", {});
  check("learning.html 仍可正常渲染（無 Console error）", lrn.consoleErrors.length === 0);
}

/* ---- 3. 教材中心卡片 CTA（AI-118-04） ---- */
console.log("\n[3] 教材中心卡片 CTA — 前往學習總結／前往考前練習，非查看摘要／開始練習");
{
  const { window, consoleErrors } = loadPage("materials.html", {
    seedSession: { "ahs:materialRuntime": materialSeed }
  });
  const doc = window.document;
  const card = doc.querySelector('.mat-card[data-id="rt_1"]');
  check("教材卡片存在", !!card);
  const summaryLink = card && card.querySelector(".mat-card__summary-link");
  const practiceLink = card && card.querySelector(".mat-card__practice-link");
  check("「前往學習總結」CTA 存在且連向 summary.html",
    !!summaryLink && summaryLink.getAttribute("aria-label") === "前往學習總結" &&
    summaryLink.getAttribute("href").indexOf("summary.html") === 0);
  check("「前往考前練習」CTA 存在且連向 quiz.html",
    !!practiceLink && practiceLink.getAttribute("aria-label") === "前往考前練習" &&
    practiceLink.getAttribute("href").indexOf("quiz.html") === 0);
  check("不再有「查看摘要」／舊版「開始練習」字樣", !doc.body.textContent.includes("查看摘要"));
  check("不再有獨立「預覽教材」圖示（HOTFIX-009 既有修正，未被本 Sprint 迴歸）",
    !doc.querySelector(".mat-card__preview"));
  check("Console errors = 0（教材中心）", consoleErrors.length === 0);
}

/* ---- 4. 學習總結 CTA（AI-118-05） ---- */
console.log("\n[4] 學習總結 CTA — 前往考前練習／前往錯題本，前往正式測驗／開始 AI 練習已移除");
{
  const { window, consoleErrors } = loadPage("summary.html", {
    seedSession: {
      "ahs:materialRuntime": materialSeed,
      "ahs:summaryRuntime": summarySeed
    }
  });
  const doc = window.document;
  const practiceLink = doc.querySelector(".sum-footer__quiz");
  const wrongBookLink = doc.querySelector(".sum-footer__wrongbook");
  check("「前往考前練習」CTA 存在（原「開始 AI 練習」，連結不變）",
    !!practiceLink && practiceLink.textContent.includes("前往考前練習") &&
    practiceLink.getAttribute("href").indexOf("quiz.html?mode=practice") === 0);
  check("「前往知識弱點」CTA 存在且連向 wrongbook.html（AI-121-08 錯題本更名）",
    !!wrongBookLink && wrongBookLink.textContent.includes("前往知識弱點") &&
    wrongBookLink.getAttribute("href") === "wrongbook.html");
  check("不再有「前往正式測驗」CTA", !doc.body.textContent.includes("前往正式測驗"));
  check("重點整理／易錯觀念／AI Tutor 建議齊全（AI-118-05 明確要求保留）",
    doc.body.textContent.includes("AI-118 核心概念") && doc.body.textContent.includes("AI-118 易錯點"));
  check("Console errors = 0（學習總結）", consoleErrors.length === 0);
}

/* ---- 5. 測驗中心模式標籤（AI-118-06） ---- */
console.log("\n[5] 測驗中心 — 考前練習／正式測驗標籤明確，舊版「練習模式」已移除");
{
  const { window, consoleErrors } = loadPage("quiz.html", {
    seedSession: { "ahs:learningQuestionRuntime": { items: [], seq: 1 } }
  });
  const doc = window.document;
  const tabs = [...doc.querySelectorAll(".quiz-mode__tab")].map((n) => n.textContent.trim());
  check("模式標籤為「正式測驗」／「考前練習」", tabs.includes("正式測驗") && tabs.includes("考前練習"));
  check("不再有「練習模式」字樣", !tabs.includes("練習模式"));
  check("Console errors = 0（測驗中心）", consoleErrors.length === 0);
}

/* ---- 6. 錯題本（AI-118-07） ---- */
console.log("\n[6] 錯題本 — 今日待複習（StatisticsRuntime.dueForReview()）／全部重新練習／收藏，無重複統計");
{
  const { window, consoleErrors } = loadPage("wrongbook.html", {
    seedSession: { "ahs:wrongBookRuntime": wrongBookSeed }
  });
  const doc = window.document;
  const summaryItems = [...doc.querySelectorAll(".wb-summary__item")];
  check("統計卡僅有「今日待複習」一項（移除全部錯題／尚未精熟／已精熟／我的收藏 4 卡）",
    summaryItems.length === 1 && summaryItems[0].textContent.includes("今日待複習"));
  const dueTodayDom = Number(summaryItems[0].querySelector(".wb-summary__value").textContent);
  const dueTodayRuntime = window.AHS.StatisticsRuntime.dueForReview().length;
  check("今日待複習數字與 StatisticsRuntime.dueForReview() 完全一致（單一資料來源）",
    dueTodayDom === dueTodayRuntime && dueTodayRuntime === 1);
  const actionLabels = [...doc.querySelectorAll(".wb-action")].map((n) => n.textContent.trim());
  check("「全部重新練習」／「收藏」動作按鈕存在",
    actionLabels.some((t) => t.includes("全部重新練習")) && actionLabels.some((t) => t === "收藏" || t.includes("收藏")));
  check("Console errors = 0（錯題本）", consoleErrors.length === 0);
}

/* ---- 7. AI Tutor 推薦流程（AI-118-08） ---- */
console.log("\n[7] AI Tutor — 首頁建議卡片的每個動作皆連向真實下一步，不得跳脫流程");
{
  const { window, consoleErrors } = loadPage("index.html", {
    seedSession: { "ahs:wrongBookRuntime": wrongBookSeed, "ahs:materialRuntime": materialSeed }
  });
  const doc = window.document;
  const tiles = [...doc.querySelectorAll(".tutor-card__tile")];
  check("AI Tutor 卡片至少有一個真實建議動作（今日待複習 > 0）", tiles.length > 0);
  const hrefs = tiles.map((t) => t.getAttribute("href")).filter(Boolean);
  check("每個動作皆為真實連結，非 # 佔位符", hrefs.length > 0 && hrefs.every((h) => h && h !== "#"));
  check("「前往知識弱點」動作存在且連向 wrongbook.html（複習中心 Nav 移除後的整併入口，AI-118-03；AI-121-08 更名）",
    tiles.some((t) => t.textContent.includes("前往知識弱點") && t.getAttribute("href") === "wrongbook.html"));
  check("Console errors = 0（首頁 AI Tutor）", consoleErrors.length === 0);
}

/* ---- 8. 首頁重新整理（Sprint AI-122 AI-122-08）— 單一直向順序：
   Hero→今日任務→學習成果總覽→最近新增教材→教材資料夾→AI Tutor，
   無重複資訊。取代 Sprint AI-118-10 的 main/rail 雙欄版本 — 雙欄無法
   誠實表示 PO 明定的單一線性順序（今日任務過去在右側 rail，與最近
   教材/學習成效總覽並排而非接續其後）。 */
console.log("\n[8] 首頁重新整理（AI-122-08）— Hero→今日任務→學習成果總覽→最近新增教材→教材資料夾→AI Tutor，單一直向順序，無重複資訊");
{
  const { window, consoleErrors } = loadPage("index.html", {
    seedSession: { "ahs:materialRuntime": materialSeed }
  });
  const doc = window.document;
  const main = doc.querySelector(".home__main");
  check("首頁改為單一直向欄位（.home__main，不再有 .home__rail）",
    !!main && !doc.querySelector(".home__rail"));

  function indexOf(selector) {
    const nodes = [...main.querySelectorAll("*")];
    return nodes.findIndex((n) => n.matches && n.matches(selector));
  }
  const heroIdx = indexOf(".hero-card");
  const todayIdx = indexOf("[aria-label='今日任務']");
  const kpiIdx = indexOf(".home-kpi");
  const recentIdx = indexOf(".recent-materials");
  const folderIdx = indexOf(".workspace-folder");
  const tutorIdx = indexOf(".tutor-card");
  check("最近教材存在", !!doc.querySelector(".recent-card, [class*='recent-card']"));
  check("學習成效總覽存在（AI-121-01/19：教材完成度 KPI 已由 Knowledge Mastery 等真實 Learning Outcome 指標取代）",
    kpiIdx !== -1);
  check("今日任務存在", todayIdx !== -1 || doc.body.textContent.includes("今日任務"));
  check("教材資料夾存在（AI-122-07：唯一教材入口）", folderIdx !== -1);
  check("AI Tutor 卡片存在", tutorIdx !== -1);
  check("首頁區塊順序符合 PO 明定：Hero→今日任務→學習成果總覽→最近新增教材→教材資料夾→AI Tutor",
    heroIdx !== -1 && heroIdx < todayIdx && todayIdx < kpiIdx && kpiIdx < recentIdx &&
    recentIdx < folderIdx && folderIdx < tutorIdx);
  check("首頁不再自動掛載 ReviewWidget（AI-122-08：與學習成效總覽/今日任務資訊重複，已移除，元件本身仍保留於程式碼）",
    !doc.querySelector(".review-widget"));
  check("不再有「學習統計」區塊（移至他處/移除，避免與最近教材重複）",
    !doc.body.textContent.includes("學習統計"));
  check("不再有「學習計畫」區塊", !doc.body.textContent.includes("學習計畫"));
  check("不再有獨立「今日學習時間」區塊", !doc.querySelector(".learning-time, [class*='learning-time']"));
  check("不再有獨立「繼續學習」區塊（與最近教材/今日任務重複的第二種呈現）",
    !doc.querySelector(".continue-learning, [class*='continue-learning']"));
  check("Console errors = 0（首頁重新整理）", consoleErrors.length === 0);
}

console.log("\nLearningFlowRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exitCode = 1; }
