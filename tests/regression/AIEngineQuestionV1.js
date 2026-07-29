/* tests/regression/AIEngineQuestionV1.js — Sprint AI-101 · Question Production Pipeline.
   Mirrors the coverage of EO-AI-005/EO-AI-006/EO-AI-007/EO-AI-011's own
   node-vm-sandbox unit tests (see docs/migration/EO_AI_005_REPORT.md
   "Unit Test" section), extended to permanent-regression-file form
   since this Sprint's own Deliverables list "Unit tests" as a
   persisted deliverable rather than a one-off scratch script.

   Verifies: QuestionExtractor/Builder/Formatter/Validator/Engine
   (Foundation), QuestionRuntime/History/Session/Pipeline (Runtime
   integration), QuestionService/QuestionProvider (Service layer,
   legacy/new modes only), js/ai/QuestionAdapter.js (Platform passthrough),
   AIEngine.registerService()/getService() integration (zero AIEngine.js
   changes), zero LLM/network/persistence calls (source-scan), zero
   duplication of/interference with the existing production
   AHS.QuestionGenerationRuntime (LOCK) or the existing top-level
   AHS.QuestionRuntime (Sprint 4, Exam Mode), and the honest-empty-stub
   `questions` field (no fabricated content).
   Run: node tests/regression/AIEngineQuestionV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};

const AI_ENGINE_FILES = [
  "ai-engine/src/common/Utilities.js",
  "ai-engine/src/common/Errors.js",
  "ai-engine/src/common/Version.js",
  "ai-engine/src/common/Constants.js",
  "ai-engine/src/core/AIService.js",
  "ai-engine/src/core/ServiceRegistry.js",
  "ai-engine/src/providers/BaseProvider.js",
  "ai-engine/src/providers/ProviderRegistry.js",
  "ai-engine/src/providers/ProviderFactory.js",
  "ai-engine/src/providers/ProviderManager.js",
  "ai-engine/src/context/ContextValidator.js",
  "ai-engine/src/context/ContextBuilder.js",
  "ai-engine/src/context/ContextManager.js",
  "ai-engine/src/knowledge/Metadata.js",
  "ai-engine/src/knowledge/MetadataBuilder.js",
  "ai-engine/src/knowledge/MetadataValidator.js",
  "ai-engine/src/knowledge/KnowledgeCache.js",
  "ai-engine/src/knowledge/KnowledgeLoader.js",
  "ai-engine/src/knowledge/KnowledgeIndex.js",
  "ai-engine/src/knowledge/KnowledgeProvider.js",
  "ai-engine/src/knowledge/KnowledgeRegistry.js",
  "ai-engine/src/core/AIEngine.js",
  "ai-engine/src/core/AIEngineFactory.js",
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
  "js/runtime/QuestionRuntime.js",
  "js/ai/QuestionAdapter.js"
];

AI_ENGINE_FILES.concat(PLATFORM_FILES).forEach(p =>
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const QX = AHS.AIEngine.QuestionExtractor, QB = AHS.AIEngine.QuestionBuilder,
      QF = AHS.AIEngine.QuestionFormatter, QV = AHS.AIEngine.QuestionValidator,
      QE = AHS.AIEngine.QuestionEngine, QR = AHS.AIEngine.QuestionRuntime,
      QH = AHS.AIEngine.QuestionHistory, QS = AHS.AIEngine.QuestionSession,
      QP = AHS.AIEngine.QuestionPipeline, QSvc = AHS.AIEngine.QuestionService,
      QProv = AHS.AIEngine.QuestionProvider, QAdapter = AHS.QuestionAdapter,
      MR = AHS.MaterialRuntime, FR = AHS.FolderRuntime, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline, QG = AHS.QuestionGenerationRuntime;

MR.reset(); FR.reset && FR.reset(); KG.reset();
AHS.DocumentClassifierRuntime.reset(); QG.clearQuestions();

/* Real Foundation run — same real-data shape as QuestionGenerationRuntimeV1.js,
   giving the Legacy production Runtime real questions to fall back to. */
