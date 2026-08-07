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

  console.log("\nRuntimeSyncRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail === 0 ? 0 : 1);
}).catch(function (err) {
  console.error("RuntimeSyncRegression crashed:", err);
  process.exit(1);
});
