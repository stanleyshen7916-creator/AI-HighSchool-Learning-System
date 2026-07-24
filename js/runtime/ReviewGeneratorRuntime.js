/* js/runtime/ReviewGeneratorRuntime.js — Sprint 8.2 · EO-S8.2.005
   Review Generator Runtime — a Learning Result CONSUMER.

   Fixed architecture (LOCK): this Runtime sits at the END of the chain
   and consumes learning RESULTS only — never knowledge, never material:

     … → QuestionGenerationRuntime → Quiz / Exam Result
                                   → WrongBook → THIS module

   Forbidden dependencies are absent by construction, not by convention
   (source-scan asserted in tests/regression/ReviewGeneratorV1.js):
   no AHS.MaterialRuntime, no AHS.AnalysisRuntime, no AHS.SummaryRuntime
   / AHS.KnowledgeSummaryRuntime, no AHS.KnowledgeExtractionRuntime — and
   deliberately no AHS.KnowledgeGraphRuntime either, since the EO fixes
   the ONLY sources as the WrongBook record and the Quiz/Exam Result.
   Nothing here re-parses a material or rebuilds any knowledge.

   The two允許 sources, both read-only:
     1. WrongBook — the real wrong-answer records. NOTE (flagged in
        REPORT.md): the EO names "WrongBookGeneratorRuntime", which does
        not exist in this repository; the WrongBook capability is the
        EO-S7.0-001 pair AHS.WrongBookGenerator (write Interface) +
        AHS.WrongBookSession (the store). Since a Review Generator only
        READS, this module reads AHS.WrongBookSession's public query API
        and never writes to it.
     2. Quiz / Exam Result — the question record held by
        AHS.QuestionGenerationRuntime, which is where knowledgeNodeId,
        knowledgeType, difficulty and the paragraph/line trace actually
        live. A WrongBook record alone carries no knowledgeType, so a
        wrong answer whose question cannot be resolved from the result
        side is SKIPPED rather than given a guessed type.

   Review Model (LOCK, core fields unchanged):
     { materialId, generatedAt,
       reviewItems: [ { questionId, knowledgeNodeId, knowledgeType,
                        priority, difficulty, traceability } ] }

   Knowledge Type (LOCK): definition | formula | keyword | concept.
   Priority (LOCK): high | medium | low — derived DETERMINISTICALLY from
   the wrong-answer record, never inferred by any model:
       masteryLevel === "mastered"  → low   (already mastered)
       wrongCount >= 3              → high  (repeatedly missed)
       wrongCount === 2             → medium
       otherwise                    → low
   difficulty is copied verbatim from the question record.

   Review Rules (LOCK): every item corresponds to a real WrongBook entry,
   and the same questionId is never added twice.

   Traceability (LOCK): materialId, questionId, knowledgeNodeId,
   paragraph, lineStart, lineEnd. paragraph/lineStart/lineEnd are taken
   from the question's own traceability — lineStart / lineEnd are
   currently null upstream (no document parser yet) and are passed
   through honestly rather than invented.

   Runtime: MEMORY ONLY. No localStorage, no sessionStorage, no
   IndexedDB, no PersistenceAdapter — review lists live for the page
   session. (Reading the WrongBook store is a read of another Runtime's
   public API, not persistence performed by this module.) */
