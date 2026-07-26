/* ai-engine/src/knowledge/KnowledgeLoader.js — EO-AI-003 · Knowledge Engine Foundation
   Turns a plain object or a JSON string into a normalized, frozen
   knowledge record. No Platform Runtime access, no extraction/parsing
   business logic — normalize() only guarantees plain-object shape. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function KnowledgeLoader() {}

  KnowledgeLoader.prototype.normalize = function (value) {
    if (!AHS.AIEngine.Utilities.isPlainObject(value)) {
      throw new AHS.AIEngine.ValidationError(
        "KnowledgeLoader.normalize requires a plain object"
      );
    }
    var copy = {};
    Object.keys(value).forEach(function (key) {
      copy[key] = value[key];
    });
    return AHS.AIEngine.Utilities.freeze(copy);
  };

  KnowledgeLoader.prototype.loadFromObject = function (value) {
    return this.normalize(value);
  };

  KnowledgeLoader.prototype.loadFromJSON = function (jsonString) {
    var parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new AHS.AIEngine.ValidationError("Invalid JSON: " + e.message);
    }
    return this.loadFromObject(parsed);
  };

  AHS.AIEngine.KnowledgeLoader = KnowledgeLoader;
})();
