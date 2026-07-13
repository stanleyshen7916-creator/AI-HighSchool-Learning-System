/* js/runtime/WrongBookRuntime.js — Wrong Book Runtime (WO-Q007).
   Follows the MaterialRuntime / QuestionRuntime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   WrongBookRuntime reads (never writes) two existing sources:
     AutoGrader.getResult(examId)  — which questions were wrong
     QuestionBank.get(questionId)  — question metadata for the record
   and maintains its OWN Wrong Book store. It never calls a mutating
   method on AutoGrader / AnswerRuntime / ExamRuntime / QuestionRuntime
   / QuestionBank.

   Starts EMPTY (no Seed Data) — entries only ever appear via sync().
   Scope (WO-Q007 LOCKED): Wrong Book bookkeeping only. Does NOT build
   History, Statistics, or UI — those are later Work Orders.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.WrongBookRuntime = (function () {
  "use strict";

  var SORT_TYPES = ["latest", "wrongCount", "subject", "chapter"];

  /* store.entries: { [questionId]: WrongBook } — keying by questionId
     makes "相同 questionId 不得重複建立" structurally guaranteed: a
     second sync() for the same question always updates the existing
     entry in place, never appends a second one. */
  var store = { entries: {} };

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

  /* init() — Wrong Book has no Seed Data; starts empty. */
  function init() {
    store.entries = {};
    return true;
  }

  /* sync(examId) — reads AutoGrader.getResult(examId); for every
     detail with isCorrect === false, creates (first time) or updates
     (wrongCount += 1, lastWrongAt, lastExamId) the Wrong Book entry for
     that questionId. mastered/favorite default false and are only ever
     set by markFavorite()/markMastered() — sync() never resets them on
     an existing entry. Returns the Deep-Cloned entries touched by this
     call (empty array if there is no graded Result yet, or nothing was
     wrong). */
  function sync(examId) {
    var result = getResult(examId);
    if (!result || !Array.isArray(result.details)) { return []; }

    var now = new Date().toISOString();
    var touched = [];

    result.details.forEach(function (detail) {
      if (detail.isCorrect !== false) { return; }
      var questionId = detail.questionId;
      var existing = store.entries[questionId];

      if (existing) {
        existing.wrongCount += 1;
        existing.lastWrongAt = now;
        existing.lastExamId = examId;
        touched.push(existing);
        return;
      }

      var question = getQuestion(questionId);
      var entry = {
        questionId: questionId,
        subject: question ? question.subject : "",
        grade: question ? question.grade : "",
        chapter: question ? question.chapter : "",
        type: question ? question.type : "",
        difficulty: question ? question.difficulty : "",
        wrongCount: 1,
        lastWrongAt: now,
        lastExamId: examId,
        favorite: false,
        mastered: false,
        tags: question && question.tags ? clone(question.tags) : []
      };
      store.entries[questionId] = entry;
      touched.push(entry);
    });

    return touched.map(clone);
  }

  function list() {
    return Object.keys(store.entries).map(function (qid) { return clone(store.entries[qid]); });
  }

  function get(questionId) {
    var e = store.entries[questionId];
    return e ? clone(e) : null;
  }

  function exists(questionId) {
    return !!store.entries[questionId];
  }

  function markFavorite(questionId, value) {
    var e = store.entries[questionId];
    if (!e) { return null; }
    e.favorite = !!value;
    return clone(e);
  }

  function markMastered(questionId, value) {
    var e = store.entries[questionId];
    if (!e) { return null; }
    e.mastered = !!value;
    return clone(e);
  }

  function remove(questionId) {
    if (!store.entries[questionId]) { return false; }
    delete store.entries[questionId];
    return true;
  }

  function clear() {
    store.entries = {};
    return true;
  }

  /* search(keyword) — subject / chapter / tags match directly on the
     stored record; question stem text is looked up live via
     QuestionBank.get() (never cached here, so it can't go stale). */
  function search(keyword) {
    var k = String(keyword == null ? "" : keyword).trim().toLowerCase();
    var all = list();
    if (!k) { return all; }
    return all.filter(function (rec) {
      if (rec.subject && String(rec.subject).toLowerCase().indexOf(k) !== -1) { return true; }
      if (rec.chapter && String(rec.chapter).toLowerCase().indexOf(k) !== -1) { return true; }
      if (rec.tags && rec.tags.some(function (t) { return String(t).toLowerCase().indexOf(k) !== -1; })) { return true; }
      var q = getQuestion(rec.questionId);
      if (q && q.question && String(q.question).toLowerCase().indexOf(k) !== -1) { return true; }
      return false;
    });
  }

  /* filter(options) — options: { subject, grade, chapter, difficulty,
     type, favorite, mastered }. String fields: unset / "all" ignored.
     Boolean fields: only applied when explicitly boolean. */
  function filter(options) {
    options = options || {};
    return list().filter(function (rec) {
      if (options.subject && options.subject !== "all" && rec.subject !== options.subject) { return false; }
      if (options.grade && options.grade !== "all" && rec.grade !== options.grade) { return false; }
      if (options.chapter && options.chapter !== "all" && rec.chapter !== options.chapter) { return false; }
      if (options.difficulty && options.difficulty !== "all" && rec.difficulty !== options.difficulty) { return false; }
      if (options.type && options.type !== "all" && rec.type !== options.type) { return false; }
      if (typeof options.favorite === "boolean" && rec.favorite !== options.favorite) { return false; }
      if (typeof options.mastered === "boolean" && rec.mastered !== options.mastered) { return false; }
      return true;
    });
  }

  /* sort(type) — "latest" (default) | "wrongCount" | "subject" | "chapter". */
  function sort(type) {
    var arr = list();
    switch (SORT_TYPES.indexOf(type) !== -1 ? type : "latest") {
      case "wrongCount":
        arr.sort(function (a, b) { return b.wrongCount - a.wrongCount; });
        break;
      case "subject":
        arr.sort(function (a, b) { return String(a.subject).localeCompare(String(b.subject)); });
        break;
      case "chapter":
        arr.sort(function (a, b) { return String(a.chapter).localeCompare(String(b.chapter)); });
        break;
      case "latest":
      default:
        arr.sort(function (a, b) { return new Date(b.lastWrongAt) - new Date(a.lastWrongAt); });
    }
    return arr;
  }

  function count() {
    return Object.keys(store.entries).length;
  }

  /* reset() — clears the Wrong Book back to empty (no Seed Data to
     restore to; entries only ever come from sync()). */
  function reset() {
    return init();
  }

  return {
    init: init,
    sync: sync,
    list: list,
    get: get,
    exists: exists,
    markFavorite: markFavorite,
    markMastered: markMastered,
    remove: remove,
    clear: clear,
    search: search,
    filter: filter,
    sort: sort,
    count: count,
    reset: reset
  };
})();
