/* js/runtime/MaterialLearningStateRuntime.js — Sprint AI-121 (Learning
   Knowledge Engine) AI-121-02: the explicit per-material Learning State
   machine —
     NOT_STARTED -> READING -> READY_FOR_PRACTICE -> READY_FOR_RETEST -> MASTERED
   "平台從 Learning Progress 轉為 Learning Outcome" is read as: this state
   is a real, named checkpoint a student and the AI Tutor can both point
   to (never a raw 0-100 reading percentage standing in for "done").

   Purely computed, same discipline as AHS.LearningStateRuntime (which
   this Runtime wraps, not replaces — "不得修改既有 Runtime API": every
   field materialState() already returns is still real and unchanged) —
   no second, persisted, driftable copy of "what state is this material
   in" is created here. Real signals only:
     reading      -> AHS.LearningStateRuntime materialState().reading/readingDone
     quiz         -> .quizAttempted (real WrongBookRuntime/HistoryRuntime activity)
     dueCount     -> real not-yet-mastered wrong items tied to this material
   The five states are a deterministic function of those same three real
   signals — nothing new to seed, nothing that can go stale. */
window.AHS = window.AHS || {};
AHS.MaterialLearningStateRuntime = (function () {
  "use strict";

  var STATES = {
    NOT_STARTED: "NOT_STARTED",
    READING: "READING",
    READY_FOR_PRACTICE: "READY_FOR_PRACTICE",
    READY_FOR_RETEST: "READY_FOR_RETEST",
    MASTERED: "MASTERED"
  };

  var LABELS = {
    NOT_STARTED: "尚未開始",
    READING: "閱讀中",
    READY_FOR_PRACTICE: "可開始練習",
    READY_FOR_RETEST: "可進行再次測試",
    MASTERED: "已精熟"
  };

  function materials() {
    return (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
  }

  /* state(materialId) — the one real classification function. Returns
     null only when AHS.LearningStateRuntime itself isn't loaded on this
     page (never a fabricated state). */
  function state(materialId) {
    var lsr = AHS.LearningStateRuntime;
    if (!lsr || typeof lsr.materialState !== "function") { return null; }
    var s = lsr.materialState(materialId);

    var code;
    if (!s.quizAttempted && s.reading === 0) {
      code = STATES.NOT_STARTED;
    } else if (!s.readingDone) {
      code = STATES.READING;
    } else if (!s.quizAttempted) {
      code = STATES.READY_FOR_PRACTICE;
    } else if (s.dueCount > 0) {
      code = STATES.READY_FOR_RETEST;
    } else {
      code = STATES.MASTERED;
    }

    return {
      materialId: materialId,
      state: code,
      label: LABELS[code],
      reading: s.reading,
      readingDone: s.readingDone,
      quizAttempted: s.quizAttempted,
      dueCount: s.dueCount,
      masteredCount: s.masteredCount
    };
  }

  /* allStates() — one real entry per AHS.MaterialRuntime record, in
     list order. Used by Home's own Learning-Outcome-driven KPIs
     (AI-121-01/19) instead of the retired 教材完成度 widget. */
  function allStates() {
    return materials().map(function (m) { return state(m.id); }).filter(Boolean);
  }

  return {
    STATES: STATES,
    LABELS: LABELS,
    state: state,
    allStates: allStates
  };
})();
