/* ai-engine/src/core/AIEngine.js — EO-MIG-002 · AI Engine Foundation
   EO-AI-002 · AI Core Foundation (Dependency Injection + Lifecycle)
   EO-AI-003 · Knowledge Engine Foundation (Knowledge Layer integration)
   The single entry point every AI feature must go through
   (Platform -> AI Engine -> Provider -> Service -> Context). Foundation
   only: no provider, service, knowledge source, or LLM call is
   registered or made anywhere in this file.

   registerProvider/getProvider/registerService/getService keep the
   exact external behavior they had in EO-MIG-002 (same thrown error
   types and messages) — they are now thin wrappers delegating to the
   composed ProviderManager/ServiceRegistry instead of a bare object.
   `knowledge` is the AIEngine -> KnowledgeRegistry integration point
   added by EO-AI-003 (KnowledgeProvider/Loader/Index/Cache are
   available on AHS.AIEngine for a future EO to compose against it). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function AIEngine() {
    this._initialized = false;
    this.providers = new AHS.AIEngine.ProviderManager();
    this.services = new AHS.AIEngine.ServiceRegistry();
    this.contexts = new AHS.AIEngine.ContextManager();
    this.knowledge = new AHS.AIEngine.KnowledgeRegistry();
  }

  // Lifecycle

  AIEngine.prototype.initialize = function () {
    this._initialized = true;
    return this;
  };

  AIEngine.prototype.isInitialized = function () {
    return this._initialized;
  };

  AIEngine.prototype.dispose = function () {
    this.providers = new AHS.AIEngine.ProviderManager();
    this.services = new AHS.AIEngine.ServiceRegistry();
    this.contexts = new AHS.AIEngine.ContextManager();
    this.knowledge = new AHS.AIEngine.KnowledgeRegistry();
    this._initialized = false;
  };

  AIEngine.prototype.reset = function () {
    this.dispose();
    this.initialize();
  };

  AIEngine.prototype.version = function () {
    return AHS.AIEngine.VERSION;
  };

  // Provider (delegates to ProviderManager -> ProviderRegistry)

  AIEngine.prototype.registerProvider = function (provider) {
    this.providers.register(provider);
  };

  AIEngine.prototype.getProvider = function (id) {
    return this.providers.get(id);
  };

  // Service (delegates to ServiceRegistry)

  AIEngine.prototype.registerService = function (service) {
    this.services.register(service);
  };

  AIEngine.prototype.getService = function (id) {
    return this.services.get(id);
  };

  AHS.AIEngine.AIEngine = AIEngine;
})();
