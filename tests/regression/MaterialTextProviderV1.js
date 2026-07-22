/* tests/regression/MaterialTextProviderV1.js — EO-S8.0-005 Foundation QA
   （Material Text Provider Baseline v1.0）.
   Run: node tests/regression/MaterialTextProviderV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js",
 "js/runtime/KnowledgeExtractionRuntime.js","js/parser/KnowledgePipeline.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const TP = AHS.MaterialTextProvider, MR = AHS.MaterialRuntime, FR = AHS.FolderRuntime,
      AN = AHS.AnalysisRuntime, KG = AHS.KnowledgeGraphRuntime, KP = AHS.KnowledgePipeline,
      KE = AHS.KnowledgeExtractionRuntime;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset();

const REAL = "等差數列\n公差 d = a₂ − a₁\n本節說明等差數列的一般項與求和公式。";
const scope = FR.createFolder({ folderName: "數列範圍", subject: "math", scopeType: "custom" });
const withText = MR.add({ title: "數列", subject: "math", grade: "高一", chapter: "第四章", category: "課本",
  fileName: "數列教材.pdf", fileType: "PDF", folderId: scope.folderId, content: REAL });
const noText = MR.add({ title: "掃描檔", subject: "math", grade: "高一", chapter: "第四章", category: "課本",
  fileName: "scan教材.pdf", fileType: "PDF", folderId: scope.folderId });

console.log("\n[Material Text Provider — 唯一文字入口]");
const r1 = TP.getText(withText.id);
check("有內容 → status=ready", r1.status === "ready");
check("文字逐字保留（不得修改/潤飾/重排）", r1.text === REAL && r1.characterCount === REAL.length);
check("標示來源 material.content", r1.source === "material.content");
const r2 = TP.getText(noText.id);
check("content 為空 → insufficient_source（不得 Mock/推測/OCR/PDF Binary）",
  r2.status === "insufficient_source" && r2.text === "" && /不得 Mock／推測／OCR／解析 PDF 二進位/.test(r2.reason));

console.log("\n[Validation]");
check("Material 不存在 → failed", TP.getText("rt_none").status === "failed");
check("缺 materialId → failed", TP.getText(null).status === "failed");
check("content 型別不合法 → failed",
  (() => { const m = MR.getById(withText.id); const raw = MR.list();
    /* 直接構造非法型別情境：以 adapter 回傳非字串驗證同一守衛 */
    TP.registerAdapter({ id: "bad", supports: () => true, extract: () => 12345 });
    const r = TP.getText(withText.id);
    /* 清除測試用 adapter */
    TP.registerAdapter({ id: "bad", supports: () => false, extract: () => "" });
    return r.status === "failed" && /型別不合法/.test(r.reason); })());
check("狀態限定三種", JSON.stringify(TP.STATUSES) === JSON.stringify(["ready","insufficient_source","failed"]));

console.log("\n[Future Extension — Adapter 保留，本 EO 零實作]");
check("保留 adapter 種類 pdf/docx/pptx/ocr 全數 not_supported",
  ["pdf","docx","pptx","ocr"].every(k => TP.adapterStatus(k) === "not_supported"));
check("不合約 adapter 拒絕註冊", TP.registerAdapter({ id: "x" }) === null);
check("合約 adapter 可註冊並優先於 content（未來 Parser 插入點）",
  (() => { TP.registerAdapter({ id: "pdf", supports: m => m.id === noText.id, extract: () => "由 Adapter 提供的真實文字" });
    const r = TP.getText(noText.id);
    const ok = r.status === "ready" && r.source === "adapter:pdf" && r.text === "由 Adapter 提供的真實文字";
    TP.registerAdapter({ id: "pdf", supports: () => false, extract: () => "" });
    return ok; })());
check("Adapter 未取得文字 → insufficient_source（不得推測）",
  (() => { TP.registerAdapter({ id: "ocr", supports: m => m.id === noText.id, extract: () => "   " });
    const r = TP.getText(noText.id);
    TP.registerAdapter({ id: "ocr", supports: () => false, extract: () => "" });
    return r.status === "insufficient_source"; })());

console.log("\n[AnalysisRuntime Integration — 不得直讀 Material.content]");
const anCode = fs.readFileSync(path.join(ROOT, "js/parser/AnalysisRuntime.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
check("AnalysisRuntime 原始碼零直讀 Material.content（node.content 為圖譜節點，合法）",
  !/material\.content/i.test(anCode) && !/getById\(/.test(anCode));
check("AnalysisRuntime 原始碼零呼叫 MaterialRuntime", anCode.indexOf("AHS.MaterialRuntime") === -1);
check("AnalysisRuntime 經 MaterialTextProvider 取得文字", /AHS\.MaterialTextProvider/.test(anCode));
KP.process(withText.id);
const a = AN.analyze(withText.id);
check("Provider ready → Analysis 開始分析，items 逐字取自真實文字",
  a.status === "ready" && a.items.length === 3 && a.items.every(it => REAL.includes(it.text)));
check("分析結果標示 textSource / providerStatus",
  a.textSource === "material.content" && a.providerStatus === "ready");
KP.process(noText.id);
const aEmpty = AN.analyze(noText.id);
check("Provider insufficient_source → Analysis 固定 insufficient_source、零 items",
  aEmpty.status === "insufficient_source" && aEmpty.items.length === 0);
check("Analysis 不自行產生 traceability（sourceParagraph 為真實序號、sourcePage null）",
  a.items[0].sourceParagraph === 1 && a.items.every(it => it.sourcePage === null));

console.log("\n[端到端 — Folder → Material → Provider → Analysis → Extraction → Knowledge Graph]");
const full = KP.process(withText.id);
check("完整流程 done/success 並寫入知識節點",
  full.status === "success" && full.stage === "done" && full.nodesCreated === 3);
check("節點內容逐字等同教材原文",
  KG.queryByFolder(scope.folderId).filter(n => KG.CONTENT_TYPES.includes(n.type))
    .every(n => REAL.includes(n.content)));
check("無文字教材 → 零知識節點（insufficient_source）",
  (() => { const before = KG.queryByMaterial(noText.id).filter(n => KG.CONTENT_TYPES.includes(n.type)).length;
    KP.process(noText.id);
    return before === 0 && KG.queryByMaterial(noText.id).filter(n => KG.CONTENT_TYPES.includes(n.type)).length === 0; })());

console.log("\n[Runtime Rules — 零 AI / 零下游 / 零網路（原始碼掃描）]");
const tpCode = fs.readFileSync(path.join(ROOT, "js/parser/MaterialTextProvider.js"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
["LearningQuestionGenerator","LearningQuestionSession","AnswerBuilderRuntime","KnowledgeGraphRuntime",
 "KnowledgeExtractionRuntime","AnalysisRuntime","SummaryRuntime","WrongBookGenerator","WrongBookSession",
 "ReviewQueue","ReviewModel","AIProvider"].forEach(m => {
  check("Provider 未呼叫 " + m, tpCode.indexOf("AHS." + m) === -1);
});
check("Provider 僅使用 MaterialRuntime 公開 getById", /AHS\.MaterialRuntime/.test(tpCode) && /getById/.test(tpCode));
check("Provider 零網路（fetch/XHR）", !/fetch\(|XMLHttpRequest/.test(tpCode));
check("Provider 零持久化（不建立第二套 Content Store）", !/PersistenceAdapter/.test(tpCode));

console.log("\nMaterialTextProviderV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
