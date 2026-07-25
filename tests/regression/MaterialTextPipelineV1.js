/* tests/regression/MaterialTextPipelineV1.js — EO-S8.3.005.
   Verifies the unified Material Text Pipeline: {text,title,metadata}
   shape, upload-time text capture for text-type files, honest
   "No readable content" (never throw) for binary/empty, and the full
   chain Material → Text Pipeline → Knowledge Graph → Summary / Question
   using real text (no Runtime re-parses a file).
   Run: node tests/regression/MaterialTextPipelineV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
/* Minimal FileReader for text (node has none in vm context). */
global.window.FileReader = function () {
  this.readAsText = function (file) { this.result = file && file._text != null ? file._text : ""; if (this.onload) { this.onload(); } };
};
function FileStub(text, name, type) { this.name = name; this.type = type; this._text = text; }
global.window.File = FileStub;

["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/ParserAdapterRegistry.js","js/parser/MaterialTextPipeline.js",
 "js/parser/AnalysisRuntime.js","js/runtime/KnowledgeExtractionRuntime.js","js/parser/KnowledgePipeline.js",
 "js/runtime/SummaryRuntime.js","js/runtime/KnowledgeSummaryRuntime.js",
 "js/runtime/QuestionGenerationRuntime.js",
 "js/parser/LearningQuestionGenerator.js","js/runtime/LearningQuestionSession.js",
 "js/parser/WrongBookGenerator.js","js/runtime/WrongBookSession.js","js/runtime/ReviewQueue.js",
 "js/runtime/ReviewModel.js","js/runtime/ReviewGeneratorRuntime.js",
 "js/runtime/AITutorRuntime.js","js/runtime/AITutorService.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const TP = AHS.MaterialTextPipeline, MR = AHS.MaterialRuntime, FR = AHS.FolderRuntime,
      KG = AHS.KnowledgeGraphRuntime, KP = AHS.KnowledgePipeline, KS = AHS.KnowledgeSummaryRuntime,
      QG = AHS.QuestionGenerationRuntime, SV = AHS.AITutorService;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset(); KS.clearSummary(); QG.clearQuestions();

console.log("[1] 統一回傳格式 {text, title, metadata}]");
const folder = FR.createFolder({ folderName: "測試", subject: "math", scopeType: "custom" });
const TXT = "三角函數\n斜邊\n正弦：對邊除以斜邊\n餘弦定理 a² = b² + c² − 2bc·cosA\n本節說明三角函數的定義與應用。";
const mat = MR.add({ title: "三角函數筆記", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "notes.txt", fileType: "TXT", folderId: folder.folderId, content: TXT });
const got = TP.getText(mat.id);
check("回傳含 text / title / metadata", ["text","title","metadata"].every(k => k in got));
check("status = ready 且 text 逐字等於教材內容", got.status === "ready" && got.text === TXT);
check("title 正確、metadata 帶 materialId/fileType",
  got.title === "三角函數筆記" && got.metadata.materialId === mat.id && got.metadata.fileType === "TXT");

console.log("\n[2] 上傳時文字擷取（readFile — 文字型別）]");
let captured = null;
TP.readFile(new window.File(TXT, "notes.txt", "text/plain"), t => { captured = t; });
check("文字檔 readFile 讀出逐字內容", captured === TXT);
check("isTextType 判定 TXT/MD/JSON 為真、PDF 為否",
  TP.isTextType("TXT") && TP.isTextType("md") && TP.isTextType("JSON") && !TP.isTextType("PDF"));

console.log("\n[3] 無可讀文字 → 統一 No readable content（不得 throw）]");
let pdfText = "sentinel";
TP.readFile(new window.File(null, "scan.pdf", "application/pdf"), t => { pdfText = t; });
check("二進位檔 readFile 回 null（無 parser，不臆測）", pdfText === null);
const noMat = MR.add({ title: "掃描檔", subject: "math", grade: "高一", category: "講義",
  fileName: "scan.pdf", fileType: "PDF", folderId: folder.folderId });
let threw = false, r;
try { r = TP.getText(noMat.id); } catch (e) { threw = true; }
check("getText 對無文字教材不 throw", !threw);
check("回傳統一 status=no_readable_content、message=\"No readable content\"",
  r.status === "no_readable_content" && r.message === "No readable content");
check("不存在的 materialId 亦回 No readable content（不 throw）",
  (() => { try { const x = TP.getText("rt_none"); return x.status === "no_readable_content"; }
    catch (e) { return false; } })());

console.log("\n[4] 全鏈：Material → Text Pipeline → KG → Summary / Question]");
const summary = SV.ensureLearningSummary(mat.id);
check("ensureLearningSummary 產生真實 Summary（使用教材文字）",
  !!summary.materialId && !!summary.summary);
check("Knowledge Graph 由文字建立內容節點",
  KG.queryByMaterial(mat.id).filter(n => KG.CONTENT_TYPES.indexOf(n.type) !== -1).length === 5);
check("Summary 重點逐字取自教材文字",
  ["coreConcepts","keywords","definitions","formulas","importantPoints"]
    .every(sec => (summary.summary[sec] || []).every(it => TXT.indexOf(it.text) !== -1)));
const qSet = QG.generateQuestions(mat.id);
check("Question 使用同一 KG 產題（非空資料）", !!qSet && qSet.questions.length > 0);
check("Question 選項/答案源自教材真實節點",
  qSet.questions.every(q => q.options.length === 4 && !!q.answer));

console.log("\n[5] 無重複解析：Summary 再產生不改變 KG]");
const before = KG.queryByMaterial(mat.id).length;
KS.clearSummary(mat.id);
SV.ensureLearningSummary(mat.id);
check("再次分析不改變知識圖譜節點數（無重複解析）",
  KG.queryByMaterial(mat.id).length === before);
check("無文字教材 → ensureLearningSummary 回 No readable content（不 throw）",
  (() => { try { const s = SV.ensureLearningSummary(noMat.id);
    return s.message === "No readable content"; } catch (e) { return false; } })());

console.log("\n[6] Runtime 不自行解析教材（原始碼掃描）]");
const summaryCode = fs.readFileSync(path.join(ROOT, "js/runtime/KnowledgeSummaryRuntime.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const questionCode = fs.readFileSync(path.join(ROOT, "js/runtime/QuestionGenerationRuntime.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
check("KnowledgeSummaryRuntime 不讀 Material（僅 KG）", summaryCode.indexOf("AHS.MaterialRuntime") === -1);
check("QuestionGenerationRuntime 不讀 Material（僅 KG）", questionCode.indexOf("AHS.MaterialRuntime") === -1);
const pipeCode = fs.readFileSync(path.join(ROOT, "js/parser/MaterialTextPipeline.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
check("Text Pipeline 零網路", !/fetch\(|XMLHttpRequest/.test(pipeCode));
check("Text Pipeline 透過既有 Provider 取得（不重複造輪）", /AHS\.MaterialTextProvider/.test(pipeCode));

console.log("\nMaterialTextPipelineV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
