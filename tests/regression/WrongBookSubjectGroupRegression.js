/* tests/regression/WrongBookSubjectGroupRegression.js — 2026-11-09（使用者需求：
   錯題內容必須依照科目進行分類）.

   Zero network calls: AHS.SyncBridge / AHS.RepositoryFactory are recording fakes.

   Verifies:
   - 雲端撈回的紀錄 subjectCodeFor() 查不到科目時，依題號所屬教材補上科目代號。
   - 教材查不到時保留空字串，不猜。
   - 知識弱點列表依科目分組，每組有科目標題與題數。

   Run: node tests/regression/WrongBookSubjectGroupRegression.js */
"use strict";
const path = require("path");
const { JSDOM } = require("jsdom");
const REPO = path.join(__dirname, "..", "..");

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const memoryStore = {};
global.window = global;
window.sessionStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null),
  setItem: (k, v) => { memoryStore[k] = String(v); },
  removeItem: (k) => { delete memoryStore[k]; }
};
require(path.join(REPO, "js/core/Icons.js"));
require(path.join(REPO, "js/core/PersistenceAdapter.js"));
require(path.join(REPO, "js/runtime/WrongBookRuntime.js"));
AHS.TeachingMaterialData = [
  { materialId: "tm_1", material: { subject: "數學" }, questions: [] },
  { materialId: "tm_2", material: { subject: "英文" }, questions: [] }
];
let pushes = [];
AHS.SyncBridge = {
  isConfigured: () => true,
  identity: () => ({ userId: "u1", studentProfileId: "p1" }),
  subjectIdFor: () => Promise.resolve("subject-uuid"),
  subjectCodeFor: () => Promise.resolve(null),
  pushFireAndForget: (factory) => { pushes.push(factory()); }
};
const remoteRows = [
  { id: "r1", local_question_id: "tm_1_q3", subject_id: "x", knowledge_point: "向量", question_text: "Q1", your_answer: "A", correct_answer: "B", error_count: 1, correct_streak: 0 },
  { id: "r2", local_question_id: "tm_2_q5", subject_id: "y", knowledge_point: "聽力", question_text: "Q2", your_answer: "A", correct_answer: "B", error_count: 1, correct_streak: 0 },
  { id: "r3", local_question_id: "tm_1_q9", subject_id: null, knowledge_point: "向量", question_text: "Q3", your_answer: "A", correct_answer: "B", error_count: 1, correct_streak: 0 },
  { id: "r4", local_question_id: "zz_1", subject_id: null, knowledge_point: "其他", question_text: "Q4", your_answer: "A", correct_answer: "B", error_count: 1, correct_streak: 0 }
];
AHS.RepositoryFactory = {
  create: () => ({
    read: (table) => Promise.resolve({ data: table === "wrong_book" ? remoteRows : [], error: null }),
    insert: (t, row) => Promise.resolve({ data: [Object.assign({ id: "n" }, row)], error: null }),
    update: (t, q, row) => Promise.resolve({ data: [row], error: null })
  })
};

(async function () {
  const RT = AHS.WrongBookRuntime;
  await RT.pullFromRepository();
  const bySq = {};
  RT.list().forEach((it) => { bySq[it.questionId] = it.subject; });
  check("tm_1_q3 依教材補為 math", bySq["tm_1_q3"] === "math");
  check("tm_2_q5 依教材補為 english", bySq["tm_2_q5"] === "english");
  check("沒有 subject_id 也依教材補為 math", bySq["tm_1_q9"] === "math");
  check("查不到教材保留空字串", bySq["zz_1"] === "");
  check("subjectFromSource 有輸出", typeof RT.subjectFromSource === "function");

  /* 列表分組：在真實的 wrongbook.html 上檢查。 */
  const fs = require("fs");
  function loadPage(seed) {
    const html = fs.readFileSync(path.join(REPO, "wrongbook.html"), "utf8");
    const vconsole = new (require("jsdom").VirtualConsole)();
    const errors = [];
    vconsole.on("error", (m) => errors.push(String(m)));
    vconsole.on("jsdomError", (e) => {
      const m = String((e && e.message) || e);
      if (!/Could not load link|Could not parse CSS|not implemented/i.test(m)) { errors.push(m); }
    });
    const dom = new JSDOM(html, { url: "https://ahs.test/wrongbook.html", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vconsole });
    const w = dom.window;
    w.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
    Object.entries(seed).forEach(([k, v]) => w.sessionStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)));
    [...w.document.querySelectorAll("script[src]")].map((x) => x.getAttribute("src")).forEach((src) => {
      const f = path.join(REPO, src);
      if (fs.existsSync(f)) { w.eval(fs.readFileSync(f, "utf8")); }
    });
    w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
    return { w, errors };
  }
  const ws = { "ahs:workspace": { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] } };
  const first = loadPage(ws);
  const mk = (n, qid, kp) => ({ id: "wb_" + n, questionId: qid, subject: "", knowledgePoint: kp, question: "題目 " + n,
    yourAnswer: "A", correctAnswer: "B", options: [], errorCount: 1, correctStreak: 0, correctCount: 0, lastError: "2026/11/0" + n, firstError: "2026/11/0" + n });
  first.w.AHS.PersistenceAdapter.save("wrongBookRuntime", { seq: 4, items: [
    mk(1, "tm_48_q1", "聽力"), mk(2, "tm_1_q1", "正弦定理"), mk(3, "zz_1", "其他"), mk(4, "tm_7_q1", "疊合")
  ] });
  const seed = {};
  for (let i = 0; i < first.w.sessionStorage.length; i++) {
    const k = first.w.sessionStorage.key(i);
    seed[k] = first.w.sessionStorage.getItem(k);
  }
  const { w, errors } = loadPage(seed);
  const doc = w.document;
  const heads = [...doc.querySelectorAll(".wb-list__group")].map((h) => h.textContent);
  check("有三個科目標題（數學、英文、未分類）", heads.length === 3);
  check("依平台科目順序：英文在前（1 題）", /英文/.test(heads[0] || "") && /1 題/.test(heads[0] || ""));
  check("數學第二，兩題歸在同一組（2 題）", /數學/.test(heads[1] || "") && /2 題/.test(heads[1] || ""));
  check("未分類放最後", /未分類/.test(heads[2] || ""));
  const chips = [...doc.querySelectorAll(".wb-row .chip")].map((c) => c.textContent);
  check("錯題列顯示真實科目，只有查不到教材的那筆是佔位字", chips.length === 4 && chips.filter((t) => t === "科目").length === 1);
  const subjSel = [...doc.querySelectorAll(".wb-select")].find((l) => l.querySelector(".wb-select__label").textContent === "科目").querySelector("select");
  subjSel.value = "英文";
  subjSel.dispatchEvent(new w.Event("change", { bubbles: true }));
  const shown = [...doc.querySelectorAll(".wb-row")].filter((r) => r.style.display !== "none");
  const heads2 = [...doc.querySelectorAll(".wb-list__group")].map((h) => h.textContent);
  check("科目篩選「英文」只剩 1 題、1 個標題", shown.length === 1 && heads2.length === 1 && /英文/.test(heads2[0]));
  check("Console errors = 0", errors.length === 0);
  console.log("\nWrongBookSubjectGroupRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})();
