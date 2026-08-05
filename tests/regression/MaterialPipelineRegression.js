/* tests/regression/MaterialPipelineRegression.js — Sprint AI-115
   AI-115-10 (Material Pipeline Automation). Real, end-to-end regression
   for the new gated pipeline this Sprint built:

     RAW -> ANALYZING -> CLAUDE_READY -> (RepositoryManager.prepare())
     -> READY_FOR_IMPORT -> (ImportManager.importAll()) -> IMPORTED
     -> Summary / Quiz / WrongBook / Review / Tutor (browser, via
     js/runtime/TeachingMaterialLoader.js — unmodified this Sprint)

   plus AI-115-05 Import Validation, AI-115-06 Duplicate Detection, and
   AI-115-09 Rollback, none of which tests/regression/RepositoryFoundation.js
   exercises (that file only ever calls the low-level generate() directly,
   never RepositoryManager/ImportManager — see its own [11] section
   header comment).

   All Package ids here are scratch, never-committed, and removed in a
   `finally` block every run — same discipline as RepositoryFoundation.js's
   own [11] section. Uses tm_999990-999992 to avoid colliding with that
   file's own tm_999998.

   Run: node tests/regression/MaterialPipelineRegression.js */
"use strict";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
const TM_ROOT = path.join(REPO, "docs/TeachingMaterials");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

/* Sprint AI-119 (Platform Core Baseline): AHS.PersistenceAdapter now
   namespaces every save()/load()/remove() under the active Workspace's
   storage namespace, and AHS.AppShell.create() redirects to login.html
   (rendering nothing) unless a Workspace is active. This suite predates
   Login/Workspace entirely and isn't about testing either — rather than
   rewrite every individual seedSession literal in this file, loadPage()
   auto-establishes ONE fixed default test Workspace (unless the caller
   passes skipLogin) and transparently namespaces each bare "ahs:<key>"
   seed entry to match — idempotent (an already-namespaced entry, e.g.
   from carry(), passes through unchanged). */
const AHS_TEST_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };
const AHS_TEST_NS = "student_a__cjsh__g1s2";
function namespacedKey(k) {
  if (k === "ahs:workspace") { return k; }
  const nsPrefix = "ahs:" + AHS_TEST_NS + ":";
  if (k.indexOf(nsPrefix) === 0) { return k; }
  if (k.indexOf("ahs:") === 0) { return "ahs:" + AHS_TEST_NS + ":" + k.slice(4); }
  return k;
}

function loadPage(htmlFile, { seedSession, skipLogin } = {}) {
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
  if (!skipLogin) {
    window.sessionStorage.setItem("ahs:workspace", JSON.stringify(AHS_TEST_WORKSPACE));
  }
  if (seedSession) {
    Object.entries(seedSession).forEach(([k, v]) => window.sessionStorage.setItem(skipLogin ? k : namespacedKey(k), JSON.stringify(v)));
  }
  const scripts = [...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  scripts.forEach((src) => window.eval(fs.readFileSync(path.join(REPO, src), "utf8")));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, consoleErrors };
}

function carry(win) {
  const out = {};
  for (let i = 0; i < win.sessionStorage.length; i++) { const k = win.sessionStorage.key(i); out[k] = JSON.parse(win.sessionStorage.getItem(k)); }
  return out;
}

