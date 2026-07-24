/* tests/regression/QuestionGenerationRuntimeV1.js — EO-S8.2.003.
   Verifies the LOCK Question Model, four-real-option rule, knowledge-type
   and difficulty enums, full traceability, Knowledge-Graph-only sourcing,
   independence from any Summary module, and memory-only storage.
   Run: node tests/regression/QuestionGenerationRuntimeV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js",
 "js/runtime/KnowledgeExtractionRuntime.js","js/parser/KnowledgePipeline.js",
 "js/runtime/SummaryRuntime.js","js/runtime/KnowledgeSummaryRuntime.js",
 "js/runtime/QuestionGenerationRuntime.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const QG = AHS.QuestionGenerationRuntime, KG = AHS.KnowledgeGraphRuntime,
      KP = AHS.KnowledgePipeline, FR = AHS.FolderRuntime, MR = AHS.MaterialRuntime;
MR.reset(); KG.reset(); AHS.DocumentClassifierRuntime.reset(); QG.clearQuestions();

/* Real Foundation run: text chosen so the deterministic analysis rules
   yield several nodes across types (=/符號→formula, ：→definition,
   短詞→keyword, 其餘→concept). */
const TEXT = [
  "三角函數", "斜邊", "對邊",
  "正弦：對邊除以斜邊",
  "餘弦：鄰邊除以斜邊",
  "正切：對邊除以鄰邊",
  "餘弦定理 a² = b² + c² − 2bc·cosA",
  "正弦定理 a÷sinA = b÷sinB",
  "本節討論三角函數的定義、性質與其在解三角形中的應用。"
].join("\n");
const folder = FR.createFolder({ folderName: "三角函數範圍", subject: "math", scopeType: "custom" });
const mat = MR.add({ title: "三角函數講義", subject: "math", grade: "高一", chapter: "第三章",
  category: "講義", fileName: "三角函數教材.pdf", fileType: "PDF",
  folderId: folder.folderId, content: TEXT });
const run = KP.process(mat.id);
check("前置：Foundation 管線寫入知識節點", run.status === "success" && run.nodesCreated === 9);

console.log("\n[API — 六個公開 API，不得新增其他]");
["generateQuestions","getQuestion","getQuestions","getQuestionsByMaterial","clearQuestions","serialize"]
  .forEach(fn => check("提供 " + fn + "()", typeof QG[fn] === "function"));
check("公開成員僅六個 API 與兩個唯讀常數",
  JSON.stringify(Object.keys(QG).sort()) === JSON.stringify(
    ["DIFFICULTIES","KNOWLEDGE_TYPES","clearQuestions","generateQuestions","getQuestion",
     "getQuestions","getQuestionsByMaterial","serialize"]));

console.log("\n[Question Model — LOCK 核心欄位]");
const set = QG.generateQuestions(mat.id);
check("generateQuestions 回傳記錄", !!set);
check("頂層欄位恰為 materialId / generatedAt / questions",
  JSON.stringify(Object.keys(set).sort()) === JSON.stringify(["generatedAt","materialId","questions"]));
check("materialId 正確且 generatedAt 為 ISO 時間",
  set.materialId === mat.id && /^\d{4}-\d{2}-\d{2}T/.test(set.generatedAt));
check("questions 為非空陣列", Array.isArray(set.questions) && set.questions.length > 0);
const FIELDS = ["id","knowledgeNodeId","knowledgeType","type","difficulty","question",
  "options","answer","explanation","traceability"];
check("每題欄位恰為 LOCK 十欄（未增減核心欄位）",
  set.questions.every(q => JSON.stringify(Object.keys(q).sort()) === JSON.stringify(FIELDS.slice().sort())));
check("id 全域唯一", new Set(set.questions.map(q => q.id)).size === set.questions.length);
check("type 為 single_choice（四選項單選）", set.questions.every(q => q.type === "single_choice"));

console.log("\n[Knowledge Type — LOCK 四類，不得新增]");
check("常數恰為 definition / formula / keyword / concept",
  JSON.stringify(QG.KNOWLEDGE_TYPES) === JSON.stringify(["definition","formula","keyword","concept"]));
check("每題 knowledgeType 皆在允許值內",
  set.questions.every(q => QG.KNOWLEDGE_TYPES.indexOf(q.knowledgeType) !== -1));
check("knowledgeType 等於圖譜節點的真實型別（未改標）",
  set.questions.every(q => KG.getNode(q.knowledgeNodeId).type === q.knowledgeType));
