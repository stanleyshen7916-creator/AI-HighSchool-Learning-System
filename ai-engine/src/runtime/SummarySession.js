/* ai-engine/src/runtime/SummarySession.js — EO-AI-006 · AI Summary Runtime Integration
   Tracks which materialId the Summary Pipeline is currently processing.
   Plain state holder — no business logic. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function SummarySession() {
    this._current = null;
    this._active = false;
  }

  SummarySession.prototype.start = function (materialId) {
    if (!materialId) {
      throw new AHS.AIEngine.ValidationError("SummarySession.start requires a materialId");
    }
    this._current = materialId;
    this._active = true;
    return this._current;
  };

  SummarySession.prototype.stop = function () {
    this._current = null;
    this._active = false;
  };

  SummarySession.prototype.current = function () {
    return this._active ? this._current : null;
  };

  AHS.AIEngine.SummarySession = SummarySession;
})();
