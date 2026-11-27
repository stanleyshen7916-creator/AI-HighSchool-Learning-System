/* tests/regression/TeachingMaterialLoaderIndexRegression.js — queue 9.4 (T4).

   quiz.html is loaded twice with the real scripts:
     A) as it is today — js/data/TeachingMaterialData.js (the whole 4.7 MB array);
     B) with that one tag replaced by js/data/TeachingMaterialIndex.js + TeachingMaterialContentLoader.js.
   Proves that B gives the same result as A, only later:
   - B has every material's MaterialRuntime record straight from the index, and no questions yet;
   - after TeachingMaterialLoader.loadContent(id) the Summary and the Exam-Mode question set of that material equal A's;
   - on A, loadContent() changes nothing (every page today);
   - no console errors.
   (The content script itself is added by TeachingMaterialContentLoader as a <script> tag — covered by
   TeachingMaterialContentLoaderRegression.js; here the file text is evaluated in its place.)

   Run: node tests/regression/TeachingMaterialLoaderIndexRegression.js */
"use strict";
const { JSDOM, VirtualConsole } = require("jsdom");
const fs = require("fs");
const path = require("path");

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
const same = (a, b) => JSON.stringify(canon(JSON.parse(JSON.stringify(a)))) === JSON.stringify(canon(JSON.parse(JSON.stringify(b))));

const WORKSPACE = { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] };
const DATA_TAG = '<script src="js/data/TeachingMaterialData.js"></script>';

