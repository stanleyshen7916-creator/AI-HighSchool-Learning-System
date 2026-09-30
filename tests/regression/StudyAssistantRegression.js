/* tests/regression/StudyAssistantRegression.js — 2026-09-30 學習助教.

   tutor.html end to end in jsdom (offline, Supabase blanked):
   - Sidebar shows 學習助教; no demo history/resources; not labelled AI.
   - 查觀念: real material sentences with their source and a material link;
     an unknown concept gets an honest "找不到" plus real topic chips.
   - Workspace isolation: 高一下 cannot see 高二上 material.
   - 出題考我: quiz cards, grading, a wrong answer recorded in 知識弱點 with
     the question's ORIGINAL option keys even though options are shuffled.
   - Arriving from a 知識弱點 question (?questionId=) still answers that
     question's own explanation (AHS.TutorEngine).

   Run: node tests/regression/StudyAssistantRegression.js */
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

function loadTutor(opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(REPO, "tutor.html"), "utf8");
  const vconsole = new (require("jsdom").VirtualConsole)();
  const consoleErrors = [];
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    const s = String((e && e.message) || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) { return; }
    consoleErrors.push(s);
  });
  const dom = new JSDOM(html, {
    url: "https://ahs.test/tutor.html" + (opts.query || ""),
    runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vconsole
  });
  const { window } = dom;
  window.fetch = () => Promise.reject(new Error("fetch disabled in test environment"));
  const ws = { studentId: "student_a", schoolId: "cjsh", semesterIds: [opts.semester || "g2s1"] };
  window.sessionStorage.setItem("ahs:workspace", JSON.stringify(ws));
  const ns = ws.studentId + "__" + ws.schoolId + "__" + ws.semesterIds[0];
  Object.keys(opts.seed || {}).forEach((k) => window.sessionStorage.setItem("ahs:" + ns + ":" + k, JSON.stringify(opts.seed[k])));
  [...window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (!fs.existsSync(p)) { return; }
    window.eval(fs.readFileSync(p, "utf8"));
    if (/^js\/data\/SupabaseConfig(\.local)?\.js$/.test(src)) {
      window.AHS.SupabaseConfig = { url: "", anonKey: "" };
      window.AHS.SupabaseConfigLocal = null;
    }
  });
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, doc: window.document, consoleErrors };
}

function click(node) { node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent("click", { bubbles: true })); }
function send(doc, text) {
  doc.querySelector(".tutor-input__field").value = text;
  click(doc.querySelector(".tutor-input__send"));
}
function lastAi(doc) {
  const all = doc.querySelectorAll(".tutor-msg--ai");
  return all[all.length - 1];
}

console.log("StudyAssistant Regression — 學習助教");

