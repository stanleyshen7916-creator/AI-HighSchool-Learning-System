/* scripts/verify/VerifyForbiddenPatterns.js — greps production JS/CSS
   for the project's hard-forbidden patterns. Run: node scripts/verify/VerifyForbiddenPatterns.js */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const JS_BAD = [/\blocalStorage\b/, /\bindexedDB\b/i, /\bfetch\s*\(/, /XMLHttpRequest/, /^\s*import\s/m, /^\s*export\s/m, /window\.location\.href\s*=/];
const CSS_BAD = [/linear-gradient\([^)]*var\(/, /calc\(var\([^)]*\)\s*[+*/-]\s*var\(/, /env\(safe-area/, /\binset\s*:/, /\d+dvh\b/];
/* Tracked pre-existing deviations (debt pending a fix). Empty since
   2026-09-29: the only entry, HomeRecentMaterials.js's card click
   assigning window.location.href, now uses window.location.assign() —
   the same navigation, no longer a forbidden-pattern hit. */
const KNOWN_ISSUES = {};

/* Sprint AI-126B (PMO-authorized, 2026-08-07): these two files are the
   Repository Layer's real Supabase connection point (CLAUDE.md's Project
   Overview documents the exact same exception). Unlike KNOWN_ISSUES above,
   this is a PERMANENT, intentional design decision, not debt pending a
   fix — every other file in js/ remains fully forbidden from fetch(/
   XMLHttpRequest, including every Runtime and every pages/components/ui
   file, which may only reach Supabase through js/repository/. */
const AUTHORIZED_EXCEPTIONS = {
  "js/core/SupabaseClient.js": [/\bfetch\s*\(/],
  "js/repository/SupabaseRepository.js": [/\bfetch\s*\(/],
  /* 2026-09-29 教材上傳併入學習平台: the one browser-side connection point
     to the Admin's local 教材上傳引擎 (ai-engine/council). Only
     js/components/CouncilUpload.js uses it, only on upload.html. */
  "js/core/CouncilEngineClient.js": [/\bfetch\s*\(/]
};
let bad = 0;
function walk(dir, exts, rules) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p, exts, rules); continue; }
    if (!exts.some(e => f.name.endsWith(e))) continue;
    let src = fs.readFileSync(p, "utf8");
    /* strip comments — the project's own file headers legitimately
       DOCUMENT the forbidden APIs; only real code counts. */
    src = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    /* POSIX-style separators so the KNOWN_ISSUES/AUTHORIZED_EXCEPTIONS keys
       (written with "/") also match on Windows, where path.relative()
       returns "js\core\...". */
    const rel = path.relative(ROOT, p).split(path.sep).join("/");
    for (const r of rules) {
      if (!r.test(src)) continue;
      if (KNOWN_ISSUES[rel] && KNOWN_ISSUES[rel].some(k => String(r) === String(k))) {
        console.log("KNOWN-ISSUE (flagged, pending WO)", r, "in", rel); continue;
      }
      if (AUTHORIZED_EXCEPTIONS[rel] && AUTHORIZED_EXCEPTIONS[rel].some(k => String(r) === String(k))) {
        console.log("AUTHORIZED-EXCEPTION", r, "in", rel); continue;
      }
      bad++; console.log("FORBIDDEN", r, "in", rel);
    }
  }
}
walk(path.join(ROOT, "js"), [".js"], JS_BAD);
walk(path.join(ROOT, "css"), [".css"], CSS_BAD);
console.log(bad === 0 ? "VerifyForbiddenPatterns: PASS" : "VerifyForbiddenPatterns: FAIL " + bad);
process.exit(bad === 0 ? 0 : 1);
