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
    if (!skipDefaultLogin) {
      await page.addInitScript((ws) => {
        window.sessionStorage.setItem("ahs:workspace", JSON.stringify(ws));
      }, AHS_TEST_WORKSPACE);
    }
    await use(page);
  }
});

module.exports = { test, expect: base.expect, AHS_TEST_WORKSPACE, AHS_TEST_NS };
