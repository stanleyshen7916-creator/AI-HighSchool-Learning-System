/* ai-engine/src/services/summary/SummaryBuilder.js — EO-AI-005 · AI Summary Engine Foundation
   Builds a structured Summary Model from SummaryExtractor's structural
   output only — no AI text generation. `concepts`/`definitions`/
   `formulas`/`examples`/`title` are honest empty/null stubs (matching
   this codebase's established "no fabricated content" policy, the
   same one js/parser/SummaryGenerator.js already follows) until a
   future, LLM-integrated EO can generate them for real. `keywords` is
   a structural pass-through of the material's existing tags — not a
   generated summary. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var FIELDS = [
    "title", "subject", "grade", "chapter", "section",
    "keywords", "concepts", "definitions", "formulas", "examples",
    "difficulty", "metadata"
  ];

  function SummaryBuilder() {}

  SummaryBuilder.FIELDS = Object.freeze(FIELDS.slice());

  SummaryBuilder.prototype.build = function (extracted) {
    if (!AHS.AIEngine.Utilities.isPlainObject(extracted)) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryBuilder.build requires a plain object (see SummaryExtractor.extract)"
      );
    }
    var metadata = extracted.metadata || null;
    var model = {
      title: null,
      subject: (metadata && metadata.subject) || null,
      grade: (metadata && metadata.grade) || null,
      chapter: extracted.chapter || null,
      section: extracted.section || null,
      keywords: Array.isArray(extracted.tags) ? extracted.tags.slice() : [],
      concepts: [],
      definitions: [],
      formulas: [],
      examples: [],
      difficulty: (metadata && metadata.difficulty) || null,
      metadata: metadata
    };
    return AHS.AIEngine.Utilities.freeze(model);
  };

  AHS.AIEngine.SummaryBuilder = SummaryBuilder;
})();
