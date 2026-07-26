/* ai-engine/src/service/SummaryService.js — EO-AI-007 · AI Summary UI Integration (LOCK, revised)
   EO-AI-008 · AI Summary Replace Legacy Integration (LOCK, revised to Compatibility Layer)
   AI Runtime Service Layer only — no UI, no DOM, does not touch
   MaterialPreview.js or MaterialSummaryCard.js in any way. Material
   Detail's existing AI 重點整理 feature (MaterialPreview ->
   MaterialSummaryCard -> AITutorService -> KnowledgeSummaryRuntime) is
   the Baseline UI and is untouched by this file.

   Owns one SummaryRuntime + one SummaryPipeline for the page's
   lifetime (singleton, same pattern as the Platform's AHS.* runtimes)
   so repeated calls share the same cache — generate() only re-runs
   the pipeline when SummaryPipeline/SummaryRuntime decide to; this
   layer adds no caching logic of its own.

   getWithFallback() (EO-AI-008): SummaryPipeline currently cannot
   produce content equivalent to the legacy KnowledgeSummaryRuntime
   (that is a locked, separate future EO — "AI Summary Migration"),
   so this is a read-only compatibility bridge, not a replacement: if
   this Service's own Runtime already holds a model with real content,
   return it; otherwise read (never write) whatever
   AHS.KnowledgeSummaryRuntime.getSummaryByMaterial() already has.
   Nothing here calls AHS.AITutorService or writes to the legacy
   runtime — both files stay untouched and unmodified in behavior. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.SummaryService = (function () {
  "use strict";

  var CONTENT_FIELDS = ["concepts", "definitions", "formulas", "examples", "keywords"];

  var runtime = new AHS.AIEngine.SummaryRuntime();
  var pipeline = new AHS.AIEngine.SummaryPipeline({ runtime: runtime });

  function generate(materialId) {
    return pipeline.run(materialId);
  }

  function generateFromMaterial(material) {
    if (!material || !material.id) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryService.generateFromMaterial requires a material with an id"
      );
    }
    return generate(material.id);
  }

  function get(materialId) {
    return runtime.get(materialId);
  }

  function hasRealContent(summary) {
    if (!summary) { return false; }
    return CONTENT_FIELDS.some(function (field) {
      return Array.isArray(summary[field]) && summary[field].length > 0;
    });
  }

  /* Read-only compatibility bridge (EO-AI-008). Never calls
     AITutorService, never writes to KnowledgeSummaryRuntime. */
  function getWithFallback(materialId) {
    var existing = get(materialId);
    if (hasRealContent(existing)) {
      return existing;
    }
    if (
      typeof window !== "undefined" &&
      window.AHS &&
      AHS.KnowledgeSummaryRuntime &&
      typeof AHS.KnowledgeSummaryRuntime.getSummaryByMaterial === "function"
    ) {
      return AHS.KnowledgeSummaryRuntime.getSummaryByMaterial(materialId);
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
