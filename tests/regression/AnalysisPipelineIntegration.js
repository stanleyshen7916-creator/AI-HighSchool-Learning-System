/* tests/regression/AnalysisPipelineIntegration.js — EO-S8.0-004 Integration QA.
   Run: node tests/regression/AnalysisPipelineIntegration.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js","js/runtime/KnowledgeExtractionRuntime.js",
 "js/parser/KnowledgePipeline.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const KG = AHS.KnowledgeGraphRuntime, FR = AHS.FolderRuntime, MR = AHS.MaterialRuntime,
      AN = AHS.AnalysisRuntime, KE = AHS.KnowledgeExtractionRuntime, KP = AHS.KnowledgePipeline;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset();

const REAL_TEXT = [
  "正弦定理",
  "正弦：sinθ = 對邊 / 斜邊",
  "餘弦定理：a² = b² + c² − 2bc·cosA",
  "三角比",
  "本章說明三角函數的基本定義與應用，並比較各種解題情境。"
].join("\n");

const folder = FR.createFolder({ folderName: "第一次月考", subject: "math", scopeType: "exam" });
const mat = MR.add({ title: "三角函數", subject: "math", grade: "高一", chapter: "第三章",
  category: "課本", fileName: "三角函數教材.pdf", fileType: "PDF", folderId: folder.folderId, content: REAL_TEXT });
const empty = MR.add({ title: "掃描檔", subject: "math", grade: "高一", chapter: "第三章",
  category: "課本", fileName: "scan.pdf", fileType: "PDF", folderId: folder.folderId });
const orphan = MR.add({ title: "未歸類", subject: "math", grade: "高一",
  category: "課本", fileName: "orphan教材.pdf", fileType: "PDF", content: REAL_TEXT });

console.log("\n[Knowledge Graph — 白名單解除 / 下游型別永久禁止]");
check("允許五型內容節點", JSON.stringify(KG.CONTENT_TYPES) ===
  JSON.stringify(["knowledge_point","definition","formula","keyword","concept"]));
["summary","question","answer","review","wrongbook"].forEach(t => {
  check("永久禁止下游型別：" + t, KG.addNode({ type: t, label: "x", folderId: folder.folderId,
    documentType: "material", sourceFileId: mat.id, sourcePage: null, sourceParagraph: null }) === null);
});
check("內容節點缺 folderId → 拒絕寫入（不得跨 Folder）",
  KG.addNode({ type: "concept", label: "x", documentType: "material", sourceFileId: mat.id, sourcePage: null, sourceParagraph: null }) === null);
check("內容節點缺 documentType → 拒絕寫入",
  KG.addNode({ type: "concept", label: "x", folderId: folder.folderId, sourceFileId: mat.id, sourcePage: null, sourceParagraph: null }) === null);

console.log("\n[Analysis Runtime — 解除 pending，真實分析結果]");
KP.process(mat.id);
const a = AN.analyze(mat.id);
check("狀態 ready（不再 pending_analysis_pipeline）", a.status === "ready");
check("items 全數逐字取自教材真實文字",
  a.items.length === 5 && a.items.every(it => REAL_TEXT.includes(it.text)));
check("sourceParagraph 為真實段落序號、sourcePage 誠實為 null",
  a.items[0].sourceParagraph === 1 && a.items.every(it => it.sourcePage === null));
check("決定性分段規則（含 = 或數學符號→formulas；短詞→keywords；其餘→coreConcepts）",
  a.sections.formulas.length === 2 && a.sections.keywords.length === 2 &&
  a.sections.coreConcepts.length === 1 && a.items.length === 5);
const aEmpty = AN.analyze(empty.id);
check("無可讀文字 → insufficient_source、零 items（不得臆測）",
  (() => { KP.process(empty.id); const r = AN.analyze(empty.id);
           return r.status === "insufficient_source" && r.items.length === 0 && /不得 Mock／推測／OCR／解析 PDF 二進位|不得由檔名或二進位/.test(r.reason); })());

console.log("\n[Knowledge Extraction — ready 才建立節點]");
const ex = KE.extract(mat.id);
check("status=ready，節點數等於 analysis items", ex.status === "ready" && ex.nodes.length === 5);
check("六項追溯欄位齊備（含 folderId / documentType）",
  ex.nodes.every(n => n.folderId === folder.folderId && n.sourceFileId === mat.id &&
    n.documentType === "material" && "knowledgeId" in n && n.sourcePage === null && n.sourceParagraph > 0));
check("insufficient_source → 零節點", KE.extract(empty.id).nodes.length === 0);
check("Pipeline 於 Folder 閘門即擋下未歸屬教材",
  (() => { const r = KP.process(orphan.id); return r.status === "failed" && /Folder/.test(r.errors[0]); })());
check("KnowledgeExtraction 自身 Folder 閘門亦生效（直接建圖後仍拒絕）",
  (() => { KG.buildFromMaterial(MR.getById(orphan.id) || { id: orphan.id, subject: "math", fileName: "orphan教材.pdf" }, { documentType: "material" });
           const r = KE.extract(orphan.id);
           return r.status === "pending" && r.nodes.length === 0 && /Folder/.test(r.reason); })());

console.log("\n[Knowledge Graph 寫入 — 完整鏈路]");
const stored = KE.store(ex.nodes);
check("五個節點成功寫入圖譜", stored.stored.length === 5 && stored.blocked === 0);
check("重複寫入不produce 重複節點（re-analysis 冪等）",
  (() => { const again = KE.store(ex.nodes);
    return again.stored.length === 5 &&
      KG.queryByFolder(folder.folderId).filter(n => KG.CONTENT_TYPES.includes(n.type)).length === 5; })());
check("節點皆帶 knowledgeId（由圖譜指派）", stored.stored.every(n => !!n.knowledgeId));
check("queryByFolder 可依 Study Scope 取回內容節點",
  KG.queryByFolder(folder.folderId).filter(n => KG.CONTENT_TYPES.includes(n.type)).length === 5);
check("圖譜內容節點與原文逐字一致",
  KG.queryByFolder(folder.folderId).filter(n => KG.CONTENT_TYPES.includes(n.type))
    .every(n => REAL_TEXT.includes(n.content)));
check("status(materialId) = stored", KE.status(mat.id) === "stored");

console.log("\n[Pipeline Integration — 固定流程與驗證閘門]");
/* 不重置 MaterialRuntime：FolderRuntime 之 folderId 唯一性守衛會正確
   擋下 seq 歸零後的 id 碰撞（已於 Report 記錄此交互作用）。 */
