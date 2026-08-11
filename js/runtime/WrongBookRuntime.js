/* js/runtime/WrongBookRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   WrongBookRuntime is the Quiz-Runtime-driven 錯題 store, following the
   same pattern already locked by AHS.MaterialRuntime: a store under
   window.AHS, starting EMPTY (no seed). It grows only via
   sync(gradedResult) — called after AutoGrader.grade() — never by
   reading AHS.Mock.wrongBook. AHS.Mock.wrongBook is left untouched as
   Developer Seed Data / static UI reference for the existing
   WrongBook.js page and is not read by this Runtime.

   Sprint AI-109 AI-601 (Runtime Integration, root cause fix): this store
   was plain in-memory only, with no AHS.PersistenceAdapter hydrate/
   persist calls anywhere in this file — every other page-navigation in
   this multi-page app re-evaluates this IIFE from scratch, so a real
   wrong answer recorded via sync() on quiz.html was silently lost the
   moment the user navigated to wrongbook.html (a genuine "Runtime
   island" at the page-navigation boundary, not just a same-page
   nice-to-have). Fixed with the exact same hydrate()/persist() pattern
   AHS.MaterialRuntime/AHS.SummaryRuntime already use — same Public API
   (list/isEmpty/getById/sync/toggleBookmark/reset), same field shape,
   nothing renamed or removed; only real state now survives navigation
   within the same browser session, exactly like every other Runtime
   this app already trusts sessionStorage for. */
window.AHS = window.AHS || {};
AHS.WrongBookRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "wrongBookRuntime";

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

  function list() {
    return clone(store.items);
  }

  function isEmpty() {
    return store.items.length === 0;
  }

  function getById(id) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) { return clone(store.items[i]); }
    }
    return null;
  }

  function findExisting(questionId) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].questionId === questionId) { return store.items[i]; }
    }
    return null;
  }

  /* sync(gradedResult) — gradedResult is an AutoGrader result. Every
     wrong answer becomes (or updates) a wrong-book entry: a repeated
     miss on the same question bumps errorCount instead of duplicating.
     Returns the list of entries touched by this sync (clone). */
  function sync(gradedResult) {
    if (!gradedResult || !gradedResult.wrong) { return []; }
    var touched = [];
    gradedResult.wrong.forEach(function (w) {
      var existing = findExisting(w.questionId);
      var now = new Date();
      if (existing) {
        existing.errorCount += 1;
        existing.lastError = formatDate(now);
        existing.yourAnswer = w.yourAnswer;
        /* AI-610 (Sprint AI-111): missing it again for real resets real
           progress toward 已精熟 — same rule recordRetry() applies below,
           kept consistent here so sync() and recordRetry() never disagree
           on what "wrong again" means. */
        existing.correctStreak = 0;
        touched.push(existing);
      } else {
        store.seq += 1;
        var record = {
          id: "wb_" + store.seq,
          questionId: w.questionId,
          subject: gradedResult.subject,
          title: gradedResult.title,
          chapter: gradedResult.chapter,
          /* AI-601: real material-source link — w.materialId comes
             straight from the question record's own, already-real
             materialId field (see AutoGrader.js's own additive change),
             never fabricated; "" when the source question genuinely has
             none (e.g. a Mock/QuestionBank-generated Exam Mode question
             with no material behind it). */
          materialId: w.materialId || "",
          knowledgePoint: w.knowledgePoint,
          question: w.text,
          options: w.options,
          yourAnswer: w.yourAnswer,
          correctAnswer: w.correctAnswer,
          explanation: w.explanation,
          errorCount: 1,
          lastError: formatDate(now),
          bookmarked: false,
          /* AI-610: real, persisted retry progress — see recordRetry()
             below. 0 = never retried correctly since the last miss. */
          correctStreak: 0
        };
        store.items.push(record);
        touched.push(record);
      }
    });
    persist();
    return clone(touched);
  }

  /* recordRetry(id, wasCorrect) — Sprint AI-111 AI-610: real, persisted
     retry lifecycle. WrongBook.js's 立即重做 (re-answer) flow previously
     only advanced a session-scoped, in-memory-only `masteryTracker` local
     to that one file — invisible to any other page/Runtime and lost on
     reload, so "答對 → 更新 WrongBookRuntime → 同步 Review/Statistics"
     never actually happened. A correct retry now advances the record's
     own real correctStreak (persisted); a wrong retry (sync() already
     bumped errorCount/lastError above) resets it to 0 here too, so both
     entry points agree. AHS.StatisticsRuntime derives 已完成複習/今日待
     複習 straight from this real field — no second, parallel "mastery"
     store anywhere. Additive function; sync/toggleBookmark/reset/etc. are
     unchanged. */
  function recordRetry(id, wasCorrect) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) {
        store.items[i].correctStreak = wasCorrect ? (store.items[i].correctStreak || 0) + 1 : 0;
        persist();
        return clone(store.items[i]);
      }
    }
    return null;
  }

  function toggleBookmark(id) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) {
        store.items[i].bookmarked = !store.items[i].bookmarked;
        persist();
        return store.items[i].bookmarked;
      }
    }
    return false;
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* reset() — test helper; clears back to first-open state. */
  function reset() {
    store = { items: [], seq: 0 };
    persist();
  }

  return {
    list: list,
    isEmpty: isEmpty,
    getById: getById,
    sync: sync,
    recordRetry: recordRetry,
    toggleBookmark: toggleBookmark,
    reset: reset
  };
})();
