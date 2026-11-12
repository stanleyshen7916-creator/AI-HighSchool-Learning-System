/* scripts/maintenance/WrongBookNotesMerge.js — 2026-11-08 知識弱點「重點整理」省 token 改版.

   撰寫的 AI 不再讀寫整個 js/data/WrongBookNotesData.js（已數百 KB，每次讀取都要花大量
   token），只把新筆記寫進一個小的 JSON 檔：{ "<questionId>": { …筆記… }, … }。
   本腳本把它併入 WrongBookNotesData.js（同 id 取代——複核模式用），並重新輸出整個物件。

     node scripts/maintenance/WrongBookNotesMerge.js --in <new-notes.json>
     → 印出 "merged <新增> added, <取代> replaced, <略過> skipped"（格式不合格的筆記逐筆略過，
       每筆先印一行 "SKIP <questionId>：<原因>"）；JSON 格式錯誤時 exit 1、不改檔。
     node scripts/maintenance/WrongBookNotesMerge.js --example <questionId> --out <file>
     → 把一筆既有筆記輸出成 JSON，給 AI 當格式範例。 */
"use strict";
const fs = require("fs");
const path = require("path");
const { loadNotes } = require("./WrongBookNotesPending.js");

const REPO = path.join(__dirname, "..", "..");
const NOTES_FILE = path.join(REPO, "js", "data", "WrongBookNotesData.js");
const MARKER = "AHS.WrongBookNotesData = ";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
}

/* 一題一行（壓縮的 JSON），檔案小、每次新增在 PR 裡就是幾行新增。 */
function render(header, notes) {
  const lines = Object.keys(notes).map((id) => "  " + JSON.stringify(id) + ": " + JSON.stringify(notes[id]));
  return header + MARKER + "{\n" + lines.join(",\n") + "\n};\n";
}

function stepText(steps) {
  return (steps || []).map((t) => (t && typeof t === "object") ? [t.title].concat(t.lines || [], t.note || []).join(" ") : String(t)).join(" ");
}
function bracesBalanced(str) {
  let d = 0;
  for (const c of str) { if (c === "{") d++; if (c === "}") d--; if (d < 0) return false; }
  return d === 0;
}

/* 2026-11-12 一筆筆記的格式規則（回傳不合格的項目，空陣列＝合格）。合併時逐筆檢查：
   不合格的那一筆略過，不再讓整批 15 題一起作廢；tests/regression/WrongBookDeleteRegression.js
   用同一份規則檢查正式資料。延伸閱讀可以是空陣列（課文題找不到合適網址時不編造）。 */
function validateNote(n) {
  const bad = [];
  const rule = (label, ok) => { if (!ok) { bad.push(label); } };
  if (!n || typeof n !== "object") { return ["不是物件"]; }
  const refs = Array.isArray(n.references) ? n.references : null;
  rule("有 keyPoint、steps、references", !!n.keyPoint && Array.isArray(n.steps) && n.steps.length > 0 && !!refs);
  if (bad.length) { return bad; }
  rule("連結都是 https", refs.every((r) => r && /^https:\/\//.test(r.url) && r.title));
  rule("basis 標示【確認】或【推論】", /【確認】|【推論】/.test(n.basis || ""));
  const body = [n.keyPoint, stepText(n.steps)].concat(n.traps || [], n.formulas || [], Object.values(n.whyWrong || {})).join(" ");
  const variants = Array.isArray(n.variants) ? n.variants : [];
  rule("算式標記的大括號成對", bracesBalanced(body + stepText([].concat.apply([], variants.map((v) => v.steps || [])))));
  rule("方程式步驟都有標題與算式", n.steps.every((t) => typeof t === "string" || (t && t.title && Array.isArray(t.lines) && t.lines.length)));
  rule("內文不寫 (A)~(E) 選項字母", !/[(（][A-E][)）]/.test(body));
  if (n.errorType) {
    rule("errorType 只用觀念／計算／審題／記憶", Object.values(n.errorType).every((t) => ["觀念", "計算", "審題", "記憶"].indexOf(t) !== -1));
  }
  const hintCounts = variants.map((v) => (v.hints || []).length);
  if (hintCounts.some((c) => c > 0)) {
    rule("類題提示逐題遞減（漸進撤除）", hintCounts.every((c, i) => i === 0 || c <= hintCounts[i - 1]));
  }
  variants.forEach((v, i) => {
    const keys = (v.options || []).map((o) => o.key);
    /* 類題在頁面上一律以單選作答，correctAnswer 必須是其中一個選項代號 */
    rule("類題" + (i + 1) + "：題目與原題不同、正確答案在選項中", !!v.question && v.question !== n.question && keys.indexOf(v.correctAnswer) !== -1 && keys.length >= 2);
    rule("類題" + (i + 1) + "：詳解不寫選項字母", !/[(（][A-E][)）]/.test(stepText(v.steps)));
  });
  return bad;
}

/* 回傳 { added, replaced, skipped: [{ id, problems }] }；skipped 是格式不合格、沒有併入的筆記。 */
function merge(file, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    throw new Error("新筆記必須是 { questionId: 筆記 } 物件");
  }
  const skipped = [];
  const src = fs.readFileSync(file, "utf8");
  const at = src.indexOf(MARKER);
  if (at === -1) { throw new Error("找不到 " + MARKER.trim()); }
  const notes = loadNotes(file);
  let added = 0, replaced = 0;
  Object.keys(incoming).forEach((id) => {
    const note = incoming[id];
    if (!id || !note || typeof note !== "object") { return; }
    const problems = validateNote(note);
    if (problems.length) { skipped.push({ id, problems }); return; }
    if (Object.prototype.hasOwnProperty.call(notes, id)) { replaced++; } else { added++; }
    notes[id] = note;
  });
  /* 2026-11-12：沿用檔案原本的換行。Windows（core.autocrlf=true）的工作目錄是 CRLF，
     寫成 LF 會讓 git 每次都印「LF will be replaced by CRLF」警告。 */
  let out = render(src.slice(0, at).replace(/\r\n/g, "\n"), notes);
  if (src.indexOf("\r\n") !== -1) { out = out.replace(/\n/g, "\r\n"); }
  fs.writeFileSync(file, out, "utf8");
  return { added, replaced, skipped };
}

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : undefined;
}

function main(argv) {
  if (arg(argv, "--example")) {
    const note = loadNotes(NOTES_FILE)[arg(argv, "--example")];
    if (!note) { console.error("沒有這筆筆記"); return 1; }
    fs.writeFileSync(path.resolve(arg(argv, "--out")), JSON.stringify({ [arg(argv, "--example")]: note }, null, 2), "utf8");
    return 0;
  }
  const input = arg(argv, "--in");
  if (!input) { console.error("Usage: node scripts/maintenance/WrongBookNotesMerge.js --in <new-notes.json>"); return 2; }
  let incoming;
  try { incoming = readJson(path.resolve(input)); } catch (e) { console.error("新筆記 JSON 格式錯誤：" + e.message); return 1; }
  const r = merge(NOTES_FILE, incoming);
  r.skipped.forEach((s) => { console.log("SKIP " + s.id + "：" + s.problems.join("；")); });
  console.log("merged " + r.added + " added, " + r.replaced + " replaced, " + r.skipped.length + " skipped");
  return 0;
}

if (require.main === module) { process.exitCode = main(process.argv.slice(2)); }

module.exports = { merge, render, validateNote, MARKER };
