/* tests/regression/LoginPasswordRegression.js — Sprint AI-133（真實 PO
   需求）："新增一個輸入帳號/密碼的功能，首頁登入畫面後，需輸入密碼，
   才可進入本平台使用"。

   確認方案：
   - 每個學生各自一組密碼（AHS.WorkspaceData.students[].password）。
   - 純前端明碼比對，只作為一般訪客擋門用途，非真正資安等級保護（使用
     者已明確確認接受此定位）。
   - 密碼輸入畫面放在「選擇學生/學校/學期」之後，按下「進入平台」才
     要求輸入——login.html 新增第 4 步（stepPassword）。

   Verifies:
   - Step 3 的「進入平台」不再直接呼叫 AHS.WorkspaceRuntime.setCurrent()
     ／導向平台，而是先前進到第 4 步「輸入密碼」。
   - 密碼錯誤：真實顯示錯誤訊息、AHS.WorkspaceRuntime.isLoggedIn() 仍為
     false（setCurrent() 完全沒被呼叫），輸入框清空供重新輸入。
   - 密碼正確：AHS.WorkspaceRuntime.setCurrent() 真的被呼叫成功，
     isLoggedIn() 變為 true。
   - 不同學生的密碼互不相通（Student A 的密碼對 Student B 無效）。
   - 「上一步」從第 4 步真的能回到第 3 步，學期選擇不遺失。
   - Enter 鍵在密碼欄位也能觸發提交（不是只有滑鼠點擊按鈕才行）。

   Run: node tests/regression/LoginPasswordRegression.js */
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

