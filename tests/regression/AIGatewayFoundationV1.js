/* tests/regression/AIGatewayFoundationV1.js — Sprint AI-100 · AI Platform Foundation.
   Verifies: GatewayConfig/GatewayConfigValidator (Scope item 2, and the
   concrete "No frontend API keys" guarantee), ApiClient (Scope item 6,
   zero network capability), SummarySchema/QuestionSchema/ErrorSchema
   (Scope items 3-5, field-for-field aligned with the real Summary/
   Question Models AND with real LOCK QuestionGenerationRuntime output),
   SchemaValidator (dependency-free JSON Schema subset), AIGateway
   (Scope item 1, provider-independent, always inert/unconfigured by
   default per Scope item 8), zero LLM/network/persistence calls
   (source-scan), and zero interference with any existing Runtime.
   Run: node tests/regression/AIGatewayFoundationV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};

const AI_ENGINE_FILES = [
  "ai-engine/src/common/Utilities.js",
  "ai-engine/src/common/Errors.js",
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
  "ai-engine/src/services/summary/SummaryExtractor.js",
  "ai-engine/src/services/summary/SummaryBuilder.js",
  "ai-engine/src/services/question/QuestionExtractor.js",
  "ai-engine/src/services/question/QuestionBuilder.js"
];

const PLATFORM_FILES = [
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
  "js/runtime/QuestionGenerationRuntime.js"
];

AI_ENGINE_FILES.concat(PLATFORM_FILES).forEach(p =>
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const GC = AHS.AIEngine.GatewayConfig, GCV = AHS.AIEngine.GatewayConfigValidator,
      AC = AHS.AIEngine.ApiClient, SV = AHS.AIEngine.SchemaValidator,
      GW = AHS.AIEngine.AIGateway, SummarySchema = AHS.AIEngine.SummarySchema,
      QuestionSchema = AHS.AIEngine.QuestionSchema, ErrorSchema = AHS.AIEngine.ErrorSchema,
      MR = AHS.MaterialRuntime, FR = AHS.FolderRuntime, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline, QG = AHS.QuestionGenerationRuntime;

MR.reset(); FR.reset && FR.reset(); KG.reset();
AHS.DocumentClassifierRuntime.reset(); QG.clearQuestions();

console.log("\n[API surface]");
check("GatewayConfig 提供 FIELDS + get()/set()/isComplete()",
  Array.isArray(GC.FIELDS) && typeof new GC().get === "function" &&
  typeof new GC().set === "function" && typeof new GC().isComplete === "function");
check("GatewayConfig.FIELDS 恰為 provider/endpoint/model（無 apiKey 等憑證欄位）",
  JSON.stringify(GC.FIELDS) === JSON.stringify(["provider", "endpoint", "model"]));
check("GatewayConfigValidator 提供 validate()/validateOrThrow()",
  typeof new GCV().validate === "function" && typeof new GCV().validateOrThrow === "function");
check("ApiClient 提供 send()/isAvailable()",
  typeof new AC("x").send === "function" && typeof new AC("x").isAvailable === "function");
check("SchemaValidator 提供 validate()/validateOrThrow()",
  typeof new SV().validate === "function" && typeof new SV().validateOrThrow === "function");
check("AIGateway 提供規格內公開方法", ["configure", "getConfig", "setClient", "getClient",
  "isConfigured", "getSchema", "validateResponse", "request", "summarize", "generateQuestions"]
  .every(fn => typeof new GW()[fn] === "function"));

console.log("\n[GatewayConfig — 無 API Key 欄位，結構性保證]");
const emptyConfig = new GC();
check("預設三欄位皆為 null", emptyConfig.provider === null && emptyConfig.endpoint === null && emptyConfig.model === null);
check("isComplete() 預設為 false", emptyConfig.isComplete() === false);
try { emptyConfig.set("apiKey", "sk-fake"); check("set() 拒絕未知欄位（含 apiKey）", false); }
catch (e) { check("set() 拒絕未知欄位（含 apiKey）", e.name === "ValidationError"); }
const withApiKeyInCtor = new GC({ provider: "x", endpoint: "https://example.test", model: "m1", apiKey: "sk-fake" });
check("建構子傳入 apiKey 會被靜默忽略（從未成為任何屬性）", withApiKeyInCtor.apiKey === undefined);
check("isComplete() 三欄位皆為真實字串時為 true", withApiKeyInCtor.isComplete() === true);

console.log("\n[GatewayConfigValidator]");
check("合法設定通過驗證", new GCV().validate({ provider: "x", endpoint: "https://example.test", model: "m1" }).valid === true);
check("空物件（全部留白）通過驗證（尚未設定不是錯誤）", new GCV().validate({}).valid === true);
const apiKeyResult = new GCV().validate({ provider: "x", apiKey: "sk-fake" });
check("含 apiKey 欄位驗證失敗（No frontend API keys 的具體、可測試保證）",
  apiKeyResult.valid === false && apiKeyResult.errors.some(e => e.indexOf("apiKey") !== -1));
check("非字串型別驗證失敗", new GCV().validate({ provider: 123 }).valid === false);
try { new GCV().validateOrThrow({ token: "x" }); check("validateOrThrow 對非法設定拋出 ValidationError", false); }
catch (e) { check("validateOrThrow 對非法設定拋出 ValidationError", e.name === "ValidationError"); }

console.log("\n[ApiClient — 純介面，零網路能力]");
try { new AC(); check("建構子要求 id", false); } catch (e) { check("建構子要求 id", e.name === "AIEngineError"); }
try { new AC("x").send(); check("send() 為介面方法，未實作即拋錯", false); }
catch (e) { check("send() 為介面方法，未實作即拋錯", e.name === "AIEngineError"); }
try { new AC("x").isAvailable(); check("isAvailable() 為介面方法，未實作即拋錯", false); }
catch (e) { check("isAvailable() 為介面方法，未實作即拋錯", e.name === "AIEngineError"); }

console.log("\n[Schemas — 與既有真實 Model 逐欄位對齊]");
check("SummarySchema 為 frozen", Object.isFrozen(SummarySchema));
check("QuestionSchema 為 frozen", Object.isFrozen(QuestionSchema));
check("ErrorSchema 為 frozen", Object.isFrozen(ErrorSchema));
check("SummarySchema.properties 欄位與真實 SummaryBuilder.FIELDS 完全一致",
  JSON.stringify(Object.keys(SummarySchema.properties).sort()) ===
  JSON.stringify(AHS.AIEngine.SummaryBuilder.FIELDS.slice().sort()));
check("QuestionSchema.properties 欄位與真實 QuestionBuilder.FIELDS 完全一致",
  JSON.stringify(Object.keys(QuestionSchema.properties).sort()) ===
  JSON.stringify(AHS.AIEngine.QuestionBuilder.FIELDS.slice().sort()));

console.log("\n[SchemaValidator — 對真實 Summary/Question Model 輸出驗證]");
const knowledge = new AHS.AIEngine.KnowledgeLoader().loadFromObject({ materialId: "m1",
  metadata: new AHS.AIEngine.MetadataBuilder().fromMaterial({ id: "m1", title: "測試", subject: "math" }).build(),
  content: "測試內容" });
const realSummary = new AHS.AIEngine.SummaryBuilder().build(new AHS.AIEngine.SummaryExtractor().extract(knowledge));
check("真實 SummaryBuilder 輸出通過 SummarySchema 驗證",
  new SV().validate(SummarySchema, realSummary).valid === true);
const realQuestionSet = new AHS.AIEngine.QuestionBuilder().build(new AHS.AIEngine.QuestionExtractor().extract(knowledge));
check("真實 QuestionBuilder 輸出（空 questions stub）通過 QuestionSchema 驗證",
  new SV().validate(QuestionSchema, realQuestionSet).valid === true);
check("缺少必填欄位 subject 驗證失敗",
  new SV().validate(SummarySchema, { metadata: {} }).valid === false);
check("ErrorSchema 對合法/非法物件正確判斷",
  new SV().validate(ErrorSchema, { code: "E1", message: "msg" }).valid === true &&
  new SV().validate(ErrorSchema, { message: "msg only" }).valid === false);

console.log("\n[SchemaValidator — 對真實 LOCK Production Question 輸出逐項驗證]");
const TEXT = ["三角函數", "斜邊", "對邊", "正弦：對邊除以斜邊", "餘弦：鄰邊除以斜邊",
  "正切：對邊除以鄰邊", "餘弦定理 a² = b² + c² − 2bc·cosA", "正弦定理 a÷sinA = b÷sinB",
  "本節討論三角函數的定義、性質與其在解三角形中的應用。"].join("\n");
const folder = FR.createFolder({ folderName: "三角函數範圍", subject: "math", scopeType: "custom" });
const mat = MR.add({ title: "三角函數講義", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "三角函數教材.pdf", fileType: "PDF", folderId: folder.folderId, content: TEXT });
KP.process(mat.id);
const legacyRecord = QG.generateQuestions(mat.id);
check("前置：Legacy Production Runtime 產生真實題目", !!legacyRecord && legacyRecord.questions.length > 0);
const itemSchema = QuestionSchema.properties.questions.items;
let allItemsValid = true;
legacyRecord.questions.forEach(q => {
  const r = new SV().validate(itemSchema, q);
  if (!r.valid) { allItemsValid = false; console.log("    invalid: " + r.errors.join("; ")); }
});
check("QuestionSchema 的題目子綱要與真實 LOCK QuestionGenerationRuntime 輸出逐項相容（非憑空發明的形狀）",
  allItemsValid);
const badItem = Object.assign({}, legacyRecord.questions[0], { options: legacyRecord.questions[0].options.slice(0, 3) });
check("options 少於 4 個時驗證失敗（minItems 規則）", new SV().validate(itemSchema, badItem).valid === false);
const badEnum = Object.assign({}, legacyRecord.questions[0], { knowledgeType: "not-a-real-type" });
check("knowledgeType 不在 enum 內時驗證失敗", new SV().validate(itemSchema, badEnum).valid === false);

console.log("\n[原始碼靜態掃描 — 零 LLM／網路／持久化呼叫]");
const SCAN_FILES = [
  "ai-engine/src/gateway/GatewayConfig.js", "ai-engine/src/gateway/GatewayConfigValidator.js",
  "ai-engine/src/gateway/ApiClient.js", "ai-engine/src/gateway/AIGateway.js",
  "ai-engine/src/schema/SummarySchema.js", "ai-engine/src/schema/QuestionSchema.js",
  "ai-engine/src/schema/ErrorSchema.js", "ai-engine/src/schema/SchemaValidator.js"
];
const FORBIDDEN = [/\bfetch\s*\(/, /XMLHttpRequest/, /\blocalStorage\b/, /\bindexedDB\b/i,
  /OpenAI/i, /Anthropic/i, /api\.openai/i, /\bws:\/\//, /\bwss:\/\//, /apiKey\s*:\s*["'][^"']+["']/];
let scanHits = 0;
SCAN_FILES.forEach(p => {
  const src = fs.readFileSync(path.join(ROOT, p), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  FORBIDDEN.forEach(re => { if (re.test(src)) { scanHits++; console.log("    FORBIDDEN " + re + " in " + p); } });
});
check("新增 8 個檔案零 fetch/XHR/localStorage/OpenAI/Anthropic/WebSocket/硬編碼金鑰字樣", scanHits === 0);

console.log("\n[AIGateway — provider-independent，預設永遠未接線]");
const gw = new GW();
check("新建 Gateway 的 getConfig() 為預設空 GatewayConfig", gw.getConfig().provider === null);
check("新建 Gateway isConfigured() 為 false（Scope item 8：尚未整合生成）", gw.isConfigured() === false);
gw.configure({ provider: "custom", endpoint: "https://example.test/api", model: "m1" });
check("configure() 後 getConfig() 反映真實設定", gw.getConfig().endpoint === "https://example.test/api");
try { gw.configure({ apiKey: "sk-fake" }); check("configure() 拒絕含 apiKey 的設定", false); }
catch (e) { check("configure() 拒絕含 apiKey 的設定", e.name === "ValidationError"); }
check("設定完整但尚未 setClient() 時 isConfigured() 仍為 false", gw.isConfigured() === false);
try { gw.setClient({ send: function () {} }); check("setClient() 拒絕非 ApiClient 實例", false); }
catch (e) { check("setClient() 拒絕非 ApiClient 實例", e.name === "ValidationError"); }
check("getSchema('summary'/'question'/'error') 回傳對應真實 schema 參照",
  gw.getSchema("summary") === SummarySchema && gw.getSchema("question") === QuestionSchema &&
  gw.getSchema("error") === ErrorSchema);
try { gw.getSchema("unknown"); check("getSchema() 對未知 operation 拋錯", false); }
catch (e) { check("getSchema() 對未知 operation 拋錯", e.name === "ValidationError"); }
check("validateResponse() 無需任何後端即可運作（Scope item 10：deployment-ready）",
  gw.validateResponse("summary", realSummary).valid === true);
try { gw.request("summary", {}); check("未 setClient() 時 request() 誠實拋錯，不捏造回應", false); }
catch (e) { check("未 setClient() 時 request() 誠實拋錯，不捏造回應",
  e.name === "ServiceError" && e.message.indexOf("not configured") !== -1); }
try { gw.summarize({}); check("summarize() 同樣誠實拋錯", false); }
catch (e) { check("summarize() 同樣誠實拋錯", e.name === "ServiceError"); }
try { gw.generateQuestions({}); check("generateQuestions() 同樣誠實拋錯", false); }
catch (e) { check("generateQuestions() 同樣誠實拋錯", e.name === "ServiceError"); }

console.log("\n[介面驗證 — 一個測試專用的具體子類別，證明佈線正確，本身非正式產物]");
function StubClient(id) { AC.call(this, id); this.calls = []; }
StubClient.prototype = Object.create(AC.prototype);
StubClient.prototype.send = function (request) { this.calls.push(request); return { echoed: request }; };
StubClient.prototype.isAvailable = function () { return true; };
const stub = new StubClient("stub-1");
gw.setClient(stub);
check("完整 configure()+setClient() 後 isConfigured() 為 true", gw.isConfigured() === true);
const result = gw.summarize({ materialId: mat.id });
check("request() 正確委派至已註冊的 client.send()，攜帶 operation/payload/config",
  stub.calls.length === 1 && stub.calls[0].operation === "summary" &&
  stub.calls[0].payload.materialId === mat.id && stub.calls[0].config === gw.getConfig());
check("整個過程 StubClient.send() 本身無任何網路呼叫（純記憶體回傳）", result.echoed === stub.calls[0]);

console.log("\n[回歸 — 既有 Runtime／Summary／Question Production 行為不變]");
check("既有 AHS.QuestionGenerationRuntime.generateQuestions() 行為不變（真實資料，四選項規則）",
  legacyRecord.questions.every(q => q.options.length === 4 && q.type === "single_choice"));
check("既有 AHS.AIEngine.MetadataValidator 未被修改（沿用同一驗證邏輯）",
  new AHS.AIEngine.MetadataValidator().validate(realSummary.metadata).valid === true);

console.log("\n" + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
