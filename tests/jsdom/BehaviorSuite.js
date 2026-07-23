/* tests/jsdom/BehaviorSuite.js — cumulative jsdom behavioral suite
   (EO-S6.8-002 baseline; grows with each EO/WO). Requires: npm i -D jsdom.
   Run: node tests/jsdom/BehaviorSuite.js
   EO-S6.8-Repository-001: relocated into tests/jsdom/, repo-root made
   relative — assertions unchanged.
   Known jsdom limits (always disclosed in QA report): no real browser
   rendering, no real file download, no cross-page navigation — those
   are verified as far as jsdom allows (anchor hrefs, blob API calls,
   getComputedStyle().display) and flagged for real-browser PAT. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
const failures = [];
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; failures.push(name); console.log("  FAIL  " + name); }
}

function loadPage(htmlFile, { seedSession } = {}) {
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const consoleErrors = [];
  const vconsole = new (require("jsdom").VirtualConsole)();
  vconsole.on("error", (m) => consoleErrors.push(String(m)));
  vconsole.on("jsdomError", (e) => {
    // jsdom cannot load CSS subresources over file://-less URLs etc.
    const s = String(e && e.message || e);
    if (/Could not load link|Could not parse CSS|not implemented/i.test(s)) return;
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
    for (const [k, v] of Object.entries(seedSession)) {
      window.sessionStorage.setItem(k, JSON.stringify(v));
    }
  }
  // Execute the page's ordered scripts manually (runScripts outside-only
  // keeps subresource loading deterministic).
  const scripts = [...dom.window.document.querySelectorAll("script[src]")]
    .map(s => s.getAttribute("src"));
  for (const src of scripts) {
    const code = fs.readFileSync(path.join(REPO, src), "utf8");
    window.eval(code);
  }
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, dom, consoleErrors };
}

/* Real-content Summary/Question fixtures — simulate what the pipeline
   will store once the Parser produces real content (schema-conformant,
   used ONLY inside this test file, never shipped). */
const realSummary = {
  items: [{
    id: "sr_1", materialId: "rt_1", subject: "math", grade: "高一",
    chapter: "第三章", section: "第一節", title: "三角函數",
    coreConcepts: ["正弦定理", "餘弦定理"],
    definitions: ["sinθ = 對邊/斜邊"],
    pitfalls: ["角度與弧度混用"],
    memorize: ["特殊角三角函數值"],
    reviewSuggestions: ["建議複習：第三章"],
    generatedAt: "2026/07/22"
  }], seq: 1
};
const stubQuestion = {
  id: "lqr_1", materialId: "rt_1", subject: "math", grade: "高一",
  chapter: "", section: "", conceptId: "know_1_c1", concept: "math",
  questionType: "short_answer", difficulty: "medium",
  question: "[Stub] 依據「math」尚未產生 AI 題目", options: [],
  answer: "[Stub] 尚未產生標準答案",
  explanation: { steps: ["[Stub] 解題步驟尚未產生"], whyCorrect: "[Stub] 正確原因尚未產生", whyOthersWrong: [], commonMistakes: [], tips: [] },
  knowledgePoint: "math - math", learningObjective: "能理解並應用「math」的相關內容",
  relatedConcepts: [], source: { type: "ai_generated", materials: [], chapter: "", section: "", page: null, reference: "Knowledge Runtime: know_1" },
  traceability: { materialId: "rt_1", knowledgeId: "know_1", summaryId: null },
  metadata: { mode: "ai_generated" }, createdAt: "2026/07/22"
};
const realQuestion = Object.assign({}, stubQuestion, {
  id: "lqr_2",
  question: "已知直角三角形斜邊 5、對邊 3，求 sinθ？",
  answer: "3/5",
  questionType: "multiple_choice",
  difficulty: "easy",
  options: ["3/5", "4/5", "3/4", "5/3"],
  explanation: { steps: ["sinθ = 對邊/斜邊 = 3/5"], whyCorrect: "依定義計算", whyOthersWrong: ["其餘為邊長比誤用"], commonMistakes: ["對邊鄰邊混淆"], tips: ["先標記邊"] }
});
const materialSeed = {
  materials: [{
    id: "rt_1", order: 1, subject: "math", title: "三角函數講義", chapter: "未分類",
    grade: "高一", category: "講義", date: "2026/07/22", views: "0", content: "",
    progress: 0, lastOpenedAt: null, lastLearningAt: null, learningTime: 0,
    learningCount: 0, favorite: false, fileName: "trig.pdf", fileType: "PDF",
    fileSize: "120 KB", folderId: null
  }], folders: [], seq: 1, folderSeq: 0
};

