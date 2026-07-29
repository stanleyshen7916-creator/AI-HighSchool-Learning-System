/* ai-engine/src/gateway/GatewayConfig.js — Sprint AI-100 · AI Platform Foundation
   Plain data holder for the AI Gateway's configuration surface —
   provider id / endpoint URL / model name only (Scope item 2:
   "configuration layer for endpoint/model/provider"). Mirrors
   ai-engine/src/knowledge/Metadata.js's exact FIELDS + constructor
   pattern.

   Deliberately has NO `apiKey`/`secret`/`token` field of any kind —
   "No frontend API keys" (Sprint AI-100 Constraint) is enforced
   structurally, not just by convention: the constructor only ever
   reads the three fields in FIELDS, so passing a credential-shaped
   value in the source object has no effect (it is silently dropped,
   the same way Metadata.js already drops any field not in its own
   FIELDS list). GatewayConfigValidator additionally flags any such
   field as an error at validation time (see that file). A future
   backend is expected to hold its own credential out of the
   frontend's reach entirely — this repository never sees or stores
   one. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var FIELDS = ["provider", "endpoint", "model"];

  function GatewayConfig(values) {
    var source = values || {};
    FIELDS.forEach(function (field) {
      this[field] = Object.prototype.hasOwnProperty.call(source, field)
        ? source[field]
        : null;
    }, this);
  }

  GatewayConfig.FIELDS = Object.freeze(FIELDS.slice());

  GatewayConfig.prototype.get = function (field) {
    return this[field];
  };

  GatewayConfig.prototype.set = function (field, value) {
    if (FIELDS.indexOf(field) === -1) {
      throw new AHS.AIEngine.ValidationError("Unknown gateway config field: " + field);
    }
    this[field] = value;
  };

  /* Deployment-ready integration point (Scope item 10): a real
     deployment is "configured" once all three fields are set to a
     real value; Sprint AI-100 never sets them, so this is always
     false today, by design (Scope item 8: "Do not integrate AI
     generation yet"). */
  GatewayConfig.prototype.isComplete = function () {
    return FIELDS.every(function (field) {
      return typeof this[field] === "string" && this[field].length > 0;
    }, this);
  };

  AHS.AIEngine.GatewayConfig = GatewayConfig;
})();
