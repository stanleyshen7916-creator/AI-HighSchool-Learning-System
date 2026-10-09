/* tests/regression/MonthExamCloudRegression.js — 2026-10-09（PO 回報：長榮中學
   模擬月考實測後，錯題與成績沒有存到雲端）.

   Zero network calls: AHS.SyncBridge / AHS.RepositoryFactory are recording fakes.

   Verifies:
   [1] 知識弱點：本機舊紀錄的科目若是中文名稱（「數學」），載入時改成代號
       （"math"），從沒上傳過的在下一次雲端同步時補傳；遠端已有同一題（local_
       question_id）時認領，不重複建立。
   [2] 知識點熟練度：同樣把中文科目改成代號並重新上傳。
   [3] 模擬月考：交卷後錯題、熟練度用科目代號；成績寫入 month_exam_results；
       頁面載入時撈回其他裝置的成績，並補傳本機還沒上傳的紀錄。

   Run: node tests/regression/MonthExamCloudRegression.js */
"use strict";
const path = require("path");
const REPO = path.join(__dirname, "..", "..");

const memoryStore = {};
global.window = global;
window.sessionStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null),
  setItem: (k, v) => { memoryStore[k] = String(v); },
  removeItem: (k) => { delete memoryStore[k]; }
};
require(path.join(REPO, "js/core/PersistenceAdapter.js"));
AHS.Subjects = { math: { name: "數學" }, chinese: { name: "國文" } };

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); }
}

let pushes = [];
const writes = [];
const subjectCodes = [];
const remote = { wrong_book: [], knowledge_mastery: [], month_exam_results: [] };
AHS.SyncBridge = {
  isConfigured: () => true,
  identity: () => ({ userId: "u1", studentProfileId: "p1" }),
  subjectIdFor: (code) => { subjectCodes.push(code); return Promise.resolve(AHS.Subjects[code] ? "sid-" + code : null); },
  subjectCodeFor: () => Promise.resolve(null),
  pushFireAndForget: (factory) => { pushes.push(factory()); }
};
AHS.RepositoryFactory = {
  create: () => ({
    read: (table) => Promise.resolve({ data: remote[table] || [], error: null }),
    insert: (table, row) => { writes.push({ table, op: "insert", row }); return Promise.resolve({ data: [Object.assign({ id: "new-" + writes.length }, row)], error: null }); },
    update: (table, query, row) => { writes.push({ table, op: "update", row }); return Promise.resolve({ data: [row], error: null }); }
  })
};
async function settle() {
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 0));
    const pending = pushes; pushes = [];
    await Promise.all(pending);
  }
}

/* Old local records written before the fix (subject = Chinese name, never pushed). */
AHS.PersistenceAdapter.save("wrongBookRuntime", { seq: 2, items: [
  { id: "wb_1", questionId: "tm_57_q1", subject: "數學", title: "模擬月考", knowledgePoint: "弧度", question: "Q1", yourAnswer: "A", correctAnswer: "B", errorCount: 1, correctStreak: 0, lastError: "2026/10/09", firstError: "2026/10/09" },
  { id: "wb_2", questionId: "tm_57_q2", subject: "數學", title: "模擬月考", knowledgePoint: "弧度", question: "Q2", yourAnswer: "A", correctAnswer: "C", errorCount: 1, correctStreak: 0, lastError: "2026/10/09", firstError: "2026/10/09" }
] });
AHS.PersistenceAdapter.save("knowledgeMasteryRuntime", { points: { "弧度": { subject: "數學", materialId: "tm_57", attempts: [{ correct: false, day: "2026/10/09", ts: "2026-10-09T01:00:00.000Z" }] } } });
require(path.join(REPO, "js/runtime/WrongBookRuntime.js"));
require(path.join(REPO, "js/runtime/KnowledgeMasteryRuntime.js"));

