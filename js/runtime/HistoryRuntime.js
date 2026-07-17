/* js/runtime/HistoryRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   HistoryRuntime.record() appends one finished-exam summary to an
   in-memory history list (same "starts empty, grows at runtime" store
   pattern as AHS.MaterialRuntime / AHS.WrongBookRuntime). StatisticsRuntime
   reads this list to compute overview stats and subject accuracy —
   HistoryRuntime itself does no aggregation, it only stores.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.HistoryRuntime = (function () {
  "use strict";

  var store = { items: [], seq: 0 };

  /* record(gradedResult) — gradedResult is an AutoGrader result.
     Returns the created history record (clone). */
  function record(gradedResult) {
    if (!gradedResult) { return null; }
    store.seq += 1;
    var entry = {
      id: "hist_" + store.seq,
      order: store.seq,
      examId: gradedResult.examId,
      subject: gradedResult.subject,
      title: gradedResult.title,
      chapter: gradedResult.chapter,
      score: gradedResult.score,
      accuracy: gradedResult.accuracy,
      correctCount: gradedResult.correctCount,
      totalCount: gradedResult.totalCount,
      when: formatWhen(new Date())
    };
    store.items.push(entry);
    return clone(entry);
  }

  function list() {
    return store.items.slice().sort(function (a, b) { return b.order - a.order; }).map(clone);
  }

  function count() {
    return store.items.length;
  }

  function formatWhen(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* reset() — test helper. */
  function reset() {
    store = { items: [], seq: 0 };
  }

  return { record: record, list: list, count: count, reset: reset };
})();
