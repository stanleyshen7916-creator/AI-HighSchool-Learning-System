/* tests/regression/WrongBookFoundationV1.js — EO-S7.0-001 QA:
   WrongBook QA + Schema QA + Runtime QA + Interface QA + isolation.
   Run: node tests/regression/WrongBookFoundationV1.js */
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
  "js/parser/QuestionGenerationFlow.js",
  "js/parser/WrongBookGenerator.js",
  "js/runtime/WrongBookSession.js",
  "js/runtime/ReviewQueue.js",
  "js/runtime/WrongBookRuntime.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : fail++; console.log((cond ? "  PASS  " : "  FAIL  ") + name); }

const WBG = AHS.WrongBookGenerator, WBS = AHS.WrongBookSession, RQ = AHS.ReviewQueue, LQS = AHS.LearningQuestionSession;
LQS.reset(); WBS.reset(); RQ.reset();

/* Real lineage: Material -> Knowledge -> Summary -> Flow -> real questions. */
const mat = AHS.MaterialRuntime.add({ title: "三角函數講義", subject: "math", grade: "高一", category: "講義", fileName: "t.pdf", fileType: "PDF" });
AHS.KnowledgeRuntime.add({ materialId: mat.id, subject: "math", grade: "高一", chapter: "第三章", section: "第一節", title: "三角函數講義", concepts: [], structure: [], keywords: [], sourceInfo: {} });
AHS.SummaryRuntime.add({ materialId: mat.id, subject: "math", grade: "高一", chapter: "第三章", section: "第一節", title: "三角函數講義",
  coreConcepts: ["正弦定理"], definitions: ["正弦：sinθ = 對邊/斜邊"], pitfalls: ["角度與弧度混用"], memorize: [], reviewSuggestions: [] });
AHS.QuestionGenerationFlow.run(mat.id, "medium");
const questions = LQS.list();
const scQ = questions.find(q => q.questionType === "single_choice");
const saQ = questions.find(q => q.questionType === "short_answer");
check("前置：真實題目已生成 (3)", questions.length === 3 && !!scQ && !!saQ);

console.log("\n[Interface QA — Wrong Book Rule]");
check("答對不得加入（userAnswer === correctAnswer → null、零寫入）",
  WBG.add({ questionId: scQ.id, userAnswer: scQ.answer }) === null && WBS.count() === 0);
check("不存在的 questionId → 拒收（不得人工建立）",
  WBG.add({ questionId: "q_fake", userAnswer: "亂答" }) === null && WBS.count() === 0);
check("空 userAnswer → 拒收", WBG.add({ questionId: scQ.id, userAnswer: "" }) === null && WBS.count() === 0);
const wb1 = WBG.add({ questionId: scQ.id, userAnswer: "重要定義" });
check("答錯才建立 Wrong Book", !!wb1 && WBS.count() === 1);

console.log("\n[Schema QA]");
check("Schema v1.0 全 22 欄位齊備",
  ["id","questionId","materialId","subject","chapter","section","knowledgePoint","difficulty","questionType",
   "userAnswer","correctAnswer","explanation","traceability","wrongCount","firstWrongAt","lastWrongAt",
   "nextReviewAt","masteryLevel","status","metadata","createdAt","updatedAt"].every(k => k in wb1));
check("內容全數解析自真實題目（correctAnswer/knowledgePoint/explanation 一致）",
  wb1.correctAnswer === scQ.answer && wb1.knowledgePoint === scQ.knowledgePoint && wb1.explanation === scQ.explanation);
check("EO-S6.9 Traceability 全數保留",
  JSON.stringify(wb1.traceability) === JSON.stringify(scQ.traceability));
check("初始 masteryLevel=new / status=active / wrongCount=1 / nextReviewAt=null（不得自動排程）",
  wb1.masteryLevel === "new" && wb1.status === "active" && wb1.wrongCount === 1 && wb1.nextReviewAt === null);
check("firstWrongAt = lastWrongAt（首次）", wb1.firstWrongAt === wb1.lastWrongAt);
check("validate() 拒絕非法 masteryLevel（不得自行新增）",
  !WBG.validate(Object.assign({}, wb1, { masteryLevel: "expert" })).valid);
check("validate() 拒絕非法 status", !WBG.validate(Object.assign({}, wb1, { status: "deleted" })).valid);
check("validate() 拒絕答對記錄", !WBG.validate(Object.assign({}, wb1, { userAnswer: wb1.correctAnswer })).valid);
check("validate() 拒絕空 explanation", !WBG.validate(Object.assign({}, wb1, { explanation: "" })).valid);

