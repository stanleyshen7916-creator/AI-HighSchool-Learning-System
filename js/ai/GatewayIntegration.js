/* js/ai/GatewayIntegration.js — Sprint AI-101C · Frontend AI Integration
   Shared orchestration behind SummaryAdapter.generateViaGateway() /
   QuestionAdapter.generateViaGateway(): owns the one
   AHS.AIEngine.AIGateway instance for the page's lifetime (same
   singleton-per-page pattern SummaryService/QuestionService already
   use), configures it from AHS.AppConfig.aiGateway (Scope item 3) only
   when actually invoked (never eagerly at load time — if endpoint is
   empty, isConfigured() stays false and no fetch is ever attempted),
   builds the real request payload from the same, existing
   AHS.AIEngine.KnowledgeLoader every other ai-engine pipeline already
   uses, and normalizes every outcome (success, Gateway error, network
   error, timeout, schema mismatch) into one typed result shape so UI
   code never needs to catch a raw exception. */
window.AHS = window.AHS || {};

AHS.GatewayIntegration = (function () {
  "use strict";

  var gateway = new AHS.AIEngine.AIGateway();
  var configured = false;

  function ensureConfigured() {
    if (configured) { return; }
    var cfg = (AHS.AppConfig && AHS.AppConfig.aiGateway) || {};
    gateway.configure({
      provider: cfg.provider || null,
      endpoint: cfg.endpoint || null,
      model: cfg.model || null
    });
    gateway.setClient(new AHS.AIEngine.HttpApiClient("http-gateway-client", cfg.timeoutMs));
    configured = true;
  }

  function newRequestId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "req_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  }

  function buildPayload(materialId, options) {
    var knowledge = new AHS.AIEngine.KnowledgeLoader().loadFromMaterial(materialId);
    var metadata = knowledge.metadata || {};
    return {
      requestId: newRequestId(),
      material: {
        materialId: materialId,
        title: metadata.title || null,
        subject: metadata.subject || null,
        grade: metadata.grade || null,
        chapter: metadata.chapter || null,
        section: metadata.section || null,
        content: knowledge.content || ""
      },
      options: options || {}
    };
  }

  function friendlyMessage(code) {
    switch (code) {
      case "NOT_CONFIGURED": return "AI Gateway 尚未設定，請洽系統管理員設定 endpoint。";
      case "UPSTREAM_TIMEOUT": return "AI Gateway 回應逾時，請稍後再試一次。";
      case "RATE_LIMITED": return "目前請求過於頻繁，請稍候再試。";
      case "PAYLOAD_TOO_LARGE": return "教材內容過長，超過 AI Gateway 可處理的上限。";
      case "SCHEMA_VALIDATION_FAILED": return "AI Gateway 回應格式不正確，請稍後再試。";
      case "INVALID_REQUEST": return "請求資料有誤，請重新嘗試。";
      default: return "AI Gateway 目前無法回應，請稍後再試一次。";
    }
  }

  /* call(operation, materialId, options) -> Promise<
       {ok:true, data} | {ok:false, code, message}
     >. Never rejects — every failure path (unconfigured, network,
     timeout, upstream error, schema mismatch) resolves to a typed
     failure result so UI code can render it directly. */
  function call(operation, materialId, options) {
    ensureConfigured();
    if (!gateway.isConfigured()) {
      return Promise.resolve({ ok: false, code: "NOT_CONFIGURED", message: friendlyMessage("NOT_CONFIGURED") });
    }

    var payload;
    try {
      payload = buildPayload(materialId, options);
    } catch (err) {
      return Promise.resolve({
        ok: false, code: "INVALID_REQUEST",
        message: (err && err.message) || friendlyMessage("INVALID_REQUEST")
      });
    }

    var pending = operation === "summary" ? gateway.summarize(payload) : gateway.generateQuestions(payload);
    return pending
      .then(function (data) {
        var validation = gateway.validateResponse(operation, data);
        if (!validation.valid) {
          return { ok: false, code: "SCHEMA_VALIDATION_FAILED", message: friendlyMessage("SCHEMA_VALIDATION_FAILED") };
        }
        /* Normalize metadata.materialId to the real, known value used in
           the request — the Gateway's system prompt does not currently
           instruct the model to echo it back verbatim, and this
           repository cannot fix that here (Constraint: "Do not modify
           AI-HighSchool-Learning-System... AI-HighSchool-AI-Gateway").
           This overwrites only a structural identifier already known
           with certainty (the same materialId this call was made with)
           — it does not touch, invent, or alter any AI-generated content
           field. Runs only after schema validation already passed. */
        data.metadata = Object.assign({}, data.metadata, { materialId: materialId });
        return { ok: true, data: data };
      })
      .catch(function (err) {
        var code = (err && err.code) || "UPSTREAM_ERROR";
        return { ok: false, code: code, message: friendlyMessage(code) };
      });
  }

  /* Test-only reset hook — mirrors the reset() pattern every other
     memory-only Runtime/Service in this codebase already exposes. */
  function reset() {
    gateway = new AHS.AIEngine.AIGateway();
    configured = false;
  }

  return { call: call, friendlyMessage: friendlyMessage, reset: reset };
})();
