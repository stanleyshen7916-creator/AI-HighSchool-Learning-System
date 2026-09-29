/* tests/regression/WrongBookCorrectCountRegression.js — 2026-09-29（PO 回報：
   知識弱點「對 N 次」顯示 0 次有誤）.

   Zero network calls: AHS.SyncBridge / AHS.RepositoryFactory are replaced
   with recording fakes after the real files load.

   Verifies:
   - 雲端撈回的紀錄：「對」次數不小於連續答對次數（修正「複習中卻對 0 次」），
     有 correct_count 時採用雲端值，且不會把本地較大的值蓋掉。
   - 日期一律轉成本地 YYYY/MM/DD（不再顯示原始 timestamptz），今日新增弱點
     的比對因此正確。
   - recordRetry() 答對後同步送出 correct_count 與 last_error_at（ISO 日期）。
   - 雲端尚未建立 correct_count 欄位時，自動略過該欄重送，其餘欄位照常同步。

   Run: node tests/regression/WrongBookCorrectCountRegression.js */
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
require(path.join(REPO, "js/runtime/WrongBookRuntime.js"));

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

function pad(n) { return n < 10 ? "0" + n : String(n); }
function localDate(d) { return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate()); }

let pushes = [];
const writes = [];
let columnExists = true;
let remoteRows = [];

AHS.SyncBridge = {
  isConfigured: () => true,
  identity: () => ({ userId: "u1", studentProfileId: "p1" }),
  subjectIdFor: () => Promise.resolve("subject-uuid"),
  subjectCodeFor: () => Promise.resolve("chinese"),
  pushFireAndForget: (factory) => { pushes.push(factory()); }
};
function reply(row) {
  if (!columnExists && Object.prototype.hasOwnProperty.call(row, "correct_count")) {
    return Promise.resolve({ data: null, error: { status: 400, message: "Could not find the 'correct_count' column of 'wrong_book' in the schema cache", raw: { code: "PGRST204" } } });
  }
  return Promise.resolve({ data: [Object.assign({ id: "remote-new" }, row)], error: null });
}
AHS.RepositoryFactory = {
  create: () => ({
    read: () => Promise.resolve({ data: remoteRows, error: null }),
    insert: (table, row) => { writes.push({ op: "insert", row }); return reply(row); },
    update: (table, query, row) => { writes.push({ op: "update", query, row }); return reply(row); }
  })
};

function remoteRow(overrides) {
  return Object.assign({
    id: "remote-1", subject_id: "subject-uuid", local_question_id: "tm_1_q1",
    knowledge_point: "內容理解", question_text: "道士最後「助資斧遣之歸」的行為？",
    your_answer: "B", correct_answer: "A", explanation: "", options: ["A", "B"],
    error_count: 1, correct_streak: 1, mastered_at: null, bookmarked: false, archived: false,
    first_error_at: "2026-09-06T02:06:43.775495+00:00", last_error_at: "2026-09-06T02:06:43.775495+00:00"
  }, overrides);
}

/* pushRecord() schedules its write only after an async subject lookup,
   and the fallback retry is chained after the first write — drain a few
   rounds of timers + pending pushes. */
async function settle() {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
    const pending = pushes;
    pushes = [];
    await Promise.all(pending);
  }
}

async function main() {
  console.log("WrongBook correct_count Regression");

  console.log("\n[1] 雲端撈回：對 N 次不小於連續答對次數，日期轉為 YYYY/MM/DD");
  AHS.WrongBookRuntime.reset();
  const todayIso = new Date().toISOString();
  remoteRows = [
    remoteRow({ id: "r-streak", correct_streak: 1 }),                       // 欄位尚未存在時的舊資料
    remoteRow({ id: "r-count", local_question_id: "tm_1_q2", correct_streak: 1, correct_count: 5 }),
    remoteRow({ id: "r-today", local_question_id: "tm_1_q3", correct_streak: 0, correct_count: 0,
      first_error_at: todayIso, last_error_at: todayIso, mastered_at: null })
  ];
  await AHS.WrongBookRuntime.pullFromRepository();
  const byQ = Object.fromEntries(AHS.WrongBookRuntime.list().map((i) => [i.questionId, i]));
  check("舊資料（無 correct_count、複習中 streak=1）→ 對 1 次，不再是 0", byQ.tm_1_q1.correctCount === 1);
  check("有 correct_count=5 → 對 5 次", byQ.tm_1_q2.correctCount === 5);
  const expectedDay = localDate(new Date("2026-09-06T02:06:43.775495+00:00"));
  check("最近答錯日期顯示為 " + expectedDay + "（不再是原始 timestamptz）", byQ.tm_1_q1.lastError === expectedDay);
  check("firstError 同樣轉為本地日期", byQ.tm_1_q1.firstError === expectedDay);
  check("今天答錯的紀錄 firstError === 今天（今日新增弱點比對正確）", byQ.tm_1_q3.firstError === localDate(new Date()));

  console.log("\n[2] 本地較大的值不會被雲端較小的值蓋掉");
  remoteRows = [remoteRow({ id: "r-count", local_question_id: "tm_1_q2", correct_streak: 1, correct_count: 2 })];
  await AHS.WrongBookRuntime.pullFromRepository();
  check("本地 5、雲端 2 → 維持 5", AHS.WrongBookRuntime.list().find((i) => i.questionId === "tm_1_q2").correctCount === 5);

  console.log("\n[3] 重做答對：送出 correct_count 與 ISO 格式的 last_error_at");
  writes.length = 0;
  const item = AHS.WrongBookRuntime.list().find((i) => i.questionId === "tm_1_q1");
  AHS.WrongBookRuntime.recordRetry(item.id, true);
  await settle();
  const w = writes[writes.length - 1];
  check("對 N 次本地變為 2", AHS.WrongBookRuntime.getById(item.id).correctCount === 2);
  check("更新同一筆雲端紀錄", w && w.op === "update" && w.query === "id=eq.r-streak");
  check("送出 correct_count = 2", w && w.row.correct_count === 2);
  check("last_error_at 為 YYYY-MM-DD", w && /^\d{4}-\d{2}-\d{2}$/.test(w.row.last_error_at));

  console.log("\n[4] 雲端尚未建立 correct_count 欄位：略過該欄重送，其他欄位照常同步");
  columnExists = false;
  writes.length = 0;
  AHS.WrongBookRuntime.recordRetry(item.id, true);
  await settle();
  check("先嘗試含 correct_count 的寫入", writes[0] && "correct_count" in writes[0].row);
  check("再以不含 correct_count 的內容重送一次", writes.length === 2 && !("correct_count" in writes[1].row));
  check("重送仍包含 correct_streak（=3）等其他欄位", writes[1] && writes[1].row.correct_streak === 3);
  check("本地對 N 次照常累加為 3", AHS.WrongBookRuntime.getById(item.id).correctCount === 3);
  columnExists = true;

  console.log("\n[5] 答錯不會減少累計答對次數");
  AHS.WrongBookRuntime.recordRetry(item.id, false);
  await settle();
  check("答錯後連續答對歸零，但對 N 次維持 3", AHS.WrongBookRuntime.getById(item.id).correctStreak === 0 && AHS.WrongBookRuntime.getById(item.id).correctCount === 3);

  console.log("\nWrongBookCorrectCountRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.log("  FAIL  unexpected error: " + (err && err.stack || err));
  process.exit(1);
});
