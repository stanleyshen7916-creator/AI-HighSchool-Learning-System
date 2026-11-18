/* tests/regression/SubjectPromptRegression.js — 2026-11-18 AHS-UP2 P1-6 出題提示詞依科目分流.
   - 數學／物理／化學／地球科學：章節對應改寫（題型與解題思路、公式推導…）、公式一律 LaTeX、詳解分步驟；
   - 生物／歷史／地理／公民／英文各有自己的指引；國文維持原樣（不加指引）；
   - 十五章節標題不變（審議管線靠「圈號＋標題」辨識）。
   Run: node tests/regression/SubjectPromptRegression.js */
"use strict";
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); }
}

const html = fs.readFileSync(path.join(REPO, "upload.html"), "utf8");
const dom = new JSDOM(html, { url: "https://ahs.test/upload.html", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
const { window } = dom;
window.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
window.sessionStorage.setItem("ahs:workspace", JSON.stringify({ studentId: "admin", schoolId: "cjsh", semesterIds: ["g2s1"] }));
[...dom.window.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
  const p = path.join(REPO, src);
  if (fs.existsSync(p)) { window.eval(fs.readFileSync(p, "utf8")); }
});

console.log("Subject prompt regression — 提示詞依科目分流 (P1-6)");
const guide = (s) => window.AHS.CouncilUpload.subjectGuide(s).join("\n");

check("subjectGuide 已匯出", typeof window.AHS.CouncilUpload.subjectGuide === "function");
check("國文維持原樣：不加科目別指引", window.AHS.CouncilUpload.subjectGuide("國文").length === 0);
check("沒有對應的科目（未知值）不加指引", window.AHS.CouncilUpload.subjectGuide("不存在的科目").length === 0);

["數學", "物理", "化學", "地球科學"].forEach((s) => {
  const g = guide(s);
  check(s + "：改寫章節（題型與解題思路、公式推導、例題分析、計算步驟模板）",
    /④文意理解＝題型與解題思路/.test(g) && /⑤修辭手法＝公式推導與證明/.test(g) && /⑦作者背景＝例題分析/.test(g) && /⑧段落結構＝計算步驟模板/.test(g));
  check(s + "：輸出不得用 LaTeX（前端無法渲染）、改用 Unicode 符號、詳解分步驟、答案算兩次",
    /無法顯示 LaTeX/.test(g) && /不得出現 \$、\\frac、\\sqrt/.test(g) && /√\(…\)/.test(g) && /至少 3 步/.test(g) && /計算兩次/.test(g));
});
check("數學指引明說章節標題照舊（審議管線靠標題辨識）", /標題請照舊輸出（系統靠標題辨識，不可更改）/.test(guide("數學")));

check("生物：實驗設計與圖表判讀", /⑤修辭手法＝實驗設計與變因/.test(guide("生物")) && /圖表判讀/.test(guide("生物")));
["歷史", "地理", "公民與社會"].forEach((s) => {
  check(s + "：史料／圖表判讀、時空脈絡、不得補充教材沒有的資料", /史料／圖表判讀/.test(guide(s)) && /時空脈絡/.test(guide(s)) && /不得自行補充/.test(guide(s)));
});
check("英文：文法與句型、詞彙與用法、英文原文照寫", /⑤修辭手法＝文法與句型/.test(guide("英文")) && /英文原文照寫/.test(guide("英文")));

/* 完整提示詞：用真實元件建出頁面，選科目後複製提示詞。buildPrompt 是元件內部函式，透過「複製出題 Prompt」按鈕的
   結果驗證太依賴 UI 細節，這裡改驗證 subjectGuide 以外的關鍵契約：十五章節標題沒有被改。 */
const src = fs.readFileSync(path.join(REPO, "js", "components", "CouncilUpload.js"), "utf8");
const titles = ["①核心概念", "②章節摘要", "③重點詞彙", "④文意理解", "⑤修辭手法", "⑥文化脈絡", "⑦作者背景", "⑧段落結構",
  "⑨延伸思考", "⑩易混淆概念", "⑪常考題型", "⑫易錯陷阱", "⑬跨課連結", "⑭Cross Review", "⑮Final Score"];
check("十五章節標題原封不動（COUNCIL_SECTIONS）", titles.every((t) => src.indexOf('"' + t + '"') !== -1));
check("buildPrompt 在章節列表後插入科目別指引", /concat\(COUNCIL_SECTIONS\)\.concat\(subjectGuide\(m\.subject\)\)/.test(src));

console.log("\nSubjectPromptRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
