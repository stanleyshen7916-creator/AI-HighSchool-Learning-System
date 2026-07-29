/* ai-engine/src/runtime/QuestionSession.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/runtime/SummarySession.js (EO-AI-006).
   Tracks which materialId the Question Pipeline is currently
   processing. Plain state holder — no business logic. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function QuestionSession() {
    this._current = null;
    this._active = false;
  }

  QuestionSession.prototype.start = function (materialId) {
    if (!materialId) {
      throw new AHS.AIEngine.ValidationError("QuestionSession.start requires a materialId");
    }
    this._current = materialId;
    this._active = true;
    return this._current;
  };

  QuestionSession.prototype.stop = function () {
    this._current = null;
    this._active = false;
  };

  QuestionSession.prototype.current = function () {
    return this._active ? this._current : null;
  };

  AHS.AIEngine.QuestionSession = QuestionSession;
})();
