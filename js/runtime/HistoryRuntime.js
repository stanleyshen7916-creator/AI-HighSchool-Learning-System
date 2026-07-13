/* js/runtime/HistoryRuntime.js — Exam History Runtime (WO-Q009).
   Follows the MaterialRuntime / QuestionRuntime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   HistoryRuntime reads (never writes) existing sources:
     ExamRuntime.get(examId)      — title/subject/grade/chapter/startedAt/finishedAt
     AutoGrader.getResult(examId) — totalQuestions/answered/correct/wrong/score/accuracy
     ReviewRuntime                — available for cross-reference (a History
                                     entry and its Review share the same
                                     examId); not required to build a
                                     History record, so its absence never
                                     blocks record().
   It never calls a mutating method on ExamRuntime / AutoGrader /
   ReviewRuntime / AnswerRuntime / WrongBookRuntime / QuestionRuntime /
   QuestionBank.

   Starts EMPTY (no Seed Data) — entries only ever appear via record().
   Scope (WO-Q009 LOCKED): History bookkeeping only. Does NOT build UI.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.HistoryRuntime = (function () {
  "use strict";

  var store = { records: [], seq: 0 };

  function clone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }

  function getExam(examId) {
    return (AHS.ExamRuntime && typeof AHS.ExamRuntime.get === "function")
      ? AHS.ExamRuntime.get(examId) : null;
  }

  function getResult(examId) {
    return (AHS.AutoGrader && typeof AHS.AutoGrader.getResult === "function")
      ? AHS.AutoGrader.getResult(examId) : null;
  }

  function findByExamId(examId) {
    for (var i = 0; i < store.records.length; i++) {
      if (store.records[i].examId === examId) { return store.records[i]; }
    }
    return null;
  }

  function findById(historyId) {
    for (var i = 0; i < store.records.length; i++) {
      if (store.records[i].historyId === historyId) { return store.records[i]; }
    }
    return null;
  }

  /* durationMinutes(startedAt, finishedAt) — finishedAt - startedAt,
     expressed in minutes, rounded to 2 decimals. 0 if either timestamp
     is missing (exam never actually started/finished). */
  function durationMinutes(startedAt, finishedAt) {
    if (!startedAt || !finishedAt) { return 0; }
    var ms = new Date(finishedAt) - new Date(startedAt);
    if (!(ms > 0)) { return 0; }
    return Math.round((ms / 60000) * 100) / 100;
  }

  /* init() — no Seed Data; starts empty. */
  function init() {
    store.records = [];
    store.seq = 0;
    return true;
  }

  /* record(examId) — "每份 Exam 僅建立一筆 History": if a History
     already exists for this examId, returns it AS-IS, never creating a
     second one. Requires both ExamRuntime and a graded AutoGrader
     Result to exist; returns null otherwise. */
  function record(examId) {
    var existing = findByExamId(examId);
    if (existing) { return clone(existing); }

    var exam = getExam(examId);
    var result = getResult(examId);
    if (!exam || !result) { return null; }

    store.seq += 1;
    var entry = {
      historyId: "hist_" + store.seq,
      examId: examId,
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      chapter: exam.chapter,
      totalQuestions: result.totalQuestions,
      answered: result.answered,
      correct: result.correct,
      wrong: result.wrong,
      score: result.score,
      accuracy: result.accuracy,
      startedAt: exam.startedAt,
      finishedAt: exam.finishedAt,
      duration: durationMinutes(exam.startedAt, exam.finishedAt),
      createdAt: new Date().toISOString()
    };
    store.records.push(entry);
    return clone(entry);
  }

  function get(historyId) {
    var r = findById(historyId);
    return r ? clone(r) : null;
  }

  function list() {
    return clone(store.records);
  }

  /* search(keyword) — title / subject / chapter (case-insensitive
     substring). Empty keyword returns the full list. */
  function search(keyword) {
    var k = String(keyword == null ? "" : keyword).trim().toLowerCase();
    if (!k) { return list(); }
    var out = store.records.filter(function (r) {
      if (r.title && String(r.title).toLowerCase().indexOf(k) !== -1) { return true; }
      if (r.subject && String(r.subject).toLowerCase().indexOf(k) !== -1) { return true; }
      if (r.chapter && String(r.chapter).toLowerCase().indexOf(k) !== -1) { return true; }
      return false;
    });
    return clone(out);
  }

  /* filter(options) — options: { subject, grade, chapter }. Unset /
     "all" fields are ignored. */
  function filter(options) {
    options = options || {};
    var out = store.records.filter(function (r) {
      if (options.subject && options.subject !== "all" && r.subject !== options.subject) { return false; }
      if (options.grade && options.grade !== "all" && r.grade !== options.grade) { return false; }
      if (options.chapter && options.chapter !== "all" && r.chapter !== options.chapter) { return false; }
      return true;
    });
    return clone(out);
  }

  /* sort(type) — "latest" (default) | "score" | "accuracy" | "duration",
     all non-increasing (highest/most-recent first). */
  function sort(type) {
    var arr = list();
    switch (type) {
      case "score":
        arr.sort(function (a, b) { return b.score - a.score; });
        break;
      case "accuracy":
        arr.sort(function (a, b) { return b.accuracy - a.accuracy; });
        break;
      case "duration":
        arr.sort(function (a, b) { return b.duration - a.duration; });
        break;
      case "latest":
      default:
        arr.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    }
    return arr;
  }

  function remove(historyId) {
    var next = [];
    var removed = false;
    for (var i = 0; i < store.records.length; i++) {
      if (store.records[i].historyId === historyId) { removed = true; }
      else { next.push(store.records[i]); }
    }
    store.records = next;
    return removed;
  }

  function clear() {
    store.records = [];
    return true;
  }

  function count() {
    return store.records.length;
  }

  /* reset() — clears History back to empty (no Seed Data). */
  function reset() {
    return init();
  }

  return {
    init: init,
    record: record,
    get: get,
    list: list,
    search: search,
    filter: filter,
    sort: sort,
    remove: remove,
    clear: clear,
    count: count,
    reset: reset
  };
})();
