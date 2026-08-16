/* playwright/helpers/fixtures.js — Sprint AI-119 (Platform Core Baseline).

   AHS.AppShell.create() now redirects to login.html (rendering nothing)
   unless AHS.WorkspaceRuntime has an active Workspace, and
   AHS.PersistenceAdapter namespaces every save()/load()/remove() under
   it. Every pre-existing spec in this suite predates Login/Workspace
   and isn't about testing either, so — same discipline as
   tests/jsdom/BehaviorSuite.js's own loadPage() fix — this extends
   Playwright's own `test` with a `page` fixture that transparently
   seeds ONE fixed default test Workspace via page.addInitScript()
   before ANY spec's own code runs, on every navigation, for every test
   in every spec file. Specs that explicitly test the logged-out/Login
   flow itself (see the new workspace.spec.js) opt out via
   test.use({ skipDefaultLogin: true }). */
"use strict";
const base = require("@playwright/test");

const AHS_TEST_WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] };
const AHS_TEST_NS = "student_a__cjsh__g1s2";

const test = base.test.extend({
  skipDefaultLogin: [false, { option: true }],
  page: async ({ page, skipDefaultLogin }, use) => {
    /* Sprint AI-142: js/data/SupabaseConfig.js now ships real, committed
       Project Owner-supplied credentials (GitHub Pages has no other way
       to reach a real Supabase project). Playwright drives a real
       Chromium — unlike jsdom, it has a real fetch — so every spec in
       this suite would otherwise fire real requests at the live
       production Supabase project on every run. This suite is a UI/
       behavior regression suite for a Mock-Student prototype, not an
       integration test against production data (that's tests/supabase/
       *.js's own, separately-gated job via `npm run test:supabase`) —
       block the real project's domain here, once, for every test, so
       specs stay fast/offline/deterministic and never write real rows
       into the live database. */
    /* fulfill() with a 2xx, not abort()/a non-2xx: Chromium itself logs a
       "Failed to load resource" console message for ANY failed or
       non-OK resource load — regardless of whether the app's own JS
       catches it — which would trip every spec's own "Console errors =
       0" assertion. `[]` is exactly the shape js/core/SupabaseClient.js's
       parseResponse() already expects for a real, ordinary "no rows"
       PostgREST reply (every read()/insert() caller already treats an
       empty result array as a normal, un-crashing case), and every Auth
       call here only ever branches on `result.data.access_token`, which
       an array doesn't have — so no real request ever leaves the
       browser, and every caller behaves exactly as if the real project
       had nothing to return, without a single console error. */
    await page.route("https://*.supabase.co/**", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]"
    }));
    if (!skipDefaultLogin) {
      await page.addInitScript((ws) => {
        window.sessionStorage.setItem("ahs:workspace", JSON.stringify(ws));
      }, AHS_TEST_WORKSPACE);
    }
    await use(page);
  }
});

module.exports = { test, expect: base.expect, AHS_TEST_WORKSPACE, AHS_TEST_NS };
