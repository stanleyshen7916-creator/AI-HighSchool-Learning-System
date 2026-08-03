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

  /* importQuestions(examId, questions) — Sprint AI-103 · Content Import
     Runtime, Runtime Extension (proposed and applied per that Sprint's
     own "若 API 不足：請提出 Runtime Extension，不得自行建立 Parallel
     Runtime" rule). Purely additive: stores an already-built question
     array directly under examId, the same store loadForExam() already
     writes to and every existing read method (hasExam/getSet/count/
     getQuestion/getQuestionById) already reads from — so imported
     questions become visible through 100% existing, unmodified read
     APIs. Does NOT call AHS.QuestionBank (that remains loadForExam()'s
     sole route, completely untouched); this is the one gap
     loadForExam() cannot cover, since QuestionBank.generate() has no
     way to accept externally-supplied question content. Every
     pre-existing method above and their behavior are unchanged. */
  function importQuestions(examId, questions) {
    var list = Array.isArray(questions) ? questions : [];
    store[examId] = clone(list);
    return clone(store[examId]);
  }

  /* shuffleOrder(examId) — Sprint AI-117 AI-117-09 Random Exam Session,
     additive Runtime Extension (same sanctioned pattern importQuestions()/
     startFromExam() already used — "不得修改既有 Runtime API": every
     function above is untouched). Re-orders the STORED array in place
     with a real Fisher-Yates shuffle; each question object itself
     (its own real `id`/`index`/content) is never mutated, only the
     array's position order changes. "Question ID 永遠不變" holds
     structurally: getQuestionById() searches every item regardless of
     position, AutoGrader.grade()/WrongBookRuntime.sync() key everything
     by each question's own `id`, never by array index — so grading,
     Wrong Book, Review, and Statistics are provably unaffected by this
     reorder; only which question getQuestion(examId, N)/getSet(examId)
     returns at position N (i.e. what js/components/QuizCenter.js renders
     next) changes. Returns the shuffled clone, or [] if this examId has
     no stored set. */
  function shuffleOrder(examId) {
    if (!hasExam(examId)) { return []; }
    var arr = store[examId];
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return clone(arr);
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
    importQuestions: importQuestions,
    shuffleOrder: shuffleOrder,
    reset: reset
  };
})();
