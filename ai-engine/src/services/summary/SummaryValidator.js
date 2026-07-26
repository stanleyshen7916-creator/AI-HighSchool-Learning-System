/* ai-engine/src/services/summary/SummaryValidator.js — EO-AI-005 · AI Summary Engine Foundation
   Validates a Summary Model: required fields, empty values, duplicate
   keywords, and — by delegating to the existing, LOCKED
   AHS.AIEngine.MetadataValidator (EO-AI-003/EO-AI-004) — invalid
   metadata. No new metadata-validation logic is duplicated here. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var REQUIRED_FIELDS = ["subject", "metadata"];

  function SummaryValidator() {
    this._metadataValidator = new AHS.AIEngine.MetadataValidator();
  }

  SummaryValidator.prototype.validate = function (model) {
    var errors = [];

    if (!AHS.AIEngine.Utilities.isPlainObject(model)) {
      errors.push("Summary must be a plain object");
      return { valid: false, errors: errors };
    }

    REQUIRED_FIELDS.forEach(function (field) {
      var value = model[field];
      if (value === undefined || value === null || value === "") {
        errors.push("Missing required field: " + field);
      }
    });

    if (model.keywords !== undefined && model.keywords !== null) {
      if (!Array.isArray(model.keywords)) {
        errors.push("Invalid type for field keywords: expected array");
      } else {
        var seen = {};
        model.keywords.forEach(function (keyword) {
          if (Object.prototype.hasOwnProperty.call(seen, keyword)) {
            errors.push("Duplicate keyword: " + keyword);
          }
          seen[keyword] = true;
        });
      }
    }

    if (model.metadata !== undefined && model.metadata !== null) {
      var metadataResult = this._metadataValidator.validate(model.metadata);
      if (!metadataResult.valid) {
        metadataResult.errors.forEach(function (err) {
          errors.push("Invalid metadata: " + err);
        });
      }
    }

    return { valid: errors.length === 0, errors: errors };
  };

  SummaryValidator.prototype.validateOrThrow = function (model) {
    var result = this.validate(model);
    if (!result.valid) {
      throw new AHS.AIEngine.ValidationError("Invalid summary: " + result.errors.join("; "));
    }
    return true;
  };

  AHS.AIEngine.SummaryValidator = SummaryValidator;
})();
