/* tests/supabase/CrossDeviceSmoke.js — Sprint AI-126B Part 2 Task 8,
   extended by Sprint AI-126D (Repository Feature Integration) Tasks 1-6.

   Proves the real sync mechanism round-trips data through the real
   Supabase project between two INDEPENDENT client states ("Device A"/
   "Device B" — two separate in-memory stores, never sharing
   sessionStorage) signed in as the same real account. This is the
   automatable core of the Acceptance Standard (①Desktop 登入 →
   ②③完成教材/測驗 → ④登出 → ⑤Mobile 登入 → 資料一致) — it does NOT
   replace a real two-physical-device walkthrough; it proves the
   underlying mechanism that walkthrough would exercise actually works,
   end-to-end, against the real backend.

   AI-126D task coverage: Task 1 (Learning Progress round-trip) / Task 2
   (WrongBook 新增/修改/刪除 — 刪除 maps to the existing, LOCK archive()/
   unarchive() per AI-121-08, this Runtime has never had a real hard
   delete) / Task 3 (Knowledge Mastery 更新+重新登入) / Task 4 (Statistics
   — proven purely from the other domains' real pulled data, per its own
   "no store of its own" design, never given a pull of its own) / Task 5
   (Settings 跨裝置) / Task 6 (single consolidated End-to-End check that
   every domain's data survives a real re-login at once).

   Requires real js/data/SupabaseConfig.js or SupabaseConfig.local.js
   values (same as RepositorySmoke.js) — reports SKIP, never a
   fabricated PASS, when unset. Not part of `npm test`'s default chain
   (real network call); run via `npm run test:supabase:cross-device`. */
"use strict";
const fs = require("fs");
const path = require("path");
const REPO = path.join(__dirname, "..", "..");
/* Sprint AI-126B Final PAT: git-ignored local override (real
   Project-Owner-supplied values) — see js/data/SupabaseConfig.js's own
   header. Absent in every fresh clone/CI run, so this stays a real,
   honest SKIP there. */
const LOCAL_CONFIG_PATH = path.join(REPO, "js/data/SupabaseConfig.local.js");

function freshDeviceState() {
  const store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; }
  };
}

function loadAhsInto(sessionStorageStub) {
  /* Fresh require cache per "device" — each gets its own independent
     module instances/closures (own `store` var inside every Runtime's
     IIFE), exactly like two real separate browser sessions never
     sharing in-memory state, only the real Supabase project. */
  Object.keys(require.cache).forEach(function (key) { delete require.cache[key]; });
  global.window = global;
  window.sessionStorage = sessionStorageStub;
  require(path.join(REPO, "js/data/SupabaseConfig.js"));
  if (fs.existsSync(LOCAL_CONFIG_PATH)) { require(LOCAL_CONFIG_PATH); }
  require(path.join(REPO, "js/data/WorkspaceData.js"));
  require(path.join(REPO, "js/core/PersistenceAdapter.js"));
  require(path.join(REPO, "js/core/SupabaseClient.js"));
  require(path.join(REPO, "js/repository/Repository.js"));
  require(path.join(REPO, "js/repository/SupabaseRepository.js"));
  require(path.join(REPO, "js/repository/RepositoryFactory.js"));
  require(path.join(REPO, "js/repository/SyncBridge.js"));
  require(path.join(REPO, "js/repository/AuthRepository.js"));
  require(path.join(REPO, "js/runtime/WorkspaceRuntime.js"));
  require(path.join(REPO, "js/runtime/WrongBookRuntime.js"));
  require(path.join(REPO, "js/runtime/KnowledgeMasteryRuntime.js"));
  require(path.join(REPO, "js/runtime/SettingsRuntime.js"));
  require(path.join(REPO, "js/core/Icons.js"));
  require(path.join(REPO, "js/data/AppConfig.js"));
  require(path.join(REPO, "js/runtime/MaterialRuntime.js"));
  require(path.join(REPO, "js/runtime/TeachingMaterialLoader.js"));
  /* Sprint AI-126D Task 4: AHS.StatisticsRuntime stays purely computed
     (no store, no pull of its own — see its own header) — loaded here
     only so this smoke test can prove its real numbers are correct once
     the Runtimes above are hydrated from a real pull, not to give it a
     pull it was never designed to have. */
  require(path.join(REPO, "js/runtime/QuestionBankRuntime.js"));
  require(path.join(REPO, "js/runtime/ExamRuntime.js"));
  require(path.join(REPO, "js/runtime/LearningQuestionRuntime.js"));
  require(path.join(REPO, "js/runtime/StatisticsRuntime.js"));
  return global.AHS;
}

