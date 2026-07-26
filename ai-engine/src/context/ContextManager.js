/* ai-engine/src/context/ContextManager.js — EO-AI-002 · AI Core Foundation
   Holds one context value per reserved type (material/user/history/
   subject/difficulty). Never touches any Runtime — callers set values
   explicitly; this is storage only, no business logic. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var RESERVED_TYPES = ["material", "user", "history", "subject", "difficulty"];

  function ContextManager() {
    this._contexts = {};
    RESERVED_TYPES.forEach(function (type) {
      this._contexts[type] = null;
    }, this);
  }

  ContextManager.RESERVED_TYPES = Object.freeze(RESERVED_TYPES.slice());

  ContextManager.prototype.has = function (type) {
    return RESERVED_TYPES.indexOf(type) !== -1;
  };

  ContextManager.prototype.set = function (type, value) {
    if (!this.has(type)) {
      throw new AHS.AIEngine.ContextError("Unknown context type: " + type);
    }
    this._contexts[type] = value;
  };

  ContextManager.prototype.get = function (type) {
    if (!this.has(type)) {
      throw new AHS.AIEngine.ContextError("Unknown context type: " + type);
    }
    return this._contexts[type];
  };

  ContextManager.prototype.list = function () {
    return RESERVED_TYPES.slice();
  };

  ContextManager.prototype.clear = function (type) {
    if (type === undefined) {
      RESERVED_TYPES.forEach(function (t) {
        this._contexts[t] = null;
      }, this);
      return;
    }
    this.set(type, null);
  };

  AHS.AIEngine.ContextManager = ContextManager;
})();
