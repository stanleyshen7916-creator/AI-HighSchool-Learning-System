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

  /* grade(examSession, opts) — examSession is the ExamRuntime session
     record (needs examId / subject / title / totalQuestions). Returns
     the graded result (clone), or null if the exam has no question set.

     opts.answeredOnly (additive, optional — 完成測試 early-finish hotfix):
     when true, scopes totalCount/correctCount/results/wrong to ONLY the
     questions the student actually answered before finishing early —
     an unanswered question is simply excluded, never counted as wrong.
     Every existing caller (no opts, the normal 完成測驗 full-finish flow)
     keeps the exact prior behavior unchanged (unanswered = wrong,
     counted in totalCount). Returns null when the filtered set is
     empty (nothing real to grade — same "no question set" honesty
     start(examMeta) already returns null for above). */
  function grade(examSession, opts) {
    if (!examSession || !examSession.examId) { return null; }
    var examId = examSession.examId;
    var questions = AHS.QuestionRuntime.getSet(examId);
    if (!questions.length) { return null; }
    var answers = AHS.AnswerRuntime.getAnswers(examId);
    if (opts && opts.answeredOnly) {
      questions = questions.filter(function (q) { return answers[q.id] != null; });
      if (!questions.length) { return null; }
    }

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
        /* AI-601 (Sprint AI-109): additive passthrough of the question's
           own real materialId (already set on every Repository-imported
           question by js/runtime/TeachingMaterialLoader.js) — never
           fabricated, "" when the question has none (Mock/QuestionBank
           Exam Mode questions aren't tied to any real material). Lets
           WrongBookRuntime.sync() record a real 教材來源 without
           changing this function's own return shape for any existing
           consumer (every field before this one is untouched). */
        materialId: q.materialId || "",
        /* Sprint AI-147（使用者需求：題目附圖）: same real passthrough
           discipline as materialId above — "" when the source question
           genuinely has no figure, never fabricated. */
        figureSvg: q.figureSvg || "",
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
