/* ai-engine/src/knowledge/Metadata.js — EO-AI-003 · Knowledge Engine Foundation
   Plain data holder for the nine reserved metadata fields. No
   business logic, no Runtime access. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var FIELDS = [
    "subject",
    "grade",
    "chapter",
    "section",
    "topic",
    "difficulty",
    "source",
    "tags",
    "version"
  ];

  function Metadata(values) {
    var source = values || {};
    FIELDS.forEach(function (field) {
      this[field] = Object.prototype.hasOwnProperty.call(source, field)
        ? source[field]
        : null;
    }, this);
  }

  Metadata.FIELDS = Object.freeze(FIELDS.slice());

  Metadata.prototype.get = function (field) {
    return this[field];
  };

  Metadata.prototype.set = function (field, value) {
    if (FIELDS.indexOf(field) === -1) {
      throw new AHS.AIEngine.ValidationError("Unknown metadata field: " + field);
    }
    this[field] = value;
  };

  AHS.AIEngine.Metadata = Metadata;
})();
