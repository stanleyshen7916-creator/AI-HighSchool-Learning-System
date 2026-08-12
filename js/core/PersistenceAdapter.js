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
   module in this repo.

   Sprint AI-119 (Platform Core Baseline) §11 "Learning State：依
   Workspace 完全隔離": save()/load()/remove() now insert the active
   Workspace's storage namespace (AHS.WorkspaceRuntime.storageNamespace())
   between the fixed "ahs:" prefix and the caller's own key — with ZERO
   code change required in any of this repo's Runtime files, since they
   already only ever call save(key, ...)/load(key)/remove(key) with
   their own fixed short key name. When no Workspace is active yet
   (AHS.WorkspaceRuntime not loaded on a given page, or no real Login has
   happened — e.g. every pre-Sprint-AI-119 automated test, which never
   establishes a Workspace) the namespace is simply "", so the exact
   legacy unprefixed key is used — 100% backward compatible, not an
   approximation: hundreds of pre-existing jsdom/regression/Playwright
   checks that seed sessionStorage with literal keys like
   "ahs:materialRuntime" keep passing unmodified. Once a real Login sets
   a Workspace, every subsequent read/write for every Runtime becomes
   isolated per Workspace automatically. */
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

  /* namespace() — the active Workspace's storage namespace, or "" when
     none is active. Never throws even if AHS.WorkspaceRuntime isn't
     loaded on a given page (this file loads before it in every page's
     own script order, per CLAUDE.md's core -> data/utils -> runtime
     convention, so this lazy runtime-time lookup — not a load-time
     dependency — is required, not just defensive). */
  function namespace() {
    if (!AHS.WorkspaceRuntime || typeof AHS.WorkspaceRuntime.storageNamespace !== "function") { return ""; }
    try { return AHS.WorkspaceRuntime.storageNamespace() || ""; } catch (e) { return ""; }
  }

  function effectiveKey(key) {
    var ns = namespace();
    return ns ? PREFIX + ns + ":" + key : PREFIX + key;
  }

  /* save(key, value) — JSON-serializes `value` and stores it under a
     namespaced key. Returns true on success, false on any failure
     (unavailable storage, quota exceeded, non-serializable value) —
     never throws. */
  function save(key, value) {
    if (!key || !isAvailable()) { return false; }
    try {
      window.sessionStorage.setItem(effectiveKey(key), JSON.stringify(value));
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
      var raw = window.sessionStorage.getItem(effectiveKey(key));
      if (raw === null) { return null; }
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function remove(key) {
    if (!key || !isAvailable()) { return; }
    try { window.sessionStorage.removeItem(effectiveKey(key)); } catch (e) { /* no-op */ }
  }

  /* saveGlobal/loadGlobal/removeGlobal — bypass Workspace namespacing
     entirely. Reserved for exactly one caller: the Workspace pointer
     itself (AHS.WorkspaceRuntime) — namespacing the key that DEFINES the
     namespace would be circular. Everything else, including
     AHS.SettingsRuntime's own preferences, still goes through the
     regular save()/load()/remove() and is namespaced per-Workspace like
     any other Runtime — simpler than carving out a second "which state
     counts as Learning State" list, and arguably more correct (a
     display name/grade is plausibly per-Student anyway). */
  function saveGlobal(key, value) {
    if (!key || !isAvailable()) { return false; }
    try {
      window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadGlobal(key) {
    if (!key || !isAvailable()) { return null; }
    try {
      var raw = window.sessionStorage.getItem(PREFIX + key);
      if (raw === null) { return null; }
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function removeGlobal(key) {
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

  /* splitKey(fullKey) — fullKey always starts with PREFIX (caller already
     checked). Every real STORAGE_KEY constant in this repo is a single
     camelCase word (no colons), so "does the remainder after PREFIX
     contain a colon" reliably tells a namespaced key
     ("ns:shortKey") apart from a *Global one ("shortKey") without
     needing a second marker. */
  function splitKey(fullKey) {
    var remainder = fullKey.slice(PREFIX.length);
    var idx = remainder.indexOf(":");
    if (idx === -1) { return { ns: "", shortKey: remainder }; }
    return { ns: remainder.slice(0, idx), shortKey: remainder.slice(idx + 1) };
  }

  /* exportAll() — Sprint AI-113 AI-804 (Settings: Backup/Export). Real
     snapshot of every AHS-namespaced key, prefix stripped, values
     already-parsed (so a caller can JSON.stringify the whole object for
     a downloadable file). Read-only, never mutates storage.

     Sprint AI-119: scoped to the CURRENTLY ACTIVE Workspace's own keys
     only (plus the *Global keys when no Workspace is active) — exporting
     every Workspace's data indiscriminately, then blindly replaying it
     through save() on import (which re-applies whatever Workspace is
     active AT IMPORT TIME), would either leak one Workspace's data into
     another or double-namespace an already-namespaced key. Scoping both
     sides to "current Workspace only" keeps Export/Import exactly as
     correct as it was pre-Sprint-AI-119 (when there was only ever one
     implicit, global Workspace). */
  function exportAll() {
    var out = {};
    if (!isAvailable()) { return out; }
    var ns = namespace();
    try {
      for (var i = 0; i < window.sessionStorage.length; i += 1) {
        var k = window.sessionStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) {
          var parsed = splitKey(k);
          if (parsed.ns !== ns) { continue; }
          try { out[parsed.shortKey] = JSON.parse(window.sessionStorage.getItem(k)); }
          catch (e) { /* skip one corrupt entry, keep the rest */ }
        }
      }
    } catch (e) { /* no-op */ }
    return out;
  }

  /* importAll(data) — Sprint AI-113 AI-804 (Settings: Restore/Import).
     Writes each key back through save() (same validation/serialization
     path as every other write). Returns the count actually written.
     Never clears first — caller decides clear()-then-import (replace)
     vs. import-only (merge on top of existing keys). */
  function importAll(data) {
    if (!data || typeof data !== "object") { return 0; }
    var count = 0;
    Object.keys(data).forEach(function (k) {
      if (save(k, data[k])) { count += 1; }
    });
    return count;
  }

  return {
    save: save,
    load: load,
    remove: remove,
    clear: clear,
    isAvailable: isAvailable,
    exportAll: exportAll,
    importAll: importAll,
    saveGlobal: saveGlobal,
    loadGlobal: loadGlobal,
    removeGlobal: removeGlobal
  };
})();
