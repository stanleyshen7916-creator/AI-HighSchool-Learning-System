/* tests/regression/RepositoryLayerRegression.js — Sprint AI-126B.
   Structural regression for js/repository/ + js/core/SupabaseClient.js —
   proves the interface/factory/delegation wiring is real, without making
   any real network call (that's tests/supabase/RepositorySmoke.js's job,
   run separately via `npm run test:supabase`, never part of this chain).
   Run: node tests/regression/RepositoryLayerRegression.js */
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

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

console.log("[1] AHS.Repository — abstract interface throws on every unimplemented method");
const base = new AHS.Repository();
["connect", "login", "logout", "getSession", "read", "insert", "update", "delete"].forEach(function (method) {
  let threw = false;
  try { base[method](); } catch (e) { threw = /not implemented/.test(e.message); }
  check("base.\"" + method + "\"() throws \"not implemented\"", threw);
});

console.log("\n[2] AHS.SupabaseRepository — real prototype chain, overrides every method");
const repo = new AHS.SupabaseRepository();
check("repo instanceof AHS.Repository", repo instanceof AHS.Repository);
check("repo instanceof AHS.SupabaseRepository", repo instanceof AHS.SupabaseRepository);
["connect", "login", "logout", "getSession", "read", "insert", "update", "delete"].forEach(function (method) {
  check("repo.\"" + method + "\" overridden (not the base's notImplemented)", typeof repo[method] === "function" && repo[method] !== AHS.Repository.prototype[method]);
});

console.log("\n[3] AHS.RepositoryFactory — provider switch, real Local/Supabase-swappable design");
check("create() default returns a real AHS.SupabaseRepository instance", AHS.RepositoryFactory.create() instanceof AHS.SupabaseRepository);
check("create(\"supabase\") explicit returns a real AHS.SupabaseRepository instance", AHS.RepositoryFactory.create("supabase") instanceof AHS.SupabaseRepository);
let unknownThrew = false;
try { AHS.RepositoryFactory.create("nonexistent-provider"); } catch (e) { unknownThrew = /unknown provider/.test(e.message); }
check("create(\"nonexistent-provider\") throws (proves it's a real switch, not a silent fallback)", unknownThrew);

console.log("\n[4] AHS.SupabaseRepository really delegates to AHS.SupabaseClient (not just returning canned values)");
const originalRead = AHS.SupabaseClient.read;
let sawTable = null, sawQuery = null;
AHS.SupabaseClient.read = function (table, query) { sawTable = table; sawQuery = query; return Promise.resolve({ data: [{ spy: true }], error: null }); };
repo.read("subjects", "code=eq.math").then(function (result) {
  check("repo.read(table, query) forwards the exact same arguments to SupabaseClient.read", sawTable === "subjects" && sawQuery === "code=eq.math");
  check("repo.read(...) returns exactly what SupabaseClient.read resolved (no re-wrapping)", result.data[0].spy === true);
  AHS.SupabaseClient.read = originalRead;

  console.log("\n[5] Ships with SupabaseConfig intentionally blank — never fabricated/guessed credentials");
  check("AHS.SupabaseConfig.url is empty (Project Owner has not supplied it yet)", AHS.SupabaseConfig.url === "");
  check("AHS.SupabaseConfig.anonKey is empty (Project Owner has not supplied it yet)", AHS.SupabaseConfig.anonKey === "");
  check("AHS.SupabaseClient.isConfigured() honestly reports false while blank", AHS.SupabaseClient.isConfigured() === false);

  console.log("\n[6] Sprint AI-126B Final PAT — git-ignored SupabaseConfig.local.js override precedence (in-memory only, no file touched)");
  check("AHS.SupabaseConfigLocal is undefined by default (no local file present in this test run)", AHS.SupabaseConfigLocal === undefined);
  AHS.SupabaseConfigLocal = { url: "https://local-override-test.supabase.co", anonKey: "local-anon-key" };
  check("SupabaseClient.isConfigured() becomes true once a real-looking local override is set", AHS.SupabaseClient.isConfigured() === true);
  AHS.SupabaseConfigLocal = { url: "", anonKey: "" };
  check("A local override with a blank url does NOT take priority (falls back to AHS.SupabaseConfig, still blank)", AHS.SupabaseClient.isConfigured() === false);
  delete AHS.SupabaseConfigLocal;
  check("Removing the local override restores the exact same blank-config behavior as before", AHS.SupabaseClient.isConfigured() === false);
  check("AHS.SupabaseConfig itself is untouched by the local-override mechanism (still the committed blank placeholder)", AHS.SupabaseConfig.url === "" && AHS.SupabaseConfig.anonKey === "");

  console.log("\nRepositoryLayerRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail === 0 ? 0 : 1);
});
