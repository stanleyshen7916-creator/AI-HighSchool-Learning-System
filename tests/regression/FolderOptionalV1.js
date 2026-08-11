/* tests/regression/FolderOptionalV1.js — Sprint AI-107 · Bug AI107-01.
   A/B regression: the exact acceptance test this Sprint mandates —
   the SAME material content, once with a Folder assigned and once
   without, must produce fully equivalent Knowledge Graph / Summary /
   Question / Learning Flow results, differing only in folderId. Real
   Folder-having materials must remain completely unaffected (the
   original EO-S8.0-004 behavior, still LOCK for that case).
   Run: node tests/regression/FolderOptionalV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js", "js/runtime/MaterialRuntime.js", "js/runtime/FolderRuntime.js",
  "js/runtime/DocumentClassifierRuntime.js", "js/runtime/KnowledgeGraphRuntime.js",
  "js/parser/MaterialTextProvider.js", "js/parser/AnalysisRuntime.js",
  "js/runtime/KnowledgeExtractionRuntime.js", "js/parser/KnowledgePipeline.js",
  "js/runtime/QuestionGenerationRuntime.js", "js/runtime/AITutorService.js",
  "js/parser/MaterialTextPipeline.js", "js/parser/ParserAdapterRegistry.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const MR = AHS.MaterialRuntime, FR = AHS.FolderRuntime, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline, KE = AHS.KnowledgeExtractionRuntime,
      QG = AHS.QuestionGenerationRuntime, ATS = AHS.AITutorService;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset(); AHS.AnalysisRuntime.reset();

const TEXT = [
  "三角函數", "斜邊", "正弦：對邊除以斜邊", "餘弦：鄰邊除以斜邊", "正切：對邊除以鄰邊",
  "餘弦定理 a² = b² + c² − 2bc·cosA", "本節說明三角函數的定義與應用。"
].join("\n");

console.log("\n[A — 無 Folder：真實 UI 上傳最常見路徑]");
const matNoFolder = MR.add({
  title: "三角函數（無 Folder）", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "trig-a.txt", fileType: "TXT", content: TEXT
});
check("材料建立時未指定 folderId", matNoFolder.folderId === null || matNoFolder.folderId === undefined);

const pA = KP.process(matNoFolder.id);
check("A. KnowledgePipeline 正常完成（不再硬性要求 Folder）", pA.status === "success" && pA.stage === "done");
check("A. Pipeline 結果 folderId 誠實為 null", pA.folderId === null);
check("A. 產生真實 Graph Node（非 0）", pA.nodesCreated > 0);

const graphA = KG.queryByMaterial(matNoFolder.id);
check("A. Knowledge Graph 確實含真實內容節點", graphA.some((n) => KG.CONTENT_TYPES.indexOf(n.type) !== -1));
check("A. 所有內容節點 folderId 為 null（非 undefined、非省略）",
  graphA.filter((n) => KG.CONTENT_TYPES.indexOf(n.type) !== -1).every((n) => n.folderId === null));

const ensureA = ATS.ensureQuestionSet(matNoFolder.id, false);
check("A. AITutorService.ensureQuestionSet 產生真實題目（非 no_readable_content）",
  ensureA && Array.isArray(ensureA.questions) && ensureA.questions.length > 0);

console.log("\n[B — 有 Folder：既有行為必須完全不受影響（Regression Guard）]");
const folder = FR.createFolder({ folderName: "AI107 迴歸測試範圍", subject: "math", scopeType: "custom" });
const matWithFolder = MR.add({
  title: "三角函數（有 Folder）", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "trig-b.txt", fileType: "TXT", folderId: folder.folderId, content: TEXT
});
const pB = KP.process(matWithFolder.id);
check("B. KnowledgePipeline 正常完成", pB.status === "success" && pB.stage === "done");
check("B. Pipeline 結果 folderId 為真實 Folder", pB.folderId === folder.folderId);
check("B. 產生真實 Graph Node（非 0）", pB.nodesCreated > 0);

const graphB = KG.queryByMaterial(matWithFolder.id);
check("B. 所有內容節點 folderId 為真實 Folder（未被 A 的 null 污染）",
  graphB.filter((n) => KG.CONTENT_TYPES.indexOf(n.type) !== -1).every((n) => n.folderId === folder.folderId));
check("B. queryByFolder 僅回傳該 Folder 節點，不含 A 的 null-scope 節點",
  KG.queryByFolder(folder.folderId).every((n) => n.folderId === folder.folderId) &&
  KG.queryByFolder(folder.folderId).every((n) => n.materialIds.indexOf(matNoFolder.id) === -1));

const ensureB = ATS.ensureQuestionSet(matWithFolder.id, false);
check("B. 有 Folder 材料同樣正常產生真實題目", ensureB && Array.isArray(ensureB.questions) && ensureB.questions.length > 0);

console.log("\n[A/B 一致性 — 相同內容、唯一差異為 folderId]");
check("A、B 節點數一致（同樣的真實文字內容應產出相同數量的知識節點）",
  graphA.filter((n) => KG.CONTENT_TYPES.indexOf(n.type) !== -1).length ===
  graphB.filter((n) => KG.CONTENT_TYPES.indexOf(n.type) !== -1).length);
check("A、B 產生的題目數一致", ensureA.questions.length === ensureB.questions.length);
check("A 的節點 content 與 B 的節點 content 集合相同（逐字一致，僅 folderId 不同）",
  (() => {
    const contentsA = graphA.filter((n) => KG.CONTENT_TYPES.indexOf(n.type) !== -1).map((n) => n.content).sort();
    const contentsB = graphB.filter((n) => KG.CONTENT_TYPES.indexOf(n.type) !== -1).map((n) => n.content).sort();
    return JSON.stringify(contentsA) === JSON.stringify(contentsB);
  })());

console.log("\n[Folder 不存在（真正的錯誤狀態）— 仍必須正確失敗，未被本次修正誤放行]");
const matDangling = MR.add({
  title: "指向已刪除 Folder", subject: "math", grade: "高一", category: "課本",
  fileName: "dangling.txt", fileType: "TXT", folderId: "fd_does_not_exist", content: TEXT
});
const pDangling = KP.process(matDangling.id);
check("指向不存在 Folder 的教材仍正確失敗（非全面放行）", pDangling.status === "failed" && /Folder/.test(pDangling.errors[0]));

console.log("\n[Runtime Rules — 未建立新 Runtime、未改變公開 API 形狀]");
check("KnowledgePipeline 公開 API 未變（process / processFolder）",
  JSON.stringify(Object.keys(KP).sort()) === JSON.stringify(["process", "processFolder"]));
check("KnowledgeExtractionRuntime 公開 API 未變（extract / validate / store / status）",
  JSON.stringify(Object.keys(KE).sort()) === JSON.stringify(["extract", "status", "store", "validate"]));
check("KnowledgeGraphRuntime 公開 API 未變",
  ["addNode", "addEdge", "buildFromMaterial", "getNode", "queryByType", "queryByMaterial",
    "neighbors", "stats", "validateNode", "queryByFolder", "reset"].every((k) => typeof KG[k] === "function"));

console.log("\nFolderOptionalV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
