/* scripts/verify/VerifyPaths.js — Repository Structure v2.1 (LOCK)
   audit tool: every local src/href in every root HTML page, plus every
   Qiaoqiao-constructed image path, must resolve to a real file. Also
   fails on references to pre-v2.0 paths. Run: node scripts/verify/VerifyPaths.js */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let bad = 0;
const LEGACY = ["js/services/", "css/layout/", "assets/illustrations/", "archive/", "prototype/", "developer/"];
for (const html of fs.readdirSync(ROOT).filter(f => f.endsWith(".html"))) {
  const src = fs.readFileSync(path.join(ROOT, html), "utf8");
  for (const m of src.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    const ref = m[1];
    if (/^https?:/.test(ref)) continue;
    const target = ref.split("?")[0];
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
