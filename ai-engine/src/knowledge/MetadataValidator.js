/* ai-engine/src/knowledge/MetadataValidator.js — EO-AI-003 · Knowledge Engine Foundation
   Structural validation only: is this a plain object, and does it use
   only the nine reserved metadata keys? No semantic rules about what
   a valid "subject" or "difficulty" value looks like. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function MetadataValidator() {}

  MetadataValidator.prototype.validate = function (metadataObject) {
    var errors = [];

    if (!AHS.AIEngine.Utilities.isPlainObject(metadataObject)) {
      errors.push("Metadata must be a plain object");
      return { valid: false, errors: errors };
    }

    var reserved = AHS.AIEngine.Metadata.FIELDS;
    Object.keys(metadataObject).forEach(function (key) {
      if (reserved.indexOf(key) === -1) {
        errors.push("Unknown metadata field: " + key);
      }
    });

    return { valid: errors.length === 0, errors: errors };
  };

  MetadataValidator.prototype.validateOrThrow = function (metadataObject) {
    var result = this.validate(metadataObject);
    if (!result.valid) {
      throw new AHS.AIEngine.ValidationError(
        "Invalid metadata: " + result.errors.join("; ")
      );
    }
    return true;
  };

  AHS.AIEngine.MetadataValidator = MetadataValidator;
})();
