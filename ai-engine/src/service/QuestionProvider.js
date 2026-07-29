/* ai-engine/src/service/QuestionProvider.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/service/SummaryProvider.js (EO-AI-011), scoped
   to two modes only: "legacy" / "new". SummaryProvider's third mode,
   "compare", depends on SummaryComparator (a separate EO-AI-010
   deliverable, not requested by Sprint AI-101) and on a Question-domain
   equivalent of AHS.MaterialSummaryCard.hasSummaryContent() that does
   not exist in this codebase — building either would be speculative,
   unrequested implementation, so "compare" is deliberately omitted
   rather than stubbed out with invented comparison logic.

   Single entry point for retrieving a Question Set, selectable between
   the Baseline production system (AHS.QuestionGenerationRuntime,
   read-only, never written to) and the New Pipeline (AHS.AIEngine.
   QuestionService, which already owns the one QuestionRuntime/
   QuestionPipeline singleton pair — this file creates no second
   Runtime, no second Cache).

   Default mode is "legacy": unlike SummaryProvider (whose default was
   flipped to "new" only after Sprint AI-013's Beta Cutover, once the
   New pipeline had real rule-based content to show), this Question
   pipeline's `questions` field is still an honest empty stub, so
   defaulting to "new" would silently show nothing to any caller — the
   exact regression EO-AI-012C had to fix for Summary. "legacy" is safe
   by construction; a future Sprint may authorize its own Beta Cutover
   once real question content exists here.

   getQuestions(materialId) is ALWAYS Read Only, in every mode — same
   LOCK Contract as SummaryProvider.getSummary() (EO-AI-012C): it never
   generates, never triggers the pipeline, never creates a Question Set.
   generateQuestions(materialId) is the separate entry point that
   actually runs the New pipeline; nothing in this file calls it
   automatically.

   Not wired into any page's <script> order, not called by any Quiz/
   Material component — same "built, not wired" status as the rest of
   ai-engine/ and as SummaryProvider itself. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.QuestionProvider = (function () {
  "use strict";

  var MODES = ["legacy", "new"];
  var mode = "legacy";

  function setMode(nextMode) {
    if (MODES.indexOf(nextMode) === -1) {
      throw new AHS.AIEngine.ValidationError(
        "QuestionProvider.setMode requires one of: " + MODES.join(", ")
      );
    }
    mode = nextMode;
  }

  function getMode() {
    return mode;
  }

  /* Read-only — never writes to AHS.QuestionGenerationRuntime. */
  function getLegacyQuestions(materialId) {
    if (
      typeof window !== "undefined" &&
      window.AHS &&
      AHS.QuestionGenerationRuntime &&
      typeof AHS.QuestionGenerationRuntime.getQuestionsByMaterial === "function"
    ) {
      return AHS.QuestionGenerationRuntime.getQuestionsByMaterial(materialId);
    }
    return null;
  }

  /* Read-only — returns whatever the New pipeline's own Runtime
     already has cached (undefined if generateQuestions() has never
     been called for this materialId). Never runs the pipeline. */
  function readNewQuestions(materialId) {
    return AHS.AIEngine.QuestionService.get(materialId);
  }

  /* The only function that actually runs the New pipeline. Delegates
     to the existing QuestionService singleton — no second
     QuestionPipeline/QuestionRuntime instance created here. */
  function runNewQuestions(materialId) {
    return AHS.AIEngine.QuestionService.generate(materialId);
  }

  /* getQuestions(materialId) — LOCK Contract: ALWAYS Read Only
     regardless of mode. Never generates, never triggers the pipeline,
     never creates a Question Set. */
  function getQuestions(materialId) {
    if (mode === "new") { return readNewQuestions(materialId); }
    return getLegacyQuestions(materialId);
  }

  /* generateQuestions(materialId) — the explicit Generate API. Only
     meant to be called from an explicit user action; nothing in this
     file calls it automatically. */
  function generateQuestions(materialId) {
    if (mode === "new") { return runNewQuestions(materialId); }
    return getLegacyQuestions(materialId);
  }

  return {
    MODES: MODES.slice(),
    setMode: setMode,
    getMode: getMode,
    getQuestions: getQuestions,
    generateQuestions: generateQuestions
  };
})();