async function main() {
  console.log("Month Exam Cloud Regression");

  console.log("\n[1] 知識弱點：中文科目改代號、補傳、不重複");
  const wb = AHS.WrongBookRuntime;
  check("載入時科目改成代號 math", wb.list().every((i) => i.subject === "math"));
  /* tm_57_q2 was already inserted by an earlier, interrupted push. */
  remote.wrong_book = [{ id: "remote-q2", local_question_id: "tm_57_q2", subject_id: "sid-math", knowledge_point: "弧度", question_text: "Q2", your_answer: "A", correct_answer: "C", error_count: 1, correct_streak: 0 }];
  const r1 = await wb.pullFromRepository();
  await settle();
  const inserts = writes.filter((w) => w.table === "wrong_book" && w.op === "insert");
  check("只補傳從沒上傳過的那一題（tm_57_q1），科目 id 正確", inserts.length === 1 && inserts[0].row.local_question_id === "tm_57_q1" && inserts[0].row.subject_id === "sid-math" && r1.repushed === 1);
  check("遠端已有的 tm_57_q2 認領成同一筆，不重複", wb.list().length === 2 && wb.list().filter((i) => i.questionId === "tm_57_q2")[0].supabaseId === "remote-q2");
  check("補傳後拿到 supabaseId，下次不再重傳", !!wb.list().filter((i) => i.questionId === "tm_57_q1")[0].supabaseId);

  console.log("\n[2] 知識點熟練度：中文科目改代號並重新上傳");
  const km = AHS.KnowledgeMasteryRuntime;
  const before = writes.length;
  const r2 = await km.pullFromRepository();
  await settle();
  const kmWrites = writes.slice(before).filter((w) => w.table === "knowledge_mastery");
  check("熟練度重新上傳，subject_id 有值", r2.repushed === 1 && kmWrites.length === 1 && kmWrites[0].row.subject_id === "sid-math");

  console.log("\n[3] 模擬月考：交卷用科目代號、成績上雲端、撈回與補傳");
  AHS.WorkspaceRuntime = { getCurrent: () => ({ studentId: "s", schoolId: "cjsh", semesterIds: ["g2s1"] }) };
  const qs = [];
  for (let i = 1; i <= 3; i++) { qs.push({ id: "tm_90_q" + i, type: "single_choice", question: "Q" + i, options: ["a" + i, "b" + i], answer: "a" + i, knowledgePoint: "kp" + i }); }
  AHS.TeachingMaterialData = [{ materialId: "tm_90", material: { subject: "數學", school: "cjsh", semester: "g2s1", chapter: "x" }, questions: qs }];
  require(path.join(REPO, "js/runtime/MonthExamRuntime.js"));
  const RT = AHS.MonthExamRuntime;
  const wbBefore = wb.list().length;
  RT.start("數學", ["tm_90"], { now: 1000 });
  RT.answer("tm_90_q1", "a1", 1001);
  RT.answer("tm_90_q2", "b2", 1002);
  const res = RT.submit({ now: 2000 });
  await settle();
  const newWrong = wb.list().slice(wbBefore);
  check("錯題存成科目代號 math", newWrong.length === 2 && newWrong.every((i) => i.subject === "math"));
  check("錯題上傳到 wrong_book", writes.filter((w) => w.table === "wrong_book" && w.op === "insert" && /^tm_90_/.test(w.row.local_question_id)).length === 2);
  const mx = writes.filter((w) => w.table === "month_exam_results");
  check("成績寫入 month_exam_results（代號、學校學期、逐題作答）", mx.length === 1 && mx[0].row.subject_code === "math" && mx[0].row.subject_name === "數學" &&
    mx[0].row.school_code === "cjsh" && mx[0].row.semester_code === "g2s1" && mx[0].row.local_id === res.id && mx[0].row.rows.length === 3 && mx[0].row.correct_count === 1);
  check("上傳成功後本機紀錄標記 synced", RT.history()[0].synced === true);

  /* Another device's paper is in the cloud; a local paper that never reached it. */
  const hist = AHS.PersistenceAdapter.load("monthexam:history");
  hist.push({ id: "me_local_old", subject: "國文", materialIds: [], startedAt: 500, submittedAt: 600, timedOut: false, total: 1, correct: 0, unanswered: 1, score: 0, rows: [] });
  AHS.PersistenceAdapter.save("monthexam:history", hist);
  remote.month_exam_results = [{ local_id: "me_other_device", subject_name: "英文", material_ids: ["tm_61"], started_at: "2026-10-09T02:00:00Z", submitted_at: "2026-10-09T03:00:00Z", timed_out: false, total: 50, correct_count: 40, unanswered: 0, score: 80, rows: [] },
    { local_id: res.id, subject_name: "數學", material_ids: ["tm_90"], started_at: new Date(1000).toISOString(), submitted_at: new Date(2000).toISOString(), total: 3, correct_count: 1, unanswered: 1, score: 33.3, rows: [] }];
  const mxBefore = writes.filter((w) => w.table === "month_exam_results").length;
  const r3 = await RT.pullFromRepository();
  await settle();
  const h = RT.history();
  check("撈回其他裝置的成績，不重複已有的那份", r3.pulled === 1 && h.filter((x) => x.id === "me_other_device").length === 1 && h.filter((x) => x.id === res.id).length === 1 && h[0].id === "me_other_device");
  const mxAfter = writes.filter((w) => w.table === "month_exam_results");
  check("補傳本機還沒上傳的舊紀錄", r3.repushed === 1 && mxAfter.length === mxBefore + 1 && mxAfter[mxAfter.length - 1].row.local_id === "me_local_old" && mxAfter[mxAfter.length - 1].row.subject_code === "chinese");

  console.log("\nMonthExamCloudRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
