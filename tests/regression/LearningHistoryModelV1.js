/* tests/regression/LearningHistoryModelV1.js — Sprint AI-019 QA.
   Verifies the LearningHistoryModel Projection: real WrongBookSession/
   ReviewQueue sourcing, material/review identity + traceability
   preservation, StatisticsRuntime-compatible refresh() shape, read-only
   (no write path), and forbidden-dependency source-scan (no new Runtime,
   no HistoryRuntime/QuestionGenerationRuntime coupling).
   Run: node tests/regression/LearningHistoryModelV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/KnowledgeRuntime.js",
 "js/runtime/SummaryRuntime.js","js/parser/LearningQuestionGenerator.js","js/runtime/LearningQuestionSession.js",
 "js/parser/QuestionGenerationFlow.js","js/parser/WrongBookGenerator.js","js/runtime/WrongBookSession.js",
 "js/runtime/ReviewQueue.js","js/runtime/ReviewModel.js","js/runtime/LearningHistoryModel.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const S = AHS.LearningQuestionSession, WB = AHS.WrongBookSession, RQ = AHS.ReviewQueue,
      RM = AHS.ReviewModel, LH = AHS.LearningHistoryModel;
S.reset(); WB.reset(); RQ.reset();

/* Real chain: two materials, two subjects, real Session/WrongBook/Queue records. */
const mat1 = AHS.MaterialRuntime.add({ title: "教材A", subject: "math", grade: "高一", category: "講義", fileName: "a.pdf", fileType: "PDF" });
const mat2 = AHS.MaterialRuntime.add({ title: "教材B", subject: "english", grade: "高一", category: "講義", fileName: "b.pdf", fileType: "PDF" });
AHS.KnowledgeRuntime.add({ materialId: mat1.id, subject: "math", grade: "高一", chapter: "C1", section: "S1", title: "教材A", concepts: [], structure: [], keywords: [], sourceInfo: {} });
AHS.KnowledgeRuntime.add({ materialId: mat2.id, subject: "english", grade: "高一", chapter: "C1", section: "S1", title: "教材B", concepts: [], structure: [], keywords: [], sourceInfo: {} });
AHS.SummaryRuntime.add({ materialId: mat1.id, subject: "math", grade: "高一", chapter: "C1", section: "S1", title: "教材A",
  coreConcepts: ["概念一", "概念二"], definitions: [], pitfalls: [], memorize: [], reviewSuggestions: [] });
AHS.SummaryRuntime.add({ materialId: mat2.id, subject: "english", grade: "高一", chapter: "C1", section: "S1", title: "教材B",
  coreConcepts: ["概念三"], definitions: [], pitfalls: [], memorize: [], reviewSuggestions: [] });
AHS.QuestionGenerationFlow.run(mat1.id, "easy");
AHS.QuestionGenerationFlow.run(mat2.id, "easy");
const mat1Questions = S.list().filter(q => q.materialId === mat1.id);
const mat2Questions = S.list().filter(q => q.materialId === mat2.id);
const [q1, q2] = mat1Questions;
const [q3] = mat2Questions;

AHS.WrongBookGenerator.add({ questionId: q1.id, userAnswer: "錯誤答案1" });
AHS.WrongBookGenerator.add({ questionId: q2.id, userAnswer: "錯誤答案2" });
AHS.WrongBookGenerator.add({ questionId: q3.id, userAnswer: "錯誤答案3" });
RQ.enqueue({ questionId: q1.id, masteryLevel: "new", priority: 1, nextReviewAt: null });
RQ.enqueue({ questionId: q2.id, masteryLevel: "new", priority: 1, nextReviewAt: null });
/* q3 deliberately left out of ReviewQueue — tests review==null honesty. */

console.log("\n[API — 四個公開 API，不得新增其他]");
["list", "masteryRateBySubject", "getSubject", "refresh"].forEach(fn =>
  check("提供 " + fn + "()", typeof LH[fn] === "function"));
check("公開成員僅四個 API", JSON.stringify(Object.keys(LH).sort()) ===
  JSON.stringify(["getSubject", "list", "masteryRateBySubject", "refresh"]));

console.log("\n[list() — 材料/複習身分與 Traceability 保留]");
check("list() 回傳全部三筆真實記錄", LH.list().length === 3);
check("list(materialId) 正確篩選（教材A 兩筆）", LH.list(mat1.id).length === 2);
check("list(materialId) 正確篩選（教材B 一筆）", LH.list(mat2.id).length === 1);
const entry1 = LH.list(mat1.id).find(e => e.questionId === q1.id);
check("每筆保留真實 materialId", entry1.materialId === mat1.id);
check("每筆保留真實 questionId（複習身分）", entry1.questionId === q1.id);
check("每筆保留真實 traceability（逐字取自 WrongBookSession，未改寫）",
  JSON.stringify(entry1.traceability) === JSON.stringify(WB.getByQuestionId(q1.id).traceability));
