/* ai-engine/src/service/SummaryService.js — EO-AI-007 · AI Summary UI Integration (LOCK, revised)
   AI Runtime Service Layer only — no UI, no DOM, does not touch
   MaterialPreview.js or MaterialSummaryCard.js in any way. Material
   Detail's existing AI 重點整理 feature (MaterialPreview ->
   MaterialSummaryCard -> AITutorService -> KnowledgeSummaryRuntime) is
   the Baseline UI and is untouched by this file.

   Owns one SummaryRuntime + one SummaryPipeline for the page's
   lifetime (singleton, same pattern as the Platform's AHS.* runtimes)
   so repeated calls share the same cache — generate() only re-runs
   the pipeline when SummaryPipeline/SummaryRuntime decide to; this
   layer adds no caching logic of its own. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.SummaryService = (function () {
  "use strict";

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

  return {
    generate: generate,
    generateFromMaterial: generateFromMaterial,
    get: get
  };
})();
