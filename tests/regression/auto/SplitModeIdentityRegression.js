/* tests/regression/auto/SplitModeIdentityRegression.js — queue 9.4 T5 (2026-11-27).

   The teaching materials can reach a page two ways: the whole js/data/TeachingMaterialData.js (today), or the small
   js/data/TeachingMaterialIndex.js plus one js/data/materials-content/<id>.js per material, loaded when the page asks
   (after T7). For every workspace with materials, this runs the real pages both ways and requires the SAME result:
     - wrongbook.html: the list, every record's detail view (question, options, answers, figures, chapter, group
       context), and the stored records after the load-time canonicalization
     - the month-exam paper pool: subjects, pool counts and a seeded buildPaper() per subject
   It also checks that the split mode really loads only what the page needs (the wrong book's own materials; the
   workspace's materials for the month exam).

   Run: node tests/regression/auto/SplitModeIdentityRegression.js */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const REPO = path.resolve(__dirname, "..", "..", "..");
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("  PASS  " + name); }
  else { fail++; console.log("  FAIL  " + name + (detail ? "\n        " + detail : "")); }
}

global.window = global;
require(path.join(REPO, "js/data/TeachingMaterialIndex.js"));
const INDEX = global.AHS.TeachingMaterialIndex;
function content(id) {
  const sandbox = { AHS: {} };
  sandbox.window = sandbox;
  new Function("window", "AHS", fs.readFileSync(path.join(REPO, "js/data/materials-content", id + ".js"), "utf8"))(sandbox, sandbox.AHS);
  return sandbox.AHS.TeachingMaterialContentStore[id];
}