console.log("\n[1] quiz.html — Task 001/004: guide entry + stub filtering (stub-only data)");
{
  const { window, consoleErrors } = loadPage("quiz.html", {
    seedSession: {
      "ahs:materialRuntime": materialSeed,
      "ahs:summaryRuntime": { items: [], seq: 0 },
      "ahs:learningQuestionRuntime": { items: [stubQuestion], seq: 1 }
    }
  });
  // Deep-link simulation: re-run app entry with query params by calling
  // QuizCenter directly the way app-quiz.js does.
  const doc = window.document;
  const guideMount = window.AHS.QuizCenter.create(undefined, "practice", "rt_1");
  doc.body.appendChild(guideMount);

  const guide = guideMount.querySelector(".qguide");
  check("Question Guide is the entry view for mode=practice&materialId", !!guide);
  check("Guide title 巧巧老師出題引導 rendered", !!guide && /巧巧老師出題引導/.test(guide.textContent));
  const rows = guide ? guide.querySelectorAll(".qguide__row-label") : [];
  const labels = [...rows].map(r => r.textContent);
  ["建議閱讀方式", "建議題型", "建議難度", "作答提醒", "學習建議"].forEach(l =>
    check("Guide row present: " + l, labels.includes(l)));
  check("Guide never counts [Stub] question in 題型 stats",
    /暫無題型建議/.test(guide.textContent) && !/\[Stub\]/.test(guide.textContent));
  check("Guide reading advice honest (analyzing) when summary empty",
    /尚未取得可整理內容/.test(guide.textContent));
  check("Guide back link is real <a href> to summary.html?materialId=rt_1",
    !!guide.querySelector('a.qguide__back[href="summary.html?materialId=rt_1"]'));

  // 開始練習 → practice list must show Empty State (stub filtered out)
  guide.querySelectorAll(".qguide__diff")[1].click(); /* Ruling 2B: explicit pick */
  guide.querySelector(".qguide__start").click();
  const empty = guideMount.querySelector(".quiz-practice__empty");
  check("開始練習 reveals Practice list", !!guideMount.querySelector(".quiz-practice"));
  check("Task 004: [Stub] question filtered — Empty State shown", !!empty && /AI 正在建立練習題/.test(empty.textContent));
  check("Practice list contains no [Stub] text anywhere",
    ![...doc.querySelectorAll(".quiz-practice__row-q")].some(n => /\[Stub\]/.test(n.textContent)));
  check("Console errors = 0 (quiz.html, stub data)", consoleErrors.length === 0);
  if (consoleErrors.length) console.log("   errors:", consoleErrors);
}

console.log("\n[2] quiz.html — Task 001: guide with REAL summary + real question");
{
  const { window } = loadPage("quiz.html", {
    seedSession: {
      "ahs:materialRuntime": materialSeed,
      "ahs:summaryRuntime": realSummary,
      "ahs:learningQuestionRuntime": { items: [stubQuestion, realQuestion], seq: 2 }
    }
  });
  const doc = window.document;
  const mountEl = window.AHS.QuizCenter.create(undefined, "practice", "rt_1");
  doc.body.appendChild(mountEl);
  const guide = mountEl.querySelector(".qguide");
  check("Reading advice derives real section order",
    /核心概念 → 重要定義 → 易錯重點 → 必背內容 → 複習建議/.test(guide.textContent));
  check("題型 stats count ONLY the real question (選擇題 1 題, no 簡答)",
    /選擇題 1 題/.test(guide.textContent) && !/簡答題 1 題/.test(guide.textContent));
  check("難度 advice from real record (易)", /「易」難度為主/.test(guide.textContent));
  check("作答提醒 cites real pitfalls count", /1 個易錯重點/.test(guide.textContent));
  check("學習建議 passes through real reviewSuggestions", /建議複習：第三章/.test(guide.textContent));
  guide.querySelectorAll(".qguide__diff")[1].click(); /* Ruling 2B: explicit pick */
  guide.querySelector(".qguide__start").click();
  const rows = [...mountEl.querySelectorAll(".quiz-practice__row-q")];
  check("Practice list shows exactly the 1 real question", rows.length === 1 && /sinθ/.test(rows[0].textContent));
}

console.log("\n[3] quiz.html — regression: default entry (no params) unchanged");
{
  const { window, consoleErrors } = loadPage("quiz.html", {
    seedSession: { "ahs:learningQuestionRuntime": { items: [stubQuestion], seq: 1 } }
  });
  const doc = window.document;
  doc.body.appendChild(window.AHS.QuizCenter.create());
  const examTab = [...doc.querySelectorAll(".quiz-mode__tab")].find(t => t.textContent === "正式測驗");
  check("Exam Mode tab active by default (保持現況)", examTab && examTab.classList.contains("is-active"));
  const practiceRoot = doc.querySelector(".quiz-practice-root");
  check("Practice root hidden by default", practiceRoot && practiceRoot.hasAttribute("hidden"));
  check("No guide rendered without materialId deep link", !doc.querySelector(".qguide"));
  /* EO-S7.0-003 Production Cleanup: 預設題庫已移除 — Exam Mode 首次
     開啟為正式 Empty State。 */
  check("Exam Mode 正式 Empty State（預設題庫已移除）",
    doc.querySelectorAll(".quiz-row").length === 0 && /目前沒有可用的測驗/.test(doc.body.textContent));
  // Task 004 also inside default practice tab:
  const practiceTab = [...doc.querySelectorAll(".quiz-mode__tab")].find(t => t.textContent === "練習模式");
  practiceTab.click();
  check("Practice tab (no materialId) skips guide, stub filtered → Empty State",
    !doc.querySelector(".qguide") && !!doc.querySelector(".quiz-practice__empty"));
  check("Console errors = 0 (quiz.html default)", consoleErrors.length === 0);
}

