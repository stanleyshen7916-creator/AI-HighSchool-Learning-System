/* js/runtime/AITutorRuntime.js — Sprint 8.3 · EO-S8.3.001
   AI Tutor Runtime Foundation — the unified entry point for every AI
   learning capability.

   Fixed architecture (LOCK): AI Tutor is a Learning Capability
   CONSUMER. It integrates the outputs of the existing capability
   runtimes and hands them over as one Learning Context — nothing more:

     KnowledgeGraphRuntime
        ├── Summary capability ─┐
        ├── Question capability ┤
        └── AI Tutor Runtime ◄──┼── (this file, read-only integrator)
                                │
        Quiz/Exam Result → WrongBook → ReviewGenerator ─┘

   Runtime Rules (LOCK) — enforced structurally, not by convention
   (source-scan asserted in tests/regression/AITutorRuntimeV1.js):
   this module calls ONLY read APIs. It never generates questions,
   never rebuilds a Summary, a WrongBook or a Review, never re-parses a
   material and never rebuilds the Knowledge Graph. There is no
   reference here to createSummary / generateQuestions / generateReview /
   WrongBookGenerator.add, nor to MaterialRuntime, AnalysisRuntime,
   KnowledgeExtractionRuntime or KnowledgeGraphRuntime. If a capability
   has produced nothing yet, the Learning Context reports an honest
   empty section rather than triggering generation.

   Integrated sources (all read-only), and two naming notes flagged in
   REPORT.md:
     · Summary   → AHS.KnowledgeSummaryRuntime (EO-S8.2.002). The EO
       diagram places Summary as a Knowledge Graph consumer, which is
       this module; the older LOCK AHS.SummaryRuntime is the Sprint-5
       non-graph store and is deliberately NOT used here.
     · Question  → AHS.QuestionGenerationRuntime (EO-S8.2.003).
     · WrongBook → AHS.WrongBookSession (EO-S7.0-001). The EO names
       "WrongBookGeneratorRuntime", which does not exist in this
       repository; the WrongBook capability is the WrongBookGenerator
       (write Interface) + WrongBookSession (store) pair, and a consumer
       only ever reads the store.
     · Review    → AHS.ReviewGeneratorRuntime (EO-S8.2.005).

   Learning Context Model (LOCK, core fields unchanged):
     { materialId, summary: {}, questions: [], wrongBook: [], review: [] }

   Runtime: MEMORY ONLY. No localStorage, no sessionStorage, no
   IndexedDB, no PersistenceAdapter. The only state held is the
   registration record produced by initialize(); all learning data is
   read live from its owning runtime, so the Tutor can never serve a
   stale or divergent copy.

   Explicitly NOT in this Sprint: chat UI, AI dialogue, prompt
   engineering, any LLM/provider call, voice, OCR, parser. */
