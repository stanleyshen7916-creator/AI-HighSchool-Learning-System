/* tests/regression/WrongBookSortPagingRegression.js — 2026-11-01 使用者需求：
   「知識弱點的錯題列表，改成一頁 20 筆」「依照時間進行排序」。
   Verifies, on the real wrongbook.html with 25 real wrong records (created
   through the real Exam -> AutoGrader -> WrongBookRuntime chain on
   quiz.html, then given different lastError dates):
   - each page shows 20 rows（第 1 頁 20 筆、第 2 頁 5 筆），每頁顯示 20 筆;
   - the default order is by time, newest lastError first（排序選單預設「最新錯誤」）;
   - 「最早錯誤」 reverses it; ties on the same day keep newest-added first.
   Run: node tests/regression/WrongBookSortPagingRegression.js */
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

const DEFAULT_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };

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
  const seed = Object.assign({ "ahs:workspace": DEFAULT_WORKSPACE }, seedSession || {});
  Object.entries(seed).forEach(([k, v]) => window.sessionStorage.setItem(k, JSON.stringify(v)));
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => {
    var p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function dumpSession(window) {
  const dump = {};
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i);
    dump[k] = JSON.parse(window.sessionStorage.getItem(k));
  }
  return dump;
}


const N = 25;
function dateOf(i) { const d = new Date(Date.UTC(2026, 9, 1 + i)); return d.toISOString().slice(0, 10).replace(/-/g, "/"); }
/* Record i gets day (i * 7) % N so creation order != time order. */
const DAY = (i) => (i * 7) % N;

console.log("WrongBook Sort + Paging Regression — 一頁 20 筆、依時間排序");
const quiz = loadPage("quiz.html");
{
  const AHS = quiz.window.AHS;
  const qs = [];
  for (let i = 0; i < N; i++) {
    qs.push({ id: "sp" + i, index: i + 1, text: "排序測試題 " + i, options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
      correctAnswer: "A", knowledgePoint: "排序", explanation: "詳解" });
  }
  AHS.QuestionRuntime.importQuestions("wb_sort_paging", qs);
  const session = AHS.ExamRuntime.startFromExam("wb_sort_paging", { subject: "math", title: "排序測試" });
  qs.forEach((q) => AHS.AnswerRuntime.saveAnswer(session.examId, q.id, "B"));
  AHS.WrongBookRuntime.sync(AHS.AutoGrader.grade(AHS.ExamRuntime.finish(session.examId)));
  check("真實建立 25 筆錯題", AHS.WrongBookRuntime.list().length === N);
}
const seed = dumpSession(quiz.window);
let patched = 0;
Object.keys(seed).forEach((k) => {
  const v = seed[k];
  const items = v && Array.isArray(v.items) ? v.items : null;
  if (!items || !items.length || !("lastError" in items[0])) { return; }
  items.forEach((it) => {
    const i = Number(String(it.question).replace("排序測試題 ", ""));
    it.lastError = dateOf(DAY(i)); patched++;
  });
});
check("錯題日期已分散到 25 個不同日期", patched === N);

const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: seed });
const doc = window.document;
const visible = () => [...doc.querySelectorAll(".wb-row")].filter((r) => r.style.display !== "none");
const datesOf = (rows) => rows.map((r) => r.querySelector(".wb-row__date").textContent);
const sortSel = [...doc.querySelectorAll(".wb-select")].find((l) => l.querySelector(".wb-select__label").textContent === "排序").querySelector("select");

check("排序選單預設為「最新錯誤」", sortSel.value === "最新錯誤");
check("排序選單沒有舊的「預設」選項，有「最早錯誤」", ![...sortSel.options].some((o) => o.text === "預設") && [...sortSel.options].some((o) => o.text === "最早錯誤"));
const perPageEl = doc.querySelector(".wb-list__perpage");
check("顯示「每頁顯示 20 筆」", !!perPageEl && perPageEl.textContent === "每頁顯示 20 筆");

let rows = visible();
check("第 1 頁顯示 20 筆", rows.length === 20);
const all = Array.from({ length: N }, (_, d) => dateOf(d)).sort().reverse();
check("第 1 頁依時間排序：最近答錯的在最前面", JSON.stringify(datesOf(rows)) === JSON.stringify(all.slice(0, 20)));

const nextBtn = [...doc.querySelectorAll("button")].find((b) => /下一頁/.test(b.getAttribute("aria-label") || b.textContent));
check("有下一頁按鈕", !!nextBtn);
if (nextBtn) { nextBtn.click(); }
rows = visible();
check("第 2 頁顯示剩下的 5 筆", rows.length === 5);
check("第 2 頁接續時間順序", JSON.stringify(datesOf(rows)) === JSON.stringify(all.slice(20)));

sortSel.value = "最早錯誤";
sortSel.dispatchEvent(new window.Event("change", { bubbles: true }));
rows = visible();
check("改成「最早錯誤」回到第 1 頁，最早答錯的在最前面",
  rows.length === 20 && JSON.stringify(datesOf(rows)) === JSON.stringify(all.slice().reverse().slice(0, 20)));

check("Console errors = 0", consoleErrors.length === 0);

console.log("\nWrongBookSortPagingRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