function loadPage(htmlFile) {
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    /* jsdom 沒有真正的 navigation 實作——window.location.assign() 在密碼
       正確、真的要導向平台時會真實觸發這個「Not implemented」訊息，這是
       jsdom 環境本身的已知限制，不是這個功能的錯誤，過濾方式與本專案
       其他既有測試檔案完全一致。 */
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

function goToPasswordStep(doc, studentLabel, schoolLabel, semesterLabel) {
  const studentBtn = [...doc.querySelectorAll(".login-option")].find((b) => b.textContent.includes(studentLabel));
  click(studentBtn);
  const schoolBtn = [...doc.querySelectorAll(".login-option")].find((b) => b.textContent.includes(schoolLabel));
  click(schoolBtn);
  const semBtn = [...doc.querySelectorAll(".login-option--check")].find((b) => b.textContent.includes(semesterLabel));
  click(semBtn);
  click(doc.querySelector(".login-enter-btn"));
}

console.log("Login Password Regression — Sprint AI-133（選學生/學校/學期後，進入平台前需輸入密碼）");

/* ---- 1. Step 3「進入平台」前進到第 4 步，尚未真的登入 --------------- */
console.log("\n[1] login.html — Step 3「進入平台」不再直接登入，而是先前進到第 4 步「輸入密碼」");
{
  const { window, consoleErrors } = loadPage("login.html");
  const doc = window.document;
  goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");

  check("真實前進到第 4 步（畫面顯示「輸入密碼」標題）",
    !!doc.querySelector(".login-step__title") && doc.querySelector(".login-step__title").textContent === "輸入密碼");
  check("密碼輸入框真實存在", !!doc.querySelector(".login-password__input"));
  check("尚未輸入密碼前，AHS.WorkspaceRuntime.isLoggedIn() 仍為 false（setCurrent 完全沒被呼叫）",
    window.AHS.WorkspaceRuntime.isLoggedIn() === false);
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2. 密碼錯誤：真實顯示錯誤，不登入，輸入框清空 ------------------- */
console.log("\n[2] 密碼錯誤 — 真實顯示錯誤訊息，AHS.WorkspaceRuntime 仍未登入，輸入框清空供重新輸入");
{
  const { window } = loadPage("login.html");
  const doc = window.document;
  goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");

  const input = doc.querySelector(".login-password__input");
  input.value = "totally-wrong-password";
  click(doc.querySelector(".login-enter-btn"));

  check("真實顯示「密碼錯誤」錯誤訊息", doc.querySelector(".login-error") &&
    doc.querySelector(".login-error").textContent.indexOf("密碼錯誤") !== -1);
  check("密碼錯誤時，AHS.WorkspaceRuntime.isLoggedIn() 仍誠實為 false", window.AHS.WorkspaceRuntime.isLoggedIn() === false);
  check("輸入框真實清空（不留下錯誤密碼原文供人偷看）", doc.querySelector(".login-password__input").value === "");
}

/* ---- 3. 密碼正確：真實呼叫 setCurrent()，isLoggedIn() 變 true -------- */
console.log("\n[3] 密碼正確（Student A：studentA2026）— 真實呼叫 setCurrent()，isLoggedIn() 變為 true");
{
  const { window } = loadPage("login.html");
  const doc = window.document;
  goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");

  doc.querySelector(".login-password__input").value = "studentA2026";
  click(doc.querySelector(".login-enter-btn"));

  check("密碼正確後，AHS.WorkspaceRuntime.isLoggedIn() 真實變為 true", window.AHS.WorkspaceRuntime.isLoggedIn() === true);
  const current = window.AHS.WorkspaceRuntime.getCurrent();
  check("真實登入的是 Student A、長榮中學、高一下學期（與畫面上選的完全一致）",
    !!current && current.studentId === "student_a" && current.schoolId === "cjsh" && current.semesterIds.indexOf("g1s2") !== -1);
}

/* ---- 4. 不同學生密碼互不相通 ------------------------------------------ */
console.log("\n[4] 密碼互不相通 — Student B 的密碼對 Student A 的登入無效，反之亦然");
{
  const { window: winA } = loadPage("login.html");
  const docA = winA.document;
  goToPasswordStep(docA, "Student A", "長榮中學", "高一下學期");
  docA.querySelector(".login-password__input").value = "studentB2026";
  click(docA.querySelector(".login-enter-btn"));
  check("用 Student B 的密碼登入 Student A 真實失敗（不同學生密碼互不相通）", winA.AHS.WorkspaceRuntime.isLoggedIn() === false);

  const { window: winB } = loadPage("login.html");
  const docB = winB.document;
  goToPasswordStep(docB, "Student B", "長榮中學", "高一下學期");
  docB.querySelector(".login-password__input").value = "studentA2026";
  click(docB.querySelector(".login-enter-btn"));
  check("用 Student A 的密碼登入 Student B 真實失敗", winB.AHS.WorkspaceRuntime.isLoggedIn() === false);

  const { window: winAdmin } = loadPage("login.html");
  const docAdmin = winAdmin.document;
  goToPasswordStep(docAdmin, "Admin", "長榮中學", "高一下學期");
  docAdmin.querySelector(".login-password__input").value = "admin2026";
  click(docAdmin.querySelector(".login-enter-btn"));
  check("Admin 用自己真實的密碼登入成功", winAdmin.AHS.WorkspaceRuntime.isLoggedIn() === true);
}

/* ---- 5. 上一步：從第 4 步真的能回到第 3 步，學期選擇不遺失 ----------- */
console.log("\n[5] 「上一步」— 從第 4 步真的能回到第 3 步，先前勾選的學期不遺失");
{
  const { window } = loadPage("login.html");
  const doc = window.document;
  goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");
  check("前置：真實在第 4 步", doc.querySelector(".login-step__title").textContent === "輸入密碼");

  const backBtn = doc.querySelector(".login-back");
  click(backBtn);
  check("點擊「上一步」後真實回到第 3 步（選擇學期）", doc.querySelector(".login-step__title").textContent === "選擇學期（可複選）");
  const checkedSem = doc.querySelector(".login-option--check.is-checked");
  check("先前勾選的「高一下學期」真實還保留勾選狀態（沒有被重置）",
    !!checkedSem && checkedSem.textContent.indexOf("高一下學期") !== -1);
}

/* ---- 6. Enter 鍵在密碼欄位也能觸發提交 -------------------------------- */
console.log("\n[6] 密碼欄位按下 Enter 鍵也能真實觸發提交（非只有滑鼠點擊按鈕才行）");
{
  const { window } = loadPage("login.html");
  const doc = window.document;
  goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");

  const input = doc.querySelector(".login-password__input");
  input.value = "studentA2026";
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

  check("按下 Enter 鍵後，AHS.WorkspaceRuntime.isLoggedIn() 真實變為 true（等同點擊按鈕）",
    window.AHS.WorkspaceRuntime.isLoggedIn() === true);
}

console.log("\nLoginPasswordRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
