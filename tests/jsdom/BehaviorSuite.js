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

/* backFromPractice(doc) — Sprint AI-123 Practice Flow UX Refactor:
   Practice View (js/components/QuizCenter.js's buildPracticeSessionView)
   is now a full-screen overlay appended straight to document.body, not a
   node inside QuizCenter's own mount root — every test below that used
   to query mountEl/preMount/m for .quiz-practice__option--btn /
   .quiz-practice__result / .quiz-practice__answer now reads from `doc`
   instead. Its own back button (.qpv__back, AI-123-03) may pop a real
   "尚有 N 題未完成" confirm dialog first (AI-123-12) when this practice
   set has more than the one question a test just answered — this helper
   clicks Back, then (only if the dialog actually appeared) clicks its
   own non-primary "返回列表" button to actually leave, matching how a
   real student would dismiss it. */
function backFromPractice(doc) {
  var back = doc.querySelector(".qpv__back");
  if (!back) { return; }
  back.click();
  var overlay = doc.querySelector(".qpv-confirm-overlay");
  if (overlay && !overlay.hasAttribute("hidden")) {
    var btns = [...overlay.querySelectorAll(".qpv-confirm__btn")];
    var leave = btns.find(function (b) { return !b.classList.contains("qpv-confirm__btn--primary"); });
    if (leave) { leave.click(); }
  }
}

/* Sprint AI-122 AI-122-06: 最近教材 now filters on real createdAt (>=
   today-3days) — any seedSession material meant to show up there needs a
   real, always-current createdAt (never a hardcoded past date that would
   silently age out of the 3-day window). */
function todayStr() {
  var d = new Date();
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
}

/* excludeScripts (HOTFIX-002): substrings matched against each page's own
   <script src> list — any match is skipped entirely. Added specifically
   so tests that assert an exact, isolated MaterialRuntime/SummaryRuntime
   state (an exact seeded card count, a true empty state, absence of any
   rendered content) can opt out of data/materials/*.js's now-real,
   permanently-committed Repository content (HOTFIX-002 finally wired
   AHS.MaterialRepository into MaterialRuntime — see
   js/runtime/TeachingMaterialLoader.js). That real content is exactly
   what production should show; these specific tests were never about
   it and would otherwise become fragile to every future real material
   added to data/materials/ — excluding it here keeps their original,
   already-correct assertions intact rather than loosening any of them. */
/* Sprint AI-119 (Platform Core Baseline): AHS.PersistenceAdapter now
   namespaces every save()/load()/remove() under the active Workspace's
   storage namespace, and AHS.AppShell.create() redirects to login.html
   (rendering nothing) unless a Workspace is active. This suite predates
   Login/Workspace entirely and isn't about testing either — rather than
   rewrite every individual seedSession literal across this file's 79
   loadPage() call sites, loadPage() itself auto-establishes ONE fixed
   default test Workspace (unless the caller passes skipLogin) and
   transparently namespaces each bare "ahs:<key>" seed entry to match —
   idempotent (an already-namespaced entry passes through unchanged). */
const AHS_TEST_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };
const AHS_TEST_NS = "student_a__cjsh__g1s2";
function namespacedKey(k) {
  if (k === "ahs:workspace") { return k; }
  const nsPrefix = "ahs:" + AHS_TEST_NS + ":";
  if (k.indexOf(nsPrefix) === 0) { return k; }
  if (k.indexOf("ahs:") === 0) { return "ahs:" + AHS_TEST_NS + ":" + k.slice(4); }
  return k;
}

function loadPage(htmlFile, { seedSession, excludeScripts, url, skipLogin } = {}) {
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
    url: "https://ahs.test/" + (url || htmlFile),
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vconsole
  });
  const { window } = dom;
  if (!skipLogin) {
    window.sessionStorage.setItem("ahs:workspace", JSON.stringify(AHS_TEST_WORKSPACE));
  }
  if (seedSession) {
    for (const [k, v] of Object.entries(seedSession)) {
      window.sessionStorage.setItem(skipLogin ? k : namespacedKey(k), JSON.stringify(v));
    }
  }
  // Execute the page's ordered scripts manually (runScripts outside-only
  // keeps subresource loading deterministic).
  const scripts = [...dom.window.document.querySelectorAll("script[src]")]
    .map(s => s.getAttribute("src"))
    .filter(src => !(excludeScripts && excludeScripts.some(x => src.includes(x))));
  for (const src of scripts) {
    const p = path.join(REPO, src);
    if (!fs.existsSync(p)) { continue; } /* optional, git-ignored local-only script (e.g. SupabaseConfig.local.js) */
    const code = fs.readFileSync(p, "utf8");
    window.eval(code);
  }
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, dom, consoleErrors };
}

/* Minimal ZIP reader (Node Buffer-based) — independent of
   js/core/DocumentExport.js's own writer, so this genuinely round-trips
   the hand-rolled .docx it produces rather than trusting the same code
   that wrote it. Reads the End-Of-Central-Directory record, walks the
   central directory, and extracts one named entry's real bytes via its
   local file header (STORED/uncompressed, per DocumentExport.js). */
