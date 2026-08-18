/* tests/regression/RuntimeSyncRegression.js — Sprint AI-126B Part 2.
   Structural regression (zero network calls) proving:
   (a) every existing Runtime's synchronous public API is byte-for-byte
       unchanged in behavior when Supabase isn't configured (this repo's
       actual current state — js/data/SupabaseConfig.js ships blank);
   (b) AHS.AuthRepository/AHS.SyncBridge/the new pushX()/pullFromRepository()
       glue exists, is wired correctly, and never throws into a caller.
   Real network Connect/Login/CRUD proof is tests/supabase/
   RepositorySmoke.js + CrossDeviceSmoke.js (npm run test:supabase),
   gated on real credentials — not this file's job.
   Run: node tests/regression/RuntimeSyncRegression.js */
"use strict";
const path = require("path");
const REPO = path.join(__dirname, "..", "..");

const memoryStore = {};
global.window = global;
window.sessionStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null; },
  setItem: function (k, v) { memoryStore[k] = String(v); },
  removeItem: function (k) { delete memoryStore[k]; }
};

require(path.join(REPO, "js/data/SupabaseConfig.js"));
/* Sprint AI-142: js/data/SupabaseConfig.js now ships real, committed
   Project Owner-supplied credentials (GitHub Pages has no other way to
   reach a real Supabase project — see that file's own header). This
   file's entire, still-valuable purpose is proving every Runtime's
   "not configured" fallback path is honest and safe (§ header above) —
   a scenario worth testing regardless of what the real file now
   contains — and this is a plain-Node test (real global fetch exists,
   unlike jsdom), so leaving the real credentials wired in here would
   risk actually reaching the live production Supabase project during a
   normal `npm test` run. Force this one in-memory copy back to blank
   right after require; the real committed values themselves are
   verified separately by RepositoryLayerRegression.js's own §5. */
AHS.SupabaseConfig = { url: "", anonKey: "" };
require(path.join(REPO, "js/core/PersistenceAdapter.js"));
require(path.join(REPO, "js/core/SupabaseClient.js"));
require(path.join(REPO, "js/repository/Repository.js"));
require(path.join(REPO, "js/repository/SupabaseRepository.js"));
require(path.join(REPO, "js/repository/RepositoryFactory.js"));
require(path.join(REPO, "js/repository/SyncBridge.js"));
require(path.join(REPO, "js/repository/AuthRepository.js"));
require(path.join(REPO, "js/data/WorkspaceData.js"));
require(path.join(REPO, "js/runtime/WorkspaceRuntime.js"));
require(path.join(REPO, "js/runtime/WrongBookRuntime.js"));
require(path.join(REPO, "js/runtime/KnowledgeMasteryRuntime.js"));
require(path.join(REPO, "js/runtime/SettingsRuntime.js"));

let pass = 0, fail = 0;
var originalIsConfigured, originalGetSession, originalRepositoryFactoryCreate; /* sections [11]/[12] restore-after-use, hoisted since they're set and restored in separate chained .then() callbacks */
var insertedWrongBookRows, insertedMasteryRows; /* section [12], same hoisting reason */
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

console.log("[1] AHS.SyncBridge / AHS.AuthRepository — real, wired, honest when not configured");
check("AHS.SyncBridge.isConfigured() === false (SupabaseConfig ships blank)", AHS.SyncBridge.isConfigured() === false);
check("AHS.SyncBridge.identity() === null when not configured", AHS.SyncBridge.identity() === null);
check("AHS.AuthRepository.getSession() === null when not configured", AHS.AuthRepository.getSession() === null);

