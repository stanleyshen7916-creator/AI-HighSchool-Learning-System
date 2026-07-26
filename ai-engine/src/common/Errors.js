/* ai-engine/src/common/Errors.js — EO-MIG-002 · AI Engine Foundation
   EO-AI-002 · AI Core Foundation (unified Error Framework)
   Shared error types for the AI Engine layer. No provider/service
   logic — these are thrown by future services, not used here.

   Hierarchy:
     AIEngineError
       ProviderError            -> ProviderNotRegisteredError
       ServiceError              -> ServiceNotImplementedError
       ContextError
       RegistryError
       ValidationError

   ProviderNotRegisteredError and ServiceNotImplementedError existed
   before EO-AI-002 as direct AIEngineError subclasses; they now sit
   under ProviderError/ServiceError instead, with identical name,
   message and constructor signature — existing `instanceof
   AIEngineError` checks and thrown messages are unchanged. */
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

  function ProviderError(message) {
    AIEngineError.call(this, message);
    this.name = "ProviderError";
  }
  ProviderError.prototype = Object.create(AIEngineError.prototype);
  ProviderError.prototype.constructor = ProviderError;

  function ServiceError(message) {
    AIEngineError.call(this, message);
    this.name = "ServiceError";
  }
  ServiceError.prototype = Object.create(AIEngineError.prototype);
  ServiceError.prototype.constructor = ServiceError;

  function ContextError(message) {
    AIEngineError.call(this, message);
    this.name = "ContextError";
  }
  ContextError.prototype = Object.create(AIEngineError.prototype);
  ContextError.prototype.constructor = ContextError;

  function RegistryError(message) {
    AIEngineError.call(this, message);
    this.name = "RegistryError";
  }
  RegistryError.prototype = Object.create(AIEngineError.prototype);
  RegistryError.prototype.constructor = RegistryError;

  function ValidationError(message) {
    AIEngineError.call(this, message);
    this.name = "ValidationError";
  }
  ValidationError.prototype = Object.create(AIEngineError.prototype);
  ValidationError.prototype.constructor = ValidationError;

  function ProviderNotRegisteredError(providerId) {
    ProviderError.call(this, "Provider not registered: " + providerId);
    this.name = "ProviderNotRegisteredError";
    this.providerId = providerId;
  }
  ProviderNotRegisteredError.prototype = Object.create(ProviderError.prototype);
  ProviderNotRegisteredError.prototype.constructor = ProviderNotRegisteredError;

  function ServiceNotImplementedError(serviceId) {
    ServiceError.call(this, "Service not implemented: " + serviceId);
    this.name = "ServiceNotImplementedError";
    this.serviceId = serviceId;
  }
  ServiceNotImplementedError.prototype = Object.create(ServiceError.prototype);
  ServiceNotImplementedError.prototype.constructor = ServiceNotImplementedError;

  AHS.AIEngine.AIEngineError = AIEngineError;
  AHS.AIEngine.ProviderError = ProviderError;
  AHS.AIEngine.ServiceError = ServiceError;
  AHS.AIEngine.ContextError = ContextError;
  AHS.AIEngine.RegistryError = RegistryError;
  AHS.AIEngine.ValidationError = ValidationError;
  AHS.AIEngine.ProviderNotRegisteredError = ProviderNotRegisteredError;
  AHS.AIEngine.ServiceNotImplementedError = ServiceNotImplementedError;
})();
