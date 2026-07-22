/* js/parser/AIProviderInterface.js — Sprint 8.0 · EO-S8.0-001
   AI Provider Interface — INTERFACE ONLY this Sprint（不得綁定 Provider）.

   Supported provider ids (fixed): openai | azure_openai | claude | gemini.

   This module defines the CONTRACT a future provider adapter must
   implement and a registry to hold it:
     adapter = {
       id,                    one of PROVIDERS
       classifyDocument(text)        -> Promise<documentType>
       extractKnowledge(text, meta)  -> Promise<KG node inputs[]>
       generateQuestions(summaryV2)  -> Promise<question inputs[]>
       buildExplanation(question)    -> Promise<explanation parts>
     }
   register() validates shape only; getActive() is null and there is NO
   activation path this Sprint — nothing in the repo can call a
   provider. NOTE (flagged): actual provider calls will require network
   access, which the prototype's hard no-fetch rule currently forbids —
   binding therefore needs an explicit PMO decision in the Provider
   Sprint. Zero network code exists here. */
window.AHS = window.AHS || {};
AHS.AIProvider = (function () {
  "use strict";
  var PROVIDERS = ["openai", "azure_openai", "claude", "gemini"];
  var CONTRACT = ["classifyDocument", "extractKnowledge", "generateQuestions", "buildExplanation"];
  var registry = {};

  function validateAdapter(adapter) {
    var errors = [];
    adapter = adapter || {};
    if (PROVIDERS.indexOf(adapter.id) === -1) { errors.push("provider id 不合法（僅允許：" + PROVIDERS.join(" / ") + "）"); }
    CONTRACT.forEach(function (fn) {
      if (typeof adapter[fn] !== "function") { errors.push("缺少介面方法：" + fn); }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function register(adapter) {
    var check = validateAdapter(adapter);
    if (!check.valid) { return null; }
    registry[adapter.id] = adapter;
    return adapter.id;
  }

  function listRegistered() { return Object.keys(registry); }

  /* Interface Only：本 Sprint 恆為 null，無任何啟用路徑。 */
  function getActive() { return null; }

  return {
    PROVIDERS: PROVIDERS.slice(),
    CONTRACT: CONTRACT.slice(),
    register: register,
    validateAdapter: validateAdapter,
    listRegistered: listRegistered,
    getActive: getActive
  };
})();
