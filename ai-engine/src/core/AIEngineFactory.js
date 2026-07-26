/* ai-engine/src/core/AIEngineFactory.js — EO-MIG-002 · AI Engine Foundation
   Single-instance access to AHS.AIEngine.AIEngine. No provider or
   service is created or registered here — that is future EO scope. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var instance = null;

  var AIEngineFactory = {
    getInstance: function () {
      if (!instance) {
        instance = new AHS.AIEngine.AIEngine();
      }
      return instance;
    },
    reset: function () {
      instance = null;
    }
  };

  AHS.AIEngine.AIEngineFactory = AIEngineFactory;
})();