function loadPage(variant) {
  let html = fs.readFileSync(path.join(REPO, "quiz.html"), "utf8");
  if (variant === "index") {
    if (html.indexOf(DATA_TAG) === -1) { throw new Error("quiz.html no longer has the TeachingMaterialData tag"); }
    html = html.replace(DATA_TAG, '<script src="js/data/TeachingMaterialIndex.js"></script>\n<script src="js/runtime/TeachingMaterialContentLoader.js"></script>');
    /* T5 added AHS.TeachingMaterialSource, which makes the page wait for its content before init. This test is about the
       Loader on its own (index only, content later via loadContent), so leave it out here; the page-level preload is
       covered by tests/regression/auto/SplitModeIdentityRegression.js. */
    html = html.replace('<script src="js/runtime/TeachingMaterialSource.js"></script>', "");
  }
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("error", (m) => errors.push(String(m)));
  vc.on("jsdomError", (e) => { const s = String((e && e.message) || e); if (!/Could not load link|Could not parse CSS|not implemented/i.test(s)) { errors.push(s); } });
  const dom = new JSDOM(html, { url: "https://ahs.test/quiz.html", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.fetch = function () { return Promise.reject(new Error("fetch disabled in test environment")); };
  w.sessionStorage.setItem("ahs:workspace", JSON.stringify(WORKSPACE));
  [...w.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).forEach((src) => {
    const p = path.join(REPO, src);
    if (fs.existsSync(p)) { w.eval(fs.readFileSync(p, "utf8")); }
  });
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
  if (variant === "index") {
    // stand in for the <script> tag the real loader appends: evaluate the content file, then report it loaded
    const L = w.AHS.TeachingMaterialContentLoader;
    L.ensure = function (id) {
      if (!L.has(id)) { w.eval(fs.readFileSync(path.join(REPO, "js/data/materials-content/" + id + ".js"), "utf8")); }
      return Promise.resolve(L.get(id));
    };
  }
  return { w, errors };
}

(async function main() {
  const A = loadPage("data");
  const B = loadPage("index");
  const aIds = A.w.AHS.MaterialRuntime.list().map((m) => m.originKey).filter(Boolean).sort();
  const bIds = B.w.AHS.MaterialRuntime.list().map((m) => m.originKey).filter(Boolean).sort();
  console.log("\n[1] 目錄：只靠 index，教材紀錄與原本一致");
  check("A 載入了教材紀錄（" + aIds.length + "）", aIds.length > 20);
  check("B（只有 index）有同一批教材紀錄", JSON.stringify(aIds) === JSON.stringify(bIds));
  check("B 的教材屬性與 A 相同（標題、科目、章節…）", same(
    A.w.AHS.MaterialRuntime.list().map((m) => ({ k: m.originKey, t: m.title, s: m.subject, c: m.chapter, g: m.grade, cat: m.category })).sort((x, y) => String(x.k) < String(y.k) ? -1 : 1),
    B.w.AHS.MaterialRuntime.list().map((m) => ({ k: m.originKey, t: m.title, s: m.subject, c: m.chapter, g: m.grade, cat: m.category })).sort((x, y) => String(x.k) < String(y.k) ? -1 : 1)));

  console.log("\n[2] 內容：按需載入後與 A 相同");
  const tmIds = aIds.filter((id) => /^tm_\d+$/.test(id));   // the Package track (the old Repository-track records have no content file)
  const sample = [tmIds[0], tmIds[Math.floor(tmIds.length / 3)], tmIds[Math.floor(tmIds.length * 2 / 3)], tmIds[tmIds.length - 1]];
  for (const id of sample) {
    const rtA = A.w.AHS.TeachingMaterialLoader.runtimeIdFor(id), rtB0 = B.w.AHS.TeachingMaterialLoader.runtimeIdFor(id);
    const examB = "teaching_material_" + rtB0;
    check(id + "：載入前 B 沒有題目", B.w.AHS.QuestionRuntime.getSet(examB).length === 0);
    const rtB = await B.w.AHS.TeachingMaterialLoader.loadContent(id);
    check(id + "：loadContent 回傳同一個教材紀錄編號", rtB === rtB0 && rtB != null);
    const qa = A.w.AHS.QuestionRuntime.getSet("teaching_material_" + rtA), qb = B.w.AHS.QuestionRuntime.getSet(examB);
    check(id + "：考試題組與 A 完全相同（" + qa.length + " 題）", qa.length === qb.length && same(qa, qb));
    const sa = A.w.AHS.SummaryRuntime.findByMaterialId(rtA), sb = B.w.AHS.SummaryRuntime.findByMaterialId(rtB);
    const strip = (list) => list.map((s) => { const c = Object.assign({}, s); delete c.id; delete c.materialId; delete c.createdAt; delete c.updatedAt; return c; });
    check(id + "：學習總結與 A 相同（" + sa.length + " 份）", sa.length === sb.length && same(strip(sa), strip(sb)));
    const again = await B.w.AHS.TeachingMaterialLoader.loadContent(id);
    check(id + "：重複載入不會重複匯入題目", again === rtB && B.w.AHS.QuestionRuntime.getSet(examB).length === qb.length);
  }

  console.log("\n[3] 現有頁面（有完整資料）行為不變");
  {
    const id = tmIds[0];
    const before = A.w.AHS.QuestionRuntime.getSet("teaching_material_" + A.w.AHS.TeachingMaterialLoader.runtimeIdFor(id)).length;
    const r = await A.w.AHS.TeachingMaterialLoader.loadContent(id);
    check("A 上 loadContent 直接回傳教材紀錄編號、不動題目", r === A.w.AHS.TeachingMaterialLoader.runtimeIdFor(id) &&
      A.w.AHS.QuestionRuntime.getSet("teaching_material_" + r).length === before);
    let rejected = false;
    try { await B.w.AHS.TeachingMaterialLoader.loadContent("tm_99999"); } catch (e) { rejected = true; }
    check("不存在的教材：loadContent 不丟錯、回傳 null 或編號", !rejected);
  }
  check("Console errors = 0（A、B 兩頁）", A.errors.length === 0 && B.errors.length === 0);
  if (A.errors.length || B.errors.length) { console.log(A.errors.concat(B.errors).slice(0, 3).join("\n")); }

  console.log("\nTeachingMaterialLoaderIndexRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("  FAIL  unexpected error: " + e.stack); process.exit(1); });
