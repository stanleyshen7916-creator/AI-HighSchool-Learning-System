/* ai-engine/src/gateway/ApiClient.js — Sprint AI-100 · AI Platform Foundation
   Backend API Client Interface only (Scope item 6). Mirrors
   ai-engine/src/providers/BaseProvider.js's exact style and intent:
   an abstract shape a future, real transport implementation would
   extend — no fetch, no XMLHttpRequest, no network call of any kind
   anywhere in this file, and none is authorized by this Sprint (Scope
   item 8: "Do not integrate AI generation yet"; Constraint: "Do not
   implement server code inside this repository").

   A future Sprint that IS explicitly authorized to perform live
   network I/O would supply a concrete subclass implementing send()
   against a real backend, and register it with AIGateway.setClient() —
   this file has no knowledge of what that subclass does or which
   transport (fetch/XHR/other) it might one day use. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  function ApiClient(id) {
    if (!id) {
      throw new AHS.AIEngine.AIEngineError("ApiClient requires an id");
    }
    this.id = id;
  }

  /* request: { operation, payload, config } -> a Promise/value shaped
     per the matching schema (see ai-engine/src/schema/). Interface
     only — every concrete call throws until a real subclass exists. */
  ApiClient.prototype.send = function () {
    throw new AHS.AIEngine.AIEngineError(
      "ApiClient.send() is an interface method — implement in a subclass"
    );
  };

  ApiClient.prototype.isAvailable = function () {
    throw new AHS.AIEngine.AIEngineError(
      "ApiClient.isAvailable() is an interface method — implement in a subclass"
    );
  };

  AHS.AIEngine.ApiClient = ApiClient;
})();
