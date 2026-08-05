/* playwright/helpers/seed.js — Sprint AI-116 AI-116-01/AI-116-04.
   Seeds real sessionStorage state before a page's own scripts run
   (page.addInitScript fires on every subsequent navigation in this
   context, before any in-page <script>), the exact same
   "ahs:<key>" -> JSON convention js/core/PersistenceAdapter.js already
   uses and every jsdom regression test (tests/jsdom/BehaviorSuite.js,
   tests/regression/*.js) already seeds with — same schema, same
   discipline, just driven through a real browser instead of jsdom this
   time. Never fabricates content beyond what those already-proven
   schemas describe.

   Sprint AI-119 (Platform Core Baseline): AHS.PersistenceAdapter now
   namespaces every save()/load()/remove() under the active Workspace's
   storage namespace. Every existing caller of seedSession() hands over
   bare legacy keys ("ahs:materialRuntime", etc.) — rather than rewrite
   every call site, this transparently namespaces each bare key to match
   playwright/helpers/fixtures.js's own default test Workspace,
   idempotently (an already-namespaced key, e.g. carried forward from a
   previous real page's own writes, passes through unchanged). */
"use strict";

const AHS_TEST_NS = "student_a__cjsh__g1s2";

async function seedSession(page, data) {
  await page.addInitScript((args) => {
    var seedData = args.seedData;
    var ns = args.ns;
    function namespacedKey(k) {
      if (k === "ahs:workspace") { return k; }
      var nsPrefix = "ahs:" + ns + ":";
      if (k.indexOf(nsPrefix) === 0) { return k; }
      if (k.indexOf("ahs:") === 0) { return "ahs:" + ns + ":" + k.slice(4); }
      return k;
    }
    Object.keys(seedData).forEach((k) => {
      window.sessionStorage.setItem(namespacedKey(k), JSON.stringify(seedData[k]));
    });
  }, { seedData: data, ns: AHS_TEST_NS });
}

module.exports = { seedSession };
