/* ai-engine/src/context/ContextBuilder.js — EO-AI-002 · AI Core Foundation
   Assembles a plain, frozen context object from explicitly-provided
   values for the five reserved types. No Runtime access, no business
   logic — this only shapes data the caller already has. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function ContextBuilder() {
    this._values = {};
  }

  ContextBuilder.prototype.set = function (type, value) {
    if (AHS.AIEngine.ContextManager.RESERVED_TYPES.indexOf(type) === -1) {
      throw new AHS.AIEngine.ContextError("Unknown context type: " + type);
    }
    this._values[type] = value;
    return this;
  };

  ContextBuilder.prototype.build = function () {
    var result = {};
    AHS.AIEngine.ContextManager.RESERVED_TYPES.forEach(function (type) {
      result[type] = Object.prototype.hasOwnProperty.call(this._values, type)
        ? this._values[type]
        : null;
    }, this);
    return AHS.AIEngine.Utilities.freeze(result);
  };

  AHS.AIEngine.ContextBuilder = ContextBuilder;
})();