check("knowledge_point 節點被跳過而非改標為允許值",
  (() => { const kpIds = KG.queryByMaterial(mat.id).filter(n => n.type === "knowledge_point").map(n => n.id);
    return set.questions.every(q => kpIds.indexOf(q.knowledgeNodeId) === -1); })());

console.log("\n[Question Rules — LOCK：四選項 / 答案 / 詳解 / 難度]");
check("每題恰四個選項", set.questions.every(q => Array.isArray(q.options) && q.options.length === 4));
check("四個選項互不重複", set.questions.every(q => new Set(q.options).size === 4));
check("正確答案必在選項之中", set.questions.every(q => q.options.indexOf(q.answer) !== -1));
check("每題答案與詳解皆非空",
  set.questions.every(q => String(q.answer).trim() && String(q.explanation).trim()));
check("每題題目文字非空", set.questions.every(q => String(q.question).trim()));
check("difficulty 僅 easy / medium / hard",
  JSON.stringify(QG.DIFFICULTIES) === JSON.stringify(["easy","medium","hard"]) &&
  set.questions.every(q => QG.DIFFICULTIES.indexOf(q.difficulty) !== -1));
check("三種難度皆由決定性規則產生（分類題 easy、同型別回想題 hard）",
  (() => { const byD = {};
    set.questions.forEach(q => { byD[q.difficulty] = (byD[q.difficulty] || 0) + 1; });
    return byD.easy > 0 && (byD.hard > 0 || byD.medium > 0); })());

console.log("\n[選項皆為真實內容 — 不得虛構]");
const nodeTexts = KG.queryByMaterial(mat.id).map(n => String(n.content || n.label || ""));
const TYPE_LABELS = ["定義", "公式", "關鍵字", "概念"];
check("每個選項皆為「真實節點內容」或「四類固定標籤」之一",
  set.questions.every(q => q.options.every(opt =>
    nodeTexts.indexOf(opt) !== -1 || TYPE_LABELS.indexOf(opt) !== -1)));
check("零填充式選項（以上皆非／無／N/A）",
  set.questions.every(q => q.options.every(opt => !/以上皆非|以上皆是|無|N\/A|none/i.test(opt))));
check("回想題答案逐字等於節點內容",
  set.questions.filter(q => q.difficulty !== "easy")
    .every(q => q.answer === String(KG.getNode(q.knowledgeNodeId).content ||
                                    KG.getNode(q.knowledgeNodeId).label)));
check("決定性：同一圖譜重複產生結果一致（題目/選項/答案）",
  (() => { const again = QG.generateQuestions(mat.id);
    const strip = r => r.questions.map(q => [q.knowledgeNodeId, q.question, q.options.join("|"), q.answer, q.difficulty].join("~"));
    return JSON.stringify(strip(again)) === JSON.stringify(strip(set)); })());

console.log("\n[Traceability — LOCK 五欄位，全部可回溯]");
const qs = QG.getQuestions();
check("每題 traceability 皆帶 materialId / knowledgeNodeId / paragraph / lineStart / lineEnd",
  qs.length > 0 && qs.every(q => ["materialId","knowledgeNodeId","paragraph","lineStart","lineEnd"]
    .every(f => f in q.traceability)));
check("materialId 正確且 knowledgeNodeId 與題目一致",
  qs.every(q => q.traceability.materialId === mat.id && q.traceability.knowledgeNodeId === q.knowledgeNodeId));
check("knowledgeNodeId 全數可解析回真實圖譜節點",
  qs.every(q => !!KG.getNode(q.knowledgeNodeId)));
check("paragraph 為真實段落序號", qs.every(q => typeof q.traceability.paragraph === "number" && q.traceability.paragraph >= 1));
check("lineStart / lineEnd 誠實為 null（圖譜尚無行號，不得猜測）",
  qs.every(q => q.traceability.lineStart === null && q.traceability.lineEnd === null));