const TEXT = [
  "三角函數", "斜邊", "對邊",
  "正弦：對邊除以斜邊",
  "餘弦：鄰邊除以斜邊",
  "正切：對邊除以鄰邊",
  "餘弦定理 a² = b² + c² − 2bc·cosA",
  "正弦定理 a÷sinA = b÷sinB",
  "本節討論三角函數的定義、性質與其在解三角形中的應用。"
].join("\n");
const folder = FR.createFolder({ folderName: "三角函數範圍", subject: "math", scopeType: "custom" });
const mat = MR.add({ title: "三角函數講義", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "三角函數教材.pdf", fileType: "PDF",
  folderId: folder.folderId, content: TEXT });
const run = KP.process(mat.id);
check("前置：Foundation 管線寫入知識節點", run.status === "success" && run.nodesCreated === 9);
const legacyRecord = QG.generateQuestions(mat.id);
check("前置：Legacy Production Runtime 產生真實題目", !!legacyRecord && legacyRecord.questions.length > 0);

console.log("\n[API surface — 每個新模組僅暴露規格內的公開方法]");
check("QuestionExtractor 提供 extract()", typeof new QX().extract === "function");
check("QuestionBuilder 提供 build() + FIELDS", typeof new QB().build === "function" && Array.isArray(QB.FIELDS));
check("QuestionFormatter 提供 toRuntimeObject()/toJSON()",
  typeof new QF().toRuntimeObject === "function" && typeof new QF().toJSON === "function");
check("QuestionValidator 提供 validate()/validateOrThrow()",
  typeof new QV().validate === "function" && typeof new QV().validateOrThrow === "function");
check("QuestionEngine 提供 generate()/generateByKnowledge()/generateBatch()",
  typeof new QE().generate === "function" && typeof new QE().generateByKnowledge === "function" &&
  typeof new QE().generateBatch === "function");
check("QuestionRuntime 提供 save()/get()/list()/remove()/clear()",
  ["save", "get", "list", "remove", "clear"].every(fn => typeof new QR()[fn] === "function"));
check("QuestionHistory 提供 record()/latest()/list()",
  ["record", "latest", "list"].every(fn => typeof new QH()[fn] === "function"));
check("QuestionSession 提供 start()/stop()/current()",
  ["start", "stop", "current"].every(fn => typeof new QS()[fn] === "function"));
check("QuestionPipeline 提供 run()", typeof new QP().run === "function");
check("QuestionService 公開成員為規格四個 API",
  JSON.stringify(Object.keys(QSvc).sort()) ===
  JSON.stringify(["generate", "generateFromMaterial", "get", "getWithFallback"]));
check("QuestionProvider 公開成員為規格五個 API",
  JSON.stringify(Object.keys(QProv).sort()) ===
  JSON.stringify(["MODES", "generateQuestions", "getMode", "getQuestions", "setMode"]));
check("QuestionAdapter 公開成員與 QuestionService+QuestionProvider 對齊（含 Sprint AI-101C 新增的 generateViaGateway）",
  JSON.stringify(Object.keys(QAdapter).sort()) === JSON.stringify(
    ["generate", "generateFromMaterial", "generateQuestions", "generateViaGateway", "get", "getMode",
     "getQuestions", "getWithFallback", "setMode"].sort()));

console.log("\n[QuestionExtractor — 結構性抽取，不讀內容語意]");
try { new QX().extract("not-an-object"); check("非物件輸入拋出 ValidationError", false); }
catch (e) { check("非物件輸入拋出 ValidationError", e.name === "ValidationError"); }
const knowledge = new AHS.AIEngine.KnowledgeLoader().loadFromMaterial(mat.id);
const extracted = new QX().extract(knowledge);
check("materialId 正確", extracted.materialId === mat.id);
check("metadata 存在", !!extracted.metadata);
check("chapter 來自真實 metadata", extracted.chapter === "第三章");
check("structure.hasContent 正確反映真實內容", extracted.structure.hasContent === true);
check("structure.contentLength 為真實字數", extracted.structure.contentLength === TEXT.length);
check("回傳結果為 frozen", Object.isFrozen(extracted));

