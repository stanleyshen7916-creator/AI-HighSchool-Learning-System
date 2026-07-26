/* ai-engine/src/providers/ProviderManager.js — EO-AI-002 · AI Core Foundation
   Facade combining ProviderRegistry (storage/default) and
   ProviderFactory (construction) — this is what AIEngine composes.
   No LLM connection, no business logic. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function ProviderManager(registry, factory) {
    this._registry = registry || new AHS.AIEngine.ProviderRegistry();
    this._factory = factory || new AHS.AIEngine.ProviderFactory();
  }

  ProviderManager.prototype.register = function (provider) {
    this._registry.register(provider);
  };

  ProviderManager.prototype.unregister = function (id) {
    this._registry.unregister(id);
  };

  ProviderManager.prototype.get = function (id) {
    return this._registry.get(id);
  };

  ProviderManager.prototype.has = function (id) {
    return this._registry.has(id);
  };

  ProviderManager.prototype.list = function () {
    return this._registry.list();
  };

  ProviderManager.prototype.setDefault = function (id) {
    this._registry.setDefault(id);
  };

  ProviderManager.prototype.getDefault = function () {
    return this._registry.getDefault();
  };

  ProviderManager.prototype.registerConstructor = function (id, Ctor) {
    this._factory.registerConstructor(id, Ctor);
  };

  ProviderManager.prototype.create = function (id, options) {
    return this._factory.create(id, options);
  };

  ProviderManager.prototype.createAndRegister = function (id, options) {
    var provider = this.create(id, options);
    this.register(provider);
    return provider;
  };

  AHS.AIEngine.ProviderManager = ProviderManager;
})();
