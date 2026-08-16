/* tests/regression/LoginRenameSyncRegression.js — AI-131 (real PO
   report): "使用者名稱已更名，重新登入時沒有同步更動". login.html's
   選擇學生 (Step 1) step used to always show AHS.WorkspaceData's static
   seed name ("Student A") even for a student who had genuinely renamed
   themselves via Settings under a previously-picked Workspace — no
   Workspace is active yet at this step, so the rename (saved under a
   namespaced key like "ahs:student_a__cjsh__g1s2:settings") was
   invisible to this pre-login screen. Verifies
   AHS.PersistenceAdapter.findFirstForNamespacePrefix() finds that real
   saved name and js/pages/AppLogin.js's 選擇學生 list now shows it,
   while a student who never touched Settings still honestly shows the
   real static seed name (never a fabricated default).

   Run: node tests/regression/LoginRenameSyncRegression.js */
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
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function studentRowLabels(window) {
  return [...window.document.querySelectorAll(".login-option")].map((row) => {
    const label = row.querySelector(".login-option__label");
    return label ? label.textContent : null;
  });
}

console.log("Login Rename Sync Regression — AI-131");

/* ---- 1. 曾在某個 Workspace 下改過顯示名稱，登入畫面選擇學生真的同步 --- */
console.log("\n[1] login.html 選擇學生 — 曾在某 Workspace 下自訂過顯示名稱時，真的顯示那個真實名稱（非固定 demo 名稱）");
{
  // A previous real session, under student_a + cjsh + g1s2, saved a real
  // custom profile.name via Settings — this is exactly what
  // AHS.PersistenceAdapter.save("settings", ...) writes to under that
  // Workspace's own real namespace.
  const SEED = { "ahs:student_a__cjsh__g1s2:settings": { profile: { name: "愛因斯坦", grade: "高中生" }, showTutorSuggestions: true, aiGatewayEnabled: false } };
  const { window, consoleErrors } = loadPage("login.html", { seedSession: SEED });

  const labels = studentRowLabels(window);
  check("選擇學生列表真實存在 3 位（Admin／Student A／Student B）", labels.length === 3);
  check("student_a 這一列真實顯示使用者自訂過的名稱「愛因斯坦」，不是固定的 demo 名稱「Student A」",
    labels.indexOf("愛因斯坦") !== -1 && labels.indexOf("Student A") === -1);
  check("其他從未自訂過名稱的學生，仍誠實顯示真實的 demo 名稱（Admin／Student B），不是被改壞",
    labels.indexOf("Admin") !== -1 && labels.indexOf("Student B") !== -1);

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2. 從未自訂過名稱時，誠實顯示原本的真實 demo 名稱（不捏造） -------- */
console.log("\n[2] login.html 選擇學生 — 完全沒有任何自訂記錄時，誠實顯示原本真實的 demo 名稱");
{
  const { window, consoleErrors } = loadPage("login.html");
  const labels = studentRowLabels(window);
  check("三位學生都顯示真實的 demo 名稱（Admin／Student A／Student B）",
    labels.indexOf("Admin") !== -1 && labels.indexOf("Student A") !== -1 && labels.indexOf("Student B") !== -1);
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 3. 同一位學生在「不同」Workspace 下改過名稱，也找得到（跨命名空間） */
console.log("\n[3] login.html 選擇學生 — 自訂名稱是存在另一個學校/學期組合下時，仍找得到真實記錄");
{
  const SEED = { "ahs:student_b__cjsh__g2s1:settings": { profile: { name: "小明", grade: "高二" }, showTutorSuggestions: true, aiGatewayEnabled: false } };
  const { window, consoleErrors } = loadPage("login.html", { seedSession: SEED });
  const labels = studentRowLabels(window);
  check("student_b 顯示在另一個 Workspace 命名空間下真實存過的自訂名稱「小明」",
    labels.indexOf("小明") !== -1 && labels.indexOf("Student B") === -1);
  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 4. AHS.PersistenceAdapter.findFirstForNamespacePrefix — 單元檢查 -- */
console.log("\n[4] AHS.PersistenceAdapter.findFirstForNamespacePrefix — 真實掃描、只回傳前綴匹配、never throws");
{
  const { window } = loadPage("login.html", {
    seedSession: {
      "ahs:student_a__cjsh__g1s2:settings": { profile: { name: "愛因斯坦" } },
      "ahs:other_key": { unrelated: true }
    }
  });
  const PA = window.AHS.PersistenceAdapter;
  const found = PA.findFirstForNamespacePrefix("student_a__", "settings");
  check("真實找到 student_a 命名空間下的 settings", !!found && found.profile.name === "愛因斯坦");
  check("查無資料的學生回傳 null（不捏造）", PA.findFirstForNamespacePrefix("nonexistent_student__", "settings") === null);
  check("never throws（空參數也安全）", PA.findFirstForNamespacePrefix("", "") === null);
}

console.log("\nLoginRenameSyncRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
