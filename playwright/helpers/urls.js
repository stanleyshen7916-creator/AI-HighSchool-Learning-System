/* playwright/helpers/urls.js — Sprint AI-116 AI-116-01.
   Resolves every root HTML page to a real file:// URL, the same access
   mode CLAUDE.md requires this static prototype to keep working under
   ("must keep working over file:// and on GitHub Pages") — no dev
   server is started for these tests, matching this repository's own
   "no build/dev-server script by design" convention. */
"use strict";
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..", "..");

const PAGES = {
  home: "index.html",
  materials: "materials.html",
  quiz: "quiz.html",
  wrongbook: "wrongbook.html",
  summary: "summary.html",
  review: "review.html",
  learning: "learning.html",
  tutor: "tutor.html",
  dashboard: "dashboard.html"
};

function fileUrl(pageKeyOrFile) {
  const file = PAGES[pageKeyOrFile] || pageKeyOrFile;
  return "file://" + path.join(REPO_ROOT, file);
}

module.exports = { REPO_ROOT, PAGES, fileUrl };
