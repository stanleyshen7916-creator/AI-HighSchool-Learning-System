/* ai-engine/src/common/Utilities.js — EO-AI-002 · AI Core Foundation
   Small stateless helpers shared by the Provider/Service/Context
   frameworks. No business logic, no Runtime access. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function isPlainObject(value) {
    return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    );
  }

  function freeze(value) {
    return Object.freeze(value);
  }

  AHS.AIEngine.Utilities = {
    isPlainObject: isPlainObject,
    freeze: freeze
  };
})();
