/* ai-engine/src/knowledge/MetadataValidator.js — EO-AI-003 · Knowledge Engine Foundation
   EO-AI-004 · Knowledge Runtime Integration (Validation Extension)
   EO-AI-012E · Summary Metadata Migration (title field)
   Structural validation: plain object, known keys (EO-AI-003), plus
   EO-AI-004's four checks — required field, empty value, duplicate
   (within tags), invalid type. No semantic rules about what a valid
   "subject" or "difficulty" value looks like beyond "it's a string".

   EO-AI-012E: `title` added to STRING_FIELDS (must be a string when
   present, same as every other structural field) but NOT to
   REQUIRED_FIELDS — it stays optional/null when the material has none. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var REQUIRED_FIELDS = ["id", "materialId", "subject"];
  var STRING_FIELDS = [
    "id", "materialId", "subject", "grade", "chapter", "section", "topic",
    "difficulty", "source", "version", "semester", "publisher",
    "createdAt", "updatedAt", "studyScope", "title"
  ];

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

    /* EO-AI-004: Required Field + Empty Value */
    REQUIRED_FIELDS.forEach(function (field) {
      var value = metadataObject[field];
      if (value === undefined || value === null || value === "") {
        errors.push("Missing required field: " + field);
      }
    });

    /* EO-AI-004: Invalid Type — string-shaped fields must be strings when present */
    STRING_FIELDS.forEach(function (field) {
      var value = metadataObject[field];
      if (value !== undefined && value !== null && typeof value !== "string") {
        errors.push("Invalid type for field " + field + ": expected string");
      }
    });

    /* EO-AI-004: Invalid Type + Duplicate — tags must be an array with no repeats */
    var tags = metadataObject.tags;
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        errors.push("Invalid type for field tags: expected array");
      } else {
        var seen = {};
        tags.forEach(function (tag) {
          if (Object.prototype.hasOwnProperty.call(seen, tag)) {
            errors.push("Duplicate tag: " + tag);
          }
          seen[tag] = true;
        });
      }
    }

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
