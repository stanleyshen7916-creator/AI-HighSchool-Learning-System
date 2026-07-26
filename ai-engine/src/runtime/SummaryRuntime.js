/* ai-engine/src/runtime/SummaryRuntime.js — EO-AI-006 · AI Summary Runtime Integration
   In-memory store for Summary Models, keyed by materialId. No
   persistence (no localStorage/IndexedDB) — state lives only for the
   lifetime of this instance.

   NOT a duplicate of the LOCKED `AHS.SummaryRuntime` (js/runtime/
   SummaryRuntime.js): that one is a top-level AHS store for the
   Sprint-5 five-section model consumed by SummaryCenter/
   SummaryGenerator; this one lives under the AHS.AIEngine namespace
   and stores the 12-field Summary Model produced by the AI Summary
   Engine pipeline (EO-AI-005). Different namespace, different schema,
   different consumer — the LOCKED module is untouched.

   Cache Integration (EO-AI-004, reused not recreated): storage is
   delegated to a composed AHS.AIEngine.KnowledgeCache instance;
   remove() specifically calls its invalidate() method. `id` is set so
   this can be registered via the existing AIEngine.registerService(). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function SummaryRuntime() {
    this.id = "summaryRuntime";
    this._cache = new AHS.AIEngine.KnowledgeCache();
    this._keys = [];
  }

  function materialIdOf(summary) {
    return summary && summary.metadata && summary.metadata.materialId;
  }

  SummaryRuntime.prototype.save = function (summary) {
    var materialId = materialIdOf(summary);
    if (!materialId) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryRuntime.save requires a Summary Model with metadata.materialId"
      );
    }
    if (this._keys.indexOf(materialId) === -1) {
      this._keys.push(materialId);
    }
    this._cache.set(materialId, summary);
    return summary;
  };

  SummaryRuntime.prototype.get = function (materialId) {
    return this._cache.get(materialId);
  };

  SummaryRuntime.prototype.list = function () {
    var self = this;
    return this._keys
      .map(function (id) { return self._cache.get(id); })
      .filter(function (value) { return value !== undefined; });
  };

  SummaryRuntime.prototype.remove = function (materialId) {
    this._cache.invalidate(materialId);
    var index = this._keys.indexOf(materialId);
    if (index !== -1) {
      this._keys.splice(index, 1);
    }
  };

  SummaryRuntime.prototype.clear = function () {
    this._cache.clear();
    this._keys = [];
  };

  AHS.AIEngine.SummaryRuntime = SummaryRuntime;
})();
