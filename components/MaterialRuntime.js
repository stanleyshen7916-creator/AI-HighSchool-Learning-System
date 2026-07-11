/* components/MaterialRuntime.js — Material Center Runtime Migration.
   PMO Decision (LOCKED, 2026-07-10): Material Center no longer uses
   AHS.Mock.materials as its runtime data source. This module is the
   Material-Center-only Runtime Memory — a plain in-memory store under
   the existing window.AHS namespace (NOT a new architecture / data
   layer; it is runtime state, the same shape of thing the spec says to
   "沿用 if exists, else build minimally for Material Center").

   - Starts EMPTY (no seed). First open => Empty State.
   - All Material Center operations (upload / delete / favorite / search
     / filter / sort) act on this store, never on AHS.Mock.
   - Memory only: no localStorage / API / backend. Resets on reload,
     which is expected Prototype behavior.
   - AHS.Mock.materials is kept untouched as Developer Seed Data and is
     still used by other modules (e.g. Home), which this migration must
     not affect.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialRuntime = (function () {
  "use strict";

  /* Material Center runtime store. `materials` grows via upload, shrinks
     via delete; `seq` gives a stable created-order id + ordering key
     (used by Recent Learning "Created Order" per spec). */
  var store = {
    materials: [],
    seq: 0
  };

  function list() {
    return store.materials.slice();
  }

  function isEmpty() {
    return store.materials.length === 0;
  }

  function getById(id) {
    for (var i = 0; i < store.materials.length; i++) {
      if (store.materials[i].id === id) { return store.materials[i]; }
    }
    return null;
  }

  /* add(partial) — build a material record from an uploaded file (or a
     partial object) and append it. Returns the created record.
     `order` is a monotonically increasing created-order key. */
  function add(partial) {
    store.seq += 1;
    var now = new Date();
    var record = {
      id: "rt_" + store.seq,
      order: store.seq,
      subject: partial.subject || "other",
      title: partial.title || "未命名教材",
      chapter: partial.chapter || "未分類",
      grade: partial.grade || "高一",
      date: partial.date || formatDate(now),
      views: partial.views || "0",
      content: partial.content || "",
      progress: typeof partial.progress === "number" ? partial.progress : 0,
      favorite: false,
      fileName: partial.fileName || "",
      fileType: partial.fileType || "FILE",
      fileSize: partial.fileSize || ""
    };
    store.materials.push(record);
    return record;
  }

  function remove(id) {
    var next = [];
    var removed = false;
    for (var i = 0; i < store.materials.length; i++) {
      if (store.materials[i].id === id) { removed = true; }
      else { next.push(store.materials[i]); }
    }
    store.materials = next;
    return removed;
  }

  function toggleFavorite(id) {
    var m = getById(id);
    if (!m) { return false; }
    m.favorite = !m.favorite;
    return m.favorite;
  }

  function favorites() {
    return store.materials.filter(function (m) { return m.favorite; });
  }

  /* recentByCreatedOrder() — newest-created first (spec: use Created
     Order while there is no full timestamp field). */
  function recentByCreatedOrder() {
    return store.materials.slice().sort(function (a, b) { return b.order - a.order; });
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  /* reset() — test helper; clears the store back to first-open state. */
  function reset() {
    store.materials = [];
    store.seq = 0;
  }

  return {
    list: list,
    isEmpty: isEmpty,
    getById: getById,
    add: add,
    remove: remove,
    toggleFavorite: toggleFavorite,
    favorites: favorites,
    recentByCreatedOrder: recentByCreatedOrder,
    reset: reset
  };
})();
