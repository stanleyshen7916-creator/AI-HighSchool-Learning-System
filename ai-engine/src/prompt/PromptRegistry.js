/* ai-engine/src/prompt/PromptRegistry.js — EO-AI-001 · Prompt Manager Foundation
   The actual key/value store behind PromptManager. Pre-reserves five
   slots (summary/question/review/explanation/tutor) as placeholders —
   no prompt content, no OpenAI, no Runtime access. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var RESERVED_IDS = [
    AHS.AIEngine.SERVICE_IDS.SUMMARY,
    AHS.AIEngine.SERVICE_IDS.QUESTION,
    AHS.AIEngine.SERVICE_IDS.REVIEW,
    AHS.AIEngine.SERVICE_IDS.EXPLANATION,
    AHS.AIEngine.SERVICE_IDS.TUTOR
  ];

  var PLACEHOLDER = Object.freeze({ reserved: true, template: null });

  function PromptRegistry() {
    this._entries = {};
    RESERVED_IDS.forEach(function (id) {
      this._entries[id] = PLACEHOLDER;
    }, this);
  }

  PromptRegistry.prototype.register = function (id, template) {
    if (!id) {
      throw new AHS.AIEngine.AIEngineError("PromptRegistry.register requires an id");
    }
    this._entries[id] = template;
  };

  PromptRegistry.prototype.unregister = function (id) {
    delete this._entries[id];
  };

  PromptRegistry.prototype.get = function (id) {
    if (!this.has(id)) {
      throw new AHS.AIEngine.AIEngineError("Prompt not registered: " + id);
    }
    return this._entries[id];
  };

  PromptRegistry.prototype.has = function (id) {
    return Object.prototype.hasOwnProperty.call(this._entries, id);
  };

  PromptRegistry.prototype.list = function () {
    return Object.keys(this._entries);
  };

  AHS.AIEngine.PromptRegistry = PromptRegistry;
})();
