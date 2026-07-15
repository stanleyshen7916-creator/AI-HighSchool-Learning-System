/* js/runtime/QuestionRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   QuestionRuntime is the Runtime Memory layer on top of AHS.QuestionBank:
   it loads a question set for a given exam (via QuestionBank.generate)
   and keeps it in-memory so the rest of the chain (ExamRuntime,
   AnswerRuntime, AutoGrader, ReviewRuntime, ...) can address questions
   by examId without regenerating them. Same store pattern as
   AHS.MaterialRuntime: plain in-memory object under window.AHS,
   starts EMPTY, no localStorage / API / backend.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionRuntime = (function () {
  "use strict";

  /* store: examId -> question array (as produced by QuestionBank). */
  var store = {};

  /* loadForExam(examMeta) — builds (or rebuilds) the question set for
     examMeta.examId via AHS.QuestionBank and stores it. Returns a deep
     clone of the generated set. */
  function loadForExam(examMeta) {
    var meta = examMeta || {};
    var questions = AHS.QuestionBank.generate(meta);
    store[meta.examId] = questions;
    return clone(questions);
  }

  function hasExam(examId) {
    return Object.prototype.hasOwnProperty.call(store, examId);
  }

  function getSet(examId) {
    return hasExam(examId) ? clone(store[examId]) : [];
  }

  function count(examId) {
    return hasExam(examId) ? store[examId].length : 0;
  }

  function getQuestion(examId, index) {
    if (!hasExam(examId)) { return null; }
    var q = store[examId][index];
    return q ? clone(q) : null;
  }

  function getQuestionById(examId, questionId) {
    if (!hasExam(examId)) { return null; }
    for (var i = 0; i < store[examId].length; i++) {
      if (store[examId][i].id === questionId) { return clone(store[examId][i]); }
    }
    return null;
  }

  function clear(examId) {
    delete store[examId];
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* reset() — test helper; clears every loaded exam's question set. */
  function reset() {
    store = {};
  }

  return {
    loadForExam: loadForExam,
    hasExam: hasExam,
    getSet: getSet,
    count: count,
    getQuestion: getQuestion,
    getQuestionById: getQuestionById,
    clear: clear,
    reset: reset
  };
})();
