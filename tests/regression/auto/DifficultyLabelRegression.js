/* tests/regression/auto/DifficultyLabelRegression.js — 2026-11-28 練習清單難度篩選。
   題庫的難度有「中」與「中等」兩種寫法；選「中等」時兩種都要算中等，不可退回列出最難的題目。
   Run: node tests/regression/auto/DifficultyLabelRegression.js */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const REPO = path.join(__dirname, "..", "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); } else { fail++; console.log("  FAIL  " + name); }
}
const ctx = { console: console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(REPO, "js/components/quiz/QuizShared.js"), "utf8"), ctx, { filename: "QuizShared.js" });
const P = ctx.AHS.QuizParts;

check("「中」與「中等」都是中等（rank 1）", P.difficultyRank("中") === 1 && P.difficultyRank("中等") === 1);
check("「易」「難」不變", P.difficultyRank("易") === 0 && P.difficultyRank("難") === 2);
check("「易~中等」仍算中等、沒有難度仍是 -1", P.difficultyRank("易~中等") === 1 && P.difficultyRank("") === -1);

const qs = [{ d: "易" }, { d: "中" }, { d: "中" }, { d: "難" }, { d: "中等" }];
const picked = P.filterByDifficulty(qs, "medium", (q) => P.difficultyRank(q.d));
check("選中等：列出「中」與「中等」共 3 題，不退回列出「難」", picked.length === 3 && picked.every((q) => q.d !== "難"));

/* 實際題庫：選中等時每份教材都對得到中等題（不再因寫法不同而對不到） */
const dir = path.join(REPO, "docs/TeachingMaterials/materials");
const missing = [];
fs.readdirSync(dir).forEach((id) => {
  const f = path.join(dir, id, "questionbank.json");
  if (!fs.existsSync(f)) { return; }
  const raw = JSON.parse(fs.readFileSync(f, "utf8"));
  const list = Array.isArray(raw) ? raw : (raw.questions || []);
  const labels = list.map((q) => q.difficulty).filter(Boolean);
  if (labels.some((l) => l === "中" || l === "中等") && !labels.some((l) => P.difficultyRank(l) === 1)) { missing.push(id); }
});
check("所有題庫標「中」或「中等」的題目都被認成中等", missing.length === 0);
check("tm_116 選中等有 19 題", (() => {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, "tm_116", "questionbank.json"), "utf8"));
  const list = (Array.isArray(raw) ? raw : raw.questions).filter((q) => !q.variantOf);
  return P.filterByDifficulty(list, "medium", (q) => P.difficultyRank(q.difficulty)).length === 19;
})());

console.log("\nDifficultyLabelRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