check("每筆保留真實 wrongCount / masteryLevel / firstWrongAt / lastWrongAt",
  entry1.wrongCount === 1 && entry1.masteryLevel === "new" && !!entry1.firstWrongAt && !!entry1.lastWrongAt);
check("有 ReviewQueue 對應者，review 欄位為真實 priority/nextReviewAt/masteryLevel",
  entry1.review && entry1.review.priority === 1 && entry1.review.masteryLevel === "new");
const entry3 = LH.list(mat2.id)[0];
check("無 ReviewQueue 對應者，review 誠實為 null（不虛構）", entry3.review === null);

console.log("\n[masteryRateBySubject() / getSubject() — StatisticsRuntime 相同輸出形狀]");
const rates = LH.masteryRateBySubject();
check("每個真實出現過的 subject 皆有一筆", rates.length === 2 &&
  rates.some(r => r.subject === "math") && rates.some(r => r.subject === "english"));
check("升級前 math 精熟率為 0%", LH.getSubject("math").percent === 0);
AHS.WrongBookGenerator.update(WB.getByQuestionId(q1.id).id, { masteryLevel: "mastered" });
check("升級後 math 精熟率即時反映（1/2 = 50%）", LH.getSubject("math").percent === 50);
check("getSubject 未知科目 → null", LH.getSubject("civics") === null);

console.log("\n[refresh() — 與 StatisticsRuntime.refresh() 相同輸出形狀]");
const r = LH.refresh();
check("頂層欄位恰為 stats / accuracyByStudy", JSON.stringify(Object.keys(r).sort()) === JSON.stringify(["accuracyByStudy", "stats"]));
check("stats 為 4 筆，每筆恰有 icon/label/value/unit/delta",
  r.stats.length === 4 && r.stats.every(s => JSON.stringify(Object.keys(s).sort()) === JSON.stringify(["delta", "icon", "label", "unit", "value"])));
check("練習答錯題數統計正確（3 次真實答錯）", r.stats.find(s => s.label === "練習答錯題數").value === "3");
check("已精熟題數統計正確（1 題已 mastered）", r.stats.find(s => s.label === "已精熟題數").value === "1");
check("練習錯題總數統計正確（3 筆真實錯題記錄）", r.stats.find(s => s.label === "練習錯題總數").value === "3");
check("accuracyByStudy 與 masteryRateBySubject() 一致", JSON.stringify(r.accuracyByStudy) === JSON.stringify(LH.masteryRateBySubject()));

console.log("\n[唯讀確認 — 無任何寫入路徑]");
check("無 add/store/remove/reset/update 方法（純唯讀 Projection）",
  ["add", "store", "remove", "reset", "update", "sync"].every(k => !(k in LH)));

console.log("\n[Forbidden Dependencies — 未依賴之項目]");
const code = fs.readFileSync(path.join(ROOT, "js/runtime/LearningHistoryModel.js"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
["HistoryRuntime", "StatisticsRuntime", "QuestionGenerationRuntime", "KnowledgeGraphRuntime",
 "MaterialRuntime", "AnalysisRuntime", "SummaryRuntime", "QuestionProviderBridge"].forEach(m => {
  check("未依賴 " + m + "（不修改、不耦合既有 Runtime）", code.indexOf("AHS." + m) === -1);
});
check("唯一來源為 WrongBookSession 與 ReviewQueue/ReviewModel 之公開讀取 API",
  /AHS\.WrongBookSession/.test(code) && /AHS\.ReviewQueue/.test(code) && /AHS\.ReviewModel/.test(code));
check("未寫入 WrongBookSession（唯讀消費）",
  !/WrongBookSession\.(store|removeById|setMetadata|reset)/.test(code) && code.indexOf("AHS.WrongBookGenerator") === -1);
check("未寫入 ReviewQueue（唯讀消費）", code.indexOf(".enqueue(") === -1 && code.indexOf(".remove(") === -1);

console.log("\n[Runtime — Memory Only]");
check("原始碼零 localStorage / sessionStorage / IndexedDB / PersistenceAdapter（無自身持久化）",
  !/localStorage|sessionStorage|indexedDB|PersistenceAdapter/i.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));

console.log("\n[誠實空狀態 — 無真實資料時不虛構]");
WB.reset(); RQ.reset();
check("無 WrongBook 記錄 → list() 空陣列", LH.list().length === 0);
check("無 WrongBook 記錄 → masteryRateBySubject() 空陣列", LH.masteryRateBySubject().length === 0);
check("無 WrongBook 記錄 → refresh() 統計皆為 0（誠實，非虛構）",
  LH.refresh().stats.every(s => s.value === "0"));

console.log("\nLearningHistoryModelV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
