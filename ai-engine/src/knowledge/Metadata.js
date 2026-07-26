/* ai-engine/src/knowledge/Metadata.js — EO-AI-003 · Knowledge Engine Foundation
   EO-AI-004 · Knowledge Runtime Integration (Metadata Extension)
   Plain data holder for the reserved metadata fields. No business
   logic, no Runtime access.

   EO-AI-004 adds six fields (id/materialId/semester/publisher/
   createdAt/updatedAt) on top of the original nine — all existing
   fields and behavior are unchanged. `studyScope` is reserved (the
   field exists and defaults to null like every other field) but no
   Study Scope logic is implemented anywhere in this codebase. */
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
    "version",
    /* EO-AI-004 additions */
    "id",
    "materialId",
    "semester",
    "publisher",
    "createdAt",
    "updatedAt",
    /* EO-AI-004: reserved for a future EO, no logic attached */
    "studyScope"
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