function writePackage(id, opts) {
  opts = opts || {};
  const dir = path.join(TM_ROOT, "materials", id);
  fs.mkdirSync(path.join(dir, "source"), { recursive: true });
  fs.writeFileSync(path.join(dir, "source", "original.txt"), "scratch\n");
  fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify({
    /* Package track convention (documented in js/runtime/TeachingMaterialLoader.js's
       own subjectKeyFromChineseName()): subject is the real Chinese
       display name (AHS.Subjects[key].name, e.g. "數學"), NOT the
       internal key ("math") — unlike the separate data/materials/ track,
       which uses keys directly. Using the wrong convention here would
       silently zero out Exam-Mode question bridging (a real finding,
       not a guess — this test caught it on its first run). */
    materialId: id, subject: opts.subject || "數學", grade: "高一", publisher: "測試",
    chapter: opts.chapter || "AI-115 測試章", unit: "1-1", keywords: ["測試"], difficulty: "中等",
    source: "教科書", uploadDate: "2026-08-03T00:00:00Z", version: opts.version || "1", materialType: "HANDOUT"
  }, null, 2));
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
    materialId: id, packageVersion: "1", createdDate: "2026-08-03T00:00:00Z",
    updatedDate: "2026-08-03T00:00:00Z", repositoryVersion: "EO-S1.1-003",
    analysisEngine: "Claude", status: "complete"
  }, null, 2));
  fs.writeFileSync(path.join(dir, "material.md"), opts.materialMd || ("# " + (opts.chapter || "AI-115 測試章") + "\n\nAI-115 Pipeline Regression 測試內容。\n"));
  fs.writeFileSync(path.join(dir, "summary.json"), JSON.stringify({
    materialId: id, coreConcepts: ["AI-115 核心概念"], definitions: [], keywords: [], keyPoints: [], pitfalls: []
  }, null, 2));
  fs.writeFileSync(path.join(dir, "questionbank.json"), JSON.stringify({
    materialId: id, questions: [{
      questionId: id + "_q1", materialId: id, questionNumber: "1",
      type: "single_choice", questionSource: "ORIGINAL", origin: "Uploaded Material",
      ocrConfidence: 0.95, needsReview: false, question: "AI-115 測試題目？",
      options: ["A", "B"], answer: "A", explanation: null, page: 1,
      version: "1", createdDate: "2026-08-03T00:00:00Z", knowledgePoint: "AI-115 核心概念"
    }]
  }, null, 2));
  fs.writeFileSync(path.join(dir, "related.json"), JSON.stringify({ materialId: id, related: [] }, null, 2));
  return dir;
}

function removePackage(id) {
  fs.rmSync(path.join(TM_ROOT, "materials", id), { recursive: true, force: true });
}

console.log("Material Pipeline Regression — Sprint AI-115");

const lifecycle = require(path.join(TM_ROOT, "scripts/MaterialLifecycle.js"));
const repoManager = require(path.join(TM_ROOT, "scripts/RepositoryManager.js"));
const importManager = require(path.join(TM_ROOT, "scripts/ImportManager.js"));
const generator = require(path.join(TM_ROOT, "scripts/GenerateTeachingMaterialData.js"));

/* This suite's own scratch imports write real entries to
   docs/TeachingMaterials/import-log.json (AI-115-08 — a git-tracked,
   always-real Import History, same "generated, always re-readable"
   convention as index.json). Snapshotting it here and restoring it
   verbatim at the very end (see the bottom of this file) keeps every
   run of this suite leaving the log exactly as it found it — the same
   "regenerate to confirm genuine empty state" discipline
   RepositoryFoundation.js's own [11] section already uses for
   index.json/TeachingMaterialData.js, applied to this Sprint's new
   Import Log so `npm test` never accumulates scratch-test noise into a
   file real Package imports are meant to be tracked in. */
const importLogSnapshot = fs.existsSync(importManager.LOG_FILE) ? fs.readFileSync(importManager.LOG_FILE, "utf8") : null;

/* ---- 1. RAW -> ANALYZING -> CLAUDE_READY -> READY_FOR_IMPORT -> IMPORTED,
   through the real gated pipeline (RepositoryManager.prepare() +
   ImportManager.importAll(), not the low-level generate() shortcut). */
