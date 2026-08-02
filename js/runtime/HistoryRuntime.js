/* js/runtime/HistoryRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   HistoryRuntime.record() appends one finished-exam summary to a
   history list (same "starts empty, grows at runtime" store pattern as
   AHS.MaterialRuntime / AHS.WrongBookRuntime). StatisticsRuntime reads
   this list to compute overview stats and subject accuracy —
   HistoryRuntime itself does no aggregation, it only stores.

   Sprint AI-109 AI-602 (Runtime Integration): now hydrates from/persists
   to AHS.PersistenceAdapter, same pattern as WrongBookRuntime's own
   AI-601 fix — a real finished exam previously vanished the moment the
   user navigated away from quiz.html (no persistence anywhere in this
   file), so "測驗次數/最高分/歷史紀錄" could never actually accumulate
   across a real multi-page session. Public API (record/list/count/reset)
   and every field's shape are unchanged. */
window.AHS = window.AHS || {};
AHS.HistoryRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "historyRuntime";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.items)) { return loaded; }
    }
    return null;
  }

  function persist() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.save !== "function") { return; }
    AHS.PersistenceAdapter.save(STORAGE_KEY, store);
  }

  var store = hydrate() || { items: [], seq: 0 };

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
    persist();
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
    persist();
  }

  return { record: record, list: list, count: count, reset: reset };
})();
