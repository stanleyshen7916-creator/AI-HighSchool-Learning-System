/* tests/regression/LoginPasswordRegression.js — Sprint AI-133（真實 PO
   需求）："新增一個輸入帳號/密碼的功能，首頁登入畫面後，需輸入密碼，
   才可進入本平台使用"。密碼輸入畫面放在「選擇學生/學校/學期」之後，
   按下「進入平台」才要求輸入——login.html 第 4 步（stepPassword）。

   2026-09-29 資安修正：正式站（已設定 Supabase）改由 Supabase Auth 驗證
   使用者輸入的密碼（AHS.AuthRepository.login()）；瀏覽器端不再推算或
   比對雲端帳號密碼，也不會在登入失敗時自動註冊新帳號。只有未設定
   Supabase 的離線／本機開發模式，才沿用 AHS.WorkspaceData 的本機密碼。

   Verifies — 離線模式 [1]～[6]：
   - Step 3 的「進入平台」先前進到第 4 步「輸入密碼」，尚未登入。
   - 密碼錯誤：顯示錯誤、isLoggedIn() 仍為 false、輸入框清空。
   - 密碼正確：setCurrent() 被呼叫，isLoggedIn() 變為 true。
   - 「上一步」回到第 3 步，學期選擇不遺失；Enter 鍵也能提交。
   Supabase 模式 [7]～[10]（fetch 以模擬的 Supabase Auth 端點取代）：
   - 輸入的密碼原樣送到 /auth/v1/token（email = <id>@ahs-mock.local）。
   - Supabase 拒絕 → 顯示「密碼錯誤」、不登入、絕不呼叫 /auth/v1/signup。
   - Supabase 接受 → 登入並導向。
   - 連線失敗 → 顯示連線錯誤，不登入，也不會退回本機密碼放行。
   - 本機開發密碼在 Supabase 模式下無效。
   - AuthRepository.js 原始碼不再含推算密碼或 signUp 呼叫。

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

const DEV_PASSWORD = "1234";            // AHS.WorkspaceData 的離線開發密碼
const CLOUD_PASSWORD = "Cloud-Only-9x"; // 模擬 Supabase 帳號的真實密碼

/* fakeSupabaseFetch(log, behavior) — emulates only what login needs:
   the password grant (session for CLOUD_PASSWORD, Supabase's real 400
   otherwise) and an empty PostgREST reply for everything else. Every
   call is recorded so the tests can assert what was (not) sent. */
function fakeSupabaseFetch(window, log, behavior) {
  function respond(status, body) {
    const text = JSON.stringify(body);
    return Promise.resolve({ ok: status >= 200 && status < 300, status: status, text: () => Promise.resolve(text) });
  }
  return function (url, init) {
    const body = init && init.body ? JSON.parse(init.body) : null;
    log.push({ url: String(url), body: body });
    if (behavior === "offline-network") { return Promise.reject(new window.Error("network down")); }
    if (/\/auth\/v1\/token\?grant_type=password/.test(url)) {
      if (body && body.password === CLOUD_PASSWORD) {
        return respond(200, { access_token: "t", refresh_token: "r", user: { id: "u-" + body.email, email: body.email } });
      }
      return respond(400, { error: "invalid_grant", error_description: "Invalid login credentials" });
    }
    return respond(200, []);
  };
}

/* loadPage(htmlFile, opts) — opts.mode:
     "offline"  Supabase not configured (SupabaseConfig blanked) — 本機開發模式
     "supabase" committed Supabase config + emulated Auth endpoint
     "network"  committed Supabase config, every fetch rejects */
function loadPage(htmlFile, opts) {
  opts = opts || {};
  const mode = opts.mode || "offline";
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    /* jsdom 沒有真正的 navigation 實作——window.location.assign() 在密碼
       正確、真的要導向平台時會觸發「Not implemented」訊息，這是 jsdom 本身
       的已知限制，過濾方式與本專案其他既有測試檔案完全一致。 */
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
  const fetchLog = [];
  window.fetch = fakeSupabaseFetch(window, fetchLog, mode === "network" ? "offline-network" : "auth");
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
    /* A developer machine may also have the git-ignored
       SupabaseConfig.local.js, which takes priority — blank both. */
    if (mode === "offline" && /^js\/data\/SupabaseConfig(\.local)?\.js$/.test(src)) {
      window.AHS.SupabaseConfig = { url: "", anonKey: "" };
      window.AHS.SupabaseConfigLocal = null;
    }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors, fetchLog };
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

function submitPassword(doc, password) {
  doc.querySelector(".login-password__input").value = password;
  click(doc.querySelector(".login-enter-btn"));
}

function settle() { return new Promise((resolve) => setTimeout(resolve, 20)); }

function errorText(doc) {
  const e = doc.querySelector(".login-error");
  return e ? e.textContent : "";
}