console.log("\n[QuestionBuilder — 誠實 stub，無捏造內容]");
try { new QB().build("not-an-object"); check("非物件輸入拋出 ValidationError", false); }
catch (e) { check("非物件輸入拋出 ValidationError", e.name === "ValidationError"); }
const built = new QB().build(extracted);
check("9 個欄位齊全", JSON.stringify(Object.keys(built).sort()) === JSON.stringify(QB.FIELDS.slice().sort()));
check("subject 來自真實 metadata", built.subject === "math");
check("title 來自真實 metadata（結構性直接映射）", built.title === "三角函數講義");
check("questions 為誠實空陣列 stub（無 AI/規則生成內容）", Array.isArray(built.questions) && built.questions.length === 0);
check("keywords 為 tags 的結構性直接映射", Array.isArray(built.keywords));
check("回傳結果為 frozen", Object.isFrozen(built));

console.log("\n[QuestionFormatter — 純格式轉換，無 HTML]");
const formatted = new QF().toRuntimeObject(built);
check("toRuntimeObject 回傳未 frozen 的 plain object", !Object.isFrozen(formatted));
check("缺少欄位以 null 補齊", (function () {
  const partial = new QF().toRuntimeObject({ subject: "math" });
  return partial.title === null && partial.questions === null;
})());
const json = new QF().toJSON(built);
check("toJSON 回傳合法 JSON 字串", typeof json === "string" && JSON.parse(json).subject === "math");
check("輸出不含 HTML 標籤", !/<[a-z][\s\S]*>/i.test(json));

console.log("\n[QuestionValidator — 必填／型別／委派 Metadata 驗證]");
check("合法 model 通過驗證", new QV().validate(built).valid === true);
check("缺少 subject 驗證失敗", new QV().validate({ metadata: built.metadata }).valid === false);
check("questions 非陣列時驗證失敗",
  new QV().validate({ subject: "math", metadata: built.metadata, questions: "not-array" }).valid === false);
check("委派 MetadataValidator（非法 metadata 導致失敗）",
  new QV().validate({ subject: "math", metadata: { invalid: true } }).valid === false ||
  new QV().validate({ subject: "math", metadata: "not-object" }).valid === false);
try { new QV().validateOrThrow({}); check("validateOrThrow 對非法 model 拋出 ValidationError", false); }
catch (e) { check("validateOrThrow 對非法 model 拋出 ValidationError", e.name === "ValidationError"); }

console.log("\n[QuestionEngine — 端對端貫通，無 LLM]");
const generated = new QE().generate(mat.id);
check("generate(materialId) 端對端成功", generated.subject === "math" && Array.isArray(generated.questions));
const byKnowledge = new QE().generateByKnowledge(knowledge);
check("generateByKnowledge(knowledge) 與 generate() 一致", byKnowledge.subject === generated.subject);
const batch = new QE().generateBatch([mat.id]);
check("generateBatch() 回傳陣列", Array.isArray(batch) && batch.length === 1);
try { new QE().generate("not-a-real-material-id"); check("找不到教材時正確拋錯", false); }
catch (e) { check("找不到教材時正確拋錯", e.name === "ValidationError"); }
try { new QE().generateBatch("not-an-array"); check("generateBatch 要求陣列", false); }
catch (e) { check("generateBatch 要求陣列", e.name === "ValidationError"); }

console.log("\n[原始碼靜態掃描 — 零 LLM／網路／持久化呼叫]");
const SCAN_FILES = AI_ENGINE_FILES.filter(p => p.indexOf("services/question/") !== -1 ||
  p.indexOf("runtime/Question") !== -1 || p.indexOf("service/Question") !== -1)
  .concat(["js/ai/QuestionAdapter.js"]);
