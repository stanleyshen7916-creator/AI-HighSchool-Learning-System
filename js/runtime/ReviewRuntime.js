/* js/runtime/ReviewRuntime.js — Post-Exam Review Runtime (WO-Q008).
   Follows the MaterialRuntime / QuestionRuntime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   ReviewRuntime reads (never writes) existing sources:
     AutoGrader.getResult(examId)   — per-question grading detail
     WrongBookRuntime.get(questionId) — tags (Wrong Book entries carry a
                                        tags snapshot; used only as a
                                        fallback if QuestionBank is ever
                                        unavailable)
     QuestionBank.get(questionId)   — subject/chapter/difficulty +
                                       live stem text for search()
   and maintains its OWN Review store. It never calls a mutating method
   on AutoGrader / WrongBookRuntime / AnswerRuntime / ExamRuntime /
   QuestionRuntime / QuestionBank.

   A Review Item never stores the full Question Object — question stem
   text (and tags, for search) are always looked up live via
   QuestionBank at search() time, never cached here.

   Scope (WO-Q008 LOCKED): Review data only. Does NOT build History,
   Statistics, or UI — those are later Work Orders.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewRuntime = (function () {
  "use strict";

  /* store.reviews: { [examId]: Review } */
  var store = { reviews: {} };

  function clone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }

  function getResult(examId) {
    return (AHS.AutoGrader && typeof AHS.AutoGrader.getResult === "function")
      ? AHS.AutoGrader.getResult(examId) : null;
  }

  function getQuestion(questionId) {
    return (AHS.QuestionBank && typeof AHS.QuestionBank.get === "function")
      ? AHS.QuestionBank.get(questionId) : null;
  }

  /* getTags(questionId) — QuestionBank first; WrongBookRuntime's stored
     snapshot only as a fallback (still read-only, never mutated). */
  function getTags(questionId) {
    var q = getQuestion(questionId);
    if (q && q.tags) { return q.tags; }
    var wb = (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.get === "function")
      ? AHS.WrongBookRuntime.get(questionId) : null;
    return wb && wb.tags ? wb.tags : [];
  }

  /* reviewTypeOf(detail) — "correct" | "wrong" | "unanswered", derived
     strictly from the AutoGrader Detail (isCorrect + userAnswer). */
  function reviewTypeOf(detail) {
    if (detail.isCorrect) { return "correct"; }
    return detail.userAnswer == null ? "unanswered" : "wrong";
  }

  /* buildReview(examId) — pure computation, always creates a fresh
     Review (used by both build()'s first-time path and rebuild()). */
  function buildReview(examId) {
    var result = getResult(examId);
    if (!result || !Array.isArray(result.details)) { return null; }

    var items = result.details.map(function (detail) {
      var q = getQuestion(detail.questionId);
      return {
        questionId: detail.questionId,
        subject: q ? q.subject : "",
        chapter: q ? q.chapter : "",
        difficulty: q ? q.difficulty : "",
        userAnswer: clone(detail.userAnswer),
        correctAnswer: clone(detail.correctAnswer),
        isCorrect: detail.isCorrect,
        explanation: detail.explanation || "",
        reviewType: reviewTypeOf(detail)
      };
    });

    var review = {
      examId: examId,
      reviewedAt: new Date().toISOString(),
      summary: {
        totalQuestions: result.totalQuestions,
        answered: result.answered,
        correct: result.correct,
        wrong: result.wrong,
        accuracy: result.accuracy
      },
      items: items
    };
    store.reviews[examId] = review;
    return clone(review);
  }

  /* init() — Review Runtime has no Seed Data; starts empty. */
  function init() {
    store.reviews = {};
    return true;
  }

  /* build(examId) — "已有 Review 時直接回傳" (idempotent). Use
     rebuild() to force recomputation. Returns null if the exam has no
     AutoGrader Result yet. */
  function build(examId) {
    if (store.reviews[examId]) { return clone(store.reviews[examId]); }
    return buildReview(examId);
  }

  function rebuild(examId) {
    return buildReview(examId);
  }

  function get(examId) {
    var r = store.reviews[examId];
    return r ? clone(r) : null;
  }

  function hasReview(examId) {
    return !!store.reviews[examId];
  }

  function remove(examId) {
    if (!store.reviews[examId]) { return false; }
    delete store.reviews[examId];
    return true;
  }

  function list() {
    return Object.keys(store.reviews).map(function (examId) { return clone(store.reviews[examId]); });
  }

  /* flattenItems() — every Review Item across every built Review, each
     annotated with its parent's examId / reviewedAt / summary.accuracy
     so search()/filter()/sort() (which operate at item granularity)
     can work with a single flat, homogeneous, Deep-Cloned collection. */
  function flattenItems() {
    var out = [];
    Object.keys(store.reviews).forEach(function (examId) {
      var review = store.reviews[examId];
      review.items.forEach(function (item) {
        out.push(clone({
          examId: review.examId,
          reviewedAt: review.reviewedAt,
          accuracy: review.summary.accuracy,
          questionId: item.questionId,
          subject: item.subject,
          chapter: item.chapter,
          difficulty: item.difficulty,
          userAnswer: item.userAnswer,
          correctAnswer: item.correctAnswer,
          isCorrect: item.isCorrect,
          explanation: item.explanation,
          reviewType: item.reviewType
        }));
      });
    });
    return out;
  }

  /* search(keyword) — subject / chapter match on the flattened item;
     question stem text + tags are looked up live via QuestionBank
     (never cached here). */
  function search(keyword) {
    var k = String(keyword == null ? "" : keyword).trim().toLowerCase();
    var all = flattenItems();
    if (!k) { return all; }
    return all.filter(function (item) {
      if (item.subject && String(item.subject).toLowerCase().indexOf(k) !== -1) { return true; }
      if (item.chapter && String(item.chapter).toLowerCase().indexOf(k) !== -1) { return true; }
      var q = getQuestion(item.questionId);
      if (q && q.question && String(q.question).toLowerCase().indexOf(k) !== -1) { return true; }
      var tags = getTags(item.questionId);
      if (tags.some(function (t) { return String(t).toLowerCase().indexOf(k) !== -1; })) { return true; }
      return false;
    });
  }

  /* filter(options) — options: { subject, chapter, difficulty, reviewType }.
     Unset / "all" fields are ignored. */
  function filter(options) {
    options = options || {};
    return flattenItems().filter(function (item) {
      if (options.subject && options.subject !== "all" && item.subject !== options.subject) { return false; }
      if (options.chapter && options.chapter !== "all" && item.chapter !== options.chapter) { return false; }
      if (options.difficulty && options.difficulty !== "all" && item.difficulty !== options.difficulty) { return false; }
      if (options.reviewType && options.reviewType !== "all" && item.reviewType !== options.reviewType) { return false; }
      return true;
    });
  }

  /* sort(type) — "latest" (default) | "accuracy" | "subject" | "chapter". */
  function sort(type) {
    var arr = flattenItems();
    switch (type) {
      case "accuracy":
        arr.sort(function (a, b) { return b.accuracy - a.accuracy; });
        break;
      case "subject":
        arr.sort(function (a, b) { return String(a.subject).localeCompare(String(b.subject)); });
        break;
      case "chapter":
        arr.sort(function (a, b) { return String(a.chapter).localeCompare(String(b.chapter)); });
        break;
      case "latest":
      default:
        arr.sort(function (a, b) { return new Date(b.reviewedAt) - new Date(a.reviewedAt); });
    }
    return arr;
  }

  /* reset() — clears all Reviews (no Seed Data to restore to). */
  function reset() {
    return init();
  }

  return {
    init: init,
    build: build,
    get: get,
    hasReview: hasReview,
    rebuild: rebuild,
    remove: remove,
    list: list,
    search: search,
    filter: filter,
    sort: sort,
    reset: reset
  };
})();
