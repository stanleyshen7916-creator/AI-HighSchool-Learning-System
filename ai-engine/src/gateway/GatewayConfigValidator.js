/* ai-engine/src/gateway/GatewayConfigValidator.js — Sprint AI-100 · AI Platform Foundation
   Structural validation for GatewayConfig: known keys only, string-or-
   null type check. Mirrors ai-engine/src/knowledge/MetadataValidator.js's
   exact style ({valid, errors} / validateOrThrow).

   The "Unknown config field" check below is also this Sprint's
   concrete, testable guarantee for "No frontend API keys": any object
   containing an `apiKey`/`secret`/`token`/`credential` field fails
   validation (those names are not in GatewayConfig.FIELDS), on top of
   GatewayConfig's own constructor already ignoring any field not in
   its fixed FIELDS list. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function GatewayConfigValidator() {}

  GatewayConfigValidator.prototype.validate = function (configObject) {
    var errors = [];

    if (!AHS.AIEngine.Utilities.isPlainObject(configObject)) {
      errors.push("GatewayConfig must be a plain object");
      return { valid: false, errors: errors };
    }

    var reserved = AHS.AIEngine.GatewayConfig.FIELDS;
    Object.keys(configObject).forEach(function (key) {
      if (reserved.indexOf(key) === -1) {
        errors.push("Unknown gateway config field: " + key);
      }
    });

    reserved.forEach(function (field) {
      var value = configObject[field];
      if (value !== undefined && value !== null && typeof value !== "string") {
        errors.push("Invalid type for field " + field + ": expected string");
      }
    });

    return { valid: errors.length === 0, errors: errors };
  };

  GatewayConfigValidator.prototype.validateOrThrow = function (configObject) {
    var result = this.validate(configObject);
    if (!result.valid) {
      throw new AHS.AIEngine.ValidationError(
        "Invalid gateway config: " + result.errors.join("; ")
      );
    }
    return true;
  };

  AHS.AIEngine.GatewayConfigValidator = GatewayConfigValidator;
})();
