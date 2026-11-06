/* scripts/maintenance/WrongBookNotesPending.js — 2026-11-06 知識弱點「重點整理」自動產生.

   找出「還在知識弱點裡、但 js/data/WrongBookNotesData.js 還沒有重點整理」的錯題，
   寫成一份 JSON 給本機的 Claude Code 撰寫重點整理與類題
   （ai-engine/council/tools/wrongbook-notes.ps1 呼叫）。

   只讀 Supabase（wrong_book、subjects），不寫入任何資料。需要 service_role 金鑰
   （和 SetAccountPasswords.js 相同），只放在本機環境變數，絕不 commit：
     SUPABASE_SERVICE_ROLE_KEY=... node scripts/maintenance/WrongBookNotesPending.js --out <file> [--max 15]

   輸出：{ generatedAt, total, items: [{ questionId, subject, knowledgePoint, question,
   options, yourAnswer, correctAnswer, explanation, errorCount }] }
   同一題（local_question_id）多筆時只列一次；沒有 local_question_id 的紀錄無法對應
   筆記，略過。依錯誤次數多的優先。 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const REPO = path.join(__dirname, "..", "..");

function defaultSupabaseUrl() {
  const src = fs.readFileSync(path.join(REPO, "js", "data", "SupabaseConfig.js"), "utf8");
  const m = src.match(/url:\s*"([^"]+)"/);
  return m ? m[1] : "";
}

/* 舊版 service_role 是 JWT（兩個標頭都要）；sb_secret_ 只放 apikey。 */
function authHeaders(serviceKey) {
  const h = { apikey: serviceKey };
  if (/^eyJ/.test(serviceKey)) { h.Authorization = "Bearer " + serviceKey; }
  return h;
}

function existingNoteIds(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8").replace(/^window\.AHS = window\.AHS \|\| \{\};/m, "window.AHS = {}; var AHS = window.AHS;"), sandbox);
  return Object.keys((sandbox.window.AHS && sandbox.window.AHS.WrongBookNotesData) || {});
}

function pendingFrom(rows, haveIds, max) {
  const have = new Set(haveIds);
  const byId = new Map();
  rows.forEach((r) => {
    const id = r.local_question_id;
    if (!id || have.has(id)) { return; }
    const prev = byId.get(id);
    if (prev && (prev.errorCount || 0) >= (r.error_count || 0)) { return; }
    byId.set(id, {
      questionId: id,
      subject: (r.subjects && r.subjects.code) || "",
      knowledgePoint: r.knowledge_point || "",
      question: r.question_text || "",
      options: Array.isArray(r.options) ? r.options : [],
      yourAnswer: r.your_answer || "",
      correctAnswer: r.correct_answer || "",
      explanation: r.explanation || "",
      errorCount: r.error_count || 0
    });
  });
  const all = Array.from(byId.values()).sort((a, b) => b.errorCount - a.errorCount);
  return { total: all.length, items: all.slice(0, max) };
}

async function fetchRows(url, serviceKey, fetchImpl) {
  const q = "/rest/v1/wrong_book?deleted_at=is.null&select=local_question_id,knowledge_point,question_text,options,your_answer,correct_answer,explanation,error_count,subjects(code)";
  const res = await fetchImpl(url + q, { headers: authHeaders(serviceKey) });
  if (!res.ok) { throw new Error("讀取 wrong_book 失敗：HTTP " + res.status); }
  return res.json();
}

async function main(argv) {
  const outAt = argv.indexOf("--out");
  const maxAt = argv.indexOf("--max");
  if (outAt === -1 || !argv[outAt + 1]) {
    console.error("Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/maintenance/WrongBookNotesPending.js --out <file> [--max 15]");
    return 2;
  }
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceKey) { console.error("SUPABASE_SERVICE_ROLE_KEY 沒有設定"); return 2; }
  const max = maxAt !== -1 ? Math.max(1, parseInt(argv[maxAt + 1], 10) || 15) : 15;
  const rows = await fetchRows(process.env.SUPABASE_URL || defaultSupabaseUrl(), serviceKey, fetch);
  const result = pendingFrom(rows, existingNoteIds(path.join(REPO, "js", "data", "WrongBookNotesData.js")), max);
  const out = path.resolve(argv[outAt + 1]);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(Object.assign({ generatedAt: new Date().toISOString() }, result), null, 2), "utf8");
  console.log("pending " + result.items.length + " / " + result.total);
  return 0;
}

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (err) => { console.error(String(err && err.message || err)); process.exitCode = 1; });
}

module.exports = { pendingFrom, existingNoteIds, authHeaders };
