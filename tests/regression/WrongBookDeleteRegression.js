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
function stepText(steps) { return (steps || []).map((t) => (t && typeof t === "object") ? [t.title].concat(t.lines || [], t.note || []).join(" ") : String(t)).join(" "); }
function bracesBalanced(str) { let d = 0; for (const c of str) { if (c === "{") d++; if (c === "}") d--; if (d < 0) return false; } return d === 0; }
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
  ids.forEach((id) => {
    const n = notes[id];
    check(id + "：有 keyPoint、steps、references", !!n.keyPoint && Array.isArray(n.steps) && n.steps.length > 0 && Array.isArray(n.references) && n.references.length > 0);
    check(id + "：連結都是 https", n.references.every((r) => /^https:\/\//.test(r.url) && r.title));
    check(id + "：basis 標示【確認】或【推論】", /【確認】|【推論】/.test(n.basis || ""));
    const body = [n.keyPoint, stepText(n.steps)].concat(n.traps || [], n.formulas || [], Object.values(n.whyWrong || {})).join(" ");
    check(id + "：算式標記的大括號成對", bracesBalanced(body + stepText([].concat.apply([], (n.variants || []).map((v) => v.steps || [])))));
    check(id + "：方程式步驟都有標題與算式", n.steps.every((t) => typeof t === "string" || (t.title && Array.isArray(t.lines) && t.lines.length)));
    check(id + "：內文不寫 (A)~(E) 選項字母", !/[(（][A-E][)）]/.test(body));
    (n.variants || []).forEach((v, i) => {
      const keys = (v.options || []).map((o) => o.key);
      check(id + " 類題" + (i + 1) + "：題目與原題不同、正確答案在選項中", v.question && v.question !== n.question && keys.indexOf(v.correctAnswer) !== -1 && keys.length >= 2);
      check(id + " 類題" + (i + 1) + "：詳解不寫選項字母", !/[(（][A-E][)）]/.test(stepText(v.steps)));
    });
  });

  console.log("WrongBookDeleteRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})();
