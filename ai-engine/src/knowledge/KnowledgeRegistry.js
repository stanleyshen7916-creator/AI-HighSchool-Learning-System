/* ai-engine/src/knowledge/KnowledgeRegistry.js — EO-AI-003 · Knowledge Engine Foundation
   EO-AI-004 · Knowledge Runtime Integration (Version Management)
   Register/unregister/query for knowledge entries. Storage only — no
   loading, indexing, or caching logic (see KnowledgeLoader/Index/Cache).
   register/unregister/get/has/list/clear keep their exact EO-AI-003
   signatures and behavior; getVersion() is additive. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function KnowledgeRegistry() {
    this._entries = {};
    this._versions = {};
  }

  KnowledgeRegistry.prototype.register = function (id, entry) {
    if (!id) {
      throw new AHS.AIEngine.RegistryError(
        "KnowledgeRegistry.register requires an id"
      );
    }
    this._entries[id] = entry;
    this._versions[id] = (this._versions[id] || 0) + 1;
  };

  KnowledgeRegistry.prototype.unregister = function (id) {
    delete this._entries[id];
    delete this._versions[id];
  };

  KnowledgeRegistry.prototype.get = function (id) {
    if (!this.has(id)) {
      throw new AHS.AIEngine.RegistryError("Knowledge entry not registered: " + id);
    }
    return this._entries[id];
  };

  KnowledgeRegistry.prototype.has = function (id) {
    return Object.prototype.hasOwnProperty.call(this._entries, id);
  };

  KnowledgeRegistry.prototype.list = function () {
    return Object.keys(this._entries);
  };

  KnowledgeRegistry.prototype.clear = function () {
    this._entries = {};
    this._versions = {};
  };

  /* EO-AI-004: getVersion(id) — 1 on first register(), incremented on
     every subsequent register() call for the same id (e.g. a knowledge
     entry reloaded after its source material changed). */
  KnowledgeRegistry.prototype.getVersion = function (id) {
    if (!this.has(id)) {
      throw new AHS.AIEngine.RegistryError("Knowledge entry not registered: " + id);
    }
    return this._versions[id];
  };

  AHS.AIEngine.KnowledgeRegistry = KnowledgeRegistry;
})();
