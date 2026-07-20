/* js/runtime/SummaryRuntime.js — Sprint 6 · EO-S6-003 Summary Generator
   Foundation.

   Scope: Store / Query / Sync only — never generates a Question, never
   calls an AI API, never touches UI. Intended as Summary Center's
   eventual sole data source, per EO-S6-003's Background, but nothing
   reads from it yet this EO (Do NOT Modify: every existing page,
   including Summary Center's current Mock-driven implementation from
   Sprint 5 — this Runtime is not wired into summary.html this EO).

   sync(knowledge) is the bridge from EO-S6-002's Knowledge Runtime
   record to this Runtime: it delegates the actual transformation to
   AHS.SummaryGenerator.generate() (js/services/SummaryGenerator.js, not
   modified by this file) and stores the result — this Runtime does not
   itself generate any summary content, keeping "Knowledge Runtime ->
   Summary Runtime 轉換" (Generator's job) and "Store/Query/Sync" (this
   Runtime's job) cleanly separated. add(record) is also exposed for
   storing an already-generated record directly (mirrors every other
   Runtime's add()-style API in this repo).

   Summary Runtime schema (fixed, per EO-S6-003):
     { id, materialId, subject, grade, chapter, section, title,
       coreConcepts:[], definitions:[], pitfalls:[], memorize:[],
       reviewSuggestions:[], generatedAt }

   Session-scoped, in-memory only (store starts empty — same convention
   as every other Runtime in this repo). No Storage, no fetch/XHR, no
   ES module.

   PMO Decision 025 · Architecture Evolution v2.0 (2026-07-20): hydrates
   from AHS.PersistenceAdapter on module load and persists after every
   write, so data survives navigating to a different page within the
   same browser session. Only ever goes through the Adapter (never
   touches sessionStorage directly) — Public API and Schema unchanged.
   PascalCase module under window.AHS, consistent with every existing
   Runtime in this repo. */
window.AHS = window.AHS || {};
AHS.SummaryRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "summaryRuntime";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.items) && typeof loaded.seq === "number") { return loaded; }
    }
    return null;
  }

  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }

  var store = hydrate() || { items: [], seq: 0 };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  function nextId() {
    store.seq += 1;
    return "sr_" + store.seq;
  }

  /* ---- Store -------------------------------------------------------------
     add(record) — stores an already-generated Summary record. Fills in
     id/generatedAt if missing so it never throws on a partial record;
     does not otherwise validate shape (that's AHS.SummaryGenerator's
     validate(), a separate concern). Returns a clone of the stored
     record. */
  function add(record) {
    record = record || {};
    var stored = {
      id: record.id || nextId(),
      materialId: record.materialId || null,
      subject: record.subject || null,
      grade: record.grade || null,
      chapter: record.chapter || "",
      section: record.section || "",
      title: record.title || "",
      coreConcepts: Array.isArray(record.coreConcepts) ? record.coreConcepts.slice() : [],
      definitions: Array.isArray(record.definitions) ? record.definitions.slice() : [],
      pitfalls: Array.isArray(record.pitfalls) ? record.pitfalls.slice() : [],
      memorize: Array.isArray(record.memorize) ? record.memorize.slice() : [],
      reviewSuggestions: Array.isArray(record.reviewSuggestions) ? record.reviewSuggestions.slice() : [],
      generatedAt: record.generatedAt || formatDate(new Date())
    };
    store.items.push(stored);
    persist();
    return clone(stored);
  }

  /* ---- Sync ---------------------------------------------------------------
     sync(knowledge) — the Knowledge Runtime -> Summary Runtime bridge.
     Delegates the transform to AHS.SummaryGenerator.generate(); never
     throws even if that module isn't loaded (defensive check),
     satisfying "所有 API 皆需可正常呼叫". */
  function sync(knowledge) {
    if (!AHS.SummaryGenerator || typeof AHS.SummaryGenerator.generate !== "function") {
      return null;
    }
    var generated = AHS.SummaryGenerator.generate(knowledge);
    return add(generated);
  }

  /* ---- Query --------------------------------------------------------- */

  function list() {
    return clone(store.items);
  }

  function isEmpty() {
    return store.items.length === 0;
  }

  function getById(id) {
    var found = null;
    store.items.forEach(function (item) { if (item.id === id) { found = item; } });
    return found ? clone(found) : null;
  }

  function findByMaterialId(materialId) {
    return clone(store.items.filter(function (item) { return item.materialId === materialId; }));
  }

  function findBySubject(subject) {
    return clone(store.items.filter(function (item) { return item.subject === subject; }));
  }

  /* reset() — test helper; clears the store back to first-open state. */
  function reset() {
    store = { items: [], seq: 0 };
    persist();
  }

  return {
    add: add,
    sync: sync,
    list: list,
    isEmpty: isEmpty,
    getById: getById,
    findByMaterialId: findByMaterialId,
    findBySubject: findBySubject,
    reset: reset
  };
})();
