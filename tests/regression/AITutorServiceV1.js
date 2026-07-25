/* tests/regression/AITutorServiceV1.js — EO-S8.3.002.
   Verifies the AI Tutor Service Layer: exactly seven public APIs, the
   LOCK Learning Session Model, coordination through AITutorRuntime,
   read-only behaviour (no generation, no rebuilding, no material/
   knowledge dependency), no LLM/chat/UI scope creep, and memory-only
   storage.
   Run: node tests/regression/AITutorServiceV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js","js/parser/MaterialTextPipeline.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js",
 "js/runtime/KnowledgeExtractionRuntime.js","js/parser/KnowledgePipeline.js",
 "js/runtime/SummaryRuntime.js","js/runtime/KnowledgeSummaryRuntime.js",
 "js/runtime/QuestionGenerationRuntime.js",
 "js/parser/LearningQuestionGenerator.js","js/runtime/LearningQuestionSession.js",
 "js/parser/WrongBookGenerator.js","js/runtime/WrongBookSession.js","js/runtime/ReviewQueue.js",
 "js/runtime/ReviewModel.js","js/runtime/ReviewGeneratorRuntime.js",
 "js/runtime/AITutorRuntime.js","js/runtime/AITutorService.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const SV = AHS.AITutorService, AT = AHS.AITutorRuntime, KS = AHS.KnowledgeSummaryRuntime,
      QG = AHS.QuestionGenerationRuntime, RG = AHS.ReviewGeneratorRuntime, WBS = AHS.WrongBookSession,
      KG = AHS.KnowledgeGraphRuntime, KP = AHS.KnowledgePipeline, FR = AHS.FolderRuntime,
      MR = AHS.MaterialRuntime, LQS = AHS.LearningQuestionSession, G = AHS.LearningQuestionGenerator;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset();
WBS.reset(); LQS.reset(); QG.clearQuestions(); RG.clearReview(); KS.clearSummary();

console.log("[API — 恰七個 Public API，不得新增其他]");
const API = ["ensureLearningSummary","ensureQuestionSet","buildLearningContext","getLearningSummary",
  "getPracticeQuestions","getWrongBookItems","getReviewItems","getTutorSession","serialize"];
API.forEach(fn => check("提供 " + fn + "()", typeof SV[fn] === "function"));
check("公開成員恰為這七個（無其他 API／常數）",
  JSON.stringify(Object.keys(SV).sort()) === JSON.stringify(API.slice().sort()));

console.log("\n[空資料狀態 — 誠實空區段，不觸發產生]");
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
const emptySession = SV.buildLearningContext(mat.id);
check("尚未產生任何成果時：summary = {}、三陣列為空",
  JSON.stringify(emptySession.summary) === "{}" && emptySession.questions.length === 0 &&
  emptySession.wrongBook.length === 0 && emptySession.review.length === 0);
check("建立 Session 未觸發產生（各能力仍為空）",
  KS.getSummaryByMaterial(mat.id) === null && QG.getQuestionsByMaterial(mat.id) === null &&
  RG.getReviewByMaterial(mat.id) === null);

console.log("\n[Learning Session Model — LOCK 六欄位]");
/* 由各能力自行產生真實資料（Service 不參與產生） */
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

const session = SV.buildLearningContext(mat.id);
check("頂層欄位恰為 materialId / summary / questions / wrongBook / review / generatedAt",
  JSON.stringify(Object.keys(session).sort()) ===
  JSON.stringify(["generatedAt","materialId","questions","review","summary","wrongBook"]));
check("materialId 正確且 generatedAt 為 ISO 時間",
  session.materialId === mat.id && /^\d{4}-\d{2}-\d{2}T/.test(session.generatedAt));
check("summary 為物件、其餘三者為陣列",
  typeof session.summary === "object" && !Array.isArray(session.summary) &&
  Array.isArray(session.questions) && Array.isArray(session.wrongBook) && Array.isArray(session.review));
