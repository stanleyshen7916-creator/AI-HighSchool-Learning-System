/* tests/regression/KnowledgeSummaryV1.js — EO-S8.2.002 Summary Runtime.
   Verifies the LOCK Summary Model, the five fixed sections, full
   traceability, KG-only sourcing, memory-only storage and integration
   with the existing Foundation pipeline.
   Run: node tests/regression/KnowledgeSummaryV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js",
 "js/runtime/KnowledgeExtractionRuntime.js","js/parser/KnowledgePipeline.js",
 "js/runtime/SummaryRuntime.js","js/runtime/KnowledgeSummaryRuntime.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const KS = AHS.KnowledgeSummaryRuntime, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline, FR = AHS.FolderRuntime, MR = AHS.MaterialRuntime;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset(); KS.clearSummary();

/* Real Foundation run: Folder → Material(with text) → Pipeline → KG nodes. */
const TEXT = [
  "三角函數",                                   /* short, no punctuation → keyword */
  "正弦：對邊除以斜邊",                          /* has ：            → definition  */
  "餘弦定理 a² = b² + c² − 2bc·cosA",            /* has =             → formula     */
  "本節討論三角函數的定義、性質與應用情境。"        /* prose            → concept     */
].join("\n");
const folder = FR.createFolder({ folderName: "三角函數範圍", subject: "math", scopeType: "custom" });
const mat = MR.add({ title: "三角函數講義", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "三角函數教材.pdf", fileType: "PDF",
  folderId: folder.folderId, content: TEXT });
const run = KP.process(mat.id);
check("前置：Foundation 管線寫入知識節點", run.status === "success" && run.nodesCreated === 4);

console.log("\n[API — 五個公開 API]");
["createSummary","getSummary","getSummaryByMaterial","clearSummary","serialize"].forEach(fn => {
  check("提供 " + fn + "()", typeof KS[fn] === "function");
});

console.log("\n[Summary Model — LOCK，不得增加欄位]");
const s = KS.createSummary(mat.id);
check("createSummary 回傳記錄", !!s);
check("頂層欄位恰為 materialId / title / generatedAt / summary / traceability",
  JSON.stringify(Object.keys(s).sort()) ===
  JSON.stringify(["generatedAt","materialId","summary","title","traceability"]));
check("materialId 正確", s.materialId === mat.id);
check("title 取自 Knowledge Graph 的 source_file 節點", s.title === "三角函數講義");
check("generatedAt 為 ISO 時間", /^\d{4}-\d{2}-\d{2}T/.test(s.generatedAt));

console.log("\n[Summary Sections — 固定五區，名稱不得修改]");
check("summary 欄位恰為五區且名稱正確",
  JSON.stringify(Object.keys(s.summary)) ===
  JSON.stringify(["coreConcepts","keywords","definitions","formulas","importantPoints"]));
check("五區皆為陣列", Object.keys(s.summary).every(k => Array.isArray(s.summary[k])));
check("節點型別 1:1 對應五區（concept/keyword/definition/formula 各 1）",
  s.summary.coreConcepts.length === 1 && s.summary.keywords.length === 1 &&
  s.summary.definitions.length === 1 && s.summary.formulas.length === 1);
check("內容逐字取自教材原文（未改寫）",
  Object.keys(s.summary).every(k => s.summary[k].every(it => TEXT.indexOf(it.text) !== -1)));

console.log("\n[Traceability — LOCK 五欄位，不得遺失來源]");
const allItems = Object.keys(s.summary).reduce((acc, k) => acc.concat(s.summary[k]), []);
check("每一項目皆帶 materialId / knowledgeNodeId / paragraph / lineStart / lineEnd",
  allItems.length === 4 && allItems.every(it =>
    ["materialId","knowledgeNodeId","paragraph","lineStart","lineEnd"].every(f => f in it)));
check("knowledgeNodeId 皆可解析回真實圖譜節點",
  allItems.every(it => !!KG.getNode(it.knowledgeNodeId)));
check("paragraph 為真實段落序號（非虛構）",
  allItems.every(it => typeof it.paragraph === "number" && it.paragraph >= 1));
check("lineStart / lineEnd 誠實為 null（圖譜尚無行號，不得猜測）",
  allItems.every(it => it.lineStart === null && it.lineEnd === null));
