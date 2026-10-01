/* tests/regression/RandomPracticeRegression.js — 2026-10-01 綜合隨機練習（方案 C）.

   Verifies:
   - AHS.RandomPracticeRuntime.pick(): unmastered 知識弱點 questions first
     (at most 40%), then questions not yet drawn in their material's
     cycle, then the rest; spread across materials; no duplicates; never
     padded beyond the real pool;
   - AHS.QuestionBankRuntime.undrawnIds()/markDrawn();
   - 測驗中心 平時練習: 「綜合隨機練習」 asks for a subject first, then
     starts ONE exam across that subject's lessons (real g2s1 國文 data);
   - wrong answers from it are filed in 知識弱點 under each question's own
     lesson, not the exam's combined title (also fixes 合併複習);
   - the next 綜合隨機練習 brings those wrong questions back.

   Run: node tests/regression/RandomPracticeRegression.js */
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
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) { return; }
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, { url: "https://ahs.test/" + htmlFile, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vconsole });
  const { window } = dom;
  window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] }));
  [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (fs.existsSync(p)) { window.eval(fs.readFileSync(p, "utf8")); }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, doc: window.document, consoleErrors };
}
function click(node) { node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true, cancelable: true })); }

console.log("RandomPractice Regression — 綜合隨機練習（方案 C）");

console.log("\n[1] 選題規則");
{
  global.window = global;
  require(path.join(REPO, "js/runtime/RandomPracticeRuntime.js"));
  const RP = window.AHS.RandomPracticeRuntime;
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const qs = (m, n) => Array.from({ length: n }, (_, i) => ({ id: m + "_q" + (i + 1), text: m + " " + (i + 1) }));
  const pools = [
    { examId: "A", questions: qs("a", 20), undrawnIds: ["a_q1", "a_q2"], source: { title: "第一課", chapter: "第一課" } },
    { examId: "B", questions: qs("b", 20), undrawnIds: null, source: { title: "第二課", chapter: "第二課" } },
    { examId: "C", questions: qs("c", 3), undrawnIds: [], source: { title: "第三課", chapter: "第三課" } }
  ];
  const weakIds = {};
  ["a_q10", "a_q11", "a_q12", "b_q5", "b_q6", "c_q1", "c_q2"].forEach((id) => { weakIds[id] = true; });
  const picked = RP.pick({ pools, weakIds, count: 10, random });
  const ids = picked.map((q) => q.id);
  check("出滿 10 題且不重複", picked.length === 10 && new Set(ids).size === 10);
  check("答錯未精熟的題目最多 40%（4 題）", picked.filter((q) => q._tier === "weak").length === 4);
  check("其餘 6 題都是還沒抽過的題目", picked.filter((q) => q._tier === "unseen").length === 6);
  check("已抽過且沒答錯的題目（rest）不會在還有新題時出現", picked.every((q) => q._tier !== "rest"));
  check("分散到不同課", new Set(picked.map((q) => q._examId)).size >= 2);
  check("每題帶有自己的課名", picked.every((q) => q.sourceTitle && q.sourceChapter === q.sourceTitle));
  const small = RP.pick({ pools: [pools[2]], weakIds: {}, count: 10, random });
  check("題庫不足時誠實回傳實際題數（不補題）", small.length === 3);
  const noUnseen = RP.pick({ pools: [{ examId: "C", questions: qs("c", 3), undrawnIds: [] }], weakIds: { c_q1: true }, count: 3, random });
  check("沒有新題時，答錯的題目與其餘題目補上", noUnseen.length === 3);
  check("沒有題目時回傳空陣列", RP.pick({ pools: [], count: 10 }).length === 0);
}

