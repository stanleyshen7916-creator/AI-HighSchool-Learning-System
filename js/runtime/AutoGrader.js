/* js/runtime/AutoGrader.js — Sprint 4 · Quiz Runtime Foundation.
   AutoGrader.grade(examId) reads the finalized question set from
   AHS.QuestionRuntime and the student's answers from AHS.AnswerRuntime,
   compares them, and produces a graded result (score / accuracy /
   per-question correctness / wrong list). The graded result is cached
   per examId so downstream Runtimes (WrongBookRuntime, ReviewRuntime,
   HistoryRuntime) can reuse it without recomputation. PascalCase
   component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AutoGrader = (function () {
  "use strict";

  /* cache: examId -> last graded result. */
  var cache = {};

  /* grade(examSession) — examSession is the ExamRuntime session record
     (needs examId / subject / title / totalQuestions). Returns the
     graded result (clone), or null if the exam has no question set. */
  function grade(examSession) {
    if (!examSession || !examSession.examId) { return null; }
    var examId = examSession.examId;
    var questions = AHS.QuestionRuntime.getSet(examId);
    if (!questions.length) { return null; }
    var answers = AHS.AnswerRuntime.getAnswers(examId);

    var correctCount = 0;
    var results = questions.map(function (q) {
      var yourAnswer = answers[q.id] != null ? answers[q.id] : null;
      var isCorrect = yourAnswer === q.correctAnswer;
      if (isCorrect) { correctCount += 1; }
      return {
        questionId: q.id,
        index: q.index,
        text: q.text,
        options: q.options,
        knowledgePoint: q.knowledgePoint,
        explanation: q.explanation,
        yourAnswer: yourAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: isCorrect
      };
    });

    var total = questions.length;
    var accuracy = total ? Math.round((correctCount / total) * 100) : 0;
    var score = accuracy;

    var result = {
      examId: examId,
      subject: examSession.subject,
      title: examSession.title,
      chapter: examSession.chapter,
      totalCount: total,
      correctCount: correctCount,
      accuracy: accuracy,
      score: score,
      results: results,
      wrong: results.filter(function (r) { return !r.isCorrect; }),
      gradedAt: new Date().toISOString()
    };

    cache[examId] = result;
    return clone(result);
  }

  function getGraded(examId) {
    return cache[examId] ? clone(cache[examId]) : null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* reset() — test helper. */
  function reset() {
    cache = {};
  }

  return { grade: grade, getGraded: getGraded, reset: reset };
})();
