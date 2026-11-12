/* tests/regression/WrongBookDeleteRegression.js — 2026-11-06（使用者需求：
   知識弱點改成重點整理，複習完成後可以刪除）.

   Zero network calls: AHS.SyncBridge / AHS.RepositoryFactory are recording fakes.

   Verifies:
   - remove() 是軟刪除：list()/getById()/isEmpty() 看不到，雲端送出 deleted_at。
   - 從雲端撈回 deleted_at 有值的紀錄，畫面一樣看不到；月考回填不會把它補回來。
   - 刪除後又答錯（sync()），這一題重新回到知識弱點，deleted_at 清空。
   - WrongBookNotesData 每筆筆記欄位齊全、連結是 https、內文不寫選項字母；類題的答案在選項中。

   Run: node tests/regression/WrongBookDeleteRegression.js */
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
require(path.join(REPO, "js/data/WrongBookNotesData.js"));

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const writes = [];
let pushes = [];
let remoteRows = [];
let examRows = [];
AHS.Subjects = { math: { name: "數學" } };
AHS.SyncBridge = {
  isConfigured: () => true,
  identity: () => ({ userId: "u1", studentProfileId: "p1" }),
  subjectIdFor: () => Promise.resolve("subject-uuid"),
  subjectCodeFor: () => Promise.resolve("math"),
  pushFireAndForget: (factory) => { pushes.push(factory()); }
};
AHS.RepositoryFactory = {
  create: () => ({
    read: (table) => Promise.resolve({ data: table === "month_exam_results" ? examRows : remoteRows, error: null }),
    insert: (table, row) => { writes.push({ op: "insert", row }); return Promise.resolve({ data: [Object.assign({ id: "remote-new" }, row)], error: null }); },
    update: (table, q, row) => { writes.push({ op: "update", row }); return Promise.resolve({ data: [row], error: null }); }
  })
};
function flush() { return new Promise((r) => setTimeout(r, 0)).then(() => Promise.all(pushes)).then(() => { pushes = []; }); }

const RT = AHS.WrongBookRuntime;
const wrong = { questionId: "tm_7_q18", text: "求 y = sin x + √3 cos x 的最大值", options: [], yourAnswer: "C", correctAnswer: "A", explanation: "", knowledgePoint: "疊合" };

