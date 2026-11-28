/* tests/regression/MonthExamActiveBackupRegression.js — 2026-11-28（PO 回報：
   iPad 考完國文模擬月考，電腦版查不到。iPad Safari 分頁的 sessionStorage 在考試
   途中被清掉，作答與成績一起消失，沒有東西可上傳）.

   Zero network calls: AHS.SyncBridge / AHS.RepositoryFactory are recording fakes
   backed by an in-memory "cloud".

   Verifies:
   [1] 開始作答立刻在 month_exam_active 建一列；作答後 1.5 秒內合併成一次 update。
   [2] 分頁暫存被清掉後（新的 sessionStorage）頁面載入：從雲端接回進行中的考卷，
       作答都在，可以繼續作答並交卷。
   [3] 交卷、成績寫進 month_exam_results 後刪除備份；交卷後排隊中的備份不會把它寫回來。
   [4] 接回的考卷已超過 60 分鐘：settleExpired 自動交卷並上傳成績。
   [5] 已交卷的考卷（雲端成績已有同一份）只刪備份，不會被接回成進行中。
   [6] 其他學期的備份不接回。

   Run: node tests/regression/MonthExamActiveBackupRegression.js */
"use strict";
const path = require("path");
const REPO = path.join(__dirname, "..", "..");

let memoryStore = {};
global.window = global;
window.sessionStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null),
  setItem: (k, v) => { memoryStore[k] = String(v); },
  removeItem: (k) => { delete memoryStore[k]; }
};
require(path.join(REPO, "js/core/PersistenceAdapter.js"));
AHS.Subjects = { chinese: { name: "國文" } };

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); }
}

/* ---- in-memory cloud ---- */
const cloud = { month_exam_active: [], month_exam_results: [] };
const log = [];
function parse(query) {
  const out = {};
  String(query || "").split("&").forEach((p) => {
    const m = /^([a-z_]+)=eq\.(.*)$/.exec(p);
    if (m) { out[m[1]] = decodeURIComponent(m[2]); }
  });
  return out;
}
function matches(row, f) { return Object.keys(f).every((k) => String(row[k]) === f[k]); }
let pushes = [];
AHS.SyncBridge = {
  isConfigured: () => true,
  identity: () => ({ userId: "u1", studentProfileId: "p1" }),
  subjectIdFor: () => Promise.resolve("sid-chinese"),
  subjectCodeFor: () => Promise.resolve(null),
  pushFireAndForget: (factory) => { pushes.push(factory()); }
};
AHS.RepositoryFactory = {
  create: () => ({
    read: (table, query) => {
      const f = parse(query);
      const rows = (cloud[table] || []).filter((r) => matches(r, f));
      if (table === "month_exam_active") { rows.sort((a, b) => b.updated_at - a.updated_at); }
      return Promise.resolve({ data: JSON.parse(JSON.stringify(rows)), error: null });
    },
    insert: (table, row) => {
      log.push({ table, op: "insert", row });
      cloud[table] = cloud[table] || [];
      if (cloud[table].some((r) => r.student_profile_id === row.student_profile_id && r.local_id === row.local_id)) {
        return Promise.resolve({ data: null, error: { code: "23505", message: "duplicate key" } });
      }
      cloud[table].push(Object.assign({ updated_at: Date.now() + log.length }, JSON.parse(JSON.stringify(row))));
      return Promise.resolve({ data: [row], error: null });
    },
    update: (table, query, patch) => {
      log.push({ table, op: "update", query, patch });
      const f = parse(query);
      (cloud[table] || []).forEach((r) => { if (matches(r, f)) { Object.assign(r, JSON.parse(JSON.stringify(patch)), { updated_at: Date.now() + log.length }); } });
      return Promise.resolve({ data: [patch], error: null });
    },
    delete: (table, query) => {
      log.push({ table, op: "delete", query });
      const f = parse(query);
      cloud[table] = (cloud[table] || []).filter((r) => !matches(r, f));
      return Promise.resolve({ data: [], error: null });
    }
  })
};
async function settle() {
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 0));
    const pending = pushes; pushes = [];
    await Promise.all(pending);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let semester = "g2s1";
AHS.WorkspaceRuntime = { getCurrent: () => ({ studentId: "s", schoolId: "cjsh", semesterIds: [semester] }) };
const qs = [];
for (let i = 1; i <= 4; i++) { qs.push({ id: "tm_7_q" + i, type: "single_choice", question: "Q" + i, options: ["a" + i, "b" + i], answer: "a" + i, knowledgePoint: "kp" + i }); }
AHS.TeachingMaterialData = [{ materialId: "tm_7", material: { subject: "國文", school: "cjsh", semester: "g2s1", chapter: "x" }, questions: qs }];
require(path.join(REPO, "js/runtime/WrongBookRuntime.js"));
require(path.join(REPO, "js/runtime/MonthExamRuntime.js"));
const RT = AHS.MonthExamRuntime;

