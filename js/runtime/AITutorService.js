/* js/runtime/AITutorService.js — Sprint 8.3 · EO-S8.3.002
   AI Tutor Service Runtime — the service layer above AITutorRuntime.

   Fixed architecture (LOCK):

     AITutorRuntime
          │
          ▼
     AITutorService        (this file)
          │
     ┌────┼─────────┬──────────┐
     ▼    ▼         ▼          ▼
   Summary Question WrongBook Review
   Runtime Runtime  Runtime   Runtime

   The Service Layer ONLY coordinates data. Reuse Before Create: rather
   than re-opening its own four connections to the capability runtimes,
   it reads through AITutorRuntime's existing read-only API
   (initialize / getLearningContext / getKnowledgeSummary /
   getQuestionSet / getWrongBook / getReviewList). AITutorRuntime already
   owns the read-only integration of Summary / Question / WrongBook /
   Review and reports them as a live view, so this layer coordinates and
   shapes that data into a Learning Session without duplicating the
   integration — the diagram's four downward arrows are fulfilled
   through that single already-built integrator.

   Runtime Rules (LOCK), enforced structurally and asserted by
   source-scan in tests/regression/AITutorServiceV1.js: the service
   NEVER rebuilds Summary, Question, WrongBook or Review. There is no
   reference here to createSummary / generateQuestions / generateReview /
   WrongBookGenerator, nor to MaterialRuntime, AnalysisRuntime,
   KnowledgeExtractionRuntime or KnowledgeGraphRuntime. Every getter is a
   pure read; an empty capability yields an honest empty section, never
   a triggered generation.

   Learning Session Model (LOCK, core fields unchanged):
     { materialId, summary: {}, questions: [], wrongBook: [], review: [],
       generatedAt: "" }
   Note the model adds `generatedAt` relative to AITutorRuntime's
   Learning Context — the Service stamps the moment the session was
   assembled, which is the one field a coordination layer legitimately
   owns.

   Explicitly NOT in this Sprint (PMO LOCK): no LLM / OpenAI / Claude /
   Gemini call, no chat, no prompt, no OCR, no parser, no UI.

   Runtime: MEMORY ONLY. No localStorage, no sessionStorage, no
   IndexedDB, no PersistenceAdapter. The only state held is the most
   recently built session (a coordination convenience); all learning
   data is read live from AITutorRuntime, so the service can never serve
   a stale or divergent copy.

   EO-AI-012 Revision-1 · AI Summary Legacy Migration (Migration Bridge,
   additive only — public API/signatures/return format unchanged).
   getLearningSummary() now checks for AHS.AIEngine.SummaryProvider and,
   if present, delegates the read to it — SummaryProvider alone decides
   legacy/new/compare (this file never inspects or branches on mode).
   SummaryProvider is not wired into any page yet (deferred to
   EO-AI-012A), so on every real page today this check finds nothing and
   falls through to the exact pre-EO-AI-012 AITutorRuntime-coordinated
   read below — byte-identical behaviour, zero live regression.
   ensureLearningSummary()'s generation chain is untouched: Migration
   is not complete this EO (SummaryProvider's default mode stays
   'legacy' — see EO-AI-012B), so the only thing that can safely change
   yet is the read path. */
