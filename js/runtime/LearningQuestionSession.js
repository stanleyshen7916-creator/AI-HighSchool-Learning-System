/* js/runtime/LearningQuestionSession.js — Sprint 6.9 · EO-S6.9-001
   AI Question Generator Foundation — Runtime v1.0.

   Naming (PMO Ruling 1B): the EO's "LearningQuestionRuntime v1.0" is
   implemented under a NEW name, AHS.LearningQuestionSession, because
   js/runtime/LearningQuestionRuntime.js already exists (EO-S6-004,
   LOCK — Practice Mode reads it live). Overwriting or modifying it is
   forbidden this EO ("不得修改 Runtime"). Same precedent as EO-S6-004's
   QuestionRuntime naming flag. The existing LearningQuestionRuntime.js
   is completely untouched (confirmed by diff).

   Scope (fixed, per EO): exactly four pieces of state —
     - Question List   (Schema v1.0 records, validate-gated)
     - Current Index
     - Metadata
     - Status          ("empty" | "ready", derived — never hand-set)
   Explicitly NOT here (EO 不得加入): Practice Logic, Wrong Book Logic,
   Score Logic — no answering, no grading, no syncing to any other
   Runtime. Store / Query only.

   Validation gate: add() calls AHS.LearningQuestionGenerator.validate()
   (Interface v1.0) and REFUSES to store an invalid record — returns
   null instead of a stored clone ("Validation Failed 不得加入
   Runtime"). No Stub/Mock/Placeholder question can enter: validate()
   rejects empty answer/explanation/knowledgePoint, and this Runtime has
   no other write path.

   PMO Decision 025 · Runtime Persistence Layer: hydrates from
   AHS.PersistenceAdapter on module load and persists after every write
   — only ever through the Adapter (never sessionStorage directly).
   PascalCase module under window.AHS, consistent with every existing
   Runtime in this repo. */
window.AHS = window.AHS || {};
AHS.LearningQuestionSession = (function () {
  "use strict";

  var STORAGE_KEY = "learningQuestionSession";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.questions) &&
          typeof loaded.currentIndex === "number" &&
          loaded.metadata && typeof loaded.metadata === "object") {
        return loaded;
      }
    }
    return null;
  }

  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }

  var store = hydrate() || { questions: [], currentIndex: 0, metadata: {} };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* status is DERIVED state — "empty" until at least one real,
     validated question exists, then "ready". Never stored, never
     settable from outside, so it can never lie. */
  function getStatus() {
    return store.questions.length === 0 ? "empty" : "ready";
  }

  /* ---- Store (validate-gated) ------------------------------------------ */
  function add(record) {
    if (!AHS.LearningQuestionGenerator || typeof AHS.LearningQuestionGenerator.validate !== "function") {
      /* No Interface loaded => no gate available => nothing may enter. */
      return null;
    }
    var check = AHS.LearningQuestionGenerator.validate(record);
    if (!check.valid) { return null; }

    var stored = clone(record);
    store.questions.push(stored);
    persist();
    return clone(stored);
  }

  /* ---- Question List ---------------------------------------------------- */
  function list() {
    return clone(store.questions);
  }

  function count() {
    return store.questions.length;
  }

  function isEmpty() {
    return store.questions.length === 0;
  }

  function getById(id) {
    var found = null;
    store.questions.forEach(function (q) { if (q.id === id) { found = q; } });
    return found ? clone(found) : null;
  }

  function findByMaterialId(materialId) {
    return clone(store.questions.filter(function (q) { return q.materialId === materialId; }));
  }

  /* ---- Current Index ----------------------------------------------------
     Clamped to the valid range; on an empty list the index is always 0.
     Navigation state only — moving the index has no side effects
     (no answering, no scoring: that logic is explicitly out of scope). */
  function getCurrentIndex() {
    return store.currentIndex;
  }

  function setCurrentIndex(i) {
    var max = Math.max(0, store.questions.length - 1);
    var next = (typeof i === "number" && isFinite(i)) ? Math.floor(i) : 0;
    store.currentIndex = Math.min(Math.max(0, next), max);
    persist();
    return store.currentIndex;
  }

  function getCurrent() {
    var q = store.questions[store.currentIndex];
    return q ? clone(q) : null;
  }

  /* ---- Metadata ---------------------------------------------------------- */
  function getMetadata() {
    return clone(store.metadata);
  }

  function setMetadata(patch) {
    patch = (patch && typeof patch === "object" && !Array.isArray(patch)) ? patch : {};
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) { store.metadata[k] = patch[k]; }
    }
    persist();
    return clone(store.metadata);
  }

  /* reset() — test helper; clears back to first-open state. */
  function reset() {
    store = { questions: [], currentIndex: 0, metadata: {} };
    persist();
  }

  return {
    add: add,
    list: list,
    count: count,
    isEmpty: isEmpty,
    getById: getById,
    findByMaterialId: findByMaterialId,
    getCurrentIndex: getCurrentIndex,
    setCurrentIndex: setCurrentIndex,
    getCurrent: getCurrent,
    getMetadata: getMetadata,
    setMetadata: setMetadata,
    getStatus: getStatus,
    reset: reset
  };
})();