/* A fresh tab whose sessionStorage was wiped: new storage, runtime reloaded (module state reset). */
function wipeTab() {
  memoryStore = {};
  delete require.cache[require.resolve(path.join(REPO, "js/runtime/MonthExamRuntime.js"))];
  require(path.join(REPO, "js/runtime/MonthExamRuntime.js"));
  return AHS.MonthExamRuntime;
}

async function main() {
  console.log("Month Exam Active Backup Regression");

  console.log("\n[1] 開始作答即備份，作答合併成一次 update");
  const now = Date.now();
  const s = RT.start("國文", ["tm_7"], { now: now });
  await settle();
  check("開始作答時在 month_exam_active 建立一列（學校學期、local_id）", cloud.month_exam_active.length === 1 &&
    cloud.month_exam_active[0].local_id === s.id && cloud.month_exam_active[0].school_code === "cjsh" && cloud.month_exam_active[0].semester_code === "g2s1");
  const before = log.length;
  RT.answer("tm_7_q1", "a1", now + 1);
  RT.answer("tm_7_q2", "b2", now + 2);
  await sleep(1700);
  await settle();
  const ups = log.slice(before).filter((w) => w.table === "month_exam_active");
  check("兩次作答在 1.5 秒內合併成一次 update，內容是最新作答", ups.length === 1 && ups[0].op === "update" &&
    ups[0].patch.session.answers["tm_7_q1"] === "a1" && ups[0].patch.session.answers["tm_7_q2"] === "b2");

  console.log("\n[2] 分頁暫存被清掉：重新載入後從雲端接回");
  let rt = wipeTab();
  check("（模擬）新分頁本機沒有進行中的考卷", rt.active() === null);
  const pulled = await rt.pullFromRepository();
  await settle();
  const back = rt.active();
  check("從雲端接回同一份考卷，已作答的兩題都在", pulled.restored === s.id && back && back.id === s.id &&
    back.answers["tm_7_q1"] === "a1" && back.answers["tm_7_q2"] === "b2" && back.items.length === 4);
  rt.answer("tm_7_q3", "a3", now + 3);

  console.log("\n[3] 交卷：成績上傳後刪除備份，排隊中的備份不寫回");
  const res = rt.submit({ now: now + 4 });
  await settle();
  check("成績寫進 month_exam_results", cloud.month_exam_results.length === 1 && cloud.month_exam_results[0].local_id === s.id && res.correct === 2);
  check("備份已刪除", cloud.month_exam_active.length === 0);
  await sleep(1700);
  await settle();
  check("交卷後原本排定的備份沒有把考卷寫回雲端", cloud.month_exam_active.length === 0);

  console.log("\n[4] 接回的考卷已超時：自動交卷並上傳");
  const s2 = rt.start("國文", ["tm_7"], { now: now - 2 * 60 * 60 * 1000 });
  await settle();
  rt = wipeTab();
  const p2 = await rt.pullFromRepository();
  await settle();
  check("超時的考卷也接回", p2.restored === s2.id);
  const settled = rt.settleExpired(now);
  await settle();
  check("settleExpired 自動交卷（timedOut）", settled && settled.id === s2.id && settled.timedOut === true && rt.active() === null);
  check("成績上傳、備份刪除", cloud.month_exam_results.some((r) => r.local_id === s2.id) && cloud.month_exam_active.length === 0);

  console.log("\n[5] 已交卷的考卷只刪備份，不接回");
  cloud.month_exam_active.push({ user_id: "u1", student_profile_id: "p1", school_code: "cjsh", semester_code: "g2s1", local_id: s.id, updated_at: Date.now(),
    session: { id: s.id, subject: "國文", items: [], answers: {}, startedAt: now, durationMs: 3600000 } });
  rt = wipeTab();
  const p3 = await rt.pullFromRepository();
  await settle();
  check("雲端成績已有同一份 → 不接回、備份刪除", p3.restored === null && rt.active() === null && cloud.month_exam_active.length === 0);

  console.log("\n[6] 其他學期的備份不接回");
  cloud.month_exam_active.push({ user_id: "u1", student_profile_id: "p1", school_code: "cjsh", semester_code: "g1s2", local_id: "me_other_sem", updated_at: Date.now(),
    session: { id: "me_other_sem", subject: "國文", items: [{ qid: "tm_7_q1", order: [0, 1] }], answers: {}, startedAt: now, durationMs: 3600000 } });
  rt = wipeTab();
  const p4 = await rt.pullFromRepository();
  await settle();
  check("目前學期 g2s1 不接回 g1s2 的考卷", p4.restored === null && rt.active() === null && cloud.month_exam_active.length === 1);

  console.log("\nMonthExamActiveBackupRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
