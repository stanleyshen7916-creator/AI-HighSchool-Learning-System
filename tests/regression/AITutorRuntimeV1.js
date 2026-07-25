/* tests/regression/AITutorRuntimeV1.js — EO-S8.3.001.
   Verifies the AI Tutor Runtime Foundation: exactly seven public APIs,
   Runtime Registration, the LOCK Learning Context Model, read-only
   integration of the four capability runtimes (no generation, no
   rebuilding, no material/knowledge dependency), memory-only storage,
   and zero LLM/chat/UI scope creep.
   Run: node tests/regression/AITutorRuntimeV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js",
 "js/runtime/KnowledgeExtractionRuntime.js","js/parser/KnowledgePipeline.js",
 "js/runtime/SummaryRuntime.js","js/runtime/KnowledgeSummaryRuntime.js",
 "js/runtime/QuestionGenerationRuntime.js",
 "js/parser/LearningQuestionGenerator.js","js/runtime/LearningQuestionSession.js",
 "js/parser/WrongBookGenerator.js","js/runtime/WrongBookSession.js","js/runtime/ReviewQueue.js",
 "js/runtime/ReviewModel.js","js/runtime/ReviewGeneratorRuntime.js",
 "js/runtime/AITutorRuntime.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const AT = AHS.AITutorRuntime, KS = AHS.KnowledgeSummaryRuntime, QG = AHS.QuestionGenerationRuntime,
      RG = AHS.ReviewGeneratorRuntime, WBS = AHS.WrongBookSession, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline, FR = AHS.FolderRuntime, MR = AHS.MaterialRuntime,
      LQS = AHS.LearningQuestionSession, G = AHS.LearningQuestionGenerator;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset();
WBS.reset(); LQS.reset(); QG.clearQuestions(); RG.clearReview(); KS.clearSummary();

console.log("[API — 恰七個 Public API，不得新增其他]");
const API = ["initialize","getLearningContext","getKnowledgeSummary","getQuestionSet",
  "getWrongBook","getReviewList","serialize"];
API.forEach(fn => check("提供 " + fn + "()", typeof AT[fn] === "function"));
check("公開成員恰為這七個（無其他 API／常數）",
  JSON.stringify(Object.keys(AT).sort()) === JSON.stringify(API.slice().sort()));

console.log("\n[Runtime Registration — initialize()]");
const reg = AT.initialize();
check("回傳註冊狀態", !!reg && reg.initialized === true && /^\d{4}-\d{2}-\d{2}T/.test(reg.initializedAt));
check("註冊四個 capability（summary / question / wrongBook / review）",
  Array.isArray(reg.capabilities) && reg.capabilities.length === 4 &&
  JSON.stringify(reg.capabilities.map(c => c.id)) === JSON.stringify(["summary","question","wrongBook","review"]));
check("四個 capability 皆可用且回報所依賴之模組名稱",
  reg.capabilities.every(c => c.available === true && !!c.namespace) &&
  reg.availableCount === 4 && reg.missing.length === 0);
check("Summary 依賴 KnowledgeSummaryRuntime（KG 衍生），非 LOCK SummaryRuntime",
  reg.capabilities.find(c => c.id === "summary").namespace === "KnowledgeSummaryRuntime");
check("WrongBook 依賴 WrongBookSession（WrongBookGeneratorRuntime 不存在）",
  reg.capabilities.find(c => c.id === "wrongBook").namespace === "WrongBookSession");
check("重複 initialize() 安全（可重新註冊）", AT.initialize().availableCount === 4);
check("capability 缺失時誠實回報而非建立",
  (() => { const saved = AHS.ReviewGeneratorRuntime;
    delete AHS.ReviewGeneratorRuntime;
    const r = AT.initialize();
    AHS.ReviewGeneratorRuntime = saved; AT.initialize();
    return r.availableCount === 3 && r.missing.indexOf("review") !== -1; })());

console.log("\n[空資料狀態 — 誠實空區段，不觸發任何產生]");
const folder = FR.createFolder({ folderName: "三角函數範圍", subject: "math", scopeType: "custom" });
const TEXT = [
  "三角函數", "斜邊", "對邊",
  "正弦：對邊除以斜邊", "餘弦：鄰邊除以斜邊", "正切：對邊除以鄰邊",
  "餘弦定理 a² = b² + c² − 2bc·cosA", "正弦定理 a÷sinA = b÷sinB",
  "本節討論三角函數的定義、性質與其在解三角形中的應用。"
].join("\n");
const mat = MR.add({ title: "三角函數講義", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "三角函數教材.pdf", fileType: "PDF",
  folderId: folder.folderId, content: TEXT });
KP.process(mat.id);
const emptyCtx = AT.getLearningContext(mat.id);
check("尚未產生任何學習成果時：summary = {}、三個陣列為空",
  JSON.stringify(emptyCtx.summary) === "{}" && emptyCtx.questions.length === 0 &&
  emptyCtx.wrongBook.length === 0 && emptyCtx.review.length === 0);
check("讀取 Context 未觸發產生（各能力仍為空）",
  KS.getSummaryByMaterial(mat.id) === null && QG.getQuestionsByMaterial(mat.id) === null &&
  RG.getReviewByMaterial(mat.id) === null);

console.log("\n[Learning Context Model — LOCK 五欄位]");
/* 由各能力自行產生真實資料（AI Tutor 不參與產生） */
const summary = KS.createSummary(mat.id);
const qSet = QG.generateQuestions(mat.id);
const picked = qSet.questions.slice(0, 3);
picked.forEach(q => LQS.add(G.generate({
  id: q.id, materialId: mat.id, subject: "math", grade: "高一", chapter: "第三章", section: "",
  knowledgePoint: q.knowledgeNodeId, difficulty: q.difficulty, questionType: "single_choice",
  question: q.question, options: q.options, answer: q.answer,
  explanation: q.explanation, knowledgeId: q.knowledgeNodeId, summaryId: null
})));
[3, 2, 1].forEach((times, i) => {
  for (let n = 0; n < times; n += 1) {
    AHS.WrongBookGenerator.add({ questionId: picked[i].id, userAnswer: "錯誤答案" + n });
  }
});
const review = RG.generateReview(mat.id);
check("前置：四個能力皆已產生真實資料",
  !!summary && !!qSet && WBS.count() === 3 && !!review && review.reviewItems.length === 3);

