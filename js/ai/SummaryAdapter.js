/* js/ai/SummaryAdapter.js — EO-AI-007 · AI Summary UI Integration (LOCK, revised)
   EO-AI-008 · AI Summary Replace Legacy Integration (LOCK, revised to Compatibility Layer)
   EO-AI-011 · AI Summary Dual-run Integration (SummaryProvider routing, additive)
   Material -> SummaryService -> SummaryPipeline -> SummaryRuntime, for
   future Runtime use. No UI, no DOM — this file never calls
   AHS.UI/document, never touches MaterialPreview.js or
   MaterialSummaryCard.js, and is not wired into any page's <script>
   order yet (not a Replace Legacy — that is a separate, future
   "AI Summary Migration" EO).

   Only talks to AHS.AIEngine.SummaryService — never touches
   AHS.AIEngine.SummaryRuntime or SummaryPipeline directly, per spec.

   EO-AI-011 adds a second, independent route through
   AHS.AIEngine.SummaryProvider (setMode/getMode/getSummary) for
   Dual-run mode selection. This does not change generate/
   generateFromMaterial/get/getWithFallback above in any way — same
   Extension Only discipline as every EO before it.

   EO-AI-012C adds generateSummary — a passthrough to
   SummaryProvider.generateSummary(), the explicit Generate API added
   by the Migration Bridge Hotfix. getSummary() above remains Read
   Only in every mode; this method is the only one that actually runs
   the New pipeline. */
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

  /* EO-AI-008 compatibility bridge — see SummaryService.getWithFallback
     for the read-only fallback-to-legacy semantics. */
  function getWithFallback(materialId) {
    return AHS.AIEngine.SummaryService.getWithFallback(materialId);
  }

  /* EO-AI-011 — Dual-run mode routing via SummaryProvider. */
  function setMode(mode) {
    return AHS.AIEngine.SummaryProvider.setMode(mode);
  }

  function getMode() {
    return AHS.AIEngine.SummaryProvider.getMode();
  }

  function getSummary(materialId) {
    return AHS.AIEngine.SummaryProvider.getSummary(materialId);
  }

  /* EO-AI-012C — explicit Generate API passthrough. */
  function generateSummary(materialId) {
    return AHS.AIEngine.SummaryProvider.generateSummary(materialId);
  }

  return {
    generate: generate,
    generateFromMaterial: generateFromMaterial,
    get: get,
    getWithFallback: getWithFallback,
    setMode: setMode,
    getMode: getMode,
    getSummary: getSummary,
    generateSummary: generateSummary
  };
})();
