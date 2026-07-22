/* tests/regression/KnowledgeExtractionV1.js — EO-S8.0-002 Foundation QA.
   Run: node tests/regression/KnowledgeExtractionV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js","js/parser/KnowledgePipeline.js",
 "js/runtime/KnowledgeExtractionRuntime.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const KE = AHS.KnowledgeExtractionRuntime, KG = AHS.KnowledgeGraphRuntime,
      DC = AHS.DocumentClassifierRuntime, KP = AHS.KnowledgePipeline;
KG.reset(); DC.reset(); AHS.AnalysisRuntime.reset();

/* EO-S8.0-004: Folder Scope 為必要條件。 */
const scope = AHS.FolderRuntime.createFolder({ folderName: "抽取測試範圍", subject: "math", scopeType: "custom" });
const mat = AHS.MaterialRuntime.add({ title: "三角函數", subject: "math", grade: "高一", chapter: "第三章", category: "課本", fileName: "三角函數教材.pdf", fileType: "PDF", folderId: scope.folderId });
KP.process(mat.id);   /* skeleton graph exists */

console.log("\n[Runtime API — 恰四個公開 API]");
check("公開 API = extract / validate / store / status（不得新增其他）",
  JSON.stringify(Object.keys(KE).sort()) === JSON.stringify(["extract","status","store","validate"]));

console.log("\n[AnalysisRuntime Integration — pending 硬閘門，不得 Fake Extraction]");
const r = KE.extract(mat.id);
/* EO-S8.0-004: pending 鎖解除後，無可讀文字仍誠實回 pending 且零節點。 */
check("無可讀文字 → status=pending", r.status === "pending");
check("零 Knowledge Node 建立", r.nodes.length === 0);
check("回報理由明示無可讀文字（不得 Mock／推測／OCR／PDF Binary）",
  /不得 Mock／推測／OCR／解析 PDF 二進位|不得由檔名或二進位/.test(r.reason));
check("Knowledge Graph 未新增任何內容節點",
  KG.queryByMaterial(mat.id).every(n => ["source_file","document_type","subject","chapter","section","metadata"].includes(n.type)));
check("status(materialId) = pending", KE.status(mat.id) === "pending");
check("未知 materialId → unknown", KE.status("rt_none") === "unknown" && KE.extract(null).status === "unknown");

console.log("\n[Allowed / Forbidden Types]");
const base = { label: "正弦定理", content: "正弦定理", knowledgeId: null, folderId: scope.folderId, sourceFileId: mat.id, sourcePage: null, sourceParagraph: null, documentType: "material" };
["knowledge_point","definition","formula","keyword","concept"].forEach(t => {
  check("允許型別通過驗證：" + t, KE.validate(Object.assign({}, base, { type: t })).valid);
});
["summary","question","answer","explanation","wrongbook","review","dashboard","study_progress"].forEach(t => {
  check("禁止型別拒絕：" + t, !KE.validate(Object.assign({}, base, { type: t })).valid);
});

console.log("\n[Source Traceability — 五欄位強制]");
check("缺 sourceFileId → 拒絕",
  !KE.validate(Object.assign({}, base, { type: "concept", sourceFileId: null })).valid);
check("缺 folderId → 拒絕（Folder Scope，EO-S8.0-004）",
  !KE.validate(Object.assign({}, base, { type: "concept", folderId: null })).valid);
["sourcePage","sourceParagraph","documentType","knowledgeId"].forEach(f => {
  const n = Object.assign({}, base, { type: "concept" }); delete n[f];
  check("缺 " + f + " 欄位 → 拒絕（不得省略）", !KE.validate(n).valid);
});
check("sourcePage/sourceParagraph 為 null 可通過（不得猜測、不得 Mock）",
  KE.validate(Object.assign({}, base, { type: "concept" })).valid);
check("label/content 同時為空 → 拒絕",
  !KE.validate(Object.assign({}, base, { type: "concept", label: "", content: "" })).valid);

console.log("\n[store() — 僅寫入 KnowledgeGraphRuntime，未通過驗證不得寫入]");
const badStore = KE.store([Object.assign({}, base, { type: "question" })]);
check("禁止型別 store → rejected，零寫入", badStore.status === "rejected" && badStore.stored.length === 0);
/* EO-S8.0-004 解除白名單後，通過驗證之內容節點正式寫入圖譜。 */
const okStore = KE.store([Object.assign({}, base, { type: "concept" })]);
check("驗證通過之內容節點成功寫入圖譜（白名單已解除）",
  okStore.status === "ok" && okStore.stored.length === 1 && !!okStore.stored[0].knowledgeId);
check("寫入節點帶完整 Folder Scope 追溯",
  KG.queryByFolder(scope.folderId).some(n => n.type === "concept" && n.folderId === scope.folderId));

console.log("\n[Runtime Rules — 零下游、零其他 Runtime 呼叫（原始碼掃描）]");
const src = fs.readFileSync(path.join(ROOT, "js/runtime/KnowledgeExtractionRuntime.js"), "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");   /* strip comments — only real code counts */
["LearningQuestionGenerator","LearningQuestionSession","AnswerBuilderRuntime","WrongBookGenerator",
 "WrongBookSession","ReviewQueue","ReviewModel","ExamBankRuntime","SummaryRuntime"].forEach(m => {
  check("程式碼未呼叫 " + m, code.indexOf("AHS." + m) === -1);
});
check("唯一寫入目標為 KnowledgeGraphRuntime.addNode", /kg\.addNode\(/.test(code) && !/\.sync\(|\.ingest\(|\.enqueue\(/.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));

console.log("\n[真實內容路徑（Analysis Pipeline 上線後）— 以合法分析結果模擬]");
const realAnalysis = {
  materialId: mat.id, status: "ready", items: [{}, {}],
  sections: {
    coreConcepts: [{ text: "正弦定理", knowledgeId: null, sourceFileId: mat.id, sourcePage: 12, sourceParagraph: 3 }],
    definitions: [{ text: "正弦：sinθ = 對邊/斜邊", knowledgeId: null, sourceFileId: mat.id, sourcePage: 12, sourceParagraph: 4 }],
    keywords: [], formulas: [], pitfalls: [], examTypes: [], furtherReading: []
  }
};
const origAnalyze = AHS.AnalysisRuntime.analyze;
AHS.AnalysisRuntime.analyze = function () { return realAnalysis; };
const r2 = KE.extract(mat.id);
AHS.AnalysisRuntime.analyze = origAnalyze;
check("真實分析結果 → status=ready，逐項轉為 Knowledge Node", r2.status === "ready" && r2.nodes.length === 2);
check("型別對應正確（coreConcepts→concept、definitions→definition）",
  r2.nodes[0].type === "concept" && r2.nodes[1].type === "definition");
check("內容逐字複製、trace 欄位原樣保留（含真實 sourcePage/Paragraph）",
  r2.nodes[0].content === "正弦定理" && r2.nodes[0].sourcePage === 12 && r2.nodes[1].sourceParagraph === 4);
check("documentType 取自 Classifier（非猜測）", r2.nodes.every(n => n.documentType === "material"));
check("folderId 取自真實教材歸屬（Folder Scope）", r2.nodes.every(n => n.folderId === scope.folderId));
check("全部節點通過 validate()", r2.nodes.every(n => KE.validate(n).valid));

console.log("\nKnowledgeExtractionV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