console.log("\n[1] 頁面：側邊欄入口、無示範假資料、不標示為 AI");
{
  const { doc, consoleErrors } = loadTutor();
  const labels = [...doc.querySelectorAll(".sidebar__label")].map((n) => n.textContent);
  check("側邊欄出現「學習助教」", labels.indexOf("學習助教") !== -1);
  check("頁首標題為「巧巧老師・學習助教」", doc.querySelector(".tutor-hero__title").textContent === "巧巧老師・學習助教");
  check("沒有示範用的對話歷史／常用資源", !doc.querySelector(".tutor-history, .tutor-res"));
  check("頁面沒有寫「AI Tutor」", doc.body.textContent.indexOf("AI Tutor") === -1);
  check("對話區存在（.tutor-thread）", !!doc.querySelector(".tutor-thread"));
  check("開場訊息說明用法", doc.querySelector(".tutor-thread").textContent.indexOf("輸入一個觀念") !== -1);
  check("右欄有「出題考我」與「你可以這樣問」（主題來自真實題庫）",
    !!doc.querySelector(".tutor-quiz-card") && doc.querySelectorAll(".tutor-rail .tutor-topics__chip").length > 0);
  check("沒有針對單一題目的卡片（不是從知識弱點進來）", doc.body.textContent.indexOf("針對你正在看的這一題") === -1);
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\n[2] 查觀念：回傳教材原文與出處");
{
  const { doc } = loadTutor();
  send(doc, "什麼是半衰期？");
  const ai = lastAi(doc);
  const items = ai.querySelectorAll(".tutor-results__item");
  check("找到教材原文", items.length > 0);
  check("第一筆是地球科學的定義", items[0] && items[0].querySelector(".tutor-results__tag").textContent === "地球科學・定義");
  check("內容是教材原句（含「母元素」）", items[0] && items[0].querySelector(".tutor-results__text").textContent.indexOf("母元素") !== -1);
  const link = ai.querySelector(".tutor-results__link");
  check("附「看教材」連結到 materials.html?id=", !!link && /^materials\.html\?id=/.test(link.getAttribute("href")));
  check("註明是教材原文、沒有改寫", ai.textContent.indexOf("沒有經過改寫") !== -1);
}

console.log("\n[3] 查不到：誠實回答，不編答案，並給真實主題");
{
  const { doc } = loadTutor();
  send(doc, "量子力學");
  const ai = lastAi(doc);
  check("回覆「教材裡找不到」", ai.textContent.indexOf("目前的教材裡找不到") !== -1);
  check("說明不會自己編答案", ai.textContent.indexOf("不會自己編答案") !== -1);
  check("附上可點的主題", ai.querySelectorAll(".tutor-topics__chip").length > 0);
  click(ai.querySelector(".tutor-topics__chip"));
  check("點主題會直接查詢並得到結果", lastAi(doc).querySelectorAll(".tutor-results__item").length > 0);
}

console.log("\n[4] 學期隔離：高一下看不到高二上的教材");
{
  const { doc } = loadTutor({ semester: "g1s2" });
  send(doc, "半衰期");
  check("高一下查「半衰期」找不到（tm_17 屬高二上）", lastAi(doc).textContent.indexOf("目前的教材裡找不到") !== -1);
}

console.log("\n[5] 出題考我：作答、批改、答錯寫入知識弱點（原始選項代號）");
{
  const { window, doc, consoleErrors } = loadTutor();
  send(doc, "出題考我");
  const first = doc.querySelector(".tutor-quiz__options");
  check("出現第一題與選項", !!first && first.querySelectorAll(".tutor-quiz__option").length >= 2);
  let wrongKey = null, correctKey = null;
  for (let i = 0; i < 5; i++) {
    const sets = doc.querySelectorAll(".tutor-quiz__options");
    const opts = sets[sets.length - 1];
    const buttons = [...opts.querySelectorAll(".tutor-quiz__option")];
    const qStem = opts.parentNode.querySelector(".tutor-quiz__stem").textContent;
    const q = window.AHS.StudyAssistant.sources().flatMap((s) => s.questions).filter((x) => x.text === qStem)[0];
    if (i === 0) {
      const wrong = buttons.find((b) => b.getAttribute("data-key") !== q.correctAnswer);
      wrongKey = wrong.getAttribute("data-key"); correctKey = q.correctAnswer;
      click(wrong);
      check("答錯：選項標示錯誤／正確", wrong.classList.contains("is-wrong") && !!opts.querySelector(".is-correct"));
      check("答錯：顯示正確答案", opts.parentNode.textContent.indexOf("答錯了，正確答案是") !== -1);
      const wb = window.AHS.WrongBookRuntime.list().find((w) => w.question === qStem);
      check("答錯的題目已加入知識弱點", !!wb);
      check("知識弱點記錄的是原始選項代號（你的答案／正確答案）", !!wb && wb.yourAnswer === wrongKey && wb.correctAnswer === correctKey);
      check("作答後所有選項鎖定，不能重答", buttons.every((b) => b.disabled));
    } else {
      click(buttons.find((b) => b.getAttribute("data-key") === q.correctAnswer));
    }
  }
  check("5 題作答完成出現總結：答對 4 題", doc.querySelector(".tutor-thread").textContent.indexOf("5 題答對 4 題") !== -1);
  check("總結說明答錯題已加入知識弱點", doc.querySelector(".tutor-thread").textContent.indexOf("已加入「知識弱點」") !== -1);
  check("Console errors = 0", consoleErrors.length === 0);
}

console.log("\n[6] 從知識弱點的某一題進來：仍可看那一題的詳解");
{
  const item = {
    id: "wb_1", questionId: "tm_17_q1", subject: "earthscience", title: "t", chapter: "c", materialId: "",
    knowledgePoint: "地球的分層構造", question: "地球分層的驅動力為何？", options: [],
    yourAnswer: "B", correctAnswer: "A", explanation: "熔融後密度大的鐵鎳下沉。",
    errorCount: 1, lastError: "2026/09/30", firstError: "2026/09/30", masteredAt: null,
    bookmarked: false, archived: false, correctStreak: 0, correctCount: 0
  };
  const { doc } = loadTutor({ query: "?questionId=wb_1", seed: { wrongBookRuntime: { items: [item], seq: 1 } } });
  check("出現「針對你正在看的這一題」卡片", doc.body.textContent.indexOf("針對你正在看的這一題") !== -1);
  click([...doc.querySelectorAll(".tutor-suggest__item")].find((b) => b.textContent.indexOf("解題步驟詳解") !== -1));
  check("回覆該題的詳解", lastAi(doc).textContent.indexOf("熔融後密度大的鐵鎳下沉") !== -1);
  send(doc, "哈伯定律");
  check("同一頁仍可查其他觀念", lastAi(doc).querySelectorAll(".tutor-results__item").length > 0);
}

console.log("\nStudyAssistantRegression: " + pass + " PASS / " + fail + " FAIL");
if (fail > 0) { process.exit(1); }
