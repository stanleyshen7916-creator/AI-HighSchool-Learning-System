/* js/runtime/MetadataParser.js — Sprint AI-103 · Content Import Runtime
   Parses Metadata.json's raw text into the 11 fixed fields this Sprint
   specifies: Subject, Grade, Publisher, Version, Chapter, Unit,
   Difficulty, Tags, Author, CreatedTime, UpdatedTime. Pure parsing —
   never validates (that's ImportValidator.js's job) and never touches
   any Runtime. Defensive: never throws, missing/malformed input
   produces null-filled fields rather than an exception, matching this
   codebase's established "honest null over thrown error" convention
   for parser-layer modules (e.g. ai-engine's Metadata.js). */
window.AHS = window.AHS || {};
AHS.MetadataParser = (function () {
  "use strict";

  var FIELDS = [
    "subject", "grade", "publisher", "version", "chapter", "unit",
    "difficulty", "tags", "author", "createdTime", "updatedTime"
  ];

  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  /* parse(rawJsonText) -> { subject, grade, publisher, version, chapter,
     unit, difficulty, tags: [], author, createdTime, updatedTime }.
     Every field defaults to null (tags defaults to []) rather than
     being omitted, so downstream code can always read every key
     without an existence check — same pattern as ai-engine's
     Metadata.js constructor. */
  function parse(rawJsonText) {
    var source = {};
    if (typeof rawJsonText === "string") {
      try {
        var parsed = JSON.parse(rawJsonText);
        if (isPlainObject(parsed)) { source = parsed; }
      } catch (e) { /* honest empty metadata, never throws */ }
    } else if (isPlainObject(rawJsonText)) {
      source = rawJsonText;
    }

    var result = {};
    FIELDS.forEach(function (field) {
      result[field] = Object.prototype.hasOwnProperty.call(source, field) ? source[field] : null;
    });
    result.tags = Array.isArray(result.tags) ? result.tags.slice() : (result.tags ? [String(result.tags)] : []);
    return result;
  }

  return { parse: parse, FIELDS: FIELDS.slice() };
})();
