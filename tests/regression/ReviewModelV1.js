/* tests/regression/ReviewModelV1.js — EO-S7.0-003 Review Runtime QA.
   Run: node tests/regression/ReviewModelV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/KnowledgeRuntime.js",
 "js/runtime/SummaryRuntime.js","js/parser/LearningQuestionGenerator.js","js/runtime/LearningQuestionSession.js",
 "js/parser/QuestionGenerationFlow.js","js/parser/WrongBookGenerator.js","js/runtime/WrongBookSession.js",
 "js/runtime/ReviewQueue.js","js/runtime/ReviewModel.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const S = AHS.LearningQuestionSession, WB = AHS.WrongBookSession, RQ = AHS.ReviewQueue, RM = AHS.ReviewModel;
S.reset(); WB.reset(); RQ.reset();
const mat = AHS.MaterialRuntime.add({ title: "教材A", subject: "math", grade: "高一", category: "講義", fileName: "a.pdf", fileType: "PDF" });
AHS.KnowledgeRuntime.add({ materialId: mat.id, subject: "math", grade: "高一", chapter: "C1", section: "S1", title: "教材A", concepts: [], structure: [], keywords: [], sourceInfo: {} });
AHS.SummaryRuntime.add({ materialId: mat.id, subject: "math", grade: "高一", chapter: "C1", section: "S1", title: "教材A",
  coreConcepts: ["概念一", "概念二"], definitions: [], pitfalls: [], memorize: [], reviewSuggestions: [] });
AHS.QuestionGenerationFlow.run(mat.id, "easy");
const [q1, q2] = S.list();
AHS.WrongBookGenerator.add({ questionId: q1.id, userAnswer: "重要定義" });
AHS.WrongBookGenerator.add({ questionId: q2.id, userAnswer: "必背內容" });
AHS.ReviewQueue.enqueue({ questionId: q1.id, masteryLevel: "new", priority: 1, nextReviewAt: null });
AHS.ReviewQueue.enqueue({ questionId: q2.id, masteryLevel: "new", priority: 1, nextReviewAt: null });

console.log("[Today/Due — nextReviewAt=null 全數排除，等待 Scheduler]");
check("getTodayReview() = 0（null 不得列入）", RM.getTodayReview().length === 0);
check("getDueReview() = 0", RM.getDueReview().length === 0);
check("getReviewProgress() = {todayDue:0, completed:0, totalWrong:2}",
  JSON.stringify(RM.getReviewProgress()) === JSON.stringify({ todayDue: 0, completed: 0, totalWrong: 2 }));

console.log("[setNextReview — Scheduler Foundation interface（僅手動）]");
const past = "2026-07-20T00:00:00.000Z", future = "2099-01-01T00:00:00.000Z";
const u1 = RM.setNextReview(q1.id, past);
const u2 = RM.setNextReview(q2.id, future);
check("setNextReview 經 Interface 寫入（record.nextReviewAt 更新）", u1.nextReviewAt === past && u2.nextReviewAt === future);
check("Today Review 僅含 <= today 者", RM.getTodayReview().length === 1 && RM.getTodayReview()[0].queue.questionId === q1.id);
check("Due Review 依 nextReviewAt ASC 排序", (() => { const d = RM.getDueReview();
  return d.length === 2 && d[0].queue.questionId === q1.id && d[1].queue.questionId === q2.id; })());
check("setNextReview 不存在題目 → null", RM.setNextReview("q_fake", past) === null);

console.log("[Mastery Progress — 即時推導]");
check("getMasteryStatistics 初始 {new:2,...}", JSON.stringify(RM.getMasteryStatistics()) === JSON.stringify({ "new": 2, learning: 0, reviewing: 0, mastered: 0 }));
const rec1 = WB.getByQuestionId(q1.id);
AHS.WrongBookGenerator.update(rec1.id, { masteryLevel: "mastered" });
check("升級後即時反映 + completed 計數", RM.getMasteryStatistics().mastered === 1 && RM.getReviewProgress().completed === 1);
check("ReviewModel 無任何寫入 Session 之方法（唯讀，setNextReview 除外且經 Interface）",
  ["add","store","remove","reset","update"].every(k => !(k in RM)));
console.log("ReviewModelV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
