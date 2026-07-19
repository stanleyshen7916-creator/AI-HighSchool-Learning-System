/* js/runtime/LearningQuestionRuntime.js — Sprint 6 · EO-S6-004 Learning
   Question Generator Foundation.

   Naming flag: this file implements EO-S6-004's "Question Runtime" but
   is named LearningQuestionRuntime, not QuestionRuntime — because
   js/runtime/QuestionRuntime.js already exists (Sprint 4, powers real
   exam-taking in Quiz Center: quiz.html loads it, QuizCenter.js calls
   AHS.QuestionRuntime.getSet(session.examId)). Overwriting that file/
   namespace would silently break a Do NOT Modify page. See
   js/services/QuestionGenerator.js's header and REPORT.md for the full
   explanation. The existing js/runtime/QuestionRuntime.js is completely
   untouched by this EO (confirmed by diff).

   Scope: Store / Query / Sync only — never calls AI, never operates on
   UI, never modifies Knowledge/Summary/Material Runtime (none are
   written to; sync() only reads a Knowledge record via
   AHS.QuestionGenerator).

   Completeness gate (the key difference from every other Sprint 6
   Runtime): EO-S6-004 requires "每一題必須包含 [10 items]...缺少任何一項：
   不得加入 Question Runtime". Unlike KnowledgeRuntime/SummaryRuntime
   (which always accept a record and fill safe defaults), add() here
   calls AHS.QuestionGenerator.validate() first and REFUSES to store an
   incomplete record — returns null instead of a stored clone. This is a
   deliberate, EO-mandated behavior difference, not an inconsistency.

   Learning Question schema (fixed, per EO-S6-004):
     { id, materialId, subject, grade, chapter, section, conceptId,
       concept, questionType, difficulty, question, options:[], answer,
       explanation, knowledgePoint, learningObjective, relatedConcepts:[],
       source:{type, materials:[], chapter, section, page, reference},
       traceability:{materialId, knowledgeId, summaryId}, metadata:{},
       createdAt }

   Session-scoped, in-memory only (store starts empty — same convention
   as every other Runtime in this repo). No Storage, no fetch/XHR, no
   ES module.
   PascalCase module under window.AHS, consistent with every existing
   Runtime in this repo. */
window.AHS = window.AHS || {};
AHS.LearningQuestionRuntime = (function () {
  "use strict";

  var store = { items: [], seq: 0 };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nextId() {
    store.seq += 1;
    return "lqr_" + store.seq;
  }

  /* Local fallback completeness check, used only if
     AHS.QuestionGenerator isn't loaded (defensive — mirrors the
     defensive pattern already used by every Sprint 6 Runtime's sync()).
     Mirrors AHS.QuestionGenerator.validate()'s 10-item checklist. */
  function fallbackValidate(record) {
    record = record || {};
    var errors = [];
    if (!record.question) { errors.push("缺少：題目"); }
    if (!record.questionType) { errors.push("缺少：題型"); }
    if (!record.difficulty) { errors.push("缺少：難度"); }
    if (record.answer === undefined || record.answer === null || record.answer === "") { errors.push("缺少：標準答案"); }
    if (!record.explanation) { errors.push("缺少：完整詳解"); }
    if (!record.knowledgePoint) { errors.push("缺少：考點"); }
    if (!record.learningObjective) { errors.push("缺少：學習目標"); }
    if (!record.source) { errors.push("缺少：出處"); }
    if (!Array.isArray(record.relatedConcepts)) { errors.push("缺少：延伸概念"); }
    if (!record.traceability || !record.traceability.materialId || !record.traceability.knowledgeId) {
      errors.push("缺少：Traceability");
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function checkComplete(record) {
    if (AHS.QuestionGenerator && typeof AHS.QuestionGenerator.validate === "function") {
      return AHS.QuestionGenerator.validate(record);
    }
    return fallbackValidate(record);
  }

  /* ---- Store ---------------------------------------------------------
     add(record) — validates completeness first (the 10-item checklist);
     if incomplete, returns null and stores nothing ("缺少任何一項：不得
     加入 Question Runtime"). If complete, assigns id/createdAt when
     missing and stores a clone. Never throws either way. */
  function add(record) {
    record = record || {};
    var check = checkComplete(record);
    if (!check.valid) { return null; }

    var stored = clone(record);
    stored.id = stored.id || nextId();
    stored.createdAt = stored.createdAt || (function () {
      function pad(n) { return n < 10 ? "0" + n : String(n); }
      var d = new Date();
      return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
    })();

    store.items.push(stored);
    return clone(stored);
  }

  /* ---- Sync ------------------------------------------------------------
     sync(input) — the Knowledge Runtime -> Learning Question Runtime
     bridge. Delegates the transform to AHS.QuestionGenerator.generate();
     never throws even if that module isn't loaded. Returns null if
     generation produced nothing, OR if it produced an incomplete
     candidate that add() then refuses to store — either way, "no
     complete question" and "not stored" are the same outcome from the
     caller's point of view. */
  function sync(input) {
    if (!AHS.QuestionGenerator || typeof AHS.QuestionGenerator.generate !== "function") {
      return null;
    }
    var generated = AHS.QuestionGenerator.generate(input);
    if (!generated) { return null; }
    return add(generated);
  }

  /* ---- Query --------------------------------------------------------- */

  function list() {
    return clone(store.items);
  }

  function isEmpty() {
    return store.items.length === 0;
  }

  function getById(id) {
    var found = null;
    store.items.forEach(function (item) { if (item.id === id) { found = item; } });
    return found ? clone(found) : null;
  }

  function findByMaterialId(materialId) {
    return clone(store.items.filter(function (item) { return item.materialId === materialId; }));
  }

  function findBySubject(subject) {
    return clone(store.items.filter(function (item) { return item.subject === subject; }));
  }

  function findByConceptId(conceptId) {
    return clone(store.items.filter(function (item) { return item.conceptId === conceptId; }));
  }

  /* reset() — test helper; clears the store back to first-open state. */
  function reset() {
    store = { items: [], seq: 0 };
  }

  return {
    add: add,
    sync: sync,
    list: list,
    isEmpty: isEmpty,
    getById: getById,
    findByMaterialId: findByMaterialId,
    findBySubject: findBySubject,
    findByConceptId: findByConceptId,
    reset: reset
  };
})();
