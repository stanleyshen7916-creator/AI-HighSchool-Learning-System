/* tests/regression/ParserAdapterV1.js — EO-S8.1.001 Foundation QA
   （Parser Adapter Baseline v1.0）. Run: node tests/regression/ParserAdapterV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/ParserAdapterRegistry.js",
 "js/parser/AnalysisRuntime.js","js/runtime/KnowledgeExtractionRuntime.js","js/parser/KnowledgePipeline.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const REG = AHS.ParserAdapterRegistry, TP = AHS.MaterialTextProvider, MR = AHS.MaterialRuntime,
      FR = AHS.FolderRuntime, AN = AHS.AnalysisRuntime, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset();

console.log("\n[Registry — 恰五個公開 API]");
check("公開 API = register/unregister/getAdapter/listAdapters/status",
  JSON.stringify(Object.keys(REG).sort()) ===
  JSON.stringify(["getAdapter","listAdapters","register","status","unregister"]));

console.log("\n[Default Adapters — 五個 Stub]");
const ids = REG.listAdapters().map(a => a.id);
check("五個預設 adapter 全數註冊", ["txt","pdf","docx","pptx","ocr"].every(i => ids.includes(i)));
check("每個 adapter 具 id + version", REG.listAdapters().every(a => !!a.id && !!a.version));
check("TXT supports() = true（TXT/MD/JSON）",
  REG.status("txt","TXT") === "supported" && REG.status("txt","MD") === "supported" && REG.status("txt","JSON") === "supported");
["pdf","docx","pptx","ocr"].forEach(id => {
  check(id.toUpperCase() + " supports() = false（不得真正解析）", REG.status(id, id.toUpperCase()) === "not_supported");
  const r = REG.getAdapter(id).extract({ fileType: id.toUpperCase(), content: "任何內容" });
  check(id.toUpperCase() + " extract() 固定 not_supported 且零內容", r.status === "not_supported" && r.content === "");
});
check("TXT 不支援 PDF 型別", REG.status("txt","PDF") === "not_supported");

console.log("\n[Parser Adapter Interface — 固定輸出格式]");
const txtOut = REG.getAdapter("txt").extract({ fileType: "TXT", content: "第一行\n第二行" });
check("輸出含 status / content / metadata", ["status","content","metadata"].every(k => k in txtOut));
check("metadata 至少含 parserId / fileType / createdAt",
  ["parserId","fileType","createdAt"].every(k => k in txtOut.metadata) && txtOut.metadata.parserId === "txt");
check("文字逐字保留（不修改、不 AI 潤飾）", txtOut.status === "ready" && txtOut.content === "第一行\n第二行");
check("空內容 → empty（不得推測）",
  REG.getAdapter("txt").extract({ fileType: "TXT", content: "   " }).status === "empty");
check("型別不合法 → failed",
  REG.getAdapter("txt").extract({ fileType: "TXT", content: 123 }).status === "failed");

console.log("\n[Validation — 註冊與回傳格式]");
check("不合約 adapter 拒絕註冊（缺 version / 缺方法）",
  REG.register({ id: "x", supports: () => true, extract: () => ({}) }) === null &&
  REG.register({ id: "y", version: "1.0" }) === null);
check("合約 adapter 可註冊 / 可反註冊",
  (() => { const ok = REG.register({ id: "tmp", version: "1.0", supports: () => false, extract: () => ({ status: "not_supported", content: "", metadata: { parserId: "tmp", fileType: "", createdAt: "x" } }) }) === "tmp";
    return ok && REG.status("tmp") === "registered" && REG.unregister("tmp") === true && REG.status("tmp") === "unknown"; })());
check("未知 adapter → unknown", REG.status("nope") === "unknown");
check("status() 總覽含 adapters / bridgeInstalled",
  (() => { const s = REG.status(); return Array.isArray(s.adapters) && s.bridgeInstalled === true; })());

console.log("\n[MaterialTextProvider Integration — 優先順序 Adapter → content → insufficient_source]");
check("Bridge 已透過 Provider 公開 API 註冊（Provider 未被修改）",
  TP.listAdapters().indexOf("parser_adapter_registry") !== -1);
const scope = FR.createFolder({ folderName: "解析測試", subject: "math", scopeType: "custom" });
const txtMat = MR.add({ title: "筆記", subject: "math", grade: "高一", chapter: "第一章", category: "課本",
  fileName: "notes.txt", fileType: "TXT", folderId: scope.folderId, content: "等差數列\n公差 d = a₂ − a₁" });
const pdfMat = MR.add({ title: "PDF 教材", subject: "math", grade: "高一", chapter: "第一章", category: "課本",
  fileName: "book.pdf", fileType: "PDF", folderId: scope.folderId, content: "PDF 記錄中已有的文字" });
const emptyMat = MR.add({ title: "空白", subject: "math", grade: "高一", chapter: "第一章", category: "課本",
  fileName: "scan.pdf", fileType: "PDF", folderId: scope.folderId });
check("TXT 檔 → 經 Parser Adapter 取得文字（source = adapter）",
  (() => { const r = TP.getText(txtMat.id);
    return r.status === "ready" && r.source === "adapter:parser_adapter_registry" && r.text === txtMat.content; })());
check("PDF 檔（adapter 不支援）→ 回退 Material.content，行為零回歸",
  (() => { const r = TP.getText(pdfMat.id);
    return r.status === "ready" && r.source === "material.content" && r.text === pdfMat.content; })());
check("兩者皆無 → insufficient_source",
  TP.getText(emptyMat.id).status === "insufficient_source");

console.log("\n[端到端 — Adapter → Provider → Analysis → Extraction → Knowledge Graph]");
const r1 = KP.process(txtMat.id);
check("TXT 檔完整流程 done/success 並寫入知識節點",
  r1.status === "success" && r1.stage === "done" && r1.nodesCreated === 2);
check("節點內容逐字等同原文",
  KG.queryByMaterial(txtMat.id).filter(n => KG.CONTENT_TYPES.includes(n.type))
    .every(n => txtMat.content.includes(n.content)));
check("Analysis 標示文字來源為 adapter",
  AN.analyze(txtMat.id).textSource === "adapter:parser_adapter_registry");
check("無文字 PDF → 零知識節點（insufficient_source）",
  (() => { const r = KP.process(emptyMat.id);
    return r.status === "success" && r.stage === "analysis_insufficient" && r.nodesCreated === 0; })());

console.log("\n[Runtime Rules — 零下游、零 AI、零網路（原始碼掃描）]");
const code = fs.readFileSync(path.join(ROOT, "js/parser/ParserAdapterRegistry.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
["LearningQuestionGenerator","LearningQuestionSession","AnswerBuilderRuntime","AnalysisRuntime",
 "KnowledgeExtractionRuntime","KnowledgeGraphRuntime","SummaryRuntime","WrongBookGenerator",
 "WrongBookSession","ReviewQueue","ReviewModel","AIProvider","MaterialRuntime"].forEach(m => {
  check("Registry 未呼叫 " + m, code.indexOf("AHS." + m) === -1);
});
check("Registry 僅透過 MaterialTextProvider 公開 API 接入", /AHS\.MaterialTextProvider/.test(code) && /registerAdapter/.test(code));
check("零網路（fetch / XHR）", !/fetch\(|XMLHttpRequest/.test(code));
check("零真正解析（無 PDF/DOCX/OCR 解析程式庫）",
  !/pdfjs|pdf-parse|mammoth|tesseract|require\(/.test(code));
check("Parser 回傳下游資料 → 驗證拒絕（stand aside）",
  (() => { REG.register({ id: "bad", version: "1.0", supports: () => true,
      extract: () => ({ status: "ready", content: "x", metadata: { parserId: "bad", fileType: "TXT", createdAt: "t" }, summary: "不該有" }) });
    const r = TP.getText(pdfMat.id);   /* bad adapter must be ignored */
    REG.unregister("bad");
    return r.source === "material.content"; })());

console.log("\nParserAdapterV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
