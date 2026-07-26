/* ai-engine/src/core/AIService.js — EO-MIG-002 · AI Engine Foundation
   EO-AI-002 · AI Core Foundation (Dependency Injection)
   Service Interface only. No summary/question/review/explanation
   logic — each service slot (ai-engine/src/services/*) is implemented
   by its own future EO on top of this base.

   Dependency Injection: a concrete service subclass receives its
   Provider and Context through this constructor (not by reaching into
   globals), completing the AIEngine -> Provider -> Service -> Context
   chain. Neither dependency is required or interpreted here — this
   base class only stores what it is given. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function AIService(id, dependencies) {
    if (!id) {
      throw new AHS.AIEngine.AIEngineError("AIService requires an id");
    }
    this.id = id;
    dependencies = dependencies || {};
    this.provider = dependencies.provider || null;
    this.context = dependencies.context || null;
  }

  AIService.prototype.run = function () {
    throw new AHS.AIEngine.ServiceNotImplementedError(this.id);
  };

  AHS.AIEngine.AIService = AIService;
})();
