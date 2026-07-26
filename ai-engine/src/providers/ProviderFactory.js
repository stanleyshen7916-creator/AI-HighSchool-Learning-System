/* ai-engine/src/providers/ProviderFactory.js — EO-AI-002 · AI Core Foundation
   Registers Provider *constructors* by id and instantiates them on
   demand. No concrete provider exists yet, no LLM connection — a
   future EO registers a constructor (e.g. an OpenAIProvider class)
   here; this file has no knowledge of what that constructor does. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function ProviderFactory() {
    this._constructors = {};
  }

  ProviderFactory.prototype.registerConstructor = function (id, Ctor) {
    if (!id || typeof Ctor !== "function") {
      throw new AHS.AIEngine.RegistryError(
        "ProviderFactory.registerConstructor requires an id and a constructor function"
      );
    }
    this._constructors[id] = Ctor;
  };

  ProviderFactory.prototype.unregisterConstructor = function (id) {
    delete this._constructors[id];
  };

  ProviderFactory.prototype.hasConstructor = function (id) {
    return Object.prototype.hasOwnProperty.call(this._constructors, id);
  };

  ProviderFactory.prototype.create = function (id, options) {
    if (!this.hasConstructor(id)) {
      throw new AHS.AIEngine.ProviderNotRegisteredError(id);
    }
    var Ctor = this._constructors[id];
    return new Ctor(id, options);
  };

  AHS.AIEngine.ProviderFactory = ProviderFactory;
})();