const FORBIDDEN = [/\bfetch\s*\(/, /XMLHttpRequest/, /\blocalStorage\b/, /\bindexedDB\b/i,
  /OpenAI/i, /Anthropic/i, /api\.openai/i, /\bws:\/\//, /\bwss:\/\//];
let scanHits = 0;
SCAN_FILES.forEach(p => {
  /* strip comments first, same as scripts/verify/VerifyForbiddenPatterns.js —
     the project's own file headers legitimately DOCUMENT the forbidden
     APIs (e.g. "No persistence (no localStorage/IndexedDB)"); only real
     code counts. */
  const src = fs.readFileSync(path.join(ROOT, p), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  FORBIDDEN.forEach(re => { if (re.test(src)) { scanHits++; console.log("    FORBIDDEN " + re + " in " + p); } });
});
check("新增 9 個檔案零 fetch/XHR/localStorage/OpenAI/Anthropic/WebSocket 字樣", scanHits === 0);

console.log("\n[QuestionRuntime — 記憶體儲存，與既有 AHS Runtime 命名空間不重複]");
const qr = new QR();
try { qr.save({}); check("save() 缺少 metadata.materialId 拋錯", false); }
catch (e) { check("save() 缺少 metadata.materialId 拋錯", e.name === "ValidationError"); }
qr.save(formatted);
check("get() 取回剛儲存的 Question Set", qr.get(mat.id).subject === "math");
check("list() 含剛儲存的一筆", qr.list().length === 1);
qr.remove(mat.id);
check("remove() 後 get() 為 undefined", qr.get(mat.id) === undefined);
qr.save(formatted); qr.clear();
check("clear() 後 list() 為空", qr.list().length === 0);
check("AHS.AIEngine.QuestionRuntime 與 AHS.QuestionRuntime（Sprint 4）為不同命名空間",
  AHS.AIEngine.QuestionRuntime !== AHS.QuestionRuntime);
check("既有 AHS.QuestionGenerationRuntime（LOCK）API 未被覆蓋",
  typeof AHS.QuestionGenerationRuntime.generateQuestions === "function" &&
  typeof AHS.QuestionGenerationRuntime.getQuestionsByMaterial === "function");

console.log("\n[QuestionHistory / QuestionSession]");
const qh = new QH();
const entry = qh.record(formatted);
check("record() 回傳含 materialId/generatedAt/question 的 entry",
  entry.materialId === mat.id && !!entry.generatedAt && entry.question === formatted);
check("latest() 取回最新 entry", qh.latest(mat.id) === entry);
check("list() 回傳全部 entry", qh.list().length === 1);
const qs = new QS();
try { qs.start(); check("start() 缺少 materialId 拋錯", false); }
catch (e) { check("start() 缺少 materialId 拋錯", e.name === "ValidationError"); }
qs.start(mat.id);
check("current() 回傳進行中的 materialId", qs.current() === mat.id);
qs.stop();
check("stop() 後 current() 為 null", qs.current() === null);

console.log("\n[QuestionPipeline — session 生命週期，含錯誤路徑]");
const pipelineResult = new QP().run(mat.id);
check("run() 端對端成功", pipelineResult.subject === "math" && Array.isArray(pipelineResult.questions));
const freshSession = new QS();
const freshPipeline = new QP({ session: freshSession });
try { freshPipeline.run("not-a-real-material-id"); }
catch (e) { /* expected */ }
check("錯誤路徑下 session 仍正確 stop（try/finally）", freshSession.current() === null);

console.log("\n[QuestionService — 單例、Legacy Fallback]");
check("generate(materialId) 端對端成功", QSvc.generate(mat.id).subject === "math");
check("get(materialId) 取回同一份快取（同一 Runtime 單例）", QSvc.get(mat.id).subject === "math");
try { QSvc.generateFromMaterial({}); check("generateFromMaterial 缺少 id 拋錯", false); }
catch (e) { check("generateFromMaterial 缺少 id 拋錯", e.name === "ValidationError"); }
check("generateFromMaterial(material) 端對端成功", QSvc.generateFromMaterial(mat).subject === "math");
check("getWithFallback：New pipeline 目前恆為誠實空陣列，因此回退讀取真實 Legacy 內容",
  (function () {
    const fb = QSvc.getWithFallback(mat.id);
    return !!fb && Array.isArray(fb.questions) && fb.questions.length > 0 &&
      fb.questions[0].id.indexOf("qg_") === 0; /* qg_ = QuestionGenerationRuntime's real id prefix */
  })());
check("getWithFallback 從未寫入 Legacy Runtime（唯讀）",
  QG.getQuestionsByMaterial(mat.id).questions.length === legacyRecord.questions.length);

console.log("\n[QuestionProvider — legacy/new 兩種模式，getQuestions 恆唯讀]");
check("MODES 僅 legacy/new（compare 依規格未要求，不建構）", JSON.stringify(QProv.MODES) === JSON.stringify(["legacy", "new"]));
check("預設模式為 legacy（New pipeline 尚無真實內容，避免 EO-AI-012C 曾發生過的回歸）", QProv.getMode() === "legacy");
try { QProv.setMode("compare"); check("setMode 拒絕未支援的模式", false); }
catch (e) { check("setMode 拒絕未支援的模式", e.name === "ValidationError"); }
check("legacy 模式 getQuestions 讀到真實 Legacy 內容",
  QProv.getQuestions(mat.id).questions.length === legacyRecord.questions.length);
QProv.setMode("new");
const freshMaterial = MR.add({ title: "測試教材二", subject: "math", grade: "高一", chapter: "第四章",
  category: "講義", fileName: "b.pdf", fileType: "PDF", folderId: folder.folderId, content: "測試內容" });
check("new 模式下 getQuestions 對尚未 generate 的教材為唯讀（不觸發生成）",
  QProv.getQuestions(freshMaterial.id) === undefined);
const genResult = QProv.generateQuestions(freshMaterial.id);
check("generateQuestions 於 new 模式下才真正執行 New pipeline", genResult.subject === "math");
check("執行後 getQuestions 讀到剛生成的內容（仍是唯讀讀取，不重新生成）",
  QProv.getQuestions(freshMaterial.id).subject === "math");
QProv.setMode("legacy");

console.log("\n[QuestionAdapter — Platform 端 passthrough，未接線至任何頁面]");
check("generate() 委派至 QuestionService", QAdapter.generate(mat.id).subject === "math");
check("getMode()/setMode() 委派至 QuestionProvider", (function () {
  QAdapter.setMode("new"); const m = QAdapter.getMode(); QAdapter.setMode("legacy"); return m === "new";
})());

console.log("\n[AIEngine Integration — registerService()/getService()，零修改 AIEngine.js]");
const engine = new AHS.AIEngine.AIEngine();
engine.registerService(new AHS.AIEngine.QuestionEngine());
check("透過既有 registerService() 註冊成功，id 使用既有 SERVICE_IDS.QUESTION 常數",
  AHS.AIEngine.SERVICE_IDS.QUESTION === "question");
check("透過既有 getService('question') 取得並可正常呼叫 generate()",
  engine.getService("question").generate(mat.id).subject === "math");

console.log("\n[回歸 — 既有 Summary/Question Production 行為不變]");
check("既有 AHS.QuestionGenerationRuntime.generateQuestions() 行為不變（真實資料，四選項規則）",
  legacyRecord.questions.every(q => q.options.length === 4 && q.type === "single_choice"));
check("既有 AHS.AIEngine.SERVICE_IDS 未被修改（含既有 SUMMARY/QUESTION/... 七個保留值）",
  JSON.stringify(Object.keys(AHS.AIEngine.SERVICE_IDS).sort()) ===
  JSON.stringify(["EXPLANATION", "KNOWLEDGE", "PROMPT", "QUESTION", "REVIEW", "SUMMARY", "TUTOR"].sort()));

console.log("\n" + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