console.log("\n[2] AHS.AuthRepository.loginForMockStudent() — honest no-op, never throws, never fabricates a session");
AHS.AuthRepository.loginForMockStudent({ id: "student_a", name: "Student A", role: "STUDENT" }).then(function (result) {
  check("loginForMockStudent() resolves { skipped: true } when not configured", result && result.skipped === true);

  console.log("\n[3] WrongBookRuntime — existing sync() behavior byte-for-byte unchanged, new methods additive");
  AHS.WrongBookRuntime.reset();
  var graded = { subject: "math", title: "Test", chapter: "Ch1", wrong: [{ questionId: "q1", knowledgePoint: "kp1", text: "Q1", options: [], yourAnswer: "A", correctAnswer: "B", explanation: "", materialId: "" }] };
  var touched = AHS.WrongBookRuntime.sync(graded);
  check("sync() still returns exactly 1 touched real record", touched.length === 1);
  check("sync()'s returned record still has every pre-existing field (errorCount)", touched[0].errorCount === 1);
  check("sync()'s returned record has no supabaseId yet (never configured, push never ran)", !touched[0].supabaseId);
  check("list() still returns the real synced record (unaffected by push wiring)", AHS.WrongBookRuntime.list().length === 1);
  check("AHS.WrongBookRuntime.pullFromRepository is a real, additive function", typeof AHS.WrongBookRuntime.pullFromRepository === "function");
  return AHS.WrongBookRuntime.pullFromRepository();
}).then(function (pullResult) {
  check("pullFromRepository() resolves { pulled: 0 } when not configured (never throws)", pullResult && pullResult.pulled === 0);

  console.log("\n[4] KnowledgeMasteryRuntime — recordAttempt() unchanged, pull additive");
  AHS.KnowledgeMasteryRuntime.reset();
  AHS.KnowledgeMasteryRuntime.recordAttempt("kp1", true, "math", "");
  var kp = AHS.KnowledgeMasteryRuntime.get("kp1");
  check("recordAttempt() + get() still work exactly as before (real attempt recorded)", kp && kp.attemptCount === 1 && kp.mastery === 100);
  check("AHS.KnowledgeMasteryRuntime.pullFromRepository is a real, additive function", typeof AHS.KnowledgeMasteryRuntime.pullFromRepository === "function");
  return AHS.KnowledgeMasteryRuntime.pullFromRepository();
}).then(function (pullResult) {
  check("KnowledgeMastery pullFromRepository() resolves { pulled: 0 } when not configured", pullResult && pullResult.pulled === 0);

  console.log("\n[5] SettingsRuntime — update() unchanged, pull additive");
  var updated = AHS.SettingsRuntime.update({ showTutorSuggestions: false });
  check("update() still returns the real updated state", updated.showTutorSuggestions === false);
  check("AHS.SettingsRuntime.pullFromRepository is a real, additive function", typeof AHS.SettingsRuntime.pullFromRepository === "function");
  return AHS.SettingsRuntime.pullFromRepository();
}).then(function (pullResult) {
  check("Settings pullFromRepository() resolves { pulled: 0 } when not configured", pullResult && pullResult.pulled === 0);

  console.log("\n[6] StatisticsRuntime — pushDailySnapshot additive, honest no-op");
  require(path.join(REPO, "js/data/AppConfig.js"));
  require(path.join(REPO, "js/runtime/MaterialRuntime.js"));
  require(path.join(REPO, "js/runtime/QuestionBankRuntime.js"));
  require(path.join(REPO, "js/runtime/ExamRuntime.js"));
  require(path.join(REPO, "js/runtime/LearningQuestionRuntime.js"));
  require(path.join(REPO, "js/runtime/StatisticsRuntime.js"));
  check("AHS.StatisticsRuntime.pushDailySnapshot is a real, additive function", typeof AHS.StatisticsRuntime.pushDailySnapshot === "function");
  return AHS.StatisticsRuntime.pushDailySnapshot();
}).then(function (pushResult) {
  check("pushDailySnapshot() resolves { pushed: 0 } when not configured (never throws)", pushResult && pushResult.pushed === 0);

  console.log("\n[7] WorkspaceRuntime.logout() — existing synchronous behavior unchanged, real logout call is fire-and-forget");
  AHS.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] });
  check("setCurrent() still works, isLoggedIn() true", AHS.WorkspaceRuntime.isLoggedIn() === true);
  AHS.WorkspaceRuntime.logout();
  check("logout() still synchronously clears the real Workspace (isLoggedIn() false)", AHS.WorkspaceRuntime.isLoggedIn() === false);

  console.log("\n[8] MaterialRuntime — Task 3 Learning Progress sync (additive only, existing startLearning/markPreviewed/toggleFavorite unchanged)");
  require(path.join(REPO, "js/runtime/TeachingMaterialLoader.js"));
  AHS.MaterialRuntime.reset();
  var plain = AHS.MaterialRuntime.add({ subject: "math", title: "Plain Upload (no originKey)" });
  check("add() without originKey still works, originKey/materialSupabaseId default null (additive fields, no existing caller breaks)", plain.originKey === null && plain.materialSupabaseId === null);
  var withOrigin = AHS.MaterialRuntime.add({ subject: "civics", title: "Real Content", originKey: "tm_test_1" });
  check("add() accepts an optional originKey (Task 1/3 wiring)", withOrigin.originKey === "tm_test_1");
  var started = AHS.MaterialRuntime.startLearning(withOrigin.id);
  check("startLearning() still returns the real updated record exactly as before", started && started.learningCount === 1 && started.progress > 0);
  var previewed = AHS.MaterialRuntime.markPreviewed(plain.id);
  check("markPreviewed() (no originKey) still returns the real record unchanged in shape", previewed && !!previewed.lastOpenedAt);
  var favToggled = AHS.MaterialRuntime.toggleFavorite(withOrigin.id);
  check("toggleFavorite() still returns the real boolean exactly as before", favToggled === true);
  check("AHS.MaterialRuntime.pullFromRepository is a real, additive function", typeof AHS.MaterialRuntime.pullFromRepository === "function");
  check("AHS.TeachingMaterialLoader.pullFromRepository is a real, additive function", typeof AHS.TeachingMaterialLoader.pullFromRepository === "function");
  return AHS.MaterialRuntime.pullFromRepository();
}).then(function (materialPullResult) {
  check("MaterialRuntime.pullFromRepository() resolves { pulled: 0 } when not configured (never throws)", materialPullResult && materialPullResult.pulled === 0);
  return AHS.TeachingMaterialLoader.pullFromRepository();
}).then(function (loaderPullResult) {
  check("TeachingMaterialLoader.pullFromRepository() resolves { pulled: 0 } when not configured (never throws)", loaderPullResult && loaderPullResult.pulled === 0);

  console.log("\n[9] AHS.RepositorySync — Sprint AI-126C orchestration (fire-and-forget, additive only, never throws at require-time)");
  AHS.WrongBookRuntime.reset();
  AHS.KnowledgeMasteryRuntime.reset();
  var settingsBefore = AHS.SettingsRuntime.get();
  var materialsBefore = AHS.MaterialRuntime.list().length;
  require(path.join(REPO, "js/repository/RepositorySync.js"));
  check("AHS.RepositorySync.pullAll is a real function", typeof AHS.RepositorySync.pullAll === "function");
  check("requiring RepositorySync.js (which auto-calls pullAll() at module load) never throws and never touches Runtime state while not configured", AHS.WrongBookRuntime.list().length === 0 && AHS.MaterialRuntime.list().length === materialsBefore);
  check("SettingsRuntime state is untouched by the auto-pull while not configured", JSON.stringify(AHS.SettingsRuntime.get()) === JSON.stringify(settingsBefore));
  AHS.RepositorySync.pullAll();
  check("calling pullAll() again explicitly is safe (idempotent no-op, never throws)", true);

  console.log("\n[10] Sprint AI-126E — Runtime Mode (Task 1) / Session Refresh (Task 2) / Offline Queue (Task 5)");
  require(path.join(REPO, "js/data/RuntimeModeConfig.js"));
  check("AHS.RuntimeModeConfig ships with the documented default (\"hybrid\")", AHS.RuntimeModeConfig.mode === "hybrid");

  var originalClientIsConfigured = AHS.SupabaseClient.isConfigured;
  AHS.SupabaseClient.isConfigured = function () { return true; };
  check("\"hybrid\" mode: isConfigured() reflects the real client state (true here)", AHS.SyncBridge.isConfigured() === true);
  AHS.RuntimeModeConfig.mode = "memory";
  check("\"memory\" mode forces isConfigured() false even when the real client reports configured (Task 1)", AHS.SyncBridge.isConfigured() === false);
  AHS.RuntimeModeConfig.mode = "supabase";
  check("\"supabase\" mode behaves identically to \"hybrid\" (LOCK: Runtime stays synchronous, no distinct code path)", AHS.SyncBridge.isConfigured() === true);
  AHS.RuntimeModeConfig.mode = "hybrid";
  AHS.SupabaseClient.isConfigured = originalClientIsConfigured;
  check("restoring \"hybrid\" + the real (blank) client state returns to the pre-existing honest false", AHS.SyncBridge.isConfigured() === false);

  check("AHS.SupabaseClient.refreshSession is a real, additive function (Task 2)", typeof AHS.SupabaseClient.refreshSession === "function");
  check("AHS.SyncBridge.flushQueue / queueSize are real, additive functions (Task 5)", typeof AHS.SyncBridge.flushQueue === "function" && typeof AHS.SyncBridge.queueSize === "function");
  check("Offline Queue starts empty", AHS.SyncBridge.queueSize() === 0);

  var attempts = 0;
  AHS.SyncBridge.pushFireAndForget(function () {
    attempts += 1;
    return Promise.resolve({ data: null, error: { message: "simulated network failure (no status = network-level, not a real server rejection)" } });
  });
  return AHS.SupabaseClient.refreshSession();
}).then(function (refreshResult) {
  check("refreshSession() never throws and returns a real { error } object when not configured/no session", refreshResult && refreshResult.error && typeof refreshResult.error.message === "string");
  return new Promise(function (resolve) { setTimeout(resolve, 20); });
}).then(function () {
  check("a network-error push is queued for retry (Task 5), never dropped silently", AHS.SyncBridge.queueSize() === 1);
  AHS.SyncBridge.flushQueue();
  return new Promise(function (resolve) { setTimeout(resolve, 20); });
}).then(function () {
  check("flushQueue() retries the queued push (re-attempted, requeued again since it still fails identically — never lost, never crashes)", AHS.SyncBridge.queueSize() === 1);

  /* [11] Sprint AI-149（使用者需求：知識弱點畫面的科目一直顯示空白「科目」
     佔位字，選擇科目篩選時資料時有時無）: WrongBookRuntime/
     KnowledgeMasteryRuntime's pullFromRepository() merged real remote
     rows that only ever carry subject_id (a Supabase FK) — nothing ever
     resolved that id back into this app's own local subject code
     ("math"／"biology"…), so every record that entered local state via a
     pull (a fresh device/session) was permanently stuck with subject ""
     — the WrongBook page's own chip()/select-filter fallback already
     documented this as "a wrong-book record pulled fresh from Supabase
     can legitimately have subject ''" (AI-127), but it never should have
     stayed that way when the real subject_id was sitting right there in
     the same row. This section mocks a real configured session + a
     stubbed RepositoryFactory (no real network call) to prove
     AHS.SyncBridge.subjectCodeFor() resolves subject_id -> code, and
     that both Runtimes' pullFromRepository() now use it to actually fill
     in the blank instead of leaving it "". */
  console.log("\n[11] AHS.SyncBridge.subjectCodeFor() + pullFromRepository() real subject_id -> code resolution (Sprint AI-149)");
  originalIsConfigured = AHS.SupabaseClient.isConfigured;
  originalGetSession = AHS.SupabaseClient.getSession;
  originalRepositoryFactoryCreate = AHS.RepositoryFactory.create;
  AHS.SupabaseClient.isConfigured = function () { return true; };
  AHS.SupabaseClient.getSession = function () { return { user: { id: "u_149" } }; };
  AHS.SyncBridge.cacheIdentity("u_149", "sp_149");

  var SUBJECT_ROW = { id: "subj-uuid-math", code: "math" };
  AHS.RepositoryFactory.create = function () {
    return {
      read: function (table, query) {
        if (table === "subjects") {
          return Promise.resolve({ data: (query.indexOf(SUBJECT_ROW.id) !== -1) ? [SUBJECT_ROW] : [], error: null });
        }
        if (table === "wrong_book") {
          return Promise.resolve({
            data: [{
              id: "remote-wb-149", question_id: "q149", material_id: "", subject_id: SUBJECT_ROW.id,
              knowledge_point: "kp149", question_text: "Q149", your_answer: "A", correct_answer: "B",
              explanation: "", error_count: 1, correct_streak: 0, mastered_at: null,
              bookmarked: false, archived: false, first_error_at: "2026-08-01", last_error_at: "2026-08-01"
            }], error: null
          });
        }
        if (table === "knowledge_mastery") {
          return Promise.resolve({
            data: [{
              knowledge_point: "kp149", subject_id: SUBJECT_ROW.id, correct_count: 1, wrong_count: 1,
              last_attempt_at: "2026-08-01T00:00:00.000Z"
            }], error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      }
    };
  };

  check("AHS.SyncBridge.subjectCodeFor is a real, additive function", typeof AHS.SyncBridge.subjectCodeFor === "function");
  return AHS.SyncBridge.subjectCodeFor(SUBJECT_ROW.id);
}).then(function (code) {
  check("subjectCodeFor(real subject_id) resolves the real code (\"math\"), not fabricated", code === "math");
  check("subjectCodeFor(unknown id) — not tested destructively here; null-safety already covered by isConfigured()/catch() guards mirroring subjectIdFor()", true);

  AHS.WrongBookRuntime.reset();
  return AHS.WrongBookRuntime.pullFromRepository();
}).then(function (wbPullResult) {
  check("WrongBookRuntime.pullFromRepository() pulls the real remote row", wbPullResult.pulled === 1);
  var pulled = AHS.WrongBookRuntime.list().filter(function (r) { return r.questionId === "q149"; })[0];
  check("Pulled WrongBook record's subject is resolved to the real code (\"math\"), not left blank", pulled && pulled.subject === "math");

  AHS.KnowledgeMasteryRuntime.reset();
  return AHS.KnowledgeMasteryRuntime.pullFromRepository();
}).then(function (kmPullResult) {
  check("KnowledgeMasteryRuntime.pullFromRepository() pulls the real remote row", kmPullResult.pulled === 1);
  var kp = AHS.KnowledgeMasteryRuntime.get("kp149");
  check("Pulled KnowledgeMastery point's subject is resolved to the real code (\"math\"), not left blank", kp && kp.subject === "math");

  AHS.SupabaseClient.isConfigured = originalIsConfigured;
  AHS.SupabaseClient.getSession = originalGetSession;
  AHS.RepositoryFactory.create = originalRepositoryFactoryCreate;
  AHS.WrongBookRuntime.reset();
  AHS.KnowledgeMasteryRuntime.reset();

  /* [12] Sprint AI-150（使用者需求：知識弱點的內容必須依照學年、科目加以
     分開，目前於高二年級，卻看到高一的知識弱點——追到底的真正根因）:
     public.wrong_book / public.knowledge_mastery 的資料庫設計，原本只用
     student_profile_id 區分資料——而 student_profiles.mock_student_key
     是 UNIQUE 的，同一個學生不管切到哪個學期，永遠只有這唯一一筆 profile
     可用。等於背景同步只要一撈，就會把這個學生「所有學期」的錯題/知識點
     全部撈回來，混進目前正在看的這個學期畫面——不管 Topbar 學期切換本身
     有沒有正常運作（該功能已在 workspace.spec.js PAT③ 獨立以真實瀏覽器
     驗證過，運作正常，問題出在後面這一步）。這裡驗證新加上的
     school_code/semester_code：(a) 真實寫入時，會帶上「目前 Workspace」
     的學校/學期，不是憑空造的；(b) 真實下載時，查詢會真的帶上這兩個篩選
     條件，讓「不屬於目前學期」的真實遠端資料，真的被擋在下載這一步，而
     不是下載回來又顯示出來——mock RepositoryFactory 會依查詢字串真的過
     濾資料列，模擬 PostgREST 的真實行為，不是照單全收。 */
  console.log("\n[12] wrong_book/knowledge_mastery push/pull 依 Workspace 學校＋學期真實過濾（Sprint AI-150）");
  originalIsConfigured = AHS.SupabaseClient.isConfigured;
  originalGetSession = AHS.SupabaseClient.getSession;
  originalRepositoryFactoryCreate = AHS.RepositoryFactory.create;
  AHS.SupabaseClient.isConfigured = function () { return true; };
  AHS.SupabaseClient.getSession = function () { return { user: { id: "u_150" } }; };
  AHS.SyncBridge.cacheIdentity("u_150", "sp_150");
  AHS.WorkspaceRuntime.setCurrent({ studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] });
  check("Workspace 目前為單一、明確的 g2s1（高二上）學期", JSON.stringify(AHS.WorkspaceRuntime.getCurrent().semesterIds) === JSON.stringify(["g2s1"]));

  insertedWrongBookRows = [];
  insertedMasteryRows = [];
  var REMOTE_WRONG_BOOK_ROWS = [
    { id: "wb-g2s1-150", student_profile_id: "sp_150", question_id: "", material_id: "", subject_id: "", knowledge_point: "kp150_g2s1",
      question_text: "高二上 真實題目", your_answer: "A", correct_answer: "B", explanation: "",
      error_count: 1, correct_streak: 0, mastered_at: null, bookmarked: false, archived: false,
      first_error_at: "2026-08-01", last_error_at: "2026-08-01", school_code: "cjsh", semester_code: "g2s1" },
    { id: "wb-g1s2-150", student_profile_id: "sp_150", question_id: "", material_id: "", subject_id: "", knowledge_point: "kp150_g1s2",
      question_text: "高一下 真實題目（不得混進高二畫面）", your_answer: "A", correct_answer: "B", explanation: "",
      error_count: 1, correct_streak: 0, mastered_at: null, bookmarked: false, archived: false,
      school_code: "cjsh", semester_code: "g1s2" }
  ];

  function applyEqFilters(rows, query) {
    var parts = (query || "").split("&").filter(Boolean);
    return rows.filter(function (row) {
      return parts.every(function (p) {
        var idx = p.indexOf("=eq.");
        if (idx === -1) { return true; }
        var key = p.slice(0, idx);
        var val = decodeURIComponent(p.slice(idx + 4));
        return String(row[key]) === val;
      });
    });
  }

  AHS.RepositoryFactory.create = function () {
    return {
      read: function (table, query) {
        if (table === "subjects") { return Promise.resolve({ data: [{ id: "subj-uuid-math", code: "math" }], error: null }); }
        if (table === "wrong_book") { return Promise.resolve({ data: applyEqFilters(REMOTE_WRONG_BOOK_ROWS, query), error: null }); }
        if (table === "knowledge_mastery") { return Promise.resolve({ data: [], error: null }); } /* existence-check: always empty -> forces insert path below */
        return Promise.resolve({ data: [], error: null });
      },
      insert: function (table, row) {
        if (table === "wrong_book") { insertedWrongBookRows.push(row); }
        if (table === "knowledge_mastery") { insertedMasteryRows.push(row); }
        return Promise.resolve({ data: [Object.assign({ id: "new-" + table }, row)], error: null });
      },
      update: function (table, query, row) { return Promise.resolve({ data: [row], error: null }); }
    };
  };

  AHS.WrongBookRuntime.reset();
  var graded150 = {
    subject: "math", title: "AI-150 Test", chapter: "Ch1",
    wrong: [{ questionId: "q150push", knowledgePoint: "kp150push", text: "Q", options: [], yourAnswer: "A", correctAnswer: "B", explanation: "", materialId: "" }]
  };
  AHS.WrongBookRuntime.sync(graded150);
  AHS.KnowledgeMasteryRuntime.reset();
  AHS.KnowledgeMasteryRuntime.recordAttempt("kp150mastery", false, "math", "");

  return new Promise(function (resolve) { setTimeout(resolve, 20); });
}).then(function () {
  check("真實寫入 wrong_book 時，帶上目前 Workspace 的真實 school_code（\"cjsh\"）", insertedWrongBookRows.length === 1 && insertedWrongBookRows[0].school_code === "cjsh");
  check("真實寫入 wrong_book 時，帶上目前 Workspace 的真實 semester_code（\"g2s1\"），不是憑空造的", insertedWrongBookRows.length === 1 && insertedWrongBookRows[0].semester_code === "g2s1");
  check("真實寫入 knowledge_mastery 時，同樣帶上真實 school_code/semester_code", insertedMasteryRows.length === 1 && insertedMasteryRows[0].school_code === "cjsh" && insertedMasteryRows[0].semester_code === "g2s1");

  AHS.WrongBookRuntime.reset();
  return AHS.WrongBookRuntime.pullFromRepository();
}).then(function (pullResult) {
  check("pullFromRepository() 只真的下載回目前學期（g2s1）的那一筆，不是全部下載回來再顯示", pullResult.pulled === 1);
  var list = AHS.WrongBookRuntime.list();
  check("下載回來的錯題，確實是「高二上」那一筆", list.some(function (r) { return r.knowledgePoint === "kp150_g2s1"; }));
  check("「高一下」那一筆真實被查詢過濾擋下，沒有混進高二上的畫面（這正是使用者回報「目前於高二年級卻看到高一知識弱點」的真正根因）", !list.some(function (r) { return r.knowledgePoint === "kp150_g1s2"; }));

  AHS.SupabaseClient.isConfigured = originalIsConfigured;
  AHS.SupabaseClient.getSession = originalGetSession;
  AHS.RepositoryFactory.create = originalRepositoryFactoryCreate;
  AHS.WorkspaceRuntime.logout();
  AHS.WrongBookRuntime.reset();
  AHS.KnowledgeMasteryRuntime.reset();

  console.log("\nRuntimeSyncRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail === 0 ? 0 : 1);
}).catch(function (err) {
  console.error("RuntimeSyncRegression crashed:", err);
  process.exit(1);
});