async function main() {
  console.log("Login Password Regression — Sprint AI-133（選學生/學校/學期後，進入平台前需輸入密碼）");

  /* ---- 1. Step 3「進入平台」前進到第 4 步，尚未真的登入 --------------- */
  console.log("\n[1] 離線模式 login.html — Step 3「進入平台」先前進到第 4 步「輸入密碼」");
  {
    const { window, consoleErrors } = loadPage("login.html");
    const doc = window.document;
    goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");

    check("真實前進到第 4 步（畫面顯示「輸入密碼」標題）",
      !!doc.querySelector(".login-step__title") && doc.querySelector(".login-step__title").textContent === "輸入密碼");
    check("密碼輸入框真實存在", !!doc.querySelector(".login-password__input"));
    check("尚未輸入密碼前，AHS.WorkspaceRuntime.isLoggedIn() 仍為 false（setCurrent 完全沒被呼叫）",
      window.AHS.WorkspaceRuntime.isLoggedIn() === false);

    const input = doc.querySelector(".login-password__input");
    const toggleBtn = doc.querySelector(".login-password__toggle");
    check("顯示/隱藏密碼按鈕真實存在", !!toggleBtn);
    check("密碼輸入框預設仍是遮蔽的 type=\"password\"", input.type === "password");
    input.value = DEV_PASSWORD;
    click(toggleBtn);
    check("點擊按鈕後，輸入框真實變成 type=\"text\"（明碼顯示）", input.type === "text");
    check("切換顯示後，密碼內容本身沒有被清空或改變", input.value === DEV_PASSWORD);
    click(toggleBtn);
    check("再點一次真實切回 type=\"password\"（重新遮蔽）", input.type === "password");

    check("Console errors = 0", consoleErrors.length === 0);
  }

  /* ---- 2. 密碼錯誤：真實顯示錯誤，不登入，輸入框清空 ------------------- */
  console.log("\n[2] 離線模式密碼錯誤 — 顯示錯誤訊息、未登入、輸入框清空");
  {
    const { window } = loadPage("login.html");
    const doc = window.document;
    goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");
    submitPassword(doc, "totally-wrong-password");

    check("真實顯示「密碼錯誤」錯誤訊息", errorText(doc).indexOf("密碼錯誤") !== -1);
    check("密碼錯誤時，AHS.WorkspaceRuntime.isLoggedIn() 仍誠實為 false", window.AHS.WorkspaceRuntime.isLoggedIn() === false);
    check("輸入框真實清空（不留下錯誤密碼原文供人偷看）", doc.querySelector(".login-password__input").value === "");
  }

  /* ---- 3. 密碼正確：真實呼叫 setCurrent()，isLoggedIn() 變 true -------- */
  console.log("\n[3] 離線模式密碼正確 — 真實呼叫 setCurrent()，isLoggedIn() 變為 true");
  {
    const { window } = loadPage("login.html");
    const doc = window.document;
    goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");
    submitPassword(doc, DEV_PASSWORD);

    check("密碼正確後，AHS.WorkspaceRuntime.isLoggedIn() 真實變為 true", window.AHS.WorkspaceRuntime.isLoggedIn() === true);
    const current = window.AHS.WorkspaceRuntime.getCurrent();
    check("真實登入的是 Student A、長榮中學、高一下學期（與畫面上選的完全一致）",
      !!current && current.studentId === "student_a" && current.schoolId === "cjsh" && current.semesterIds.indexOf("g1s2") !== -1);
  }

  /* ---- 4. 三位學生皆可用本機開發密碼登入（離線模式） ------------------- */
  console.log("\n[4] 離線模式 — Student A/Student B/Admin 皆可用本機開發密碼登入");
  {
    const cases = [["Student A", "長榮中學", "高一下學期"], ["Student B", "竹圍高中", "高二上學期"], ["Admin", "長榮中學", "高一下學期"]];
    cases.forEach(function (c) {
      const { window } = loadPage("login.html");
      goToPasswordStep(window.document, c[0], c[1], c[2]);
      submitPassword(window.document, DEV_PASSWORD);
      check(c[0] + " 用本機開發密碼登入成功", window.AHS.WorkspaceRuntime.isLoggedIn() === true);
    });
    const { window: winWrong } = loadPage("login.html");
    goToPasswordStep(winWrong.document, "Student A", "長榮中學", "高一下學期");
    submitPassword(winWrong.document, "0000");
    check("錯誤密碼仍真實被拒絕（不是隨便輸入都能進）", winWrong.AHS.WorkspaceRuntime.isLoggedIn() === false);
  }

  /* ---- 5. 上一步：從第 4 步真的能回到第 3 步，學期選擇不遺失 ----------- */
  console.log("\n[5] 「上一步」— 從第 4 步真的能回到第 3 步，先前勾選的學期不遺失");
  {
    const { window } = loadPage("login.html");
    const doc = window.document;
    goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");
    check("前置：真實在第 4 步", doc.querySelector(".login-step__title").textContent === "輸入密碼");

    click(doc.querySelector(".login-back"));
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
    input.value = DEV_PASSWORD;
    input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    check("按下 Enter 鍵後，AHS.WorkspaceRuntime.isLoggedIn() 真實變為 true（等同點擊按鈕）",
      window.AHS.WorkspaceRuntime.isLoggedIn() === true);
  }

  /* ---- 7. Supabase 模式：選學生不再偷偷登入；正確密碼由 Supabase 驗證 --- */
  console.log("\n[7] Supabase 模式 — 輸入的密碼原樣送 Supabase Auth 驗證，通過才登入");
  {
    const { window, fetchLog, consoleErrors } = loadPage("login.html", { mode: "supabase" });
    const doc = window.document;
    goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");
    check("選學生/學校/學期時完全沒有發出任何 Supabase 請求（不再於背景自動登入）", fetchLog.length === 0);

    submitPassword(doc, CLOUD_PASSWORD);
    check("送出後、Supabase 回應前尚未登入（等待真正驗證）", window.AHS.WorkspaceRuntime.isLoggedIn() === false);
    await settle();
    const tokenCalls = fetchLog.filter((c) => /\/auth\/v1\/token\?grant_type=password/.test(c.url));
    check("真實呼叫 Supabase password grant 一次", tokenCalls.length === 1);
    check("送出的是 student_a@ahs-mock.local 與使用者實際輸入的密碼",
      tokenCalls[0] && tokenCalls[0].body.email === "student_a@ahs-mock.local" && tokenCalls[0].body.password === CLOUD_PASSWORD);
    check("Supabase 接受後 isLoggedIn() 變為 true", window.AHS.WorkspaceRuntime.isLoggedIn() === true);
    check("Console errors = 0", consoleErrors.length === 0);
  }

  /* ---- 8. Supabase 模式：錯誤密碼 → 密碼錯誤，絕不自動註冊 ------------- */
  console.log("\n[8] Supabase 模式 — 錯誤密碼與本機開發密碼皆被拒絕，且絕不呼叫 signup");
  for (const typed of ["wrong-password", DEV_PASSWORD]) {
    const { window, fetchLog } = loadPage("login.html", { mode: "supabase" });
    const doc = window.document;
    goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");
    submitPassword(doc, typed);
    await settle();
    check("「" + typed + "」— 顯示「密碼錯誤」", errorText(doc).indexOf("密碼錯誤") !== -1);
    check("「" + typed + "」— 未登入", window.AHS.WorkspaceRuntime.isLoggedIn() === false);
    check("「" + typed + "」— 沒有任何 /auth/v1/signup 請求（不會替陌生密碼建立新帳號）",
      fetchLog.every((c) => !/\/auth\/v1\/signup/.test(c.url)));
    check("「" + typed + "」— 輸入框清空、可再次輸入",
      doc.querySelector(".login-password__input").value === "" && !doc.querySelector(".login-password__input").disabled);
  }

  /* ---- 9. Supabase 模式：連線失敗 → 顯示連線錯誤，不以本機密碼放行 ----- */
  console.log("\n[9] Supabase 模式連線失敗 — 顯示連線錯誤，不退回本機開發密碼放行");
  {
    const { window } = loadPage("login.html", { mode: "network" });
    const doc = window.document;
    goToPasswordStep(doc, "Student A", "長榮中學", "高一下學期");
    submitPassword(doc, DEV_PASSWORD);
    await settle();
    check("顯示「無法連線」訊息（而非誤導的密碼錯誤）", errorText(doc).indexOf("無法連線") !== -1);
    check("連線失敗時未登入", window.AHS.WorkspaceRuntime.isLoggedIn() === false);
  }

  /* ---- 10. 原始碼：不再推算密碼、不再自動註冊 --------------------------- */
  console.log("\n[10] js/repository/AuthRepository.js 原始碼不再含推算密碼或 signUp 呼叫");
  {
    const src = fs.readFileSync(path.join(REPO, "js/repository/AuthRepository.js"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    check("不含舊的推算密碼前綴 \"Ahs126B$\"", src.indexOf("Ahs126B$") === -1);
    check("不含任何 signUp( 呼叫", !/signUp\s*\(/.test(src));
    check("不再匯出 loginForMockStudent", src.indexOf("loginForMockStudent") === -1);
  }

  console.log("\nLoginPasswordRegression: " + pass + " PASS / " + fail + " FAIL");
  if (fail > 0) { process.exit(1); }
}

main().catch(function (err) {
  console.log("  FAIL  unexpected error: " + (err && err.stack || err));
  process.exit(1);
});
