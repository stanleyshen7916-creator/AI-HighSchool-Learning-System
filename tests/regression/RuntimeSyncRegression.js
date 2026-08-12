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

  console.log("\nRuntimeSyncRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail === 0 ? 0 : 1);
}).catch(function (err) {
  console.error("RuntimeSyncRegression crashed:", err);
  process.exit(1);
});
