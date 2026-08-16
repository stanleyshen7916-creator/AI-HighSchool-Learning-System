/* tests/regression/WorkspaceUIRegression.js — Sprint AI-120 (Workspace
   Repository Integration) AI-120-04/AI-120-07/AI-120-09. Real proof
   that (1) every page's Navigation renders the same Current Workspace
   (Topbar chip never disappears/changes across pages within the same
   session — Workspace state lives in sessionStorage, survives every
   navigation, by construction since Sprint AI-119; this suite proves it
   rather than assuming it), and (2) Settings -> Repository shows real
   Current-Workspace School/Semester/Subject/Material Count/Question
   Count (AI-120-07, js/ui/SettingsPanel.js's new workspaceRepositoryLine()).

   Run: node tests/regression/WorkspaceUIRegression.js */
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

console.log("Workspace UI Regression — Sprint AI-120");

/* ---- 1. 每個頁面 Navigation 都維持 Current Workspace（AI-120-04） ------ */
console.log("\n[1] Navigation — 每一頁都真實維持 Current Workspace（不因換頁遺失）");
{
  const SEED = { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2", "g2s1"] } };
  const PAGES = ["index.html", "materials.html", "summary.html", "quiz.html", "wrongbook.html", "tutor.html"];
  PAGES.forEach((page) => {
    const { window, consoleErrors } = loadPage(page, { seedSession: SEED });
    const chip = window.document.querySelector(".topbar__workspace-chip");
    check(page + " — Topbar 顯示真實 Current Workspace（Student A）", !!chip && chip.textContent.indexOf("Student A") !== -1);
    check(page + " — 複選 Semester 皆完整顯示（高一下學期、高二上學期）",
      !!chip && chip.textContent.indexOf("高一下學期") !== -1 && chip.textContent.indexOf("高二上學期") !== -1);
    check(page + " — Console errors = 0", consoleErrors.length === 0);
  });
}

/* ---- 2. Settings -> Repository 顯示真實 Workspace 資訊（AI-120-07） ---- */
console.log("\n[2] Settings -> Repository — 真實顯示 School／Semester／Subject／Material Count／Question Count");
{
  const { window, consoleErrors } = loadPage("index.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } }
  });
  const settingsBtn = [...window.document.querySelectorAll(".sidebar__item")].find((b) => b.textContent.indexOf("設定") !== -1);
  settingsBtn.click();
  const repoSection = window.document.querySelector('.settings-panel__section[aria-label="Repository"]');
  check("Repository 區塊真實掛載", !!repoSection);
  const text = repoSection ? repoSection.textContent : "";
  check("顯示真實 School（長榮中學）", text.indexOf("長榮中學") !== -1);
  check("顯示真實 Semester（高一下學期）", text.indexOf("高一下學期") !== -1);
  check("顯示真實 Subject 分類統計", text.indexOf("Subject：") !== -1);
  check("顯示真實 Material Count（與 MaterialRuntime.list() 一致）",
    text.indexOf("Material Count：" + window.AHS.MaterialRuntime.list().length) !== -1);
  check("顯示真實 Question Count（非固定文字）", /Question Count：\d+/.test(text));
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 3. 未登入時 Navigation 完全不渲染（Login Gate 優先於一切） -------- */
console.log("\n[3] 未登入 — 任何頁面的 Navigation 皆不渲染（Login Gate 優先）");
{
  const PAGES = ["index.html", "materials.html", "quiz.html"];
  PAGES.forEach((page) => {
    const { window } = loadPage(page);
    check(page + " — 未登入時無 .shell（無從遺失 Workspace，因為根本不存在）", !window.document.querySelector(".shell"));
  });
}

console.log("\n==============================");
console.log("WorkspaceUIRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
