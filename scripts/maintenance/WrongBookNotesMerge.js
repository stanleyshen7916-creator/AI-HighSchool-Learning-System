/* scripts/maintenance/WrongBookNotesMerge.js — 2026-11-08 知識弱點「重點整理」省 token 改版.

   撰寫的 AI 不再讀寫整個 js/data/WrongBookNotesData.js（已數百 KB，每次讀取都要花大量
   token），只把新筆記寫進一個小的 JSON 檔：{ "<questionId>": { …筆記… }, … }。
   本腳本把它併入 WrongBookNotesData.js（同 id 取代——複核模式用），並重新輸出整個物件。

     node scripts/maintenance/WrongBookNotesMerge.js --in <new-notes.json>
     → 印出 "merged <新增> added, <取代> replaced"；JSON 格式錯誤時 exit 1、不改檔。
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

function merge(file, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    throw new Error("新筆記必須是 { questionId: 筆記 } 物件");
  }
  const src = fs.readFileSync(file, "utf8");
  const at = src.indexOf(MARKER);
  if (at === -1) { throw new Error("找不到 " + MARKER.trim()); }
  const notes = loadNotes(file);
  let added = 0, replaced = 0;
  Object.keys(incoming).forEach((id) => {
    const note = incoming[id];
    if (!id || !note || typeof note !== "object") { return; }
    if (Object.prototype.hasOwnProperty.call(notes, id)) { replaced++; } else { added++; }
    notes[id] = note;
  });
  fs.writeFileSync(file, render(src.slice(0, at), notes), "utf8");
  return { added, replaced };
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
  console.log("merged " + r.added + " added, " + r.replaced + " replaced");
  return 0;
}

if (require.main === module) { process.exitCode = main(process.argv.slice(2)); }

module.exports = { merge, render, MARKER };