window.AHS = window.AHS || {};
AHS.AITutorService = (function () {
  "use strict";

  /* Memory Runtime Only — last built session, no persistence. */
  var lastSession = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function tutor() {
    return (AHS.AITutorRuntime && typeof AHS.AITutorRuntime.getLearningContext === "function")
      ? AHS.AITutorRuntime : null;
  }

  /* EO-AI-012 Revision-1 — present only once EO-AI-012A wires ai-engine
     into a page; null on every real page today. */
  function summaryProvider() {
    return (typeof window !== "undefined" && window.AHS &&
      AHS.AIEngine && AHS.AIEngine.SummaryProvider &&
      typeof AHS.AIEngine.SummaryProvider.getSummary === "function")
      ? AHS.AIEngine.SummaryProvider
      : null;
  }

  /* ---- getLearningSummary(materialId) ------------------------------------
     The Summary section. Routes through SummaryProvider when it is
     present (Migration Bridge); otherwise coordinated through
     AITutorRuntime exactly as before. Read-only; an empty object when
     nothing has been produced. */
  function getLearningSummary(materialId) {
    if (!materialId) { return {}; }

    var provider = summaryProvider();
    if (provider) {
      var routed = provider.getSummary(materialId);
      return routed ? routed : {};
    }

    var t = tutor();
    if (!t || typeof t.getKnowledgeSummary !== "function") { return {}; }
    var summary = t.getKnowledgeSummary(materialId);
    return summary ? summary : {};
  }

  /* ---- getPracticeQuestions(materialId) ----------------------------------
     The generated practice questions; empty array when none exist. */
  function getPracticeQuestions(materialId) {
    var t = tutor();
    if (!t || !materialId || typeof t.getQuestionSet !== "function") { return []; }
    var questions = t.getQuestionSet(materialId);
    return Array.isArray(questions) ? questions : [];
  }

  /* ---- getWrongBookItems(materialId) -------------------------------------
     The wrong-answer records for this material; empty array when none. */
  function getWrongBookItems(materialId) {
    var t = tutor();
    if (!t || !materialId || typeof t.getWrongBook !== "function") { return []; }
    var items = t.getWrongBook(materialId);
    return Array.isArray(items) ? items : [];
  }

  /* ---- getReviewItems(materialId) ----------------------------------------
     The review items for this material; empty array when none. */
  function getReviewItems(materialId) {
    var t = tutor();
    if (!t || !materialId || typeof t.getReviewList !== "function") { return []; }
    var items = t.getReviewList(materialId);
    return Array.isArray(items) ? items : [];
  }

  /* ---- buildLearningContext(materialId) ----------------------------------
     Assembles the LOCK Learning Session Model for one material by
     coordinating the four sections. Built fresh on every call from live
     data, then stamped with generatedAt and retained as lastSession.
     Returns null without a materialId. */
  function buildLearningContext(materialId) {
    if (!materialId) { return null; }
    var session = {
      materialId: materialId,
      summary: getLearningSummary(materialId),
      questions: getPracticeQuestions(materialId),
      wrongBook: getWrongBookItems(materialId),
      review: getReviewItems(materialId),
      generatedAt: new Date().toISOString()
    };
    lastSession = session;
    return clone(session);
  }

  /* ---- getTutorSession(materialId?) --------------------------------------
     With a materialId, builds (and returns) that material's session;
     without one, returns the most recently built session, or null. */
  function getTutorSession(materialId) {
    if (materialId) { return buildLearningContext(materialId); }
    return lastSession ? clone(lastSession) : null;
  }

  /* ---- serialize(materialId?) --------------------------------------------
     JSON text of one material's freshly built session, or of the last
     built session when no materialId is given. Pure read — serialising
     never mutates, persists or generates anything. */
  function serialize(materialId) {
    if (materialId) {
      var session = buildLearningContext(materialId);
      return session ? JSON.stringify(session) : null;
    }
    return lastSession ? JSON.stringify(lastSession) : null;
  }

  /* ---- ensureLearningSummary(materialId) — EO-S8.3.004 / S8.3.005 ------
     UI coordination entry point for "開始 AI 分析". Read getters stay
     pure; this method is allowed to ASK the capability chain to produce
     its output, WITHOUT any Runtime parsing a file itself.

     EO-S8.3.005: the Service obtains the material's text through the
     unified Text Pipeline (never an upload object) and drives the
     Knowledge chain so Summary has real content:
       Material → Text Pipeline (text?) → KnowledgePipeline (Analysis →
       Extraction → Knowledge Graph) → KnowledgeSummaryRuntime → summary
     KnowledgeSummaryRuntime derives from the already-built graph, so no
     material is re-parsed at summary time. Idempotent: an existing
     summary is returned as-is.

     If the material has no readable text the whole chain yields nothing
     and this returns the unified empty result
       { status: "no_readable_content", message: "No readable content" }
     — it never throws. */
  function ensureLearningSummary(materialId) {
    if (!materialId) { return noContent(); }

    var existing = getLearningSummary(materialId);
    if (existing && existing.materialId) { return existing; }

    /* Text via the unified pipeline — not the upload object. */
    var pipeline = AHS.MaterialTextPipeline;
    var supplied = (pipeline && typeof pipeline.getText === "function")
      ? pipeline.getText(materialId) : null;
    if (!supplied || supplied.status !== "ready" || !String(supplied.text || "").trim()) {
      return noContent();
    }

    /* Ensure the Knowledge Graph exists for this material, then derive
       the summary from it. KnowledgePipeline reads text through the same
       provider chain — no re-parsing, no upload object. */
    var kg = AHS.KnowledgeGraphRuntime;
    var hasGraph = !!(kg && typeof kg.queryByMaterial === "function" &&
      kg.queryByMaterial(materialId).some(function (n) {
        return kg.CONTENT_TYPES && kg.CONTENT_TYPES.indexOf(n.type) !== -1;
      }));
    if (!hasGraph && AHS.KnowledgePipeline && typeof AHS.KnowledgePipeline.process === "function") {
      AHS.KnowledgePipeline.process(materialId);
    }

    var summaryRuntime = AHS.KnowledgeSummaryRuntime;
    if (summaryRuntime && typeof summaryRuntime.createSummary === "function") {
      var produced = summaryRuntime.createSummary(materialId);
      if (produced) { return produced; }
    }
    return noContent();
  }

  function noContent() {
    return { status: "no_readable_content", message: "No readable content" };
  }

  /* ---- ensureQuestionSet(materialId) — EO-S8.3.006 Integration ----------
     UI coordination entry point for「產生 AI 題目」/「重新產生題目」.
     Like ensureLearningSummary, the read getters stay pure; this method
     may ASK the Question capability to produce its set, WITHOUT
     re-analysing the material:
       Material → Text Pipeline (text?) → KnowledgePipeline (build graph
       if absent) → QuestionGenerationRuntime.generateQuestions → set
     generateQuestions derives from the already-built Knowledge Graph, so
     no material is re-parsed. `force` (used by「重新產生題目」) always
     regenerates from the same graph; otherwise an existing set is
     returned as-is. No readable text → unified No readable content,
     never a thrown error. */
  function ensureQuestionSet(materialId, force) {
    if (!materialId) { return noContent(); }

    var questionRuntime = AHS.QuestionGenerationRuntime;
    if (!questionRuntime || typeof questionRuntime.generateQuestions !== "function") {
      return noContent();
    }

    if (!force) {
      var existing = getPracticeQuestions(materialId);
      if (Array.isArray(existing) && existing.length) {
        return questionRuntime.getQuestionsByMaterial(materialId);
      }
    }

    /* Text via the unified pipeline — not the upload object. */
    var pipeline = AHS.MaterialTextPipeline;
    var supplied = (pipeline && typeof pipeline.getText === "function")
      ? pipeline.getText(materialId) : null;
    if (!supplied || supplied.status !== "ready" || !String(supplied.text || "").trim()) {
      return noContent();
    }

    /* Ensure the Knowledge Graph exists, then generate from it. */
    var kg = AHS.KnowledgeGraphRuntime;
    var hasGraph = !!(kg && typeof kg.queryByMaterial === "function" &&
      kg.queryByMaterial(materialId).some(function (n) {
        return kg.CONTENT_TYPES && kg.CONTENT_TYPES.indexOf(n.type) !== -1;
      }));
    if (!hasGraph && AHS.KnowledgePipeline && typeof AHS.KnowledgePipeline.process === "function") {
      AHS.KnowledgePipeline.process(materialId);
    }

    var produced = questionRuntime.generateQuestions(materialId);
    return produced ? produced : noContent();
  }

  return {
    ensureLearningSummary: ensureLearningSummary,
    ensureQuestionSet: ensureQuestionSet,
    buildLearningContext: buildLearningContext,
    getLearningSummary: getLearningSummary,
    getPracticeQuestions: getPracticeQuestions,
    getWrongBookItems: getWrongBookItems,
    getReviewItems: getReviewItems,
    getTutorSession: getTutorSession,
    serialize: serialize
  };
})();
