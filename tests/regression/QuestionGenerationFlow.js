/* tests/regression/QuestionGenerationFlow.js — EO-S6.9-002 QA:
   Question Generation QA + Session QA + Schema QA + Pipeline QA.
   Run: node tests/regression/QuestionGenerationFlow.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
[
  "js/core/PersistenceAdapter.js",
  "js/runtime/MaterialRuntime.js",
  "js/runtime/KnowledgeRuntime.js",
  "js/runtime/SummaryRuntime.js",
  "js/runtime/LearningQuestionRuntime.js",
  "js/parser/LearningQuestionGenerator.js",
  "js/runtime/LearningQuestionSession.js",
  "js/parser/QuestionGenerationFlow.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : fail++; console.log((cond ? "  PASS  " : "  FAIL  ") + name); }

const S = AHS.LearningQuestionSession, F = AHS.QuestionGenerationFlow, G = AHS.LearningQuestionGenerator;
S.reset();

/* Seed the pipeline's real lineage: Material -> Knowledge -> Summary. */
const mat = AHS.MaterialRuntime.add({ title: "三角函數講義", subject: "math", grade: "高一", category: "講義", fileName: "trig.pdf", fileType: "PDF" });
const know = AHS.KnowledgeRuntime.add({
  materialId: mat.id, subject: "math", grade: "高一", chapter: "第三章", section: "第一節",
  title: "三角函數講義", concepts: [], structure: [], keywords: [], sourceInfo: { fileName: "trig.pdf", fileType: "PDF" }
});
const summary = AHS.SummaryRuntime.add({
  materialId: mat.id, subject: "math", grade: "高一", chapter: "第三章", section: "第一節",
  title: "三角函數講義",
  coreConcepts: ["正弦定理", "餘弦定理"],
  definitions: ["正弦：sinθ = 對邊/斜邊", "畢氏定理成立於直角三角形"],
  pitfalls: ["角度與弧度混用"],
  memorize: ["特殊角 30、45、60 度的三角函數值必須熟記"],
  reviewSuggestions: ["建議先複習直角三角形性質"]
});

console.log("\n[Question Generation QA] real summary -> Schema v1.0 questions");
check("invalid difficulty aborts (Ruling 2B: 不得推論/預設)",
  F.run(mat.id, undefined).status === "invalid_difficulty" && S.count() === 0);
const r = F.run(mat.id, "medium");
check("run status ok", r.status === "ok");
check("每一個 Knowledge Point 至少一題（6 KP -> 6 題）", r.generated === 6 && S.count() === 6);
const qs = S.list();
check("全部通過 Schema Validation", qs.every(q => G.validate(q).valid));
check("questionType 全為 snake_case 固定值",
  qs.every(q => G.QUESTION_TYPES.includes(q.questionType)));
check("型別對應：core→single_choice / def(term)→short_answer / def(敘述)→true_false / pitfall→true_false / memorize→fill_blank",
  qs.filter(q => q.questionType === "single_choice").length === 2 &&
  qs.filter(q => q.questionType === "short_answer").length === 1 &&
  qs.filter(q => q.questionType === "true_false").length === 2 &&
  qs.filter(q => q.questionType === "fill_blank").length === 1);
check("difficulty 全為呼叫端傳入值", qs.every(q => q.difficulty === "medium"));
check("Answer / Explanation / KnowledgePoint 全不為空",
  qs.every(q => String(q.answer).trim() && q.explanation.trim() && q.knowledgePoint.trim()));
check("Traceability 完整（materialId + knowledgeId + summaryId 真實對應）",
  qs.every(q => q.traceability.materialId === mat.id && q.traceability.knowledgeId === know.id && q.traceability.summaryId === summary.id));
check("題目內容 100% 來自 Summary（fill_blank 答案為原句片段）",
  (() => { const fb = qs.find(q => q.questionType === "fill_blank");
           return fb && "特殊角 30、45、60 度的三角函數值必須熟記".includes(fb.answer); })());
check("無 Mock / Stub / Placeholder / Lorem",
  qs.every(q => !/\[Stub\]|Mock|Placeholder|Lorem/i.test(q.question + q.answer + q.explanation)));
check("reviewSuggestions 不產題（非知識點）",
  qs.every(q => !q.question.includes("建議先複習直角三角形性質")));

console.log("\n[Session QA] dedupe + gates + isolation");
const r2 = F.run(mat.id, "medium");
check("重跑同難度全數 dedupe skip，零重複", r2.generated === 0 && r2.skipped === 6 && S.count() === 6);
check("不同難度為新題（呼叫端明確參數）", F.run(mat.id, "hard").generated === 6 && S.count() === 12);
check("LearningQuestionRuntime 零寫入（不得直接寫入 Practice Runtime）",
  AHS.LearningQuestionRuntime.list().length === 0);
check("Session status = ready", S.getStatus() === "ready");

console.log("\n[Pipeline QA] empty / missing summary");
const mat2 = AHS.MaterialRuntime.add({ title: "空白教材", subject: "english", grade: "高一", category: "講義", fileName: "e.pdf", fileType: "PDF" });
AHS.KnowledgeRuntime.add({ materialId: mat2.id, subject: "english", grade: "高一", chapter: "", section: "", title: "空白教材", concepts: [], structure: [], keywords: [], sourceInfo: {} });
AHS.SummaryRuntime.add({ materialId: mat2.id, subject: "english", grade: "高一", chapter: "", section: "", title: "空白教材",
  coreConcepts: [], definitions: [], pitfalls: [], memorize: [], reviewSuggestions: [] });
const rEmpty = F.run(mat2.id, "easy");
check("Summary 尚未完成（五段空）→ status no_content、零題、零假資料",
  rEmpty.status === "no_content" && rEmpty.generated === 0 && S.findByMaterialId(mat2.id).length === 0);
check("無 Summary 記錄 → status no_summary、零題",
  F.run("rt_nonexistent", "easy").status === "no_summary" && S.count() === 12);

console.log("\nQuestionGenerationFlow: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
