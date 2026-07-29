/* js/ai/QuestionAdapter.js — Sprint AI-101 · Question Production Pipeline
   Mirrors js/ai/SummaryAdapter.js (EO-AI-007/EO-AI-008/EO-AI-011).
   Material -> QuestionService -> QuestionPipeline -> QuestionRuntime,
   for future Runtime use. No UI, no DOM — this file never calls
   AHS.UI/document, never touches QuestionCenter/QuizCenter/
   MaterialQuestionCard.js, and is not wired into any page's <script>
   order yet — same "built, not wired" status as js/ai/SummaryAdapter.js
   itself and the rest of ai-engine/.

   Only talks to AHS.AIEngine.QuestionService / AHS.AIEngine.
   QuestionProvider — never touches AHS.AIEngine.QuestionRuntime or
   QuestionPipeline directly, per the same spec SummaryAdapter follows. */
window.AHS = window.AHS || {};

AHS.QuestionAdapter = (function () {
  "use strict";

  function generate(materialId) {
    return AHS.AIEngine.QuestionService.generate(materialId);
  }

  function generateFromMaterial(material) {
    return AHS.AIEngine.QuestionService.generateFromMaterial(material);
  }

  function get(materialId) {
    return AHS.AIEngine.QuestionService.get(materialId);
  }

  /* Compatibility bridge — see QuestionService.getWithFallback for the
     read-only fallback-to-legacy semantics. */
  function getWithFallback(materialId) {
    return AHS.AIEngine.QuestionService.getWithFallback(materialId);
  }

  /* Mode routing via QuestionProvider. */
  function setMode(mode) {
    return AHS.AIEngine.QuestionProvider.setMode(mode);
  }

  function getMode() {
    return AHS.AIEngine.QuestionProvider.getMode();
  }

  function getQuestions(materialId) {
    return AHS.AIEngine.QuestionProvider.getQuestions(materialId);
  }

  /* Explicit Generate API passthrough. */
  function generateQuestions(materialId) {
    return AHS.AIEngine.QuestionProvider.generateQuestions(materialId);
  }

  /* Sprint AI-101C · Frontend AI Integration (Scope item 2: "Connect
     QuestionAdapter to AIGateway"). Mirrors SummaryAdapter.
     generateViaGateway() exactly, including its reasoning for staying
     presentation-only rather than writing into AHS.AIEngine.
     QuestionRuntime (also privately owned inside QuestionService.js's
     closure, no public accessor). options is passed straight through to
     AHS.GatewayIntegration.call() — currently only { difficulty } is a
     recognized field, per AIGatewayRestApiSpecification.md §3.
     Returns a Promise<{ok:true, data} | {ok:false, code, message}> —
     never rejects. */
  function generateViaGateway(materialId, options) {
    return AHS.GatewayIntegration.call("question", materialId, options);
  }

  return {
    generate: generate,
    generateFromMaterial: generateFromMaterial,
    get: get,
    getWithFallback: getWithFallback,
    setMode: setMode,
    getMode: getMode,
    getQuestions: getQuestions,
    generateQuestions: generateQuestions,
    generateViaGateway: generateViaGateway
  };
})();
