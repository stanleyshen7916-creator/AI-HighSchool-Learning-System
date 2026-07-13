/* js/runtime/AutoGrader.js — Quiz Center Auto Grading (WO-Q006).
   Follows the MaterialRuntime / QuestionRuntime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   AutoGrader reads (never writes) three existing Runtimes, in the
   spec-mandated order:
     ExamRuntime → AnswerRuntime → QuestionBank
   and produces its OWN Result store. It never calls any mutating
   method on ExamRuntime / AnswerRuntime / QuestionBank / QuestionRuntime
   — grading is a pure read + compute + store-locally operation.

   Scope (WO-Q006 LOCKED): grading computation + Result storage only.
   Does NOT update Wrong Book, History, or Statistics, and does NOT
   touch any UI — those are later Work Orders.
   Every question is currently worth a fixed 1 point (score = 1 if
   correct, 0 if wrong/unanswered) — per-question weighting is not in
   scope here.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AutoGrader = (function () {
  "use strict";

  /* store.results: { [examId]: Result } */
  var store = { results: {} };

  function clone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }

  function getExam(examId) {
    return (AHS.ExamRuntime && typeof AHS.ExamRuntime.get === "function")
      ? AHS.ExamRuntime.get(examId) : null;
  }

  function getUserAnswer(examId, questionId) {
    return (AHS.AnswerRuntime && typeof AHS.AnswerRuntime.getAnswer === "function")
      ? AHS.AnswerRuntime.getAnswer(examId, questionId) : null;
  }

  function getQuestion(questionId) {
    return (AHS.QuestionBank && typeof AHS.QuestionBank.get === "function")
      ? AHS.QuestionBank.get(questionId) : null;
  }

  /* answersEqual(userAnswer, correctAnswer) — number index equality for
     single-choice; order-independent set equality for multi-choice
     (correctAnswer is an array). null/undefined userAnswer (unanswered)
     never matches. */
  function answersEqual(userAnswer, correctAnswer) {
    if (Array.isArray(correctAnswer)) {
      if (!Array.isArray(userAnswer)) { return false; }
      if (userAnswer.length !== correctAnswer.length) { return false; }
      var a = userAnswer.slice().sort();
      var b = correctAnswer.slice().sort();
      return a.every(function (v, i) { return v === b[i]; });
    }
    return userAnswer === correctAnswer;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  /* gradeQuestion(examId, questionId) — standalone single-question
     grading helper. Pure computation: does NOT read/write the stored
     Result, and does NOT mutate AnswerRuntime/ExamRuntime/QuestionBank.
     Returns a Detail Model, or null if the exam/question cannot be
     resolved. */
  function gradeQuestion(examId, questionId) {
    var exam = getExam(examId);
    if (!exam || exam.questionIds.indexOf(questionId) === -1) { return null; }
    var question = getQuestion(questionId);
    if (!question) { return null; }
    var answerRecord = getUserAnswer(examId, questionId);
    var userAnswer = answerRecord ? clone(answerRecord.answer) : null;
    var correctAnswer = clone(question.answer);
    var isCorrect = answersEqual(userAnswer, correctAnswer);
    return {
      questionId: questionId,
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      score: isCorrect ? 1 : 0,
      explanation: question.explanation || ""
    };
  }

  /* grade(examId) — ExamRuntime -> AnswerRuntime -> QuestionBank, in
     that order, for every questionId in the exam. If a Result is
     already stored for this exam, returns the cached Result as-is
     (idempotent) — use regrade() to force recomputation. */
  function grade(examId) {
    if (store.results[examId]) { return clone(store.results[examId]); }
    return computeAndStore(examId);
  }

  /* regrade(examId) — always recomputes and overwrites any stored
     Result for this exam. */
  function regrade(examId) {
    return computeAndStore(examId);
  }

  function computeAndStore(examId) {
    var exam = getExam(examId);
    if (!exam) { return null; }

    var details = exam.questionIds.map(function (questionId) {
      return gradeQuestion(examId, questionId);
    }).filter(function (d) { return d !== null; });

    var totalQuestions = exam.questionIds.length;
    var answered = (AHS.AnswerRuntime && typeof AHS.AnswerRuntime.countAnswered === "function")
      ? AHS.AnswerRuntime.countAnswered(examId) : details.filter(function (d) { return d.userAnswer !== null; }).length;
    var correct = details.filter(function (d) { return d.isCorrect; }).length;
    var wrong = totalQuestions - correct;
    var ratio = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

    var result = {
      examId: examId,
      totalQuestions: totalQuestions,
      answered: answered,
      correct: correct,
      wrong: wrong,
      score: round2(ratio),
      accuracy: round2(ratio),
      gradedAt: new Date().toISOString(),
      details: details
    };
    store.results[examId] = result;
    return clone(result);
  }

  function getResult(examId) {
    var r = store.results[examId];
    return r ? clone(r) : null;
  }

  function hasResult(examId) {
    return !!store.results[examId];
  }

  function removeResult(examId) {
    if (!store.results[examId]) { return false; }
    delete store.results[examId];
    return true;
  }

  function list() {
    return Object.keys(store.results).map(function (examId) { return clone(store.results[examId]); });
  }

  /* init() / reset() — AutoGrader has no Seed Data; both simply clear
     every stored Result. */
  function init() {
    store.results = {};
    return true;
  }

  function reset() {
    return init();
  }

  return {
    init: init,
    grade: grade,
    gradeQuestion: gradeQuestion,
    getResult: getResult,
    hasResult: hasResult,
    regrade: regrade,
    removeResult: removeResult,
    list: list,
    reset: reset
  };
})();