const ctx = AT.getLearningContext(mat.id);
check("頂層欄位恰為 materialId / summary / questions / wrongBook / review",
  JSON.stringify(Object.keys(ctx).sort()) ===
  JSON.stringify(["materialId","questions","review","summary","wrongBook"]));
check("materialId 正確", ctx.materialId === mat.id);
check("summary 為物件、其餘三者為陣列",
  typeof ctx.summary === "object" && !Array.isArray(ctx.summary) &&
  Array.isArray(ctx.questions) && Array.isArray(ctx.wrongBook) && Array.isArray(ctx.review));
check("summary 逐字等於 Summary 能力之記錄（未改寫）",
  JSON.stringify(ctx.summary) === JSON.stringify(KS.getSummaryByMaterial(mat.id)));
check("questions 逐字等於 Question 能力之題目陣列",
  JSON.stringify(ctx.questions) === JSON.stringify(QG.getQuestionsByMaterial(mat.id).questions));
check("wrongBook 逐字等於該教材之錯題記錄",
  JSON.stringify(ctx.wrongBook) === JSON.stringify(WBS.list().filter(e => e.materialId === mat.id)));
check("review 逐字等於 Review 能力之項目陣列",
  JSON.stringify(ctx.review) === JSON.stringify(RG.getReviewByMaterial(mat.id).reviewItems));
check("無 materialId → null", AT.getLearningContext() === null && AT.getLearningContext(null) === null);
check("不存在的 materialId → 五欄位齊備但內容為空",
  (() => { const c = AT.getLearningContext("rt_none");
    return c.materialId === "rt_none" && JSON.stringify(c.summary) === "{}" &&
      c.questions.length === 0 && c.wrongBook.length === 0 && c.review.length === 0; })());

console.log("\n[個別讀取 API]");
check("getKnowledgeSummary 回傳 Summary 記錄",
  AT.getKnowledgeSummary(mat.id).materialId === mat.id);
check("getQuestionSet 回傳題目陣列", AT.getQuestionSet(mat.id).length === qSet.questions.length);
check("getWrongBook 回傳該教材錯題（3 筆）", AT.getWrongBook(mat.id).length === 3);
check("getReviewList 回傳複習項目（3 筆）", AT.getReviewList(mat.id).length === 3);
check("四個 API 無參數時回傳誠實空值",
  JSON.stringify(AT.getKnowledgeSummary()) === "{}" && AT.getQuestionSet().length === 0 &&
  AT.getWrongBook().length === 0 && AT.getReviewList().length === 0);
check("wrongBook 依 materialId 過濾（不混入其他教材）",
  (() => { const m2 = MR.add({ title: "其他教材", subject: "math", grade: "高一", category: "講義",
      fileName: "other教材.pdf", fileType: "PDF", folderId: folder.folderId, content: "餘弦：鄰邊除以斜邊" });
    KP.process(m2.id); const q2 = QG.generateQuestions(m2.id);
    LQS.add(G.generate({ id: q2.questions[0].id, materialId: m2.id, subject: "math", grade: "高一",
      chapter: "", section: "", knowledgePoint: "x", difficulty: q2.questions[0].difficulty,
      questionType: "single_choice", question: q2.questions[0].question, options: q2.questions[0].options,
      answer: q2.questions[0].answer, explanation: "說明", knowledgeId: q2.questions[0].knowledgeNodeId }));
    AHS.WrongBookGenerator.add({ questionId: q2.questions[0].id, userAnswer: "錯" });
    return AT.getWrongBook(mat.id).length === 3 && AT.getWrongBook(m2.id).length === 1; })());

