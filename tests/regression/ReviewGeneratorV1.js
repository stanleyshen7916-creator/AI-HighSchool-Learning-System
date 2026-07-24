/* tests/regression/ReviewGeneratorV1.js — EO-S8.2.005.
   Verifies the LOCK Review Model, priority/knowledge-type enums, WrongBook
   correspondence, questionId de-duplication, full traceability,
   result-only sourcing (no material / knowledge dependency) and
   memory-only storage.
   Run: node tests/regression/ReviewGeneratorV1.js */
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
 "js/runtime/ReviewModel.js","js/runtime/ReviewGeneratorRuntime.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const RG = AHS.ReviewGeneratorRuntime, QG = AHS.QuestionGenerationRuntime,
      WBS = AHS.WrongBookSession, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline, FR = AHS.FolderRuntime, MR = AHS.MaterialRuntime;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset();
WBS.reset(); QG.clearQuestions(); RG.clearReview();

/* Real chain: Folder → Material → Pipeline → KG → Questions. */
const TEXT = [
  "三角函數", "斜邊", "對邊",
  "正弦：對邊除以斜邊", "餘弦：鄰邊除以斜邊", "正切：對邊除以鄰邊",
  "餘弦定理 a² = b² + c² − 2bc·cosA", "正弦定理 a÷sinA = b÷sinB",
  "本節討論三角函數的定義、性質與其在解三角形中的應用。"
].join("\n");
const folder = FR.createFolder({ folderName: "三角函數範圍", subject: "math", scopeType: "custom" });
const mat = MR.add({ title: "三角函數講義", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "三角函數教材.pdf", fileType: "PDF",
  folderId: folder.folderId, content: TEXT });
KP.process(mat.id);
const qSet = QG.generateQuestions(mat.id);
check("前置：Quiz/Exam Result 已產生題目", !!qSet && qSet.questions.length >= 4);

/* Build REAL WrongBook entries whose questionId points at those questions.
   WrongBookGenerator resolves content from LearningQuestionSession, so the
   same questions are registered there and answered wrongly the required
   number of times — no hand-written wrong-book records. */
const G = AHS.LearningQuestionGenerator, LQS = AHS.LearningQuestionSession;
LQS.reset();
const picked = qSet.questions.slice(0, 3);
picked.forEach(function (q) {
  const record = G.generate({
    id: q.id, materialId: mat.id, subject: "math", grade: "高一", chapter: "第三章", section: "",
    knowledgePoint: q.knowledgeNodeId, difficulty: q.difficulty, questionType: "single_choice",
    question: q.question, options: q.options, answer: q.answer,
    explanation: q.explanation, knowledgeId: q.knowledgeNodeId, summaryId: null
  });
  LQS.add(record);
});
/* q0 wrong 3 times → high, q1 wrong twice → medium, q2 wrong once → low */
[3, 2, 1].forEach(function (times, i) {
  for (let n = 0; n < times; n += 1) {
    AHS.WrongBookGenerator.add({ questionId: picked[i].id, userAnswer: "錯誤答案" + n });
  }
});
check("前置：WrongBook 建立三筆真實錯題（wrongCount 3/2/1）",
  WBS.count() === 3 &&
  WBS.getByQuestionId(picked[0].id).wrongCount === 3 &&
  WBS.getByQuestionId(picked[1].id).wrongCount === 2 &&
  WBS.getByQuestionId(picked[2].id).wrongCount === 1);

console.log("\n[API — 六個公開 API，不得新增其他]");
["generateReview","getReview","getReviewByMaterial","getReviewByKnowledgeNode","clearReview","serialize"]
  .forEach(fn => check("提供 " + fn + "()", typeof RG[fn] === "function"));
check("公開成員僅六個 API 與兩個唯讀常數",
  JSON.stringify(Object.keys(RG).sort()) === JSON.stringify(
    ["KNOWLEDGE_TYPES","PRIORITIES","clearReview","generateReview","getReview",
     "getReviewByKnowledgeNode","getReviewByMaterial","serialize"]));

console.log("\n[Review Model — LOCK 核心欄位]");
const rev = RG.generateReview(mat.id);
check("generateReview 回傳記錄", !!rev);
check("頂層欄位恰為 materialId / generatedAt / reviewItems",
  JSON.stringify(Object.keys(rev).sort()) === JSON.stringify(["generatedAt","materialId","reviewItems"]));
check("materialId 正確且 generatedAt 為 ISO 時間",
  rev.materialId === mat.id && /^\d{4}-\d{2}-\d{2}T/.test(rev.generatedAt));
const ITEM_FIELDS = ["questionId","knowledgeNodeId","knowledgeType","priority","difficulty","traceability"];
check("每筆欄位恰為 LOCK 六欄（未增減核心欄位）",
  rev.reviewItems.length === 3 &&
  rev.reviewItems.every(it => JSON.stringify(Object.keys(it).sort()) === JSON.stringify(ITEM_FIELDS.slice().sort())));

console.log("\n[Knowledge Type — LOCK 四類]");
check("常數恰為 definition / formula / keyword / concept",
  JSON.stringify(RG.KNOWLEDGE_TYPES) === JSON.stringify(["definition","formula","keyword","concept"]));
