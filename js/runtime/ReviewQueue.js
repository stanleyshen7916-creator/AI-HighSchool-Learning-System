/* js/runtime/ReviewQueue.js — Sprint 7.0 · EO-S7.0-001
   Review Queue Foundation v1.0 (Foundation Only).

   Fixed entry shape (nothing more): { questionId, nextReviewAt,
   priority, masteryLevel }. This Runtime STORES the queue — it never
   generates reviews, never schedules anything, never computes
   nextReviewAt (caller-supplied or null), never infers priority or
   mastery. The legacy Sprint-5 ReviewRuntime (LOCK) is untouched and
   unrelated.

   enqueue() is validate-gated: questionId required and must reference
   a real Wrong Book entry in WrongBookSession (read-only check — a
   queue entry for a nonexistent wrong question is fabrication and is
   rejected); masteryLevel must be within the fixed Mastery Model enum;
   priority must be a finite number when provided. Persists via
   PersistenceAdapter only, key "reviewQueue". */
window.AHS = window.AHS || {};
AHS.ReviewQueue = (function () {
  "use strict";

  var STORAGE_KEY = "reviewQueue";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.entries)) { return loaded; }
    }
    return null;
  }
  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }
  var store = hydrate() || { entries: [] };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function validateEntry(entry) {
    var errors = [];
    entry = entry || {};
    if (!entry.questionId) { errors.push("缺少：questionId"); }
    var wb = AHS.WrongBookSession;
    if (entry.questionId && wb && typeof wb.getByQuestionId === "function" &&
        !wb.getByQuestionId(entry.questionId)) {
      errors.push("questionId 未對應任何錯題紀錄（不得直接產生 Review）");
    }
    var levels = (AHS.WrongBookGenerator && AHS.WrongBookGenerator.MASTERY_LEVELS) ||
                 ["new", "learning", "reviewing", "mastered"];
    if (levels.indexOf(entry.masteryLevel) === -1) { errors.push("masteryLevel 不合法"); }
    if (entry.priority !== undefined && entry.priority !== null &&
        (typeof entry.priority !== "number" || !isFinite(entry.priority))) {
      errors.push("priority 必須為數字");
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function enqueue(entry) {
    var check = validateEntry(entry);
    if (!check.valid) { return null; }
    var stored = {
      questionId: entry.questionId,
      nextReviewAt: entry.nextReviewAt || null,   /* 不得自動排程 */
      priority: (typeof entry.priority === "number") ? entry.priority : 0,
      masteryLevel: entry.masteryLevel
    };
    /* One queue entry per questionId — re-enqueue replaces. */
    store.entries = store.entries.filter(function (e) { return e.questionId !== stored.questionId; });
    store.entries.push(stored);
    persist();
    return clone(stored);
  }

  function list() { return clone(store.entries); }
  function count() { return store.entries.length; }
  function getByQuestionId(questionId) {
    var found = null;
    store.entries.forEach(function (e) { if (e.questionId === questionId) { found = e; } });
    return found ? clone(found) : null;
  }
  function remove(questionId) {
    var before = store.entries.length;
    store.entries = store.entries.filter(function (e) { return e.questionId !== questionId; });
    var removed = store.entries.length !== before;
    if (removed) { persist(); }
    return removed;
  }
  function reset() { store = { entries: [] }; persist(); }

  return {
    enqueue: enqueue,
    validateEntry: validateEntry,
    list: list,
    count: count,
    getByQuestionId: getByQuestionId,
    remove: remove,
    reset: reset
  };
})();
