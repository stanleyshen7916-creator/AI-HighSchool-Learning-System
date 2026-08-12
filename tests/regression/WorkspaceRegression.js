/* tests/regression/WorkspaceRegression.js — Sprint AI-119 (Platform Core
   Baseline) Workspace/Login/Permission/Gate regression. Real, end-to-end
   proof (via jsdom, same discipline as every other suite in this repo)
   that: (1) the Login flow (login.html) only ever shows a Student the
   School/Semester options they're actually authorized for, (2)
   AHS.WorkspaceRuntime.setCurrent() genuinely rejects an unauthorized
   combination rather than trusting the caller, (3) AHS.AppShell's Login
   gate genuinely blocks rendering when no Workspace is active and
   genuinely renders when one is, (4) AHS.PersistenceAdapter's Workspace
   namespacing is backward-compatible (no Workspace = legacy key) and
   real once a Workspace exists, (5) logout only clears the Workspace
   pointer, never other real Learning State.

   Same-tab, Student-A-vs-Student-B cross-navigation isolation (the
   actual multi-user PAT scenario) is a real-browser, same-context test
   — jsdom's loadPage() creates a brand new sessionStorage per call, so
   that class of test lives in playwright/tests/workspace.spec.js
   instead, not duplicated here.

   Run: node tests/regression/WorkspaceRegression.js */
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

/* loadPage(htmlFile, opts) — deliberately does NOT auto-seed a default
   Workspace (unlike every other regression suite's own loadPage()) —
   this file's entire purpose is to control the Workspace state itself,
   test by test. */
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

console.log("Workspace Regression — Sprint AI-119 (Platform Core Baseline)");

/* ---- 1. WorkspaceData / WorkspaceRuntime — static shape + permission filtering --- */
console.log("\n[1] WorkspaceData／WorkspaceRuntime — Student/School/Semester + Permission 過濾");
{
  const { window } = loadPage("login.html");
  const A = window.AHS;
  check("3 位 Student（Admin/Student A/Student B）", A.WorkspaceRuntime.students().length === 3);
  check("1 所 School（長榮中學）", A.WorkspaceRuntime.schools().length === 1);
  check("5 個 Semester（高一下～高三下）", A.WorkspaceRuntime.semesters().length === 5);
  check("Admin 被授權全部 5 個 Semester", A.WorkspaceRuntime.semestersFor("admin").length === 5);
  check("Student A 被授權 2 個 Semester（示範複選/跨學期）", A.WorkspaceRuntime.semestersFor("student_a").length === 2);
  check("Student B 僅被授權 1 個 Semester（示範隔離）", A.WorkspaceRuntime.semestersFor("student_b").length === 1);
  check("Student B 看不到「高二上學期」（Student A 才有的授權）",
    !A.WorkspaceRuntime.semestersFor("student_b").some((s) => s.id === "g2s1"));
}

/* ---- 2. setCurrent() 真實驗證權限，不信任呼叫端 ---- */
console.log("\n[2] AHS.WorkspaceRuntime.setCurrent() — 真實權限驗證");
{
  const { window } = loadPage("login.html");
  const A = window.AHS;
  const ok = A.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2", "g2s1"] });
  check("合法組合（Student A + 長榮中學 + 高一下/高二上）成功登入", !!ok);
  check("isLoggedIn() 反映真實登入狀態", A.WorkspaceRuntime.isLoggedIn() === true);
  A.WorkspaceRuntime.logout();
  const badSchool = A.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "not_a_real_school", semesterIds: ["g1s2"] });
  check("未授權 School 直接拒絕（回傳 null，不寫入）", badSchool === null && !A.WorkspaceRuntime.isLoggedIn());
  const badSemester = A.WorkspaceRuntime.setCurrent({ studentId: "student_b", schoolId: "cjsh", semesterIds: ["g2s1"] });
  check("Student B 選擇未授權的「高二上」直接拒絕（Student B 只有高一下）", badSemester === null && !A.WorkspaceRuntime.isLoggedIn());
  const mixed = A.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2", "g3s2"] });
  check("部分合法/部分越權：僅濾掉越權的 Semester，合法子集仍登入成功", !!mixed && mixed.semesterIds.length === 1 && mixed.semesterIds[0] === "g1s2");
}