console.log("\n[2] 題庫：尚未抽到的題目與標記已抽");
{
  const { window } = loadPage("quiz.html");
  const QB = window.AHS.QuestionBankRuntime;
  const six = [1, 2, 3, 4, 5, 6].map((i) => ({ id: "x" + i, index: i, text: "t" }));
  check("沒有題庫時回傳 null", QB.undrawnIds("bank_x") === null);
  QB.ensureBank("bank_x", six);
  check("尚未開始抽題：整個題庫都還沒抽", QB.undrawnIds("bank_x").length === 6);
  QB.markDrawn("bank_x", ["x1", "x2"]);
  check("markDrawn 後少了這兩題", QB.undrawnIds("bank_x").length === 4 && QB.undrawnIds("bank_x").indexOf("x1") === -1);
  const drawn = QB.drawCycle("bank_x", 4).map((q) => q.id);
  check("平時練習接著抽到的是其餘 4 題", drawn.every((id) => id !== "x1" && id !== "x2"));
}

console.log("\n[3] 測驗中心：綜合隨機練習");
{
  const { window, doc, consoleErrors } = loadPage("quiz.html");
  const AHS = window.AHS;
  const btn = doc.querySelector(".quiz-random-btn");
  check("平時練習列表顯示「綜合隨機練習」", !!btn && btn.textContent.indexOf("綜合隨機練習") !== -1);
  click(btn);
  const hint = doc.querySelector(".quiz-random-hint");
  check("全部科目時提示先選科目，不開始測驗", !!hint && !hint.hasAttribute("hidden") && hint.textContent.indexOf("請先在上方選擇一個科目") !== -1 && !doc.querySelector(".qcard"));

  const chinese = [...doc.querySelectorAll(".quiz-filter__subject")].find((b) => b.textContent.trim() === "國文");
  click(chinese);
  click(doc.querySelector(".quiz-random-btn"));
  const session = AHS.ExamRuntime.getCurrent();
  check("開始一份綜合隨機練習", !!session && /^random_practice_/.test(session.examId) && !!doc.querySelector(".qcard"));
  const qs = AHS.QuestionRuntime.getSet(session.examId);
  const materials = new Set(qs.map((q) => q.sourceTitle));
  check("10 題、跨多課", qs.length === 10 && materials.size >= 2);
  check("全部是國文", qs.every((q) => q.subject === "chinese"));
  check("題號為 1～10（作答順序由 ExamRuntime 另外打亂）", qs.map((q) => q.index).sort((x, y) => x - y).join() === "1,2,3,4,5,6,7,8,9,10");

  /* answer every question with a wrong option where possible, then finish */
  for (let i = 0; i < 12; i++) {
    const q = AHS.QuestionRuntime.getSet(session.examId)[i] || null;
    const opts = [...doc.querySelectorAll(".qcard-option")];
    const wrong = q ? opts.find((o) => o.getAttribute("data-key") && o.getAttribute("data-key") !== q.correctAnswer) : null;
    click(wrong || opts[0]);
    const fin = doc.querySelector(".qnav__finish");
    if (fin) { click(fin); break; }
    click(doc.querySelector(".qnav__next"));
  }
  check("交卷後顯示結果", !!doc.querySelector(".qreview"));
  const wrongs = AHS.WrongBookRuntime.list().filter((w) => qs.some((q) => q.id === w.questionId));
  check("答錯的題目進入知識弱點", wrongs.length > 0);
  check("知識弱點記錄題目自己的課名，不是「綜合隨機練習」", wrongs.every((w) => w.title && w.title.indexOf("綜合隨機練習") === -1 && materials.has(w.title)));

  /* next round brings the unmastered wrong questions back (at most 4) */
  const back = [...doc.querySelectorAll("button")].find((b) => b.textContent.indexOf("返回測驗中心") !== -1);
  if (back) { click(back); }
  const chinese2 = [...doc.querySelectorAll(".quiz-filter__subject")].find((b) => b.textContent.trim() === "國文");
  click(chinese2);
  click(doc.querySelector(".quiz-random-btn"));
  const second = AHS.QuestionRuntime.getSet(AHS.ExamRuntime.getCurrent().examId);
  const wrongIds = new Set(wrongs.map((w) => w.questionId));
  const again = second.filter((q) => wrongIds.has(q.id)).length;
  check("下一次綜合隨機練習會再出答錯的題目（最多 4 題）", again === Math.min(4, wrongIds.size));
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\nRandomPracticeRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
