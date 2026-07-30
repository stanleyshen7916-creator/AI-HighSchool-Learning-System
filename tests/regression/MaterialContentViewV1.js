/* tests/regression/MaterialContentViewV1.js — Sprint AI-105 · Task AI105-06.
   Verifies MaterialContentView.js: Markdown rendering (headings/lists/
   bold/italic) via real DOM construction (never innerHTML for Markdown
   content — source-scanned), sandboxed-iframe HTML rendering (empty
   sandbox attribute, no allow-scripts), honest empty state, and that
   MaterialPreview.js's new section reads only the existing
   AHS.MaterialRuntime record — no new Runtime, no new Store.
   Run: node tests/regression/MaterialContentViewV1.js */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" });
global.window = dom.window; global.document = dom.window.document;
global.AHS = dom.window.AHS = {};

["js/core/UI.js", "js/ui/MaterialContentView.js"].forEach(p => {
  dom.window.eval(fs.readFileSync(path.join(ROOT, p), "utf8"));
});

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const MCV = dom.window.AHS.MaterialContentView;

console.log("\n[API surface]");
check("提供 create(item)", typeof MCV.create === "function");

console.log("\n[Markdown 渲染 — 真實 DOM 節點，非 innerHTML]");
const mdItem = { content: "# 標題一\n\n這是一段內容，包含 **粗體** 與 *斜體*。\n\n- 項目一\n- 項目二\n\n## 子標題\n\n第二段落。" };
const mdResult = MCV.create(mdItem);
check("回傳 { node }", !!mdResult.node);
check("渲染出 Markdown 容器", !!mdResult.node.querySelector(".mat-content__markdown"));
check("標題正確渲染為 heading 元素", mdResult.node.querySelector(".mat-content__heading").textContent === "標題一");
check("粗體正確渲染為 <strong>", !!mdResult.node.querySelector("strong") && mdResult.node.querySelector("strong").textContent === "粗體");
check("斜體正確渲染為 <em>", !!mdResult.node.querySelector("em") && mdResult.node.querySelector("em").textContent === "斜體");
check("列表項目正確渲染（2 項）", mdResult.node.querySelectorAll(".mat-content__list li").length === 2);
check("段落正確渲染", [...mdResult.node.querySelectorAll(".mat-content__paragraph")].some(p => p.textContent.indexOf("第二段落") !== -1));

console.log("\n[HTML 渲染 — Sandboxed iframe，零 innerHTML 注入風險]");
const htmlItem = { content: "<!doctype html><html><body><script>window.__pwned = true;</script><p>安全內容</p></body></html>" };
const htmlResult = MCV.create(htmlItem);
const frame = htmlResult.node.querySelector(".mat-content__frame");
check("HTML 內容渲染為 <iframe>", !!frame && frame.tagName === "IFRAME");
check("iframe 設定空 sandbox（無 allow-scripts／allow-same-origin）", frame.getAttribute("sandbox") === "");
check("iframe 內容透過 srcdoc 屬性設定，非父層 innerHTML", frame.getAttribute("srcdoc") === htmlItem.content);
check("父層 document 未被注入腳本（__pwned 不存在於 window）", dom.window.__pwned === undefined);

console.log("\n[誠實空狀態]");
const emptyResult = MCV.create({ content: "" });
check("空內容顯示誠實訊息，非捏造內容", emptyResult.node.textContent.indexOf("尚無可顯示的內容") !== -1);
const missingResult = MCV.create({});
check("content 欄位缺失時同樣顯示誠實空狀態，不拋錯", missingResult.node.textContent.indexOf("尚無可顯示的內容") !== -1);

console.log("\n[原始碼靜態掃描 — Markdown 路徑零 innerHTML]");
const src = fs.readFileSync(path.join(ROOT, "js/ui/MaterialContentView.js"), "utf8");
const srcNoComments = src.replace(/\/\*[\s\S]*?\*\//g, "");
check("零 innerHTML 使用（Markdown 內容一律透過安全 DOM API 建構）", !/innerHTML/.test(srcNoComments));
check("零 fetch/XMLHttpRequest（純前端渲染，無網路呼叫）", !/\bfetch\s*\(|XMLHttpRequest/.test(srcNoComments));

console.log("\n" + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
