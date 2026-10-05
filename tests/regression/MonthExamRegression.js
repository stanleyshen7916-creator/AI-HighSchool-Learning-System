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

console.log("\nMonthExamRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
