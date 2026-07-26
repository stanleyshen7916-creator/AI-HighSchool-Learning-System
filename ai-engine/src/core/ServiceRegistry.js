/* ai-engine/src/core/ServiceRegistry.js — EO-AI-002 · AI Core Foundation
   Unified AI Service register/unregister/query. Same register/get/
   has/list contract AIEngine already exposed in EO-MIG-002 — this is
   the dedicated Registry AIEngine now composes instead of a bare
   object, so getService(id) for an unregistered id still throws
   ServiceNotImplementedError (unchanged message/behavior). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function ServiceRegistry() {
    this._services = {};
  }

  ServiceRegistry.prototype.register = function (service) {
    if (!service || !service.id) {
      throw new AHS.AIEngine.RegistryError(
        "ServiceRegistry.register requires a service with an id"
      );
    }
    this._services[service.id] = service;
  };

  ServiceRegistry.prototype.unregister = function (id) {
    delete this._services[id];
  };

  ServiceRegistry.prototype.get = function (id) {
    if (!this.has(id)) {
      throw new AHS.AIEngine.ServiceNotImplementedError(id);
    }
    return this._services[id];
  };

  ServiceRegistry.prototype.has = function (id) {
    return Object.prototype.hasOwnProperty.call(this._services, id);
  };

  ServiceRegistry.prototype.list = function () {
    return Object.keys(this._services);
  };

  AHS.AIEngine.ServiceRegistry = ServiceRegistry;
})();
