/* js/runtime/StatisticsRuntime.js — Statistics Runtime (WO-Q010).
   Follows the MaterialRuntime / QuestionRuntime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   StatisticsRuntime reads (never writes) existing sources:
     HistoryRuntime.list()   — per-exam score/accuracy/subject history
     WrongBookRuntime.list() — wrong-question tracking (favorite/mastered)
   and computes aggregate Statistics ON DEMAND ("即時計算"). It never
   calls a mutating method on HistoryRuntime / WrongBookRuntime / any
   other Runtime, and it never stores a copy of History records — only
   the aggregated numbers ever live in this module's memory.

   Scope (WO-Q010 LOCKED): Statistics computation only. Does NOT build
   UI. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.StatisticsRuntime = (function () {
  "use strict";

  /* store.current — the last built/refreshed Statistics snapshot
     (aggregated numbers ONLY; never a copy of History/WrongBook rows). */
  var store = { current: null };

  function clone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }

  function getHistory() {
    return (AHS.HistoryRuntime && typeof AHS.HistoryRuntime.list === "function")
      ? AHS.HistoryRuntime.list() : [];
  }

  function getWrongBook() {
    return (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.list === "function")
      ? AHS.WrongBookRuntime.list() : [];
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function average(nums) {
    if (!nums.length) { return 0; }
    return round2(nums.reduce(function (s, n) { return s + n; }, 0) / nums.length);
  }

  /* subjectStatsFor(subject, history, wrongBook) — one subjectStatistics
     entry: examCount/averageScore/averageAccuracy come from History
     rows for that subject; wrongQuestions/masteredQuestions/
     favoriteQuestions come from WrongBook rows for that subject. */
  function subjectStatsFor(subject, history, wrongBook) {
    var rows = history.filter(function (h) { return h.subject === subject; });
    var wrongRows = wrongBook.filter(function (w) { return w.subject === subject; });
    return {
      subject: subject,
      examCount: rows.length,
      averageScore: average(rows.map(function (r) { return r.score; })),
      averageAccuracy: average(rows.map(function (r) { return r.accuracy; })),
      wrongQuestions: wrongRows.length,
      masteredQuestions: wrongRows.filter(function (w) { return w.mastered; }).length,
      favoriteQuestions: wrongRows.filter(function (w) { return w.favorite; }).length
    };
  }

  /* computeAll() — pure computation, always fresh from HistoryRuntime +
     WrongBookRuntime. No caching inside this function itself. */
  function computeAll() {
    var history = getHistory();
    var wrongBook = getWrongBook();
    var scores = history.map(function (h) { return h.score; });

    var subjects = [];
    history.forEach(function (h) { if (subjects.indexOf(h.subject) === -1) { subjects.push(h.subject); } });
    wrongBook.forEach(function (w) { if (subjects.indexOf(w.subject) === -1) { subjects.push(w.subject); } });

    return {
      totalExam: history.length,
      averageScore: average(scores),
      averageAccuracy: average(history.map(function (h) { return h.accuracy; })),
      highestScore: scores.length ? Math.max.apply(null, scores) : 0,
      lowestScore: scores.length ? Math.min.apply(null, scores) : 0,
      totalWrongQuestions: wrongBook.length,
      masteredQuestions: wrongBook.filter(function (w) { return w.mastered; }).length,
      favoriteWrongQuestions: wrongBook.filter(function (w) { return w.favorite; }).length,
      subjectStatistics: subjects.map(function (s) { return subjectStatsFor(s, history, wrongBook); })
    };
  }

  /* init() — no Seed Data; nothing has been computed yet. */
  function init() {
    store.current = null;
    return true;
  }

  /* build() — computes Statistics from current HistoryRuntime /
     WrongBookRuntime data and stores the snapshot. Always recomputes
     ("即時計算"); build() and refresh() are equivalent recompute
     operations — refresh() exists as the explicit "recompute now" verb. */
  function build() {
    store.current = computeAll();
    return clone(store.current);
  }

  function refresh() {
    return build();
  }

  /* get() — the last built/refreshed Statistics (Deep Clone), or null
     if build()/refresh() has never been called. */
  function get() {
    return store.current ? clone(store.current) : null;
  }

  /* getSubject(subject) — always computed fresh (independent of
     whether build() was called), so it reflects live data. Returns
     null if that subject has no History or WrongBook data at all. */
  function getSubject(subject) {
    var history = getHistory();
    var wrongBook = getWrongBook();
    var hasSubject = history.some(function (h) { return h.subject === subject; }) ||
      wrongBook.some(function (w) { return w.subject === subject; });
    if (!hasSubject) { return null; }
    return clone(subjectStatsFor(subject, history, wrongBook));
  }

  /* reset() — clears the stored snapshot (no Seed Data; does not touch
     HistoryRuntime / WrongBookRuntime themselves). */
  function reset() {
    return init();
  }

  return {
    init: init,
    build: build,
    refresh: refresh,
    get: get,
    getSubject: getSubject,
    reset: reset
  };
})();