console.log("\n[4] summary.html — Task 003: mandated pending copy (empty-content record)");
{
  const emptySummary = { items: [Object.assign({}, realSummary.items[0], {
    coreConcepts: [], definitions: [], pitfalls: [], memorize: [], reviewSuggestions: []
  })], seq: 1 };
  const { window, consoleErrors } = loadPage("summary.html", {
    seedSession: { "ahs:materialRuntime": materialSeed, "ahs:summaryRuntime": emptySummary }
  });
  const doc = window.document;
  const pending = doc.querySelector(".sum-section--pending");
  check("Pending block rendered for all-empty five sections", !!pending);
  check("Line 1: AI 正在分析教材", !!pending && /AI 正在分析教材/.test(pending.textContent));
  check("Line 2: 尚未取得可整理內容", !!pending && /尚未取得可整理內容/.test(pending.textContent));
  check("Line 3: 完成分析後將自動更新", !!pending && /完成分析後將自動更新/.test(pending.textContent));
  check("Forbidden old copy removed (尚未包含具體內容)", !/尚未包含具體內容/.test(doc.body.textContent));
  check("Forbidden copy absent (尚未有具體)", !/尚未有具體/.test(doc.body.textContent));
  check("No fabricated five-section content (no .sum-section-grid)", !doc.querySelector(".sum-section-grid"));
  check("巧巧老師導讀 highlight uses analyzing wording",
    /AI 正在分析教材，尚未取得可整理內容/.test(doc.querySelector(".sum-guide").textContent));
  check("No Lorem / [Stub] leaked into Summary UI", !/Lorem|\[Stub\]/.test(doc.body.textContent));
  check("Console errors = 0 (summary.html pending)", consoleErrors.length === 0);
}

console.log("\n[5] summary.html — Task 003: auto-switch to REAL five sections when content exists");
{
  const { window } = loadPage("summary.html", {
    seedSession: { "ahs:materialRuntime": materialSeed, "ahs:summaryRuntime": realSummary }
  });
  const doc = window.document;
  check("Five-section grid renders with real content", !!doc.querySelector(".sum-section-grid"));
  check("Pending block absent when real content exists", !doc.querySelector(".sum-section--pending"));
  check("Real core concept text rendered", /正弦定理/.test(doc.body.textContent));
  const dl = doc.querySelector(".sum-footer__quiz");
  check("開始 AI 練習 link → quiz.html?mode=practice&materialId=rt_1 (Summary→Guide→Practice)",
    !!dl && dl.getAttribute("href") === "quiz.html?mode=practice&materialId=rt_1");
}

console.log("\n[6] Task 002 regression — download mechanism audit (jsdom-verifiable parts)");
{
  const src = fs.readFileSync(path.join(REPO, "js/components/MaterialCenter.js"), "utf8");
  check("doDownload uses deferred revokeObjectURL (Hotfix preserved)",
    /setTimeout\(function \(\) \{ window\.URL\.revokeObjectURL\(url\); \}, 1000\)/.test(src));
  check("No-file case shows explicit status (never silent fail)",
    /此教材沒有可下載的原始檔案/.test(src));
  check("Download filename uses original fileName verbatim",
    /a\.download = item\.fileName \|\| item\.title/.test(src));
  const prev = fs.readFileSync(path.join(REPO, "js/ui/MaterialPreview.js"), "utf8");
  // format coverage: extension map + generic blob download is format-agnostic
  ["pdf","png","jpg","mp4","mp3","txt"].forEach(ext =>
    check("Previewable ext registered: " + ext, new RegExp("\\b" + ext + ":").test(prev)));
  check("DOCX/PPTX/XLSX/ZIP fall to info page + explicit download path",
    /DOC\/DOCX\/PPT\/PPTX\/XLS\/XLSX\/ZIP/.test(prev));
  // live check of kindOf via quiz-less page load
  const { window } = loadPage("materials.html", {});
  const k = window.AHS.MaterialPreview.kindOf;
  check("kindOf: pdf→pdf, jpg→image, mp3→audio, docx→null(info page)",
    k("pdf") === "pdf" && k("jpg") === "image" && k("mp3") === "audio" && k("docx") === null);
  check("kindOf MIME fallback works (image/jpeg)", k("weird", "image/jpeg") === "image");
}

