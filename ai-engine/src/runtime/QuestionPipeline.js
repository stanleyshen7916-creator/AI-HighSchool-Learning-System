/* ai-engine/src/runtime/QuestionPipeline.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/runtime/SummaryPipeline.js (EO-AI-006), at its
   original (pre EO-AI-009 content-extractor) shape — Sprint AI-101's
   deliverables list a QuestionPipeline/QuestionRuntime integration but
   not a rule-based content-extraction parser, so that later increment
   is deliberately not mirrored here (No speculative implementation).

   Orchestrates: MaterialRuntime -> KnowledgeLoader -> QuestionExtractor
   -> QuestionBuilder -> QuestionValidator -> QuestionFormatter ->
   QuestionRuntime -> QuestionHistory -> return Question Set.

   The QuestionEngine stages (KnowledgeLoader -> QuestionExtractor ->
   QuestionBuilder -> QuestionValidator) are NOT reimplemented here —
   they run exactly as QuestionEngine.generate() already implements
   them, and QuestionEngine.js/QuestionBuilder.js are untouched by this
   file. No LLM, no prompt, no AI generation anywhere in this file. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function QuestionPipeline(dependencies) {
    dependencies = dependencies || {};
    this._engine = dependencies.engine || new AHS.AIEngine.QuestionEngine();
    this._formatter = dependencies.formatter || new AHS.AIEngine.QuestionFormatter();
    this._runtime = dependencies.runtime || new AHS.AIEngine.QuestionRuntime();
    this._history = dependencies.history || new AHS.AIEngine.QuestionHistory();
    this._session = dependencies.session || new AHS.AIEngine.QuestionSession();
  }

  QuestionPipeline.prototype.run = function (materialId) {
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

  AHS.AIEngine.QuestionPipeline = QuestionPipeline;
})();
