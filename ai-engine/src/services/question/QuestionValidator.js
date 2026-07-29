/* ai-engine/src/services/question/QuestionValidator.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/services/summary/SummaryValidator.js (EO-AI-005).
   Validates a Question Set Model: required fields, invalid `questions`
   type, and — by delegating to the existing, LOCKED
   AHS.AIEngine.MetadataValidator (EO-AI-003/EO-AI-004) — invalid
   metadata. No new metadata-validation logic is duplicated here.
   (Summary's duplicate-keyword check has no meaningful Question
   equivalent — a `questions` array holds question objects, not
   scalars — so it is not mirrored; the array-type check plays the
   same defensive role.) */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var REQUIRED_FIELDS = ["subject", "metadata"];

  function QuestionValidator() {
    this._metadataValidator = new AHS.AIEngine.MetadataValidator();
  }

  QuestionValidator.prototype.validate = function (model) {
    var errors = [];

    if (!AHS.AIEngine.Utilities.isPlainObject(model)) {
      errors.push("Question set must be a plain object");
      return { valid: false, errors: errors };
    }

    REQUIRED_FIELDS.forEach(function (field) {
      var value = model[field];
      if (value === undefined || value === null || value === "") {
        errors.push("Missing required field: " + field);
      }
    });

    if (model.questions !== undefined && model.questions !== null) {
      if (!Array.isArray(model.questions)) {
        errors.push("Invalid type for field questions: expected array");
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

  QuestionValidator.prototype.validateOrThrow = function (model) {
    var result = this.validate(model);
    if (!result.valid) {
      throw new AHS.AIEngine.ValidationError("Invalid question set: " + result.errors.join("; "));
    }
    return true;
  };

  AHS.AIEngine.QuestionValidator = QuestionValidator;
})();