window.AHS = window.AHS || {};
AHS.AITutorRuntime = (function () {
  "use strict";

  /* Runtime Registration — capability id → the read APIs it must expose.
     Declarative so initialize() can report exactly what is available
     without any module guessing on another's behalf. */
  var CAPABILITIES = [
    { id: "summary", namespace: "KnowledgeSummaryRuntime", reader: "getSummaryByMaterial" },
    { id: "question", namespace: "QuestionGenerationRuntime", reader: "getQuestionsByMaterial" },
    { id: "wrongBook", namespace: "WrongBookSession", reader: "list" },
    { id: "review", namespace: "ReviewGeneratorRuntime", reader: "getReviewByMaterial" }
  ];

  /* Memory Runtime Only — registration state, no persistence. */
  var registration = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function moduleFor(namespace) {
    return AHS[namespace] || null;
  }

  function capabilityAvailable(capability) {
    var mod = moduleFor(capability.namespace);
    return !!(mod && typeof mod[capability.reader] === "function");
  }

  /* ---- initialize() -------------------------------------------------------
     Runtime Registration: records which capability runtimes are present
     and callable. Returns
       { initialized, initializedAt, capabilities: [ { id, namespace,
         available } ], availableCount, missing: [ id… ] }
     Never throws and never generates anything — a missing capability is
     reported, not created. Safe to call repeatedly (re-registers). */
  function initialize() {
    var capabilities = CAPABILITIES.map(function (capability) {
      return {
        id: capability.id,
        namespace: capability.namespace,
        available: capabilityAvailable(capability)
      };
    });
    var missing = capabilities.filter(function (c) { return !c.available; })
      .map(function (c) { return c.id; });

    registration = {
      initialized: true,
      initializedAt: new Date().toISOString(),
      capabilities: capabilities,
      availableCount: capabilities.length - missing.length,
      missing: missing
    };
    return clone(registration);
  }

  function ensureRegistered() {
    if (!registration) { initialize(); }
  }

  /* ---- getKnowledgeSummary(materialId) -----------------------------------
     The Summary capability's own record for this material, or an empty
     object when it has produced none. Read-only: never createSummary(). */
  function getKnowledgeSummary(materialId) {
    ensureRegistered();
    if (!materialId) { return {}; }
    var mod = moduleFor("KnowledgeSummaryRuntime");
    if (!mod || typeof mod.getSummaryByMaterial !== "function") { return {}; }
    var record = mod.getSummaryByMaterial(materialId);
    return record ? record : {};
  }

  /* ---- getQuestionSet(materialId) ----------------------------------------
     The generated questions for this material, or an empty array.
     Read-only: never generateQuestions(). */
  function getQuestionSet(materialId) {
    ensureRegistered();
    if (!materialId) { return []; }
    var mod = moduleFor("QuestionGenerationRuntime");
    if (!mod || typeof mod.getQuestionsByMaterial !== "function") { return []; }
    var record = mod.getQuestionsByMaterial(materialId);
    return (record && Array.isArray(record.questions)) ? record.questions : [];
  }

  /* ---- getWrongBook(materialId) ------------------------------------------
     This material's wrong-answer records, or an empty array. Read-only:
     never WrongBookGenerator.add() / update() / remove(). */
  function getWrongBook(materialId) {
    ensureRegistered();
    if (!materialId) { return []; }
    var mod = moduleFor("WrongBookSession");
    if (!mod || typeof mod.list !== "function") { return []; }
    return mod.list().filter(function (entry) { return entry.materialId === materialId; });
  }

  /* ---- getReviewList(materialId) -----------------------------------------
     This material's review items, or an empty array. Read-only: never
     generateReview(). */
  function getReviewList(materialId) {
    ensureRegistered();
    if (!materialId) { return []; }
    var mod = moduleFor("ReviewGeneratorRuntime");
    if (!mod || typeof mod.getReviewByMaterial !== "function") { return []; }
    var record = mod.getReviewByMaterial(materialId);
    return (record && Array.isArray(record.reviewItems)) ? record.reviewItems : [];
  }

  /* ---- getLearningContext(materialId) ------------------------------------
     The unified Learning Context (LOCK model, exactly five fields).
     Built fresh on every call from the owning runtimes, so it always
     reflects their current state. Returns null without a materialId. */
  function getLearningContext(materialId) {
    ensureRegistered();
    if (!materialId) { return null; }
    return {
      materialId: materialId,
      summary: getKnowledgeSummary(materialId),
      questions: getQuestionSet(materialId),
      wrongBook: getWrongBook(materialId),
      review: getReviewList(materialId)
    };
  }

  /* ---- serialize(materialId?) --------------------------------------------
     JSON text of one material's Learning Context, or of the registration
     state when no materialId is given. Pure read — serialising never
     mutates, persists or generates anything. */
  function serialize(materialId) {
    ensureRegistered();
    if (materialId) {
      var context = getLearningContext(materialId);
      return context ? JSON.stringify(context) : null;
    }
    return JSON.stringify(registration);
  }

  return {
    initialize: initialize,
    getLearningContext: getLearningContext,
    getKnowledgeSummary: getKnowledgeSummary,
    getQuestionSet: getQuestionSet,
    getWrongBook: getWrongBook,
    getReviewList: getReviewList,
    serialize: serialize
  };
})();
