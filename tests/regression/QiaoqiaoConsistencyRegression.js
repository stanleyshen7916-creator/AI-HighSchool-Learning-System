/* tests/regression/QiaoqiaoConsistencyRegression.js — AI-130 (real PO
   report). Verifies:
   - Topbar Workspace chip's displayed name now tracks the SAME real,
     user-editable AHS.SettingsRuntime profile.name the user menu already
     showed — no more two different names for the same logged-in person
     in the same topbar (only the display label changed; wsLabel's own
     studentId/schoolName/semesterNames — the real Workspace-scoping
     identity — are untouched).
   - AHS.Qiaoqiao.randomBust()/randomFull() are real, additive functions
     that return a real <img> each call, and produce more than one
     distinct expression/pose across repeated calls (not a fixed image).
   - js/ui/TutorContextTip.js's badge is now 巧巧老師's own bust (a real
     qiaoqiao-img asset), not the old generic AHS.Icons.tutor() icon.

   Run: node tests/regression/QiaoqiaoConsistencyRegression.js */
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

/* AHS_TEST_NS / namespacedKey — same convention KnowledgeEngineRegression.js
   already established: AHS.PersistenceAdapter namespaces every key except
   the bare "ahs:workspace" one under "ahs:<studentId>__<schoolId>__<sem...>:"
   once a real Workspace is active, so a seed like "ahs:settings" has to be
   rewritten to the real effective key or it silently seeds a key nothing
   ever reads. */
const AHS_TEST_NS = "student_a__cjsh__g1s2";
function namespacedKey(k) {
  if (k === "ahs:workspace") { return k; }
  const nsPrefix = "ahs:" + AHS_TEST_NS + ":";
  if (k.indexOf(nsPrefix) === 0) { return k; }
  if (k.indexOf("ahs:") === 0) { return "ahs:" + AHS_TEST_NS + ":" + k.slice(4); }
  return k;
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
    Object.entries(seedSession).forEach(([k, v]) => window.sessionStorage.setItem(namespacedKey(k), JSON.stringify(v)));
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

console.log("Qiaoqiao Consistency Regression — AI-130");

/* ---- 1. Workspace chip 與使用者選單顯示同一個真實名稱 ------------------ */
console.log("\n[1] Topbar — Workspace chip 與使用者選單顯示同一個真實名稱（不再是兩個不同名字）");
{
  const SEED = {
    "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] },
    "ahs:settings": { profile: { name: "愛因斯坦", grade: "高中生" }, showTutorSuggestions: true, aiGatewayEnabled: false }
  };
  const { window, consoleErrors } = loadPage("index.html", { seedSession: SEED });

  const chip = window.document.querySelector(".topbar__workspace-chip strong");
  const userNameEl = window.document.querySelector(".topbar__user-meta strong");
  check("Workspace chip 真實存在", !!chip);
  check("使用者選單真實存在", !!userNameEl);
  check("Workspace chip 顯示使用者自訂的真實顯示名稱「愛因斯坦」（非固定的 Student A demo 名稱）",
    !!chip && chip.textContent === "愛因斯坦");
  check("Workspace chip 與使用者選單顯示完全相同的名稱（單一真實來源，不再兩個不同名字）",
    !!chip && !!userNameEl && chip.textContent === userNameEl.textContent);

  const wsChipAria = window.document.querySelector(".topbar__workspace-chip").getAttribute("aria-label");
  check("Workspace chip 的 aria-label 也採用同一個真實名稱", wsChipAria.indexOf("愛因斯坦") !== -1);
  check("Workspace chip 仍保留真實學校／學期資訊（只換了顯示名稱，Workspace 真實範圍未受影響）",
    wsChipAria.indexOf("長榮中學") !== -1);

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 2. 未自訂顯示名稱時，兩處仍一致（沿用既有 seed 行為） ------------- */
console.log("\n[2] Topbar — 尚未自訂顯示名稱時，Workspace chip 與使用者選單仍一致（沿用 SettingsRuntime 既有的 seed 行為）");
{
  const SEED = { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] } };
  const { window, consoleErrors } = loadPage("index.html", { seedSession: SEED });

  const chip = window.document.querySelector(".topbar__workspace-chip strong");
  const userNameEl = window.document.querySelector(".topbar__user-meta strong");
  check("兩處名稱一致（都真實反映 WorkspaceData 的 student.name，因為 profile.name 尚未被使用者自訂）",
    !!chip && !!userNameEl && chip.textContent === userNameEl.textContent);

  check("Console errors = 0", consoleErrors.length === 0);
}