console.log("\n[1] RAW -> ANALYZING -> CLAUDE_READY -> READY_FOR_IMPORT -> IMPORTED");
let scratchRuntimeId = null;
const idA = "tm_999990";
try {
  fs.mkdirSync(path.join(TM_ROOT, "materials", idA), { recursive: true });
  fs.writeFileSync(path.join(TM_ROOT, "materials", idA, "metadata.json"), "{}"); // deliberately incomplete: RAW check needs metadata missing, so remove and retest ANALYZING below
  fs.rmSync(path.join(TM_ROOT, "materials", idA, "metadata.json"));
  check("RAW：Package 目錄存在但 metadata.json 缺失", lifecycle.resolveStage(idA) === "RAW");

  writePackage(idA, { chapter: "AI-115 主線章" });
  check("CLAUDE_READY：所有 Package Standard 輸入檔齊全，knowledge.json/report.md 尚未產生",
    lifecycle.resolveStage(idA) === "CLAUDE_READY");

  const advanced = repoManager.prepare();
  check("RepositoryManager.prepare() 真實推進此 Package（回傳包含 idA）", advanced.indexOf(idA) !== -1);
  check("READY_FOR_IMPORT：knowledge.json/report.md 已產生，但尚未進入 index.json",
    lifecycle.resolveStage(idA) === "READY_FOR_IMPORT");

  const beforeLog = fs.existsSync(importManager.LOG_FILE) ? JSON.parse(fs.readFileSync(importManager.LOG_FILE, "utf8")).imports.length : 0;
  const result = importManager.importAll();
  check("ImportManager.importAll() 真實匯入此 Package", result.imported.indexOf(idA) !== -1);
  check("IMPORTED：Lifecycle Stage 正確反映已進入 index.json", lifecycle.resolveStage(idA) === "IMPORTED");

  const log = JSON.parse(fs.readFileSync(importManager.LOG_FILE, "utf8"));
  const logEntry = log.imports.slice(beforeLog).find((e) => e.materialId === idA);
  check("AI-115-08 Import Log：新增一筆 SUCCESS 紀錄（含 time/materialId/version/result）",
    !!logEntry && logEntry.result === "SUCCESS" && logEntry.version === "1" && !!logEntry.time);

  /* ---- Downstream: Summary / Quiz / WrongBook / Review / Tutor,
     browser-side, via the unmodified TeachingMaterialLoader.js. */
  console.log("\n[2] Downstream: Summary / Quiz / WrongBook / Review / Tutor");
  const p1 = loadPage("materials.html", {});
  const idMap = p1.window.AHS.PersistenceAdapter.load("teachingMaterialLoaderIdMap");
  check("Loader 真實橋接此 Package（idMap 含 tm_999990 對應）", !!idMap && !!idMap[idA]);
  scratchRuntimeId = idMap[idA];
  const material = p1.window.AHS.MaterialRuntime.getById(scratchRuntimeId);
  check("MaterialRuntime 持有此教材（透過既有 add()，未修改 Runtime）", !!material && material.chapter === "AI-115 主線章");

  const seed = carry(p1.window);
  const sumPage = loadPage("summary.html", { seedSession: seed });
  check("Summary 頁面真實渲染此教材的核心概念", sumPage.window.document.body.textContent.includes("AI-115 核心概念"));
  check("Console errors = 0（Summary）", sumPage.consoleErrors.length === 0);

  const quizPage = loadPage("quiz.html", { seedSession: seed });
  const examId = "teaching_material_" + scratchRuntimeId;
  check("QuestionRuntime 真實持有此教材的可測驗題目（Exam Mode）",
    quizPage.window.AHS.QuestionRuntime.hasExam(examId) && quizPage.window.AHS.QuestionRuntime.getSet(examId).length > 0);
  check("Console errors = 0（Quiz）", quizPage.consoleErrors.length === 0);

  const wbPage = loadPage("wrongbook.html", { seedSession: seed });
  wbPage.window.document.body.appendChild(wbPage.window.AHS.WrongBook.create());
  check("WrongBook 頁面正常渲染（Repository 驅動的 Exam Mode 寫入管道存在）",
    typeof wbPage.window.AHS.WrongBookRuntime.sync === "function");
  check("Console errors = 0（WrongBook）", wbPage.consoleErrors.length === 0);

  const reviewPage = loadPage("review.html", { seedSession: seed });
  check("StatisticsRuntime/LearningStateRuntime 為此教材提供真實計算視圖（不需另外寫入）",
    typeof reviewPage.window.AHS.StatisticsRuntime.materialCompletion(scratchRuntimeId).percent === "number" &&
    typeof reviewPage.window.AHS.LearningStateRuntime.materialState === "function" &&
    !!reviewPage.window.AHS.LearningStateRuntime.materialState(scratchRuntimeId));
  check("Console errors = 0（Review）", reviewPage.consoleErrors.length === 0);

  const tutorPage = loadPage("tutor.html", { seedSession: seed });
  tutorPage.window.document.body.appendChild(tutorPage.window.AHS.AiTutor.create());
  check("Tutor 頁面正常渲染（無破版）", !!tutorPage.window.document.querySelector(".tutor-thread, .tutor-chat"));
  check("Console errors = 0（Tutor）", tutorPage.consoleErrors.length === 0);
} finally {
  removePackage(idA);
}

