/* playwright/helpers/seed.js — Sprint AI-116 AI-116-01/AI-116-04.
   Seeds real sessionStorage state before a page's own scripts run
   (page.addInitScript fires on every subsequent navigation in this
   context, before any in-page <script>), the exact same
   "ahs:<key>" -> JSON convention js/core/PersistenceAdapter.js already
   uses and every jsdom regression test (tests/jsdom/BehaviorSuite.js,
   tests/regression/*.js) already seeds with — same schema, same
   discipline, just driven through a real browser instead of jsdom this
   time. Never fabricates content beyond what those already-proven
   schemas describe. */
"use strict";

async function seedSession(page, data) {
  await page.addInitScript((seedData) => {
    Object.keys(seedData).forEach((k) => {
      window.sessionStorage.setItem(k, JSON.stringify(seedData[k]));
    });
  }, data);
}

module.exports = { seedSession };
