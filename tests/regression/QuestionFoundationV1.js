/* tests/regression/QuestionFoundationV1.js — EO-S6.9-001 AI Question
   Generator Foundation validation: Schema Validation / Runtime
   Validation / Interface Validation, plus proof of zero interference
   with the LOCK Material / Summary / Practice(LearningQuestion)
   Runtimes. Run: node tests/regression/QuestionFoundationV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
[
  "js/core/PersistenceAdapter.js",
  "js/runtime/MaterialRuntime.js",
  "js/runtime/SummaryRuntime.js",
  "js/runtime/LearningQuestionRuntime.js",
  "js/parser/LearningQuestionGenerator.js",
  "js/runtime/LearningQuestionSession.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : fail++; console.log((cond ? "  PASS  " : "  FAIL  ") + name); }

const G = AHS.LearningQuestionGenerator, S = AHS.LearningQuestionSession;
S.reset();

/* ---- Interface Validation --------------------------------------------- */
check("Interface exposes generate/validate/normalize",
  ["generate", "validate", "normalize"].every(k => typeof G[k] === "function"));
check("Fixed 5 question types (LOCK)",
  JSON.stringify(G.QUESTION_TYPES) === JSON.stringify(["single_choice","multiple_choice","true_false","fill_blank","short_answer"]));
check("Fixed 3 difficulties (LOCK)",
  JSON.stringify(G.DIFFICULTIES) === JSON.stringify(["easy","medium","hard"]));
check("generate() with no real question => null (never a stub)", G.generate({}) === null);
check("generate() never invents difficulty (Ruling 2B)",
  (() => { const q = G.generate({ question: "x" }); return q.difficulty === ""; })());

/* ---- Schema Validation -------------------------------------------------- */
const realInput = {
  materialId: "rt_1", knowledgeId: "know_1", summaryId: "sr_1",
  subject: "math", grade: "高一", chapter: "第三章", section: "第一節",
  knowledgePoint: "三角函數定義", difficulty: "easy",
  questionType: "single_choice",
  question: "直角三角形斜邊 5、對邊 3，sinθ = ?",
  options: ["3/5", "4/5", "3/4", "5/3"], answer: "3/5",
  explanation: "sinθ = 對邊/斜邊 = 3/5。",
  reference: "教材《三角函數講義》第三章第一節",
  learningObjective: "能依定義計算 sin 值"
};
const good = G.generate(realInput);
const v = G.validate(good);
check("Complete real question passes validation", v.valid === true);
check("Schema v1.0 superset fields all present (Ruling 3A)",
  ["id","materialId","subject","grade","chapter","section","knowledgePoint","difficulty",
   "questionType","question","options","answer","explanation","reference","learningObjective",
   "relatedConcepts","source","traceability","metadata","createdAt"].every(k => k in good));
check("Traceability auto-filled from real refs",
  good.traceability.materialId === "rt_1" && good.traceability.knowledgeId === "know_1" && good.traceability.summaryId === "sr_1");

check("Missing answer rejected", !G.validate(G.generate({ ...realInput, answer: "" })).valid);
check("Missing explanation rejected", !G.validate(G.generate({ ...realInput, explanation: "" })).valid);
check("Missing knowledgePoint rejected", !G.validate(G.generate({ ...realInput, knowledgePoint: "" })).valid);
check("Illegal questionType rejected (不得新增其他格式)",
  !G.validate(G.generate({ ...realInput, questionType: "essay" })).valid);
check("Illegal difficulty rejected", !G.validate(G.generate({ ...realInput, difficulty: "extreme" })).valid);
check("Choice question without options rejected",
  !G.validate(G.generate({ ...realInput, options: [] })).valid);
check("Missing traceability rejected",
  !G.validate(G.generate({ ...realInput, materialId: null, knowledgeId: null, traceability: {} })).valid);
check("normalize() lowercases enums", G.normalize({ difficulty: "Easy", questionType: "Single_Choice" }).difficulty === "easy");

/* ---- Runtime Validation (Session v1.0) ---------------------------------- */
check("Session initial status = empty", S.getStatus() === "empty" && S.isEmpty());
check("Invalid record refused by add() (Validation Failed 不得加入)",
  S.add(G.generate({ ...realInput, answer: "" })) === null && S.count() === 0);
const stored = S.add(good);
check("Valid record stored; status flips to ready", !!stored && S.getStatus() === "ready" && S.count() === 1);
check("Question List query works", S.list().length === 1 && S.getById(stored.id).question === good.question);
check("findByMaterialId works", S.findByMaterialId("rt_1").length === 1);
check("Current Index: default 0, getCurrent() returns the record",
  S.getCurrentIndex() === 0 && S.getCurrent().id === stored.id);
check("Current Index clamped to range", S.setCurrentIndex(99) === 0 && S.setCurrentIndex(-5) === 0);
check("Metadata set/get", S.setMetadata({ materialId: "rt_1" }).materialId === "rt_1" && S.getMetadata().materialId === "rt_1");
check("No Practice/WrongBook/Score logic on Session API",
  ["saveAnswer","grade","score","syncWrongBook","finish","start"].every(k => !(k in S)));

/* ---- Non-interference with LOCK runtimes -------------------------------- */
check("MaterialRuntime untouched & callable", typeof AHS.MaterialRuntime.list === "function" && Array.isArray(AHS.MaterialRuntime.list()));
check("SummaryRuntime untouched & callable", typeof AHS.SummaryRuntime.list === "function" && Array.isArray(AHS.SummaryRuntime.list()));
check("Existing LearningQuestionRuntime untouched & callable",
  typeof AHS.LearningQuestionRuntime.list === "function" && Array.isArray(AHS.LearningQuestionRuntime.list()));
check("Session storage key distinct (no cross-write)",
  S.count() === 1 && AHS.LearningQuestionRuntime.list().length === 0);

console.log("QuestionFoundationV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
