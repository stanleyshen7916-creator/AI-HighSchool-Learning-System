/* js/runtime/WrongBookRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   WrongBookRuntime is the Quiz-Runtime-driven 錯題 store, following the
   same pattern already locked by AHS.MaterialRuntime: a plain in-memory
   store under window.AHS, starting EMPTY (no seed). It grows only via
   sync(gradedResult) — called after AutoGrader.grade() — never by
   reading AHS.Mock.wrongBook. AHS.Mock.wrongBook is left untouched as
   Developer Seed Data / static UI reference for the existing
   WrongBook.js page and is not read by this Runtime.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.WrongBookRuntime = (function () {
  "use strict";

  var store = { items: [], seq: 0 };

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
        touched.push(existing);
      } else {
        store.seq += 1;
        var record = {
          id: "wb_" + store.seq,
          questionId: w.questionId,
          subject: gradedResult.subject,
          title: gradedResult.title,
          chapter: gradedResult.chapter,
          knowledgePoint: w.knowledgePoint,
          question: w.text,
          options: w.options,
          yourAnswer: w.yourAnswer,
          correctAnswer: w.correctAnswer,
          explanation: w.explanation,
          errorCount: 1,
          lastError: formatDate(now),
          bookmarked: false
        };
        store.items.push(record);
        touched.push(record);
      }
    });
    return clone(touched);
  }

  function toggleBookmark(id) {
    for (var i = 0; i < store.items.length; i++) {
      if (store.items[i].id === id) {
        store.items[i].bookmarked = !store.items[i].bookmarked;
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
  }

  return {
    list: list,
    isEmpty: isEmpty,
    getById: getById,
    sync: sync,
    toggleBookmark: toggleBookmark,
    reset: reset
  };
})();