const f2 = FR.createFolder({ folderName: "期末考", subject: "math", scopeType: "exam" });
check("第二個 Study Scope 建立成功", !!f2 && f2.folderId !== folder.folderId);
const m2 = MR.add({ title: "數列", subject: "math", grade: "高一", chapter: "第四章", category: "課本",
  fileName: "數列教材.pdf", fileType: "PDF", folderId: f2.folderId, content: "等差數列\n公差 d = a₂ − a₁" });
const r2 = KP.process(m2.id);
check("完整流程 done/success 並寫入節點",
  r2.status === "success" && r2.stage === "done" && r2.nodesCreated === 2 && r2.folderId === f2.folderId);
check("material 不存在 → failed", KP.process("rt_none").status === "failed");
check("未歸屬 Folder → failed（Folder 驗證閘門）",
  (() => { const m3 = MR.add({ title: "孤兒", subject: "math", grade: "高一", category: "課本",
             fileName: "x教材.pdf", fileType: "PDF", content: "內容" });
           const r = KP.process(m3.id); return r.status === "failed" && /Folder/.test(r.errors[0]); })());
check("無可讀文字 → success 但零節點（analysis_insufficient）",
  (() => { const m4 = MR.add({ title: "空白", subject: "math", grade: "高一", category: "課本",
             fileName: "blank教材.pdf", fileType: "PDF", folderId: f2.folderId });
           const r = KP.process(m4.id); return r.status === "success" && r.stage === "analysis_insufficient" && r.nodesCreated === 0; })());
check("考卷路由：exam_bank 收束、零知識節點",
  (() => { const e = MR.add({ title: "段考", subject: "math", grade: "高一", category: "課本",
             fileName: "段考卷.pdf", fileType: "PDF", folderId: f2.folderId, content: "題目一" });
           const before = KG.queryByFolder(f2.folderId).filter(n => KG.CONTENT_TYPES.includes(n.type)).length;
           const r = KP.process(e.id);
           const after = KG.queryByFolder(f2.folderId).filter(n => KG.CONTENT_TYPES.includes(n.type)).length;
           return r.stage === "exam_bank" && before === after; })());
check("processFolder：整個 Study Scope 一次執行",
  (() => { const r = KP.processFolder(f2.folderId); return r.status === "success" && r.materials.length >= 3; })());
check("Folder 不存在 → processFolder failed", KP.processFolder("fd_none").status === "failed");

console.log("\n[Runtime Rules — 零下游、零 LOCK 呼叫（原始碼掃描）]");
["js/parser/KnowledgePipeline.js","js/runtime/KnowledgeExtractionRuntime.js","js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js"].forEach(f => {
  const code = fs.readFileSync(path.join(ROOT, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  ["LearningQuestionGenerator","LearningQuestionSession","AnswerBuilderRuntime",
   "WrongBookGenerator","WrongBookSession","ReviewQueue","ReviewModel","SummaryRuntime"].forEach(m => {
    check(f.split("/").pop() + " 未呼叫 " + m, code.indexOf("AHS." + m) === -1);
  });
});
check("全鏈零網路呼叫",
  ["js/parser/KnowledgePipeline.js","js/runtime/KnowledgeExtractionRuntime.js","js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js","js/runtime/KnowledgeGraphRuntime.js"]
    .every(f => !/fetch\(|XMLHttpRequest/.test(fs.readFileSync(path.join(ROOT, f), "utf8"))));

console.log("\nAnalysisPipelineIntegration: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
