/* js/core/PersistenceAdapter.js — PMO Decision 025 · Architecture
   Evolution v2.0 — Runtime Persistence Layer.

   UI -> Runtime -> Persistence Adapter -> sessionStorage

   This is the ONLY module in the repository allowed to touch
   window.sessionStorage directly. Every Runtime that persists data goes
   through this Adapter's save()/load()/remove() — never sessionStorage
   itself — so a future swap to Cloud Storage / a backend only requires
   replacing THIS file's internals; no Runtime's Public API or Schema
   needs to change.

   Explicitly still forbidden (per PMO Decision 025's 保留限制, unchanged
   by this Adapter): localStorage, IndexedDB, Backend, Cloud API. This
   file uses sessionStorage only — data survives page navigation within
   the same browser tab/session, and is automatically cleared when the
   browser session ends (tab/browser closed), exactly matching the
   authorized "sessionStorage 作為第一階段 Persistence Provider" scope.

   Fails safe: if sessionStorage is unavailable (privacy mode, quota
   exceeded, disabled, or simply absent in a non-browser context), every
   method degrades to a silent no-op / null return rather than throwing
   — Runtimes fall back to their existing in-memory-only behavior
   exactly as before this Architecture Evolution, so nothing regresses
   even in environments where sessionStorage can't be used.
   PascalCase module under window.AHS, consistent with every existing
   module in this repo. */
window.AHS = window.AHS || {};
AHS.PersistenceAdapter = (function () {
  "use strict";

  var PREFIX = "ahs:";
  var availableCache = null;

  function isAvailable() {
    if (availableCache !== null) { return availableCache; }
    try {
      var testKey = PREFIX + "__probe__";
      window.sessionStorage.setItem(testKey, "1");
      window.sessionStorage.removeItem(testKey);
      availableCache = true;
    } catch (e) {
      availableCache = false;
    }
    return availableCache;
  }

  /* save(key, value) — JSON-serializes `value` and stores it under a
     namespaced key. Returns true on success, false on any failure
     (unavailable storage, quota exceeded, non-serializable value) —
     never throws. */
  function save(key, value) {
    if (!key || !isAvailable()) { return false; }
    try {
      window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* load(key) — returns the parsed value, or null if the key doesn't
     exist, storage is unavailable, or the stored value is corrupt JSON
     (defensive against a hand-edited or partially-written value) —
     never throws. */
  function load(key) {
    if (!key || !isAvailable()) { return null; }
    try {
      var raw = window.sessionStorage.getItem(PREFIX + key);
      if (raw === null) { return null; }
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function remove(key) {
    if (!key || !isAvailable()) { return; }
    try { window.sessionStorage.removeItem(PREFIX + key); } catch (e) { /* no-op */ }
  }

  /* clear() — removes every AHS-namespaced key (used by Runtime reset()
     helpers so persisted state and in-memory state stay in sync). Never
     touches keys outside the "ahs:" namespace. */
  function clear() {
    if (!isAvailable()) { return; }
    try {
      var toRemove = [];
      for (var i = 0; i < window.sessionStorage.length; i += 1) {
        var k = window.sessionStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) { toRemove.push(k); }
      }
      toRemove.forEach(function (k) { window.sessionStorage.removeItem(k); });
    } catch (e) { /* no-op */ }
  }

  return {
    save: save,
    load: load,
    remove: remove,
    clear: clear,
    isAvailable: isAvailable
  };
})();
