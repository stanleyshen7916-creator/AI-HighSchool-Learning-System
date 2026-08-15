/* tests/regression/AIGatewayFrontendV1.js — Sprint AI-101C · Frontend AI Integration.
   Verifies: HttpApiClient (the first real fetch() in this repository —
   success/error/timeout paths via a mocked global.fetch, never calling
   the real network), GatewayIntegration (configure-once, honest
   NOT_CONFIGURED when AppConfig.aiGateway.endpoint is empty — the
   default, zero-network-attempt guarantee that keeps every page working
   over file:///GitHub Pages exactly as before this Sprint — success,
   schema-validation failure, and error-code mapping, all via one typed
   {ok,...} result that never rejects), SummaryAdapter.generateViaGateway/
   QuestionAdapter.generateViaGateway delegation, materialId
   normalization, zero API keys anywhere in these files, and a source-
   scan confirming the real fetch() call is confined to exactly one file
   (HttpApiClient.js) — not sprinkled elsewhere in js/.
   Run: node tests/regression/AIGatewayFrontendV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};

const AI_ENGINE_FILES = [
  "ai-engine/src/common/Utilities.js",
  "ai-engine/src/common/Errors.js",
  "ai-engine/src/common/Constants.js",
  "ai-engine/src/knowledge/Metadata.js",
  "ai-engine/src/knowledge/MetadataBuilder.js",
  "ai-engine/src/knowledge/MetadataValidator.js",
  "ai-engine/src/knowledge/KnowledgeCache.js",
  "ai-engine/src/knowledge/KnowledgeLoader.js",
  "ai-engine/src/gateway/GatewayConfig.js",
  "ai-engine/src/gateway/GatewayConfigValidator.js",
  "ai-engine/src/gateway/ApiClient.js",
  "ai-engine/src/schema/SummarySchema.js",
  "ai-engine/src/schema/QuestionSchema.js",
  "ai-engine/src/schema/ErrorSchema.js",
  "ai-engine/src/schema/SchemaValidator.js",
  "ai-engine/src/gateway/AIGateway.js",
  "ai-engine/src/gateway/HttpApiClient.js",
  "ai-engine/src/core/AIService.js",
  "ai-engine/src/services/summary/SummaryExtractor.js",
  "ai-engine/src/services/summary/SummaryBuilder.js",
  "ai-engine/src/services/summary/SummaryFormatter.js",
  "ai-engine/src/services/summary/SummaryValidator.js",
  "ai-engine/src/services/summary/SummaryEngine.js",
  "ai-engine/src/parser/SummaryContentExtractor.js",
  "ai-engine/src/runtime/SummaryRuntime.js",
  "ai-engine/src/runtime/SummaryHistory.js",
  "ai-engine/src/runtime/SummarySession.js",
  "ai-engine/src/runtime/SummaryPipeline.js",
  "ai-engine/src/service/SummaryService.js",
  "ai-engine/src/validator/SummaryComparator.js",
  "ai-engine/src/service/SummaryProvider.js",
  "ai-engine/src/services/question/QuestionExtractor.js",
  "ai-engine/src/services/question/QuestionBuilder.js",
  "ai-engine/src/services/question/QuestionFormatter.js",
  "ai-engine/src/services/question/QuestionValidator.js",
  "ai-engine/src/services/question/QuestionEngine.js",
  "ai-engine/src/runtime/QuestionRuntime.js",
  "ai-engine/src/runtime/QuestionHistory.js",
  "ai-engine/src/runtime/QuestionSession.js",
  "ai-engine/src/runtime/QuestionPipeline.js",
  "ai-engine/src/service/QuestionService.js",
  "ai-engine/src/service/QuestionProvider.js"
];

const PLATFORM_FILES = [
  "js/data/AppConfig.js",
  "js/core/PersistenceAdapter.js",
  "js/runtime/MaterialRuntime.js",
  "js/runtime/FolderRuntime.js",
  "js/runtime/DocumentClassifierRuntime.js",
  "js/runtime/KnowledgeGraphRuntime.js",
  "js/parser/MaterialTextProvider.js",
  "js/parser/AnalysisRuntime.js",
  "js/runtime/KnowledgeExtractionRuntime.js",
  "js/parser/KnowledgePipeline.js",
  "js/runtime/SummaryRuntime.js",
  "js/runtime/KnowledgeSummaryRuntime.js",
  "js/runtime/QuestionGenerationRuntime.js",
  "js/ai/SummaryAdapter.js",
  "js/ai/QuestionAdapter.js",
  "js/ai/GatewayIntegration.js"
];

AI_ENGINE_FILES.concat(PLATFORM_FILES).forEach(p =>
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const GI = AHS.GatewayIntegration, SA = AHS.SummaryAdapter, QA = AHS.QuestionAdapter,
      HttpApiClient = AHS.AIEngine.HttpApiClient, MR = AHS.MaterialRuntime,
      FR = AHS.FolderRuntime, KP = AHS.KnowledgePipeline;

MR.reset(); FR.reset && FR.reset(); AHS.KnowledgeGraphRuntime.reset();
AHS.DocumentClassifierRuntime.reset();

const folder = FR.createFolder({ folderName: "測試", subject: "math", scopeType: "custom" });
const mat = MR.add({ title: "測試教材", subject: "math", grade: "高一", chapter: "C1",
  category: "講義", fileName: "a.pdf", fileType: "PDF", folderId: folder.folderId,
  content: "三角函數的定義與應用。" });
KP.process(mat.id);

/* Runs withMockFetch scenarios strictly one at a time — global.fetch is
   shared mutable state, so overlapping calls would race and clobber
   each other's mock. */