/* ---- 3. storageNamespace() 穩定、與 Semester 選取順序無關 ---- */
console.log("\n[3] storageNamespace() — 命名空間穩定，選取順序不影響結果");
{
  const { window } = loadPage("login.html");
  const A = window.AHS;
  A.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1", "g1s2"] });
  const ns1 = A.WorkspaceRuntime.storageNamespace();
  A.WorkspaceRuntime.logout();
  A.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2", "g2s1"] });
  const ns2 = A.WorkspaceRuntime.storageNamespace();
  check("同一組 Semester，不同點選順序 -> 相同命名空間（真正隔離，非因順序意外分裂）", ns1 === ns2 && !!ns1);
  A.WorkspaceRuntime.logout();
  check("登出後 storageNamespace() 回到空字串（PersistenceAdapter 退回 legacy key）", A.WorkspaceRuntime.storageNamespace() === "");
}

/* ---- 4. PersistenceAdapter — 向下相容（未登入 = legacy key），登入後才真正隔離 ---- */
console.log("\n[4] AHS.PersistenceAdapter — 未登入向下相容／登入後真實命名空間隔離");
{
  const { window } = loadPage("login.html");
  const A = window.AHS;
  A.PersistenceAdapter.save("materialRuntime", { probe: "legacy" });
  check("未登入時使用 legacy key（ahs:materialRuntime，無命名空間）",
    window.sessionStorage.getItem("ahs:materialRuntime") !== null);
  A.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] });
  A.PersistenceAdapter.save("materialRuntime", { probe: "namespaced" });
  check("登入後改用命名空間 key（ahs:student_a__cjsh__g1s2:materialRuntime）",
    window.sessionStorage.getItem("ahs:student_a__cjsh__g1s2:materialRuntime") !== null);
  check("命名空間 key 與先前的 legacy key 彼此獨立（legacy 值未被覆蓋）",
    JSON.parse(window.sessionStorage.getItem("ahs:materialRuntime")).probe === "legacy");
  check("load() 讀到的是目前 Workspace 自己的值（namespaced），不是 legacy 殘留",
    A.PersistenceAdapter.load("materialRuntime").probe === "namespaced");
  A.PersistenceAdapter.saveGlobal("__probe_global__", { v: 1 });
  check("saveGlobal/loadGlobal 繞過命名空間（給 Workspace 指標自己用，不因 Workspace 而變）",
    window.sessionStorage.getItem("ahs:__probe_global__") !== null &&
    A.PersistenceAdapter.loadGlobal("__probe_global__").v === 1);
}

/* ---- 5. Login Flow — 3 步驟、依 Student 過濾、複選、進入平台前驗證 ---- */
console.log("\n[5] Login Flow（login.html）— Step1 學生/Step2 學校/Step3 學期（複選），皆真實依權限過濾");
{
  const { window, consoleErrors } = loadPage("login.html");
  const doc = window.document;
  const step1Options = [...doc.querySelectorAll(".login-option__label")].map((n) => n.textContent);
  check("Step 1 顯示全部 3 位學生", step1Options.length === 3 && step1Options.includes("Student B"));
  const studentBBtn = [...doc.querySelectorAll(".login-option")].find((b) => b.textContent.includes("Student B"));
  studentBBtn.click();
  const step2Options = [...doc.querySelectorAll(".login-option__label")].map((n) => n.textContent);
  check("Step 2（Student B）僅顯示其被授權的「長榮中學」", step2Options.length === 1 && step2Options[0] === "長榮中學");
  doc.querySelector(".login-option").click();
  const step3Labels = [...doc.querySelectorAll(".login-option__label")].map((n) => n.textContent);
  check("Step 3（Student B）僅顯示其被授權的「高一下學期」，看不到「高二上學期」",
    step3Labels.length === 1 && step3Labels[0] === "高一下學期");
  const enterBtn = doc.querySelector(".login-enter-btn");
  check("未勾選任何學期前，「進入平台」為 disabled", enterBtn.hasAttribute("disabled"));
  doc.querySelector(".login-option--check").click();
  check("勾選學期後，「進入平台」變為可點擊", !doc.querySelector(".login-enter-btn").hasAttribute("disabled"));
  check("Console errors = 0（Login Flow 全程）", consoleErrors.length === 0);
}