console.log("\n[7] Full-page console error sweep (all entry pages)");
for (const page of ["index.html", "materials.html", "summary.html", "quiz.html", "wrongbook.html", "review.html", "learning.html", "dashboard.html", "tutor.html"]) {
  try {
    const { consoleErrors } = loadPage(page, {});
    check(page + " console errors = 0", consoleErrors.length === 0);
    if (consoleErrors.length) console.log("   ", page, consoleErrors.slice(0, 3));
  } catch (e) {
    check(page + " loads without throwing", false);
    console.log("   threw:", e.message);
  }
}


console.log("\n[8] EO-S6.9-002 — Question Generation wiring (guide picker -> flow -> practice list)");
{
  const knowSeed = { items: [{ id: "know_1", materialId: "rt_1", subject: "math", grade: "高一", chapter: "第三章", section: "第一節", title: "三角函數", concepts: [], structure: [], keywords: [], sourceInfo: {} }], seq: 1 };
  const { window, consoleErrors } = loadPage("quiz.html", {
    seedSession: {
      "ahs:materialRuntime": materialSeed,
      "ahs:knowledgeRuntime": knowSeed,
      "ahs:summaryRuntime": realSummary,
      "ahs:learningQuestionRuntime": { items: [], seq: 0 }
    }
  });
  const doc = window.document;
  const mountEl = window.AHS.QuizCenter.create(undefined, "practice", "rt_1");
  doc.body.appendChild(mountEl);
  const guide = mountEl.querySelector(".qguide");
  const start = guide.querySelector(".qguide__start");
  check("開始練習 disabled until難度明確選擇 (Ruling 2B)", start.hasAttribute("disabled"));
  const diffs = [...guide.querySelectorAll(".qguide__diff")];
  check("三個難度選項、無預設 is-active", diffs.length === 3 && diffs.every(b => !b.classList.contains("is-active")));
  diffs.find(b => b.getAttribute("data-difficulty") === "easy").click();
  check("選擇後 start 啟用", !start.hasAttribute("disabled"));
  start.click();
  const rows = [...mountEl.querySelectorAll(".quiz-practice__row-q")];
  check("真實 Summary 產生 Schema v1.0 題目並顯示於 Practice 列表 (5 KP -> 5 題)", rows.length === 5);
  check("列表零 Stub/Mock/Placeholder", rows.every(n => !/\[Stub\]|Mock|Placeholder/.test(n.textContent)));
  check("Session 實際寫入 5 題且 LearningQuestionRuntime 零寫入",
    window.AHS.LearningQuestionSession.count() === 5 && window.AHS.LearningQuestionRuntime.list().length === 0);
  /* EO-S7.0-002: Practice Submit flow — pick a WRONG option, expect
     grading + answer reveal + Wrong Book + Review Queue integration. */
  rows[0].closest(".quiz-practice__row") ? rows[0].closest(".quiz-practice__row").click() : rows[0].click();
  const optBtns = [...mountEl.querySelectorAll(".quiz-practice__option--btn")];
  check("single_choice 呈現可作答選項", optBtns.length === 4);
  const q0 = window.AHS.LearningQuestionSession.list().find(q => q.questionType === "single_choice");
  const wrongOpt = optBtns.find(b => b.textContent !== String(q0.answer));
  wrongOpt.click();
  check("Submit 後顯示批改結果（答錯）", /答錯了/.test(mountEl.querySelector(".quiz-practice__result").textContent));
  check("v1.0 字串 explanation 正常渲染（詳解區塊）", /詳解|標準答案/.test(mountEl.querySelector(".quiz-practice__answer").textContent));
  check("答錯 → WrongBookSession 自動建立 1 筆", window.AHS.WrongBookSession.count() === 1);
  const wbRec = window.AHS.WrongBookSession.list()[0];
  check("錯題記錄內容解析自真實題目", wbRec.questionId === q0.id && wbRec.correctAnswer === q0.answer && wbRec.userAnswer === wrongOpt.textContent);
  check("Review Queue 同步建立（priority=wrongCount, nextReviewAt=null）",
    (() => { const e = window.AHS.ReviewQueue.getByQuestionId(q0.id);
             return !!e && e.priority === 1 && e.nextReviewAt === null && e.masteryLevel === "new"; })());
  check("Console errors = 0 (generation wiring)", consoleErrors.length === 0);
  if (consoleErrors.length) console.log("   errors:", consoleErrors.slice(0,3));
}

