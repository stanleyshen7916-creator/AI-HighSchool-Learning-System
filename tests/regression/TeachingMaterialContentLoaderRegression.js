/* tests/regression/TeachingMaterialContentLoaderRegression.js — queue 9.4 (T3).

   js/runtime/TeachingMaterialContentLoader.js loads a material's content file as a <script> on demand. Real files,
   a real (jsdom) page served from file:// — the same way the app is opened without a server.

   Run: node tests/regression/TeachingMaterialContentLoaderRegression.js */
"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const { pathToFileURL } = require("url");
const { JSDOM, VirtualConsole } = require("jsdom");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}
function canon(v) {
  if (Array.isArray(v)) { return v.map(canon); }
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach((k) => { o[k] = canon(v[k]); }); return o; }
  return v;
}

function makePage() {
  const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
    url: pathToFileURL(path.join(REPO, "materials.html")).href,
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole()      // a missing content file is an expected case here: do not print jsdom's load error
  });
  dom.window.eval(fs.readFileSync(path.join(REPO, "js/runtime/TeachingMaterialContentLoader.js"), "utf8"));
  return dom;
}

(async function main() {
  const w0 = { console: console }; w0.window = w0; w0.AHS = {}; vm.createContext(w0);
  vm.runInContext(fs.readFileSync(path.join(REPO, "js/data/TeachingMaterialData.js"), "utf8"), w0);
  const data = w0.AHS.TeachingMaterialData;
  const tm = data[0];

  console.log("\n[1] 單份載入");
  {
    const dom = makePage();
    const L = dom.window.AHS.TeachingMaterialContentLoader;
    check("載入前 has() 為 false、get() 為 null", L.has(tm.materialId) === false && L.get(tm.materialId) === null);
    const c = await L.ensure(tm.materialId);
    check("ensure() 解析出內容（有題目陣列）", Array.isArray(c.questions) && c.questions.length === tm.questions.length);
    check("內容與 TeachingMaterialData.js 的相同", JSON.stringify(canon(JSON.parse(JSON.stringify(c)))) === JSON.stringify(canon({ summary: tm.summary, questions: tm.questions, variants: tm.variants }.variants === undefined ? { summary: tm.summary, questions: tm.questions } : { summary: tm.summary, questions: tm.questions, variants: tm.variants })));
    check("載入後 has() 為 true", L.has(tm.materialId) === true);
    const before = dom.window.document.querySelectorAll("script").length;
    await L.ensure(tm.materialId);
    check("已載入的再要一次，不會再加 <script>", dom.window.document.querySelectorAll("script").length === before);
  }

  console.log("\n[2] 同時多個呼叫共用同一個 <script>");
  {
    const dom = makePage();
    const L = dom.window.AHS.TeachingMaterialContentLoader;
    const id = data[1].materialId;
    const [a, b, c] = await Promise.all([L.ensure(id), L.ensure(id), L.ensure(id)]);
    check("三個呼叫拿到同一份內容", a === b && b === c);
    check("只加了一個 <script>", dom.window.document.querySelectorAll('script[src$="' + id + '.js"]').length === 1);
  }

  console.log("\n[3] ensureAll");
  {
    const dom = makePage();
    const L = dom.window.AHS.TeachingMaterialContentLoader;
    const ids = data.slice(0, 3).map((e) => e.materialId);
    const out = await L.ensureAll(ids);
    check("三份都載入並依編號回傳", ids.every((id) => out[id] && Array.isArray(out[id].questions)));
  }

  console.log("\n[4] 錯誤情況");
  {
    const dom = makePage();
    const L = dom.window.AHS.TeachingMaterialContentLoader;
    let e1 = null, e2 = null, e3 = null;
    try { await L.ensure("../secret"); } catch (e) { e1 = e; }
    check("不合格的教材編號（路徑字元）被拒絕，不會去載入", !!e1 && dom.window.document.querySelectorAll("script[src*='secret']").length === 0);
    try { await L.ensure("tm_99999"); } catch (e) { e2 = e; }
    check("不存在的教材：Promise 被拒絕，且沒有殘留 <script>", !!e2 && dom.window.document.querySelectorAll('script[src$="tm_99999.js"]').length === 0);
    try { await L.ensure(undefined); } catch (e) { e3 = e; }
    check("沒給編號被拒絕", !!e3);
    const c = await L.ensure(data[0].materialId);
    check("失敗之後仍能正常載入其他教材", Array.isArray(c.questions));
  }

  console.log("\nTeachingMaterialContentLoaderRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("  FAIL  unexpected error: " + e.message); process.exit(1); });
