/* js/runtime/TeachingMaterialLoader.js — Sprint v1.4 "First Real Material
   Workflow" · Module B (Repository Loader).

   Coordinator only, same pattern as js/runtime/ImportRuntime.js: holds no
   material-content store of its own (no title/summary/question data
   lives here), calls only existing, LOCK Runtime write APIs
   (AHS.MaterialRuntime.add / AHS.SummaryRuntime.add /
   AHS.QuestionRuntime.importQuestions — none modified, none extended),
   and never fetches/requires/reads a file itself. Its only input is
   AHS.TeachingMaterialData — the static array js/data/
   TeachingMaterialData.js already loaded via <script> tag, produced
   offline by GenerateTeachingMaterialData.js through the unmodified
   TeachingMaterialAdapter.

   Idempotency (judgment call, flagged — required for correctness, not
   spelled out by the Sprint): MaterialRuntime/SummaryRuntime are
   sessionStorage-persisted (js/core/PersistenceAdapter.js) and REHYDRATE
   on every page load in this multi-page app, so calling initialize()
   again on a later page visit must not re-add the same Package and
   create a duplicate record. This file persists a small
   { packageMaterialId -> MaterialRuntime record id } map of its own,
   through the same already-LOCK PersistenceAdapter every Runtime in this
   repo already uses, purely so it can recognize "already loaded this
   session" — it holds no title/summary/question content, only ids
   already assigned elsewhere, so this is bookkeeping, not a second data
   store ("Loader 不得保存資料" is read as: must not retain material
   DATA — satisfied).

   AHS.QuestionRuntime, by contrast, is intentionally memory-only (see
   docs/PMO/PROJECT_STATUS.json's runtimePersistence.notCovered list) and
   is not even <script>-tagged on every page (e.g. absent from
   materials.html, present on quiz.html) — so importQuestions() is
   re-run on every page load where AHS.QuestionRuntime actually exists,
   using whichever real MaterialRuntime id was already resolved (either
   on this same page, or carried over via the persisted id map from an
   earlier page that did load MaterialRuntime.js). hasExam() guards
   against double-importing within one page load.

   entry.related is intentionally never touched here: a repo-wide search
   found no "related materials" concept in any existing Runtime (see
   TeachingMaterialAdapter.js's own header, judgment call 9) — there is
   nothing to load it into.

   Sprint v1.6 addition — Exam-Mode shape reconciliation (flagged, real
   finding, not spelled out by any Sprint): AHS.QuestionRuntime itself
   accepts any object shape (no gate), but every DOWNSTREAM consumer of
   QuestionRuntime.getSet() hard-codes AHS.QuestionBank's own native
   field names — AHS.AutoGrader.grade() reads q.text/q.correctAnswer/
   q.index/q.knowledgePoint, and js/ui/QuestionCard.js reads
   question.text/question.options[i].key/.text and looks up
   AHS.Subjects[question.subject] with NO fallback (would throw on an
   unknown key). TeachingMaterialAdapter.convertQuestions()'s own output
   (question/answer/plain-string options, no subject/index/knowledgePoint
   at all — by design, matching Sprint AI-103's ImportRuntime.js
   precedent) is therefore NOT directly renderable/gradable as-is. Fixing
   this in the Adapter would violate this Sprint's "不得修改
   TeachingMaterialAdapter API"; fixing it in AutoGrader/QuestionCard
   would violate "不得重寫 Wrong Book" 's spirit and touch LOCK Sprint-4
   files. So the reshaping happens here, in the Loader — this IS
   "Wiring" (Module E's own allowance: "若需最小修改：僅可修改
   Wiring"), not a rewrite of anything downstream.

   Consequence, honestly disclosed: only `single_choice` questions whose
   `answer` matches one of their own `options` verbatim, on a material
   whose `subject` matches one of AHS.Subjects' 9 known Chinese names,
   can flow into this Exam-Mode-compatible shape. true_false/fill_blank/
   calculation/essay questions, and any unmappable subject, are skipped
   here (not fabricated into fake multiple-choice content) — the
   Question Bank record still exists in full inside the Repository/
   TeachingMaterialData.js; only what QuestionRuntime.importQuestions()
   is fed for THIS Exam-Mode path is filtered. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialLoader = (function () {
  "use strict";

  var STORAGE_KEY = "teachingMaterialLoaderIdMap";
  var OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];
  var initialized = false;

  function loadIdMap() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && typeof loaded === "object") { return loaded; }
    }
    return {};
  }

  function saveIdMap(map) {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, map);
    }
  }

  function shallowClone(obj) {
    var copy = {};
    Object.keys(obj || {}).forEach(function (key) { copy[key] = obj[key]; });
    return copy;
  }

  /* Only runs the one time a Package is first resolved to a real
     MaterialRuntime id — SummaryRuntime is sessionStorage-persisted just
     like MaterialRuntime, so re-adding on every page visit would
     duplicate it the same way. */
  function loadSummary(entry, runtimeMaterialId) {
    if (!entry.summary || !AHS.SummaryRuntime || typeof AHS.SummaryRuntime.add !== "function") { return; }
    var summary = shallowClone(entry.summary);
    summary.materialId = runtimeMaterialId;
    AHS.SummaryRuntime.add(summary);
  }

  function resolveMaterialId(entry, idMap) {
    if (idMap[entry.materialId]) { return idMap[entry.materialId]; }
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.add !== "function") { return null; }
    var record = AHS.MaterialRuntime.add(entry.material || {});
    if (!record || !record.id) { return null; }
    idMap[entry.materialId] = record.id;
    saveIdMap(idMap);
    loadSummary(entry, record.id);
    return record.id;
  }

  function examIdFor(runtimeMaterialId) {
    return "teaching_material_" + runtimeMaterialId;
  }

  /* Reverse-looks-up AHS.Subjects' own real Chinese display names — no
     separate, hand-maintained list, always derived from the same source
     of truth QuestionCard.js itself reads. Returns null (not a guessed
     fallback) when the Package's subject string doesn't match any of
     the 9 known names, e.g. "地球科學" — nothing in this app can safely
     render an unknown subject key today. */
  function subjectKeyFromChineseName(name) {
    if (!AHS.Subjects || !name) { return null; }
    var found = null;
    Object.keys(AHS.Subjects).forEach(function (key) {
      if (AHS.Subjects[key] && AHS.Subjects[key].name === name) { found = key; }
    });
    return found;
  }

  /* Reshapes Package questions into the shape AHS.AutoGrader.grade() and
     js/ui/QuestionCard.js actually require (see the file header for
     why). Only single_choice questions with a resolvable answer, on a
     material with a mappable subject, are included — everything else is
     honestly skipped, never fabricated into fake options. */
  function buildExamCompatibleQuestions(entry, runtimeMaterialId) {
    var subjectKey = subjectKeyFromChineseName(entry.material && entry.material.subject);
    if (!subjectKey) { return []; }
    var chapter = (entry.material && entry.material.chapter) || "";
    var compatible = [];
    (entry.questions || []).forEach(function (q) {
      if (!q || q.type !== "single_choice") { return; }
      if (!Array.isArray(q.options) || q.options.length < 2) { return; }
      var answerIndex = q.options.indexOf(q.answer);
      if (answerIndex === -1 || answerIndex >= OPTION_KEYS.length) { return; }
      compatible.push({
        id: q.id,
        index: compatible.length + 1,
        subject: subjectKey,
        text: q.question,
        type: q.type,
        options: q.options.map(function (text, i) {
          return { key: OPTION_KEYS[i] || String(i), text: text };
        }),
        correctAnswer: OPTION_KEYS[answerIndex],
        knowledgePoint: chapter,
        explanation: q.explanation || "",
        materialId: runtimeMaterialId,
        questionSource: q.questionSource,
        origin: q.origin,
        page: q.page
      });
    });
    return compatible;
  }

  /* Re-run on every page load where AHS.QuestionRuntime is present —
     that Runtime is intentionally memory-only, so its store is always
     empty on a fresh page load regardless of what an earlier page
     already did. hasExam() guards a same-page double-call. Calling
     importQuestions() with an empty array is a harmless no-op — hasExam()
     stays false, exactly reflecting "nothing here is Exam-Mode-eligible". */
  function loadQuestions(entry, runtimeMaterialId) {
    if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.importQuestions !== "function") { return; }
    var examId = examIdFor(runtimeMaterialId);
    if (typeof AHS.QuestionRuntime.hasExam === "function" && AHS.QuestionRuntime.hasExam(examId)) { return; }
    var questions = buildExamCompatibleQuestions(entry, runtimeMaterialId);
    if (!questions.length) { return; }
    AHS.QuestionRuntime.importQuestions(examId, questions);
  }

  /* resolveExamMeta(examId) — Sprint v1.6 Module C: quiz.html's direct
     entry needs real subject/title/chapter/grade to pass into
     ExamRuntime.startFromExam() (never fabricated). Reverses examId ->
     runtimeMaterialId -> (via the persisted id map) packageMaterialId ->
     (via AHS.TeachingMaterialData, already <script>-tagged on quiz.html
     since Sprint v1.4) the real material's own fields. Returns null if
     any step fails — the caller falls back to the normal Exam Mode list,
     never a fabricated session. */
  function resolveExamMeta(examId) {
    var match = /^teaching_material_(.+)$/.exec(examId || "");
    if (!match) { return null; }
    var runtimeMaterialId = match[1];
    var idMap = loadIdMap();
    var packageMaterialId = null;
    Object.keys(idMap).forEach(function (pkgId) {
      if (idMap[pkgId] === runtimeMaterialId) { packageMaterialId = pkgId; }
    });
    if (!packageMaterialId) { return null; }
    var entries = Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : [];
    var entry = null;
    entries.forEach(function (e) { if (e && e.materialId === packageMaterialId) { entry = e; } });
    if (!entry || !entry.material) { return null; }
    return {
      subject: entry.material.subject,
      title: entry.material.title,
      chapter: entry.material.chapter,
      grade: entry.material.grade
    };
  }

  function loadEntry(entry, idMap) {
    if (!entry || !entry.materialId || !entry.material) { return; }
    var runtimeMaterialId = resolveMaterialId(entry, idMap);
    if (!runtimeMaterialId) { return; }
    loadQuestions(entry, runtimeMaterialId);
  }

  /* initialize() — safe to call on every page, safe to call more than
     once per page. No-ops entirely when AHS.TeachingMaterialData is
     absent/empty (Repository genuinely empty, or this page doesn't ship
     the generated data file) — the existing Empty State is untouched. */
  function initialize() {
    if (initialized) { return; }
    initialized = true;
    var entries = Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : [];
    if (!entries.length) { return; }
    var idMap = loadIdMap();
    entries.forEach(function (entry) { loadEntry(entry, idMap); });
  }

  /* reset() — test helper only; mirrors every Runtime's own reset(),
     never called anywhere in the running app. */
  function reset() {
    initialized = false;
  }

  return { initialize: initialize, resolveExamMeta: resolveExamMeta, reset: reset };
})();