check("每筆 knowledgeType 皆在允許值內",
  rev.reviewItems.every(it => RG.KNOWLEDGE_TYPES.indexOf(it.knowledgeType) !== -1));
check("knowledgeType 逐字取自 Quiz/Exam Result 的題目記錄（未改標）",
  rev.reviewItems.every(it => QG.getQuestion(it.questionId).knowledgeType === it.knowledgeType));

console.log("\n[Review Rules — LOCK]");
check("Priority 常數恰為 high / medium / low",
  JSON.stringify(RG.PRIORITIES) === JSON.stringify(["high","medium","low"]));
check("每筆 priority 皆在允許值內",
  rev.reviewItems.every(it => RG.PRIORITIES.indexOf(it.priority) !== -1));
check("priority 由 wrongCount 決定性推導（3→high、2→medium、1→low）",
  (() => { const byQ = {}; rev.reviewItems.forEach(it => { byQ[it.questionId] = it.priority; });
    return byQ[picked[0].id] === "high" && byQ[picked[1].id] === "medium" && byQ[picked[2].id] === "low"; })());
check("masteryLevel = mastered → low（已精熟降級）",
  (() => { const wb = WBS.getByQuestionId(picked[0].id);
    AHS.WrongBookGenerator.update(wb.id, { masteryLevel: "mastered" });
    const r = RG.generateReview(mat.id);
    const item = r.reviewItems.find(it => it.questionId === picked[0].id);
    AHS.WrongBookGenerator.update(wb.id, { masteryLevel: "new" });
    RG.generateReview(mat.id);
    return item.priority === "low"; })());
check("difficulty 逐字取自題目記錄且在 easy/medium/hard 內",
  rev.reviewItems.every(it => it.difficulty === QG.getQuestion(it.questionId).difficulty &&
    ["easy","medium","hard"].indexOf(it.difficulty) !== -1));
check("相同 questionId 不重複建立（同題答錯三次僅一筆）",
  new Set(rev.reviewItems.map(it => it.questionId)).size === rev.reviewItems.length);
check("每筆 Review Item 皆對應真實 WrongBook 記錄",
  rev.reviewItems.every(it => !!WBS.getByQuestionId(it.questionId)));
check("排序決定性：high → medium → low",
  (() => { const order = rev.reviewItems.map(it => RG.PRIORITIES.indexOf(it.priority));
    return order.every((v, i) => i === 0 || order[i - 1] <= v); })());
check("決定性：重複產生結果一致",
  (() => { const again = RG.generateReview(mat.id);
    const strip = r => r.reviewItems.map(it => [it.questionId, it.priority, it.difficulty, it.knowledgeNodeId].join("~"));
    return JSON.stringify(strip(again)) === JSON.stringify(strip(rev)); })());

console.log("\n[Traceability — LOCK 六欄位，全部可回溯]");
check("每筆 traceability 皆帶 materialId / questionId / knowledgeNodeId / paragraph / lineStart / lineEnd",
  rev.reviewItems.every(it => ["materialId","questionId","knowledgeNodeId","paragraph","lineStart","lineEnd"]
    .every(f => f in it.traceability)));
check("materialId / questionId / knowledgeNodeId 與項目一致",
  rev.reviewItems.every(it => it.traceability.materialId === mat.id &&
    it.traceability.questionId === it.questionId &&
    it.traceability.knowledgeNodeId === it.knowledgeNodeId));
check("knowledgeNodeId 全數可解析回真實圖譜節點（可回溯教材）",
  rev.reviewItems.every(it => !!KG.getNode(it.knowledgeNodeId)));
check("paragraph 為真實段落序號（沿用題目 trace）",
  rev.reviewItems.every(it => typeof it.traceability.paragraph === "number" && it.traceability.paragraph >= 1));
check("lineStart / lineEnd 誠實沿用上游 null（不得虛構）",
  rev.reviewItems.every(it => it.traceability.lineStart === null && it.traceability.lineEnd === null));

