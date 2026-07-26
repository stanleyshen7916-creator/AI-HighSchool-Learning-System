/* ai-engine/src/providers/ProviderRegistry.js — EO-AI-002 · AI Core Foundation
   Provider register/unregister/query + default-provider tracking. No
   LLM connection — this only stores whatever BaseProvider instances a
   future EO registers. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function ProviderRegistry() {
    this._providers = {};
    this._defaultId = null;
  }

  ProviderRegistry.prototype.register = function (provider) {
    if (!provider || !provider.id) {
      throw new AHS.AIEngine.RegistryError(
        "ProviderRegistry.register requires a provider with an id"
      );
    }
    this._providers[provider.id] = provider;
  };

  ProviderRegistry.prototype.unregister = function (id) {
    delete this._providers[id];
    if (this._defaultId === id) {
      this._defaultId = null;
    }
  };

  ProviderRegistry.prototype.get = function (id) {
    if (!this.has(id)) {
      throw new AHS.AIEngine.ProviderNotRegisteredError(id);
    }
    return this._providers[id];
  };

  ProviderRegistry.prototype.has = function (id) {
    return Object.prototype.hasOwnProperty.call(this._providers, id);
  };

  ProviderRegistry.prototype.list = function () {
    return Object.keys(this._providers);
  };

  ProviderRegistry.prototype.setDefault = function (id) {
    if (!this.has(id)) {
      throw new AHS.AIEngine.ProviderNotRegisteredError(id);
    }
    this._defaultId = id;
  };

  ProviderRegistry.prototype.getDefault = function () {
    if (!this._defaultId) {
      throw new AHS.AIEngine.RegistryError("No default provider is set");
    }
    return this.get(this._defaultId);
  };

  AHS.AIEngine.ProviderRegistry = ProviderRegistry;
})();
