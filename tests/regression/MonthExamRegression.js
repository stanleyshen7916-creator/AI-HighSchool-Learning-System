/* tests/regression/MonthExamRegression.js — 模擬月考專區（2026-10-05）出題與計時規則。
   純 Node：以假資料載入 js/runtime/MonthExamRuntime.js。 */
"use strict";
const path = require("path");
const REPO = path.resolve(__dirname, "../..");
let pass = 0, fail = 0;
function check(name, ok) { if (ok) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); } }

const mem = {};
global.window = global;
global.AHS = {
  PersistenceAdapter: { save: (k, v) => { mem[k] = JSON.parse(JSON.stringify(v)); }, load: (k) => (k in mem ? mem[k] : null) },
  WorkspaceRuntime: { getCurrent: () => ({ studentId: "s", schoolId: "zwsh", semesterIds: ["g2s1"] }) }
};
const synced = [];
AHS.WrongBookRuntime = { sync: (g) => synced.push(g) };

function q(mid, n, extra) {
  return Object.assign({ id: mid + "_q" + n, questionNumber: String(n), type: "single_choice",
    question: "Q" + n, options: ["A" + n, "B" + n, "C" + n, "D" + n], answer: "A" + n, explanation: "E" + n }, extra || {});
}
const mathQs = [];
for (let i = 1; i <= 40; i++) mathQs.push(q("tm_90", i));
for (let g = 0; g < 3; g++) for (let k = 0; k < 4; k++) {
  const n = 100 + g * 10 + k;
  mathQs.push(q("tm_90", n, { section: "單元練習（" + (100 + g * 10) + "-" + (103 + g * 10) + "題組）" }));
}
const chemQs = []; for (let i = 1; i <= 70; i++) chemQs.push(q("tm_91", i));
const smallQs = []; for (let i = 1; i <= 7; i++) smallQs.push(q("tm_92", i));
smallQs.push(Object.assign(q("tm_92", 8), { type: "short_answer" }));
AHS.TeachingMaterialData = [
  { materialId: "tm_90", material: { subject: "數學", school: "zwsh", semester: "g2s1", chapter: "第一章" }, questions: mathQs },
  { materialId: "tm_91", material: { subject: "化學", school: "zwsh", semester: "g2s1", chapter: "第三章" }, questions: chemQs },
  { materialId: "tm_92", material: { subject: "歷史", school: "zwsh", semester: "g2s1", chapter: "第一章" }, questions: smallQs },
  { materialId: "tm_93", material: { subject: "化學", school: "cjsh", semester: "g2s1", chapter: "別校" }, questions: chemQs }
];
AHS.MonthExamConfig = { ranges: { "zwsh|g2s1": { "化學": ["tm_91"] } } };
require(path.join(REPO, "js/runtime/MonthExamRuntime.js"));
const RT = AHS.MonthExamRuntime;

console.log("\n[1] 科目與範圍");
const subjects = RT.listSubjects().map((s) => s.subject).sort();
check("只列出目前學校／學期的科目", JSON.stringify(subjects) === JSON.stringify(["化學", "數學", "歷史"]));
check("有管理者預設時用預設範圍", RT.getRange("化學").source === "admin");
RT.setRange("歷史", ["tm_92"]);
check("學生自行調整的範圍優先", RT.getRange("歷史").source === "student");
check("都沒有時為全部教材", RT.getRange("數學").source === "all");

console.log("\n[2] 出題規則");
for (let t = 0; t < 30; t++) {
  const paper = RT.buildPaper("數學", ["tm_90"]);
  const singles = paper.questions.filter((x) => !RT.groupKeyOf(x)).length;
  const groupIds = paper.questions.filter((x) => RT.groupKeyOf(x)).map((x) => RT.groupKeyOf(x));
  const contiguous = groupIds.every((k) => {
    const idx = paper.questions.map((x, i) => (RT.groupKeyOf(x) === k ? i : -1)).filter((i) => i >= 0);
    return idx.length === 4 && idx[3] - idx[0] === 3;
  });
  if (!(singles <= 30 && paper.questions.length <= 50 && contiguous && singles === 30)) {
    check("數學：單題 30 題、題組整組連續、總數 ≤ 50（第 " + t + " 次）", false); break;
  }
  if (t === 29) check("數學：單題 30 題、題組整組連續、總數 ≤ 50（30 次隨機）", true);
}
const chem = RT.buildPaper("化學", ["tm_91"]);
check("其他科：50 題", chem.questions.length === 50);
const a = RT.buildPaper("化學", ["tm_91"]).questions.map((x) => x.id).join();
const b = RT.buildPaper("化學", ["tm_91"]).questions.map((x) => x.id).join();
check("每次重新隨機出題", a !== b);
const small = RT.buildPaper("歷史", ["tm_92"]);
check("題庫不足時全部出題、只收選擇題", small.questions.length === 7 && small.poolSize === 7);

console.log("\n[3] 計時與批改");
const t0 = 1_000_000;
const s = RT.start("化學", ["tm_91"], { now: t0 });
check("開始作答：50 題、60 分鐘", s.items.length === 50 && s.durationMs === 60 * 60 * 1000);
const first = RT.findQuestion(s.items[0].qid);
check("時間內可以作答", RT.answer(first.id, first.answer, t0 + 1000));
check("時間到不得再作答", RT.answer(first.id, "x", t0 + 60 * 60 * 1000) === false);
check("時間未到不會自動交卷", RT.settleExpired(t0 + 10) === null && RT.active() !== null);
const r = RT.settleExpired(t0 + 60 * 60 * 1000 + 1);
check("時間到自動交卷，未作答視為答錯", r && r.timedOut && r.correct === 1 && r.unanswered === 49 && r.total === 50);
check("分數以題數平分（1/50 = 2 分）", r.score === 2);
check("交卷後清除進行中的考卷並留下紀錄", RT.active() === null && RT.history().length === 1);
check("錯題（含未作答）加入知識弱點", synced.length === 1 && synced[0].wrong.length === 49 && synced[0].wrong[0].yourAnswer === "（未作答）");

