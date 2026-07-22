/* tests/regression/KnowledgeFoundationV1.js — EO-S8.0-001 Foundation QA
   under PMO Final Decision (LOCK). Verifies Decisions 1–5 and Decision
   019's two structural prohibitions.
   Run: node tests/regression/KnowledgeFoundationV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js",
 "js/runtime/DocumentClassifierRuntime.js","js/runtime/KnowledgeGraphRuntime.js",
 "js/runtime/KnowledgeExtractionRuntime.js",
 "js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js","js/runtime/ExamBankRuntime.js","js/runtime/AnswerBuilderRuntime.js",
 "js/parser/AIProviderInterface.js","js/parser/LearningQuestionGenerator.js",
 "js/runtime/LearningQuestionSession.js","js/parser/KnowledgePipeline.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const KG = AHS.KnowledgeGraphRuntime, DC = AHS.DocumentClassifierRuntime, AN = AHS.AnalysisRuntime,
      EB = AHS.ExamBankRuntime, AB = AHS.AnswerBuilderRuntime, KP = AHS.KnowledgePipeline,
      LQS = AHS.LearningQuestionSession;
KG.reset(); DC.reset(); AN.reset(); EB.reset(); LQS.reset();
/* EO-S8.0-004: every analyzed material must live in a Study Scope. */
const scope = AHS.FolderRuntime.createFolder({ folderName: "S8 測試範圍", subject: "math", scopeType: "custom" });

console.log("\n[Decision 1 — Document Classifier：決定性，無 OCR/LLM/Parser/AI]");
AHS.FolderRuntime = AHS.FolderRuntime || null;
const mat  = AHS.MaterialRuntime.add({ title: "三角函數", subject: "math", grade: "高一", chapter: "第三章", category: "課本", folderId: scope.folderId, fileName: "三角函數教材.pdf", fileType: "PDF" });
const exam = AHS.MaterialRuntime.add({ title: "第一次段考", subject: "math", grade: "高一", chapter: "第三章", category: "講義", folderId: scope.folderId, fileName: "高一數學段考卷.pdf", fileType: "PDF" });
const note = AHS.MaterialRuntime.add({ title: "上課筆記", subject: "math", grade: "高一", chapter: "第三章", category: "課本", folderId: scope.folderId, fileName: "第三章筆記.docx", fileType: "DOCX" });
const ans  = AHS.MaterialRuntime.add({ title: "段考解答", subject: "math", grade: "高一", chapter: "第三章", category: "課本", folderId: scope.folderId, fileName: "段考卷解答.pdf", fileType: "PDF" });
const unk  = AHS.MaterialRuntime.add({ title: "untitled", subject: "math", grade: "高一", category: "課本", folderId: scope.folderId, fileName: "scan0001.pdf", fileType: "PDF" });
check("教材/考卷/筆記/解答 正確辨識",
  DC.classify(mat).documentType === "material" && DC.classify(exam).documentType === "exam" &&
  DC.classify(note).documentType === "note" && DC.classify(ans).documentType === "answer_key");
check("無法判定 → 固定 other（不得猜測）",
  (() => { const r = DC.classify(unk); return r.documentType === "other" && r.signal === "none"; })());
check("不由 UI 分類欄位決定（考卷 category='講義' 仍判 exam）", DC.getByMaterialId(exam.id).documentType === "exam");

console.log("\n[Decision 2 — Knowledge Graph Skeleton Only]");
KP.process(mat.id); KP.process(note.id);
/* EO-S8.0-004 授權解除內容節點白名單：Skeleton 六型仍為結構節點，
   另允許五型知識內容節點；下游產物型別永久禁止。 */
check("Skeleton 六型維持",
  JSON.stringify(KG.SKELETON_TYPES) === JSON.stringify(["subject","chapter","section","source_file","document_type","metadata"]));
check("內容節點五型已由 EO-S8.0-004 解除",
  JSON.stringify(KG.CONTENT_TYPES) === JSON.stringify(["knowledge_point","definition","formula","keyword","concept"]));
["summary","question","answer","review","wrongbook","explanation","exam_point"].forEach(t => {
  check("下游產物型別 " + t + " → 永久拒收",
    KG.addNode({ type: t, label: "x", content: "x", folderId: "fd_1", documentType: "material",
      sourceFileId: mat.id, sourcePage: null, sourceParagraph: null }) === null);
});
check("內容節點缺 folderId → 拒收（Folder Scope）",
  KG.addNode({ type: "concept", label: "x", documentType: "material", sourceFileId: mat.id, sourcePage: null, sourceParagraph: null }) === null);
check("Skeleton 建立：source_file + document_type + subject + chapter",
  (() => { const n = KG.queryByMaterial(mat.id).map(x => x.type);
           return ["source_file","document_type","subject","chapter"].every(t => n.includes(t)); })());
check("無資料時 sourcePage / sourceParagraph 固定 null（不得 Mock/Fake）",
  KG.queryByMaterial(mat.id).every(n => n.sourcePage === null && n.sourceParagraph === null));
check("所有節點保留 sourceFileId（缺即拒收）",
  KG.queryByMaterial(mat.id).every(n => !!n.sourceFileId) &&
  KG.addNode({ type: "subject", label: "x", sourcePage: null, sourceParagraph: null }) === null);
check("多檔共建單一圖譜（chapter 合併，materialIds 含教材與筆記）",
  (() => { const ch = KG.queryByType("chapter"); return ch.length === 1 &&
    ch[0].materialIds.includes(mat.id) && ch[0].materialIds.includes(note.id); })());

