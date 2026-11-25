/* docs/TeachingMaterials/scripts/TeachingMaterialSplit.js — queue 9.4 (T1/T2).

   Splits the one big AHS.TeachingMaterialData array (js/data/TeachingMaterialData.js, 4.7 MB and growing with every
   upload) into
     - js/data/TeachingMaterialIndex.js         one small record per material: everything a list page needs
                                                (material properties, related, counts, a content fingerprint)
     - js/data/materials-content/<id>.js        one file per material: its summary, questions and variants,
                                                registered in AHS.TeachingMaterialContentStore[<id>]
   so a page can load the index (~0.7 KB per material) and fetch a material's content only when it is opened.

   Nothing in here changes TeachingMaterialData.js: during the transition both exist and a test proves the split loses
   nothing (rebuild(index, content) deep-equals the original array).
   Pure functions + one `writeAll` that touches the disk, called from GenerateTeachingMaterialData.js. */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REPO_ROOT = path.join(__dirname, "..", "..", "..");
const INDEX_FILE = path.join(REPO_ROOT, "js", "data", "TeachingMaterialIndex.js");
const CONTENT_DIR = path.join(REPO_ROOT, "js", "data", "materials-content");
const CONTENT_FIELDS = ["summary", "questions", "variants"];

function contentOf(entry) {
  const c = {};
  CONTENT_FIELDS.forEach((k) => { if (entry[k] !== undefined) { c[k] = entry[k]; } });
  return c;
}

function fingerprint(content) {
  return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 16);
}

/* One index record. Everything of the entry except summary/questions/variants, plus counts and a fingerprint of the
   content file so a test (and a stale-cache check) can tell the pieces belong together. */
function indexRecord(entry) {
  const content = contentOf(entry);
  const rec = { materialId: entry.materialId, material: entry.material, related: entry.related };
  rec.counts = {
    questions: (entry.questions || []).length,
    variants: (entry.variants || []).length,
    hasSummary: !!entry.summary
  };
  rec.content = { file: "js/data/materials-content/" + entry.materialId + ".js", bytes: Buffer.byteLength(JSON.stringify(content), "utf8"), hash: fingerprint(content) };
  return rec;
}

function indexFileText(entries) {
  return [
    "/* js/data/TeachingMaterialIndex.js — GENERATED FILE, do not hand-edit.",
    "   Produced by docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js (queue 9.4).",
    "   One small record per material (properties, related, counts, content fingerprint).",
    "   The material's summary/questions live in js/data/materials-content/<id>.js and are",
    "   loaded on demand by js/runtime/TeachingMaterialContentLoader.js. Plain static data. */",
    "window.AHS = window.AHS || {};",
    "AHS.TeachingMaterialIndex = " + JSON.stringify(entries.map(indexRecord)) + ";",
    ""
  ].join("\n");
}

function contentFileText(entry) {
  return [
    "/* js/data/materials-content/" + entry.materialId + ".js — GENERATED FILE, do not hand-edit.",
    "   Summary, questions and variants of " + entry.materialId + " (see TeachingMaterialIndex.js). */",
    "window.AHS = window.AHS || {};",
    "AHS.TeachingMaterialContentStore = AHS.TeachingMaterialContentStore || {};",
    "AHS.TeachingMaterialContentStore[" + JSON.stringify(entry.materialId) + "] = " + JSON.stringify(contentOf(entry)) + ";",
    ""
  ].join("\n");
}

/* The inverse: put an index and a { id: content } store back together in index order. Used by the completeness test. */
function rebuild(index, store) {
  return index.map((rec) => {
    const out = { materialId: rec.materialId, material: rec.material };
    const c = store[rec.materialId];
    if (!c) { throw new Error("content missing for " + rec.materialId); }
    if (fingerprint(c) !== rec.content.hash) { throw new Error("content of " + rec.materialId + " does not match its index fingerprint"); }
    out.summary = c.summary;
    out.questions = c.questions;
    out.related = rec.related;
    if (c.variants !== undefined) { out.variants = c.variants; }
    return out;
  });
}

function writeAll(dataEntries, writeIfChanged) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const keep = {};
  dataEntries.forEach((e) => {
    const file = path.join(CONTENT_DIR, e.materialId + ".js");
    keep[path.basename(file)] = true;
    writeIfChanged(file, contentFileText(e));
  });
  // a material that is gone from the data (deleted/skipped) must not leave its content file behind
  fs.readdirSync(CONTENT_DIR).forEach((name) => {
    if (/^tm_\d+\.js$/.test(name) && !keep[name]) { fs.rmSync(path.join(CONTENT_DIR, name), { force: true }); }
  });
  writeIfChanged(INDEX_FILE, indexFileText(dataEntries));
  return { index: path.relative(REPO_ROOT, INDEX_FILE), contentFiles: dataEntries.length };
}

module.exports = { contentOf, fingerprint, indexRecord, indexFileText, contentFileText, rebuild, writeAll, INDEX_FILE, CONTENT_DIR };
