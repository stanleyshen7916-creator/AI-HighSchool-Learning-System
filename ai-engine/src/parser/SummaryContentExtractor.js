/* ai-engine/src/parser/SummaryContentExtractor.js — EO-AI-009 · AI Summary Content Extraction Foundation
   Rule-based (regex/heuristic) extraction of Core Concepts / Keywords /
   Definitions / Formulas / Important Points directly from a material's
   raw text — line by line, verbatim. No LLM, no NLP model, no
   fabrication: every returned item's `text` is copied unmodified from
   the source content; classification is a fixed set of pattern checks,
   not generation.

   Each item is { text, confidence, sourceRange: { lineStart, lineEnd } }
   — confidence is a fixed score per matched rule (not a model output),
   sourceRange is the real 0-based line index the text came from (for
   future Trace use), honestly precise since this reads the raw text
   directly rather than an already-built graph. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  /* A line is a formula if it has an "=" (or full-width "＝") followed
     somewhere by a digit, or contains a common math/superscript symbol. */
  var FORMULA_PATTERN = /[=＝][^=＝]*[0-9]|[²³√±×÷∑∫≤≥≈]/;

  /* A line is a definition if it reads "term：explanation" / "term是/為explanation". */
  var DEFINITION_PATTERN = /^(.{1,20}?)(：|:|是|為|定義為)(.+)$/;

  var SENTENCE_END = /[。！？.!?]\s*$/;
  var KEYWORD_MAX_LENGTH = 6;
  var POINT_MIN_LENGTH = 12;

  function SummaryContentExtractor() {}

  function makeItem(text, confidence, lineIndex) {
    return {
      text: text,
      confidence: confidence,
      sourceRange: { lineStart: lineIndex, lineEnd: lineIndex }
    };
  }

  SummaryContentExtractor.prototype.extract = function (content) {
    if (typeof content !== "string") {
      throw new AHS.AIEngine.ValidationError(
        "SummaryContentExtractor.extract requires a content string"
      );
    }

    var result = {
      coreConcepts: [],
      keywords: [],
      definitions: [],
      formulas: [],
      importantPoints: []
    };

    content
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .forEach(function (line, index) {
        if (!line) { return; }

        if (FORMULA_PATTERN.test(line)) {
          result.formulas.push(makeItem(line, 0.9, index));
          return;
        }
        if (DEFINITION_PATTERN.test(line)) {
          result.definitions.push(makeItem(line, 0.85, index));
          return;
        }
        if (SENTENCE_END.test(line) && line.length >= POINT_MIN_LENGTH) {
          result.importantPoints.push(makeItem(line, 0.7, index));
          return;
        }
        if (line.length <= KEYWORD_MAX_LENGTH) {
          result.keywords.push(makeItem(line, 0.6, index));
          return;
        }
        result.coreConcepts.push(makeItem(line, 0.6, index));
      });

    return AHS.AIEngine.Utilities.freeze(result);
  };

  AHS.AIEngine.SummaryContentExtractor = SummaryContentExtractor;
})();
