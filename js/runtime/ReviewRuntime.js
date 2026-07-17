/* js/runtime/ReviewRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   ReviewRuntime.build(examId) shapes the finished AutoGrader result
   into the view-model the Review screen renders (question-by-question
   right/wrong breakdown). It does not grade or store anything itself —
   purely reads AHS.AutoGrader's cached result for the exam.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewRuntime = (function () {
  "use strict";

  /* build(examId) — returns a review view-model (clone), or null if the
     exam hasn't been graded yet. */
  function build(examId) {
    var graded = AHS.AutoGrader.getGraded(examId);
    if (!graded) { return null; }
    return {
      examId: graded.examId,
      subject: graded.subject,
      title: graded.title,
      chapter: graded.chapter,
      score: graded.score,
      accuracy: graded.accuracy,
      correctCount: graded.correctCount,
      totalCount: graded.totalCount,
      gradedAt: graded.gradedAt,
      questions: graded.results.map(function (r) {
        return {
          index: r.index,
          text: r.text,
          options: r.options,
          yourAnswer: r.yourAnswer,
          correctAnswer: r.correctAnswer,
          isCorrect: r.isCorrect,
          explanation: r.explanation
        };
      })
    };
  }

  return { build: build };
})();
