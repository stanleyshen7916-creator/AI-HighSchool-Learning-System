/* ai-engine/src/runtime/QuestionRuntime.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/runtime/SummaryRuntime.js (EO-AI-006).
   In-memory store for Question Set Models, keyed by materialId. No
   persistence (no localStorage/IndexedDB) — state lives only for the
   lifetime of this instance.

   NOT a duplicate of any existing top-level AHS store:
     - `AHS.QuestionRuntime` (js/runtime/QuestionRuntime.js, Sprint 4)
       is the Exam Mode QuestionBank-driven Runtime — different
       namespace, different schema, different consumer.
     - `AHS.QuestionGenerationRuntime` (js/runtime/
       QuestionGenerationRuntime.js, EO-S8.2.003, LOCK) is the real
       production Knowledge-Graph-driven question generator wired into
       Quiz via QuestionProviderBridge — also untouched by this file.
   This one lives under the AHS.AIEngine namespace and stores the
   9-field Question Set Model produced by the AI Question Engine
   pipeline (Sprint AI-101), exactly parallel to how AHS.AIEngine.
   SummaryRuntime coexists with the LOCKED top-level AHS.SummaryRuntime.

   Cache Integration (EO-AI-004, reused not recreated): storage is
   delegated to a composed AHS.AIEngine.KnowledgeCache instance;
   remove() specifically calls its invalidate() method. `id` is set so
   this can be registered via the existing AIEngine.registerService(). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function QuestionRuntime() {
    this.id = "questionRuntime";
    this._cache = new AHS.AIEngine.KnowledgeCache();
    this._keys = [];
  }

  function materialIdOf(questionSet) {
    return questionSet && questionSet.metadata && questionSet.metadata.materialId;
  }

  QuestionRuntime.prototype.save = function (questionSet) {
    var materialId = materialIdOf(questionSet);
    if (!materialId) {
      throw new AHS.AIEngine.ValidationError(
        "QuestionRuntime.save requires a Question Set Model with metadata.materialId"
      );
    }
    if (this._keys.indexOf(materialId) === -1) {
      this._keys.push(materialId);
    }
    this._cache.set(materialId, questionSet);
    return questionSet;
  };

  QuestionRuntime.prototype.get = function (materialId) {
    return this._cache.get(materialId);
  };

  QuestionRuntime.prototype.list = function () {
    var self = this;
    return this._keys
      .map(function (id) { return self._cache.get(id); })
      .filter(function (value) { return value !== undefined; });
  };

  QuestionRuntime.prototype.remove = function (materialId) {
    this._cache.invalidate(materialId);
    var index = this._keys.indexOf(materialId);
    if (index !== -1) {
      this._keys.splice(index, 1);
    }
  };

  QuestionRuntime.prototype.clear = function () {
    this._cache.clear();
    this._keys = [];
  };

  AHS.AIEngine.QuestionRuntime = QuestionRuntime;
})();
