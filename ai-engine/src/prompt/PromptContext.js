/* ai-engine/src/prompt/PromptContext.js — EO-AI-001 · Prompt Manager Foundation
   Context Interface only — a plain data holder for the five reserved
   fields a template will read from. Never touches any Runtime; callers
   are responsible for populating values before handing the context to
   a template. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var RESERVED_FIELDS = [
    "material",
    "history",
    "profile",
    "difficulty",
    "subject"
  ];

  function PromptContext(values) {
    var source = values || {};
    RESERVED_FIELDS.forEach(function (field) {
      this[field] = Object.prototype.hasOwnProperty.call(source, field)
        ? source[field]
        : null;
    }, this);
  }

  PromptContext.RESERVED_FIELDS = Object.freeze(RESERVED_FIELDS.slice());

  PromptContext.prototype.get = function (field) {
    return this[field];
  };

  PromptContext.prototype.set = function (field, value) {
    if (RESERVED_FIELDS.indexOf(field) === -1) {
      throw new AHS.AIEngine.AIEngineError("Unknown PromptContext field: " + field);
    }
    this[field] = value;
  };

  AHS.AIEngine.PromptContext = PromptContext;
})();