console.log("\n[Decision 3 — AnalysisRuntime + Summary Schema v2（向下相容，SummaryRuntime LOCK）]");
check("Schema v2 七段定義齊備",
  JSON.stringify(AN.SECTIONS) === JSON.stringify(["coreConcepts","definitions","keywords","formulas","pitfalls","examTypes","furtherReading"]));
check("v2 向下相容：涵蓋 LOCK 五段之三段同名 + 擴充四段",
  ["coreConcepts","definitions","pitfalls"].every(s => AN.SECTIONS.includes(s)) && AN.SECTIONS.length === 7);
const a = AN.analyze(mat.id);
/* EO-S8.0-004: pending 鎖已解除；無可讀文字時誠實回 insufficient_source。 */
check("無可讀文字 → insufficient_source，零 items（不得臆測）",
  a.status === "insufficient_source" && a.items.length === 0);
check("零 Summary 記錄被儲存（Summary Generation 仍未實作）", AN.getByMaterialId(mat.id) === null);
check("store() 拒絕無法追溯之自由生成內容",
  AN.store({ materialId: mat.id, coreConcepts: [{ text: "捏造", knowledgeId: "kg_9999" }], definitions: [], keywords: [], formulas: [], pitfalls: [], examTypes: [], furtherReading: [] }) === null);

console.log("\n[Decision 4 — Question Mode A：原題保留，零預設題庫]");
check("Repo 出貨零預設題庫", EB.count() === 0);
check("非考卷檔 ingest → 拒收", EB.ingest({ examFileId: mat.id, question: "Q", answer: "A", sourcePage: null }) === null);
const q1 = EB.ingest({ examFileId: exam.id, subject: "math", chapter: "第三章", difficulty: "中等",
  questionType: "single_choice", question: "sin 30° = ?", options: ["1/2","√3/2"], answer: "1/2", sourcePage: null });
check("原題逐字保留", q1.question === "sin 30° = ?" && q1.answer === "1/2");
check("預留 knowledgeId/sourceFileId/sourcePage/sourceParagraph（允許 null）",
  ["knowledgeId","sourceFileId","sourcePage","sourceParagraph"].every(k => k in q1) && q1.knowledgeId === null);
check("無 AI 修改/美化/修正路徑（API 無 update/edit/enhance）",
  ["update","edit","enhance","rewrite","fix"].every(k => !(k in EB)));
check("Random / Chapter / Difficulty / Count 選題可用",
  EB.select({ mode: "random", examFileId: exam.id }).length === 1 &&
  EB.select({ chapter: "第三章" }).length === 1 && EB.select({ count: 1 }).length === 1);

console.log("\n[Decision 5 + Decision 019 — Foundation Only，禁 Metadata/Material → Question]");
const r = KP.process(mat.id);
check("Pipeline 於 analysis_insufficient 收束（零節點，不做 Summary/Question）",
  r.status === "success" && r.stage === "analysis_insufficient" && r.nodesCreated === 0);
check("考卷路由收束於 exam_bank（不得重新產題）",
  (() => { const e = KP.process(exam.id); return e.stage === "exam_bank" && e.status === "success"; })());
check("Metadata → Question 禁止：Pipeline 全程零題產生", LQS.count() === 0);
check("Material → Question 禁止：KnowledgePipeline 原始碼零產題程式",
  (() => { const src = fs.readFileSync(path.join(ROOT, "js/parser/KnowledgePipeline.js"), "utf8");
           return !/LearningQuestionGenerator|questionType|generate\(/.test(src); })());
check("Pipeline 無 difficulty 參數（本 EO 不產題）", KP.process.length === 1);
check("material 不存在 → failed 停止", KP.process("rt_none").status === "failed");

console.log("\n[Answer Builder — Interface Only，缺項誠實標示，零猜測]");
const expl = AB.build({ question: "任一題", answer: "1/2", knowledgeId: null, materialId: mat.id });
check("Skeleton 階段回報「缺少完整解答」+ missing 清單",
  expl.complete === false && expl.marker === "缺少完整解答" && expl.missing.length > 0 && AB.validate(expl).valid);
check("六項欄位結構齊備（供未來填入）",
  ["answer","steps","knowledgePoint","chapter","formula","source"].every(k => k in expl));

console.log("\n[AI Provider — Interface Only，不得綁定]");
check("固定四家 Provider", JSON.stringify(AHS.AIProvider.PROVIDERS) === JSON.stringify(["openai","azure_openai","claude","gemini"]));
check("不合合約 adapter 拒絕註冊", AHS.AIProvider.register({ id: "openai" }) === null);
check("getActive() 恆為 null（零綁定）",
  AHS.AIProvider.register({ id: "claude", classifyDocument(){}, extractKnowledge(){}, generateQuestions(){}, buildExplanation(){} }) === "claude" &&
  AHS.AIProvider.getActive() === null);
check("全庫零網路呼叫（fetch/XHR）",
  (() => { const files = ["js/parser/AIProviderInterface.js","js/parser/KnowledgePipeline.js","js/runtime/KnowledgeGraphRuntime.js","js/parser/MaterialTextProvider.js","js/parser/AnalysisRuntime.js"];
           return files.every(f => !/fetch\(|XMLHttpRequest/.test(fs.readFileSync(path.join(ROOT, f), "utf8"))); })());

console.log("\nKnowledgeFoundationV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