/* Deterministic Math.random for both runs (some widgets pick a random quote / order). */
function seededRandom(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function loadPage(htmlFile, { workspace, seed, split }) {
  const html = fs.readFileSync(path.join(REPO, htmlFile), "utf8");
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("error", (m) => errors.push(String(m)));
  vc.on("jsdomError", (e) => { const s = String(e && e.message || e); if (!/Could not load link|Could not parse CSS|not implemented/i.test(s)) { errors.push(s); } });
  const dom = new JSDOM(html, { url: "https://ahs.test/" + htmlFile, runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.fetch = () => Promise.reject(new Error("fetch disabled in test environment"));
  w.Math.random = seededRandom(20261127);
  const ns = workspace.studentId + "__" + workspace.schoolId + "__" + workspace.semesterIds.join("+");
  w.sessionStorage.setItem("ahs:workspace", JSON.stringify(workspace));
  Object.entries(seed || {}).forEach(([k, v]) => w.sessionStorage.setItem("ahs:" + ns + ":" + k, JSON.stringify(v)));
  const requested = [];
  const srcs = [...w.document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
  for (const src of srcs) {
    if (split && src === "js/data/TeachingMaterialData.js") {
      w.eval(fs.readFileSync(path.join(REPO, "js/data/TeachingMaterialIndex.js"), "utf8"));
      w.eval(fs.readFileSync(path.join(REPO, "js/runtime/TeachingMaterialContentLoader.js"), "utf8"));
      /* jsdom does not run dynamically added <script>s here: serve ensure() from the real content file instead. */
      const L = w.AHS.TeachingMaterialContentLoader;
      L.ensure = function (id) {
        requested.push(id); 
        return new w.Promise((resolve) => setTimeout(() => {
          w.eval(fs.readFileSync(path.join(REPO, "js/data/materials-content", id + ".js"), "utf8"));
          resolve(w.AHS.TeachingMaterialContentStore[id]);
        }, 0));
      };
      continue;
    }
    const p = path.join(REPO, src);
    if (!fs.existsSync(p)) { continue; }
    w.eval(fs.readFileSync(p, "utf8"));
  }
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
  return { w, errors, requested };
}
function settle() { return new Promise((r) => setTimeout(r, 50)); }

/* Strip ids that come from a counter / clock so two runs compare on content only. */
function norm(html) { return String(html).replace(/\b(id|for|aria-controls|aria-labelledby|aria-describedby)="[^"]*"/g, ""); }

async function wrongBookSnapshot(workspace, items, split) {
  const { w, errors, requested } = loadPage("wrongbook.html", { workspace, seed: { wrongBookRuntime: { items, seq: items.length } }, split });
  await settle();
  const app = w.document.getElementById("app");
  const out = { list: norm(app.innerHTML), details: [] };
  const rows = [...app.querySelectorAll("article")];
  for (let i = 0; i < rows.length; i++) {
    const r = [...w.document.getElementById("app").querySelectorAll("article")][i];
    if (!r) { break; }
    r.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    out.details.push(norm(w.document.getElementById("app").innerHTML));
  }
  out.stored = JSON.stringify(w.AHS.WrongBookRuntime.list());
  out.errors = errors;
  out.requested = [...new Set(requested)].sort();
  return out;
}

async function monthExamSnapshot(workspace, split) {
  const { w, errors, requested } = loadPage("monthexam.html", { workspace, split });
  await settle();
  const M = w.AHS.MonthExamRuntime;
  const subjects = M.listSubjects();
  const papers = subjects.map((s) => {
    const ids = (s.materials || s.items || []).map((m) => m.materialId || m.id).filter(Boolean);
    const rng = seededRandom(7);
    const paper = M.buildPaper(s.subject || s.name, ids, rng);
    return { subject: s.subject || s.name, counts: M.poolCounts(ids), qids: (paper.questions || []).map((q) => q.id || q.qid), poolSize: paper.poolSize };
  });
  return { subjects: JSON.stringify(subjects), papers: JSON.stringify(papers), paperCount: papers.length, errors, requested: [...new Set(requested)].sort() };
}

/* Wrong-book records built from real questions: a few per material in the workspace, plus every question that has a
   figure or belongs to a question group (the lookups most likely to go missing). Options are stored as plain text and
   answers as option text, the old format the load-time canonicalization rewrites. */
function wrongBookItemsFor(workspace, extra) {
  const items = [];
  const ws = INDEX.filter((r) => r.material.school === workspace.schoolId && workspace.semesterIds.indexOf(r.material.semester) !== -1);
  ws.forEach((rec, mi) => {
    if (mi % 3 !== 0) { return; }               // every third material: the subset must really be a subset
    const c = content(rec.materialId);
    const qs = (c && c.questions || []).filter((q) => Array.isArray(q.options) && q.options.length >= 2 && q.answer);
    const picked = qs.slice(0, 2).concat(qs.filter((q) => q.figureSvg).slice(0, 1), qs.filter((q) => /題組/.test(q.question || "")).slice(0, 1));
    picked.forEach((q, i) => {
      items.push({
        id: "wb_" + rec.materialId + "_" + i, questionId: q.id, subject: "history", title: rec.material.title,
        chapter: "", materialId: rec.materialId, knowledgePoint: q.knowledgePoint || "",
        question: q.question, options: q.options.slice().reverse(), yourAnswer: q.options[0], correctAnswer: q.answer,
        explanation: q.explanation || "", errorCount: 1, lastError: "2026/11/27 10:00", bookmarked: false, correctStreak: 0
      });
    });
  });
  return items.concat(extra || []);
}

(async () => {
  const workspaces = [
    { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g2s1"] },
    { studentId: "student_a", schoolId: "zwsh", semesterIds: ["g2s1"] },
    { studentId: "student_a", schoolId: "cjsh", semesterIds: ["g1s2"] }
  ];
  for (const ws of workspaces) {
    const label = ws.schoolId + "/" + ws.semesterIds.join("+");
    console.log("\n[wrongbook.html] " + label);
    const items = wrongBookItemsFor(ws);
    const full = await wrongBookSnapshot(ws, items, false);
    const split = await wrongBookSnapshot(ws, items, true);
    check(label + "：錯題 " + items.length + " 筆，清單相同", full.list === split.list && full.details.length === items.length);
    const diff = full.details.findIndex((d, i) => d !== split.details[i]);
    check(label + "：每筆詳細頁（題目、選項、答案、附圖、章節、題組）相同", diff === -1 && full.details.length === split.details.length,
      diff === -1 ? "" : "第 " + (diff + 1) + " 筆不同：" + items[diff].questionId);
    check(label + "：載入時的答案格式統一（canonicalize）結果相同", full.stored === split.stored);
    /* the material each record's question really lives in (merged supplement ids like tm_26_q1 live in tm_13) */
    const want = [...new Set(items.map((it) => it.materialId))].sort();
    check(label + "：只載入錯題用到的 " + want.length + " 份教材", JSON.stringify(split.requested) === JSON.stringify(want),
      "載入：" + split.requested.join(",") + "　預期：" + want.join(","));
    check(label + "：兩種模式都沒有錯誤", !full.errors.length && !split.errors.length, full.errors.concat(split.errors).join(" | "));

    /* On these pages the data file comes BEFORE WrongBookRuntime, so the load-time canonicalization sees the original
       questions; in the split mode it must wait for the content (isPending) and give the same records. */
    for (const page of ["quiz.html", "index.html"]) {
      const seed = { wrongBookRuntime: { items, seq: items.length } };
      const a = loadPage(page, { workspace: ws, seed, split: false });
      const b = loadPage(page, { workspace: ws, seed, split: true });
      await settle();
      const sa = JSON.stringify(a.w.AHS.WrongBookRuntime.list());
      const sb = JSON.stringify(b.w.AHS.WrongBookRuntime.list());
      check(label + "：" + page + " 載入後的錯題紀錄相同（含合併補充題庫的題目）", sa === sb);
      check(label + "：" + page + " 兩種模式都沒有錯誤", !a.errors.length && !b.errors.length, a.errors.concat(b.errors).join(" | "));
    }

    console.log("[monthexam] " + label);
    const mf = await monthExamSnapshot(ws, false);
    const ms = await monthExamSnapshot(ws, true);
    check(label + "：科目與範圍相同", mf.subjects === ms.subjects);
    check(label + "：" + mf.paperCount + " 科的題池數量與抽出的考卷完全相同", mf.paperCount > 0 && mf.papers === ms.papers);
    const wsIds = INDEX.filter((r) => r.material.school === ws.schoolId && ws.semesterIds.indexOf(r.material.semester) !== -1).map((r) => r.materialId).sort();
    check(label + "：只載入這個學校／學期的 " + wsIds.length + " 份教材", JSON.stringify(ms.requested) === JSON.stringify(wsIds));
    check(label + "：兩種模式都沒有錯誤", !mf.errors.length && !ms.errors.length, mf.errors.concat(ms.errors).join(" | "));
  }

  console.log("\n[wrongbook.html] 有一筆無法對應到教材的紀錄 → 全部載入");
  const ws = workspaces[0];
  const odd = { id: "wb_repo", questionId: "q_repo_1", subject: "math", title: "舊版教材", chapter: "", materialId: "repo_x",
    knowledgePoint: "", question: "1+1=?", options: ["1", "2"], yourAnswer: "1", correctAnswer: "2", explanation: "",
    errorCount: 1, lastError: "2026/11/27 10:00", bookmarked: false, correctStreak: 0 };
  const items = wrongBookItemsFor(ws, [odd]);
  const full = await wrongBookSnapshot(ws, items, false);
  const split = await wrongBookSnapshot(ws, items, true);
  check("對應不到教材時載入全部 " + INDEX.length + " 份", split.requested.length === INDEX.length);
  check("結果仍與整份資料模式相同", full.list === split.list && JSON.stringify(full.details) === JSON.stringify(split.details) && full.stored === split.stored);

  console.log("\nSplitModeIdentityRegression: " + pass + " PASS / " + fail + " FAIL");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
