/* tests/regression/MaterialCenterRegression.js — Sprint AI-120 (Workspace
   Repository Integration) AI-120-01/AI-120-09. Real, end-to-end proof
   that Material Center only ever shows the Current Workspace's own real
   materials: js/runtime/TeachingMaterialLoader.js's own workspaceAllows()
   filter (new this Sprint) is exercised through the real page bootstrap
   (materials.html), not called directly — the same discipline every
   other regression suite in this repo already uses.

   Run: node tests/regression/MaterialCenterRegression.js */
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

/* loadPage() deliberately does NOT auto-seed a default Workspace (unlike
   every other regression suite's own loadPage()) — this file's entire
   purpose is to control which Workspace is active, check by check. */
function loadPage(htmlFile, { seedSession, url } = {}) {
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
  /* Sprint AI-142: jsdom has no window.fetch — now that real Supabase
     config is committed (js/data/SupabaseConfig.js), any code path that
     reaches AHS.SupabaseClient would otherwise throw a synchronous
     ReferenceError instead of the graceful network-failure rejection
     the real code already handles via .catch(). Stub it to fail
     immediately so every test stays offline/deterministic (this sandbox
     has no real outbound access to Supabase anyway) without touching
     any Supabase source file. */
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  if (seedSession) {
    Object.entries(seedSession).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; } /* optional, git-ignored local-only script (e.g. SupabaseConfig.local.js) */
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

console.log("Material Center Workspace Filter Regression — Sprint AI-120");

/* ---- 1. Student A + 長榮中學 + 高一下：真實看到已遷移的 5 筆教材 -------- */
console.log("\n[1] Student A／長榮中學／高一下學期 — 真實看到已遷移的 Repository 教材");
{
  const { window, consoleErrors } = loadPage("materials.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  const materials = window.AHS.MaterialRuntime.list();
  check("看到全部 5 筆已遷移教材（4 Package + 1 Repository track）", materials.length === 5);
  check("包含 Package track 教材（tm_1 對應的真實標題）", materials.some((m) => (m.title || "").indexOf("三角函數") !== -1));
  check("包含 Repository track 教材（civics）", materials.some((m) => m.subject === "civics"));
  const doc = window.document;
  check("每筆教材真實渲染成卡片（.mat-card 數量與 Runtime 一致）", doc.querySelectorAll(".mat-card").length === materials.length);
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2a. Student A + 長榮中學 + 高二上：現已有 13 筆真實 Repository 教材
   （國文教材三課，workspaceSemester: "g2s1" —— 第三課／近體詩選的三首詩
   已合併為單一教材／單一測驗；另加上英文教材第一課 The Day I Broke the
   Rules；tm_5（長榮中學高二第一次月考 生物補充資料）匯入後同樣標記
   g2s1，為第 5 筆；生物第1章《生物的起源與演化》
   data/materials/BiologyG11OriginAndEvolutionOfLife.js 同樣標記 g2s1，
   為第 6 筆；tm_14／tm_15（長榮中學高二世界史「序篇：從臺灣走向世界」／
   「第1章：歐洲文化與基督教傳統」，2026-09-07 由原 tm_6 依章節拆分為兩筆
   獨立教材，比照物理/化學/公民「一個章節＝一筆教材」慣例；原 tm_6 已標記
   archived，不再計入）匯入後同樣標記 g2s1，為第 7、8 筆；生物第1章
   講義版 data/materials/BiologyG11Ch1HandoutReview.js 同樣標記 g2s1，為第
   9 筆；tm_7（長榮中學高二數學 第1章「三角函數」，Package
   materialType=TEXTBOOK）匯入後同樣標記 g2s1，為第 10 筆；tm_8（長榮中學高二
   公民與社會 第1章「社會資源的分配」，Package materialType=TEXTBOOK）匯入後
   同樣標記 g2s1，為第 11 筆；tm_9（長榮中學高二公民與社會 第2章「需求與
   供給」，Package materialType=TEXTBOOK）匯入後同樣標記 g2s1，為第 12
   筆；tm_10（長榮中學高二物理 第1章「測量與不確定度」，Package
   materialType=TEXTBOOK）匯入後同樣標記 g2s1，為第 13 筆；tm_11（長榮中學
   高二物理 第2章「直線運動」，Package materialType=TEXTBOOK）匯入後同樣
   標記 g2s1，為第 14 筆；tm_12（長榮中學高二化學 第一章「化學計量與反應熱」，
   Package materialType=TEXTBOOK，source=講義）匯入後同樣標記 g2s1，為第
   15 筆；tm_16（長榮中學高二歷史 第2章「歐洲自由與民主的發展」，2026-09-09
   整合 Claude Round1 與 ChatGPT(Web)/Gemini(Web) Tri-Web Council 三方內容
   重新比對 SOURCE 產出之 Final 版，Package materialType=TEXTBOOK）匯入後
   同樣標記 g2s1，為第 16 筆），不得出現高一下（g1s2）教材，兩學期互相隔離 --- */
console.log("\n[2a] Student A／長榮中學／高二上學期 — 真實看到已標記 g2s1 的 16 筆教材（國文3＋英文1＋生物3＋歷史3＋數學1＋公民2＋物理2＋化學1，不得出現高一下教材）");
{
  const { window, consoleErrors } = loadPage("materials.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] } }
  });
  const materials = window.AHS.MaterialRuntime.list();
  check("高二上真實看到 16 筆教材（AI-120-01：不得混入高一下教材；近體詩選三課已合併為一；含 tm_5、第1章生物課本、第1章生物講義、tm_14/tm_15/tm_16 世界史（原 tm_6 拆分＋新增第2章）、tm_7 三角函數、tm_8/tm_9 公民與社會、tm_10/tm_11 物理、tm_12 化學）", materials.length === 16);
  check("皆為國文科、英文科、生物科、歷史科、數學科、公民科、物理科或化學科（無高一下的 geography 教材混入）",
    materials.every((m) => m.subject === "chinese" || m.subject === "english" || m.subject === "biology" || m.subject === "history" || m.subject === "math" || m.subject === "civics" || m.subject === "physics" || m.subject === "chemistry"));
  check("包含國文第一課教材（勞山道士）", materials.some((m) => (m.title || "").indexOf("勞山道士") !== -1));
  check("包含國文第三課合併教材（近體詩選：杜甫、李商隱、黃庭堅）",
    materials.some((m) => (m.title || "").indexOf("近體詩選") !== -1));
  check("包含英文第一課教材（The Day I Broke the Rules）",
    materials.some((m) => (m.title || "").indexOf("The Day I Broke the Rules") !== -1));
  check("包含生物第1章教材（生物的起源與演化）",
    materials.some((m) => (m.title || "").indexOf("生物的起源與演化") !== -1));
  check("包含生物第1章講義版教材（選修生物II教學講義）",
    materials.some((m) => (m.title || "").indexOf("選修生物II") !== -1));
  check("包含歷史 tm_14 教材（序篇：從臺灣走向世界，原 tm_6 拆分）",
    materials.some((m) => (m.title || "").indexOf("從臺灣走向世界") !== -1));
  check("包含歷史 tm_15 教材（第1章 歐洲文化與基督教傳統，原 tm_6 拆分）",
    materials.some((m) => (m.title || "").indexOf("歐洲文化與基督教傳統") !== -1));
  check("包含歷史 tm_16 教材（第2章 歐洲自由與民主的發展，Round1+Tri-Web Council 整合 Final）",
    materials.some((m) => (m.title || "").indexOf("歐洲自由與民主的發展") !== -1));
  check("包含數學 tm_7 教材（第1章 三角函數）",
    materials.some((m) => (m.title || "").indexOf("三角函數") !== -1));
  check("包含公民 tm_8 教材（第1章 社會資源的分配）",
    materials.some((m) => (m.title || "").indexOf("社會資源的分配") !== -1));
  check("包含公民 tm_9 教材（第2章 需求與供給）",
    materials.some((m) => (m.title || "").indexOf("需求與供給") !== -1));
  check("包含物理 tm_10 教材（第1章 測量與不確定度）",
    materials.some((m) => (m.title || "").indexOf("測量與不確定度") !== -1));
  check("包含物理 tm_11 教材（第2章 直線運動）",
    materials.some((m) => (m.title || "").indexOf("直線運動") !== -1));
  check("包含化學 tm_12 教材（第一章 化學計量與反應熱）",
    materials.some((m) => (m.title || "").indexOf("化學計量與反應熱") !== -1));
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2b. Student A + 長榮中學 + 高二下：真正尚未匯入任何教材，誠實空狀態
   （g2s2 尚無任何 workspaceSemester 標記為此值的教材） ------------------ */
console.log("\n[2b] Student A／長榮中學／高二下學期 — 尚無教材，誠實顯示空狀態（不得出現高一下／高二上教材）");
{
  const { window, consoleErrors } = loadPage("materials.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s2"] } }
  });
  const materials = window.AHS.MaterialRuntime.list();
  check("高二下真實為空（不得混入高一下或高二上教材）", materials.length === 0);
  const doc = window.document;
  check("Material Center 顯示真實 Empty State（非破版、非假造教材）", !!doc.querySelector(".mat-empty"));
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 3. Student B（id: student_c）+ 竹圍高中 + 高二上：讀到自己學校的
   Repository 教材，namespace 與 Student A 彼此獨立（跨校資料隔離—Student B
   已不再與 Student A 同校，見 WorkspaceData.js 整併說明） -------------- */
console.log("\n[3] Student B／竹圍高中／高二上學期 — 讀到自己學校的 Repository 教材，namespace 與 Student A 完全獨立");
{
  const { window } = loadPage("materials.html", {
    seedSession: { "ahs:workspace": { studentId: "student_c", schoolId: "zwsh", semesterIds: ["g2s1"] } }
  });
  check("Student B（竹圍高中）看到自己學校的 1 筆 Repository 教材（tm_13 化學）", window.AHS.MaterialRuntime.list().length === 1);
  check("命名空間與 Student A 不同（storageNamespace 真實反映 Student B／竹圍高中）",
    window.AHS.WorkspaceRuntime.storageNamespace() === "student_c__zwsh__g2s1");
}

/* ---- 4. 未登入（無 Workspace）：向下相容，不因此崩潰 ------------------ */
console.log("\n[4] 未登入（無 Workspace）— Login Gate 生效，不崩潰");
{
  const { window, consoleErrors } = loadPage("materials.html");
  check(".shell 不存在（AppShell 已導向 login.html，未渲染教材中心）", !window.document.querySelector(".shell"));
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\n==============================");
console.log("MaterialCenterRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
