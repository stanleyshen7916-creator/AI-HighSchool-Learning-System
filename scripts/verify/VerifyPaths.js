/* scripts/verify/VerifyPaths.js — Repository Structure v2.1 (LOCK)
   audit tool: every local src/href in every root HTML page, plus every
   Qiaoqiao-constructed image path, must resolve to a real file. Also
   fails on references to pre-v2.0 paths. Run: node scripts/verify/VerifyPaths.js */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let bad = 0;
const LEGACY = ["js/services/", "css/layout/", "assets/illustrations/", "archive/", "prototype/", "developer/"];

/* AI Supabase Persistence Root Cause Fix (Root Cause A): the one, single
   git-ignored file (.gitignore) every page's own <script> tag optionally
   references — js/data/SupabaseConfig.js's own header explains why it must
   never be committed on a Public repo. A real Project Owner deployment
   supplies it locally; CI/this Sandbox never has it, by design, so
   "MISSING" here is the expected, correct state, not a broken reference —
   every reader of this global (js/core/SupabaseClient.js's config()) already
   falls back to the committed blank AHS.SupabaseConfig when it 404s in a
   real browser. Do not add further entries here for anything that is not
   itself already documented as git-ignored-by-design. */
const OPTIONAL_GITIGNORED = ["js/data/SupabaseConfig.local.js"];

for (const html of fs.readdirSync(ROOT).filter(f => f.endsWith(".html"))) {
  const src = fs.readFileSync(path.join(ROOT, html), "utf8");
  for (const m of src.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    const ref = m[1];
    if (/^https?:/.test(ref)) continue;
    const target = ref.split("?")[0];
    if (OPTIONAL_GITIGNORED.includes(target)) continue;
    if (!fs.existsSync(path.join(ROOT, target))) { bad++; console.log("MISSING", html, "->", ref); }
    if (LEGACY.some(l => ref.indexOf(l) === 0)) { bad++; console.log("LEGACY PATH", html, "->", ref); }
  }
}
global.window = global; global.AHS = {};
require("vm").runInThisContext(fs.readFileSync(path.join(ROOT, "js/core/Qiaoqiao.js"), "utf8"));
for (const k of AHS.Qiaoqiao.expressionKeys) {
  const p = /src="([^"]+)"/.exec(AHS.Qiaoqiao.bust(k))[1];
  if (!fs.existsSync(path.join(ROOT, p))) { bad++; console.log("MISSING IMG", p); }
}
for (const k of AHS.Qiaoqiao.poseKeys) {
  const p = /src="([^"]+)"/.exec(AHS.Qiaoqiao.full(k))[1];
  if (!fs.existsSync(path.join(ROOT, p))) { bad++; console.log("MISSING IMG", p); }
}
console.log(bad === 0 ? "VerifyPaths: PASS (0 broken / 0 legacy references)" : "VerifyPaths: FAIL " + bad);
process.exit(bad === 0 ? 0 : 1);