window.AHS = window.AHS || {};
AHS.ReviewGeneratorRuntime = (function () {
  "use strict";

  var KNOWLEDGE_TYPES = ["definition", "formula", "keyword", "concept"];
  var PRIORITIES = ["high", "medium", "low"];
  var DIFFICULTIES = ["easy", "medium", "hard"];

  /* Memory Runtime Only — one in-process store. */
  var store = [];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function wrongBook() {
    return (AHS.WrongBookSession && typeof AHS.WrongBookSession.list === "function")
      ? AHS.WrongBookSession : null;
  }

  function quizResult() {
    return (AHS.QuestionGenerationRuntime && typeof AHS.QuestionGenerationRuntime.getQuestion === "function")
      ? AHS.QuestionGenerationRuntime : null;
  }

  /* Deterministic priority from the real wrong-answer record. */
  function priorityFor(entry) {
    if (entry.masteryLevel === "mastered") { return "low"; }
    var count = (typeof entry.wrongCount === "number") ? entry.wrongCount : 1;
    if (count >= 3) { return "high"; }
    if (count === 2) { return "medium"; }
    return "low";
  }

  function findIndexByMaterial(materialId) {
    for (var i = 0; i < store.length; i += 1) {
      if (store[i].materialId === materialId) { return i; }
    }
    return -1;
  }

  /* ---- generateReview(materialId) ---------------------------------------
     Builds the daily review list for one material from its WrongBook
     entries, resolving each against the Quiz/Exam Result. Returns null
     when there is nothing real to review — an honest nothing, never an
     invented list. Re-running replaces that material's list. */
  function generateReview(materialId) {
    var wb = wrongBook(), qr = quizResult();
    if (!wb || !qr || !materialId) { return null; }

    var entries = wb.list().filter(function (entry) { return entry.materialId === materialId; });
    if (!entries.length) { return null; }

    var reviewItems = [];
    var seen = {};

    entries.forEach(function (entry) {
      /* Review Rules: the same questionId is never added twice. */
      if (!entry.questionId || seen[entry.questionId]) { return; }

      /* Quiz / Exam Result side — the only allowed source of
         knowledgeType / knowledgeNodeId / difficulty / paragraph trace. */
      var question = qr.getQuestion(entry.questionId);
      if (!question) { return; }                                  /* unresolvable → skipped, never guessed */
      if (KNOWLEDGE_TYPES.indexOf(question.knowledgeType) === -1) { return; }
      if (DIFFICULTIES.indexOf(question.difficulty) === -1) { return; }

      var trace = question.traceability || {};
      reviewItems.push({
        questionId: entry.questionId,
        knowledgeNodeId: question.knowledgeNodeId,
        knowledgeType: question.knowledgeType,
        priority: priorityFor(entry),
        difficulty: question.difficulty,
        traceability: {
          materialId: materialId,
          questionId: entry.questionId,
          knowledgeNodeId: question.knowledgeNodeId,
          paragraph: (trace.paragraph === undefined) ? null : trace.paragraph,
          lineStart: (trace.lineStart === undefined) ? null : trace.lineStart,
          lineEnd: (trace.lineEnd === undefined) ? null : trace.lineEnd
        }
      });
      seen[entry.questionId] = true;
    });

    if (!reviewItems.length) { return null; }

    /* Stable ordering: high → medium → low, then by questionId, so the
       daily list is reproducible rather than storage-order dependent. */
    reviewItems.sort(function (a, b) {
      var pa = PRIORITIES.indexOf(a.priority), pb = PRIORITIES.indexOf(b.priority);
      if (pa !== pb) { return pa - pb; }
      return String(a.questionId) < String(b.questionId) ? -1 : 1;
    });

    var record = {
      materialId: materialId,
      generatedAt: new Date().toISOString(),
      reviewItems: reviewItems
    };

    var existing = findIndexByMaterial(materialId);
    if (existing === -1) { store.push(record); } else { store[existing] = record; }
    return clone(record);
  }

  /* ---- getReview(materialId?) --------------------------------------------
     With a materialId, that material's review list; without one, the most
     recently generated list. */
  function getReview(materialId) {
    if (materialId) { return getReviewByMaterial(materialId); }
    if (!store.length) { return null; }
    return clone(store[store.length - 1]);
  }

  function getReviewByMaterial(materialId) {
    var index = findIndexByMaterial(materialId);
    return index === -1 ? null : clone(store[index]);
  }

  /* ---- getReviewByKnowledgeNode(knowledgeNodeId) -------------------------
     Every review item across all materials that traces back to one
     Knowledge Graph node. */
  function getReviewByKnowledgeNode(knowledgeNodeId) {
    if (!knowledgeNodeId) { return []; }
    var out = [];
    store.forEach(function (record) {
      record.reviewItems.forEach(function (item) {
        if (item.knowledgeNodeId === knowledgeNodeId) { out.push(clone(item)); }
      });
    });
    return out;
  }

  /* ---- clearReview(materialId?) — one material's list, or all ----------- */
  function clearReview(materialId) {
    if (!materialId) {
      var removedAll = store.length;
      store = [];
      return removedAll;
    }
    var before = store.length;
    store = store.filter(function (record) { return record.materialId !== materialId; });
    return before - store.length;
  }

  /* ---- serialize(materialId?) — JSON text; pure read -------------------- */
  function serialize(materialId) {
    if (materialId) {
      var one = getReviewByMaterial(materialId);
      return one ? JSON.stringify(one) : null;
    }
    return JSON.stringify(store.map(function (record) { return clone(record); }));
  }

  return {
    generateReview: generateReview,
    getReview: getReview,
    getReviewByMaterial: getReviewByMaterial,
    getReviewByKnowledgeNode: getReviewByKnowledgeNode,
    clearReview: clearReview,
    serialize: serialize,
    KNOWLEDGE_TYPES: KNOWLEDGE_TYPES.slice(),
    PRIORITIES: PRIORITIES.slice()
  };
})();
