/* ai-engine/src/runtime/SummaryPipeline.js — EO-AI-006 · AI Summary Runtime Integration
   Orchestrates: MaterialRuntime -> KnowledgeLoader -> SummaryExtractor
   -> SummaryBuilder -> SummaryValidator -> SummaryFormatter ->
   SummaryRuntime -> return Summary.

   The first four pipeline stages are NOT reimplemented here — they run
   exactly as EO-AI-005's SummaryEngine.generate() already implements
   them (Absolutely Prohibited: Rebuild Summary Engine). This module
   only adds the two new stages EO-AI-006 asks for (Formatter -> save
   into SummaryRuntime) plus session/history bookkeeping. No LLM, no
   prompt, no AI generation anywhere in this file. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function SummaryPipeline(dependencies) {
    dependencies = dependencies || {};
    this._engine = dependencies.engine || new AHS.AIEngine.SummaryEngine();
    this._formatter = dependencies.formatter || new AHS.AIEngine.SummaryFormatter();
    this._runtime = dependencies.runtime || new AHS.AIEngine.SummaryRuntime();
    this._history = dependencies.history || new AHS.AIEngine.SummaryHistory();
    this._session = dependencies.session || new AHS.AIEngine.SummarySession();
  }

  SummaryPipeline.prototype.run = function (materialId) {
    this._session.start(materialId);
    try {
      var model = this._engine.generate(materialId);
      var formatted = this._formatter.toRuntimeObject(model);
      this._runtime.save(formatted);
      this._history.record(formatted);
      return formatted;
    } finally {
      this._session.stop();
    }
  };

  AHS.AIEngine.SummaryPipeline = SummaryPipeline;
})();