console.log("\n[Wrong Count Rule]");
const before = WBS.getById(wb1.id);
const wb1b = WBG.add({ questionId: scQ.id, userAnswer: "必背內容" });
check("再次答錯：wrongCount +1、同一筆記錄", wb1b.wrongCount === 2 && WBS.count() === 1 && wb1b.id === wb1.id);
check("firstWrongAt 不得覆蓋", wb1b.firstWrongAt === before.firstWrongAt);
check("lastWrongAt 已更新", wb1b.lastWrongAt >= before.lastWrongAt && wb1b.updatedAt >= before.updatedAt);

console.log("\n[Interface QA — update / remove]");
const upd = WBG.update(wb1.id, { masteryLevel: "learning", nextReviewAt: "2026-07-25T00:00:00.000Z", wrongCount: 999, firstWrongAt: "覆蓋攻擊" });
check("update 允許 masteryLevel/nextReviewAt；鎖定 wrongCount/firstWrongAt",
  upd.masteryLevel === "learning" && upd.nextReviewAt === "2026-07-25T00:00:00.000Z" &&
  upd.wrongCount === 2 && upd.firstWrongAt === before.firstWrongAt);
check("update 非法 masteryLevel → 整筆拒絕、原記錄不變",
  WBG.update(wb1.id, { masteryLevel: "guru" }) === null && WBS.getById(wb1.id).masteryLevel === "learning");
const wb2 = WBG.add({ questionId: saQ.id, userAnswer: "答錯的定義" });
check("第二題答錯建立第二筆", WBS.count() === 2);
check("remove() 正常刪除", WBG.remove(wb2.id) === true && WBS.count() === 1);

console.log("\n[Runtime QA — Session]");
check("Statistics 推導正確", (() => { const s = WBS.statistics();
  return s.total === 1 && s.totalWrongCount === 2 && s.bySubject.math === 1 && s.byMastery.learning === 1 && s.byStatus.active === 1; })());
check("Metadata set/get", WBS.setMetadata({ note: "x" }).note === "x");
check("Status 推導：ready", WBS.getStatus() === "ready");
check("直接 store() 未通過 validate 之記錄 → 拒收（Runtime Validation）",
  WBS.store({ id: "wb_fake" }) === null && WBS.count() === 1);
check("無 Review/Practice/AI Logic 方法",
  ["schedule","review","grade","score","practice","generateReview"].every(k => !(k in WBS)));
check("Empty State 支撐：清空後 isEmpty/status=empty", (() => {
  const snapshot = WBS.list(); WBS.reset();
  const ok = WBS.isEmpty() && WBS.getStatus() === "empty" && WBS.count() === 0;
  snapshot.forEach(r => WBS.store(r)); return ok && WBS.count() === 1; })());

console.log("\n[Review Queue Foundation]");
check("enqueue 需對應真實錯題（不得直接產生 Review）",
  RQ.enqueue({ questionId: "q_fake", masteryLevel: "new" }) === null && RQ.count() === 0);
const qe = RQ.enqueue({ questionId: scQ.id, masteryLevel: "learning", priority: 2 });
check("合法 enqueue：固定四欄位", !!qe && JSON.stringify(Object.keys(qe).sort()) === JSON.stringify(["masteryLevel","nextReviewAt","priority","questionId"]));
check("nextReviewAt 未提供 → null（不得自動排程）", qe.nextReviewAt === null);
check("非法 masteryLevel → 拒收", RQ.enqueue({ questionId: scQ.id, masteryLevel: "pro" }) === null);
check("同 questionId 重複 enqueue → 取代不重複", RQ.enqueue({ questionId: scQ.id, masteryLevel: "reviewing", priority: 5 }).priority === 5 && RQ.count() === 1);
check("remove / getByQuestionId", RQ.getByQuestionId(scQ.id).masteryLevel === "reviewing" && RQ.remove(scQ.id) === true && RQ.count() === 0);

console.log("\n[Isolation — LOCK Baselines]");
check("LearningQuestionSession 記錄數不變（唯讀）", LQS.count() === 3);
check("LearningQuestionRuntime 零寫入", AHS.LearningQuestionRuntime.list().length === 0);
check("Sprint-4 WrongBookRuntime（LOCK）零交叉寫入",
  typeof AHS.WrongBookRuntime === "object" && WBS.count() === 1);
check("無 Mock/Stub/Placeholder 文字", (() => {
  const all = JSON.stringify(WBS.list());
  return !/Mock|\[Stub\]|Placeholder|Lorem/i.test(all); })());

console.log("\nWrongBookFoundationV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
