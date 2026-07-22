/* tests/regression/InitializationGuard.js — EO-S7.0-HOTFIX-001.
   Verifies the Initialization Order gate and load-time guards:
     A) Catastrophic case (js/core/UI.js 404'd, as on GitHub Pages):
        every script still parses & executes with ZERO uncaught
        TypeErrors ("Cannot read properties of undefined (reading
        'el')" is gone), and the bootstrap renders the clear diagnostic
        message instead of a white page.
     B) Normal case: identical render to before the hotfix (covered in
        depth by BehaviorSuite's 71 assertions; smoke-checked here).
   Run: node tests/regression/InitializationGuard.js */
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : fail++; console.log((cond ? "  PASS  " : "  FAIL  ") + name); }

function loadIndex({ skip }) {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const dom = new JSDOM(html, { url: "https://ahs.test/index.html", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  const { window } = dom;
  const thrown = [];
  for (const src of [...window.document.querySelectorAll("script[src]")].map(s => s.getAttribute("src"))) {
    if (skip && skip.includes(src)) continue;          /* simulate the 404 */
    try { window.eval(fs.readFileSync(path.join(ROOT, src), "utf8")); }
    catch (e) { thrown.push(src + ": " + e.message); }
  }
  window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
  return { window, thrown };
}

console.log("[A] UI.js missing (GitHub Pages 404 simulation)");
{
  const { window, thrown } = loadIndex({ skip: ["js/core/UI.js"] });
  check("零 module-scope TypeError（undefined.el 已消除）", thrown.length === 0);
  if (thrown.length) console.log("   thrown:", thrown.slice(0, 5));
  const app = window.document.getElementById("app");
  check("非白畫面：#app 顯示明確診斷訊息", !!app && /系統資源載入失敗/.test(app.textContent));
  check("未提前建立任何 Component（無 AppShell DOM）", !window.document.querySelector(".shell, .appshell, header"));
}

console.log("[B] full load (normal case)");
{
  const { window, thrown } = loadIndex({ skip: [] });
  check("全部 script 正常執行", thrown.length === 0);
  const app = window.document.getElementById("app");
  check("首頁正常 Render（Hero + 今日任務）", !!app && app.children.length > 0 && /今日任務|今天/.test(app.textContent));
  check("診斷訊息未出現", !/系統資源載入失敗/.test(app.textContent));
}

console.log("InitializationGuard: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