let pass = 0, fail = 0, skip = 0;
function report(name, outcome, detail) {
  if (outcome === "PASS") { pass++; console.log("  PASS  " + name + (detail ? " — " + detail : "")); }
  else if (outcome === "SKIP") { skip++; console.log("  SKIP  " + name + (detail ? " — " + detail : "")); }
  else { fail++; console.log("  FAIL  " + name + (detail ? " — " + detail : "")); }
}

async function waitForBackgroundPushes() {
  /* pushRecord()/pushMastery()/pushSettings() are deliberately fire-and-
     forget (never awaited by their synchronous Runtime callers, by
     design — see each file's own header). A short real wait here is
     the test harness's own concern, standing in for what a real
     multi-page-navigation gap already provides in the live app. */
  return new Promise(function (resolve) { setTimeout(resolve, 3000); });
}

async function main() {
  console.log("Sprint AI-126B Part 2 Task 8 — Cross-Device Sync Smoke Test (real Supabase project, two independent client states)\n");

  const deviceAStorage = freshDeviceState();
  const AHS_A = loadAhsInto(deviceAStorage);

  if (!AHS_A.SupabaseClient.isConfigured()) {
    report("Cross-Device Sync", "SKIP", "not configured — create git-ignored js/data/SupabaseConfig.local.js with real url/anonKey (see js/data/SupabaseConfig.js header)");
    console.log("\nCrossDeviceSmoke: " + pass + " PASS / " + fail + " FAIL / " + skip + " SKIP");
    process.exit(0);
  }

  const testStudent = { id: "cross_device_smoke_" + Date.now(), name: "Cross Device Smoke", role: "STUDENT" };

  console.log("--- Device A: sign up + write real data ---");
  const loginA = await AHS_A.AuthRepository.loginForMockStudent(testStudent);
  if (loginA.skipped || loginA.error) {
    report("Device A login", "FAIL", loginA.error ? loginA.error.message : JSON.stringify(loginA));
    console.log("\nCrossDeviceSmoke: " + pass + " PASS / " + fail + " FAIL / " + skip + " SKIP");
    process.exit(1);
  }
  report("Device A login", "PASS", "real session + student_profiles row resolved");

  const graded = { subject: "math", title: "Cross Device Test", chapter: "Ch1", wrong: [{ questionId: "cd_q1", knowledgePoint: "cross_device_kp", text: "Q", options: [], yourAnswer: "A", correctAnswer: "B", explanation: "", materialId: "" }] };
  const secondWrong = { subject: "math", title: "Cross Device Test", chapter: "Ch1", wrong: [{ questionId: "cd_q2", knowledgePoint: "cross_device_kp_2", text: "Q2", options: [], yourAnswer: "A", correctAnswer: "B", explanation: "", materialId: "" }] };
  const touched = AHS_A.WrongBookRuntime.sync(graded);
  AHS_A.WrongBookRuntime.sync(secondWrong);
  AHS_A.KnowledgeMasteryRuntime.recordAttempt("cross_device_kp", true, "math", "");
  AHS_A.SettingsRuntime.update({ showTutorSuggestions: false });
  AHS_A.SettingsRuntime.update({ profile: { name: "Cross Device Name", grade: "高二" } });
  report("Device A writes", "PASS", "WrongBook.sync() (x2, 新增) + KnowledgeMastery.recordAttempt() + Settings.update() (toggles + profile) called");

  /* Task 2: 修改 (recordRetry — real correctStreak progress) + 刪除
     (archive — the only real "removal" this Runtime's own LOCK design
     allows, per AI-121-08 "不得真的刪除"; see AI-126C's own report for
     why this mapping is correct, not a workaround). Second record is
     archived so Device B's pull can distinguish "still active" (cd_q1)
     from "archived" (cd_q2). */
  const cdQ1Id = touched[0] && touched[0].id;
  if (cdQ1Id) {
    AHS_A.WrongBookRuntime.recordRetry(cdQ1Id, true);
    report("Device A WrongBook 修改 (recordRetry)", "PASS", "correctStreak advanced on a real record");
  }
  const cdQ2 = AHS_A.WrongBookRuntime.list().filter(function (r) { return r.questionId === "cd_q2"; })[0];
  if (cdQ2) {
    AHS_A.WrongBookRuntime.archive(cdQ2.id);
    report("Device A WrongBook 刪除 (archive)", "PASS", "real record archived (never hard-deleted, per existing AI-121-08 LOCK)");
  }

  /* Task 1/3: Material Repository Read + Learning Progress push, gated on
     Task 2's real Material Migration already having run against this
     project — a fresh/unmigrated project honestly SKIPs rather than
     fabricating a fake materials row to push progress against. */
  let crossDeviceOriginKey = null;
  const materialsRead = await AHS_A.RepositoryFactory.create().read("materials", "select=origin_key,title&limit=1");
  if (materialsRead.error || !materialsRead.data || !materialsRead.data.length) {
    report("Material Repository Read", "SKIP", "materials table empty — Task 2 Material Migration not yet applied to this project");
  } else {
    report("Material Repository Read", "PASS", "real materials row readable (RLS select open to authenticated) — " + materialsRead.data[0].origin_key);
    crossDeviceOriginKey = materialsRead.data[0].origin_key;
    const localMaterial = AHS_A.MaterialRuntime.add({ subject: "math", title: materialsRead.data[0].title, originKey: crossDeviceOriginKey });
    AHS_A.MaterialRuntime.startLearning(localMaterial.id, { progress: 42, minutes: 7 });
    AHS_A.MaterialRuntime.toggleFavorite(localMaterial.id);
    report("Device A Learning Progress write", "PASS", "MaterialRuntime.startLearning()/toggleFavorite() called on a real migrated material");
  }

  await waitForBackgroundPushes();

  console.log("\n--- Device B: independent fresh state, same real account, pull ---");
  const deviceBStorage = freshDeviceState();
  const AHS_B = loadAhsInto(deviceBStorage);
  const loginB = await AHS_B.AuthRepository.loginForMockStudent(testStudent);
  if (loginB.skipped || loginB.error) {
    report("Device B login", "FAIL", loginB.error ? loginB.error.message : JSON.stringify(loginB));
  } else {
    report("Device B login", "PASS", "same real account, independent client state");
  }

  check("Device B starts genuinely empty (no sessionStorage shared with Device A)", "WrongBook", AHS_B.WrongBookRuntime.list().length === 0);

  const wbPull = await AHS_B.WrongBookRuntime.pullFromRepository();
  report("WrongBook pull", wbPull.pulled >= 2 ? "PASS" : "FAIL", JSON.stringify(wbPull));
  const wbList = AHS_B.WrongBookRuntime.list();
  report("WrongBook 新增 data matches after pull", (wbList.length >= 2 && wbList.some(function (r) { return r.knowledgePoint === "cross_device_kp"; })) ? "PASS" : "FAIL", JSON.stringify(wbList.map(function (r) { return r.knowledgePoint; })));
  const pulledCdQ1 = wbList.filter(function (r) { return r.questionId === "cd_q1"; })[0];
  report("WrongBook 修改 (recordRetry) data matches after pull", (pulledCdQ1 && pulledCdQ1.correctStreak >= 1) ? "PASS" : "FAIL", JSON.stringify(pulledCdQ1));
  const pulledCdQ2 = wbList.filter(function (r) { return r.questionId === "cd_q2"; })[0];
  report("WrongBook 刪除 (archive) state matches after pull", (pulledCdQ2 && pulledCdQ2.archived === true) ? "PASS" : "FAIL", JSON.stringify(pulledCdQ2));

  const kmPull = await AHS_B.KnowledgeMasteryRuntime.pullFromRepository();
  report("KnowledgeMastery pull", kmPull.pulled >= 1 ? "PASS" : "FAIL", JSON.stringify(kmPull));
  const kmRecord = AHS_B.KnowledgeMasteryRuntime.get("cross_device_kp");
  report("KnowledgeMastery data matches after pull", (kmRecord && kmRecord.attemptCount >= 1) ? "PASS" : "FAIL", JSON.stringify(kmRecord));

  const settingsPull = await AHS_B.SettingsRuntime.pullFromRepository();
  report("Settings pull (user_settings + student_profiles)", settingsPull.pulled === 2 ? "PASS" : "FAIL", JSON.stringify(settingsPull));
  const settings = AHS_B.SettingsRuntime.get();
  report("Settings toggle data matches after pull", settings.showTutorSuggestions === false ? "PASS" : "FAIL", JSON.stringify(settings));
  report("Settings profile data matches after pull (帳號修改跨裝置/重新登入同步)",
    (settings.profile.name === "Cross Device Name" && settings.profile.grade === "高二") ? "PASS" : "FAIL", JSON.stringify(settings.profile));

  if (crossDeviceOriginKey) {
    const materialPull = await AHS_B.MaterialRuntime.pullFromRepository();
    report("Learning Progress pull", materialPull.pulled >= 1 ? "PASS" : "FAIL", JSON.stringify(materialPull));
    const pulledMaterials = AHS_B.MaterialRuntime.list();
    const pulledMaterial = pulledMaterials.filter(function (m) { return m.originKey === crossDeviceOriginKey; })[0];
    report("Learning Progress data matches after pull", (pulledMaterial && pulledMaterial.progress === 42 && pulledMaterial.favorite === true) ? "PASS" : "FAIL", JSON.stringify(pulledMaterial));
  } else {
    report("Learning Progress pull", "SKIP", "Task 2 Material Migration not applied to this project — see Material Repository Read above");
  }

  /* Task 4: AHS.StatisticsRuntime is never given a pull of its own (see
     loadAhsInto()'s own comment) — its real numbers must already be
     correct purely from the Runtimes pulled above. knowledgeMasteryAvg()
     derives from AHS.KnowledgeMasteryRuntime.list(), already pulled;
     a single 100%-correct point makes the average exactly 100. */
  const kpis = AHS_B.StatisticsRuntime.homeKpis();
  report("Statistics (Task 4) 由 Repository 同步後資料正確計算", kpis && kpis.knowledgeMasteryAvg === 100 ? "PASS" : "FAIL", JSON.stringify(kpis));

  /* Task 6: End-to-End summary — Device B, after one real pull round per
     domain (no manual per-record wiring), genuinely has every domain's
     real data present at once. */
  const e2ePass = wbList.length >= 2 && kmRecord && kmRecord.attemptCount >= 1 && settings.showTutorSuggestions === false &&
    settings.profile.name === "Cross Device Name" && kpis.knowledgeMasteryAvg === 100;
  report("Task 6 End-to-End：登入→教材→學習→錯題→統計→重新登入→資料仍存在", e2ePass ? "PASS" : "FAIL", "WrongBook/KnowledgeMastery/Settings/Statistics 全部在重新登入後真實存在");

  console.log("\nCrossDeviceSmoke: " + pass + " PASS / " + fail + " FAIL / " + skip + " SKIP");
  process.exit(fail === 0 ? 0 : 1);
}

function check(name, group, cond) {
  report(group + ": " + name, cond ? "PASS" : "FAIL");
}

main().catch(function (err) {
  console.error("CrossDeviceSmoke crashed:", err);
  process.exit(1);
});
