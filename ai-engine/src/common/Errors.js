/* ai-engine/src/common/Errors.js — EO-MIG-002 · AI Engine Foundation
   Shared error types for the AI Engine layer. No provider/service
   logic — these are thrown by future services, not used here. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function AIEngineError(message) {
    this.name = "AIEngineError";
    this.message = message;
    this.stack = new Error(message).stack;
  }
  AIEngineError.prototype = Object.create(Error.prototype);
  AIEngineError.prototype.constructor = AIEngineError;

  function ProviderNotRegisteredError(providerId) {
    AIEngineError.call(this, "Provider not registered: " + providerId);
    this.name = "ProviderNotRegisteredError";
    this.providerId = providerId;
  }
  ProviderNotRegisteredError.prototype = Object.create(AIEngineError.prototype);
  ProviderNotRegisteredError.prototype.constructor = ProviderNotRegisteredError;

  function ServiceNotImplementedError(serviceId) {
    AIEngineError.call(this, "Service not implemented: " + serviceId);
    this.name = "ServiceNotImplementedError";
    this.serviceId = serviceId;
  }
  ServiceNotImplementedError.prototype = Object.create(AIEngineError.prototype);
  ServiceNotImplementedError.prototype.constructor = ServiceNotImplementedError;

  AHS.AIEngine.AIEngineError = AIEngineError;
  AHS.AIEngine.ProviderNotRegisteredError = ProviderNotRegisteredError;
  AHS.AIEngine.ServiceNotImplementedError = ServiceNotImplementedError;
})();
