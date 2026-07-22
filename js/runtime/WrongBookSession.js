/* js/runtime/WrongBookSession.js — Sprint 7.0 · EO-S7.0-001
   Wrong Book Intelligence Foundation — Session Runtime v1.0.

   Naming: NEW module alongside the legacy Sprint-4 WrongBookRuntime.js
   (LOCK, untouched) — same parallel-naming precedent as
   LearningQuestionSession (PMO Ruling 1B, EO-S6.9-001).

   Fixed contents (EO): Wrong Question List / Statistics / Metadata /
   Status. Explicitly NOT here: Review Logic, Practice Logic, AI Logic —
   no scheduling, no grading, no inference; store & query only.

   Write path: store(record, validateFn) and removeById(id) are called
   by AHS.WrongBookGenerator ONLY (the Interface is the sole writer by
   architecture — no other module calls these). store() re-runs the
   Interface's validate() as its own Runtime-Validation gate, so an
   invalid record can never be persisted even if a future caller
   misbehaves ("Validation Failed 不得寫入"). Status is derived
   ("empty" | "ready") and cannot be set — it cannot lie.

   Persists via PersistenceAdapter only (PMO Decision 025), storage key
   "wrongBookSession" — fully isolated from the legacy wrongbook data
   and from every other Runtime (QA-proven zero cross-writes). */
window.AHS = window.AHS || {};
AHS.WrongBookSession = (function () {
  "use strict";

  var STORAGE_KEY = "wrongBookSession";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.items) && loaded.metadata && typeof loaded.metadata === "object") {
        return loaded;
      }
    }
    return null;
  }

  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }

  var store = hydrate() || { items: [], metadata: {} };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  /* ---- Store (Interface-driven, validate-gated) ------------------------- */
  function storeRecord(record, validateFn) {
    var gate = validateFn ||
      (AHS.WrongBookGenerator && AHS.WrongBookGenerator.validate);
    if (typeof gate !== "function") { return null; }
    var check = gate(record);
    if (!check.valid) { return null; }

    var copy = clone(record);
    var replaced = false;
    store.items = store.items.map(function (item) {
      if (item.id === copy.id) { replaced = true; return copy; }
      return item;
    });
    if (!replaced) { store.items.push(copy); }
    persist();
    return clone(copy);
  }

  function removeById(id) {
    var before = store.items.length;
    store.items = store.items.filter(function (i) { return i.id !== id; });
    var removed = store.items.length !== before;
    if (removed) { persist(); }
    return removed;
  }

  /* ---- Wrong Question List ----------------------------------------------- */
  function list() { return clone(store.items); }
  function count() { return store.items.length; }
  function isEmpty() { return store.items.length === 0; }
  function getById(id) {
    var found = null;
    store.items.forEach(function (i) { if (i.id === id) { found = i; } });
    return found ? clone(found) : null;
  }
  function getByQuestionId(questionId) {
    var found = null;
    store.items.forEach(function (i) { if (i.questionId === questionId) { found = i; } });
    return found ? clone(found) : null;
  }
  function findBySubject(subject) {
    return clone(store.items.filter(function (i) { return i.subject === subject; }));
  }
  function findByStatus(status) {
    return clone(store.items.filter(function (i) { return i.status === status; }));
  }

  /* ---- Statistics (derived on demand — never stored, never stale) -------- */
  function statistics() {
    var bySubject = {}, byMastery = {}, byStatus = {};
    var totalWrong = 0;
    store.items.forEach(function (i) {
      bySubject[i.subject] = (bySubject[i.subject] || 0) + 1;
      byMastery[i.masteryLevel] = (byMastery[i.masteryLevel] || 0) + 1;
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
      totalWrong += i.wrongCount;
    });
    return { total: store.items.length, totalWrongCount: totalWrong, bySubject: bySubject, byMastery: byMastery, byStatus: byStatus };
  }

  /* ---- Metadata / Status --------------------------------------------------- */
  function getMetadata() { return clone(store.metadata); }
  function setMetadata(patch) {
    patch = (patch && typeof patch === "object" && !Array.isArray(patch)) ? patch : {};
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) { store.metadata[k] = patch[k]; }
    }
    persist();
    return clone(store.metadata);
  }
  function getStatus() { return store.items.length === 0 ? "empty" : "ready"; }

  function reset() { store = { items: [], metadata: {} }; persist(); }

  return {
    store: storeRecord,
    removeById: removeById,
    list: list,
    count: count,
    isEmpty: isEmpty,
    getById: getById,
    getByQuestionId: getByQuestionId,
    findBySubject: findBySubject,
    findByStatus: findByStatus,
    statistics: statistics,
    getMetadata: getMetadata,
    setMetadata: setMetadata,
    getStatus: getStatus,
    reset: reset
  };
})();
