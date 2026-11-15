/* tests/regression/QuestionGroupRegression.js — 2026-11-15 題組（groupId）.

   Verifies:
   - QuestionGroupDetector: 承上題／承第N題／題組標記判定；「(2) 承上題」同題小題、
     「延續千餘年」不算；
   - js/data/TeachingMaterialData.js 已帶 groupId（產生器自動判定，教材包不變）；
   - AHS.QuestionGroups：打亂 50 次同組題目都相鄰且順序不變；take 不拆組；
     regroup 補齊同組題目；
   - QuestionRuntime.shuffleOrder／QuestionBankRuntime.drawRandom／drawCycle／
     RandomPracticeRuntime.pick 都不拆題組。

   Run: node tests/regression/QuestionGroupRegression.js */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const REPO = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name); }
}

const detector = require(path.join(REPO, "docs/TeachingMaterials/scripts/QuestionGroupDetector.js"));
const sample = [
  { question: "甲工廠…", questionNumber: "1" },
  { question: "承上題，求機會成本。", questionNumber: "2" },
  { question: "一般題。", questionNumber: "3" },
  { question: "（第4–5題為題組）情境…問一", questionNumber: "4" },
  { question: "（第4–5題為題組）情境…問二", questionNumber: "5" },
  { question: "(1) 求體積。(2) 承上題，求壓力。", questionNumber: "6" },
  { question: "拜占庭帝國延續千餘年。", questionNumber: "7" },
  { question: "（承第4題）再求…", questionNumber: "8" }
];
const g = detector.detect(sample);
check("偵測：承上題與前一題同組", g.some((x) => x.join() === "0,1"));
check("偵測：題組標記＋承第N題同組", g.some((x) => x.join() === "3,4,7"));
check("偵測：同題小題、延續千餘年不算", !g.some((x) => x.includes(5) || x.includes(6)));
const ann = detector.annotate("tm_x", sample);
check("annotate：不相鄰的同組題目排成連續", ann.map((q) => q.questionNumber).join() === "1,2,3,4,5,8,6,7");

const ctx = { window: {}, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
["js/data/TeachingMaterialData.js", "js/utils/QuestionGroups.js", "js/core/PersistenceAdapter.js",
 "js/runtime/QuestionRuntime.js", "js/runtime/QuestionBankRuntime.js", "js/runtime/RandomPracticeRuntime.js"].forEach((f) => {
  const file = path.join(REPO, f);
  if (fs.existsSync(file)) { vm.runInContext("var window = this.window; var AHS = window.AHS = window.AHS || {};\n" + fs.readFileSync(file, "utf8") + "\nthis.window.AHS = AHS;", ctx, { filename: f }); }
});
const AHS = ctx.window.AHS;
const data = AHS.TeachingMaterialData || [];
const grouped = data.reduce((n, e) => n + e.questions.filter((q) => q.groupId).length, 0);
check("平台資料已標 groupId（≥120 題）：" + grouped, grouped >= 120);

const tm = data.find((e) => e.materialId === "tm_56");
const pool = tm.questions.map((q) => ({ id: q.id, groupId: q.groupId || "" }));
function intact(list, fullPool) {
  const byG = {};
  fullPool.forEach((q, i) => { if (q.groupId) { (byG[q.groupId] = byG[q.groupId] || []).push(q.id); } });
  const seen = {};
  for (let i = 0; i < list.length; i++) {
    const k = list[i].groupId;
    if (!k || seen[k]) { continue; }
    seen[k] = true;
    const want = byG[k];
    if (list.slice(i, i + want.length).map((q) => q.id).join() !== want.join()) { return false; }
  }
  return true;
}
const QG = AHS.QuestionGroups;
let ok = true;
for (let t = 0; t < 50; t++) { if (!intact(QG.shuffle(pool), pool)) { ok = false; } }
check("QuestionGroups.shuffle 50 次同組相鄰且順序不變", ok);
ok = true;
for (let t = 0; t < 50; t++) { if (!intact(QG.take(QG.shuffle(pool), 10), pool)) { ok = false; } }
check("QuestionGroups.take 不拆組", ok);
const lone = pool.find((q) => q.groupId && pool.filter((p) => p.groupId === q.groupId).indexOf(q) > 0);
check("regroup 補齊同組題目", intact(QG.regroup([lone], pool), pool) && QG.regroup([lone], pool).length > 1);

if (AHS.QuestionRuntime && AHS.QuestionRuntime.importQuestions) {
  AHS.QuestionRuntime.importQuestions("qg_exam", pool);
  ok = true;
  for (let t = 0; t < 30; t++) { if (!intact(AHS.QuestionRuntime.shuffleOrder("qg_exam"), pool)) { ok = false; } }
  check("QuestionRuntime.shuffleOrder 不拆題組", ok);
}
if (AHS.QuestionBankRuntime && AHS.QuestionBankRuntime.ensureBank) {
  AHS.QuestionBankRuntime.reset();
  AHS.QuestionBankRuntime.ensureBank("qg_bank", pool);
  ok = true;
  for (let t = 0; t < 30; t++) { if (!intact(AHS.QuestionBankRuntime.drawRandom("qg_bank", 10), pool)) { ok = false; } }
  check("QuestionBankRuntime.drawRandom 不拆題組", ok);
  ok = true;
  const all = {};
  for (let t = 0; t < 30; t++) {
    const d = AHS.QuestionBankRuntime.drawCycle("qg_bank", 10);
    if (!intact(d, pool) || new Set(d.map((q) => q.id)).size !== d.length) { ok = false; }
    d.forEach((q) => { all[q.id] = true; });
  }
  check("QuestionBankRuntime.drawCycle 不拆題組、單次不重複、每題都會出到", ok && Object.keys(all).length === pool.length);
}
if (AHS.RandomPracticeRuntime) {
  ok = true;
  for (let t = 0; t < 30; t++) {
    const p = AHS.RandomPracticeRuntime.pick({ count: 12, pools: [{ examId: "qg_bank", questions: pool }] });
    if (!intact(p, pool)) { ok = false; }
  }
  check("RandomPracticeRuntime.pick 不拆題組", ok);
}

console.log("\nQuestionGroupRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail ? 1 : 0);
