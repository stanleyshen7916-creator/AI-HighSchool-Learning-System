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
   - AHS.Mock.materials is kept untouched as Developer Seed Data and is
     still used by other modules (e.g. Home), which this migration must
     not affect.

   PMO Decision 025 · Architecture Evolution v2.0 (2026-07-20): the
   "Memory only, resets on reload" limitation above is now upgraded.
   This Runtime hydrates from AHS.PersistenceAdapter on module load and
   persists after every mutation, so data survives navigating to a
   different page within the same browser session — while still going
   through the Adapter only (never touching sessionStorage directly
   here), keeping this file's Public API and Schema unchanged. Still no
   localStorage / IndexedDB / backend — sessionStorage clears
   automatically when the browser session ends, exactly as authorized.
   `file` (a runtime-only File object reference, already documented
   below as "Not persisted") is stripped before every persist() call —
   File objects aren't meaningfully serializable, so after a fresh page
   load hydrates this store, `file` is legitimately null for materials
   uploaded in a previous page's session; every other field survives.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "materialRuntime";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.materials) && Array.isArray(loaded.folders)) {
        return loaded;
      }
    }
    return null;
  }

  /* persist() — saves a clone of `store` with each material's non-
     serializable `file` reference stripped (kept live in-memory only). */
  function persist() {
    if (!AHS.PersistenceAdapter || typeof AHS.PersistenceAdapter.save !== "function") { return; }
    var snapshot = {
      materials: store.materials.map(function (m) {
        var copy = {};
        for (var k in m) { if (Object.prototype.hasOwnProperty.call(m, k) && k !== "file") { copy[k] = m[k]; } }
        return copy;
      }),
      folders: store.folders.slice(),
      seq: store.seq,
      folderSeq: store.folderSeq
    };
    AHS.PersistenceAdapter.save(STORAGE_KEY, snapshot);
  }

  /* Material Center runtime store. `materials` grows via upload, shrinks
     via delete; `seq` gives a stable created-order id + ordering key
     (used by Recent Learning "Created Order" per spec). `folders` holds
     Folder containers (BUG-010); a Material references its folder via
     folderId (null = 未分類). Hydrated from a previous page's session
     if AHS.PersistenceAdapter has anything saved; otherwise starts
     EMPTY exactly as before (first-ever open => Empty State, unchanged). */
  var store = hydrate() || {
    materials: [],
    folders: [],
    seq: 0,
    folderSeq: 0
  };
  /* Every hydrated material's `file` is legitimately absent (never
     persisted) — normalize to null so downstream code that checks
     `m.file` behaves the same as any other fileless/seed-shaped record. */
  store.materials.forEach(function (m) { m.file = m.file || null; });

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
      chapter: partial.chapter || partial.category || "未分類",
      grade: partial.grade || "高一",
      category: partial.category || "其他",
      date: partial.date || formatDate(now),
      views: partial.views || "0",
      content: partial.content || "",
      progress: typeof partial.progress === "number" ? partial.progress : 0,
      /* RC-003-008 Learning Statistics (Learning Runtime). progress is the
         single source of truth for 0 未開始 / 1-99 學習中 / 100 已完成. */
      lastOpenedAt: partial.lastOpenedAt || null,
      lastLearningAt: partial.lastLearningAt || null,
      learningTime: typeof partial.learningTime === "number" ? partial.learningTime : 0,
      learningCount: typeof partial.learningCount === "number" ? partial.learningCount : 0,
      favorite: false,
      fileName: partial.fileName || "",
      fileType: partial.fileType || "FILE",
      fileSize: partial.fileSize || "",
      /* BUG-010: container reference; null = 未分類. */
      folderId: partial.folderId || null,
      /* runtime-only File reference for open/preview; null for
         seed-shaped or fileless records. Not persisted. */
      file: partial.file || null
    };
    store.materials.push(record);
    persist();
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
    persist();
    return removed;
  }

  function toggleFavorite(id) {
    var m = getById(id);
    if (!m) { return false; }
    m.favorite = !m.favorite;
    persist();
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

  /* ---- Folder API (BUG-010) ------------------------------------------
     Folder = Material Container (1 → N). Deleting a folder never deletes
     materials; it detaches them (folderId = null → 未分類). */
  function addFolder(partial) {
    store.folderSeq += 1;
    var now = new Date();
    var folder = {
      id: "fd_" + store.folderSeq,
      order: store.folderSeq,
      name: partial.name || "未命名資料夾",
      subject: partial.subject || "other",
      grade: partial.grade || "高一",
      defaultCategory: partial.defaultCategory || "",
      createdAt: partial.createdAt || formatDate(now),
      /* reserved (not implemented yet) */
      color: null,
      icon: null
    };
    store.folders.push(folder);
    persist();
    return folder;
  }

  function listFolders() {
    return store.folders.slice();
  }

  function getFolderById(id) {
    for (var i = 0; i < store.folders.length; i++) {
      if (store.folders[i].id === id) { return store.folders[i]; }
    }
    return null;
  }

  /* folderMaterialCount(folderId) — how many materials live in a folder. */
  function folderMaterialCount(folderId) {
    var n = 0;
    for (var i = 0; i < store.materials.length; i++) {
      if (store.materials[i].folderId === folderId) { n++; }
    }
    return n;
  }

  /* removeFolder(id) — detaches all its materials (folderId = null) then
     removes the folder. Returns true if a folder was removed. Materials
     are always preserved (BUG-010-007). */
  function removeFolder(id) {
    var found = false;
    for (var i = 0; i < store.folders.length; i++) {
      if (store.folders[i].id === id) { found = true; break; }
    }
    if (!found) { return false; }
    for (var j = 0; j < store.materials.length; j++) {
      if (store.materials[j].folderId === id) { store.materials[j].folderId = null; }
    }
    store.folders = store.folders.filter(function (f) { return f.id !== id; });
    persist();
    return true;
  }

  /* searchFolders(keyword) — folders whose name matches (BUG-010-005). */
  function searchFolders(keyword) {
    var k = String(keyword || "").trim().toLowerCase();
    if (!k) { return store.folders.slice(); }
    return store.folders.filter(function (f) {
      return String(f.name).toLowerCase().indexOf(k) !== -1;
    });
  }

  /* markPreviewed(id) — RC-003-006: preview only records lastOpenedAt.
     It must NOT change progress / learning stats. */
  function markPreviewed(id) {
    var m = getById(id);
    if (!m) { return null; }
    m.lastOpenedAt = new Date().toISOString();
    persist();
    return m;
  }

  /* startLearning(id, opts) — RC-003-005/006/008: a Learning Session.
     Updates lastLearningAt, learningCount, learningTime and advances
     progress. progress moves 0 → 學習中 → 100 (clamped). opts.minutes
     defaults to a small mock increment; opts.progress can set an
     explicit value. */
  function startLearning(id, opts) {
    var m = getById(id);
    if (!m) { return null; }
    opts = opts || {};
    m.lastLearningAt = new Date().toISOString();
    m.lastOpenedAt = m.lastLearningAt;
    m.learningCount = (m.learningCount || 0) + 1;
    m.learningTime = (m.learningTime || 0) + (typeof opts.minutes === "number" ? opts.minutes : 5);
    if (typeof opts.progress === "number") {
      m.progress = Math.max(0, Math.min(100, opts.progress));
    } else {
      /* Advance toward 100 in mock steps; first session leaves 學習中. */
      var next = (typeof m.progress === "number" ? m.progress : 0) + 25;
      m.progress = Math.max(1, Math.min(100, next));
    }
    persist();
    return m;
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  /* reset() — test helper; clears the store back to first-open state. */
  function reset() {
    store.materials = [];
    store.folders = [];
    store.seq = 0;
    store.folderSeq = 0;
    persist();
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
    markPreviewed: markPreviewed,
    startLearning: startLearning,
    addFolder: addFolder,
    listFolders: listFolders,
    getFolderById: getFolderById,
    folderMaterialCount: folderMaterialCount,
    removeFolder: removeFolder,
    searchFolders: searchFolders,
    reset: reset
  };
})();