/* ---- 3. AI-115-06 Duplicate Detection — a second Package with the same
   content hash as idA is rejected on import, the winner (lexicographically
   smaller materialId) is imported, the loser stays READY_FOR_IMPORT. */
console.log("\n[3] Duplicate Detection — identical-content Package rejected on import");
const idDupWinner = "tm_999991"; // smaller id -> kept
const idDupLoser = "tm_999992"; // larger id -> rejected
try {
  writePackage(idDupWinner, { chapter: "AI-115 重複章" });
  writePackage(idDupLoser, { chapter: "AI-115 重複章" }); // identical opts -> identical content hash
  repoManager.prepare();
  check("兩者皆推進至 READY_FOR_IMPORT",
    lifecycle.resolveStage(idDupWinner) === "READY_FOR_IMPORT" && lifecycle.resolveStage(idDupLoser) === "READY_FOR_IMPORT");

  const dupGroups = repoManager.checkDuplicates([idDupWinner, idDupLoser]);
  check("RepositoryManager.checkDuplicates() 偵測到相同內容雜湊", dupGroups.some((g) => g.group.includes(idDupWinner) && g.group.includes(idDupLoser)));

  const result = importManager.importAll();
  check("較小 materialId（" + idDupWinner + "）被匯入", result.imported.indexOf(idDupWinner) !== -1);
  check("較大 materialId（" + idDupLoser + "）被拒絕匯入（不得同一教材重複 Import）", result.imported.indexOf(idDupLoser) === -1);
  check("被拒絕者維持 READY_FOR_IMPORT（未污染為 IMPORTED）", lifecycle.resolveStage(idDupLoser) === "READY_FOR_IMPORT");
  check("被拒絕者已被寫入 Import Log，result=FAIL_DUPLICATE",
    result.log.some((e) => e.materialId === idDupLoser && e.result === "FAIL_DUPLICATE"));
} finally {
  removePackage(idDupWinner);
  removePackage(idDupLoser);
  generator.generate();
}

/* ---- 4. AI-115-09 Rollback — a simulated write failure mid-import must
   restore TeachingMaterialData.js / index.json / RepositoryStatus.js to
   their exact pre-import content, never leaving Runtime-visible state
   partially written. */
