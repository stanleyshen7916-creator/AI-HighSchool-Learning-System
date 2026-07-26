/* ai-engine/src/services/summary/SummaryExtractor.js — EO-AI-005 · AI Summary Engine Foundation
   Pulls structural facts out of an existing Knowledge Object (the
   KnowledgeLoader output from EO-AI-003/EO-AI-004, reused unmodified):
   metadata, tags, chapter, section, and a structural fact about the
   material (does it have content, how long is it). Never reads or
   interprets the content itself — no NLP, no prompt, no document
   summarization. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function SummaryExtractor() {}

  SummaryExtractor.prototype.extract = function (knowledge) {
    if (!AHS.AIEngine.Utilities.isPlainObject(knowledge)) {
      throw new AHS.AIEngine.ValidationError(
        "SummaryExtractor.extract requires a Knowledge Object (see KnowledgeLoader)"
      );
    }
    var metadata = knowledge.metadata || null;
    var content = typeof knowledge.content === "string" ? knowledge.content : "";
    return AHS.AIEngine.Utilities.freeze({
      materialId: knowledge.materialId || null,
      metadata: metadata,
      tags: metadata && Array.isArray(metadata.tags) ? metadata.tags.slice() : [],
      chapter: (metadata && metadata.chapter) || null,
      section: (metadata && metadata.section) || null,
      structure: {
        hasContent: content.length > 0,
        contentLength: content.length
      }
    });
  };

  AHS.AIEngine.SummaryExtractor = SummaryExtractor;
})();
