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
  const quizRows = doc.querySelectorAll(".quiz-row");
  check("Exam Mode quiz list renders (untouched)", quizRows.length > 0);
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
  rows[0].closest(".quiz-practice__row") ? rows[0].closest(".quiz-practice__row").click() : rows[0].click();
  const reveal = mountEl.querySelector(".quiz-practice__reveal");
  if (reveal) {
    reveal.click();
    check("v1.0 字串 explanation 正常渲染（詳解區塊）", /詳解|標準答案/.test(mountEl.querySelector(".quiz-practice__answer").textContent));
  } else {
    check("v1.0 字串 explanation 正常渲染（詳解區塊）", false);
  }
  check("Console errors = 0 (generation wiring)", consoleErrors.length === 0);
  if (consoleErrors.length) console.log("   errors:", consoleErrors.slice(0,3));
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

console.log("\n==============================");
console.log("PASS: " + pass + "   FAIL: " + fail);
if (failures.length) { console.log("Failures:"); failures.forEach(f => console.log(" - " + f)); process.exit(1); }
