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

  /* Sprint AI-101C · Frontend AI Integration (Scope item 1: "Connect
     SummaryAdapter to AIGateway"). A THIRD, independent route —
     additive, does not change generate/generateFromMaterial/get/
     getWithFallback/setMode/getMode/getSummary/generateSummary above in
     any way, same Extension Only discipline as every prior addition to
     this file. Delegates the whole request lifecycle (configure, build
     payload, call, validate, normalize errors) to
     AHS.GatewayIntegration and returns its result as-is — presentation
     only, deliberately NOT written into AHS.AIEngine.SummaryRuntime:
     that Runtime's one instance is privately owned inside
     SummaryService.js's closure with no public accessor, and adding one
     would mean modifying that already-shipped Foundation file (Scope
     item 7: "Preserve all existing Runtime APIs" / Constraint: "Do not
     modify MVP architecture"). The caller (AHS.AIGatewayPanel) holds
     the returned data in its own local render state instead — no new
     Runtime, no Runtime API change, zero coupling to any existing
     store.
     Returns a Promise<{ok:true, data} | {ok:false, code, message}> —
     never rejects, so UI code never needs a try/catch. */
  function generateViaGateway(materialId) {
    return AHS.GatewayIntegration.call("summary", materialId);
  }

  return {
    generate: generate,
    generateFromMaterial: generateFromMaterial,
    get: get,
    getWithFallback: getWithFallback,
    setMode: setMode,
    getMode: getMode,
    getSummary: getSummary,
    generateSummary: generateSummary,
    generateViaGateway: generateViaGateway
  };
})();
