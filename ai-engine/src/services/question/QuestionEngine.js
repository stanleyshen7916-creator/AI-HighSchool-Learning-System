/* ai-engine/src/services/question/QuestionEngine.js — Sprint AI-101 · Question Production Pipeline
   Mirrors ai-engine/src/services/summary/SummaryEngine.js (EO-AI-005).
   Coordinates the Question Pipeline: KnowledgeLoader (EO-AI-003/
   EO-AI-004, reused unmodified) -> QuestionExtractor -> QuestionBuilder
   -> QuestionValidator. Extends AHS.AIEngine.AIService (EO-AI-002) so
   it plugs directly into AIEngine.registerService()/getService() with
   zero changes to core/AIEngine.js itself. Never calls an LLM — every
   field of the produced Question Set Model is either structural
   pass-through or an honest empty stub (see QuestionBuilder). id uses
   the pre-existing, previously-unused AHS.AIEngine.SERVICE_IDS.QUESTION
   constant (reserved since EO-MIG-002 / Constants.js). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function QuestionEngine(dependencies) {
    AHS.AIEngine.AIService.call(this, AHS.AIEngine.SERVICE_IDS.QUESTION, dependencies);
    this._loader = new AHS.AIEngine.KnowledgeLoader();
    this._extractor = new AHS.AIEngine.QuestionExtractor();
    this._builder = new AHS.AIEngine.QuestionBuilder();
    this._validator = new AHS.AIEngine.QuestionValidator();
  }
  QuestionEngine.prototype = Object.create(AHS.AIEngine.AIService.prototype);
  QuestionEngine.prototype.constructor = QuestionEngine;

  QuestionEngine.prototype.generateByKnowledge = function (knowledge) {
    var extracted = this._extractor.extract(knowledge);
    var model = this._builder.build(extracted);
    this._validator.validateOrThrow(model);
    return model;
  };

  QuestionEngine.prototype.generate = function (materialId) {
    var knowledge = this._loader.loadFromMaterial(materialId);
    return this.generateByKnowledge(knowledge);
  };

  QuestionEngine.prototype.generateBatch = function (materialIds) {
    if (!Array.isArray(materialIds)) {
      throw new AHS.AIEngine.ValidationError(
        "QuestionEngine.generateBatch requires an array of material ids"
      );
    }
    var self = this;
    return materialIds.map(function (materialId) {
      return self.generate(materialId);
    });
  };

  AHS.AIEngine.QuestionEngine = QuestionEngine;
})();
