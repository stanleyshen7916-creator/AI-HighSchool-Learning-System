/* tests/regression/ImportRuntimeV1.js — Sprint AI-103 · Content Import Runtime.
   Verifies: ImportValidator (required field/JSON parse/markdown/version/
   duplicate checks), MetadataParser (11 fixed fields, defensive
   defaults), ContentLoader (map path + File-object path, Material.md
   header/body split), ImportRuntime (full coordinator flow, zero
   internal store, calls only existing Runtime APIs), the one Runtime
   Extension on QuestionRuntime.importQuestions() (purely additive,
   every pre-existing method unchanged), WrongBookRuntime.sync() reuse
   (no extension), and regression on every existing Runtime this Sprint
   touches or reuses.
   Run: node tests/regression/ImportRuntimeV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};

const FILES = [
  "js/core/PersistenceAdapter.js",
  "js/runtime/MaterialRuntime.js",
  "js/runtime/SummaryRuntime.js",
  "js/runtime/QuestionRuntime.js",
  "js/runtime/WrongBookRuntime.js",
  "js/runtime/ImportValidator.js",
  "js/runtime/MetadataParser.js",
  "js/runtime/ContentLoader.js",
  "js/runtime/ImportRuntime.js"
];
FILES.forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));

let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const IV = AHS.ImportValidator, MP = AHS.MetadataParser, CL = AHS.ContentLoader,
      IR = AHS.ImportRuntime, MR = AHS.MaterialRuntime, SR = AHS.SummaryRuntime,
      QR = AHS.QuestionRuntime, WR = AHS.WrongBookRuntime;

MR.reset(); SR.reset(); QR.reset(); WR.reset();

const VALID_METADATA = JSON.stringify({
  subject: "math", grade: "高一", publisher: "測試出版社", version: "1.0",
  chapter: "第三章", unit: "三角函數", difficulty: "medium", tags: ["三角函數", "幾何"],
  author: "測試作者", createdTime: "2026-01-01", updatedTime: "2026-01-02"
});
const VALID_MATERIAL_MD = "Subject: math\nGrade: 高一\nChapter: 第三章\nUnit: 三角函數\n\n# 三角函數講義\n\n本章介紹三角函數的定義與應用。正弦、餘弦、正切為基本三角函數。";
const VALID_SUMMARY = JSON.stringify({ Summary: "本章重點整理", KeyPoints: ["正弦定義", "餘弦定義"], Keywords: ["三角函數"], Memory: ["SOH-CAH-TOA"] });
const VALID_QUIZ = JSON.stringify([
  { id: "q1", type: "single_choice", question: "sin(90°) = ?", options: ["0", "1", "-1", "0.5"], knowledgePoint: "正弦" },
  { id: "q2", type: "true_false", question: "cos(0°) = 1", options: ["True", "False"], knowledgePoint: "餘弦" },
  { id: "q3", type: "essay_unsupported", question: "unsupported type", options: [] }
]);
const VALID_ANSWER = JSON.stringify([
  { id: "q1", answer: "1", explanation: "sin(90°) 的值為 1" },
  { id: "q2", answer: "True", explanation: "cos(0°) 的值為 1" }
]);
const VALID_ERRORBOOK = JSON.stringify([
  { questionId: "q1", question: "sin(90°) = ?", options: ["0", "1", "-1", "0.5"], yourAnswer: "0", correctAnswer: "1", explanation: "sin(90°) 的值為 1", knowledgePoint: "正弦" }
]);

function validRawFiles(overrides) {
  return Object.assign({
    "Material.md": VALID_MATERIAL_MD,
    "Metadata.json": VALID_METADATA,
    "Summary.json": VALID_SUMMARY,
    "Quiz.json": VALID_QUIZ,
    "Answer.json": VALID_ANSWER,
    "ErrorBook.json": VALID_ERRORBOOK
  }, overrides || {});
}

console.log("\n[ImportValidator — Required Field / JSON Parse / Markdown / Version / Duplicate]");
check("完整合法檔案通過驗證", IV.validate(validRawFiles()).valid === true);
check("缺少 Material.md 驗證失敗", IV.validate(validRawFiles({ "Material.md": undefined })).errors.some(e => e.indexOf("Material.md") !== -1));
check("缺少 Metadata.json 驗證失敗", IV.validate(validRawFiles({ "Metadata.json": undefined })).errors.some(e => e.indexOf("Metadata.json: missing") !== -1));
check("非法 JSON 驗證失敗", IV.validate(validRawFiles({ "Summary.json": "{not valid json" })).errors.some(e => e.indexOf("invalid JSON") !== -1));
check("Metadata 缺少必填欄位驗證失敗", IV.validate(validRawFiles({ "Metadata.json": JSON.stringify({ subject: "math" }) })).errors.length > 0);
check("不支援的 version 驗證失敗", IV.validate(validRawFiles({ "Metadata.json": JSON.stringify(Object.assign(JSON.parse(VALID_METADATA), { version: "9.9" })) })).errors.some(e => e.indexOf("unsupported version") !== -1));
check("不合法檔名驗證失敗", IV.validate(validRawFiles({ "Extra.json": "{}" })).errors.some(e => e.indexOf("Unrecognized filename") !== -1));
check("Material.md 缺少內容主體驗證失敗", IV.validate(validRawFiles({ "Material.md": "Subject: math\n" })).errors.some(e => e.indexOf("no content body") !== -1));

console.log("\n[MetadataParser — 11 個固定欄位]");
const parsedMeta = MP.parse(VALID_METADATA);
check("11 個欄位齊全", JSON.stringify(Object.keys(parsedMeta).sort()) === JSON.stringify(MP.FIELDS.slice().sort()));
check("欄位值正確", parsedMeta.subject === "math" && parsedMeta.chapter === "第三章" && parsedMeta.tags.length === 2);
check("非法輸入不拋錯，回傳誠實預設值", (function () {
  const r = MP.parse("not valid json");
  return r.subject === null && Array.isArray(r.tags) && r.tags.length === 0;
})());

console.log("\n[ContentLoader — Material.md header/body 分離 + JSON 解析]");
const loadedSync = CL.loadFromMap(validRawFiles());
check("Material header 正確解析", loadedSync.material.header.subject === "math" && loadedSync.material.header.unit === "三角函數");
check("Material body 不含 header 行", loadedSync.material.body.indexOf("Subject:") === -1 && loadedSync.material.body.indexOf("三角函數講義") !== -1);
check("Summary/Quiz/Answer/Metadata/ErrorBook 皆正確解析為物件", loadedSync.summary && Array.isArray(loadedSync.quiz) && Array.isArray(loadedSync.answer) && loadedSync.metadata && Array.isArray(loadedSync.errorBook));
let fileObjectLoadDone = false, fileObjectLoadOk = false;
CL.load([{ name: "Material.md", text: function () { return Promise.resolve(VALID_MATERIAL_MD); } }])
  .then(r => { fileObjectLoadOk = r.material.header.subject === "math"; fileObjectLoadDone = true; });

console.log("\n[ImportRuntime — 端對端 Coordinator 流程]");
IR.importFolder(validRawFiles()).then(function (result) {
  check("importFolder() 成功", result.success === true);
  check("Material 透過既有 AHS.MaterialRuntime.add() 建立（真實記錄於 Runtime 中）",
    result.material.id && MR.getById(result.material.id) !== null);
  check("Material 標題來自 Markdown 第一個標題", result.material.title === "三角函數講義");
  check("Summary 透過既有 AHS.SummaryRuntime.add() 建立", result.summary && SR.getById(result.summary.id) !== null);
  check("Summary coreConcepts 對應 KeyPoints", result.summary.coreConcepts.length === 2);
  check("Summary memorize 對應 Memory", result.summary.memorize.length === 1);
  check("Quiz 透過 QuestionRuntime.importQuestions() Extension 寫入", QR.hasExam(result.quiz.examId) === true);
  check("不支援題型（essay_unsupported）被跳過並產生 warning", result.warnings.some(w => w.indexOf("unsupported or missing type") !== -1));
  check("合法題型（single_choice/true_false）皆正確匯入（2 題，非 3 題）", QR.count(result.quiz.examId) === 2);
  check("Quiz 與 Answer 正確合併（q1 answer 來自 Answer.json）",
    QR.getQuestionById(result.quiz.examId, "q1").answer === "1");
  check("ErrorBook 透過既有 AHS.WrongBookRuntime.sync() 寫入", WR.list().length === 1);
  check("WrongBook 記錄保留真實 traceability（questionId/correctAnswer/explanation）",
    WR.list()[0].questionId === "q1" && WR.list()[0].correctAnswer === "1" && !!WR.list()[0].explanation);

  console.log("\n[Validator 失敗時零 Runtime 寫入]");
  MR.reset(); SR.reset(); QR.reset(); WR.reset();
  return IR.importFolder(validRawFiles({ "Metadata.json": undefined }));
}).then(function (invalidResult) {
  check("驗證失敗時 importFolder() 回傳 success:false", invalidResult.success === false);
  check("驗證失敗時零 Material 被建立", MR.list().length === 0);
  check("驗證失敗時零 Summary 被建立", SR.isEmpty() === true);
  check("驗證失敗時零 WrongBook 記錄被建立", WR.isEmpty() === true);

  console.log("\n[ImportRuntime 本身不保存資料 — 無內部 store]");
  check("ImportRuntime 公開介面僅 importFolder 一個方法（無 store/get/list 等資料存取方法）",
    JSON.stringify(Object.keys(AHS.ImportRuntime)) === JSON.stringify(["importFolder"]));

  console.log("\n[Runtime Extension — QuestionRuntime.importQuestions() 純新增，既有方法零變動]");
  QR.reset();
  const examMeta = { examId: "regression_check" };
  check("既有 hasExam()/count()/getSet() 等既有方法仍完整存在",
    ["loadForExam", "hasExam", "getSet", "count", "getQuestion", "getQuestionById", "clear", "reset"]
      .every(fn => typeof QR[fn] === "function"));
  QR.importQuestions("ex1", [{ id: "a", type: "single_choice" }]);
  check("importQuestions() 寫入的資料可透過既有 getSet()/count()/getQuestionById() 讀取（同一份 store）",
    QR.count("ex1") === 1 && QR.getSet("ex1").length === 1 && QR.getQuestionById("ex1", "a").id === "a");

  console.log("\n[回歸 — 既有 WrongBookRuntime.sync() 契約未被修改]");
  WR.reset();
  const directSync = WR.sync({ subject: "math", title: "t", chapter: "c", wrong: [{ questionId: "x1", text: "q", options: [], yourAnswer: "a", correctAnswer: "b", explanation: "e", knowledgePoint: "k" }] });
  check("既有 sync() 呼叫方式與行為完全不變（非本 Sprint 修改）", directSync.length === 1 && directSync[0].questionId === "x1");

  setTimeout(function () {
    check("ContentLoader 的 File 物件路徑（非同步）正確運作", fileObjectLoadDone && fileObjectLoadOk);
    console.log("\n" + pass + " PASS / " + fail + " FAIL");
    process.exit(fail === 0 ? 0 : 1);
  }, 10);
}).catch(function (err) {
  console.log("FATAL: " + (err && err.stack || err));
  process.exit(1);
});
