/* tests/validator/HtmlValidator.js — runs html5validator over every
   root HTML page. Requires: pip install html5validator (+ Java).
   Run: node tests/validator/HtmlValidator.js */
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html"));
try {
  execFileSync("html5validator", pages, { cwd: ROOT, stdio: "inherit" });
  console.log("HtmlValidator: PASS (" + pages.length + " pages, 0 errors)");
} catch (e) {
  console.log("HtmlValidator: FAIL (or html5validator not installed)");
  process.exit(1);
}
