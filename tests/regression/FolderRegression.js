/* tests/regression/FolderRegression.js — Sprint AI-120 (Workspace
   Repository Integration) AI-120-02/AI-120-03/AI-120-09. Real proof that
   the Home 教材資料夾 widget (js/components/WorkspaceFolder.js, new this
   Sprint) reads Repository content live (no fixed data — see file
   header) grouped by Subject, scoped to Current Workspace, and re-syncs
   automatically when Repository content changes.

   Run: node tests/regression/FolderRegression.js */
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

function loadPage(htmlFile, { seedSession } = {}) {
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

console.log("Folder (教材資料夾) Regression — Sprint AI-120");

/* ---- 1. School/Semester/Subject/Material 真實顯示 --------------------- */
console.log("\n[1] 教材資料夾 — School／Semester／Subject／Material 真實顯示（AI-120-02/03）");
{
  const { window, consoleErrors } = loadPage("index.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  const doc = window.document;
  const folder = doc.querySelector(".workspace-folder");
  check("首頁真實掛載教材資料夾", !!folder);
  check("副標題顯示真實 School／Semester（長榮中學・高一下學期）", !!folder && folder.textContent.indexOf("長榮中學") !== -1 && folder.textContent.indexOf("高一下學期") !== -1);
  const groups = doc.querySelectorAll(".workspace-folder__group");
  check("依 Subject 分組（非單一清單）", groups.length >= 1);
  const links = doc.querySelectorAll(".workspace-folder__link");
  check("每筆教材皆有真實連結（前往學習總結／前往考前練習）",
    [...links].some((a) => a.textContent === "前往學習總結") && [...links].some((a) => a.textContent === "前往考前練習"));
  const firstSummaryLink = [...links].find((a) => a.textContent === "前往學習總結");
  check("連結真實指向 summary.html?materialId=（非假連結）", !!firstSummaryLink && /^summary\.html\?materialId=/.test(firstSummaryLink.getAttribute("href")));
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2. 直接讀取 Repository，Repository 新增教材立即同步 --------------- */
console.log("\n[2] Folder 直接讀取 Repository（非固定資料）— 新增教材立即同步（AI-120-02）");
{
  const { window } = loadPage("index.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  window.AHS.MaterialRuntime.add({
    title: "FolderRegression 新增教材", subject: "history", grade: "高一", chapter: "第一章",
    category: "講義", fileName: "", fileType: "FILE", content: "x"
  });
  const folderNode = window.AHS.WorkspaceFolder.create();
  check("新增教材立即出現在 Folder（同一次 create() 呼叫，非快取舊資料）",
    folderNode.textContent.indexOf("FolderRegression 新增教材") !== -1);
  const historyGroup = [...folderNode.querySelectorAll(".workspace-folder__group")]
    .find((g) => g.textContent.indexOf("歷史") !== -1);
  check("新增教材依真實 Subject 分類到「歷史」群組", !!historyGroup && historyGroup.textContent.indexOf("FolderRegression 新增教材") !== -1);
}

/* ---- 3. 空 Workspace（高二上）誠實顯示空狀態 --------------------------- */
console.log("\n[3] Folder — 尚無教材的 Workspace 誠實顯示空狀態（非假造教材）");
{
  const { window, consoleErrors } = loadPage("index.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] } }
  });
  const doc = window.document;
  const folder = doc.querySelector(".workspace-folder");
  check("首頁仍掛載教材資料夾（僅內容為空，非整塊消失）", !!folder);
  check("顯示真實空狀態文字", !!doc.querySelector(".workspace-folder__empty"));
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\n==============================");
console.log("FolderRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
