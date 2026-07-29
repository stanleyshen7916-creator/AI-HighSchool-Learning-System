/* ai-engine/src/schema/SchemaValidator.js — Sprint AI-100 · AI Platform Foundation
   Dependency-free validator for the JSON Schema (draft-07) vocabulary
   subset actually used by SummarySchema.js/QuestionSchema.js/
   ErrorSchema.js: `type` (single or array, incl. "null"), `required`,
   `properties` (object, recursive), `items` (array, recursive),
   `enum`, `minItems`/`maxItems`. Not a full JSON Schema implementation
   — deliberately scoped to what these three schemas need, matching
   this codebase's established "no external套件" rule (see every
   EO-AI-005-style QA Summary) rather than pulling in a library like
   ajv. Same {valid, errors} / validateOrThrow return contract as
   MetadataValidator.js/QuestionValidator.js. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function typeOf(value) {
    if (value === null) { return "null"; }
    if (Array.isArray(value)) { return "array"; }
    return typeof value;
  }

  function typeMatches(schema, value) {
    if (!schema.type) { return true; }
    var allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    return allowed.indexOf(typeOf(value)) !== -1;
  }

  function SchemaValidator() {}

  /* Returns a fresh errors array; walk() appends onto it via closure
     so nested object/array recursion shares one error list. */
  SchemaValidator.prototype.validate = function (schema, data) {
    if (!AHS.AIEngine.Utilities.isPlainObject(schema)) {
      return { valid: false, errors: ["Schema must be a plain object"] };
    }
    var errors = [];
    walk(schema, data, "$", errors);
    return { valid: errors.length === 0, errors: errors };
  };

  function walk(schema, data, pointer, errors) {
    if (!typeMatches(schema, data)) {
      var allowed = Array.isArray(schema.type) ? schema.type.join("|") : schema.type;
      errors.push(pointer + ": expected type " + allowed + ", got " + typeOf(data));
      return;
    }

    if (schema.enum && data !== undefined && data !== null) {
      if (schema.enum.indexOf(data) === -1) {
        errors.push(pointer + ": value not in enum [" + schema.enum.join(", ") + "]");
      }
    }

    if (typeOf(data) === "object" && schema.properties) {
      if (schema.required) {
        schema.required.forEach(function (field) {
          if (data[field] === undefined || data[field] === null) {
            errors.push(pointer + "." + field + ": missing required field");
          }
        });
      }
      Object.keys(schema.properties).forEach(function (field) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
          walk(schema.properties[field], data[field], pointer + "." + field, errors);
        }
      });
    }

    if (typeOf(data) === "array") {
      if (typeof schema.minItems === "number" && data.length < schema.minItems) {
        errors.push(pointer + ": expected at least " + schema.minItems + " items, got " + data.length);
      }
      if (typeof schema.maxItems === "number" && data.length > schema.maxItems) {
        errors.push(pointer + ": expected at most " + schema.maxItems + " items, got " + data.length);
      }
      if (schema.items) {
        data.forEach(function (item, index) {
          walk(schema.items, item, pointer + "[" + index + "]", errors);
        });
      }
    }
  }

  SchemaValidator.prototype.validateOrThrow = function (schema, data) {
    var result = this.validate(schema, data);
    if (!result.valid) {
      throw new AHS.AIEngine.ValidationError("Schema validation failed: " + result.errors.join("; "));
    }
    return true;
  };

  AHS.AIEngine.SchemaValidator = SchemaValidator;
})();
