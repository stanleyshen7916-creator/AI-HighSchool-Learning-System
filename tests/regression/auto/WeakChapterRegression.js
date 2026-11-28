/* tests/regression/auto/WeakChapterRegression.js — 2026-11-27 AHS-FEAT 弱點單元分析與加強練習。
   門檻邊界、資料不足、舊紀錄相容（不回填、不捏造）、作答紀錄帶題號與來源教材、
   加強練習出題順序（錯題本未精熟 → 從未作答 → 其餘）、不出缺圖題、練習後移出「需加強」。
   Run: node tests/regression/auto/WeakChapterRegression.js */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const REPO = path.join(__dirname, "..", "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); }
}
function load(ctx, rel) { vm.runInContext(fs.readFileSync(path.join(REPO, rel), "utf8"), ctx, { filename: rel }); }
function freshContext() {
  const ctx = { console: console, Date: Date, JSON: JSON, Math: Math };
  ctx.window = ctx;
  vm.createContext(ctx);
  ["js/data/WeakChapterConfig.js", "js/runtime/KnowledgeMasteryRuntime.js", "js/runtime/WeakChapterRuntime.js"].forEach(function (f) { load(ctx, f); });
  return ctx;
}

console.log("[1] 門檻邊界與資料不足");
{
  const W = freshContext().AHS.WeakChapterRuntime;
  const mk = (n, correct, id) => Array.from({ length: n }, (_, i) => ({ subject: "bio", materialId: id, correct: i < correct, ts: String(i).padStart(3, "0") }));
  const u = W.summarize(mk(4, 0, "tm_1").concat(mk(5, 2, "tm_2"), mk(5, 3, "tm_3")));
  const by = Object.fromEntries(u.map((x) => [x.materialId, x]));
  check("4 題 → 資料不足", by.tm_1.status === "insufficient" && by.tm_1.counted === 4);
  check("5 題答對 2（40%）→ 需加強", by.tm_2.status === "weak" && by.tm_2.accuracy === 40);
  check("5 題答對 3（60%）→ 不是需加強（門檻是 < 60%）", by.tm_3.status === "ok" && by.tm_3.accuracy === 60);
  const recent = W.summarize(Array.from({ length: 25 }, (_, i) => ({ subject: "bio", materialId: "tm_4", correct: i < 5, ts: String(i).padStart(3, "0") })));
  check("只看最近 20 題（前 5 題答對的不算）", recent[0].counted === 20 && recent[0].correct === 0 && recent[0].total === 25);
  check("沒有來源教材的作答不歸入任何單元", W.summarize([{ subject: "bio", materialId: "", correct: false, ts: "1" }]).length === 0);
}

console.log("\n[2] 作答紀錄帶題號與來源教材；舊紀錄相容");
{
  const ctx = freshContext();
  const K = ctx.AHS.KnowledgeMasteryRuntime;
  K.recordAttempt("光合作用", false, "bio", "mat_runtime_9", "tm_56_q3");
  K.recordAttempt("細胞膜", true, "bio", "tm_57");
  K.recordAttempt("呼吸作用", true, "bio");
  const a = K.attempts();
  const byKp = Object.fromEntries(a.map((x) => [x.knowledgePoint, x]));
  check("題號 tm_56_q3 → 來源教材 tm_56（不是執行期 id）", byKp["光合作用"].materialId === "tm_56" && byKp["光合作用"].questionId === "tm_56_q3");
  check("知識點的 materialId 仍是呼叫端傳的值（AI 家教摘要連結不變）", K.get("光合作用").materialId === "mat_runtime_9");
  check("只傳 tm_N、沒有題號 → 來源教材 tm_57、題號空字串", byKp["細胞膜"].materialId === "tm_57" && byKp["細胞膜"].questionId === "");
  check("舊呼叫方式（3 個參數）照常運作，不捏造教材或題號", byKp["呼吸作用"].materialId === "" && byKp["呼吸作用"].questionId === "");
  check("recordAttempt 回傳值不變（undefined）", K.recordAttempt("x", true, "bio", "", "tm_1_q1") === undefined);
  ctx.AHS.TeachingMaterialLoader = { sourceIdFor: (id) => (id === "mat_runtime_7" ? "tm_7" : null) };
  K.recordAttempt("遺傳", false, "bio", "mat_runtime_7");
  check("執行期 id 由 TeachingMaterialLoader.sourceIdFor 反查", K.attempts().filter((x) => x.knowledgePoint === "遺傳")[0].materialId === "tm_7");
}

console.log("\n[3] 加強練習出題順序與缺圖題");
{
  const W = freshContext().AHS.WeakChapterRuntime;
  const qs = Array.from({ length: 14 }, (_, i) => ({ id: "tm_9_q" + (i + 1) }));
  qs[12].figureMissing = true;
  qs[13].figureMissing = true; qs[13].figureSvg = "<svg/>";
  const picked = W.pickPractice({
    questions: qs, count: 10, random: () => 0.5,
    weakIds: { tm_9_q1: true, tm_9_q2: true, tm_9_q13: true },
    attemptedIds: { tm_9_q1: true, tm_9_q2: true, tm_9_q3: true, tm_9_q4: true, tm_9_q5: true, tm_9_q6: true, tm_9_q7: true, tm_9_q8: true }
  });
  const tiers = picked.map((q) => q._tier).join(",");
  check("預設 10 題", picked.length === 10);
  check("先錯題本未精熟、再從未作答、最後其餘", /^wrong,wrong,unseen,unseen,unseen,unseen,unseen,rest,rest,rest$/.test(tiers));
  check("缺圖題（figureMissing 且沒有 figureSvg）不出，即使在錯題本", !picked.some((q) => q.id === "tm_9_q13"));
  check("標記缺圖但有 figureSvg 的題目照常可出", picked.some((q) => q.id === "tm_9_q14"));
  check("不改到原題物件", !("_tier" in qs[0]));
}

console.log("\n[4] 錯題本輸入只取這個單元未精熟的題目");
{
  const ctx = freshContext();
  ctx.AHS.WrongBookRuntime = { list: () => [
    { questionId: "tm_9_q1", correctStreak: 0 }, { questionId: "tm_9_q2", correctStreak: 3 },
    { questionId: "tm_9_q3", archived: true }, { questionId: "tm_90_q1", correctStreak: 0 }
  ] };
  ctx.AHS.KnowledgeMasteryRuntime.recordAttempt("kp", true, "bio", "", "tm_9_q5");
  const inp = ctx.AHS.WeakChapterRuntime.practiceInputs("tm_9");
  check("只有 tm_9_q1（連對 3 次、封存、別的單元 tm_90 都不算）", JSON.stringify(Object.keys(inp.weakIds)) === JSON.stringify(["tm_9_q1"]));
  check("作答過的題號來自作答紀錄", inp.attemptedIds.tm_9_q5 === true);
}

console.log("\n[5] 練習後重新計算，達標就移出「需加強」");
{
  const ctx = freshContext();
  const K = ctx.AHS.KnowledgeMasteryRuntime;
  const W = ctx.AHS.WeakChapterRuntime;
  for (let i = 0; i < 5; i++) { K.recordAttempt("kp" + i, i === 0, "bio", "", "tm_3_q" + i); }
  check("練習前：tm_3 需加強（1/5）", W.units()[0].status === "weak");
  for (let i = 0; i < 10; i++) { K.recordAttempt("kp" + i, true, "bio", "", "tm_3_q" + i); }
  check("練習後：tm_3 移出需加強（11/15）", W.units()[0].status === "ok");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
