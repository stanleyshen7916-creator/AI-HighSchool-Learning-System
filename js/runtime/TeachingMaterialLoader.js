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
   nothing to load it into. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialLoader = (function () {
  "use strict";

  var STORAGE_KEY = "teachingMaterialLoaderIdMap";
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

  /* Re-run on every page load where AHS.QuestionRuntime is present —
     that Runtime is intentionally memory-only, so its store is always
     empty on a fresh page load regardless of what an earlier page
     already did. hasExam() guards a same-page double-call. */
  function loadQuestions(entry, runtimeMaterialId) {
    if (!Array.isArray(entry.questions) || !entry.questions.length) { return; }
    if (!AHS.QuestionRuntime || typeof AHS.QuestionRuntime.importQuestions !== "function") { return; }
    var examId = "teaching_material_" + runtimeMaterialId;
    if (typeof AHS.QuestionRuntime.hasExam === "function" && AHS.QuestionRuntime.hasExam(examId)) { return; }
    var questions = entry.questions.map(function (q) {
      var clone = shallowClone(q);
      clone.materialId = runtimeMaterialId;
      return clone;
    });
    AHS.QuestionRuntime.importQuestions(examId, questions);
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

  return { initialize: initialize, reset: reset };
})();
