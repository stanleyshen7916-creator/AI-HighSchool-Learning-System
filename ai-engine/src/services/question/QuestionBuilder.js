/* ai-engine/src/services/question/QuestionBuilder.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/services/summary/SummaryBuilder.js (EO-AI-005).
   Builds a structured Question Set Model from QuestionExtractor's
   structural output only — no AI/rule-based question generation here.
   `questions` is an honest empty-array stub (matching this codebase's
   established "no fabricated content" policy — the same one
   SummaryBuilder's concepts/definitions/formulas/examples already
   follow, and the same one AHS.QuestionGenerationRuntime's own "no
   invented distractors, ever" rule follows) until a future EO adds
   real rule-based question composition to this pipeline. `keywords` is
   a structural pass-through of the material's existing tags — not a
   generated result. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var FIELDS = [
    "title", "subject", "grade", "chapter", "section",
    "keywords", "questions", "difficulty", "metadata"
  ];

  function QuestionBuilder() {}

  QuestionBuilder.FIELDS = Object.freeze(FIELDS.slice());

  QuestionBuilder.prototype.build = function (extracted) {
    if (!AHS.AIEngine.Utilities.isPlainObject(extracted)) {
      throw new AHS.AIEngine.ValidationError(
        "QuestionBuilder.build requires a plain object (see QuestionExtractor.extract)"
      );
    }
    var metadata = extracted.metadata || null;
    var model = {
      title: (metadata && metadata.title) || null,
      subject: (metadata && metadata.subject) || null,
      grade: (metadata && metadata.grade) || null,
      chapter: extracted.chapter || null,
      section: extracted.section || null,
      keywords: Array.isArray(extracted.tags) ? extracted.tags.slice() : [],
      questions: [],
      difficulty: (metadata && metadata.difficulty) || null,
      metadata: metadata
    };
    return AHS.AIEngine.Utilities.freeze(model);
  };

  AHS.AIEngine.QuestionBuilder = QuestionBuilder;
})();