(async function () {
  RT.reset();
  const created = RT.sync({ subject: "math", title: "數學", chapter: "", wrong: [wrong] })[0];
  await flush();
  check("刪除前 list() 有 1 題", RT.list().length === 1);
  check("remove() 回傳 true", RT.remove(created.id) === true);
  await flush();
  check("刪除後 list() 為空", RT.list().length === 0);
  check("刪除後 getById() 為 null", RT.getById(created.id) === null);
  check("刪除後 isEmpty() 為 true", RT.isEmpty() === true);
  const last = writes[writes.length - 1];
  check("雲端送出 deleted_at（ISO 時間）", last && typeof last.row.deleted_at === "string" && !isNaN(Date.parse(last.row.deleted_at)));
  check("重複刪除回傳 false", RT.remove(created.id) === false);

  examRows = [{ subject_code: "math", rows: [{ qid: "tm_7_q18", correct: false, answer: "A", given: "C", question: "x" }] }];
  remoteRows = [{ id: "remote-new", local_question_id: "tm_7_q18", subject_id: "subject-uuid", knowledge_point: "疊合", question_text: "x",
    your_answer: "C", correct_answer: "A", explanation: "", error_count: 1, correct_streak: 0, bookmarked: false, archived: false,
    deleted_at: "2026-11-06T13:00:00Z", options: [] }];
  const res = await RT.pullFromRepository();
  check("雲端撈回已刪除紀錄：畫面仍看不到", RT.list().length === 0);
  check("月考回填不會把已刪除的題目補回來", res.backfilled === 0);

  RT.sync({ subject: "math", title: "數學", chapter: "", wrong: [wrong] });
  await flush();
  check("刪除後又答錯：重新回到知識弱點", RT.list().length === 1);
  check("重新出現時雲端 deleted_at 清空", writes[writes.length - 1].row.deleted_at === null);

  const notes = AHS.WrongBookNotesData || {};
  const ids = Object.keys(notes);
  check("WrongBookNotesData 至少一筆", ids.length >= 1);
  /* 2026-11-12：格式規則搬到 scripts/maintenance/WrongBookNotesMerge.js 的 validateNote()，
     合併新筆記時逐筆檢查用的是同一份。 */
  const M = require(path.join(REPO, "scripts/maintenance/WrongBookNotesMerge.js"));
  ids.forEach((id) => {
    const bad = M.validateNote(notes[id]);
    check(id + "：重點整理格式正確" + (bad.length ? "（" + bad.join("；") + "）" : ""), bad.length === 0);
  });
  const okNote = { keyPoint: "k", steps: ["s"], references: [], basis: "【確認】ok" };
  check("格式規則：延伸閱讀可以是空的（找不到就不編造）", M.validateNote(okNote).length === 0);
  check("格式規則：多選的類題不合格（頁面的類題只能單選）", M.validateNote(Object.assign({}, okNote, { variants: [
    { question: "q", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], correctAnswer: "AB", steps: ["s"] }] })).length === 1);

  /* 2026-11-06 自動產生：待整理清單（scripts/maintenance/WrongBookNotesPending.js） */
  const P = require(path.join(REPO, "scripts/maintenance/WrongBookNotesPending.js"));
  check("待整理清單：讀得到既有筆記編號", P.existingNoteIds(path.join(REPO, "js/data/WrongBookNotesData.js")).indexOf("tm_7_q18") !== -1);
  const pend = P.pendingFrom([
    { local_question_id: "tm_7_q18", error_count: 9, subjects: { code: "math" } },
    { local_question_id: "q_a", error_count: 1, question_text: "A", subjects: { code: "physics" } },
    { local_question_id: "q_a", error_count: 4, question_text: "A", subjects: { code: "physics" } },
    { local_question_id: "q_b", error_count: 2, question_text: "B", subjects: { code: "chemistry" } },
    { local_question_id: null, error_count: 5 }
  ], ["tm_7_q18"], 1);
  check("待整理清單：略過已有筆記、無編號、重複題；錯最多的優先；依上限截斷",
    pend.total === 2 && pend.items.length === 1 && pend.items[0].questionId === "q_a" && pend.items[0].errorCount === 4 && pend.items[0].subject === "physics");
  const rv = P.reviewItems({ items: [{ questionId: "a" }, { questionId: "b" }, { questionId: "c" }, { questionId: "old" }] }, ["old"],
    { a: { basis: "【確認】ok" }, b: { basis: "【推論】答案不同" }, old: { basis: "【推論】x" } });
  check("Claude 把關：只挑本次新寫、未標【確認】的題目", rv.length === 1 && rv[0].questionId === "b");
  check("待整理清單：sb_secret_ 金鑰只放 apikey 標頭", !P.authHeaders("sb_secret_x").Authorization && P.authHeaders("eyJx").Authorization === "Bearer eyJx");

  /* 2026-11-08 省 token：AI 只寫小 JSON，由 WrongBookNotesMerge.js 併入 */
  const fs = require("fs");
  const os = require("os");
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "wbn-")), "Notes.js");
  fs.writeFileSync(tmp, "/* header */\nwindow.AHS = window.AHS || {};\n\n" + M.MARKER + "{\n  \"a\": {\"keyPoint\": \"old\"}\n};\n", "utf8");
  const r1 = M.merge(tmp, { a: Object.assign({}, okNote, { keyPoint: "new" }), b: Object.assign({}, okNote, { keyPoint: "B" }), bad: { keyPoint: "沒有詳解" } });
  const merged = P.loadNotes(tmp);
  check("合併：新增與取代計數正確；不合格的那一筆略過，其他照常併入", r1.added === 1 && r1.replaced === 1 && r1.skipped.length === 1 && r1.skipped[0].id === "bad" && !merged.bad);
  check("合併：同 id 取代、新 id 加入、保留檔頭", merged.a.keyPoint === "new" && merged.b.keyPoint === "B" && fs.readFileSync(tmp, "utf8").indexOf("/* header */") === 0);
  /* 2026-11-12 一次跑完全部批次＋沿用原本的換行 */
  const cut = P.sliceItems({ total: 5, items: [{ questionId: "a" }, { questionId: "b" }, { questionId: "c" }] }, 2, 2);
  check("待整理清單：切出一批（最後一批不足也可以）", cut.total === 5 && cut.items.length === 1 && cut.items[0].questionId === "c");
  const crlf = path.join(path.dirname(tmp), "Crlf.js");
  fs.writeFileSync(crlf, "/* header */\r\nwindow.AHS = window.AHS || {};\r\n\r\n" + M.MARKER + "{\r\n  \"a\": {\"keyPoint\": \"old\"}\r\n};\r\n", "utf8");
  M.merge(crlf, { b: Object.assign({}, okNote, { keyPoint: "B" }) });
  const crlfOut = fs.readFileSync(crlf, "utf8");
  check("合併：CRLF 檔案維持 CRLF、LF 檔案維持 LF", P.loadNotes(crlf).b.keyPoint === "B" && !/[^\r]\n/.test(crlfOut) && crlfOut.indexOf("\r\n") !== -1 && fs.readFileSync(tmp, "utf8").indexOf("\r") === -1);
  let threw = false;
  try { M.merge(tmp, [1, 2]); } catch (_) { threw = true; }
  check("合併：拒絕非物件輸入", threw);
  const ex = JSON.parse(fs.readFileSync(path.join(REPO, "ai-engine/council/tools/wrongbook-notes-example.json"), "utf8"));
  check("格式範例：與正式資料的 tm_7_q18 一致", JSON.stringify(ex.tm_7_q18) === JSON.stringify(notes.tm_7_q18));

  console.log("WrongBookDeleteRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})();
