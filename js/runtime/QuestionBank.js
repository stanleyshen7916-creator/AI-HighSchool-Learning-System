/* js/runtime/QuestionBank.js — Question Bank Runtime (WO-Q002).
   Follows the Material Center Runtime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   Scope (WO-Q002 LOCKED): QuestionBank manages the QUESTION BANK
   (browse / query / random draw) only — it is NOT the exam flow.
   It holds NO data of its own: every method reads fresh from
   window.AHS.QuestionRuntime (the single source of truth) and never
   mutates it. No new Seed Data, no UI, no Exam, no Auto Grading, no
   Wrong Book — those are later Work Orders.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionBank = (function () {
  "use strict";

  /* source() — always re-reads AHS.QuestionRuntime.list(), which is
     already a Deep Clone. QuestionBank never caches this itself, so
     every call reflects the current QuestionRuntime state. */
  function source() {
    return (AHS.QuestionRuntime && typeof AHS.QuestionRuntime.list === "function")
      ? AHS.QuestionRuntime.list() : [];
  }

  /* init() — QuestionBank is stateless; init() only confirms
     QuestionRuntime is available as the data source. Nothing to seed
     or allocate here. */
  function init() {
    return !!(AHS.QuestionRuntime && typeof AHS.QuestionRuntime.list === "function");
  }

  function list() {
    return source();
  }

  /* get(questionId) — delegates straight to QuestionRuntime.get(),
     which already returns a Deep Clone (or null). */
  function get(questionId) {
    return (AHS.QuestionRuntime && typeof AHS.QuestionRuntime.get === "function")
      ? AHS.QuestionRuntime.get(questionId) : null;
  }

  function getBySubject(subject) {
    return source().filter(function (q) { return q.subject === subject; });
  }

  function getByChapter(subject, chapter) {
    return source().filter(function (q) { return q.subject === subject && q.chapter === chapter; });
  }

  function getByDifficulty(level) {
    return source().filter(function (q) { return q.difficulty === level; });
  }

  function getByType(type) {
    return source().filter(function (q) { return q.type === type; });
  }

  function getFavorites() {
    return source().filter(function (q) { return q.favorite === true; });
  }

  /* search(keyword) — matches question / chapter / tags / subject
     (case-insensitive substring). Empty keyword returns the full bank. */
  function search(keyword) {
    var k = String(keyword == null ? "" : keyword).trim().toLowerCase();
    var all = source();
    if (!k) { return all; }
    return all.filter(function (q) {
      if (q.question && String(q.question).toLowerCase().indexOf(k) !== -1) { return true; }
      if (q.chapter && String(q.chapter).toLowerCase().indexOf(k) !== -1) { return true; }
      if (q.subject && String(q.subject).toLowerCase().indexOf(k) !== -1) { return true; }
      if (q.tags && q.tags.some(function (t) { return String(t).toLowerCase().indexOf(k) !== -1; })) { return true; }
      return false;
    });
  }

  /* matches(q, options) — shared filter predicate for random()/count().
     options: { subject, grade, chapter, difficulty, type, tags, favorite }.
     Unset / "all" fields are ignored. tags matches on any overlap. */
  function matches(q, options) {
    options = options || {};
    if (options.subject && options.subject !== "all" && q.subject !== options.subject) { return false; }
    if (options.grade && options.grade !== "all" && q.grade !== options.grade) { return false; }
    if (options.chapter && options.chapter !== "all" && q.chapter !== options.chapter) { return false; }
    if (options.difficulty && options.difficulty !== "all" && q.difficulty !== options.difficulty) { return false; }
    if (options.type && options.type !== "all" && q.type !== options.type) { return false; }
    if (options.tags && options.tags.length) {
      var hasTag = q.tags && q.tags.some(function (t) { return options.tags.indexOf(t) !== -1; });
      if (!hasTag) { return false; }
    }
    if (typeof options.favorite === "boolean" && q.favorite !== options.favorite) { return false; }
    return true;
  }

  /* random(count, options) — random, non-repeating draw from the pool
     filtered by options (subject/grade/chapter/difficulty/type/tags).
     Fisher-Yates shuffle over a Deep Clone snapshot (source() already
     returns one), so nothing shared is mutated. If count exceeds the
     available pool, returns the whole (shuffled) pool. */
  function random(count, options) {
    var pool = source().filter(function (q) { return matches(q, options); });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var take = (typeof count === "number" && count >= 0) ? count : pool.length;
    return pool.slice(0, take);
  }

  function exists(questionId) {
    return source().some(function (q) { return q.id === questionId; });
  }

  /* count(options) — same filter criteria as random(), returns a count
     rather than the records themselves. */
  function count(options) {
    return source().filter(function (q) { return matches(q, options); }).length;
  }

  return {
    init: init,
    list: list,
    get: get,
    getBySubject: getBySubject,
    getByChapter: getByChapter,
    getByDifficulty: getByDifficulty,
    getByType: getByType,
    getFavorites: getFavorites,
    search: search,
    random: random,
    exists: exists,
    count: count
  };
})();