/* ---- 6. AppShell Login Gate — 未登入導向 login.html，不渲染任何頁面內容 ---- */
console.log("\n[6] AHS.AppShell Login Gate — 未登入時不得渲染，導向 login.html");
{
  const { window, consoleErrors } = loadPage("index.html");
  const doc = window.document;
  check("未登入時 .shell 不存在（AppShell.create() 回傳 null，頁面未渲染）", !doc.querySelector(".shell"));
  check("Console errors = 0（僅有預期的 jsdom navigation 噪音，已由 loadPage 過濾）", consoleErrors.length === 0);
}

/* ---- 7. AppShell Login Gate — 已登入時正常渲染，Topbar 顯示真實 Workspace ---- */
console.log("\n[7] AHS.AppShell Login Gate — 已登入時正常渲染，Topbar 顯示真實 Current Workspace");
{
  const { window, consoleErrors } = loadPage("index.html", {
    seedSession: { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2", "g2s1"] } }
  });
  const doc = window.document;
  check(".shell 正常渲染（已登入，未被導向）", !!doc.querySelector(".shell"));
  const chip = doc.querySelector(".topbar__workspace-chip");
  check("Topbar 顯示 Current Workspace 卡片（§7 固定顯示）", !!chip);
  check("卡片內容包含真實 Student 名稱（Student A）", !!chip && chip.textContent.includes("Student A"));
  check("卡片內容包含真實 School 名稱（長榮中學）", !!chip && chip.textContent.includes("長榮中學"));
  check("複選 Semester 皆完整顯示（高一下學期、高二上學期）",
    !!chip && chip.textContent.includes("高一下學期") && chip.textContent.includes("高二上學期"));
  check("Console errors = 0（已登入首頁）", consoleErrors.length === 0);
}

/* ---- 8. Logout — 只清 Workspace 指標，不清其他 Workspace 的真實資料 ---- */
console.log("\n[8] 登出（doLogout）— 只清除 Workspace 指標，不清空其他 Workspace 的 Learning State");
{
  const { window } = loadPage("index.html", {
    seedSession: {
      "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] },
      "ahs:student_a__cjsh__g1s2:materialRuntime": { materials: [{ id: "probe_1" }], folders: [], seq: 1, folderSeq: 0 }
    }
  });
  const doc = window.document;
  const logoutBtn = [...doc.querySelectorAll(".sidebar__item")].find((b) => b.textContent.includes("登出"));
  check("Sidebar 存在真實「登出」按鈕", !!logoutBtn);
  logoutBtn.click();
  check("登出後 Workspace 指標已清除（isLoggedIn() = false）", window.AHS.WorkspaceRuntime.isLoggedIn() === false);
  check("登出後 Student A 的 materialRuntime 真實資料仍完整保留（非全域 clear()）",
    window.sessionStorage.getItem("ahs:student_a__cjsh__g1s2:materialRuntime") !== null &&
    JSON.parse(window.sessionStorage.getItem("ahs:student_a__cjsh__g1s2:materialRuntime")).materials[0].id === "probe_1");
}

console.log("\n==============================");
console.log("WorkspaceRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
