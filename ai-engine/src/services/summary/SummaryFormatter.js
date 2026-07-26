/* ai-engine/src/services/summary/SummaryFormatter.js — EO-AI-005 · AI Summary Engine Foundation
   Converts a Summary Model into a standard output shape: a JSON string
   or a plain (unfrozen) Runtime Object. No HTML generation of any kind. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function SummaryFormatter() {}

  SummaryFormatter.prototype.toRuntimeObject = function (model) {
    if (!AHS.AIEngine.Utilities.isPlainObject(model)) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryFormatter.toRuntimeObject requires a Summary Model"
      );
    }
    var copy = {};
    AHS.AIEngine.SummaryBuilder.FIELDS.forEach(function (field) {
      copy[field] = model[field] !== undefined ? model[field] : null;
    });
    return copy;
  };

  SummaryFormatter.prototype.toJSON = function (model) {
    return JSON.stringify(this.toRuntimeObject(model));
  };

  AHS.AIEngine.SummaryFormatter = SummaryFormatter;
})();