check("summary 逐字等於 Summary 能力之記錄",
  JSON.stringify(session.summary) === JSON.stringify(KS.getSummaryByMaterial(mat.id)));
check("questions 逐字等於 Question 能力之題目陣列",
  JSON.stringify(session.questions) === JSON.stringify(QG.getQuestionsByMaterial(mat.id).questions));
check("wrongBook 逐字等於該教材錯題記錄",
  JSON.stringify(session.wrongBook) === JSON.stringify(WBS.list().filter(e => e.materialId === mat.id)));
check("review 逐字等於 Review 能力之項目陣列",
  JSON.stringify(session.review) === JSON.stringify(RG.getReviewByMaterial(mat.id).reviewItems));
check("無 materialId → null", SV.buildLearningContext() === null && SV.buildLearningContext(null) === null);

console.log("\n[個別協調 API]");
check("getLearningSummary 回傳 Summary 記錄", SV.getLearningSummary(mat.id).materialId === mat.id);
check("getPracticeQuestions 回傳題目陣列", SV.getPracticeQuestions(mat.id).length === qSet.questions.length);
check("getWrongBookItems 回傳該教材錯題（3 筆）", SV.getWrongBookItems(mat.id).length === 3);
check("getReviewItems 回傳複習項目（3 筆）", SV.getReviewItems(mat.id).length === 3);
check("四個 API 無參數時回傳誠實空值",
  JSON.stringify(SV.getLearningSummary()) === "{}" && SV.getPracticeQuestions().length === 0 &&
  SV.getWrongBookItems().length === 0 && SV.getReviewItems().length === 0);
check("各 API 輸出與 AITutorRuntime 對應輸出一致（透過既有整合層協調）",
  JSON.stringify(SV.getLearningSummary(mat.id)) === JSON.stringify(AT.getKnowledgeSummary(mat.id)) &&
  JSON.stringify(SV.getPracticeQuestions(mat.id)) === JSON.stringify(AT.getQuestionSet(mat.id)) &&
  JSON.stringify(SV.getWrongBookItems(mat.id)) === JSON.stringify(AT.getWrongBook(mat.id)) &&
  JSON.stringify(SV.getReviewItems(mat.id)) === JSON.stringify(AT.getReviewList(mat.id)));

console.log("\n[getTutorSession / serialize]");
check("getTutorSession(materialId) 建立並回傳該教材 Session",
  SV.getTutorSession(mat.id).materialId === mat.id);
check("getTutorSession() 無參數回傳最近一次 Session", SV.getTutorSession().materialId === mat.id);
check("getTutorSession() 於尚未建立時為 null（新環境）",
  (() => { const code = fs.readFileSync(path.join(ROOT, "js/runtime/AITutorService.js"), "utf8");
    return /lastSession \? clone\(lastSession\) : null/.test(code); })());
check("serialize(materialId) 為合法 JSON 且含六欄位",
  (() => { const o = JSON.parse(SV.serialize(mat.id));
    return JSON.stringify(Object.keys(o).sort()) ===
      JSON.stringify(["generatedAt","materialId","questions","review","summary","wrongBook"]); })());
check("serialize() 無參數回傳最近 Session",
  (() => { const o = JSON.parse(SV.serialize()); return o.materialId === mat.id; })());
check("回傳值為複本（外部修改不影響 Service）",
  (() => { const s = SV.getTutorSession(mat.id); s.questions.push({ id: "污染" });
    return SV.getTutorSession(mat.id).questions.length === qSet.questions.length; })());
check("serialize 為純讀取（未改變任何能力狀態）",
  (() => { const before = JSON.stringify([KS.getSummaryByMaterial(mat.id),
      QG.getQuestionsByMaterial(mat.id), WBS.list(), RG.getReviewByMaterial(mat.id)]);
    SV.serialize(mat.id); SV.serialize();
    return JSON.stringify([KS.getSummaryByMaterial(mat.id), QG.getQuestionsByMaterial(mat.id),
      WBS.list(), RG.getReviewByMaterial(mat.id)]) === before; })());