check("traceability 以 knowledgeNodeId 索引且與項目一致",
  Object.keys(s.traceability).length === 4 &&
  allItems.every(it => s.traceability[it.knowledgeNodeId].materialId === mat.id));

console.log("\n[Summary Source — 僅來自 Knowledge Graph]");
const code = fs.readFileSync(path.join(ROOT, "js/runtime/KnowledgeSummaryRuntime.js"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
check("未讀取 MaterialRuntime（不得重新解析教材）", code.indexOf("AHS.MaterialRuntime") === -1);
check("未呼叫 MaterialTextProvider / AnalysisRuntime（不得建立新 Analysis Pipeline）",
  code.indexOf("AHS.MaterialTextProvider") === -1 && code.indexOf("AHS.AnalysisRuntime") === -1);
check("未呼叫既有 SummaryRuntime / SummaryGenerator（不得複製既有邏輯）",
  code.indexOf("AHS.SummaryRuntime") === -1 && code.indexOf("AHS.SummaryGenerator") === -1);
check("唯一資料來源為 KnowledgeGraphRuntime 公開查詢 API",
  /AHS\.KnowledgeGraphRuntime/.test(code) && /queryByMaterial/.test(code));
check("圖譜無內容節點 → 回傳 null（不得虛構）",
  (() => { const m2 = MR.add({ title: "空白", subject: "math", grade: "高一", category: "講義",
      fileName: "blank教材.pdf", fileType: "PDF", folderId: folder.folderId });
    KP.process(m2.id);   /* skeleton only — no readable text */
    return KS.createSummary(m2.id) === null; })());
check("不存在的 materialId → null", KS.createSummary("rt_none") === null);

console.log("\n[Runtime — Memory Only]");
check("原始碼零 localStorage / sessionStorage / IndexedDB / PersistenceAdapter",
  !/localStorage|sessionStorage|indexedDB|PersistenceAdapter/i.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));

console.log("\n[API 行為]");
check("getSummaryByMaterial 取回同一筆", KS.getSummaryByMaterial(mat.id).materialId === mat.id);
check("getSummary() 無參數回傳最近一筆", KS.getSummary().materialId === mat.id);
check("getSummary(materialId) 等同 getSummaryByMaterial",
  JSON.stringify(KS.getSummary(mat.id)) === JSON.stringify(KS.getSummaryByMaterial(mat.id)));
check("重複 createSummary 覆蓋而非累積",
  (() => { KS.createSummary(mat.id); return JSON.parse(KS.serialize()).length === 1; })());
check("serialize(materialId) 為合法 JSON 且含五區",
  (() => { const o = JSON.parse(KS.serialize(mat.id));
    return o.materialId === mat.id && Object.keys(o.summary).length === 5; })());
check("serialize() 回傳全部摘要之陣列", Array.isArray(JSON.parse(KS.serialize())));
check("回傳值為複本（外部修改不影響 Runtime）",
  (() => { const a = KS.getSummaryByMaterial(mat.id); a.summary.keywords.push({ text: "污染" });
    return KS.getSummaryByMaterial(mat.id).summary.keywords.length === 1; })());
check("clearSummary(materialId) 移除該筆",
  KS.clearSummary(mat.id) === 1 && KS.getSummaryByMaterial(mat.id) === null);
check("clearSummary() 清空全部",
  (() => { KS.createSummary(mat.id); const n = KS.clearSummary();
    return n >= 1 && KS.getSummary() === null && KS.serialize() === "[]"; })());

console.log("\n[既有 SummaryRuntime 未受影響]");
check("LOCK SummaryRuntime 仍可用且 API 未變",
  ["add","sync","list","isEmpty","getById","findByMaterialId","findBySubject","reset"]
    .every(k => typeof AHS.SummaryRuntime[k] === "function"));
check("兩者為不同模組（未建立第二套同名 Runtime）",
  AHS.SummaryRuntime !== AHS.KnowledgeSummaryRuntime && !("createSummary" in AHS.SummaryRuntime));
check("KnowledgeSummaryRuntime 未寫入 LOCK SummaryRuntime",
  (() => { const before = AHS.SummaryRuntime.list().length;
    KS.createSummary(mat.id); return AHS.SummaryRuntime.list().length === before; })());

console.log("\nKnowledgeSummaryV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
