/* tests/regression/FolderRuntimeV1.js — EO-S8.0-003 Foundation QA
   （Study Scope Baseline v1.0）. Run: node tests/regression/FolderRuntimeV1.js */
const vm = require("vm"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
global.window = global; global.AHS = {};
["js/core/PersistenceAdapter.js","js/runtime/MaterialRuntime.js","js/runtime/FolderRuntime.js"]
  .forEach(p => vm.runInThisContext(fs.readFileSync(path.join(ROOT, p), "utf8"), { filename: p }));
let pass = 0, fail = 0;
function check(n, c) { c ? pass++ : fail++; console.log((c ? "  PASS  " : "  FAIL  ") + n); }

const FR = AHS.FolderRuntime, MR = AHS.MaterialRuntime;
MR.reset();

console.log("\n[Runtime API — 恰七個公開 API]");
check("公開 API = createFolder/updateFolder/deleteFolder/getFolder/listFolders/validate/status",
  JSON.stringify(Object.keys(FR).sort()) ===
  JSON.stringify(["createFolder","deleteFolder","getFolder","listFolders","status","updateFolder","validate"]));

console.log("\n[Folder Schema + Validation]");
const f1 = FR.createFolder({ folderName: "第一次月考", subject: "math", scopeType: "exam", description: "高一上第一次月考範圍" });
check("createFolder 建立成功，Schema 欄位齊備",
  !!f1 && ["folderId","folderName","subject","scopeType","description","createdAt","updatedAt"].every(k => k in f1));
check("folderName 為空 → 拒絕建立",
  FR.createFolder({ folderName: "" }) === null && FR.createFolder({ folderName: "   " }) === null);
check("folderId 唯一（listFolders 無重複）",
  (() => { const ids = FR.listFolders().map(f => f.folderId); return new Set(ids).size === ids.length; })());
check("validate 拒絕空 folderName / 缺 folderId",
  !FR.validate(Object.assign({}, f1, { folderName: "" })).valid &&
  !FR.validate(Object.assign({}, f1, { folderId: null })).valid);
check("validate 拒絕非法 scopeType", !FR.validate(Object.assign({}, f1, { scopeType: "magic" })).valid);

console.log("\n[Folder Relationship — 預留關聯全為 null，不得建立實際內容]");
check("五項預留關聯欄位存在且為 null",
  ["knowledgeGraphId","summaryId","questionBankId","wrongBookId","reviewId"].every(k => k in f1 && f1[k] === null));
check("缺任一預留欄位 → validate 拒絕",
  ["knowledgeGraphId","summaryId","questionBankId","wrongBookId","reviewId"].every(k => {
    const r = Object.assign({}, f1); delete r[k]; return !FR.validate(r).valid; }));

console.log("\n[Material Binding — sourceFile → folderId，單一歸屬]");
const m1 = MR.add({ title: "三角函數", subject: "math", grade: "高一", category: "講義", fileName: "trig.pdf", fileType: "PDF", folderId: f1.folderId });
const m2 = MR.add({ title: "數列", subject: "math", grade: "高一", category: "講義", fileName: "seq.pdf", fileType: "PDF", folderId: f1.folderId });
const m3 = MR.add({ title: "未歸類教材", subject: "math", grade: "高一", category: "講義", fileName: "x.pdf", fileType: "PDF" });
check("getFolder 解析出綁定檔案（2 筆）",
  (() => { const g = FR.getFolder(f1.folderId); return g.fileCount === 2 &&
    g.files.every(x => [m1.id, m2.id].includes(x.sourceFileId)); })());
check("未綁定教材不屬於任何 Folder（folderId=null）", m3.folderId === null);
check("一個檔案只能屬於一個 Folder（material 僅單一 folderId 欄位）",
  MR.list().every(m => typeof m.folderId === "string" || m.folderId === null));
check("listFolders 帶出 fileCount", FR.listFolders()[0].fileCount === 2);

console.log("\n[updateFolder / deleteFolder]");
const upd = FR.updateFolder(f1.folderId, { folderName: "第一次月考（修訂）", description: "新增第三章", folderId: "hack", createdAt: "1999" });
check("可更新 folderName/description；identity 與 createdAt 鎖定",
  upd.folderName === "第一次月考（修訂）" && upd.description === "新增第三章" &&
  upd.folderId === f1.folderId && upd.createdAt === f1.createdAt && upd.updatedAt >= f1.updatedAt);
check("folderName 更新為空 → 拒絕，原記錄不變",
  FR.updateFolder(f1.folderId, { folderName: "" }) === null &&
  FR.getFolder(f1.folderId).folderName === "第一次月考（修訂）");
check("非法 scopeType 更新 → 整筆拒絕、原記錄不變",
  FR.updateFolder(f1.folderId, { scopeType: "magic" }) === null &&
  FR.getFolder(f1.folderId).scopeType === "exam");
check("預留關聯可由未來 EO 經同介面附掛",
  (() => { const r = FR.updateFolder(f1.folderId, { knowledgeGraphId: "kg_1" });
           const ok = r.knowledgeGraphId === "kg_1";
           FR.updateFolder(f1.folderId, { knowledgeGraphId: null }); return ok; })());
check("不存在之 folderId → update/get/delete 皆安全回傳",
  FR.updateFolder("fd_none", {}) === null && FR.getFolder("fd_none") === null && FR.deleteFolder("fd_none") === false);

console.log("\n[status()]");
const f2 = FR.createFolder({ folderName: "期末考", subject: "english", scopeType: "exam" });
check("無檔案 → empty；有檔案 → ready", FR.status(f2.folderId) === "empty" && FR.status(f1.folderId) === "ready");
check("附掛預留關聯 → analyzed",
  (() => { FR.updateFolder(f2.folderId, { summaryId: "an_1" });
           const s = FR.status(f2.folderId); FR.updateFolder(f2.folderId, { summaryId: null }); return s === "analyzed"; })());
check("未知 folderId → unknown", FR.status("fd_none") === "unknown");

console.log("\n[deleteFolder — 卸除關聯但不刪除檔案]");
const before = MR.list().length;
check("deleteFolder 成功", FR.deleteFolder(f1.folderId) === true);
check("檔案未被刪除（僅卸除 folderId）",
  MR.list().length === before && MR.list().filter(m => m.folderId === f1.folderId).length === 0);
check("Folder 記錄已移除", FR.getFolder(f1.folderId) === null && FR.status(f1.folderId) === "unknown");

console.log("\n[Runtime Rules — 零下游、零 AI、零圖譜修改（原始碼掃描）]");
const code = fs.readFileSync(path.join(ROOT, "js/runtime/FolderRuntime.js"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
["LearningQuestionGenerator","LearningQuestionSession","AnswerBuilderRuntime","KnowledgeGraphRuntime",
 "KnowledgeExtractionRuntime","AnalysisRuntime","SummaryRuntime","WrongBookGenerator","WrongBookSession",
 "ReviewQueue","ReviewModel","ExamBankRuntime","DocumentClassifierRuntime"].forEach(m => {
  check("程式碼未呼叫 " + m, code.indexOf("AHS." + m) === -1);
});
check("僅使用 MaterialRuntime 公開 API（list/addFolder/removeFolder）",
  /AHS\.MaterialRuntime/.test(code) && /addFolder|removeFolder|\.list\(\)/.test(code));
check("零網路呼叫", !/fetch\(|XMLHttpRequest/.test(code));
check("零 AI / 生成程式（無 generate/analyze/extract 呼叫）",
  !/\.generate\(|\.analyze\(|\.extract\(/.test(code));

console.log("\nFolderRuntimeV1: " + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
