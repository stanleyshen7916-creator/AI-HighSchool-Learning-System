/* ai-engine/src/knowledge/KnowledgeCache.js — EO-AI-003 · Knowledge Engine Foundation
   Pure in-memory cache. No localStorage, no IndexedDB, no persistence
   of any kind — state lives only for the lifetime of this instance. */
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

  AHS.AIEngine.KnowledgeCache = KnowledgeCache;
})();
