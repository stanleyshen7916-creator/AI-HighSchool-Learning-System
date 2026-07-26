/* ai-engine/src/knowledge/KnowledgeCache.js — EO-AI-003 · Knowledge Engine Foundation
   EO-AI-004 · Knowledge Runtime Integration (Cache Extension)
   Pure in-memory cache. No localStorage, no IndexedDB, no persistence
   of any kind — state lives only for the lifetime of this instance.
   set/get/has/remove/clear are unchanged from EO-AI-003; invalidate()
   is additive. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function KnowledgeCache() {
    this._store = {};
  }

  KnowledgeCache.prototype.set = function (key, value) {
    if (!key) {
      throw new AHS.AIEngine.ValidationError("KnowledgeCache.set requires a key");
    }
    this._store[key] = value;
  };

  KnowledgeCache.prototype.get = function (key) {
    return this.has(key) ? this._store[key] : undefined;
  };

  KnowledgeCache.prototype.has = function (key) {
    return Object.prototype.hasOwnProperty.call(this._store, key);
  };

  KnowledgeCache.prototype.remove = function (key) {
    delete this._store[key];
  };

  KnowledgeCache.prototype.clear = function () {
    this._store = {};
  };

  /* EO-AI-004: invalidate(key) — drop a single entry because the
     underlying data may be stale, returning whether it existed. Same
     effect as remove(), added under its own name per spec. */
  KnowledgeCache.prototype.invalidate = function (key) {
    var existed = this.has(key);
    this.remove(key);
    return existed;
  };

  AHS.AIEngine.KnowledgeCache = KnowledgeCache;
})();
