/* ai-engine/src/runtime/SummaryPipeline.js — EO-AI-006 · AI Summary Runtime Integration
   EO-AI-009 · AI Summary Content Extraction Foundation (SummaryContentExtractor step)
   Orchestrates: MaterialRuntime -> KnowledgeLoader -> SummaryExtractor
   -> SummaryBuilder -> SummaryValidator -> SummaryFormatter ->
   SummaryContentExtractor -> SummaryRuntime -> return Summary.

   The SummaryEngine stages (KnowledgeLoader -> SummaryExtractor ->
   SummaryBuilder -> SummaryValidator) are NOT reimplemented here — they
   run exactly as EO-AI-005's SummaryEngine.generate() already
   implements them (Absolutely Prohibited: Rebuild Summary Engine), and
   SummaryEngine.js/SummaryBuilder.js are untouched by this EO.

   EO-AI-009 adds one additive step after SummaryFormatter: rule-based
   extraction (SummaryContentExtractor, no LLM) of the material's real
   text into `formatted.summary = { coreConcepts, keywords, definitions,
   formulas, importantPoints }` — the exact field names
   MaterialSummaryCard.js already expects — layered on top of the
   existing 12 flat fields (title/subject/.../metadata unchanged), not
   replacing them. This is still not wired into MaterialSummaryCard.js
   (that remains a future, separate Migration EO). No LLM, no prompt,
   no AI generation anywhere in this file. */
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
    this._loader = dependencies.loader || new AHS.AIEngine.KnowledgeLoader();
    this._contentExtractor = dependencies.contentExtractor || new AHS.AIEngine.SummaryContentExtractor();
  }

  SummaryPipeline.prototype.run = function (materialId) {
    this._session.start(materialId);
    try {
      var model = this._engine.generate(materialId);
      var formatted = this._formatter.toRuntimeObject(model);
      var knowledge = this._loader.loadFromMaterial(materialId);
      formatted.summary = this._contentExtractor.extract(knowledge.content);
      this._runtime.save(formatted);
      this._history.record(formatted);
      return formatted;
    } finally {
      this._session.stop();
    }
  };

  AHS.AIEngine.SummaryPipeline = SummaryPipeline;
})();
