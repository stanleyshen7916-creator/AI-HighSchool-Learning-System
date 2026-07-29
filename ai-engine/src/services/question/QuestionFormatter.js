/* ai-engine/src/services/question/QuestionFormatter.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/services/summary/SummaryFormatter.js (EO-AI-005).
   Converts a Question Set Model into a standard output shape: a JSON
   string or a plain (unfrozen) Runtime Object. No HTML generation of
   any kind. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function QuestionFormatter() {}

  QuestionFormatter.prototype.toRuntimeObject = function (model) {
    if (!AHS.AIEngine.Utilities.isPlainObject(model)) {
      throw new AHS.AIEngine.ValidationError(
        "QuestionFormatter.toRuntimeObject requires a Question Set Model"
      );
    }
    var copy = {};
    AHS.AIEngine.QuestionBuilder.FIELDS.forEach(function (field) {
      copy[field] = model[field] !== undefined ? model[field] : null;
    });
    return copy;
  };

  QuestionFormatter.prototype.toJSON = function (model) {
    return JSON.stringify(this.toRuntimeObject(model));
  };

  AHS.AIEngine.QuestionFormatter = QuestionFormatter;
})();
