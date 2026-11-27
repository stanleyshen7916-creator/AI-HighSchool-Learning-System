/* tests/regression/TeachingMaterialSplitRegression.js — queue 9.4 (T1/T2 completeness + load-budget gate).

   js/data/TeachingMaterialData.js is split into js/data/TeachingMaterialIndex.js + js/data/materials-content/<id>.js
   (docs/TeachingMaterials/scripts/TeachingMaterialSplit.js). While both exist this proves the split LOSES NOTHING:
   - index + all content files rebuild to exactly the original array (materials, questions, options, answers,
     explanations, figures, supplements/variants) — compared key-order-insensitively;
   - every content file stands alone (loads in an empty page, registers only its own id);
   - the index fingerprints match the content, no orphan content files;
   and the budget that keeps the list page from growing with the number of materials (Stanley 11/22):
   - index <= 1.0 KB per material on average and <= 400 KB in total, projected to 400 materials too;
   - the list-page index never contains questions or summaries;
   - one material's content stays under 1 MB (warns above 600 KB).

   Run: node tests/regression/TeachingMaterialSplitRegression.js */
"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");
require("./GeneratedFilesGuard.js").guard();
const split = require("../../docs/TeachingMaterials/scripts/TeachingMaterialSplit.js");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}
function runFile(file) {
  const w = { console: console };
  w.window = w; w.AHS = {};
  vm.createContext(w);
  vm.runInContext(fs.readFileSync(file, "utf8"), w, { filename: file });
  return w.AHS;
}
function canon(v) {            // key-order-insensitive, realm-independent
  if (Array.isArray(v)) { return v.map(canon); }
  if (v && typeof v === "object") { const o = {}; Object.keys(v).sort().forEach((k) => { o[k] = canon(v[k]); }); return o; }
  return v;
}

const data = runFile(path.join(REPO, "js/data/TeachingMaterialData.js")).TeachingMaterialData;
const index = runFile(path.join(REPO, "js/data/TeachingMaterialIndex.js")).TeachingMaterialIndex;

console.log("\n[1] 完整度：index＋全部內容檔 重組後與 TeachingMaterialData.js 完全一致");
{
  const store = {};
  index.forEach((r) => { Object.assign(store, runFile(path.join(REPO, r.content.file)).TeachingMaterialContentStore); });
  let rebuilt = null, err = "";
  try { rebuilt = split.rebuild(index, store); } catch (e) { err = e.message; }
  check("重組不出錯（內容檔都在、指紋相符）" + (err ? "：" + err : ""), rebuilt !== null);
  check("教材數相同（" + data.length + "）", rebuilt && rebuilt.length === data.length);
  const qa = data.reduce((n, e) => n + e.questions.length, 0);
  check("題數相同（" + qa + "）", rebuilt && rebuilt.reduce((n, e) => n + e.questions.length, 0) === qa);
  const identical = !!rebuilt && JSON.stringify(canon(rebuilt)) === JSON.stringify(canon(data));
  /* queue 9.4 T5: strict again (the transition-time warning is gone). Pages read the split files from T7 on, so a
     data PR that changes TeachingMaterialData.js without the split files would ship stale content: regenerate with
     node docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js and commit TeachingMaterialIndex.js and
     js/data/materials-content/ with it. */
  if (!identical) {
    console.log("  請執行 node docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js，並一併提交 js/data/TeachingMaterialIndex.js 與 js/data/materials-content/");
  }
  check("逐教材、逐題、逐欄位完全相同（題目、選項、答案、詳解、附圖、補強、變體）", identical);
  check("index 與資料的教材順序相同", index.map((r) => r.materialId).join() === data.map((e) => e.materialId).join());
}

console.log("\n[2] 每個內容檔可單獨載入");
{
  let ok = 0;
  index.forEach((r) => {
    const ns = runFile(path.join(REPO, r.content.file)).TeachingMaterialContentStore || {};
    if (Object.keys(ns).length === 1 && ns[r.materialId] && Array.isArray(ns[r.materialId].questions)) { ok++; }
  });
  check("全部 " + index.length + " 個內容檔都只註冊自己的教材編號、且有題目陣列", ok === index.length);
  const dir = fs.readdirSync(path.join(REPO, "js/data/materials-content")).filter((n) => /^tm_\d+\.js$/.test(n));
  check("沒有 index 以外的殘留內容檔", dir.length === index.length && dir.every((n) => index.some((r) => r.materialId + ".js" === n)));
  check("index 的 counts 與內容相符", index.every((r) => {
    const e = data.find((x) => x.materialId === r.materialId);
    return r.counts.questions === e.questions.length && r.counts.variants === (e.variants || []).length && r.counts.hasSummary === !!e.summary;
  }));
}

console.log("\n[3] 載入預算守門（清單頁不得隨教材數量變慢）");
{
  const indexBytes = Buffer.byteLength(fs.readFileSync(path.join(REPO, "js/data/TeachingMaterialIndex.js"), "utf8"), "utf8");
  const avg = indexBytes / index.length;
  console.log("        index = " + (indexBytes / 1024).toFixed(1) + " KB／" + index.length + " 份 = 平均 " + avg.toFixed(0) + " B 每份；400 份推算 " + (avg * 400 / 1024).toFixed(0) + " KB");
  check("index 平均每份不超過 1.0 KB", avg <= 1024);
  check("index 總量不超過 400 KB", indexBytes <= 400 * 1024);
  check("依目前平均推算 400 份仍不超過 400 KB", avg * 400 <= 400 * 1024);
  check("index 不含題目或詳解內容", index.every((r) => !("questions" in r) && !("summary" in r) && !("variants" in r)));
  const sizes = index.map((r) => r.content.bytes);
  const biggest = Math.max.apply(null, sizes);
  const big = index.filter((r) => r.content.bytes > 600 * 1024).map((r) => r.materialId);
  if (big.length) { console.log("        注意：單份內容超過 600 KB：" + big.join("、") + "（超過 1 MB 要再分段）"); }
  check("單份教材內容不超過 1 MB（最大 " + (biggest / 1024).toFixed(0) + " KB）", biggest <= 1024 * 1024);
}

console.log("\nTeachingMaterialSplitRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
