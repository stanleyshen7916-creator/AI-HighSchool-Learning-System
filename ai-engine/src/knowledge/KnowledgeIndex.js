/* ai-engine/src/knowledge/KnowledgeIndex.js — EO-AI-003 · Knowledge Engine Foundation
   In-memory query index over { id, metadata } entries. search() is a
   plain exact-match filter over metadata fields — explicitly not
   semantic search, no embeddings, no vector database. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function KnowledgeIndex() {
    this._entries = [];
  }

  function assertEntries(entries) {
    if (!Array.isArray(entries)) {
      throw new AHS.AIEngine.ValidationError(
        "KnowledgeIndex.build requires an array of entries"
      );
    }
  }

  KnowledgeIndex.prototype.build = function (entries) {
    assertEntries(entries);
    this._entries = entries.slice();
  };

  KnowledgeIndex.prototype.rebuild = function (entries) {
    this.build(entries);
  };

  KnowledgeIndex.prototype.remove = function (id) {
    this._entries = this._entries.filter(function (entry) {
      return entry.id !== id;
    });
  };

  KnowledgeIndex.prototype.search = function (query) {
    query = query || {};
    var keys = Object.keys(query);
    return this._entries.filter(function (entry) {
      var metadata = entry && entry.metadata;
      return keys.every(function (key) {
        return metadata && metadata[key] === query[key];
      });
    });
  };

  KnowledgeIndex.prototype.size = function () {
    return this._entries.length;
  };

  AHS.AIEngine.KnowledgeIndex = KnowledgeIndex;
})();
