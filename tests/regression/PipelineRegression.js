/* tests/regression/PipelineRegression.js — Learning Pipeline end-to-end
   regression: upload -> parse -> knowledge -> summary -> questions, with
   the Runtime chain's exact pre-refactor behavior. Zero logic changed by
   Repository Structure Standard v2.0 — this proves it.
   Run: node tests/regression/PipelineRegression.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
[
  "js/core/PersistenceAdapter.js", "js/runtime/MaterialRuntime.js",
  "js/parser/MaterialParser.js", "js/parser/KnowledgeBuilder.js",
  "js/runtime/KnowledgeRuntime.js", "js/parser/SummaryGenerator.js",
  "js/runtime/SummaryRuntime.js", "js/parser/QuestionGenerator.js",
  "js/runtime/LearningQuestionRuntime.js", "js/parser/LearningPipeline.js"
].forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(name, cond) { cond ? pass++ : (fail++, 0); console.log((cond ? "  PASS  " : "  FAIL  ") + name); }

const m = AHS.MaterialRuntime.add({ title: "回歸測試", subject: "math", grade: "高一", category: "講義", fileName: "t.pdf", fileType: "PDF" });
const r = AHS.LearningPipeline.process(m.id);
check("pipeline stage=done status=success", r.stage === "done" && r.status === "success");
check("validate() true", AHS.LearningPipeline.validate().valid === true);
const s = AHS.SummaryRuntime.findByMaterialId(m.id)[0];
check("summary record stored with fixed 5-section schema",
  !!s && ["coreConcepts","definitions","pitfalls","memorize","reviewSuggestions"].every(k => Array.isArray(s[k])));
check("no fabricated summary content (honest stubs upstream)",
  s.coreConcepts.length === 0 && s.definitions.length === 0 && s.pitfalls.length === 0);
const q = AHS.LearningQuestionRuntime.list();
check("completeness gate unchanged (1 candidate stored)", q.length === 1);
check("traceability intact", q[0].traceability.materialId === m.id && !!q[0].traceability.knowledgeId);
console.log("PipelineRegression: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
