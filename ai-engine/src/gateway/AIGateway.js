/* ai-engine/src/gateway/AIGateway.js — Sprint AI-100 · AI Platform Foundation
   Scope item 1: "Design provider-independent AI Gateway integration."
   Single, provider-independent entry point a future Platform caller
   would use for Summary/Question requests — it never knows or cares
   which concrete ApiClient/provider is behind it, the same way
   AIEngine.getService()/getProvider() already decouple callers from
   concrete implementations.

   Composes (does not duplicate): GatewayConfig + GatewayConfigValidator
   (Scope item 2), ApiClient (Scope item 6, interface only), and the
   three schemas under ai-engine/src/schema/ (Scope items 3-5) via
   SchemaValidator.

   request()/summarize()/generateQuestions() NEVER perform a network
   call in this Sprint — Scope item 8 ("Do not integrate AI generation
   yet") and the Constraint "Do not implement server code inside this
   repository" both forbid it. Until a future, separately-authorized
   Sprint calls setClient() with a real ApiClient subclass AND
   configure() with a real endpoint, isConfigured() is always false and
   request() always throws a clear, honest error — never a fabricated
   response. This is the "deployment-ready integration point" (Scope
   item 10): the wiring exists and is fully testable today via
   validateResponse(), without any live backend. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var SCHEMAS = {
    summary: function () { return AHS.AIEngine.SummarySchema; },
    question: function () { return AHS.AIEngine.QuestionSchema; },
    error: function () { return AHS.AIEngine.ErrorSchema; }
  };

  function AIGateway() {
    this._config = new AHS.AIEngine.GatewayConfig();
    this._configValidator = new AHS.AIEngine.GatewayConfigValidator();
    this._schemaValidator = new AHS.AIEngine.SchemaValidator();
    this._client = null;
  }

  AIGateway.prototype.configure = function (values) {
    this._configValidator.validateOrThrow(values || {});
    this._config = new AHS.AIEngine.GatewayConfig(values);
    return this._config;
  };

  AIGateway.prototype.getConfig = function () {
    return this._config;
  };

  AIGateway.prototype.setClient = function (client) {
    if (!(client instanceof AHS.AIEngine.ApiClient)) {
      throw new AHS.AIEngine.ValidationError(
        "AIGateway.setClient requires an AHS.AIEngine.ApiClient instance"
      );
    }
    this._client = client;
  };

  AIGateway.prototype.getClient = function () {
    return this._client;
  };

  /* True only once a real endpoint/model/provider AND a real client
     have both been supplied — never true from this Sprint's own code. */
  AIGateway.prototype.isConfigured = function () {
    return this._config.isComplete() && this._client !== null;
  };

  AIGateway.prototype.getSchema = function (operation) {
    if (!SCHEMAS[operation]) {
      throw new AHS.AIEngine.ValidationError("Unknown AIGateway operation: " + operation);
    }
    return SCHEMAS[operation]();
  };

  /* Directly usable today with no live backend: validates a sample or
     real response payload against the matching schema. */
  AIGateway.prototype.validateResponse = function (operation, data) {
    return this._schemaValidator.validate(this.getSchema(operation), data);
  };

  /* The only method that would ever reach a real backend — always
     throws today (Scope item 8), never fabricates a response. */
  AIGateway.prototype.request = function (operation, payload) {
    this.getSchema(operation); /* throws for an unknown operation up front */
    if (!this.isConfigured()) {
      throw new AHS.AIEngine.ServiceError(
        "AIGateway is not configured — Sprint AI-100 Foundation only, " +
        "no live backend integrated yet"
      );
    }
    return this._client.send({ operation: operation, payload: payload, config: this._config });
  };

  AIGateway.prototype.summarize = function (payload) {
    return this.request("summary", payload);
  };

  AIGateway.prototype.generateQuestions = function (payload) {
    return this.request("question", payload);
  };

  AHS.AIEngine.AIGateway = AIGateway;
})();
