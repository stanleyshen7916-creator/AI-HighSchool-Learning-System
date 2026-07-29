/* ai-engine/src/runtime/QuestionHistory.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/runtime/SummaryHistory.js (EO-AI-006).
   Records when a Question Set Model was generated for a material.
   Follows the same "starts empty, grows at runtime, stores only"
   pattern the LOCKED AHS.HistoryRuntime itself documents. Does not
   call AHS.HistoryRuntime.record() directly — that method's fixed
   exam-result shape is consumed by StatisticsRuntime and would be
   corrupted by a Question Set payload, the same reasoning
   SummaryHistory.js already documents for the identical situation. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function QuestionHistory() {
    this._items = [];
  }

  QuestionHistory.prototype.record = function (questionSet) {
    var materialId = questionSet && questionSet.metadata && questionSet.metadata.materialId;
    if (!materialId) {
      throw new AHS.AIEngine.ValidationError(
        "QuestionHistory.record requires a Question Set Model with metadata.materialId"
      );
    }
    var entry = {
      materialId: materialId,
      generatedAt: new Date().toISOString(),
      question: questionSet
    };
    this._items.push(entry);
    return entry;
  };

  QuestionHistory.prototype.latest = function (materialId) {
    for (var i = this._items.length - 1; i >= 0; i--) {
      if (this._items[i].materialId === materialId) {
        return this._items[i];
      }
    }
    return null;
  };

  QuestionHistory.prototype.list = function () {
    return this._items.slice();
  };

  AHS.AIEngine.QuestionHistory = QuestionHistory;
})();
