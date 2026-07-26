/* ai-engine/src/knowledge/KnowledgeRegistry.js — EO-AI-003 · Knowledge Engine Foundation
   Register/unregister/query for knowledge entries. Storage only — no
   loading, indexing, or caching logic (see KnowledgeLoader/Index/Cache). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function KnowledgeRegistry() {
    this._entries = {};
  }

  KnowledgeRegistry.prototype.register = function (id, entry) {
    if (!id) {
      throw new AHS.AIEngine.RegistryError(
        "KnowledgeRegistry.register requires an id"
      );
    }
    this._entries[id] = entry;
  };

  KnowledgeRegistry.prototype.unregister = function (id) {
    delete this._entries[id];
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
  };

  AHS.AIEngine.KnowledgeRegistry = KnowledgeRegistry;
})();
