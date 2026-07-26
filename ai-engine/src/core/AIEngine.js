/* ai-engine/src/core/AIEngine.js — EO-MIG-002 · AI Engine Foundation
   The single entry point every AI feature must go through
   (Platform -> AI Engine -> Provider -> LLM). Foundation only: a
   provider/service registry with no providers or services registered
   yet, and no LLM call anywhere in this file. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function AIEngine() {
    this._providers = {};
    this._services = {};
  }

  AIEngine.prototype.registerProvider = function (provider) {
    if (!provider || !provider.id) {
      throw new AHS.AIEngine.AIEngineError(
        "registerProvider requires a provider with an id"
      );
    }
    this._providers[provider.id] = provider;
  };

  AIEngine.prototype.getProvider = function (id) {
    var provider = this._providers[id];
    if (!provider) {
      throw new AHS.AIEngine.ProviderNotRegisteredError(id);
    }
    return provider;
  };

  AIEngine.prototype.registerService = function (service) {
    if (!service || !service.id) {
      throw new AHS.AIEngine.AIEngineError(
        "registerService requires a service with an id"
      );
    }
    this._services[service.id] = service;
  };

  AIEngine.prototype.getService = function (id) {
    var service = this._services[id];
    if (!service) {
      throw new AHS.AIEngine.ServiceNotImplementedError(id);
    }
    return service;
  };

  AHS.AIEngine.AIEngine = AIEngine;
})();