console.log("\n[4] Rollback — simulated write failure leaves Runtime-visible files untouched");
const idRollback = "tm_999993";
try {
  writePackage(idRollback, { chapter: "AI-115 Rollback 測試章" });
  repoManager.prepare();
  check("Package 已推進至 READY_FOR_IMPORT（Rollback 測試前置狀態）", lifecycle.resolveStage(idRollback) === "READY_FOR_IMPORT");

  const dataBefore = fs.readFileSync(generator.OUTPUT_FILE, "utf8");
  const indexBefore = fs.readFileSync(generator.INDEX_FILE, "utf8");
  const logBefore = fs.existsSync(importManager.LOG_FILE) ? fs.readFileSync(importManager.LOG_FILE, "utf8") : null;

  const realWriteFileSync = fs.writeFileSync;
  fs.writeFileSync = function (p) {
    if (String(p) === generator.INDEX_FILE) { throw new Error("SIMULATED_DISK_FAILURE"); }
    return realWriteFileSync.apply(fs, arguments);
  };
  let threw = false;
  try {
    importManager.importAll();
  } catch (e) {
    threw = /SIMULATED_DISK_FAILURE/.test(String(e && e.message));
  } finally {
    fs.writeFileSync = realWriteFileSync;
  }
  check("importAll() 在寫入失敗時真實拋出（呼叫端可偵測失敗）", threw);

  const dataAfter = fs.readFileSync(generator.OUTPUT_FILE, "utf8");
  const indexAfter = fs.readFileSync(generator.INDEX_FILE, "utf8");
  check("Rollback：js/data/TeachingMaterialData.js 還原為匯入前的真實內容（未殘留部分寫入）", dataAfter === dataBefore);
  check("Rollback：index.json 還原為匯入前的真實內容（未殘留部分寫入）", indexAfter === indexBefore);
  check("Rollback：此 Package 未被污染為 IMPORTED（Runtime 保持一致）", lifecycle.resolveStage(idRollback) === "READY_FOR_IMPORT");

  const logAfter = fs.readFileSync(importManager.LOG_FILE, "utf8");
  check("Import Log 記錄本次失敗（result=FAIL_ROLLBACK，含 Error 訊息）",
    JSON.parse(logAfter).imports.some((e) => e.materialId === idRollback && e.result === "FAIL_ROLLBACK" && /SIMULATED_DISK_FAILURE/.test(e.error || "")));
  void logBefore;
} finally {
  removePackage(idRollback);
  generator.generate();
}

/* ---- 5. AI-115-05 Import Validation — a Package that still LOOKS
   READY_FOR_IMPORT (every required file present, so MaterialLifecycle's
   own file-existence checks don't yet catch it) but fails deeper schema
   validation (questionbank.json corrupted after prepare() derived
   knowledge.json/report.md from the original, valid content) is still
   caught by validateForImport()'s own ValidateMaterial.js re-check and
   never imported. (A simpler "just delete knowledge.json" case would
   only revert the Package to CLAUDE_READY — not exercise this deeper
   validation path inside importAll() at all, since that stage is never
   even attempted.) */
console.log("\n[5] Import Validation — schema-invalid Package rejected, never partially imported");
const idInvalid = "tm_999994";
try {
  writePackage(idInvalid, { chapter: "AI-115 Validation 測試章" });
  repoManager.prepare();
  check("Package 已推進至 READY_FOR_IMPORT（Validation 測試前置狀態）", lifecycle.resolveStage(idInvalid) === "READY_FOR_IMPORT");
  fs.writeFileSync(path.join(TM_ROOT, "materials", idInvalid, "questionbank.json"), "{ not valid json");
  check("Lifecycle Stage 仍為 READY_FOR_IMPORT（檔案存在，只是內容壞掉 — 這正是需要更深層驗證的原因）",
    lifecycle.resolveStage(idInvalid) === "READY_FOR_IMPORT");

  const check1 = importManager.validateForImport(idInvalid);
  check("validateForImport() 偵測到 questionbank.json 結構無效，判定 Import FAIL", !check1.valid);

  const result = importManager.importAll();
  check("不完整/無效 Package 不會被匯入", result.imported.indexOf(idInvalid) === -1);
  check("不完整/無效 Package 已記錄於 Import Log，result=FAIL_VALIDATION",
    result.log.some((e) => e.materialId === idInvalid && e.result === "FAIL_VALIDATION"));
} finally {
  removePackage(idInvalid);
  generator.generate();
}

if (importLogSnapshot === null) { fs.rmSync(importManager.LOG_FILE, { force: true }); }
else { fs.writeFileSync(importManager.LOG_FILE, importLogSnapshot, "utf8"); }
check("清除 scratch 匯入紀錄後，import-log.json 回到執行本測試前的真實狀態",
  (fs.existsSync(importManager.LOG_FILE) ? fs.readFileSync(importManager.LOG_FILE, "utf8") : null) === importLogSnapshot);

console.log("\nMaterialPipelineRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
