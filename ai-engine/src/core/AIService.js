/* ai-engine/src/core/AIService.js — EO-MIG-002 · AI Engine Foundation
   Service Interface only. No summary/question/review/explanation
   logic — each service slot (ai-engine/src/services/*) is implemented
   by its own future EO on top of this base. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function AIService(id) {
    if (!id) {
      throw new AHS.AIEngine.AIEngineError("AIService requires an id");
    }
    this.id = id;
  }

  AIService.prototype.run = function () {
    throw new AHS.AIEngine.ServiceNotImplementedError(this.id);
  };

  AHS.AIEngine.AIService = AIService;
})();
