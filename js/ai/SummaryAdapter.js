/* js/ai/SummaryAdapter.js — EO-AI-007 · AI Summary UI Integration (LOCK, revised)
   Material -> SummaryService -> SummaryPipeline -> SummaryRuntime, for
   future Runtime use. No UI, no DOM — this file never calls
   AHS.UI/document, never touches MaterialPreview.js or
   MaterialSummaryCard.js, and is not wired into any page's <script>
   order yet.

   Only talks to AHS.AIEngine.SummaryService — never touches
   AHS.AIEngine.SummaryRuntime or SummaryPipeline directly, per spec. */
window.AHS = window.AHS || {};

AHS.SummaryAdapter = (function () {
  "use strict";

  function generate(materialId) {
    return AHS.AIEngine.SummaryService.generate(materialId);
  }

  function generateFromMaterial(material) {
    return AHS.AIEngine.SummaryService.generateFromMaterial(material);
  }

  function get(materialId) {
    return AHS.AIEngine.SummaryService.get(materialId);
  }

  return {
    generate: generate,
    generateFromMaterial: generateFromMaterial,
    get: get
  };
})();
