/* js/runtime/AnswerRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   AnswerRuntime records the student's answers while an ExamRuntime
   session is running: QuestionCard calls saveAnswer() on each pick;
   AutoGrader later reads getAnswers() to compute the result. In-memory
   only, keyed by examId. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AnswerRuntime = (function () {
  "use strict";

  /* store: examId -> { questionId -> answerKey }. */
  var store = {};

  function saveAnswer(examId, questionId, answerKey) {
    if (!examId || !questionId) { return null; }
    store[examId] = store[examId] || {};
    store[examId][questionId] = answerKey;
    return answerKey;
  }

  function getAnswer(examId, questionId) {
    return store[examId] && store[examId][questionId] != null
      ? store[examId][questionId] : null;
  }

  function getAnswers(examId) {
    return store[examId] ? clone(store[examId]) : {};
  }

  function answeredCount(examId) {
    return store[examId] ? Object.keys(store[examId]).length : 0;
  }

  function clear(examId) {
    delete store[examId];
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* reset() — test helper. */
  function reset() {
    store = {};
  }

  return {
    saveAnswer: saveAnswer,
    getAnswer: getAnswer,
    getAnswers: getAnswers,
    answeredCount: answeredCount,
    clear: clear,
    reset: reset
  };
})();
