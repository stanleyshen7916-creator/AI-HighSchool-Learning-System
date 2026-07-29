/* ai-engine/src/service/QuestionService.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/service/SummaryService.js (EO-AI-007/EO-AI-008).
   AI Runtime Service Layer only — no UI, no DOM, does not touch any
   Quiz/WrongBook/Review component. Quiz's existing production question
   flow (QuestionProviderBridge -> QuestionGenerationRuntime ->
   LearningQuestionSession/Runtime) is the Baseline and is untouched by
   this file.

   Owns one QuestionRuntime + one QuestionPipeline for the page's
   lifetime (singleton, same pattern as the Platform's AHS.* runtimes
   and as AHS.AIEngine.SummaryService) so repeated calls share the same
   cache — generate() only re-runs the pipeline when QuestionPipeline/
   QuestionRuntime decide to; this layer adds no caching logic of its
   own.

   getWithFallback() (mirrors EO-AI-008's compatibility bridge): this
   pipeline's own `questions` field is currently an honest empty stub
   (see QuestionBuilder), so if this Service's own Runtime already
   holds a set with real content, return it; otherwise read (never
   write) whatever AHS.QuestionGenerationRuntime.getQuestionsByMaterial()
   — the real, LOCK, production Knowledge-Graph-driven generator —
   already has. Nothing here calls AHS.QuestionProviderBridge or writes
   to QuestionGenerationRuntime; both stay untouched and unmodified in
   behavior. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.QuestionService = (function () {
  "use strict";

  var CONTENT_FIELDS = ["questions"];

  var runtime = new AHS.AIEngine.QuestionRuntime();
  var pipeline = new AHS.AIEngine.QuestionPipeline({ runtime: runtime });

  function generate(materialId) {
    return pipeline.run(materialId);
  }

  function generateFromMaterial(material) {
    if (!material || !material.id) {
      throw new AHS.AIEngine.ValidationError(
        "QuestionService.generateFromMaterial requires a material with an id"
      );
    }
    return generate(material.id);
  }

  function get(materialId) {
    return runtime.get(materialId);
  }

  function hasRealContent(questionSet) {
    if (!questionSet) { return false; }
    return CONTENT_FIELDS.some(function (field) {
      return Array.isArray(questionSet[field]) && questionSet[field].length > 0;
    });
  }

  /* Read-only compatibility bridge. Never calls
     AHS.QuestionProviderBridge, never writes to QuestionGenerationRuntime. */
  function getWithFallback(materialId) {
    var existing = get(materialId);
    if (hasRealContent(existing)) {
      return existing;
    }
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

  return {
    generate: generate,
    generateFromMaterial: generateFromMaterial,
    get: get,
    getWithFallback: getWithFallback
  };
})();