/* ---- 3. AHS.Qiaoqiao.randomBust()/randomFull() — 真實隨機、非固定圖片 -- */
console.log("\n[3] AHS.Qiaoqiao — randomBust()/randomFull() 真實存在，且多次呼叫會產生不只一種表情/姿勢");
{
  const { window } = loadPage("index.html");
  const Q = window.AHS.Qiaoqiao;
  check("randomBust 是真實函式", typeof Q.randomBust === "function");
  check("randomFull 是真實函式", typeof Q.randomFull === "function");

  const bustSrcs = new Set();
  const fullSrcs = new Set();
  for (let i = 0; i < 60; i++) {
    const bustHtml = Q.randomBust();
    const fullHtml = Q.randomFull();
    const bustMatch = /src="([^"]+)"/.exec(bustHtml);
    const fullMatch = /src="([^"]+)"/.exec(fullHtml);
    if (bustMatch) { bustSrcs.add(bustMatch[1]); }
    if (fullMatch) { fullSrcs.add(fullMatch[1]); }
  }
  check("randomBust() 60 次呼叫中，真的出現超過一種表情圖片（非每次固定同一張）", bustSrcs.size > 1);
  check("randomFull() 60 次呼叫中，真的出現超過一種姿勢圖片（非每次固定同一張）", fullSrcs.size > 1);
  check("randomBust() 每次都回傳真實的 <img> 標籤（非空字串/非 undefined）",
    /<img[^>]+qiaoqiao-img--bust/.test(Q.randomBust()));
  check("randomFull() 每次都回傳真實的 <img> 標籤（非空字串/非 undefined）",
    /<img[^>]+qiaoqiao-img--full/.test(Q.randomFull()));

  check("既有 bust(key)/full(key) 明確指定表情時仍完全不受影響（向下相容）",
    Q.bust("gentle").indexOf("expr-gentle.png") !== -1 && Q.full("reading").indexOf("pose-reading.png") !== -1);
}

/* ---- 4. TutorContextTip — 徽章改為巧巧老師本人（非通用圖示） ----------- */
console.log("\n[4] TutorContextTip — 提示徽章真實換成巧巧老師本人的 bust，不再是通用 AHS.Icons.tutor() 圖示");
{
  /* Sprint AI-138: showTutorSuggestions now defaults to false (AI Tutor
     暫無真實 API，PO 決定暫時隱藏) — explicitly seeded true so this test
     keeps proving TutorContextTip's own real rendering behavior. */
  const { window } = loadPage("quiz.html", {
    seedSession: {
      "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] },
      "ahs:settings": { showTutorSuggestions: true }
    }
  });
  const AHS = window.AHS;
  // Seed a real wrong item so StatisticsRuntime.learningContext() has a
  // real weakestKnowledgePoint, so TutorMessage.build() returns a real
  // (non-null) message and TutorContextTip.create() actually mounts.
  AHS.QuestionRuntime.importQuestions("qct_test", [
    { id: "qct1", index: 1, subject: "biology", text: "t", type: "single_choice",
      options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A",
      knowledgePoint: "測試知識點", materialId: "mat_qct" }
  ]);
  const session = AHS.ExamRuntime.startFromExam("qct_test", { subject: "biology", title: "測試教材" });
  AHS.AnswerRuntime.saveAnswer(session.examId, "qct1", "B");
  const finished = AHS.ExamRuntime.finish(session.examId);
  const graded = AHS.AutoGrader.grade(finished);
  AHS.WrongBookRuntime.sync(graded);

  const tipEl = AHS.TutorContextTip.create({ page: "quiz" });
  check("TutorContextTip 真實掛載（有真實學習資料，非 null）", !!tipEl);
  if (tipEl) {
    const badge = tipEl.querySelector(".tutor-tip__icon");
    check("徽章使用共用的 qiaoqiao-bust 框架（與其他提示位置一致）", !!badge && badge.classList.contains("qiaoqiao-bust"));
    const img = badge ? badge.querySelector(".qiaoqiao-img") : null;
    check("徽章內容真的是巧巧老師的真實 bust 圖片（非 AHS.Icons.tutor() 的通用圖示 SVG）", !!img && img.tagName === "IMG");
    check("徽章不再包含舊的通用 tutor icon SVG", !badge || !badge.querySelector("svg"));
  }
}

console.log("\nQiaoqiaoConsistencyRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