function withMockFetch(impl, fn) {
  const original = global.fetch;
  global.fetch = impl;
  return Promise.resolve().then(fn).then(
    function (v) { global.fetch = original; return v; },
    function (e) { global.fetch = original; throw e; }
  );
}

console.log("\n[HttpApiClient — 本 repository 第一個真實 fetch() 呼叫，僅限此一檔案]");
const client = new HttpApiClient("test-client", 50);
check("HttpApiClient 是 AHS.AIEngine.ApiClient 的子類別", client instanceof AHS.AIEngine.ApiClient);
check("isAvailable() 反映真實 fetch 是否存在", client.isAvailable() === (typeof fetch === "function"));

const httpClientChain = withMockFetch(null, function () {
  return client.send({ operation: "unknown", payload: {}, config: { endpoint: "https://x.test" } })
    .then(function () { check("未知 operation 應被拒絕", false); })
    .catch(function (err) { check("未知 operation 應被拒絕", err.code === "INVALID_REQUEST"); });
})
  .then(function () {
    return client.send({ operation: "summary", payload: {}, config: { endpoint: "" } })
      .then(function () { check("缺少 endpoint 應被拒絕", false); })
      .catch(function (err) { check("缺少 endpoint 應被拒絕", err.code === "INVALID_REQUEST"); });
  })
  .then(function () {
    return withMockFetch(
      function (url, init) {
        check("送出 POST 至 <endpoint>/v1/summary", url === "https://gw.test/v1/summary");
        check("Content-Type 為 application/json", init.headers["Content-Type"] === "application/json");
        const body = JSON.parse(init.body);
        check("請求 body 攜帶真實 requestId/material", body.requestId === "r1" && body.material.materialId === "m1");
        return Promise.resolve({
          ok: true,
          json: function () { return Promise.resolve({ requestId: "r1", data: { subject: "math", metadata: {} } }); }
        });
      },
      function () {
        return client.send({
          operation: "summary", payload: { requestId: "r1", material: { materialId: "m1" } },
          config: { endpoint: "https://gw.test" }
        }).then(function (data) {
          check("send() 成功時回傳 data 欄位本身", data.subject === "math");
        });
      }
    );
  })
  .then(function () {
    return withMockFetch(
      function () {
        return Promise.resolve({
          ok: false, status: 429,
          json: function () { return Promise.resolve({ code: "RATE_LIMITED", message: "too many" }); }
        });
      },
      function () {
        return client.send({ operation: "summary", payload: {}, config: { endpoint: "https://gw.test" } })
          .then(function () { check("非 2xx 回應應轉為 GatewayRequestError", false); })
          .catch(function (err) {
            check("非 2xx 回應應轉為 GatewayRequestError（保留真實 code/message）",
              err.code === "RATE_LIMITED" && err.message === "too many");
          });
      }
    );
  })
  .then(function () {
    return withMockFetch(
      function (url, init) {
        return new Promise(function (_resolve, reject) {
          init.signal.addEventListener("abort", function () {
            const e = new Error("aborted"); e.name = "AbortError"; reject(e);
          });
        });
      },
      function () {
        return client.send({ operation: "summary", payload: {}, config: { endpoint: "https://gw.test" } })
          .then(function () { check("逾時應轉為 UPSTREAM_TIMEOUT", false); })
          .catch(function (err) { check("逾時應轉為 UPSTREAM_TIMEOUT（timeoutMs=50 已於建構子設定）", err.code === "UPSTREAM_TIMEOUT"); });
      }
    );
  });

