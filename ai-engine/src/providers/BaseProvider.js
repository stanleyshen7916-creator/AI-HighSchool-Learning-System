/* ai-engine/src/providers/BaseProvider.js — EO-MIG-002 · AI Engine Foundation
   Provider Interface only. No LLM connection, no OpenAI, no network
   call of any kind — concrete providers (a future EO) implement these
   methods against a real backend. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function BaseProvider(id) {
    if (!id) {
      throw new AHS.AIEngine.AIEngineError("BaseProvider requires an id");
    }
    this.id = id;
  }

  BaseProvider.prototype.complete = function () {
    throw new AHS.AIEngine.AIEngineError(
      "BaseProvider.complete() is an interface method — implement in a subclass"
    );
  };

  BaseProvider.prototype.isAvailable = function () {
    throw new AHS.AIEngine.AIEngineError(
      "BaseProvider.isAvailable() is an interface method — implement in a subclass"
    );
  };

  AHS.AIEngine.BaseProvider = BaseProvider;
})();
