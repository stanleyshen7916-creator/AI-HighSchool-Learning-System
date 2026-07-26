/* ai-engine/src/services/summary/SummaryEngine.js — EO-AI-005 · AI Summary Engine Foundation
   Coordinates the Summary Pipeline: KnowledgeLoader (EO-AI-003/
   EO-AI-004, reused unmodified) -> SummaryExtractor -> SummaryBuilder
   -> SummaryValidator. Extends AHS.AIEngine.AIService (EO-AI-002) so it
   plugs directly into AIEngine.registerService()/getService() with
   zero changes to core/AIEngine.js itself. Never calls an LLM — every
   field of the produced Summary Model is either structural
   pass-through or an honest empty stub (see SummaryBuilder). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function SummaryEngine(dependencies) {
    AHS.AIEngine.AIService.call(this, AHS.AIEngine.SERVICE_IDS.SUMMARY, dependencies);
    this._loader = new AHS.AIEngine.KnowledgeLoader();
    this._extractor = new AHS.AIEngine.SummaryExtractor();
    this._builder = new AHS.AIEngine.SummaryBuilder();
    this._validator = new AHS.AIEngine.SummaryValidator();
  }
  SummaryEngine.prototype = Object.create(AHS.AIEngine.AIService.prototype);
  SummaryEngine.prototype.constructor = SummaryEngine;

  SummaryEngine.prototype.generateByKnowledge = function (knowledge) {
    var extracted = this._extractor.extract(knowledge);
    var model = this._builder.build(extracted);
    this._validator.validateOrThrow(model);
    return model;
  };

  SummaryEngine.prototype.generate = function (materialId) {
    var knowledge = this._loader.loadFromMaterial(materialId);
    return this.generateByKnowledge(knowledge);
  };

  SummaryEngine.prototype.generateBatch = function (materialIds) {
    if (!Array.isArray(materialIds)) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryEngine.generateBatch requires an array of material ids"
      );
    }
    var self = this;
    return materialIds.map(function (materialId) {
      return self.generate(materialId);
    });
  };

  AHS.AIEngine.SummaryEngine = SummaryEngine;
})();
