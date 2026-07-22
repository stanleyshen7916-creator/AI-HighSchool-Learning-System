/* scripts/maintenance/DetectCaseRenames.js — EO-S7.0-HOTFIX-001.
   Root cause of the GitHub Pages white page: v2.1 renamed four files by
   CASE ONLY (ui.js -> UI.js, quote.js -> Quote.js, greeting.js ->
   Greeting.js, countdown.js -> Countdown.js). Git on a case-insensitive
   filesystem (Windows / default macOS) does not register case-only
   renames, so the remote kept the old lowercase files while index.html
   requests the new PascalCase paths — GitHub Pages is case-sensitive
   => 404 => AHS.UI undefined => every component's `el` crash => white
   page.

   Run this INSIDE the local git clone before pushing:
       node scripts/maintenance/DetectCaseRenames.js
   It compares `git ls-files` (what the remote/index believes) against
   the working tree's real names and prints the exact fix commands.
   It performs NO git operations itself. */
const { execSync } = require("child_process");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let tracked;
try {
  tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
} catch (e) {
  console.log("Not a git clone (or git unavailable) — run inside the repository clone.");
  process.exit(1);
}
const realNames = new Map(); // lowercase path -> actual on-disk path
(function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === ".git" || f.name === "node_modules") continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else {
      const rel = path.relative(ROOT, p).split(path.sep).join("/");
      realNames.set(rel.toLowerCase(), rel);
    }
  }
})(ROOT);
/* Only CASE mismatches matter here: plain deletions/additions are
   handled fine by `git add -A`; case-only renames are the one thing a
   case-insensitive filesystem silently swallows. */
const fixes = [];
for (const t of tracked) {
  const real = realNames.get(t.toLowerCase());
  if (real && real !== t) fixes.push({ tracked: t, real });
}
if (!fixes.length) {
  console.log("DetectCaseRenames: PASS — git index matches working-tree filenames exactly.");
  process.exit(0);
}
console.log("Case-only renames NOT registered by git:\n");
for (const f of fixes) {
  console.log(`  ${f.tracked}  ->  ${f.real}`);
}
console.log("\nFix (run once, then commit & push):");
console.log("  git config core.ignorecase false");
for (const f of fixes) {
  console.log(`  git mv -f "${f.tracked}" "${f.real}"`);
}
console.log("  （若 git mv -f 失敗，改用兩段式：git mv 舊名 暫名 && git mv 暫名 新名）");
console.log('  git commit -m "fix: register case-only renames (EO-S7.0-HOTFIX-001)"');
process.exit(2);