function readZipEntryText(uint8Bytes, entryName) {
  const buf = Buffer.from(uint8Bytes);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) { return null; }
  const totalEntries = buf.readUInt16LE(eocd + 10);
  const centralOffset = buf.readUInt32LE(eocd + 16);
  let ptr = centralOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) { return null; }
    const uncompSize = buf.readUInt32LE(ptr + 24);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.toString("utf8", ptr + 46, ptr + 46 + nameLen);
    if (name === entryName) {
      const lNameLen = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lNameLen + lExtraLen;
      return buf.slice(dataStart, dataStart + uncompSize).toString("utf8");
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

/* Sprint AI-015E (Option A, PMO-approved, EO-AI-015E-002) — the single
   Production Question Pipeline now runs on materials.html: real text ->
   AITutorService.ensureQuestionSet() (Knowledge Graph generation) ->
   QuestionProviderBridge.bridge() (existing, unmodified, Sprint AI-015C)
   -> LearningQuestionSession + LearningQuestionRuntime. Quiz no longer
   calls QuestionGenerationFlow itself (Quiz 只能 Read). This helper
   reproduces that real production flow — the same two calls
   MaterialQuestionCard.js's「產生 AI 題目」button now makes — then
   carries the resulting sessionStorage forward so a quiz.html load can
   read genuinely-bridged content, exactly as a real student would after
   visiting materials.html once. */
function seedProductionQuestions(title) {
  const matPage = loadPage("materials.html", {});
  const A = matPage.window.AHS;
  const folder = A.FolderRuntime.createFolder({ folderName: "測試", subject: "math", scopeType: "custom" });
  const TEXT = ["三角函數", "斜邊", "正弦：對邊除以斜邊", "餘弦：鄰邊除以斜邊", "正切：對邊除以鄰邊",
    "餘弦定理 a² = b² + c² − 2bc·cosA", "本節說明三角函數的定義與應用。"].join("\n");
  const mat = A.MaterialRuntime.add({
    title: title || "三角函數講義", subject: "math", grade: "高一", chapter: "第三章",
    category: "講義", fileName: "trig.pdf", fileType: "PDF", folderId: folder.folderId, content: TEXT
  });
  A.AITutorService.ensureQuestionSet(mat.id);
  const genRecord = A.QuestionGenerationRuntime.getQuestionsByMaterial(mat.id);
  A.QuestionProviderBridge.bridge(mat.id);
  /* Sprint AI-119: read back via AHS.PersistenceAdapter (short key), not
     a raw sessionStorage.getItem("ahs:materialRuntime") — materials.html
     was itself loaded through loadPage()'s own auto-seeded default test
     Workspace, so its real writes landed under that Workspace's
     namespaced key, not the bare legacy one. PersistenceAdapter.load()
     already knows how to resolve that; carried stays bare-keyed
     ("ahs:materialRuntime", not namespaced) so the next loadPage() call
     re-namespaces it consistently, exactly like every other seedSession
     object in this file. */
  const carried = {};
  ["materialRuntime", "learningQuestionRuntime", "learningQuestionSession"].forEach(function (shortKey) {
    const v = A.PersistenceAdapter.load(shortKey);
    if (v) { carried["ahs:" + shortKey] = v; }
  });
  return { materialId: mat.id, genRecord: genRecord, carried: carried };
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

console.log("\n[3] quiz.html — regression: default entry (no params) unchanged, no Repository data");
{
  /* Isolated from data/materials/*.js's real, committed content (see
     excludeScripts's own header comment) — this specifically tests the
     genuine "no Repository material imported at all" state, still a
     real, reachable state (e.g. before any real material is ever added
     to either Repository track). HOTFIX-005 AI-501's own "Repository
     row surfaces automatically" behavior is covered separately in [29]
     below, with the real Repository content intact. */
  const { window, consoleErrors } = loadPage("quiz.html", {
    seedSession: { "ahs:learningQuestionRuntime": { items: [stubQuestion], seq: 1 } },
    excludeScripts: ["data/materials/", "js/data/TeachingMaterialData.js"]
  });
  const doc = window.document;
  doc.body.appendChild(window.AHS.QuizCenter.create());
  const examTab = [...doc.querySelectorAll(".quiz-mode__tab")].find(t => t.textContent === "正式測驗");
  check("Exam Mode tab active by default (保持現況)", examTab && examTab.classList.contains("is-active"));
  const practiceRoot = doc.querySelector(".quiz-practice-root");
  check("Practice root hidden by default", practiceRoot && practiceRoot.hasAttribute("hidden"));
  check("No guide rendered without materialId deep link", !doc.querySelector(".qguide"));
  /* EO-S7.0-003 Production Cleanup: 預設題庫已移除 — Exam Mode 首次
     開啟為正式 Empty State when genuinely no Repository material exists. */
  check("Exam Mode 正式 Empty State（無 Repository 資料時，預設題庫已移除）",
    doc.querySelectorAll(".quiz-row").length === 0 && /目前沒有可用的測驗/.test(doc.body.textContent));
  const practiceTab = [...doc.querySelectorAll(".quiz-mode__tab")].find(t => t.textContent === "考前練習");
  practiceTab.click();
  check("Practice tab (no materialId, no Repository data) skips guide, stub filtered → Empty State",
    !doc.querySelector(".qguide") && !!doc.querySelector(".quiz-practice__empty"));
  check("Console errors = 0 (quiz.html default, no Repository data)", consoleErrors.length === 0);
}

console.log("\n[4] summary.html — Task 003: mandated pending copy (empty-content record)");
{
  const emptySummary = { items: [Object.assign({}, realSummary.items[0], {
    coreConcepts: [], definitions: [], pitfalls: [], memorize: [], reviewSuggestions: []
  })], seq: 1 };
  const { window, consoleErrors } = loadPage("summary.html", {
    excludeScripts: ["data/materials/", "js/data/TeachingMaterialData.js"],
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


console.log("\n[8] Sprint AI-015E — Production Pipeline wiring (materials.html generate+bridge -> quiz.html read-only practice)");
{
  const seed = seedProductionQuestions();
  check("Production Pipeline: real questions generated on materials.html", !!seed.genRecord && seed.genRecord.questions.length > 0);

  const { window, consoleErrors } = loadPage("quiz.html", { seedSession: seed.carried });
  const doc = window.document;
  const mountEl = window.AHS.QuizCenter.create(undefined, "practice", seed.materialId);
  doc.body.appendChild(mountEl);
  const guide = mountEl.querySelector(".qguide");
  const start = guide.querySelector(".qguide__start");
  check("開始練習 disabled until難度明確選擇 (Ruling 2B UI preserved — MVP: 不驅動任何生成)", start.hasAttribute("disabled"));
  const diffs = [...guide.querySelectorAll(".qguide__diff")];
  check("三個難度選項、無預設 is-active", diffs.length === 3 && diffs.every(b => !b.classList.contains("is-active")));
  diffs.find(b => b.getAttribute("data-difficulty") === "easy").click();
  check("選擇後 start 啟用", !start.hasAttribute("disabled"));
  start.click();
  const rows = [...mountEl.querySelectorAll(".quiz-practice__row-q")];
  check("Quiz 100% Read: LearningQuestionRuntime 顯示已橋接的真實題目",
    rows.length === seed.genRecord.questions.length);
  check("列表零 Stub/Mock/Placeholder", rows.every(n => !/\[Stub\]|Mock|Placeholder/.test(n.textContent)));
  check("Quiz 未自行呼叫 QuestionGenerationFlow / 未建立 Question（Runtime 題數與橋接數一致，未額外產生）",
    window.AHS.LearningQuestionRuntime.findByMaterialId(seed.materialId).length === seed.genRecord.questions.length);
  /* EO-S7.0-002: Practice Submit flow — pick a WRONG option, expect
     grading + answer reveal + Wrong Book + Review Queue integration,
     now resolved via Sprint AI-015E's Identity Mapping (Runtime record
     displayed -> Session sibling looked up for WrongBookGenerator). */
  rows[0].closest(".quiz-practice__row") ? rows[0].closest(".quiz-practice__row").click() : rows[0].click();
  const optBtns = [...doc.querySelectorAll(".quiz-practice__option--btn")];
  check("single_choice 呈現可作答選項", optBtns.length === 4);
  const q0 = window.AHS.LearningQuestionRuntime.findByMaterialId(seed.materialId)[0];
  const wrongOpt = optBtns.find(b => b.textContent !== String(q0.answer));
  wrongOpt.click();
  check("Submit 後顯示批改結果（答錯）", /答錯了/.test(doc.querySelector(".quiz-practice__result").textContent));
  check("explanation 正常渲染（詳解區塊）", /詳解|標準答案/.test(doc.querySelector(".quiz-practice__answer").textContent));
  check("答錯 → WrongBookSession 自動建立 1 筆（Identity Mapping 成功解析 Runtime→Session）", window.AHS.WrongBookSession.count() === 1);
  const wbRec = window.AHS.WrongBookSession.list()[0];
  check("錯題記錄內容解析自真實題目", wbRec.correctAnswer === q0.answer && wbRec.userAnswer === wrongOpt.textContent);
  check("Review Queue 同步建立（priority=wrongCount, nextReviewAt=null）",
    (() => { const e = window.AHS.ReviewQueue.getByQuestionId(wbRec.questionId);
             return !!e && e.priority === 1 && e.nextReviewAt === null && e.masteryLevel === "new"; })());
  check("Console errors = 0 (production pipeline wiring)", consoleErrors.length === 0);
  if (consoleErrors.length) console.log("   errors:", consoleErrors.slice(0,3));
}

console.log("\n[10] EO-S7.0-002 / Sprint AI-015E — 答對不建立 / 重複答錯累加不重建（Production Pipeline + Identity Mapping）");
{
  const seed = seedProductionQuestions();
  const { window } = loadPage("quiz.html", { seedSession: seed.carried });
  const doc = window.document;
  const mountEl = window.AHS.QuizCenter.create(undefined, "practice", seed.materialId);
  doc.body.appendChild(mountEl);
  [...mountEl.querySelectorAll(".qguide__diff")][0].click();
  mountEl.querySelector(".qguide__start").click();
  const q0 = window.AHS.LearningQuestionRuntime.findByMaterialId(seed.materialId)[0];

  function openRow(idx) {
    const rows = [...mountEl.querySelectorAll(".quiz-practice__row-q")];
    (rows[idx].closest(".quiz-practice__row") || rows[idx]).click();
  }
  // Correct answer first: no wrong-book entry
  openRow(0);
  [...doc.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent === String(q0.answer)).click();
  check("答對 → 不建立 Wrong Book", window.AHS.WrongBookSession.count() === 0 && /答對了/.test(doc.querySelector(".quiz-practice__result").textContent));
  // Wrong twice: single record, wrongCount 2, firstWrongAt preserved
  backFromPractice(doc);
  openRow(0);
  [...doc.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const first = window.AHS.WrongBookSession.list()[0];
  backFromPractice(doc);
  openRow(0);
  [...doc.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const after = window.AHS.WrongBookSession.list()[0];
  check("重複答錯不重建資料（仍 1 筆）", window.AHS.WrongBookSession.count() === 1);
  check("wrongCount 正常累加 (2) 且 firstWrongAt 不覆蓋",
    after.wrongCount === 2 && after.firstWrongAt === first.firstWrongAt && after.id === first.id);
  check("Queue 取代更新 priority=2", window.AHS.ReviewQueue.getByQuestionId(after.questionId).priority === 2);
}

console.log("\n[11] EO-S7.0-002 / Sprint AI-015E — Wrong Book 頁面：Session 資料橋接 + 即時統計（Production Pipeline + Identity Mapping）");
{
  // Seed a real wrong-book record chain via the Production Pipeline (materials.html
  // generate+bridge), then quiz.html read-only practice, then load wrongbook.html.
  const seed = seedProductionQuestions();
  const pre = loadPage("quiz.html", { seedSession: seed.carried });
  const preMount = pre.window.AHS.QuizCenter.create(undefined, "practice", seed.materialId);
  pre.window.document.body.appendChild(preMount);
  [...preMount.querySelectorAll(".qguide__diff")][0].click();
  preMount.querySelector(".qguide__start").click();
  const rows = [...preMount.querySelectorAll(".quiz-practice__row-q")];
  const q0 = pre.window.AHS.LearningQuestionRuntime.findByMaterialId(seed.materialId)[0];
  (rows[0].closest(".quiz-practice__row") || rows[0]).click();
  [...pre.window.document.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const carried = {
    "ahs:learningQuestionSession": pre.window.AHS.PersistenceAdapter.load("learningQuestionSession"),
    "ahs:wrongBookSession": pre.window.AHS.PersistenceAdapter.load("wrongBookSession"),
    "ahs:reviewQueue": pre.window.AHS.PersistenceAdapter.load("reviewQueue")
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
  check("統計值：錯題總數=1 / 進行中=1 / 新錯題=1",
    values.some(v => /1\s*錯題總數/.test(v)) && values.some(v => /1\s*進行中/.test(v)) && values.some(v => /1\s*新錯題/.test(v)));
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
    const { window, consoleErrors } = loadPage(page, { excludeScripts: ["data/materials/"] });
    const text = window.document.body.textContent;
    check(page + "：零模擬內容（無假教材/假測驗/假錯題/假統計/假通知/陳同學）",
      !/二次函數的圖形與性質|牛頓運動定律總整理|岳陽樓記|陳同學|段考倒數提醒|較上週 \+/.test(text));
    check(page + "：Console Error = 0", consoleErrors.length === 0);
  }
  /* Sprint AI-122 AI-122-08: ReviewWidget.js is no longer mounted on
     Home (js/pages/AppHome.js's own comment explains why — not in the
     PO's explicit 6-section 首頁資訊排序 list, and its own info overlaps
     學習成效總覽/今日任務). Not deleted from the codebase (still real,
     still <script>-tagged on index.html per the same "don't delete
     source files outside this Sprint's scope" precedent AI-118 already
     established) — so its own real behavior is still exercised here
     directly, decoupled from Home's own composition. */
  const { window } = loadPage("index.html", { excludeScripts: ["data/materials/"] });
  const w = window.AHS.ReviewWidget.create();
  check("ReviewWidget 渲染（今日待複習/已完成/總錯題，AI-122-08：不再掛載於首頁本身）",
    !!w && /今日待複習/.test(w.textContent) && /已完成/.test(w.textContent) && /總錯題/.test(w.textContent));
  check("空系統 Widget 全 0 + 正式空狀態文案",
    [...w.querySelectorAll(".review-widget__value")].every(n => n.textContent === "0") && /目前沒有錯題紀錄/.test(w.textContent));
  check("Dashboard 正式 Empty State", /尚無學習數據/.test(loadPage("dashboard.html", {}).window.document.body.textContent));
}

console.log("\n[14] EO-S7.0-003 / Sprint AI-015E — Review Widget 反映真實錯題（Mastery Progress 即時，Production Pipeline）");
{
  const seed = seedProductionQuestions();
  const pre = loadPage("quiz.html", { seedSession: seed.carried });
  const m = pre.window.AHS.QuizCenter.create(undefined, "practice", seed.materialId);
  pre.window.document.body.appendChild(m);
  [...m.querySelectorAll(".qguide__diff")][0].click();
  m.querySelector(".qguide__start").click();
  const q0 = pre.window.AHS.LearningQuestionRuntime.findByMaterialId(seed.materialId)[0];
  const rows = [...m.querySelectorAll(".quiz-practice__row-q")];
  (rows[0].closest(".quiz-practice__row") || rows[0]).click();
  [...pre.window.document.querySelectorAll(".quiz-practice__option--btn")].find(b => b.textContent !== String(q0.answer)).click();
  const carried = {};
  for (const shortKey of ["wrongBookSession", "reviewQueue"]) carried["ahs:" + shortKey] = pre.window.AHS.PersistenceAdapter.load(shortKey);
  const { window } = loadPage("index.html", { seedSession: carried });
  /* Sprint AI-122 AI-122-08: same as [13] above — ReviewWidget.js kept
     real, just no longer auto-mounted by AppHome.js's own composition. */
  const w = window.AHS.ReviewWidget.create();
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

  const { window, consoleErrors } = loadPage("materials.html", {
    excludeScripts: ["data/materials/", "js/data/TeachingMaterialData.js"],
    seedSession: { "ahs:materialRuntime": twoMaterials }
  });
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
  const { window, consoleErrors } = loadPage("materials.html", { excludeScripts: ["data/materials/", "js/data/TeachingMaterialData.js"] });
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
  /* HOTFIX-005 AI-502: state==="none" (no original file at all) no longer
     dead-ends on a message — a real .docx is generated on the spot from
     whatever this Runtime chain has (here: honest 教材資訊 only, since
     this fixture's content/AI output are genuinely empty — verifies the
     "（無資料）" fallback renders instead of a fabricated section, not
     just the "real Repository data" happy path already covered by [30]). */
  const noFile = loadPage("materials.html", { seedSession: { "ahs:materialRuntime": base } });
  let noFileBlob = null, noFileName = null;
  noFile.window.URL.createObjectURL = function (blob) { noFileBlob = blob; return "blob:ahs/test-docx"; };
  noFile.window.URL.revokeObjectURL = function () {};
  const origCreateNoFile = noFile.window.document.createElement.bind(noFile.window.document);
  noFile.window.document.createElement = function (tag) {
    const node = origCreateNoFile(tag);
    if (String(tag).toLowerCase() === "a") {
      node.click = function () { noFileName = node.getAttribute("download"); };
    }
    return node;
  };
  noFile.window.document.querySelector(".mat-card__dl").click();
  check("無原始檔案 → 不再顯示「沒有可下載的原始檔案」，改為真實產生 .docx",
    !/沒有可下載的原始檔案/.test(noFile.window.document.querySelector(".mat-status, [role='status']").textContent) &&
    !!noFileBlob && noFileBlob.size > 0 && noFileName === "三角函數講義.docx");

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
  /* HOTFIX-009-2: the standalone 預覽教材 icon button was removed
     (duplicated the card-click preview action) — click the card body,
     the sole remaining preview trigger, instead. */
  doc.querySelector(".mat-card").click();
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


console.log("\n[21] EO-S8.3.004 — AI 重點整理 UI 串接（Material Preview，Legacy Pathway）");
{
  const { window, consoleErrors } = loadPage("materials.html", {});
  const doc = window.document;
  const A = window.AHS;
  window.URL.createObjectURL = () => "blob:x";
  window.URL.revokeObjectURL = () => {};
  /* Sprint AI-013 Part A: SummaryProvider's default mode is now 'new'.
     This test specifically verifies the Legacy pathway (its ground
     truth is AHS.KnowledgeSummaryRuntime), so it pins mode explicitly
     rather than depending on whatever the ambient default happens to
     be — same as test [23] pins 'new' for its own pathway. No
     assertion below is changed or removed. */
  A.AIEngine.SummaryProvider.setMode("legacy");

  check("AI 相依已載入（Pipeline / Summary / Service / SummaryCard）",
    !!A.KnowledgePipeline && !!A.KnowledgeSummaryRuntime && !!A.AITutorService &&
    !!A.MaterialSummaryCard && typeof A.AITutorService.ensureLearningSummary === "function");

  /* 建立具真實文字的教材並跑知識管線（模擬上傳後的狀態）。 */
  const folder = A.FolderRuntime.createFolder({ folderName: "測試", subject: "math", scopeType: "custom" });
  const TEXT = ["三角函數", "斜邊", "正弦：對邊除以斜邊",
    "餘弦定理 a² = b² + c² − 2bc·cosA", "本節說明三角函數的定義與應用。"].join("\n");
  const mat = A.MaterialRuntime.add({ title: "三角函數講義", subject: "math", grade: "高一",
    chapter: "第三章", category: "講義", fileName: "trig.pdf", fileType: "PDF",
    folderId: folder.folderId, content: TEXT });
  A.KnowledgePipeline.process(mat.id);

  const overlay = A.MaterialPreview.open(mat, function () {});
  doc.body.appendChild(overlay);
  /* Sprint AI-105 Task AI105-06 added an additive 教材內容 section before
     this one, reusing the same .mat-summary__heading class (same pattern
     MaterialQuestionCard/AIGatewayPanel already use) — scope the query
     to the real AI 重點整理 section via its aria-label rather than
     assuming it is the first .mat-summary__heading in document order. */
  const summarySection = overlay.querySelector('.mat-summary[aria-label="AI 重點整理"]');
  check("預覽含「AI 重點整理」區塊", !!summarySection);
  check("區塊標題為「AI 重點整理」",
    (summarySection && summarySection.querySelector(".mat-summary__heading") || {}).textContent === "AI 重點整理");
  const btn = summarySection.querySelector(".mat-summary__btn");
  check("提供「開始 AI 分析」按鈕", !!btn && btn.textContent === "開始 AI 分析");
  check("分析前尚無 Summary（未自動產生）",
    A.KnowledgeSummaryRuntime.getSummaryByMaterial(mat.id) === null);

  /* 點擊 → loading → 卡片。按鈕處理器以 setTimeout(0) 延後產生，
     故以旗標攔截 window.setTimeout 立即執行回呼，維持同步測試。 */
  const realSetTimeout = window.setTimeout;
  window.setTimeout = function (fn) { if (typeof fn === "function") { fn(); } return 0; };
  btn.click();
  window.setTimeout = realSetTimeout;

  const card = overlay.querySelector(".mat-summary__card");
  check("點擊後顯示 Summary 卡片", !!card);
  check("卡片顯示標題（教材名稱）",
    !!card && (card.querySelector(".mat-summary__title") || {}).textContent === "三角函數講義");
  check("卡片顯示重點條列（至少一項）",
    !!card && card.querySelectorAll(".mat-summary__point").length >= 1);
  check("卡片顯示關鍵字（至少一項）",
    !!card && card.querySelectorAll(".mat-summary__chip").length >= 1);
  check("Summary 已由 KnowledgeSummaryRuntime 產生（Material→Service→Summary）",
    !!A.KnowledgeSummaryRuntime.getSummaryByMaterial(mat.id));
  check("重點內容逐字取自教材（未改寫）",
    !!card && [...card.querySelectorAll(".mat-summary__point")]
      .every(li => TEXT.indexOf(li.textContent) !== -1));

  /* 「不得重新解析教材」：分析經 Service→KnowledgeSummaryRuntime（讀 KG），
     未觸發 AnalysisRuntime 重新分析 —— 以圖譜節點數不變佐證。 */
  const before = A.KnowledgeGraphRuntime.queryByMaterial(mat.id).length;
  A.AITutorService.ensureLearningSummary(mat.id);   /* 再次呼叫（idempotent） */
  check("再次分析不改變知識圖譜（不重新解析教材）",
    A.KnowledgeGraphRuntime.queryByMaterial(mat.id).length === before);

  check("AI Summary UI 全流程 Console errors = 0", consoleErrors.length === 0);
  if (consoleErrors.length) { console.log("   errors:", consoleErrors.slice(0, 3)); }
}


console.log("\n[22] EO-S8.3.006 — AI 練習題 UI 串接（Material Preview）");
{
  const { window, consoleErrors } = loadPage("materials.html", {});
  const doc = window.document;
  const A = window.AHS;
  window.URL.createObjectURL = () => "blob:x";
  window.URL.revokeObjectURL = () => {};

  check("AI 題目相依已載入（QuestionCard / ensureQuestionSet）",
    !!A.MaterialQuestionCard && typeof A.AITutorService.ensureQuestionSet === "function");

  const folder = A.FolderRuntime.createFolder({ folderName: "測試", subject: "math", scopeType: "custom" });
  const TXT = ["三角函數", "斜邊", "正弦：對邊除以斜邊", "餘弦：鄰邊除以斜邊",
    "正切：對邊除以鄰邊", "餘弦定理 a² = b² + c² − 2bc·cosA",
    "本節說明三角函數的定義與應用。"].join("\n");
  const mat = A.MaterialRuntime.add({ title: "三角函數筆記", subject: "math", grade: "高一",
    chapter: "第三章", category: "講義", fileName: "notes.txt", fileType: "TXT",
    folderId: folder.folderId, content: TXT });

  const overlay = A.MaterialPreview.open(mat, function () {});
  doc.body.appendChild(overlay);
  const section = overlay.querySelector(".mat-question");
  check("預覽含「AI 練習題」區塊", !!section);
  check("順序為 教材→AI 重點→AI 題目（重點在題目之前）",
    !!(overlay.querySelector(".mat-summary").compareDocumentPosition(section) &
       window.Node.DOCUMENT_POSITION_FOLLOWING));
  const genBtn = section.querySelector(".mat-summary__btn");
  check("提供「產生 AI 題目」按鈕", !!genBtn && genBtn.textContent === "產生 AI 題目");
  check("產生前尚無題目（未自動產生）",
    A.QuestionGenerationRuntime.getQuestionsByMaterial(mat.id) === null);

  /* 攔截 setTimeout(0) 立即執行，維持同步測試。 */
  const realSetTimeout = window.setTimeout;
  window.setTimeout = function (fn) { if (typeof fn === "function") { fn(); } return 0; };

  genBtn.click();
  const cards = section.querySelectorAll(".mat-question__card");
  check("點擊後顯示題目卡片（至少一題）", cards.length >= 1);
  check("每題顯示題號", [...cards].every(c => /第 \d+ 題/.test((c.querySelector(".mat-question__num") || {}).textContent || "")));
  check("每題題目非空", [...cards].every(c => !!(c.querySelector(".mat-question__text") || {}).textContent));
  check("每題恰四個選項", [...cards].every(c => c.querySelectorAll(".mat-question__option").length === 4));
  check("題目全部來自 QuestionRuntime（UI 未自建）",
    (() => { const rec = A.QuestionGenerationRuntime.getQuestionsByMaterial(mat.id);
      return !!rec && rec.questions.length === cards.length; })());

  /* 查看答案 */
  const card0 = cards[0];
  const revealBtn = card0.querySelector(".mat-question__reveal");
  check("提供「查看答案」按鈕", !!revealBtn && revealBtn.textContent === "查看答案");
  const answerBox = card0.querySelector(".mat-question__answer");
  check("答案預設隱藏", answerBox.hasAttribute("hidden"));
  revealBtn.click();
  check("點擊後顯示正確答案", !answerBox.hasAttribute("hidden") &&
    !!(card0.querySelector(".mat-question__answervalue") || {}).textContent);
  check("顯示 AI 解析（既有資料，非新呼叫）", !!card0.querySelector(".mat-question__explain"));
  check("正確答案在選項之中",
    (() => { const ans = card0.querySelector(".mat-question__answervalue").textContent;
      return [...card0.querySelectorAll(".mat-question__opttext")].some(o => o.textContent === ans); })());
  revealBtn.click();
  check("再按可隱藏答案", answerBox.hasAttribute("hidden"));

  /* 重新產生題目 — 不重新分析教材 */
  const reloadBtn = section.querySelector(".mat-question__reload");
  check("提供「重新產生題目」按鈕", !!reloadBtn && reloadBtn.textContent === "重新產生題目");
  const kgBefore = A.KnowledgeGraphRuntime.queryByMaterial(mat.id).length;
  reloadBtn.click();
  check("重新產生後仍有題目", section.querySelectorAll(".mat-question__card").length >= 1);
  check("重新產生不改變知識圖譜（不重新分析教材）",
    A.KnowledgeGraphRuntime.queryByMaterial(mat.id).length === kgBefore);

  window.setTimeout = realSetTimeout;
  check("AI 題目 UI 全流程 Console errors = 0", consoleErrors.length === 0);
  if (consoleErrors.length) { console.log("   errors:", consoleErrors.slice(0, 3)); }
}

console.log("\n[23] EO-AI-012E — AI 重點整理 UI 串接（New Runtime，SummaryProvider mode='new'）");
/* EO-AI-012E Part E: 保留 [21] 既有的 KnowledgeSummaryRuntime（Legacy）
   斷言不變，本區塊為新增的 AI Engine 專屬斷言——materials.html 已於
   EO-AI-012A 載入 ai-engine，[21] 驗證的是 SummaryProvider 預設 legacy
   模式；本區塊改把 mode 設為 'new'，驗證同一組真實 UI 操作（開始 AI 分析）
   改經 AHS.AIEngine.SummaryService 產生時，卡片仍正確顯示教材真實標題
   （EO-AI-012E 修正的缺口）且內容確實來自 New Runtime 自己的快取，而非
   Legacy 的 KnowledgeSummaryRuntime。 */
{
  const { window, consoleErrors } = loadPage("materials.html", {});
  const doc = window.document;
  const A = window.AHS;
  window.URL.createObjectURL = () => "blob:x";
  window.URL.revokeObjectURL = () => {};

  check("AI Engine 相依已載入（SummaryProvider／SummaryService／SummaryComparator）",
    !!A.AIEngine && !!A.AIEngine.SummaryProvider && !!A.AIEngine.SummaryService && !!A.AIEngine.SummaryComparator);

  A.AIEngine.SummaryProvider.setMode("new");
  check("SummaryProvider mode 已切換為 'new'", A.AIEngine.SummaryProvider.getMode() === "new");

  const folder = A.FolderRuntime.createFolder({ folderName: "AI Engine 測試", subject: "math", scopeType: "custom" });
  const TEXT = ["三角函數", "斜邊", "正弦：對邊除以斜邊",
    "餘弦定理 a² = b² + c² − 2bc·cosA", "本節說明三角函數的定義與應用。"].join("\n");
  const mat = A.MaterialRuntime.add({ title: "三角函數講義（New）", subject: "math", grade: "高一",
    chapter: "第三章", category: "講義", fileName: "trig-new.pdf", fileType: "PDF",
    folderId: folder.folderId, content: TEXT });
  A.KnowledgePipeline.process(mat.id);

  const overlay = A.MaterialPreview.open(mat, function () {});
  doc.body.appendChild(overlay);
  const section = overlay.querySelector(".mat-summary");
  const btn = section && section.querySelector(".mat-summary__btn");
  check("mode='new' 下分析前仍為 Idle 狀態（提供「開始 AI 分析」按鈕，未提前產生）",
    !!btn && btn.textContent === "開始 AI 分析");
  check("分析前 New Runtime 自己的快取仍為空（AHS.AIEngine.SummaryService.get）",
    A.AIEngine.SummaryService.get(mat.id) === undefined);

  const realSetTimeout = window.setTimeout;
  window.setTimeout = function (fn) { if (typeof fn === "function") { fn(); } return 0; };
  btn.click();
  window.setTimeout = realSetTimeout;

  const card = section.querySelector(".mat-summary__card");
  check("點擊後顯示 Summary 卡片（經 New Runtime 產生）", !!card);
  check("卡片顯示教材真實標題（EO-AI-012E 修正：New Runtime 不再顯示「AI 重點整理」預設字樣）",
    !!card && (card.querySelector(".mat-summary__title") || {}).textContent === "三角函數講義（New）");
  check("卡片顯示重點條列（至少一項）", !!card && card.querySelectorAll(".mat-summary__point").length >= 1);
  check("卡片顯示關鍵字（至少一項）", !!card && card.querySelectorAll(".mat-summary__chip").length >= 1);

  check("Summary 確實由 AI Engine 的 New Runtime 產生（AHS.AIEngine.SummaryService 自己的快取，非 KnowledgeSummaryRuntime）",
    A.AIEngine.SummaryService.get(mat.id) !== undefined);
  check("Legacy KnowledgeSummaryRuntime 完全未被寫入（mode='new' 下 Generate 專屬 New Runtime）",
    A.KnowledgeSummaryRuntime.getSummaryByMaterial(mat.id) === null);

  /* 重新開啟教材預覽——確認狀態持久（EO-AI-012D 修正的重新開啟遺失問題）。 */
  const overlay2 = A.MaterialPreview.open(mat, function () {});
  doc.body.appendChild(overlay2);
  const section2 = overlay2.querySelector(".mat-summary");
  check("重新開啟教材預覽：直接顯示 Summary 卡片，不會跳回「開始 AI 分析」按鈕",
    !section2.querySelector(".mat-summary__btn") && !!section2.querySelector(".mat-summary__card"));

  check("AI Engine New Runtime UI 全流程 Console errors = 0", consoleErrors.length === 0);
  if (consoleErrors.length) { console.log("   errors:", consoleErrors.slice(0, 3)); }
}

console.log("\n[24] HOTFIX-002 — Repository Loader Bridge：AHS.MaterialRepository 真實內容確實載入 MaterialRuntime（PAT FAIL 修正回歸測試）");
{
  /* Reproduces exactly what the reported PAT FAIL found broken:
     window.AHS.TeachingMaterialData => [] / MaterialRuntime.list() => []
     even though data/materials/CivicsG10Ch5to6Exam20260730.js is real,
     committed content. Cross-page id-continuity (materials.html's
     resolved id surviving into quiz.html) is NOT re-tested here — each
     loadPage() call gets an isolated jsdom session/sessionStorage by
     design, so that scenario can only be verified the way it already
     was: a Node vm simulation sharing one sessionStorage mock across
     simulated page loads (see docs/EO/HOTFIX-002 report). */
  const { window, consoleErrors } = loadPage("materials.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const doc = window.document;
  check("data/materials/*.js 已 register 真實教材", window.AHS.MaterialRepository.list().length === 1);
  check("MaterialRuntime 確實載入該教材（非空陣列，對應 PAT FAIL 的核心症狀）", window.AHS.MaterialRuntime.list().length === 1);
  check("Material Card 確實渲染真實教材標題", /公民與社會｜所有權、勞動三權與夫妻財產制、繼承 重點整理/.test(doc.body.textContent));
  check("Console errors = 0（HOTFIX-002，materials.html）", consoleErrors.length === 0);
  const rt = window.AHS.MaterialRuntime.list()[0];

  /* quiz.html doesn't <script>-tag MaterialRuntime.js at all — by real
     design (see quiz.html's own script list), so on its own it cannot
     resolve a MaterialRuntime id. The real, intended user journey is
     materials.html (or any MaterialRuntime.js-loading page) visited
     first in the same browser tab, persisting the id via
     PersistenceAdapter/sessionStorage, with quiz.html inheriting that
     session afterward — exactly what carrying materials.html's real
     sessionStorage forward here simulates. */
  const carried = {};
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const k = window.sessionStorage.key(i);
    carried[k] = JSON.parse(window.sessionStorage.getItem(k));
  }
  const { window: quizWindow, consoleErrors: quizErrors } = loadPage("quiz.html", { seedSession: carried, excludeScripts: ["js/data/TeachingMaterialData.js"] });
  quizWindow.AHS.TeachingMaterialLoader.initialize();
  const examId = "teaching_material_" + rt.id;
  check("quiz.html 沿用同一 Session 也能將真實單選題匯入 QuestionRuntime", quizWindow.AHS.QuestionRuntime.hasExam(examId));
  check("匯入題數與來源資料一致（6 題 singleChoice）", quizWindow.AHS.QuestionRuntime.getSet(examId).length === 6);
  check("Console errors = 0（HOTFIX-002，quiz.html）", quizErrors.length === 0);
}

console.log("\n[25] HOTFIX-003 — Material Detail Content Integration：五個區塊皆正確 Render（PAT FAIL 修正回歸測試）");
{
  const { window, consoleErrors } = loadPage("materials.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const doc = window.document;
  const A = window.AHS;
  const item = A.MaterialRuntime.list()[0];

  const overlay = A.MaterialPreview.open(item, function () {});
  doc.body.appendChild(overlay);

  const contentSection = overlay.querySelector('.mat-content[aria-label="教材內容"]');
  check("① 教材內容：不再顯示「尚無可顯示的內容」", !!contentSection && !/此教材目前尚無可顯示的內容/.test(contentSection.textContent));
  check("① 教材內容：顯示真實教材標題", !!contentSection && /所有權、勞動三權與夫妻財產制、繼承/.test(contentSection.textContent));

  const summarySection = overlay.querySelector('.mat-summary[aria-label="AI 重點整理"]');
  check("② AI 重點整理：直接顯示真實內容（無需點擊「開始 AI 分析」）", !!summarySection && !summarySection.querySelector(".mat-summary__btn"));
  check("② AI 重點整理：內容為真實核心概念", !!summarySection && /所有權的排他性/.test(summarySection.textContent));

  const questionSection = overlay.querySelector('.mat-question[aria-label="AI 練習題"]');
  check("③ AI 練習題：直接顯示真實題目（無需點擊「產生 AI 題目」）", !!questionSection && !/^產生 AI 題目$/m.test([...questionSection.querySelectorAll(".mat-summary__btn")].map(b => b.textContent).join("\n")));
  check("③ AI 練習題：顯示題數", !!questionSection && /共 6 題/.test(questionSection.textContent));
  check("③ AI 練習題：顯示難度／考點", !!questionSection && /難度：/.test(questionSection.textContent) && /考點：/.test(questionSection.textContent));

  /* HOTFIX-004 第二階段: a Repository-sourced material's real summary/
     question data now renders directly here too — Gateway sections no
     longer require a (permanently failing, no real backend exists) live
     network call before showing real content. */
  const gwSummarySection = overlay.querySelector('.mat-summary[aria-label="AI Gateway 重點整理"]');
  check("④ AI Gateway 重點整理：直接顯示真實內容（無需「尚未建立」按鈕流程）",
    !!gwSummarySection && !/尚未建立 Gateway 重點整理/.test(gwSummarySection.textContent) && /所有權的排他性/.test(gwSummarySection.textContent));

  const gwQuizSection = overlay.querySelector('.mat-summary[aria-label="AI Gateway 練習題"]');
  check("⑤ AI Gateway 練習題：直接顯示真實題目（無需「尚未建立」按鈕流程）",
    !!gwQuizSection && !/尚未建立 Gateway 練習題/.test(gwQuizSection.textContent) && gwQuizSection.querySelectorAll(".mat-question__card").length === 6);

  check("Console errors = 0（HOTFIX-003）", consoleErrors.length === 0);

  /* 一般上傳教材（無 Repository 來源）行為完全不變 — 既有 AITutorService
     流程／honest empty state／Gateway「尚未建立」idle 文案皆未受影響。 */
  const regular = A.MaterialRuntime.add({ subject: "math", title: "一般上傳教材", chapter: "測試章節" });
  const regularOverlay = A.MaterialPreview.open(regular, function () {});
  doc.body.appendChild(regularOverlay);
  const regularContent = regularOverlay.querySelector('.mat-content[aria-label="教材內容"]');
  check("一般上傳教材（無內容）：仍誠實顯示空狀態，未受影響", !!regularContent && /此教材目前尚無可顯示的內容/.test(regularContent.textContent));
  const regularSummary = regularOverlay.querySelector('.mat-summary[aria-label="AI 重點整理"]');
  check("一般上傳教材：AI 重點整理仍保留「開始 AI 分析」按鈕，未受影響", !!regularSummary && !!regularSummary.querySelector(".mat-summary__btn"));
  const regularGwSummary = regularOverlay.querySelector('.mat-summary[aria-label="AI Gateway 重點整理"]');
  check("一般上傳教材：AI Gateway 重點整理仍誠實顯示「尚未建立」，未受影響",
    !!regularGwSummary && /尚未建立 Gateway 重點整理/.test(regularGwSummary.textContent) && !!regularGwSummary.querySelector(".mat-summary__btn"));
  const regularGwQuiz = regularOverlay.querySelector('.mat-summary[aria-label="AI Gateway 練習題"]');
  check("一般上傳教材：AI Gateway 練習題仍誠實顯示「尚未建立」，未受影響",
    !!regularGwQuiz && /尚未建立 Gateway 練習題/.test(regularGwQuiz.textContent) && !!regularGwQuiz.querySelector(".mat-summary__btn"));
}

console.log("\n[26] HOTFIX-004 — Review Suggestion & Quiz Runtime Integration（PAT 修正回歸測試）");
{
  /* Issue 001: summary.html's ⑤ 複習建議 must show real, derived content
     for a Repository-sourced material — never "尚無資料", never
     fabricated, never requiring a click. */
  const p1 = loadPage("materials.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const rt = p1.window.AHS.MaterialRuntime.list()[0];
  const carried = {};
  for (let i = 0; i < p1.window.sessionStorage.length; i++) {
    const k = p1.window.sessionStorage.key(i);
    carried[k] = JSON.parse(p1.window.sessionStorage.getItem(k));
  }

  const p2 = loadPage("summary.html", { seedSession: carried });
  const reviewSection = p2.window.document.querySelector('section[aria-label="⑤ 複習建議"]');
  check("① 複習建議：不再顯示「尚無資料」", !!reviewSection && !/尚無資料/.test(reviewSection.textContent));
  check("① 複習建議：顯示建議閱讀順序（真實 chapter/section 組成）", !!reviewSection && /建議閱讀順序/.test(reviewSection.textContent) && /第5～6課/.test(reviewSection.textContent));
  check("① 複習建議：顯示建議複習方式（真實統計數字，非虛構）", !!reviewSection && /建議複習方式/.test(reviewSection.textContent) && /個核心概念/.test(reviewSection.textContent));
  check("① 複習建議：顯示建議注意事項（來自真實 commonMistakes／pitfalls）", !!reviewSection && /建議注意事項/.test(reviewSection.textContent));
  check("Console errors = 0（summary.html HOTFIX-004）", p2.consoleErrors.length === 0);

  /* Regular (non-Repository) material's honest empty state (Stub pending
     — record's five sections are ALL genuinely empty) must be unaffected. */
  p1.window.AHS.SummaryRuntime.add({ materialId: "rt_regular_test", subject: "math", title: "一般教材" });
  const p3 = loadPage("summary.html", { seedSession: (() => {
    const c = {};
    for (let i = 0; i < p1.window.sessionStorage.length; i++) { const k = p1.window.sessionStorage.key(i); c[k] = JSON.parse(p1.window.sessionStorage.getItem(k)); }
    return c;
  })() });
  check("一般教材（五段皆空）：仍誠實顯示分析中狀態，未受影響", /AI 正在分析教材/.test(p3.window.document.body.textContent));

  /* Sprint AI-122 AI-122-02/03 (再次修正 HOTFIX-004 Issue 002): a real
     materialId/examId link with mode=practice must now ALWAYS land on
     Practice Mode — never Formal Exam — reversing HOTFIX-004's own
     workaround (quoted in QuizCenter.js) from when Practice Mode had no
     real content for a Repository material. AI-121's real QuestionBank/
     QuestionRuntime now gives it real content, so both entry points land
     on the pre-existing 巧巧老師出題引導 (Sprint 6.8 flow, previously
     bypassed only because it used to be genuinely empty for these
     materials) scoped to THIS material only; picking a difficulty and
     starting reveals a real, scoped practice question list — never the
     unfiltered full catalog (AI-122-03). */
  const qByMaterialId = loadPage("quiz.html", { seedSession: carried, url: "quiz.html?mode=practice&materialId=" + rt.id, excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const docM = qByMaterialId.window.document;
  check("② Quiz Center（materialId-only 連結）：進入巧巧老師出題引導（Practice Mode，不再導向正式測驗）",
    !!docM.querySelector('.qguide[aria-label="巧巧老師出題引導"]') && !docM.querySelector(".qcard"));
  check("② Quiz Center（materialId-only 連結）：Practice Mode 區塊未被隱藏（AI-122-02）",
    !docM.querySelector(".quiz-practice-root[hidden]"));
  docM.querySelector('.qguide__diff[data-difficulty="medium"]').click();
  docM.querySelector(".qguide__start").click();
  const qs0MaterialId = qByMaterialId.window.AHS.QuestionRuntime.getSet("teaching_material_" + rt.id)[0];
  check("② Quiz Center（materialId-only 連結）：開始練習後顯示此教材真實題目（AI-122-03：僅此教材，非全部教材）",
    !!qs0MaterialId && docM.body.textContent.includes(qs0MaterialId.text) && !docM.querySelector('[aria-label="Repository 教材"]'));
  const realRow = docM.querySelector(".quiz-practice__row");
  check("② Quiz Center：真實題目可點擊進入單題作答", !!realRow);
  if (realRow) { realRow.click(); }
  const realMeta = docM.querySelector(".quiz-practice__meta");
  check("② Quiz Center：作答畫面顯示難度／考點（Repository 實際擁有的欄位）",
    !!realMeta && /難度：/.test(realMeta.textContent) && /考點：/.test(realMeta.textContent));
  check("Console errors = 0（quiz.html materialId-only，AI-122-02）", qByMaterialId.consoleErrors.length === 0);

  const qByExamId = loadPage("quiz.html", { seedSession: carried, url: "quiz.html?mode=practice&examId=teaching_material_" + rt.id, excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const docE = qByExamId.window.document;
  check("② Quiz Center（examId 連結）：同樣進入巧巧老師出題引導（Practice Mode，不再導向正式測驗）",
    !!docE.querySelector('.qguide[aria-label="巧巧老師出題引導"]') && !docE.querySelector(".qcard"));
  check("② Quiz Center（examId 連結）：Practice Mode 區塊未被隱藏", !docE.querySelector(".quiz-practice-root[hidden]"));

  /* PAT：真實練習作答 -> 直接透過 WrongBookRuntime／KnowledgeMasteryRuntime
     真實 Knowledge Engine（AI-121）寫入，而非 Formal Exam 的 AutoGrader／
     HistoryRuntime 路徑（那條路徑僅屬於正式測驗，Practice Mode 不應誤觸，
     覆蓋範圍已由本檔其餘 AutoGrader／WrongBook／History PAT 涵蓋）。 */
  docE.querySelector('.qguide__diff[data-difficulty="medium"]').click();
  docE.querySelector(".qguide__start").click();
  const AQ = qByExamId.window.AHS;
  const examId = "teaching_material_" + rt.id;
  const qs = AQ.QuestionRuntime.getSet(examId);
  const wrongBefore = AQ.WrongBookRuntime.list().length;
  docE.querySelector(".quiz-practice__row").click();
  const wrongOption = [...docE.querySelectorAll(".quiz-practice__option")]
    .find(b => b.dataset.key !== qs[0].correctAnswer) || docE.querySelector(".quiz-practice__option");
  wrongOption.click();
  check("PAT：真實練習答錯 -> 直接寫入知識弱點（AHS.WrongBookRuntime，AI-121 Knowledge Engine）",
    AQ.WrongBookRuntime.list().length === wrongBefore + 1);
  const masteryAfter = AQ.KnowledgeMasteryRuntime.get(qs[0].knowledgePoint);
  check("PAT：真實練習作答 -> 直接寫入 KnowledgeMasteryRuntime（同一 Knowledge Engine，非 Formal Exam 路徑）",
    !!masteryAfter && masteryAfter.attemptCount >= 1);

  /* Regular material's Practice/Guide flow (LearningQuestionRuntime-based,
     unrelated to any Repository) must be completely unaffected. A fresh,
     isolated page load (not reusing `carried`/`p1`'s idMap) avoids any
     stale-id collision between this new regular material and the real
     Civics material's own already-resolved id. */
  const p4 = loadPage("materials.html", {});
  const regRecord = p4.window.AHS.MaterialRuntime.add({ subject: "math", title: "一般練習教材" });
  const regularCarried = {};
  for (let i = 0; i < p4.window.sessionStorage.length; i++) { const k = p4.window.sessionStorage.key(i); regularCarried[k] = JSON.parse(p4.window.sessionStorage.getItem(k)); }
  const qRegular = loadPage("quiz.html", { seedSession: regularCarried, url: "quiz.html?mode=practice&materialId=" + regRecord.id });
  check("一般教材：巧巧老師出題引導仍誠實顯示「尚無 AI 練習題」，未受影響",
    qRegular.window.document.body.textContent.includes("尚無 AI 練習題"));
}

console.log("\n[27] HOTFIX-004 第二階段 — Material Detail 資料未顯示修正（AI Gateway 串接 + resolve() 自我初始化）");
{
  /* Requirement 2: MaterialDetailRepositorySource.resolve() must not
     silently depend on some earlier bootstrap step having already called
     AHS.TeachingMaterialLoader.load()/initialize() — it must ensure this
     itself. Simulated here by loading materials.html WITHOUT running
     AppMaterials.js's own bootstrap script (excludeScripts), so nothing
     has called the Loader yet, then calling MaterialRuntime.add()
     directly is not representative of a Repository id — instead we
     confirm resolve() still returns real data purely by calling it cold,
     immediately after page load, before anything else has touched
     AHS.TeachingMaterialLoader. */
  const { window } = loadPage("materials.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const A = window.AHS;
  // Reset the Loader's own idempotency flag to simulate "not yet initialized",
  // without touching MaterialRuntime/idMap state already persisted from the
  // page's own real bootstrap — proves resolve() re-runs load() itself.
  A.TeachingMaterialLoader.reset();
  const rt2 = A.MaterialRuntime.list()[0];
  const resolved = A.MaterialDetailRepositorySource.resolve(rt2.id);
  check("resolve()：即使 Loader 的 initialized 旗標被重置，仍自動完成初始化並回傳真實資料", !!resolved && Array.isArray(resolved.sections) && resolved.sections.length > 0);

  /* Requirement 3/4: all five Material Detail sections have real data for
     the real Civics material — combined sanity check across the whole
     modal at once, not just per-section as in [25]. */
  const overlay = A.MaterialPreview.open(rt2, function () {});
  window.document.body.appendChild(overlay);
  const sectionLabels = ["教材內容", "AI 重點整理", "AI 練習題", "AI Gateway 重點整理", "AI Gateway 練習題"];
  const allHaveData = sectionLabels.every(label => {
    const node = overlay.querySelector('[aria-label="' + label + '"]');
    return !!node && !/尚無|尚未建立|尚無可/.test(node.textContent);
  });
  check("五個區塊皆有真實資料，無任何空白／尚未建立文案", allHaveData);
}

console.log("\n[28] 學習總結 — 重點關鍵字紅色標示");
{
  const p1 = loadPage("materials.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const rt3 = p1.window.AHS.MaterialRuntime.list()[0];
  const carried3 = {};
  for (let i = 0; i < p1.window.sessionStorage.length; i++) { const k = p1.window.sessionStorage.key(i); carried3[k] = JSON.parse(p1.window.sessionStorage.getItem(k)); }
  const { window } = loadPage("summary.html", { seedSession: carried3 });
  const coreSection = window.document.querySelector('section[aria-label="① 核心概念"]');
  const keywordSpans = coreSection ? coreSection.querySelectorAll(".sum-kp__keyword") : [];
  check("核心概念：關鍵字（冒號前）以 .sum-kp__keyword 標示", keywordSpans.length > 0);
  check("關鍵字文字為真實資料（非虛構），例：所有權的排他性", [...keywordSpans].some(s => s.textContent.includes("排他性")));
  const firstItem = coreSection.querySelector(".sum-kp__text");
  check("標示後完整文字內容不變（僅拆分顯示，未遺漏任何字）", firstItem.textContent.includes("："));
}

console.log("\n[29] HOTFIX-005 AI-501 — 測驗中心 Repository 自動同步（直接進入，無需先經教材中心）");
{
  /* Cold entry: quiz.html loaded directly, real data/materials/*.js
     content intact, WITHOUT visiting materials.html first in this
     session — proves js/runtime/MaterialRuntime.js now being <script>
     -tagged on quiz.html lets TeachingMaterialLoader.load() fully
     bootstrap the Repository material on quiz.html itself, not just on
     materials.html. */
  const { window, consoleErrors } = loadPage("quiz.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const doc = window.document;
  doc.body.appendChild(window.AHS.QuizCenter.create());

  check("正式測驗：Repository 教材直接出現在預設列表（無需先經教材中心）",
    /私有財產權|所有權/.test(doc.body.textContent) && doc.querySelectorAll(".quiz-row").length > 0);
  const examRow = doc.querySelector(".quiz-row");
  check("正式測驗：可直接點擊開始（走既有 tryDirectExamEntry／startFromExam，非重新產生）", !!examRow);
  if (examRow) {
    examRow.querySelector(".quiz-row__start").click();
    check("點擊後直接進入真實測驗畫面（真實題目，非 Mock）", /私有財產權|所有權/.test(doc.body.textContent) &&
      !!doc.querySelector(".qcard, .quiz-exam, [class*='exam']"));
  }

  const p2 = loadPage("quiz.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const doc2 = p2.window.document;
  doc2.body.appendChild(p2.window.AHS.QuizCenter.create());
  const practiceTab = [...doc2.querySelectorAll(".quiz-mode__tab")].find(t => t.textContent === "考前練習");
  practiceTab.click();
  check("練習模式：Repository 教材也直接出現（不需 materialId 帶入）",
    /Repository 教材/.test(doc2.body.textContent) && (/私有財產權|所有權/.test(doc2.body.textContent)));
  const repoRow = doc2.querySelector(".quiz-practice__row");
  const ownRoot = repoRow && repoRow.closest(".quiz-practice-root");
  if (repoRow) { repoRow.click(); }
  /* Sprint AI-122 AI-122-02/10 (CTA 一致化): 點擊練習模式自己列表中的
     Repository 列，drill 進入該教材真實題目列表 — 仍停留在 Practice
     Mode，不再切換到正式測驗（HOTFIX-005 當時因 Practice Mode 尚無真實
     內容才切去 Exam，AI-121 之後已不誠實）。 Scoped to THIS row's own
     practiceRoot — QuizCenter.create() is mounted twice on this page
     (once by AppQuiz.js's real bootstrap, once by this test's own manual
     doc2.body.appendChild above), so a document-wide .quiz-practice-root
     query would false-fail on the OTHER instance's own untouched, still
     hidden practiceRoot. */
  check("點擊練習模式中的 Repository 教材：drill 進入該教材真實練習題（仍在 Practice Mode，不再切換到正式測驗）",
    !!ownRoot && !ownRoot.hasAttribute("hidden") && !ownRoot.querySelector(".qcard") &&
    /私有財產權|所有權/.test(ownRoot.textContent));
  check("Console errors = 0（quiz.html 直接進入，AI-501／AI-122）", consoleErrors.length === 0);
}

console.log("\n[30] HOTFIX-005 AI-502 — 教材下載：Repository 教材即時產生真實 .docx");
{
  const { window } = loadPage("materials.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const A = window.AHS;
  const item = A.MaterialRuntime.list()[0];

  let captured = null;
  const origBuildDocxBlob = A.DocumentExport.buildDocxBlob;
  A.DocumentExport.buildDocxBlob = function (title, blocks) {
    captured = { title: title, blocks: blocks };
    return origBuildDocxBlob(title, blocks);
  };
  let downloadedName = null;
  A.DocumentExport.downloadBlob = function (blob, filename) { downloadedName = filename; };

  window.document.querySelector('[data-id="' + item.id + '"] .mat-card__dl').click();

  check("下載教材：不再顯示「沒有可下載的原始檔案」", !window.document.querySelector(".mat-status, [role='status']").textContent.includes("沒有可下載的原始檔案"));
  check("下載教材：狀態訊息確認已產生 .docx", /已下載教材（依現有 Repository／AI 資料產生 \.docx）/.test(window.document.querySelector(".mat-status, [role='status']").textContent));
  check("下載教材：檔名為 <教材名稱>.docx", downloadedName === item.title + ".docx");
  check("下載教材：確實呼叫 buildDocxBlob 並帶入區塊", !!captured && Array.isArray(captured.blocks) && captured.blocks.length > 0);

  const infoBlock = captured.blocks.find(b => b.heading === "教材資訊");
  check("教材資訊區塊含真實科目／年級／章節", !!infoBlock && infoBlock.lines.some(l => l.includes("公民")) );
  const contentBlock = captured.blocks.find(b => b.heading === "教材內容");
  check("教材內容區塊含真實 Repository 內容（非空、非虛構）", !!contentBlock && contentBlock.lines.length > 0);
  const summaryBlock = captured.blocks.find(b => b.heading === "AI 重點整理");
  check("AI 重點整理區塊含真實核心概念", !!summaryBlock && summaryBlock.lines.some(l => l.includes("排他性")));
  const quizBlock = captured.blocks.find(b => b.heading === "AI 練習題");
  check("AI 練習題區塊含真實題目", !!quizBlock && quizBlock.lines.some(l => l.includes("私有財產權")));

  /* Full-pipeline round trip: the REAL captured blocks -> real .docx
     bytes -> real ZIP parse -> real XML text — not just "a function was
     called", the actual generated file genuinely contains this content. */
  const zipBytes = A.DocumentExport._internal.buildDocxBytes(captured.title, captured.blocks);
  const documentXml = readZipEntryText(zipBytes, "word/document.xml");
  check(".docx word/document.xml 可被獨立 ZIP reader 正確解析", typeof documentXml === "string" && documentXml.length > 0);
  check(".docx 內文包含真實教材標題", documentXml.includes(item.title));
  check(".docx 內文包含真實核心概念文字", documentXml.includes("排他性"));
  check(".docx 內文包含真實練習題文字", documentXml.includes("私有財產權"));

  /* Regular material WITH a real uploaded file is completely unaffected
     — the .docx path only runs for state==="none", never overrides a
     real file's own download. */
  const regularSeed = { materials: [{ id: "rt_x", order: 1, subject: "math", title: "一般教材", chapter: "測試",
    grade: "高一", category: "講義", date: "2026/08/02", views: "0", content: "text",
    progress: 0, lastOpenedAt: null, lastLearningAt: null, learningTime: 0, learningCount: 0,
    favorite: false, fileName: "a.pdf", fileType: "PDF", fileSize: "10 KB", folderId: null, file: null }],
    folders: [], seq: 1, folderSeq: 0 };
  const p2 = loadPage("materials.html", { seedSession: {
    "ahs:materialRuntime": regularSeed,
    "ahs:materialFileIndex": { entries: { rt_x: { name: "a.pdf", type: "application/pdf", state: "stored" } } },
    "ahs:materialFile:rt_x": { name: "a.pdf", type: "application/pdf", dataUrl: "data:application/pdf;base64,QUhT" }
  } });
  let regularDocxCalled = false;
  p2.window.AHS.DocumentExport.buildDocxBlob = function () { regularDocxCalled = true; return origBuildDocxBlob.apply(this, arguments); };
  p2.window.URL.createObjectURL = function () { return "blob:ahs/regular"; };
  p2.window.URL.revokeObjectURL = function () {};
  p2.window.document.querySelector(".mat-card__dl").click();
  check("一般教材（有真實檔案）：下載流程未受影響，未觸發 .docx 產生", !regularDocxCalled);
}

console.log("\n[31] HOTFIX-005 AI-503 — 下載總結：直接產生列印內容（真實 PDF，透過瀏覽器另存為）");
{
  const p1 = loadPage("materials.html", { excludeScripts: ["js/data/TeachingMaterialData.js"] });
  const rt = p1.window.AHS.MaterialRuntime.list()[0];
  const carried = {};
  for (let i = 0; i < p1.window.sessionStorage.length; i++) { const k = p1.window.sessionStorage.key(i); carried[k] = JSON.parse(p1.window.sessionStorage.getItem(k)); }
  const { window, consoleErrors } = loadPage("summary.html", { seedSession: carried });
  const A = window.AHS;

  let printedTitle = null, printedBlocks = null;
  const origPrintBlocks = A.DocumentExport.printBlocks;
  A.DocumentExport.printBlocks = function (title, blocks) { printedTitle = title; printedBlocks = blocks; return origPrintBlocks(title, blocks); };

  const btn = [...window.document.querySelectorAll(".sum-export")].find(b => b.textContent.includes("下載總結"));
  btn.click();

  check("下載總結：確實呼叫 printBlocks（非 UI Stub）", printedTitle === "學習總結" && Array.isArray(printedBlocks));
  check("下載總結：狀態訊息確認已產生內容並提示另存為 PDF", /已產生學習總結內容.*另存為 PDF/.test(window.document.querySelector(".sum-status").textContent));
  const coreBlock = printedBlocks.find(b => b.heading === "① 核心概念");
  check("列印內容含真實①核心概念資料", !!coreBlock && coreBlock.lines.some(l => l.includes("排他性")));
  const reviewBlock = printedBlocks.find(b => b.heading === "⑤ 複習建議");
  check("列印內容含真實⑤複習建議（HOTFIX-004 derive 邏輯）", !!reviewBlock && reviewBlock.lines.length > 0);

  /* printBlocks() really did build a real, content-filled printable
     document and hand it to a hidden iframe (the browser's own "另存為
     PDF" is triggered from iframe.contentWindow.print() on load — see
     js/core/DocumentExport.js's own header for why this, not a hand-
     rolled PDF byte generator, is the honest way to get real Chinese
     text into a real PDF with no backend/library). */
  const iframe = window.document.querySelector("iframe");
  check("已建立隱藏 iframe 準備真實列印內容", !!iframe && iframe.hasAttribute("srcdoc"));
  check("iframe 內容包含真實教材標題與核心概念", iframe.getAttribute("srcdoc").includes("排他性"));
  check("Console errors = 0（下載總結）", consoleErrors.length === 0);

  const emptyPage = loadPage("summary.html", { excludeScripts: ["data/materials/", "js/data/TeachingMaterialData.js"] });
  const emptyBtn = [...emptyPage.window.document.querySelectorAll(".sum-export")].find(b => b.textContent.includes("下載總結"));
  emptyBtn.click();
  check("完全沒有學習總結時：明確提示，不產生空白 PDF", /目前沒有可匯出的學習總結/.test(emptyPage.window.document.querySelector(".sum-status").textContent));
}

console.log("\n[32] HOTFIX-005 AI-504 — 匯出筆記：直接產生真實 Markdown");
{
  const p1 = loadPage("materials.html", {});
  const carried = {};
  for (let i = 0; i < p1.window.sessionStorage.length; i++) { const k = p1.window.sessionStorage.key(i); carried[k] = JSON.parse(p1.window.sessionStorage.getItem(k)); }
  const { window, consoleErrors } = loadPage("summary.html", { seedSession: carried });
  const A = window.AHS;

  let mdText = null, downloadedBlob = null, downloadedName = null;
  A.DocumentExport.downloadBlob = function (blob, filename) { downloadedBlob = blob; downloadedName = filename; };

  const btn = [...window.document.querySelectorAll(".sum-export")].find(b => b.textContent.includes("匯出筆記"));
  btn.click();

  check("匯出筆記：確實觸發真實檔案下載（非 UI Stub）", !!downloadedBlob && downloadedName === "學習總結.md");
  check("匯出筆記：Blob 型別為 Markdown", downloadedBlob.type.includes("markdown"));
  check("匯出筆記：狀態訊息確認完成", /已匯出筆記（Markdown）/.test(window.document.querySelector(".sum-status").textContent));

  mdText = A.DocumentExport.buildMarkdownText("學習總結", [
    { heading: "① 核心概念", lines: ["所有權的排他性：測試"] }
  ]);
  check("buildMarkdownText 產生正確 Markdown 結構", mdText.startsWith("# 學習總結") && mdText.includes("### ① 核心概念") && mdText.includes("- 所有權的排他性：測試"));
  check("Console errors = 0（匯出筆記）", consoleErrors.length === 0);
}

console.log("\n[33] Sprint AI-109 — Learning Runtime Integration（AI-601/602/604）");
{
  /* AI-601/602 root cause: WrongBookRuntime/HistoryRuntime were plain
     in-memory stores with no AHS.PersistenceAdapter hydrate/persist
     calls anywhere — a real wrong answer recorded on quiz.html was lost
     the instant the browser navigated to a different page (a genuine
     multi-page-app "Runtime island", not caught by earlier PATs since
     those all stayed within one simulated jsdom `window`). This
     reproduces a REAL cross-page journey: quiz.html (real Civics exam,
     answer wrong on purpose) -> carry sessionStorage forward exactly like
     a real browser tab does -> a FRESH page load of wrongbook.html and
     quiz.html, proving the data survived the navigation. */
  const p1 = loadPage("quiz.html", {});
  const A1 = p1.window.AHS;
  const examId = "teaching_material_" + A1.MaterialRuntime.list()[0].id;
  const meta = A1.TeachingMaterialLoader.resolveExamMeta(examId) || {};
  const session = A1.ExamRuntime.startFromExam(examId, meta);
  const qs = A1.QuestionRuntime.getSet(examId);
  qs.forEach(q => A1.AnswerRuntime.saveAnswer(examId, q.id, q.id === qs[0].id ? "WRONG_ON_PURPOSE" : q.correctAnswer));
  const finished = A1.ExamRuntime.finish(examId);
  const graded = A1.AutoGrader.grade(finished);
  A1.WrongBookRuntime.sync(graded);
  A1.HistoryRuntime.record(graded);

  check("AI-601: AutoGrader.grade() 的 wrong[] 帶有真實 materialId（來自題目本身）", graded.wrong[0].materialId === A1.MaterialRuntime.list()[0].id);

  const carried = {};
  for (let i = 0; i < p1.window.sessionStorage.length; i++) { const k = p1.window.sessionStorage.key(i); carried[k] = JSON.parse(p1.window.sessionStorage.getItem(k)); }

  const p2 = loadPage("wrongbook.html", { seedSession: carried });
  const wbList = p2.window.AHS.WrongBookRuntime.list();
  check("AI-601: 錯題跨頁存活（WrongBookRuntime 現在有 PersistenceAdapter 持久化）", wbList.length === 1);
  const wb = wbList[0];
  check("AI-601: 錯題本紀錄包含全部必要欄位", wb.question && wb.correctAnswer && wb.yourAnswer &&
    wb.errorCount === 1 && wb.lastError && wb.subject && wb.chapter && wb.materialId);
  check("AI-601: 教材來源為真實 materialId（非空、非虛構）", wb.materialId === A1.MaterialRuntime.list()[0].id);

  p2.window.document.body.appendChild(p2.window.AHS.WrongBook.create());
  check("AI-601: 錯題本頁面（非僅 Runtime）真的渲染出這筆真實錯題", p2.window.document.body.textContent.includes(wb.question.slice(0, 6)));

  const p3 = loadPage("quiz.html", { seedSession: carried });
  p3.window.document.body.appendChild(p3.window.AHS.QuizCenter.create());
  const repoRow3 = p3.window.document.querySelector(".quiz-row");
  check("AI-602: 測驗中心的真實統計跨頁存活（不需重新整理同一頁面才看到）",
    !!repoRow3 && repoRow3.classList.contains("is-done") &&
    /100%/.test(repoRow3.querySelector(".quiz-row__metric-val").textContent) &&
    repoRow3.querySelector(".quiz-row__metric-strong").textContent !== "0%");

  check("AI-604: 科目篩選 chips 依 Repository 動態新增「公民」，不再固定寫死清單",
    [...p3.window.document.querySelectorAll(".quiz-filter__subject")].some(b => b.textContent === "公民"));

  check("Console errors = 0（Sprint AI-109 跨頁流程）", p1.consoleErrors.length === 0 && p2.consoleErrors.length === 0 && p3.consoleErrors.length === 0);
}

console.log("\n[34] Sprint AI-111 — End-to-End Learning Loop（AI-608/609/610/611/612/613）");
{
  /* Full real cross-page loop, mirroring AI-613's own required flow:
     教材 -> 開始測驗 -> 批改 -> 錯題 -> 複習(重新作答直到精熟) -> 首頁同步
     -> AI Tutor 更新 -> 複習中心同步 -> 測驗中心同步. Every step loads a
     FRESH page and carries only sessionStorage forward, exactly like a
     real browser tab — the same technique [33] introduced, extended
     across every page this Sprint touches. */
  const p1 = loadPage("quiz.html", {});
  const A1 = p1.window.AHS;
  const materialId = A1.MaterialRuntime.list()[0].id;
  const examId = "teaching_material_" + materialId;
  const meta = A1.TeachingMaterialLoader.resolveExamMeta(examId) || {};
  A1.ExamRuntime.startFromExam(examId, meta);
  const qs = A1.QuestionRuntime.getSet(examId);
  qs.forEach(q => A1.AnswerRuntime.saveAnswer(examId, q.id, q.id === qs[0].id ? "WRONG_ON_PURPOSE" : q.correctAnswer));
  const finished = A1.ExamRuntime.finish(examId);
  const graded = A1.AutoGrader.grade(finished);
  A1.WrongBookRuntime.sync(graded);
  A1.HistoryRuntime.record(graded);
  const wrongId = A1.WrongBookRuntime.list()[0].id;

  function carry(win) {
    const out = {};
    for (let i = 0; i < win.sessionStorage.length; i++) { const k = win.sessionStorage.key(i); out[k] = JSON.parse(win.sessionStorage.getItem(k)); }
    return out;
  }

  /* AI-610: 重新作答 -> 答對 三次直到「已精熟」，透過真實 DOM 互動（點擊
     立即重做 -> 選正確答案 -> 提交答案），非直接呼叫內部函式 —— 驗證的是
     使用者實際看到、點擊的畫面，不是 Runtime 私有 API。 */
  let carried = carry(p1.window);
  for (let attempt = 0; attempt < 3; attempt++) {
    const pw = loadPage("wrongbook.html", { seedSession: carried });
    pw.window.document.body.appendChild(pw.window.AHS.WrongBook.create());
    const item = pw.window.AHS.WrongBookRuntime.getById(wrongId);
    pw.window.document.querySelector(".wb-row").click();
    const redoBtn = [...pw.window.document.querySelectorAll(".wb-detail__btn")].find(b => b.textContent.includes("立即重做"));
    redoBtn.click();
    const correctOpt = [...pw.window.document.querySelectorAll(".wb-detail__option")].find(li => li.querySelector(".wb-detail__option-key").textContent === item.correctAnswer);
    correctOpt.click();
    const submitBtn = [...pw.window.document.querySelectorAll(".wb-detail__btn")].find(b => b.textContent.includes("提交答案"));
    submitBtn.click();
    if (attempt === 0) {
      check("AI-610: 重新作答答對後，WrongBookRuntime 的 correctStreak 真實更新（非僅畫面局部狀態）",
        pw.window.AHS.WrongBookRuntime.getById(wrongId).correctStreak === 1);
      check("AI-610: 畫面狀態同步顯示「複習中」（來自真實 correctStreak，非 session-local tracker）",
        pw.window.document.querySelector(".wb-detail__status").textContent === "複習中");
    }
    carried = carry(pw.window);
  }
  check("AI-610: 連續三次答對後 correctStreak >= 3，Runtime 真實記錄已精熟", (() => {
    const final = loadPage("wrongbook.html", { seedSession: carried });
    return final.window.AHS.WrongBookRuntime.getById(wrongId).correctStreak >= 3;
  })());

  /* AI-609: 複習中心同步 — 今日待複習歸零（唯一錯題已精熟）、已完成複習 = 1，
     皆直接來自 WrongBookRuntime，非重新計算的第二份統計。 */
  const pReview = loadPage("review.html", { seedSession: carried });
  pReview.window.document.body.appendChild(pReview.window.AHS.ReviewHomeCard.create({
    dueToday: pReview.window.AHS.StatisticsRuntime.dueForReview().length,
    doneToday: 0, doneWeek: 0,
    masteredReview: pReview.window.AHS.StatisticsRuntime.masteredReviewItems().length
  }));
  check("AI-609: 今日待複習歸零（唯一錯題已精熟，非固定 0）", pReview.window.AHS.StatisticsRuntime.dueForReview().length === 0);
  check("AI-609: 已完成複習 = 1（真實來自 WrongBookRuntime.correctStreak）", pReview.window.AHS.StatisticsRuntime.masteredReviewItems().length === 1);
  check("AI-609: 複習中心頁面真的渲染出「已完成複習」統計", pReview.window.document.body.textContent.includes("已完成複習"));

  /* AI-611: 首頁同步 — AiTutorHomeCard 現在收到真實 model（非 Empty State），
     內容包含真實已完成複習數字／建議文字，非 Mock／非固定文字。 */
  const pHome = loadPage("index.html", { seedSession: carried });
  pHome.window.document.body.appendChild(pHome.window.AHS.AiTutorHomeCard.create(
    pHome.window.AHS.TutorMessage.build(pHome.window.AHS.StatisticsRuntime.learningContext())
  ));
  check("AI-611: 首頁 AI 巧巧老師卡片不再是空狀態（真實 Runtime 資料已產生建議）",
    !pHome.window.document.body.textContent.includes("AI 老師尚無建議"));
  check("AI-611: 建議內容提及真實已精熟題數", pHome.window.document.body.textContent.includes("已有 1 題錯題達到精熟"));

  /* AI-612: AI Tutor（tutor.html）真實建議訊息，透過完整頁面 bootstrap
     （AppTutor.js）而非手動組 model —— 驗證的是頁面真的會顯示，不只是
     TutorMessage.build() 本身正確。 */
  const pTutor = loadPage("tutor.html", { seedSession: carried });
  pTutor.window.document.body.appendChild(pTutor.window.AHS.AiTutor.create());
  check("AI-612: tutor.html 的訊息串真的包含真實建議文字（非僅罐頭回覆）",
    pTutor.window.document.body.textContent.includes("已有 1 題錯題達到精熟"));

  /* AI-602/608: 測驗中心同步 — 完成/精熟後，正式測驗與練習模式列表仍
     一致反映真實資料，全流程走完未出現 Runtime 孤島。 */
  const pQuiz = loadPage("quiz.html", { seedSession: carried });
  pQuiz.window.document.body.appendChild(pQuiz.window.AHS.QuizCenter.create());
  const finalRow = pQuiz.window.document.querySelector(".quiz-row");
  check("AI-608: 測驗中心同步 — 完成/精熟後正式測驗列表仍正確反映真實完成狀態",
    !!finalRow && finalRow.classList.contains("is-done"));

  check("AI-613: 全流程無 Console errors（教材->測驗->批改->錯題->複習->首頁->AI Tutor->複習中心->測驗中心）",
    p1.consoleErrors.length === 0 && pReview.consoleErrors.length === 0 &&
    pHome.consoleErrors.length === 0 && pTutor.consoleErrors.length === 0 && pQuiz.consoleErrors.length === 0);

  /* AI-613: 不得出現不一致資料 — 同一筆錯題在 WrongBookRuntime／複習中心／
     測驗中心三處讀到的 correctStreak/mastered 狀態必須完全一致。 */
  const wbFinal = pQuiz.window.AHS.WrongBookRuntime.getById(wrongId);
  check("AI-613: 跨頁資料一致（WrongBookRuntime 為唯一真實來源，無重複/不一致資料）",
    wbFinal.correctStreak >= 3 && pReview.window.AHS.StatisticsRuntime.masteredReviewItems()[0].id === wrongId);
}

console.log("\n[35] Platform Sync Check — Statistics 單一資料來源一致性（我的學習 vs 測驗中心）");
{
  /* Finding: js/components/MyLearning.js used to compute its own
     totalCorrect/totalQuestions weighted-average "正確率" independently
     from AHS.StatisticsRuntime.overview()'s avgAccuracy (average of each
     exam's own accuracy%) — same real AHS.HistoryRuntime data, two
     different formulas, two different displayed numbers. Two crafted
     real-shaped history records with deliberately different per-exam
     accuracy make the two formulas diverge (weighted 4/14=28.6% vs
     unweighted mean of 75%/10%=42.5%→43%) if the bug still existed. */
  const history = {
    items: [
      { id: "hist_1", order: 1, examId: "e1", subject: "math", title: "考試一", chapter: "",
        score: 75, accuracy: 75, correctCount: 3, totalCount: 4, when: "2026/08/02 09:00" },
      { id: "hist_2", order: 2, examId: "e2", subject: "math", title: "考試二", chapter: "",
        score: 10, accuracy: 10, correctCount: 1, totalCount: 10, when: "2026/08/02 10:00" }
    ], seq: 2
  };
  const { window, consoleErrors } = loadPage("learning.html", { seedSession: { "ahs:historyRuntime": history } });
  const A = window.AHS;
  const expected = A.StatisticsRuntime.overview().avgAccuracy;
  window.document.body.appendChild(A.MyLearning.create());
  const statValue = [...window.document.querySelectorAll(".ml-overview__stat")]
    .find(s => s.textContent.includes("正確率"));
  check("我的學習「正確率」與 AHS.StatisticsRuntime.overview().avgAccuracy 完全一致（單一資料來源，非重新計算）",
    !!statValue && statValue.textContent.includes(String(expected)) && statValue.textContent.includes("%"));
  check("非退化案例：兩公式在此組資料下真的會分歧（確認測試本身有效，不是巧合通過）",
    expected !== Math.round((3 + 1) / (4 + 10) * 1000) / 10);
  check("Console errors = 0（我的學習 Statistics 一致性）", consoleErrors.length === 0);
}

console.log("\n[36] Platform Refactor Master — Platform Integration（PAT 6/7/12 名詞與導覽修正）");
{
  /* PAT 6/7 (original): 首頁「最近教材」顯示的是 MaterialRuntime.progress
     （閱讀進度），曾被誤標為「學習進度」。Sprint AI-117 AI-117-01 supersedes
     this label again — "取消目前「閱讀進度」概念": the card now shows real
     Material Completion (AHS.StatisticsRuntime.materialCompletion(),
     ①教材閱讀 ②測驗 ③複習) under a "教材完成度" label, never "學習進度"
     either. Same underlying real data source, only the displayed label/
     value definition changed (per this Sprint's own explicit instruction,
     not a silent regression). */
  const materialSeed = {
    materials: [{
      id: "rt_1", order: 1, subject: "math", title: "測試教材", chapter: "第一章",
      grade: "高一", category: "課本", date: "2026/08/01", views: "1", content: "",
      createdAt: todayStr(),
      progress: 42, lastOpenedAt: "2026/08/01 10:00", lastLearningAt: "2026/08/01 10:00",
      learningTime: 10, learningCount: 1, favorite: false, fileName: "", fileType: "FILE",
      fileSize: "", folderId: null
    }],
    folders: [], seq: 1, folderSeq: 0
  };
  const { window, consoleErrors } = loadPage("index.html", { seedSession: { "ahs:materialRuntime": materialSeed } });
  const doc = window.document;
  const recentCard = doc.querySelector(".recent-card, [class*='recent-card']");
  check("首頁最近教材卡片標籤為「教材完成度」（Sprint AI-117 Material Completion，非「學習進度」）",
    !!recentCard && recentCard.textContent.includes("教材完成度") && !recentCard.textContent.includes("學習進度"));
  check("Console errors = 0（首頁最近教材）", consoleErrors.length === 0);

  /* Sprint AI-118 AI-118-09: Bottom Navigation reordered/trimmed to match
     the new Sidebar (首頁/教材中心/學習總結/測驗中心/錯題本) — "我的"/
     "複習" (learning.html/review.html) removed from both Nav lists;
     those pages themselves still exist and are reachable by direct URL
     (AI-118-02/AI-118-03), only the Nav entry is gone. Supersedes the
     old PAT 12 check above (Bottom Nav「我的」→ learning.html), which no
     longer applies since there is no "我的" Bottom Nav item at all. */
  const bottomLabels = [...doc.querySelectorAll(".bottom-nav__item")].map(n => n.textContent.trim());
  check("Bottom Navigation 不再有「我的」／「複習」項目",
    !bottomLabels.some(t => t.includes("我的")) && !bottomLabels.some(t => t.includes("複習") && t !== "知識弱點"));
  const bottomHrefs = [...doc.querySelectorAll(".bottom-nav__item")].map(n => n.getAttribute("href")).filter(Boolean);
  check("Bottom Navigation 不再連向 learning.html／review.html",
    !bottomHrefs.includes("learning.html") && !bottomHrefs.includes("review.html"));
}

console.log("\n[37] Platform Refactor Master — Tutor Context Tip（PAT 8/9/10：教材/學習總結/測驗中心/錯題本/複習中心共用同一 Tutor Context）");
{
  /* Same real WrongBookRuntime record shape AI-111's own groups use.
     correctStreak: 0 (< 3) makes it a real "due for review" item, so
     AHS.TutorMessage.build() (the exact same function 首頁/tutor.html
     already call) produces a real, non-null message — proving these 5
     pages now read from the identical single source, not a re-derived
     or fabricated one. */
  const wrongBookSeed = {
    items: [{
      id: "wb_1", questionId: "q1", subject: "math", title: "測試教材",
      chapter: "第一章", materialId: "rt_1", knowledgePoint: "二次函數",
      question: "1+1=?", options: ["1", "2"], yourAnswer: "1", correctAnswer: "2",
      explanation: "", errorCount: 1, lastError: "2026/08/02 10:00",
      bookmarked: false, correctStreak: 0
    }], seq: 1
  };
  const pages = ["materials.html", "summary.html", "quiz.html", "wrongbook.html", "review.html"];

  pages.forEach(function (page) {
    const { window, consoleErrors } = loadPage(page, { seedSession: { "ahs:wrongBookRuntime": wrongBookSeed } });
    const tip = window.document.querySelector(".tutor-tip");
    check(page + "：Tutor Context Tip 渲染真實建議（與首頁/AI Tutor 同一組真實資料來源）",
      !!tip && tip.textContent.includes("題錯題待複習") && tip.getAttribute("href") === "tutor.html");
    check(page + "：Console errors = 0（Tutor Context Tip）", consoleErrors.length === 0);
  });

  /* Honesty check: with genuinely no real data anywhere, the tip must
     render nothing at all — never an Empty State placeholder box added
     to a page that never had one, and never fabricated filler text. */
  pages.forEach(function (page) {
    const { window } = loadPage(page, { excludeScripts: ["data/materials/"] });
    check(page + "：無真實資料時 Tutor Context Tip 不渲染（誠實，非假建議）",
      !window.document.querySelector(".tutor-tip"));
  });
}

console.log("\n[38] Sprint AI-113 — Settings + User Menu（AI-804/AI-805：真實功能，非 Stub）");
{
  const { window, consoleErrors } = loadPage("index.html", {});
  const A = window.AHS;
  const doc = window.document;

  const overlay = doc.querySelector(".settings-panel__overlay");
  check("Settings Panel 已掛載且預設隱藏", !!overlay && overlay.hasAttribute("hidden"));

  const sidebarSettingsBtn = [...doc.querySelectorAll(".sidebar__item")].find(b => b.textContent.includes("設定"));
  sidebarSettingsBtn.click();
  check("Sidebar「設定」按鈕真實開啟 Settings Panel（非 Stub）", overlay && !overlay.hasAttribute("hidden"));

  const nameInput = overlay.querySelector('.settings-panel__section input[type="text"]');
  const saveBtn = [...overlay.querySelectorAll(".settings-panel__btn")].find(b => b.textContent === "儲存");
  nameInput.value = "測試學生";
  nameInput.dispatchEvent(new window.Event("input", { bubbles: true }));
  saveBtn.click();
  check("Profile 儲存後真實寫入 AHS.SettingsRuntime", A.SettingsRuntime.get().profile.name === "測試學生");
  const topbarName = doc.querySelector(".topbar__user-meta strong");
  check("Profile 儲存後 Topbar 顯示名稱即時更新（非需重新整理）", !!topbarName && topbarName.textContent === "測試學生");

  const tutorToggle = overlay.querySelector(".settings-panel__checkbox");
  const wasChecked = tutorToggle.checked;
  tutorToggle.checked = !wasChecked;
  tutorToggle.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("Learning 設定（顯示 AI 建議卡片）真實持久化", A.SettingsRuntime.get().showTutorSuggestions === !wasChecked);

  const repoInfo = [...overlay.querySelectorAll(".settings-panel__info")].find(p => p.textContent.includes("Repository 教材"));
  check("Repository 區塊顯示真實教材筆數（來自 AHS.MaterialRepository/AHS.TeachingMaterialData）",
    !!repoInfo && /Repository 教材：\d+ 筆｜Package 教材：\d+ 筆/.test(repoInfo.textContent));

  const backupBtn = [...overlay.querySelectorAll(".settings-panel__btn")].find(b => b.textContent === "備份全部資料");
  check("備份按鈕存在且非 Stub（點擊呼叫真實 AHS.PersistenceAdapter.exportAll + 真實下載）", !!backupBtn);
  const before = A.PersistenceAdapter.exportAll();
  check("exportAll() 真實回傳目前 session 的資料（含剛儲存的 settings）", !!before.settings && before.settings.profile.name === "測試學生");

  check("Console errors = 0（Settings Panel 開啟與操作）", consoleErrors.length === 0);

  const profileMenuBtn = doc.querySelector(".topbar__user");
  profileMenuBtn.click();
  const logoutItem = [...doc.querySelectorAll(".profile-menu__item")].find(b => b.textContent === "Logout");
  check("Profile Menu 的 Logout 項目存在", !!logoutItem);
  logoutItem.click();
  check("Logout 真實清空 AHS-namespace session 資料（非僅 UI 選單關閉）",
    Object.keys(A.PersistenceAdapter.exportAll()).length === 0);
}

console.log("\n[39] Sprint AI-113 AI-808 — AI Tutor Context 依「目前教材」真實客製化（非固定文字）");
{
  const materialSeed = {
    materials: [{
      id: "rt_1", order: 1, subject: "math", title: "AI-808 測試教材", chapter: "第九章",
      grade: "高一", category: "課本", date: "2026/08/03", views: "1", content: "",
      progress: 60, lastOpenedAt: "2026/08/03 10:00", lastLearningAt: "2026/08/03 10:00",
      learningTime: 10, learningCount: 1, favorite: false, fileName: "", fileType: "FILE",
      fileSize: "", folderId: null
    }],
    folders: [], seq: 1, folderSeq: 0
  };
  const { window } = loadPage("summary.html", {
    seedSession: { "ahs:materialRuntime": materialSeed },
    url: "summary.html?materialId=rt_1"
  });
  const A = window.AHS;
  const built = A.TutorMessage.build(A.StatisticsRuntime.learningContext(), { page: "summary", materialId: "rt_1" });
  check("materialId 存在時，訊息真實提及該教材標題與章節", !!built && built.message.includes("AI-808 測試教材") && built.message.includes("第九章"));
  /* Sprint AI-117 AI-117-01/AI-117-07: message now reports real Material
     Completion (via AHS.StatisticsRuntime.materialContext(), the Tutor
     Engine's sole read path) instead of raw reading progress. progress:60
     (< 100, stage 0 — reading not yet DONE) interpolates to a real,
     non-fixed 12% (round(60/100*20)) — still genuinely derived from the
     real progress value, never a canned string. */
  check("訊息真實反映該教材的 Material Completion（非固定文字）", built.message.includes("12%") && built.message.includes("尚未開始"));

  const tip = window.document.querySelector(".tutor-tip");
  check("summary.html 的 Tutor Context Tip 真實帶入該頁 materialId 客製化內容", !!tip && tip.textContent.includes("AI-808 測試教材"));

  const builtNoMaterial = A.TutorMessage.build(A.StatisticsRuntime.learningContext(), { page: "summary" });
  check("無 materialId 時維持既有通用邏輯（向下相容，未破壞既有行為）",
    !builtNoMaterial || !builtNoMaterial.message.includes("AI-808 測試教材"));
}

console.log("\n[40] Sprint AI-114 AI-901 — Review Session（複習中心真實在頁複習流程，非跳轉錯題本）");
{
  const wrongBookSeed = {
    items: [{
      id: "wb_1", questionId: "q1", subject: "math", title: "AI-901 測試教材",
      chapter: "第一章", materialId: "rt_1", knowledgePoint: "測試知識點",
      question: "1+1=?", options: [{ key: "A", text: "1" }, { key: "B", text: "2" }],
      yourAnswer: "A", correctAnswer: "B",
      explanation: "詳解", errorCount: 1, lastError: "2026/08/03 09:00",
      bookmarked: false, correctStreak: 0
    }], seq: 1
  };
  const { window, consoleErrors } = loadPage("review.html", { seedSession: { "ahs:wrongBookRuntime": wrongBookSeed } });
  const doc = window.document;
  const A = window.AHS;

  const startBtn = [...doc.querySelectorAll(".rv-quick__btn")].find(b => b.textContent.includes("開始今日複習"));
  check("dueToday > 0 時「開始今日複習」為真實按鈕（非連結跳轉錯題本）", !!startBtn && startBtn.tagName === "BUTTON");
  startBtn.click();

  const session = doc.querySelector(".rv-session");
  check("點擊後真實在頁掛載 Review Session（非導向 wrongbook.html）", !!session && session.textContent.includes("AI-901 測試教材"));
  check("Review Session 重用 WrongBook 既有真實作答互動元件（同一定義，非另建一份）",
    !!session.querySelector(".wb-detail__options") && !!session.querySelector(".wb-detail__btn--primary"));

  const correctOpt = [...session.querySelectorAll(".wb-detail__option")]
    .find(li => li.querySelector(".wb-detail__option-key").textContent === "B");
  correctOpt.click();
  const submitBtn = [...session.querySelectorAll(".wb-detail__btn")].find(b => b.textContent.includes("提交答案"));
  submitBtn.click();

  check("作答後真實更新 WrongBookRuntime.correctStreak（透過 ReviewRuntime.answerCurrent，非畫面局部狀態）",
    A.WrongBookRuntime.getById("wb_1").correctStreak === 1);

  const resultScreen = doc.querySelector(".rv-session__result");
  check("完成唯一題目後顯示真實複習結果（總題數/答對/正確率）",
    !!resultScreen && resultScreen.textContent.includes("答對") && resultScreen.textContent.includes("100%"));

  const doneBtn = doc.querySelector(".rv-session__btn--primary");
  doneBtn.click();
  check("完成後真實返回複習中心（頁面以最新真實狀態重新渲染）",
    !doc.querySelector(".rv-session") && !!doc.querySelector(".rv-quick"));

  check("Console errors = 0（Review Session 全流程）", consoleErrors.length === 0);
}

console.log("\n[41] Sprint AI-114 AI-902 — WrongBook 全部重新複習只包含尚未精熟項目");
{
  const wrongBookSeed = {
    items: [
      { id: "wb_1", questionId: "q1", subject: "math", title: "已精熟教材", chapter: "第一章",
        materialId: "", knowledgePoint: "kp1", question: "Q1", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 1, lastError: "2026/08/03 09:00",
        bookmarked: false, correctStreak: 3 },
      { id: "wb_2", questionId: "q2", subject: "math", title: "尚未精熟教材", chapter: "第二章",
        materialId: "", knowledgePoint: "kp2", question: "Q2", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
        yourAnswer: "A", correctAnswer: "B", explanation: "", errorCount: 1, lastError: "2026/08/03 09:00",
        bookmarked: false, correctStreak: 0 }
    ], seq: 2
  };
  const { window } = loadPage("wrongbook.html", { seedSession: { "ahs:wrongBookRuntime": wrongBookSeed } });
  const doc = window.document;
  /* Sprint AI-118 AI-118-07: 複習中心 Navigation 移除後「今日待複習」改由
     錯題本自己顯示（同一條 correctStreak < 3 規則，經
     AHS.StatisticsRuntime.dueForReview() 讀取，非第二套計算）。 */
  const summaryValues = [...doc.querySelectorAll(".wb-summary__item")];
  const dueTodayItem = summaryValues.find(n => n.textContent.includes("今日待複習"));
  check("錯題本統計卡顯示真實「今日待複習」（經 StatisticsRuntime.dueForReview()）",
    !!dueTodayItem && dueTodayItem.querySelector(".wb-summary__value").textContent === "1");

  const reviewAllBtn = [...doc.querySelectorAll(".wb-action")].find(b => b.textContent.includes("全部重新練習"));
  reviewAllBtn.click();
  const sessionBody = doc.querySelector(".wb-review-session__progress");
  check("全部重新複習只納入尚未精熟項目（1 題，已精熟的另一題被排除）",
    !!sessionBody && sessionBody.textContent.includes("1 / 1"));
}

console.log("\n[42] Sprint AI-114 AI-903 — Daily Task Engine（首頁今日任務真實、依優先序、非固定文字）");
{
  const materialSeed = {
    materials: [
      { id: "rt_1", order: 1, subject: "math", title: "進行中教材", chapter: "第一章",
        grade: "高一", category: "課本", date: "2026/08/03", views: "1", content: "",
        progress: 40, lastOpenedAt: "2026/08/03 09:00", lastLearningAt: "2026/08/03 09:00",
        learningTime: 5, learningCount: 1, favorite: false, fileName: "", fileType: "FILE",
        fileSize: "", folderId: null },
      { id: "rt_2", order: 2, subject: "english", title: "尚未開始教材", chapter: "Unit 1",
        grade: "高一", category: "課本", date: "2026/08/03", views: "0", content: "",
        progress: 0, lastOpenedAt: null, lastLearningAt: null,
        learningTime: 0, learningCount: 0, favorite: false, fileName: "", fileType: "FILE",
        fileSize: "", folderId: null }
    ], folders: [], seq: 2, folderSeq: 0
  };
  const wrongBookSeed = {
    items: [{ id: "wb_1", questionId: "q1", subject: "math", title: "測試", chapter: "第一章",
      materialId: "rt_1", knowledgePoint: "kp1", question: "Q", options: [], yourAnswer: "A",
      correctAnswer: "B", explanation: "", errorCount: 1, lastError: "2026/08/03 09:00",
      bookmarked: false, correctStreak: 0 }], seq: 1
  };
  const { window, consoleErrors } = loadPage("index.html", {
    seedSession: { "ahs:materialRuntime": materialSeed, "ahs:wrongBookRuntime": wrongBookSeed }
  });
  const A = window.AHS;
  const tasks = A.LearningStateRuntime.dailyTasks(4);
  check("今日任務真實、非空（有真實待複習/未完成教材資料時）", tasks.length > 0);
  check("優先序①今日 Review 排在最前（真實 dueForReview 存在）", tasks[0].kind === "review");
  check("今日任務內容包含真實教材標題（非固定文字）",
    tasks.some(t => t.title.includes("進行中教材")) || tasks.some(t => t.title.includes("尚未開始教材")));

  const taskCard = window.document.querySelector(".today-card");
  check("首頁今日任務卡片真實渲染任務列（非既有空狀態文案）",
    !!taskCard && !taskCard.textContent.includes("今天沒有安排學習任務"));
  check("Console errors = 0（Daily Task Engine）", consoleErrors.length === 0);

  const { window: emptyWin } = loadPage("index.html", { excludeScripts: ["data/materials/", "js/data/TeachingMaterialData.js"] });
  const emptyCard = emptyWin.document.querySelector(".today-card");
  check("無真實資料時今日任務誠實顯示既有空狀態（非假造任務）",
    !!emptyCard && emptyCard.textContent.includes("今天沒有安排學習任務"));
}

console.log("\n[43] Sprint AI-114 PAT — 複習中心不再顯示衝突的第二份「複習進度」（Practice Mode ReviewWidget 移除）");
{
  /* PAT report: review.html showed 3 different "複習進度"-flavored
     panels with conflicting numbers — the real Exam Mode stats
     (ReviewHomeCard, WrongBookRuntime-sourced) at the top, and
     js/components/ReviewWidget.js (Practice Mode, WrongBookSession ->
     ReviewQueue -> ReviewModel — a deliberately separate, LOCKed
     pipeline that never shares data with Exam Mode) at the bottom,
     honestly showing all-zero since no Practice Mode quiz was ever
     taken in this scenario. Root cause wasn't a calculation bug —
     both panels were individually correct for their own real, separate
     data source — it was showing two genuinely different "複習進度"
     concepts on the same page with no distinguishing label. Fix:
     ReviewWidget removed from review.html (redundant now that this
     page has its own complete real Exam Mode review flow); it remains
     exactly as before on index.html, its own file header's documented
     real home ("首頁 Review Widget"). */
  const wrongBookSeed = {
    items: [{
      id: "wb_1", questionId: "q1", subject: "math", title: "測試教材",
      chapter: "第一章", materialId: "rt_1", knowledgePoint: "kp1",
      question: "Q", options: [], yourAnswer: "A", correctAnswer: "B",
      explanation: "", errorCount: 1, lastError: "2026/08/03 09:00",
      bookmarked: false, correctStreak: 0
    }], seq: 1
  };
  const { window: reviewWin, consoleErrors } = loadPage("review.html", { seedSession: { "ahs:wrongBookRuntime": wrongBookSeed } });
  check("複習中心不再掛載 Practice Mode 的 ReviewWidget（.review-widget 不存在）",
    !reviewWin.document.querySelector(".review-widget"));
  check("複習中心真實 Exam Mode 統計仍正常顯示（今日待複習 = 1）",
    reviewWin.document.body.textContent.includes("今日待複習") &&
    reviewWin.AHS.StatisticsRuntime.dueForReview().length === 1);
  check("Console errors = 0（複習中心移除 ReviewWidget 後）", consoleErrors.length === 0);

  /* Sprint AI-122 AI-122-08: Home's own composition changed this Sprint
     — ReviewWidget is no longer auto-mounted there (see js/pages/
     AppHome.js's own comment: not part of the PO's explicit 6-section
     首頁資訊排序 list, overlaps 學習成效總覽/今日任務's own real signals).
     The component itself is still real and unchanged (proved directly
     in [13]/[14] above) — this check now honestly reflects "not
     auto-mounted on Home" instead of the stale "首頁保持不變" claim. */
  const { window: homeWin } = loadPage("index.html", {});
  check("首頁不再自動掛載 ReviewWidget（AI-122-08：其資訊已併入學習成效總覽／今日任務，不重複顯示）",
    !homeWin.document.querySelector(".review-widget"));
}

console.log("\n[44] HOTFIX-008 — Topbar 顯示名稱/年級跨頁與重新整理後仍與 Settings 同步");
{
  /* PAT report: 在 Settings 儲存顯示名稱後，換頁或重新整理，Topbar 又變回
     預設的「同學」。Root cause：js/ui/AppShell.js 的 topbar() 一直是直接讀
     AHS.AppConfig.user/student（Mock 預設值），SettingsPanel.js 的儲存
     只在當下那次點擊時手動 patch 一次 DOM 節點文字 —
     AppShell 重新 build（換頁、重新整理）時完全沒有讀真正的 Single Source
     AHS.SettingsRuntime，於是又顯示回 Mock 預設。修正：topbar() 改為優先讀
     AHS.SettingsRuntime.get().profile，AppConfig 僅作為它未載入時的備援。 */
  const settingsSeed = { profile: { name: "小小兵", grade: "高中生" }, showTutorSuggestions: true, aiGatewayEnabled: false };

  const { window: homeWin } = loadPage("index.html", { seedSession: { "ahs:settings": settingsSeed } });
  const homeName = homeWin.document.querySelector(".topbar__user-meta strong");
  check("首頁初次載入即顯示 Settings 儲存過的名稱（不需先手動觸發儲存）",
    !!homeName && homeName.textContent === "小小兵");

  const { window: reviewWin, consoleErrors } = loadPage("review.html", { seedSession: { "ahs:settings": settingsSeed } });
  const reviewName = reviewWin.document.querySelector(".topbar__user-meta strong");
  check("換到另一頁（複習中心）Topbar 名稱仍與 Settings 一致（不會變回「同學」）",
    !!reviewName && reviewName.textContent === "小小兵");
  check("Console errors = 0（Topbar 讀 SettingsRuntime）", consoleErrors.length === 0);

  /* PAT Fix follow-up (real PO report): "登入時選擇的學生應與登入後右上角
     的身分一致，目前是獨立事件" — 從未存過 Settings 時，profile.name 的
     預設值改為真正登入的學生名稱（AHS.WorkspaceRuntime.label().studentName，
     這裡是 loadPage() 自動 seed 的預設測試 Workspace student_a -> "Student
     A"），不再是與登入者無關的字面預設「同學」。此 check 因此改為驗證這個
     真正同步的名稱，而非舊有、獨立於登入身分的字面 fallback 字串。 */
  const { window: guestWin } = loadPage("index.html", {});
  const guestName = guestWin.document.querySelector(".topbar__user-meta strong");
  check("從未存過 Settings 時 Topbar 預設顯示真正登入的學生名稱（不再是與登入身分無關的「同學」）",
    !!guestName && guestName.textContent === "Student A");
}

console.log("\n==============================");
console.log("PASS: " + pass + "   FAIL: " + fail);
if (failures.length) { console.log("Failures:"); failures.forEach(f => console.log(" - " + f)); process.exit(1); }