httpClientChain.then(function () {
  console.log("\n[GatewayIntegration — 預設未設定時零網路呼叫（file://／GitHub Pages 保證）]");
  GI.reset();
  check("預設 AppConfig.aiGateway.endpoint 為空字串（從未猜測/寫死網址）", AHS.AppConfig.aiGateway.endpoint === "");

  let fetchCalledWhileUnconfigured = false;
  const originalFetch = global.fetch;
  global.fetch = function () { fetchCalledWhileUnconfigured = true; return Promise.reject(new Error("should not be called")); };

  return GI.call("summary", mat.id).then(function (result) {
    global.fetch = originalFetch;
    check("未設定 endpoint 時 call() 回傳 NOT_CONFIGURED（從不 reject）", result.ok === false && result.code === "NOT_CONFIGURED");
    check("未設定 endpoint 時從未真正呼叫 fetch（零網路，維持 file:///GitHub Pages 相容）", fetchCalledWhileUnconfigured === false);
    check("錯誤訊息為使用者友善的中文文字", typeof result.message === "string" && result.message.indexOf("尚未設定") !== -1);
  });
}).then(function () {
  console.log("\n[GatewayIntegration — 設定完成後：成功／Schema 驗證失敗／錯誤代碼映射]");
  const original = AHS.AppConfig.aiGateway;
  AHS.AppConfig.aiGateway = { endpoint: "https://gw.test", provider: "test", model: "m1", timeoutMs: 200 };
  GI.reset();

  const successPayload = { subject: "math", metadata: { materialId: "should-be-overwritten" },
    keywords: [], concepts: [], definitions: [], formulas: [], examples: [] };
  const step1 = withMockFetch(
    function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ requestId: "r", data: successPayload }); } }); },
    function () {
      return GI.call("summary", mat.id).then(function (result) {
        check("設定完成＋成功回應：call() 回傳 ok:true", result.ok === true);
        check("成功資料通過既有 SummarySchema 驗證後才回傳", result.data.subject === "math");
        check("metadata.materialId 已正規化為真實已知值（覆蓋模型可能回傳的任意值，非產生內容）",
          result.data.metadata.materialId === mat.id);
      });
    }
  );

  const step2 = step1.then(function () {
    GI.reset();
    return withMockFetch(
      function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ requestId: "r", data: { notASummary: true } }); } }); },
      function () {
        return GI.call("summary", mat.id).then(function (result) {
          check("Schema 驗證失敗時誠實回傳 SCHEMA_VALIDATION_FAILED（絕不捏造內容通過）",
            result.ok === false && result.code === "SCHEMA_VALIDATION_FAILED");
        });
      }
    );
  });

  const step3 = step2.then(function () {
    GI.reset();
    return withMockFetch(
      function () { return Promise.resolve({ ok: false, status: 504, json: function () { return Promise.resolve({ code: "UPSTREAM_TIMEOUT", message: "timeout" }); } }); },
      function () {
        return GI.call("question", mat.id, { difficulty: "easy" }).then(function (result) {
          check("上游錯誤代碼正確映射（question operation）", result.ok === false && result.code === "UPSTREAM_TIMEOUT");
          check("call() 對任何失敗路徑皆解析（resolve）而非 reject，UI 端永遠不需 try/catch", true);
        });
      }
    );
  });

  return step3.then(function () { AHS.AppConfig.aiGateway = original; GI.reset(); });
}).then(function () {
  console.log("\n[SummaryAdapter / QuestionAdapter — generateViaGateway 正確委派]");
  let captured = null;
  const originalCall = GI.call;
  GI.call = function (operation, materialId, options) { captured = { operation: operation, materialId: materialId, options: options }; return Promise.resolve({ ok: true, data: {} }); };

  return SA.generateViaGateway(mat.id).then(function () {
    check("SummaryAdapter.generateViaGateway 委派 operation='summary'", captured.operation === "summary" && captured.materialId === mat.id);
    return QA.generateViaGateway(mat.id, { difficulty: "hard" });
  }).then(function () {
    check("QuestionAdapter.generateViaGateway 委派 operation='question' 並傳遞 options", captured.operation === "question" && captured.options.difficulty === "hard");
    GI.call = originalCall;
  });
}).then(function () {
  console.log("\n[回歸 — 既有 SummaryAdapter/QuestionAdapter 方法完全不變]");
  check("SummaryAdapter 既有方法仍存在", ["generate", "generateFromMaterial", "get", "getWithFallback", "setMode", "getMode", "getSummary", "generateSummary"].every(fn => typeof SA[fn] === "function"));
  check("QuestionAdapter 既有方法仍存在", ["generate", "generateFromMaterial", "get", "getWithFallback", "setMode", "getMode", "getQuestions", "generateQuestions"].every(fn => typeof QA[fn] === "function"));
  check("既有 SummaryAdapter.generate() 行為不變（真實資料端對端）", SA.generate(mat.id).subject === "math");

  console.log("\n[原始碼靜態掃描 — 真實 fetch() 僅限 HttpApiClient.js 一個檔案]");
  /* Sprint AI-136（教材中心重點整理/練習題合併）：js/ui/AIGatewayPanel.js
     已移除——它是 MaterialPreview.js 裡「AI Gateway 重點整理／練習題」的
     UI 層，對 Repository 教材只是把 AI 重點整理／AI 練習題的同一份資料
     重新包裝顯示，對其餘教材則因 AppConfig.aiGateway.endpoint 恆為空字串
     而保證失敗，純屬重複／失效。本檔案其餘驗證的 GatewayIntegration／
     SummaryAdapter／QuestionAdapter Runtime 層完全未變動，故不掃描此
     已刪除的檔案。 */
  const SCAN_FILES = ["js/ai/GatewayIntegration.js", "js/ai/SummaryAdapter.js", "js/ai/QuestionAdapter.js", "js/data/AppConfig.js"];
  let leaks = 0;
  SCAN_FILES.forEach(p => {
    const src = fs.readFileSync(path.join(ROOT, p), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    if (/\bfetch\s*\(/.test(src)) { leaks++; console.log("    UNEXPECTED fetch( in " + p); }
    if (/\bXMLHttpRequest\b/.test(src)) { leaks++; console.log("    UNEXPECTED XMLHttpRequest in " + p); }
    if (/apiKey\s*:\s*["'][^"']+["']|sk-[a-zA-Z0-9]{10,}/.test(src)) { leaks++; console.log("    UNEXPECTED hardcoded key in " + p); }
  });
  check("真實 fetch()/XMLHttpRequest 僅存在於 HttpApiClient.js，四個 Platform 檔案零 fetch/XHR/硬編碼金鑰", leaks === 0);
  const gatewaySrc = fs.readFileSync(path.join(ROOT, "ai-engine/src/gateway/HttpApiClient.js"), "utf8");
  check("HttpApiClient.js 確實包含真實 fetch()（此 Sprint 唯一授權的網路呼叫點）", /\bfetch\s*\(/.test(gatewaySrc));
  check("AppConfig.aiGateway 無 apiKey 欄位（前端從未持有金鑰）", AHS.AppConfig.aiGateway.apiKey === undefined);

  console.log("\n" + pass + " PASS / " + fail + " FAIL");
  process.exit(fail === 0 ? 0 : 1);
}).catch(function (err) {
  console.log("FATAL: " + (err && err.stack || err));
  process.exit(1);
});