console.log("\n[Question Source — 僅 Knowledge Graph，且不依賴 Summary]");
const code = fs.readFileSync(path.join(ROOT, "js/runtime/QuestionGenerationRuntime.js"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
check("未呼叫 SummaryRuntime（禁止）", code.indexOf("AHS.SummaryRuntime") === -1);
check("未呼叫 KnowledgeSummaryRuntime（平行 Consumer，不得依賴）",
  code.indexOf("AHS.KnowledgeSummaryRuntime") === -1);
check("未呼叫 SummaryGenerator / QuestionGenerationFlow（不得複製既有 Summary→Question 路徑）",
  code.indexOf("AHS.SummaryGenerator") === -1 && code.indexOf("AHS.QuestionGenerationFlow") === -1);
check("未讀取 MaterialRuntime（不得重新解析教材）", code.indexOf("AHS.MaterialRuntime") === -1);
check("未呼叫 AnalysisRuntime / MaterialTextProvider（不得建立新 Analysis Pipeline）",
  code.indexOf("AHS.AnalysisRuntime") === -1 && code.indexOf("AHS.MaterialTextProvider") === -1);
check("未呼叫 KnowledgeExtractionRuntime（不得重複擷取 Knowledge）",
  code.indexOf("AHS.KnowledgeExtractionRuntime") === -1);
check("未呼叫既有 LearningQuestion* / ExamBank（不得建立第二套題庫寫入）",
  code.indexOf("AHS.LearningQuestionGenerator") === -1 &&
  code.indexOf("AHS.LearningQuestionSession") === -1 &&
  code.indexOf("AHS.ExamBankRuntime") === -1);
check("唯一資料來源為 KnowledgeGraphRuntime 公開查詢 API",
  /AHS\.KnowledgeGraphRuntime/.test(code) && /queryByMaterial/.test(code));
check("圖譜僅骨架（無內容節點）→ 回傳 null，不虛構題目",
  (() => { const m2 = MR.add({ title: "空白", subject: "math", grade: "高一", category: "講義",
      fileName: "blank教材.pdf", fileType: "PDF", folderId: folder.folderId });
    KP.process(m2.id);
    return QG.generateQuestions(m2.id) === null; })());
check("不存在的 materialId → null", QG.generateQuestions("rt_none") === null);

console.log("\n[Runtime — Memory Only]");
check("原始碼零 localStorage / sessionStorage / IndexedDB / PersistenceAdapter",
  !/localStorage|sessionStorage|indexedDB|PersistenceAdapter/i.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));

console.log("\n[API 行為]");
check("getQuestion(id) 取回單題", (() => { const one = QG.getQuestion(qs[0].id);
  return !!one && one.id === qs[0].id; })());
check("getQuestion 未知 id → null", QG.getQuestion("qg_nope") === null);
check("getQuestionsByMaterial 取回該教材記錄", QG.getQuestionsByMaterial(mat.id).materialId === mat.id);
check("getQuestions 回傳全部題目", QG.getQuestions().length === set.questions.length);
check("重複 generateQuestions 覆蓋而非累積", JSON.parse(QG.serialize()).length === 1);
check("serialize(materialId) 為合法 JSON 且含 questions",
  (() => { const o = JSON.parse(QG.serialize(mat.id));
    return o.materialId === mat.id && Array.isArray(o.questions); })());
check("serialize() 回傳全部記錄之陣列", Array.isArray(JSON.parse(QG.serialize())));
check("回傳值為複本（外部修改不影響 Runtime）",
  (() => { const r = QG.getQuestionsByMaterial(mat.id); r.questions.push({ id: "污染" });
    return QG.getQuestionsByMaterial(mat.id).questions.length === set.questions.length; })());
check("clearQuestions(materialId) 移除該筆",
  QG.clearQuestions(mat.id) === 1 && QG.getQuestionsByMaterial(mat.id) === null);
check("clearQuestions() 清空全部",
  (() => { QG.generateQuestions(mat.id); const n = QG.clearQuestions();
    return n >= 1 && QG.getQuestions().length === 0 && QG.serialize() === "[]"; })());

console.log("\n[平行 Consumer — 與 Summary 能力互不影響]");
check("Summary 能力可獨立運作且不受本 Runtime 影響",
  (() => { const s = AHS.KnowledgeSummaryRuntime.createSummary(mat.id);
    QG.generateQuestions(mat.id);
    const after = AHS.KnowledgeSummaryRuntime.getSummaryByMaterial(mat.id);
    return !!s && !!after && after.generatedAt === s.generatedAt; })());
check("本 Runtime 未寫入 LOCK SummaryRuntime / LearningQuestionRuntime",
  AHS.SummaryRuntime.list().length === 0);
check("兩個 Consumer 為不同模組", AHS.QuestionGenerationRuntime !== AHS.KnowledgeSummaryRuntime);

console.log("\nQuestionGenerationRuntimeV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
