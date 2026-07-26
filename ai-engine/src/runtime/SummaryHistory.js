/* ai-engine/src/runtime/SummaryHistory.js — EO-AI-006 · AI Summary Runtime Integration
   Records when a Summary Model was generated for a material. Follows
   the same "starts empty, grows at runtime, stores only" pattern the
   LOCKED AHS.HistoryRuntime itself documents — see
   docs/migration/EO_AI_006_REPORT.md "History Integration" for why
   this EO does not call AHS.HistoryRuntime.record() directly (that
   method's fixed exam-result shape is consumed by StatisticsRuntime;
   feeding it a Summary Model would corrupt quiz statistics). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function SummaryHistory() {
    this._items = [];
  }

  SummaryHistory.prototype.record = function (summary) {
    var materialId = summary && summary.metadata && summary.metadata.materialId;
    if (!materialId) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryHistory.record requires a Summary Model with metadata.materialId"
      );
    }
    var entry = {
      materialId: materialId,
      generatedAt: new Date().toISOString(),
      summary: summary
    };
    this._items.push(entry);
    return entry;
  };

  SummaryHistory.prototype.latest = function (materialId) {
    for (var i = this._items.length - 1; i >= 0; i--) {
      if (this._items[i].materialId === materialId) {
        return this._items[i];
      }
    }
    return null;
  };

  SummaryHistory.prototype.list = function () {
    return this._items.slice();
  };

  AHS.AIEngine.SummaryHistory = SummaryHistory;
})();