console.log("\n[10] EO-S7.0-002 — 答對不建立 / 重複答錯累加不重建");
{
  const knowSeed = { items: [{ id: "know_1", materialId: "rt_1", subject: "math", grade: "高一", chapter: "第三章", section: "第一節", title: "三角函數", concepts: [], structure: [], keywords: [], sourceInfo: {} }], seq: 1 };
  const { window } = loadPage("quiz.html", {
    seedSession: { "ahs:materialRuntime": materialSeed, "ahs:knowledgeRuntime": knowSeed, "ahs:summaryRuntime": realSummary, "ahs:learningQuestionRuntime": { items: [], seq: 0 } }
  });
  const doc = window.document;
  const mountEl = window.AHS.QuizCenter.create(undefined, "practice", "rt_1");
  doc.body.appendChild(mountEl);
  [...mountEl.querySelectorAll(".qguide__diff")][0].click();
  mountEl.querySelector(".qguide__start").click();
  const q0 = window.AHS.LearningQuestionSession.list().find(q => q.questionType === "single_choice");

  function openRow(idx) {
    const rows = [...mountEl.querySelectorAll(".quiz-practice__row-q")];
    (rows[idx].closest(".quiz-practice__row") || rows[idx]).click();
  }
  // Correct answer first: no wrong-book entry
  openRow(0);
  [...mountEl.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent === String(q0.answer)).click();
  check("答對 → 不建立 Wrong Book", window.AHS.WrongBookSession.count() === 0 && /答對了/.test(mountEl.querySelector(".quiz-practice__result").textContent));
  // Wrong twice: single record, wrongCount 2, firstWrongAt preserved
  mountEl.querySelector(".quiz-practice__back").click();
  openRow(0);
  [...mountEl.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const first = window.AHS.WrongBookSession.list()[0];
  mountEl.querySelector(".quiz-practice__back").click();
  openRow(0);
  [...mountEl.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const after = window.AHS.WrongBookSession.list()[0];
  check("重複答錯不重建資料（仍 1 筆）", window.AHS.WrongBookSession.count() === 1);
  check("wrongCount 正常累加 (2) 且 firstWrongAt 不覆蓋",
    after.wrongCount === 2 && after.firstWrongAt === first.firstWrongAt && after.id === first.id);
  check("Queue 取代更新 priority=2", window.AHS.ReviewQueue.getByQuestionId(q0.id).priority === 2);
}

console.log("\n[11] EO-S7.0-002 — Wrong Book 頁面：Session 資料橋接 + 即時統計");
{
  // Seed a real wrong-book record chain, then load wrongbook.html
  const knowSeed = { items: [{ id: "know_1", materialId: "rt_1", subject: "math", grade: "高一", chapter: "第三章", section: "第一節", title: "三角函數", concepts: [], structure: [], keywords: [], sourceInfo: {} }], seq: 1 };
  const pre = loadPage("quiz.html", {
    seedSession: { "ahs:materialRuntime": materialSeed, "ahs:knowledgeRuntime": knowSeed, "ahs:summaryRuntime": realSummary, "ahs:learningQuestionRuntime": { items: [], seq: 0 } }
  });
  const preMount = pre.window.AHS.QuizCenter.create(undefined, "practice", "rt_1");
  pre.window.document.body.appendChild(preMount);
  [...preMount.querySelectorAll(".qguide__diff")][0].click();
  preMount.querySelector(".qguide__start").click();
  const rows = [...preMount.querySelectorAll(".quiz-practice__row-q")];
  const q0 = pre.window.AHS.LearningQuestionSession.list().find(q => q.questionType === "single_choice");
  (rows[0].closest(".quiz-practice__row") || rows[0]).click();
  [...preMount.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const carried = {
    "ahs:learningQuestionSession": JSON.parse(pre.window.sessionStorage.getItem("ahs:learningQuestionSession")),
    "ahs:wrongBookSession": JSON.parse(pre.window.sessionStorage.getItem("ahs:wrongBookSession")),
    "ahs:reviewQueue": JSON.parse(pre.window.sessionStorage.getItem("ahs:reviewQueue"))
  };
  check("前置：quiz 頁答錯已持久化", carried["ahs:wrongBookSession"].items.length === 1);

  const { window, consoleErrors } = loadPage("wrongbook.html", { seedSession: carried });
  const doc = window.document;
  check("Sprint-4 列表顯示真實錯題（題幹來自 LearningQuestionSession）",
    doc.body.textContent.includes(q0.question.slice(0, 12)));
  check("Mock Seed 已移除（無 wb_seed 資料/科目混入）", !/岳陽樓記|文言文虛詞/.test(doc.body.textContent));
  const stats = doc.querySelector(".wb-live-stats");
  check("即時統計卡渲染", !!stats);
  const values = [...stats.querySelectorAll(".wb-live-stats__item")].map(n => n.textContent);
  check("統計值：Total Wrong=1 / Active=1 / New=1",
    values.some(v => /1\s*Total Wrong/.test(v)) && values.some(v => /1\s*Active/.test(v)) && values.some(v => /1\s*New/.test(v)));
  check("Console errors = 0 (wrongbook 整合)", consoleErrors.length === 0);
  if (consoleErrors.length) console.log("   errors:", consoleErrors.slice(0,3));
}

console.log("\n[12] EO-S7.0-002 — 無錯題：mandated Empty State，零 Mock");
{
  const { window, consoleErrors } = loadPage("wrongbook.html", {});
  const doc = window.document;
  check("Empty State 顯示「目前沒有錯題紀錄。」", /目前沒有錯題紀錄。/.test(doc.body.textContent));
  check("零 Mock/Seed 錯題", !/岳陽樓記|wb_seed/.test(doc.body.textContent));
  check("統計卡全 0", [...doc.querySelectorAll(".wb-live-stats__value")].every(n => n.textContent === "0"));
  check("Console errors = 0 (wrongbook empty)", consoleErrors.length === 0);
}

console.log("\n[9] EO-S6.9-002 — empty-content summary -> mandated Empty State, zero fake questions");
{
  const emptySummary = { items: [Object.assign({}, realSummary.items[0], { coreConcepts: [], definitions: [], pitfalls: [], memorize: [], reviewSuggestions: [] })], seq: 1 };
  const knowSeed = { items: [{ id: "know_1", materialId: "rt_1", subject: "math", grade: "高一", chapter: "", section: "", title: "三角函數", concepts: [], structure: [], keywords: [], sourceInfo: {} }], seq: 1 };
  const { window } = loadPage("quiz.html", {
    seedSession: { "ahs:materialRuntime": materialSeed, "ahs:knowledgeRuntime": knowSeed, "ahs:summaryRuntime": emptySummary, "ahs:learningQuestionRuntime": { items: [], seq: 0 } }
  });
  const doc = window.document;
  const mountEl = window.AHS.QuizCenter.create(undefined, "practice", "rt_1");
  doc.body.appendChild(mountEl);
  [...mountEl.querySelectorAll(".qguide__diff")][1].click();
  mountEl.querySelector(".qguide__start").click();
  const empty = mountEl.querySelector(".quiz-practice__empty");
  check("Summary 尚未完成 -> AI 正在建立練習題……", !!empty && /AI 正在建立練習題/.test(empty.textContent));
  check("零假題目寫入 Session", window.AHS.LearningQuestionSession.count() === 0);
}


console.log("\n[13] EO-S7.0-003 — First Run：GitHub 首次開啟為空系統（零 Mock/Seed/Demo）");
{
  for (const page of ["index.html", "materials.html", "quiz.html", "wrongbook.html", "dashboard.html", "tutor.html"]) {
    const { window, consoleErrors } = loadPage(page, {});
    const text = window.document.body.textContent;
    check(page + "：零模擬內容（無假教材/假測驗/假錯題/假統計/假通知/陳同學）",
      !/二次函數的圖形與性質|牛頓運動定律總整理|岳陽樓記|陳同學|段考倒數提醒|較上週 \+/.test(text));
    check(page + "：Console Error = 0", consoleErrors.length === 0);
  }
  // 首頁 Review Widget（資料來自 ReviewModel）
  const { window } = loadPage("index.html", {});
  const w = window.document.querySelector(".review-widget");
  check("首頁 Review Widget 渲染（今日待複習/已完成/總錯題）",
    !!w && /今日待複習/.test(w.textContent) && /已完成/.test(w.textContent) && /總錯題/.test(w.textContent));
  check("空系統 Widget 全 0 + 正式空狀態文案",
    [...w.querySelectorAll(".review-widget__value")].every(n => n.textContent === "0") && /目前沒有錯題紀錄/.test(w.textContent));
  check("Dashboard 正式 Empty State", /尚無學習數據/.test(loadPage("dashboard.html", {}).window.document.body.textContent));
}

console.log("\n[14] EO-S7.0-003 — Review Widget 反映真實錯題（Mastery Progress 即時）");
{
  const knowSeed = { items: [{ id: "know_1", materialId: "rt_1", subject: "math", grade: "高一", chapter: "第三章", section: "第一節", title: "三角函數", concepts: [], structure: [], keywords: [], sourceInfo: {} }], seq: 1 };
  const pre = loadPage("quiz.html", {
    seedSession: { "ahs:materialRuntime": materialSeed, "ahs:knowledgeRuntime": knowSeed, "ahs:summaryRuntime": realSummary, "ahs:learningQuestionRuntime": { items: [], seq: 0 } }
  });
  const m = pre.window.AHS.QuizCenter.create(undefined, "practice", "rt_1");
  pre.window.document.body.appendChild(m);
  [...m.querySelectorAll(".qguide__diff")][0].click();
  m.querySelector(".qguide__start").click();
  const q0 = pre.window.AHS.LearningQuestionSession.list().find(q => q.questionType === "single_choice");
  const rows = [...m.querySelectorAll(".quiz-practice__row-q")];
  (rows[0].closest(".quiz-practice__row") || rows[0]).click();
  [...m.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const carried = {};
  for (const k of ["ahs:wrongBookSession", "ahs:reviewQueue"]) carried[k] = JSON.parse(pre.window.sessionStorage.getItem(k));
  const { window } = loadPage("index.html", { seedSession: carried });
  const w = window.document.querySelector(".review-widget");
  check("總錯題 = 1、今日待複習 = 0（nextReviewAt=null 排除，等待 Scheduler）",
    (() => { const v = [...w.querySelectorAll(".review-widget__value")].map(n => n.textContent);
             return v[0] === "0" && v[1] === "0" && v[2] === "1"; })());
  check("Mastery Progress 即時：New 1", /New 1/.test(w.textContent));
}


console.log("\n[15] HF-8.2.001 · HF-001 — Material Center 首次進入即顯示教材（不需再次切換）");
{
  const twoMaterials = { materials: [
    Object.assign({}, materialSeed.materials[0], { id: "rt_1", order: 1 }),
    { id: "rt_2", order: 2, subject: "physics", title: "牛頓運動定律", chapter: "第一章", grade: "高一",
      category: "課本", date: "2026/07/22", views: "0", content: "", progress: 0, lastOpenedAt: null,
      lastLearningAt: null, learningTime: 0, learningCount: 0, favorite: false, fileName: "newton.pdf",
      fileType: "PDF", fileSize: "2.0 MB", folderId: null, file: null }
  ], folders: [], seq: 2, folderSeq: 0 };

  const { window, consoleErrors } = loadPage("materials.html", { seedSession: { "ahs:materialRuntime": twoMaterials } });
  const doc = window.document;
  const cards = doc.querySelectorAll(".mat-card");
  check("首次載入即渲染全部教材卡片（2 張，無需切換）", cards.length === 2);
  check("教材標題正確顯示", /牛頓運動定律/.test(doc.body.textContent));
  check("Empty State 未誤顯示", !doc.querySelector(".mat-empty:not([hidden]) .mat-empty__title"));
  check("Console errors = 0（首次載入）", consoleErrors.length === 0);
  if (consoleErrors.length) console.log("   errors:", consoleErrors.slice(0, 3));

  /* 切換科目分頁後張數不變 —— 證明首次已完整初始化，非靠事件補救。 */
  const tab = doc.querySelector("[data-subject]");
  if (tab) { tab.click(); }
  check("切換後張數一致（初始化完整，非二次補救）", doc.querySelectorAll(".mat-card").length === 2);
}

console.log("\n[16] HF-8.2.001 · HF-001 — 空 Runtime 仍顯示正式 Empty State");
{
  const { window, consoleErrors } = loadPage("materials.html", {});
  const doc = window.document;
  check("零教材時卡片為 0", doc.querySelectorAll(".mat-card").length === 0);
  check("顯示正式 Empty State（非空白頁）",
    !!doc.querySelector(".mat-empty") && !doc.querySelector(".mat-empty[hidden]"));
  check("Console errors = 0（空狀態）", consoleErrors.length === 0);
}

console.log("\n[17] HF-8.2.001 · HF-002 — 跨頁後仍可下載（Download Flow 位元組保存）");
{
  const pdfBytes = Buffer.from("%PDF-1.4 AHS real bytes").toString("base64");
  /* HF-8.2.003: one unique key per material ("materialFile:<id>") plus a
     tiny index — the single shared key was the batch-upload root cause. */
  const seed = {
    "ahs:materialRuntime": { materials: [Object.assign({}, materialSeed.materials[0],
      { id: "rt_1", fileName: "trig.pdf", fileType: "PDF", file: null })], folders: [], seq: 1, folderSeq: 0 },
    "ahs:materialFileIndex": { entries: { rt_1: { name: "trig.pdf", type: "application/pdf", state: "stored" } } },
    "ahs:materialFile:rt_1": { name: "trig.pdf", type: "application/pdf",
      dataUrl: "data:application/pdf;base64," + pdfBytes }
  };
  const { window, consoleErrors } = loadPage("materials.html", { seedSession: seed });
  const doc = window.document;
  /* jsdom 未實作 createObjectURL —— 以最小樁記錄實際傳入的 Blob。 */
  let blobSize = null;
  window.URL.createObjectURL = function (blob) { blobSize = blob && blob.size; return "blob:ahs/test"; };
  window.URL.revokeObjectURL = function () {};
  let href = null, fileName = null;
  const origCreate = doc.createElement.bind(doc);
  doc.createElement = function (tag) {
    const node = origCreate(tag);
    if (String(tag).toLowerCase() === "a") {
      node.click = function () { href = node.getAttribute("href"); fileName = node.getAttribute("download"); };
    }
    return node;
  };
  doc.querySelector(".mat-card__dl").click();
  const status = doc.querySelector(".mat-status, [role='status']");
  check("下載事件觸發並取得 Blob URL", href === "blob:ahs/test");
  check("Blob 由真實位元組重建（長度正確）", blobSize === Buffer.from("%PDF-1.4 AHS real bytes").length);
  check("檔名為原始 fileName（非 download.bin）", fileName === "trig.pdf");
  check("回報下載成功", !!status && /已下載教材：trig\.pdf/.test(status.textContent));
  check("Console errors = 0（下載）", consoleErrors.length === 0);
}

console.log("\n[18] HF-8.2.001 · HF-002 — 無檔案來源／檔案過大：誠實訊息，永不靜默失敗");
{
  const base = { materials: [Object.assign({}, materialSeed.materials[0], { id: "rt_1", fileName: "trig.pdf", file: null })],
    folders: [], seq: 1, folderSeq: 0 };
  const noFile = loadPage("materials.html", { seedSession: { "ahs:materialRuntime": base } });
  noFile.window.document.querySelector(".mat-card__dl").click();
  check("無任何檔案來源 → 明確訊息",
    /沒有可下載的原始檔案/.test(noFile.window.document.querySelector(".mat-status, [role='status']").textContent));

  const oversize = loadPage("materials.html", { seedSession: { "ahs:materialRuntime": base,
    "ahs:materialFileIndex": { entries: { rt_1: { name: "big.pdf", type: "application/pdf", state: "oversize" } } } } });
  oversize.window.document.querySelector(".mat-card__dl").click();
  check("檔案過大 → 明確說明僅同一階段可下載",
    /檔案過大.*同一次瀏覽階段/.test(oversize.window.document.querySelector(".mat-status, [role='status']").textContent));

  const corrupt = loadPage("materials.html", { seedSession: { "ahs:materialRuntime": base,
    "ahs:materialFileIndex": { entries: { rt_1: { name: "x.pdf", type: "application/pdf", state: "stored" } } },
    "ahs:materialFile:rt_1": { name: "x.pdf", type: "application/pdf", dataUrl: "壞掉的內容" } } });
  corrupt.window.document.querySelector(".mat-card__dl").click();
  check("位元組無法還原 → 建議重新上傳",
    /無法還原.*重新上傳/.test(corrupt.window.document.querySelector(".mat-status, [role='status']").textContent));
  check("三種失敗情境 Console errors = 0",
    noFile.consoleErrors.length === 0 && oversize.consoleErrors.length === 0 && corrupt.consoleErrors.length === 0);
}


console.log("\n[19] HF-8.2.003 — 跨頁預覽改由位元組還原（先前必失敗）");
{
  const pngBytes = Buffer.from("PNG-real-bytes").toString("base64");
  const { window, consoleErrors } = loadPage("materials.html", { seedSession: {
    "ahs:materialRuntime": { materials: [Object.assign({}, materialSeed.materials[0],
      { id: "rt_1", title: "圖片教材", fileName: "圖一.png", fileType: "PNG", file: null })],
      folders: [], seq: 1, folderSeq: 0 },
    "ahs:materialFileIndex": { entries: { rt_1: { name: "圖一.png", type: "image/png", state: "stored" } } },
    "ahs:materialFile:rt_1": { name: "圖一.png", type: "image/png", dataUrl: "data:image/png;base64," + pngBytes }
  } });
  const doc = window.document;
  window.URL.createObjectURL = function (blob) { return "blob:ahs/" + (blob && blob.size); };
  window.URL.revokeObjectURL = function () {};
  doc.querySelector(".mat-card__preview").click();
  const overlay = doc.querySelector(".mat-preview__overlay, .mat-preview");
  const img = overlay && overlay.querySelector("img.mat-preview__media");
  check("跨頁圖片預覽渲染 img 且有 src（file 為 null 亦可）", !!img && !!img.getAttribute("src"));
  check("預覽 Console errors = 0", consoleErrors.length === 0);
}

console.log("\n[20] HF-8.2.003 — 舊版單一 key 資料仍可下載（向下相容）");
{
  const legacyBytes = Buffer.from("LEGACY-single-key-bytes").toString("base64");
  const { window, consoleErrors } = loadPage("materials.html", { seedSession: {
    "ahs:materialRuntime": { materials: [Object.assign({}, materialSeed.materials[0],
      { id: "rt_1", fileName: "legacy.pdf", fileType: "PDF", file: null })], folders: [], seq: 1, folderSeq: 0 },
    "ahs:materialFileStore": { files: { rt_1: { name: "legacy.pdf", type: "application/pdf",
      dataUrl: "data:application/pdf;base64," + legacyBytes } } }
  } });
  const doc = window.document;
  let href = null, fileName = null;
  const origCreate = doc.createElement.bind(doc);
  doc.createElement = function (tag) {
    const node = origCreate(tag);
    if (String(tag).toLowerCase() === "a") {
      node.click = function () { href = node.getAttribute("href"); fileName = node.getAttribute("download"); };
    }
    return node;
  };
  doc.querySelector(".mat-card__dl").click();
  check("HF-8.2.001 舊資料仍可下載（data URL 直接作 href）",
    typeof href === "string" && href.indexOf("data:application/pdf;base64,") === 0);
  check("舊資料下載檔名正確", fileName === "legacy.pdf");
  check("向下相容 Console errors = 0", consoleErrors.length === 0);
}

console.log("\n==============================");
console.log("PASS: " + pass + "   FAIL: " + fail);
if (failures.length) { console.log("Failures:"); failures.forEach(f => console.log(" - " + f)); process.exit(1); }
