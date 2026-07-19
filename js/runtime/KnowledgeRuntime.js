/* js/runtime/KnowledgeRuntime.js — Sprint 6 · EO-S6-002 Knowledge
   Builder Foundation.

   Scope: 儲存 (store) / 查詢 (query) / 同步 (sync) only — never
   generates a Summary, never generates a Question, never calls an AI
   API, never touches UI. This is intended as the system's eventual
   Single Source of Truth for knowledge, per EO-S6-002's Background, but
   nothing reads from it yet this EO (Do NOT Modify: every existing page).

   sync(materialDocument) is the bridge from EO-S6-001's Material
   Document to this Runtime: it delegates the actual transformation to
   AHS.KnowledgeBuilder.build() (js/services/KnowledgeBuilder.js, not
   modified by this file) and stores the result — this Runtime does not
   itself parse or extract anything, keeping "建立知識結構" (Builder's
   job) and "儲存/查詢/同步" (this Runtime's job) cleanly separated.
   add(record) is also exposed for storing an already-built record
   directly (mirrors every other Runtime's add()-style API in this
   repo, e.g. WrongBookRuntime, MaterialRuntime).

   Knowledge Runtime schema (fixed, per EO-S6-002):
     { id, materialId, subject, grade, chapter, section, title,
       concepts:[], keywords:[], definitions:[], formulas:[],
       examples:[], exercises:[], metadata:{}, createdAt }

   Session-scoped, in-memory only (store starts empty — same convention
   as every other Runtime in this repo, e.g. WrongBookRuntime/
   HistoryRuntime "starting empty is expected behavior", R3 precedent).
   No Storage, no fetch/XHR, no ES module.
   PascalCase module under window.AHS, consistent with every existing
   Runtime in this repo. */
window.AHS = window.AHS || {};
AHS.KnowledgeRuntime = (function () {
  "use strict";

  var store = { items: [], seq: 0 };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  function nextId() {
    store.seq += 1;
    return "kr_" + store.seq;
  }

  /* ---- 儲存 (store) ------------------------------------------------------ */

  /* add(record) — stores an already-built Knowledge record. Fills in
     id/createdAt if missing so it never throws on a partial record;
     does not otherwise validate shape (that's AHS.KnowledgeBuilder's
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
      concepts: Array.isArray(record.concepts) ? record.concepts.slice() : [],
      keywords: Array.isArray(record.keywords) ? record.keywords.slice() : [],
      definitions: Array.isArray(record.definitions) ? record.definitions.slice() : [],
      formulas: Array.isArray(record.formulas) ? record.formulas.slice() : [],
      examples: Array.isArray(record.examples) ? record.examples.slice() : [],
      exercises: Array.isArray(record.exercises) ? record.exercises.slice() : [],
      metadata: (record.metadata && typeof record.metadata === "object") ? record.metadata : {},
      createdAt: record.createdAt || formatDate(new Date())
    };
    store.items.push(stored);
    return clone(stored);
  }

  /* ---- 同步 (sync) -------------------------------------------------------
     sync(materialDocument) — the Material Document -> Knowledge Runtime
     bridge. Delegates the transform to AHS.KnowledgeBuilder.build();
     never throws even if that module isn't loaded (defensive check),
     satisfying "所有 API 皆需可正常呼叫". */
  function sync(materialDocument) {
    if (!AHS.KnowledgeBuilder || typeof AHS.KnowledgeBuilder.build !== "function") {
      return null;
    }
    var built = AHS.KnowledgeBuilder.build(materialDocument);
    return add(built);
  }

  /* ---- 查詢 (query) ------------------------------------------------------ */

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
