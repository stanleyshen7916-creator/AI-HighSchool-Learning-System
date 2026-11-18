/* tests/regression/StemPromptRegression.js — 2026-11-18 AHS-UP2 P1-6b（Stanley 決定走 Unicode 路線）.
   學習平台前端沒有 LaTeX 渲染，數理科提示詞不得要求輸出 LaTeX，要求 Unicode 符號。
   Run: node tests/regression/StemPromptRegression.js */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); }
}

const src = fs.readFileSync(path.join(REPO, "js", "components", "CouncilUpload.js"), "utf8");
console.log("Stem prompt regression — 數理科提示詞用 Unicode、不要求 LaTeX");
check("不再有「公式一律用 LaTeX」這條規則", src.indexOf("公式一律用 LaTeX") === -1);
check("明說前端無法顯示 LaTeX、輸出不得出現 $、\\frac、\\sqrt", /無法顯示 LaTeX/.test(src) && src.indexOf("不得出現 $、\\\\frac、\\\\sqrt") !== -1);
check("給出 Unicode 寫法（θ π √(…) ² x₁ a/b）", /θ、π、∠/.test(src) && /√\(…\)/.test(src) && /x₁、x₂/.test(src) && /a\/b/.test(src));
check("詳解要分步驟、答案算兩次、一行「易錯：」", /至少 3 步/.test(src) && /計算兩次/.test(src) && /易錯：/.test(src));
check("章節仍是 15 章（沿用 STEM_SECTIONS，圈號不變）", /"①核心概念", "②章節摘要", "③重要定義與公式"/.test(src) && /"⑮Final Score"/.test(src));

console.log("\nStemPromptRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
