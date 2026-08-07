/* tests/supabase/RepositorySmoke.js — Sprint AI-126B Task 4, Repository
   Smoke Test. Proves Connect / Login / Read / Insert / Update / Delete
   against the REAL Supabase project via the real Repository Layer —
   never mocked, never simulated. Requires js/data/SupabaseConfig.js to
   hold real SUPABASE_URL/SUPABASE_ANON_KEY; without them every check
   below reports SKIP (not-configured), never a fabricated PASS.

   Deliberately NOT part of `npm test`'s default chain (package.json's
   "test" script is unchanged) — this is the one test in the repository
   that makes a real network call to a real external service, so it runs
   only on demand (`npm run test:supabase`), keeping the existing CI gate
   (which has never made a real network call) completely unaffected.

   Uses plain Node, not jsdom: the files under test attach to `window.AHS`
   in a browser, so this harness stubs a minimal `window` (+ an in-memory
   sessionStorage, so AHS.PersistenceAdapter's real, unmodified save/load
   actually round-trips — proving Session Restore for real, not assuming
   it) rather than rendering an HTML page, since there is no UI here to
   render (Sprint AI-126B builds no UI).

   Test data flow (all against the real Supabase project, all cleaned up
   at the end): sign up (or log back in as) a throwaway smoke-test user
   -> insert that user's own student_profiles row (owner-writable per
   RLS) -> read it back -> update it -> delete it. This proves real
   Connect/Login/CRUD using only SUPABASE_URL/SUPABASE_ANON_KEY — no
   separately-provisioned test account or admin credential required. */
"use strict";
const path = require("path");
const REPO = path.join(__dirname, "..", "..");

/* --- minimal browser-global stub (no jsdom — see header) --- */
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

let pass = 0, fail = 0, skip = 0;
function report(name, outcome, detail) {
  if (outcome === "PASS") { pass++; console.log("  PASS  " + name + (detail ? " — " + detail : "")); }
  else if (outcome === "SKIP") { skip++; console.log("  SKIP  " + name + (detail ? " — " + detail : "")); }
  else { fail++; console.log("  FAIL  " + name + (detail ? " — " + detail : "")); }
}

async function main() {
  console.log("Sprint AI-126B Task 4 — Repository Smoke Test (real Supabase project, not mocked)\n");

  const repo = AHS.RepositoryFactory.create();

  if (!AHS.SupabaseClient.isConfigured()) {
    report("Connect", "SKIP", "AHS.SupabaseConfig.url/anonKey empty — Project Owner has not provided real values yet");
    report("Login", "SKIP", "not-configured");
    report("Read", "SKIP", "not-configured");
    report("Insert", "SKIP", "not-configured");
    report("Update", "SKIP", "not-configured");
    report("Delete", "SKIP", "not-configured");
    console.log("\nSupabaseRepositorySmoke: " + pass + " PASS / " + fail + " FAIL / " + skip + " SKIP");
    console.log("Cannot report Connect/Login/CRUD as PASS without real credentials — see js/data/SupabaseConfig.js.");
    process.exit(0);
  }

  const connectResult = await repo.connect();
  report("Connect", connectResult && connectResult.connected ? "PASS" : "FAIL", JSON.stringify(connectResult));

  const testEmail = "ai126b-smoke-" + Date.now() + "@example.com";
  const testPassword = "Ai126bSmoke!" + Date.now();

  let loginResult = await repo.login(testEmail, testPassword);
  if (loginResult.error) {
    /* No existing account with this (fresh, timestamped) email — sign up instead. */
    const signUpResult = await AHS.SupabaseClient.signUp(testEmail, testPassword);
    if (signUpResult.error) {
      report("Login", "FAIL", signUpResult.error.message);
    } else if (signUpResult.data && signUpResult.data.access_token) {
      report("Login", "PASS", "via signUp (fresh smoke-test account, real session token issued)");
      loginResult = signUpResult;
    } else {
      report("Login", "SKIP", "Signed up but no session returned — this Supabase project likely has \"Confirm email\" enabled in Auth settings; Read/Insert/Update/Delete below cannot run without a real session. Project Owner: disable email confirmation for this smoke test, or provide a pre-confirmed test account.");
      console.log("\nSupabaseRepositorySmoke: " + pass + " PASS / " + fail + " FAIL / " + skip + " SKIP");
      process.exit(fail === 0 ? 0 : 1);
    }
  } else {
    report("Login", "PASS", "real session token issued");
  }

  const restoredSession = repo.getSession();
  report("Session Restore", restoredSession && restoredSession.access_token ? "PASS" : "FAIL", "AHS.PersistenceAdapter round-trip");

  const userId = loginResult.data.user && loginResult.data.user.id;
  if (!userId) {
    report("Read/Insert/Update/Delete", "FAIL", "no user id in session — cannot build a student_profiles row");
  } else {
    const insertResult = await repo.insert("student_profiles", {
      user_id: userId,
      mock_student_key: "ai126b_smoke_" + Date.now(),
      display_name: "AI-126B Smoke Test",
      grade: "smoke-test"
    });
    if (insertResult.error || !insertResult.data || !insertResult.data[0]) {
      report("Insert", "FAIL", insertResult.error ? insertResult.error.message : "no row returned");
    } else {
      report("Insert", "PASS", "student_profiles row created");
      const profileId = insertResult.data[0].id;

      const readResult = await repo.read("student_profiles", "id=eq." + profileId);
      report("Read", (!readResult.error && readResult.data && readResult.data.length === 1) ? "PASS" : "FAIL", readResult.error ? readResult.error.message : JSON.stringify(readResult.data));

      const updateResult = await repo.update("student_profiles", "id=eq." + profileId, { display_name: "AI-126B Smoke Test (updated)" });
      report("Update", (!updateResult.error && updateResult.data && updateResult.data[0] && updateResult.data[0].display_name === "AI-126B Smoke Test (updated)") ? "PASS" : "FAIL", updateResult.error ? updateResult.error.message : JSON.stringify(updateResult.data));

      const deleteResult = await repo.delete("student_profiles", "id=eq." + profileId);
      report("Delete", !deleteResult.error ? "PASS" : "FAIL", deleteResult.error ? deleteResult.error.message : "row deleted");
    }
  }

  await repo.logout();

  console.log("\nSupabaseRepositorySmoke: " + pass + " PASS / " + fail + " FAIL / " + skip + " SKIP");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(function (err) {
  console.error("SupabaseRepositorySmoke crashed:", err);
  process.exit(1);
});