console.log("\n[4] 2026-10-09 只收單選與多選題（不收是非題），多選全對才得分");
{
  const tf = { id: "tm_94_q1", type: "true_false", question: "TF", options: ["正確", "錯誤"], answer: "正確" };
  const multi = { id: "tm_94_q2", type: "single_choice", question: "【多選題】M", options: ["(A) a", "(B) b", "(C) c", "(D) d"], answer: "(B)(D)" };
  const letter = { id: "tm_94_q3", type: "single_choice", question: "L", options: ["(A) a", "(B) b", "(C) c"], answer: "(C)" };
  const broken = { id: "tm_94_q4", type: "single_choice", question: "X", options: ["(A) a", "(B) b"], answer: "(B)(E)" };
  check("不收是非題", RT.usable(tf) === false);
  check("收多選題、答案只寫代號的單選題", RT.usable(multi) && RT.usable(letter));
  check("答案對不上選項的題目不收", RT.usable(broken) === false);
  AHS.TeachingMaterialData.push({ materialId: "tm_94", material: { subject: "生物", school: "zwsh", semester: "g2s1", chapter: "x" }, questions: [tf, multi, letter, broken] });
  const t1 = 9000000;
  const s2 = RT.start("生物", ["tm_94"], { now: t1 });
  check("試卷只有 2 題（多選＋單選），選項自帶代號不打亂", s2.items.length === 2 &&
    s2.items.every((it) => it.order.join() === RT.findQuestion(it.qid).options.map((_, i) => i).join()));
  RT.answer("tm_94_q2", "(B) b", t1 + 1); RT.answer("tm_94_q2", "(A) a", t1 + 2); RT.answer("tm_94_q2", "(A) a", t1 + 3); RT.answer("tm_94_q2", "(D) d", t1 + 4);
  check("多選題可複選、再點一次取消", JSON.stringify(RT.active().answers.tm_94_q2) === JSON.stringify(["(B) b", "(D) d"]));
  RT.answer("tm_94_q3", "(C) c", t1 + 5);
  const r2 = RT.submit({ now: t1 + 10 });
  const rm = r2.rows.find((x) => x.qid === "tm_94_q2");
  check("多選全對得分；答案以 (B)(D) 呈現", r2.correct === 2 && rm.correct && rm.answer === "(B)(D)" && rm.given === "(B)(D)");
  RT.start("生物", ["tm_94"], { now: t1 + 100 });
  RT.answer("tm_94_q2", "(B) b", t1 + 101);
  const r3 = RT.submit({ now: t1 + 110 });
  const wm = r3.rows.find((x) => x.qid === "tm_94_q2");
  check("少選一個算錯；知識弱點紀錄代號 B／BD（重做時可比對）", !wm.correct && wm.given === "(B)" && wm.answer === "(B)(D)" &&
    synced[synced.length - 1].wrong.some((w) => w.questionId === "tm_94_q2" && w.correctAnswer === "BD" && w.yourAnswer === "B"));
}

console.log("\n[5] 2026-10-09 也收舊版教材庫（國文、英文）的單選題");
{
  AHS.Subjects = { chinese: { name: "國文" } };
  const recs = [{ id: "chinese-l1", metadata: { subject: "chinese", workspaceSchool: "zwsh", workspaceSemester: "g2s1", chapter: "第一課", unit: "勞山道士" },
    questionBank: { singleChoice: [
      { id: "chinese-l1-q1", text: "C1", options: [{ key: "A", text: "甲" }, { key: "B", text: "乙" }], correctAnswer: "B", explanation: "e" },
      { id: "chinese-l1-q2", text: "C2", options: [{ key: "A", text: "甲" }], correctAnswer: "Z" }] } },
    { id: "other-school", metadata: { subject: "chinese", workspaceSchool: "cjsh", workspaceSemester: "g2s1", chapter: "x" },
      questionBank: { singleChoice: [{ id: "o1", text: "O", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "A" }] } }];
  AHS.MaterialRepository = { list: () => JSON.parse(JSON.stringify(recs)) };
  const zh = RT.listSubjects().filter((x) => x.subject === "國文")[0];
  check("國文出現在科目清單（只算目前學校、答案對得上的題目）", zh && zh.materials.length === 1 && zh.materials[0].materialId === "repo:chinese-l1" && zh.materials[0].count === 1);
  const t2 = 20000000;
  const s3 = RT.start("國文", ["repo:chinese-l1"], { now: t2 });
  const fq = RT.findQuestion("chinese-l1-q1");
  check("選項轉成文字、正確答案轉成選項文字", s3.items.length === 1 && fq && fq.answer === "乙" && fq.options.join() === "甲,乙");
  RT.answer("chinese-l1-q1", "乙", t2 + 1);
  const r4 = RT.submit({ now: t2 + 2 });
  check("可作答與批改", r4.correct === 1 && r4.total === 1);
}

console.log("\nMonthExamRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