console.log("\n[Runtime Rules — 僅整合，不得產生／重建（原始碼掃描）]");
const code = fs.readFileSync(path.join(ROOT, "js/runtime/AITutorRuntime.js"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
["createSummary","generateQuestions","generateReview","clearSummary","clearQuestions","clearReview"]
  .forEach(m => check("未呼叫 " + m + "()", code.indexOf(m + "(") === -1));
check("未呼叫 WrongBookGenerator（不得重建 WrongBook）",
  code.indexOf("AHS.WrongBookGenerator") === -1);
["MaterialRuntime","AnalysisRuntime","KnowledgeExtractionRuntime","KnowledgeGraphRuntime",
 "MaterialTextProvider","ParserAdapterRegistry","SummaryGenerator","QuestionGenerationFlow"]
  .forEach(m => check("未依賴 " + m + "（不得重新解析教材／重建 Knowledge Graph）",
    code.indexOf("AHS." + m) === -1));
check("僅使用四個能力之唯讀 API",
  /getSummaryByMaterial/.test(code) && /getQuestionsByMaterial/.test(code) &&
  /getReviewByMaterial/.test(code) && /\.list\(\)/.test(code));

console.log("\n[Scope — 無 LLM／聊天／UI／Parser]");
check("零 LLM／Provider 呼叫",
  !/openai|gemini|anthropic|claude|AIProvider|prompt/i.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));
check("零 DOM／UI 操作",
  !/document\.|window\.AHS\.UI|createElement|addEventListener|innerHTML/.test(code));
check("零語音／OCR／Parser", !/speech|voice|ocr|tesseract|pdfjs/i.test(code));

console.log("\n[Runtime — Memory Only]");
check("原始碼零 localStorage / sessionStorage / IndexedDB / PersistenceAdapter",
  !/localStorage|sessionStorage|indexedDB|PersistenceAdapter/i.test(code));

console.log("\n[serialize()]");
check("serialize(materialId) 為合法 JSON 且含五欄位",
  (() => { const o = JSON.parse(AT.serialize(mat.id));
    return JSON.stringify(Object.keys(o).sort()) ===
      JSON.stringify(["materialId","questions","review","summary","wrongBook"]); })());
check("serialize() 無參數回傳註冊狀態",
  (() => { const o = JSON.parse(AT.serialize());
    return o.initialized === true && Array.isArray(o.capabilities); })());
check("serialize 為純讀取（未改變任何能力狀態）",
  (() => { const before = JSON.stringify([KS.getSummaryByMaterial(mat.id), QG.getQuestionsByMaterial(mat.id),
      WBS.list(), RG.getReviewByMaterial(mat.id)]);
    AT.serialize(mat.id); AT.serialize();
    return JSON.stringify([KS.getSummaryByMaterial(mat.id), QG.getQuestionsByMaterial(mat.id),
      WBS.list(), RG.getReviewByMaterial(mat.id)]) === before; })());

console.log("\n[Context 為即時視圖 — 不持有陳舊副本]");
check("能力端更新後 Context 立即反映",
  (() => { const before = AT.getQuestionSet(mat.id).length;
    QG.clearQuestions(mat.id);
    const after = AT.getQuestionSet(mat.id).length;
    QG.generateQuestions(mat.id);
    return before > 0 && after === 0 && AT.getQuestionSet(mat.id).length > 0; })());
check("外部修改 Context 不影響能力端資料",
  (() => { const c = AT.getLearningContext(mat.id); c.questions.push({ id: "污染" });
    return AT.getQuestionSet(mat.id).length === QG.getQuestionsByMaterial(mat.id).questions.length; })());

console.log("\n[既有 Runtime 未受影響]");
check("LOCK SummaryRuntime 未被寫入", AHS.SummaryRuntime.list().length === 0);
check("LOCK ReviewQueue / ReviewModel API 未變",
  AHS.ReviewQueue.count() === 0 &&
  ["getTodayReview","getDueReview","getReviewProgress","getMasteryStatistics","setNextReview"]
    .every(k => typeof AHS.ReviewModel[k] === "function"));
check("四個能力 Runtime 為不同模組（未重複建立）",
  AT !== KS && AT !== QG && AT !== RG && AT !== WBS);

console.log("\nAITutorRuntimeV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
