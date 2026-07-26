/* ai-engine/src/prompt/PromptTemplate.js — EO-AI-001 · Prompt Manager Foundation
   Prompt Template Interface only. No formal prompt is created here —
   concrete templates (a future EO) implement render() with real
   content against a real PromptContext. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function PromptTemplate(id) {
    if (!id) {
      throw new AHS.AIEngine.AIEngineError("PromptTemplate requires an id");
    }
    this.id = id;
  }

  PromptTemplate.prototype.render = function () {
    throw new AHS.AIEngine.AIEngineError(
      "PromptTemplate.render() is an interface method — implement in a subclass"
    );
  };

  AHS.AIEngine.PromptTemplate = PromptTemplate;
})();
