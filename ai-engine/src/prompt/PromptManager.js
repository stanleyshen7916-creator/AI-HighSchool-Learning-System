/* ai-engine/src/prompt/PromptManager.js — EO-AI-001 · Prompt Manager Foundation
   The single entry point for Prompt access (Interface only — delegates
   storage to PromptRegistry, adds no business logic, no OpenAI call,
   no prompt content). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function PromptManager(registry) {
    this._registry = registry || new AHS.AIEngine.PromptRegistry();
  }

  PromptManager.prototype.register = function (id, template) {
    this._registry.register(id, template);
  };

  PromptManager.prototype.unregister = function (id) {
    this._registry.unregister(id);
  };

  PromptManager.prototype.get = function (id) {
    return this._registry.get(id);
  };

  PromptManager.prototype.has = function (id) {
    return this._registry.has(id);
  };

  PromptManager.prototype.list = function () {
    return this._registry.list();
  };

  AHS.AIEngine.PromptManager = PromptManager;
})();
