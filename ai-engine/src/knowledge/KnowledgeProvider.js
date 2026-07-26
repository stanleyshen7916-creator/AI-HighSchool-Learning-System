/* ai-engine/src/knowledge/KnowledgeProvider.js — EO-AI-003 · Knowledge Engine Foundation
   Knowledge Provider Interface only — no external data source is
   connected here (no fetch/XHR, no file I/O). A future EO implements
   load()/unload()/refresh()/supports() against a real source. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function interfaceError(methodName) {
    return new AHS.AIEngine.AIEngineError(
      "KnowledgeProvider." + methodName + "() is an interface method — implement in a subclass"
    );
  }

  function KnowledgeProvider(id) {
    if (!id) {
      throw new AHS.AIEngine.AIEngineError("KnowledgeProvider requires an id");
    }
    this.id = id;
  }

  KnowledgeProvider.prototype.load = function () {
    throw interfaceError("load");
  };

  KnowledgeProvider.prototype.unload = function () {
    throw interfaceError("unload");
  };

  KnowledgeProvider.prototype.refresh = function () {
    throw interfaceError("refresh");
  };

  KnowledgeProvider.prototype.supports = function () {
    throw interfaceError("supports");
  };

  AHS.AIEngine.KnowledgeProvider = KnowledgeProvider;
})();