console.log("\n[Review Source — 僅 WrongBook 與 Quiz/Exam Result]");
const code = fs.readFileSync(path.join(ROOT, "js/runtime/ReviewGeneratorRuntime.js"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
["MaterialRuntime","AnalysisRuntime","SummaryRuntime","KnowledgeSummaryRuntime",
 "KnowledgeExtractionRuntime","KnowledgeGraphRuntime","MaterialTextProvider",
 "SummaryGenerator","QuestionGenerationFlow","ParserAdapterRegistry"].forEach(m => {
  check("未依賴 " + m, code.indexOf("AHS." + m) === -1);
});
check("唯一來源為 WrongBookSession 與 QuestionGenerationRuntime 之公開讀取 API",
  /AHS\.WrongBookSession/.test(code) && /AHS\.QuestionGenerationRuntime/.test(code) &&
  /\.list\(\)/.test(code) && /getQuestion\(/.test(code));
check("未寫入 WrongBook（唯讀消費）",
  !/WrongBookSession\.(store|removeById|setMetadata|reset)/.test(code) &&
  code.indexOf("AHS.WrongBookGenerator") === -1);
check("無 WrongBook 記錄 → 回傳 null（不虛構複習清單）",
  (() => { const m2 = MR.add({ title: "無錯題", subject: "math", grade: "高一", category: "講義",
      fileName: "clean教材.pdf", fileType: "PDF", folderId: folder.folderId, content: "餘弦：鄰邊除以斜邊" });
    KP.process(m2.id); QG.generateQuestions(m2.id);
    return RG.generateReview(m2.id) === null; })());
check("題目無法自 Quiz/Exam Result 解析 → 該筆跳過，不猜測 knowledgeType",
  (() => {
    /* 獨立教材：建立錯題後，其題目未存在於結果側（questionId 取自
       LearningQuestionSession 而非 QuestionGenerationRuntime），
       故無法解析 knowledgeType → 應整批跳過而非猜測。 */
    const m3 = MR.add({ title: "無結果側對應", subject: "math", grade: "高一", category: "講義",
      fileName: "orphan教材.pdf", fileType: "PDF", folderId: folder.folderId,
      content: "正切：對邊除以鄰邊" });
    KP.process(m3.id);
    const orphanQ = G.generate({
      id: "lq_orphan_1", materialId: m3.id, subject: "math", grade: "高一", chapter: "", section: "",
      knowledgePoint: "正切", difficulty: "easy", questionType: "single_choice",
      question: "正切的定義為何？", options: ["對邊/鄰邊", "對邊/斜邊"], answer: "對邊/鄰邊",
      explanation: "依教材定義。", knowledgeId: "kg_x", summaryId: null
    });
    LQS.add(orphanQ);
    AHS.WrongBookGenerator.add({ questionId: orphanQ.id, userAnswer: "對邊/斜邊" });
    const hasWrongBook = !!WBS.getByQuestionId(orphanQ.id);
    const notInResult = QG.getQuestion(orphanQ.id) === null;
    return hasWrongBook && notInResult && RG.generateReview(m3.id) === null; })());
check("不存在的 materialId → null", RG.generateReview("rt_none") === null);

console.log("\n[Runtime — Memory Only]");
check("原始碼零 localStorage / sessionStorage / IndexedDB / PersistenceAdapter",
  !/localStorage|sessionStorage|indexedDB|PersistenceAdapter/i.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));

console.log("\n[API 行為]");
check("getReviewByMaterial 取回該教材清單", RG.getReviewByMaterial(mat.id).materialId === mat.id);
check("getReview() 無參數回傳最近一筆", RG.getReview().materialId === mat.id);
check("getReview(materialId) 等同 getReviewByMaterial",
  JSON.stringify(RG.getReview(mat.id)) === JSON.stringify(RG.getReviewByMaterial(mat.id)));
check("getReviewByKnowledgeNode 依知識節點取回項目",
  (() => { const nodeId = RG.getReviewByMaterial(mat.id).reviewItems[0].knowledgeNodeId;
    const items = RG.getReviewByKnowledgeNode(nodeId);
    return items.length >= 1 && items.every(it => it.knowledgeNodeId === nodeId); })());
check("getReviewByKnowledgeNode 未知節點 → 空陣列",
  Array.isArray(RG.getReviewByKnowledgeNode("kg_none")) && RG.getReviewByKnowledgeNode("kg_none").length === 0);
check("重複 generateReview 覆蓋而非累積", JSON.parse(RG.serialize()).length === 1);
check("serialize(materialId) 為合法 JSON 且含 reviewItems",
  (() => { const o = JSON.parse(RG.serialize(mat.id));
    return o.materialId === mat.id && Array.isArray(o.reviewItems); })());
check("serialize() 回傳全部記錄之陣列", Array.isArray(JSON.parse(RG.serialize())));
check("回傳值為複本（外部修改不影響 Runtime）",
  (() => { const r = RG.getReviewByMaterial(mat.id); r.reviewItems.push({ questionId: "污染" });
    return RG.getReviewByMaterial(mat.id).reviewItems.length === 3; })());
check("clearReview(materialId) 移除該筆",
  RG.clearReview(mat.id) === 1 && RG.getReviewByMaterial(mat.id) === null);
check("clearReview() 清空全部",
  (() => { RG.generateReview(mat.id); const n = RG.clearReview();
    return n >= 1 && RG.getReview() === null && RG.serialize() === "[]"; })());

console.log("\n[既有 Review 能力未受影響]");
check("LOCK ReviewModel API 未變",
  ["getTodayReview","getDueReview","getReviewProgress","getMasteryStatistics","setNextReview"]
    .every(k => typeof AHS.ReviewModel[k] === "function"));
check("LOCK ReviewQueue 未被本 Runtime 寫入",
  (() => { const before = AHS.ReviewQueue.count();
    RG.generateReview(mat.id); return AHS.ReviewQueue.count() === before; })());
check("三個 Capability Runtime 為不同模組",
  RG !== AHS.KnowledgeSummaryRuntime && RG !== QG && RG !== AHS.ReviewModel);

console.log("\nReviewGeneratorV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
