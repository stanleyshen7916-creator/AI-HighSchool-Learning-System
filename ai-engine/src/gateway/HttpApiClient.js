/* ai-engine/src/gateway/HttpApiClient.js — Sprint AI-101C · Frontend AI Integration
   The first real network transport in this repository's history — a
   concrete AHS.AIEngine.ApiClient subclass that calls the real,
   externally-deployed AI Gateway Service (AI-HighSchool-AI-Gateway repo,
   Sprint AI-101B), per AIGatewayRestApiSpecification.md.

   This is a deliberate, narrowly-scoped exception to this project's
   long-standing "no fetch, no real backend" architecture (every prior
   ai-engine EO explicitly avoided this). It exists because of an
   explicit, staged PMO authorization sequence: AI-100 (inert Gateway
   Foundation) -> AI-100.5 (service specification) -> AI-101B (real,
   separately-repo'd, separately-deployed backend) -> AI-101C (this
   file: wiring the frontend to call it). The exception is scoped to
   exactly one integration point — this file and the two POST calls it
   makes — not a general license for fetch/XHR anywhere else in the
   codebase; every other file's existing "no localStorage/no fetch/no
   XHR" discipline is completely unchanged.

   "Must keep working over file:// and on GitHub Pages" (CLAUDE.md) is
   preserved by construction, not by exception: AHS.AppConfig.aiGateway.
   endpoint is empty by default (never a guessed URL), which keeps
   AHS.AIEngine.AIGateway.isConfigured() false and this file's send()
   never called at all unless a deployer explicitly sets a real,
   deployed endpoint — see js/data/AppConfig.js. When no endpoint is
   configured, every existing page (including this one) behaves exactly
   as before this Sprint. When a real endpoint IS configured and a call
   fails for any reason (network, CORS, timeout, non-2xx), the caller
   (js/ai/SummaryAdapter.js / QuestionAdapter.js's generateViaGateway())
   catches it and falls back to the app's existing rule-based/Legacy
   content — the app never breaks, it degrades to what already ships
   today. This is the same graceful-fallback shape already established
   by SummaryService.getWithFallback()/QuestionService.getWithFallback()
   (Sprint AI-100/AI-101). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var PATH_BY_OPERATION = { summary: "/v1/summary", question: "/v1/question" };

  /* Thrown by send() on any failure — code mirrors the Gateway's own
     ErrorSchema `code` values (AIGatewayRestApiSpecification.md §5) so
     callers can branch on it without inspecting HTTP status directly. */
  function GatewayRequestError(code, message, details) {
    AHS.AIEngine.AIEngineError.call(this, message);
    this.name = "GatewayRequestError";
    this.code = code;
    this.details = details || null;
  }
  GatewayRequestError.prototype = Object.create(AHS.AIEngine.AIEngineError.prototype);
  GatewayRequestError.prototype.constructor = GatewayRequestError;

  /* timeoutMs lives on the client, not on GatewayConfig — GatewayConfig's
     FIELDS (provider/endpoint/model only) are LOCK per Sprint AI-100's
     own tests; adding a field there would modify an already-shipped
     Foundation class. Defaults to 30000ms, matching
     AIGatewayOperationsSpecification.md §2's recommended starting point. */
  function HttpApiClient(id, timeoutMs) {
    AHS.AIEngine.ApiClient.call(this, id || "http-gateway-client");
    this._timeoutMs = (timeoutMs && timeoutMs > 0) ? timeoutMs : 30000;
  }
  HttpApiClient.prototype = Object.create(AHS.AIEngine.ApiClient.prototype);
  HttpApiClient.prototype.constructor = HttpApiClient;

  HttpApiClient.prototype.isAvailable = function () {
    return typeof fetch === "function";
  };

  /* send({operation, payload, config}) -> Promise<data> per
     AIGatewayRestApiSpecification.md §4 (success: {requestId, data} —
     this resolves with `data` only, matching what AIGateway.request()
     returns directly to its own caller). Rejects with a
     GatewayRequestError on any failure — never resolves with a
     fabricated or partial value. */
  HttpApiClient.prototype.send = function (request) {
    var operation = request && request.operation;
    var payload = (request && request.payload) || {};
    var config = request && request.config;
    var path = PATH_BY_OPERATION[operation];
    if (!path) {
      return Promise.reject(new GatewayRequestError("INVALID_REQUEST", "Unknown Gateway operation: " + operation));
    }
    if (!config || !config.endpoint) {
      return Promise.reject(new GatewayRequestError("INVALID_REQUEST", "HttpApiClient.send requires a configured endpoint"));
    }
    if (!this.isAvailable()) {
      return Promise.reject(new GatewayRequestError("INTERNAL_ERROR", "fetch is not available in this environment"));
    }

    var url = String(config.endpoint).replace(/\/$/, "") + path;
    var timeoutMs = this._timeoutMs;
    var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        return response.json().catch(function () { return null; }).then(function (body) {
          if (!response.ok) {
            var errBody = body || {};
            throw new GatewayRequestError(
              errBody.code || "UPSTREAM_ERROR",
              errBody.message || ("Gateway returned HTTP " + response.status),
              errBody.details
            );
          }
          if (!body || body.data === undefined) {
            throw new GatewayRequestError("UPSTREAM_ERROR", "Gateway response was missing a data field");
          }
          return body.data;
        });
      })
      .catch(function (err) {
        if (err instanceof GatewayRequestError) { throw err; }
        if (err && err.name === "AbortError") {
          throw new GatewayRequestError("UPSTREAM_TIMEOUT", "AI Gateway request exceeded " + timeoutMs + "ms");
        }
        throw new GatewayRequestError("UPSTREAM_ERROR", (err && err.message) || "AI Gateway request failed");
      })
      .then(function (data) {
        if (timer) { clearTimeout(timer); }
        return data;
      }, function (err) {
        if (timer) { clearTimeout(timer); }
        throw err;
      });
  };

  AHS.AIEngine.GatewayRequestError = GatewayRequestError;
  AHS.AIEngine.HttpApiClient = HttpApiClient;
})();
