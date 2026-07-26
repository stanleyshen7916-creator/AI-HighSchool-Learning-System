/* ai-engine/src/context/ContextValidator.js — EO-AI-002 · AI Core Foundation
   Structural validation only: is this a plain object, and does it use
   only the five reserved context keys? No semantic/business rules
   about what a valid "material" or "subject" value looks like. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function ContextValidator() {}

  ContextValidator.prototype.validate = function (contextObject) {
    var errors = [];

    if (!AHS.AIEngine.Utilities.isPlainObject(contextObject)) {
      errors.push("Context must be a plain object");
      return { valid: false, errors: errors };
    }

    var reserved = AHS.AIEngine.ContextManager.RESERVED_TYPES;
    Object.keys(contextObject).forEach(function (key) {
      if (reserved.indexOf(key) === -1) {
        errors.push("Unknown context key: " + key);
      }
    });

    return { valid: errors.length === 0, errors: errors };
  };

  ContextValidator.prototype.validateOrThrow = function (contextObject) {
    var result = this.validate(contextObject);
    if (!result.valid) {
      throw new AHS.AIEngine.ValidationError(
        "Invalid context: " + result.errors.join("; ")
      );
    }
    return true;
  };

  AHS.AIEngine.ContextValidator = ContextValidator;
})();