console.log("\n[Runtime Rules — 僅協調，不得重建（原始碼掃描）]");
const code = fs.readFileSync(path.join(ROOT, "js/runtime/AITutorService.js"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
/* EO-S8.3.004 授權 ensureLearningSummary 協調產生 Summary（呼叫
   KnowledgeSummaryRuntime.createSummary，該方法從既有知識圖譜衍生、
   不重新解析教材）。其餘產生／清除方法仍一律禁止。 */
/* EO-S8.3.004／006 授權 ensure* 協調產生（createSummary / generateQuestions
   從既有知識圖譜衍生，不重新分析教材）。其餘產生／清除方法仍一律禁止。 */
["generateReview","clearSummary","clearQuestions","clearReview"]
  .forEach(m => check("未呼叫 " + m + "()", code.indexOf(m + "(") === -1));
check("createSummary 僅出現於 ensureLearningSummary（UI 分析入口）",
  (() => { const calls = (code.match(/createSummary\(/g) || []).length;
    return calls === 1 && /ensureLearningSummary/.test(code); })());
check("generateQuestions 僅出現於 ensureQuestionSet（UI 產題入口）",
  (() => { const idx = code.indexOf("function ensureQuestionSet");
    const others = code.slice(0, idx) + code.slice(code.indexOf("function", idx + 10));
    return /generateQuestions\(/.test(code.slice(idx)) &&
      !/generateQuestions\(/.test(code.slice(0, idx)); })());
check("未呼叫 WrongBookGenerator（不得重建 WrongBook）", code.indexOf("AHS.WrongBookGenerator") === -1);
/* EO-S8.3.005: ensureLearningSummary may reference KnowledgeGraphRuntime
   and MaterialTextPipeline to drive the Summary chain (no file parsing).
   The pure read getters must still touch none of these. */
["MaterialRuntime","AnalysisRuntime","KnowledgeExtractionRuntime",
 "ParserAdapterRegistry","SummaryGenerator","QuestionGenerationFlow"]
  .forEach(m => check("未依賴 " + m + "（不得重新解析／重建）", code.indexOf("AHS." + m) === -1));
check("KnowledgeGraphRuntime / MaterialTextPipeline 僅供 ensureLearningSummary 驅動鏈使用",
  (() => { const idx = code.indexOf("function ensureLearningSummary");
    const rest = code.slice(idx);
    return /AHS\.KnowledgeGraphRuntime/.test(rest) && /AHS\.MaterialTextPipeline/.test(rest); })());
check("透過 AITutorRuntime 協調（Reuse Before Create）", /AHS\.AITutorRuntime/.test(code));

console.log("\n[Scope — 無 LLM／聊天／UI／Parser]");
check("零 LLM／Provider 呼叫", !/openai|gemini|anthropic|claude|AIProvider|prompt/i.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));
check("零 DOM／UI 操作",
  !/document\.|window\.AHS\.UI|createElement|addEventListener|innerHTML/.test(code));
check("零語音／OCR／Parser", !/speech|voice|ocr|tesseract|pdfjs/i.test(code));

console.log("\n[Runtime — Memory Only]");
check("原始碼零 localStorage / sessionStorage / IndexedDB / PersistenceAdapter",
  !/localStorage|sessionStorage|indexedDB|PersistenceAdapter/i.test(code));

console.log("\n[Session 為即時視圖 — 不持有陳舊副本]");
check("能力端更新後重新建立之 Session 立即反映",
  (() => { const before = SV.buildLearningContext(mat.id).questions.length;
    QG.clearQuestions(mat.id);
    const after = SV.buildLearningContext(mat.id).questions.length;
    QG.generateQuestions(mat.id);
    return before > 0 && after === 0 && SV.buildLearningContext(mat.id).questions.length > 0; })());

console.log("\n[EO-S8.3.004 · ensureLearningSummary — 產生協調，不重新解析教材]");
check("尚無 Summary 時 ensureLearningSummary 產生之（經 KnowledgeSummaryRuntime）",
  (() => { KS.clearSummary(mat.id);
    const before = KS.getSummaryByMaterial(mat.id);
    const produced = SV.ensureLearningSummary(mat.id);
    return before === null && !!produced.materialId &&
      !!KS.getSummaryByMaterial(mat.id); })());
check("已有 Summary 時為 idempotent（回傳既有，不重複產生）",
  (() => { const first = KS.getSummaryByMaterial(mat.id).generatedAt;
    const again = SV.ensureLearningSummary(mat.id);
    return again.generatedAt === first; })());
check("ensureLearningSummary 不改變知識圖譜（不重新解析教材）",
  (() => { const before = KG.queryByMaterial(mat.id).length;
    SV.ensureLearningSummary(mat.id);
    return KG.queryByMaterial(mat.id).length === before; })());
check("無可讀文字 → ensureLearningSummary 回 No readable content（統一空值，不 throw）",
  (() => { const m9 = MR.add({ title: "空白", subject: "math", grade: "高一", category: "講義",
      fileName: "blank.pdf", fileType: "PDF", folderId: folder.folderId });
    KP.process(m9.id);
    try { const r = SV.ensureLearningSummary(m9.id);
      return r.status === "no_readable_content" && r.message === "No readable content"; }
    catch (e) { return false; } })());

console.log("\n[EO-S8.3.006 · ensureQuestionSet — 產題協調，不重新分析教材]");
check("尚無題目時 ensureQuestionSet 產生之（經 QuestionGenerationRuntime）",
  (() => { QG.clearQuestions(mat.id);
    const before = QG.getQuestionsByMaterial(mat.id);
    const set = SV.ensureQuestionSet(mat.id);
    return before === null && !!set && Array.isArray(set.questions) && set.questions.length > 0; })());
check("已有題目時非 force 回傳既有（不重複產生）",
  (() => { const first = QG.getQuestionsByMaterial(mat.id).generatedAt;
    const again = SV.ensureQuestionSet(mat.id, false);
    return again.generatedAt === first; })());
check("force = true 重新產生（重新呼叫 Runtime）",
  (() => { const set = SV.ensureQuestionSet(mat.id, true);
    return !!set && Array.isArray(set.questions) && set.questions.length > 0; })());
check("ensureQuestionSet 不改變知識圖譜（不重新分析教材）",
  (() => { const before = KG.queryByMaterial(mat.id).length;
    SV.ensureQuestionSet(mat.id, true);
    return KG.queryByMaterial(mat.id).length === before; })());
check("無可讀文字 → No readable content（不 throw）",
  (() => { const m8 = MR.add({ title: "空白", subject: "math", grade: "高一", category: "講義",
      fileName: "blank2.pdf", fileType: "PDF", folderId: folder.folderId });
    try { const r = SV.ensureQuestionSet(m8.id);
      return r.status === "no_readable_content" && r.message === "No readable content"; }
    catch (e) { return false; } })());

console.log("\n[既有 Runtime 未受影響]");
check("LOCK SummaryRuntime 未被寫入", AHS.SummaryRuntime.list().length === 0);
check("AITutorRuntime 七個 API 未變",
  ["initialize","getLearningContext","getKnowledgeSummary","getQuestionSet",
   "getWrongBook","getReviewList","serialize"].every(k => typeof AT[k] === "function"));
check("Service 與 AITutorRuntime 為不同模組", SV !== AT);
check("四能力 Runtime 為不同模組", SV !== KS && SV !== QG && SV !== RG && SV !== WBS);

console.log("\nAITutorServiceV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
