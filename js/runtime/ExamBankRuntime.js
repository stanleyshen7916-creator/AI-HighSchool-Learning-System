/* js/runtime/ExamBankRuntime.js — Sprint 8.0 · EO-S8.0-001
   Module 5 · Question Generator Mode A（Question Bank，來源：考卷）.

   原始題目逐字保留：ingest() is the only write path and there is NO
   update/edit method for question content — 不得修改 is structural.
   Ingestion is validated: the exam file must be classified
   documentType === "exam" by DocumentClassifierRuntime (Exam Upload
   Rule), the question text/answer must be real (non-empty), and every
   record must carry the full source trace (examFileId + knowledgeId
   optional page/paragraph, null until a parser exists). No default
   question bank ships — until a parser or AI Provider can extract
   questions from an uploaded exam, real questions enter via this
   validated API only (flagged in the EO report).

   select({ mode:"random", chapter?, difficulty?, count? }) supports
   Random / Chapter / Difficulty / Count draws. Random uses
   Math.random over the filtered pool（練習模式每次 Random）；filters
   are plain deterministic matches. Legacy AHS.QuestionBank (LOCK) is
   unrelated and untouched. */
window.AHS = window.AHS || {};
AHS.ExamBankRuntime = (function () {
  "use strict";
  var STORAGE_KEY = "examBank";

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.items)) { return loaded; }
    }
    return null;
  }
  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }
  var store = hydrate() || { items: [], seq: 0 };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function validate(record) {
    var errors = [];
    record = record || {};
    if (!record.examFileId) { errors.push("缺少 examFileId"); }
    var cls = AHS.DocumentClassifierRuntime
      ? AHS.DocumentClassifierRuntime.getByMaterialId(record.examFileId) : null;
    if (!cls || cls.documentType !== "exam") {
      errors.push("examFileId 未被 Classifier 判定為考卷（Exam Upload Rule）");
    }
    if (!String(record.question || "").trim()) { errors.push("原始題目不得為空"); }
    if (record.answer === undefined || record.answer === null || String(record.answer).trim() === "") {
      errors.push("原始答案不得為空");
    }
    if (!("sourcePage" in record)) { errors.push("缺少 sourcePage 欄位（可為 null）"); }
    return { valid: errors.length === 0, errors: errors };
  }

  /* ingest(input) — verbatim storage of an ORIGINAL exam question. */
  function ingest(input) {
    input = input || {};
    var record = {
      id: null,
      examFileId: input.examFileId || null,
      /* PMO Decision 4: reserved trace fields — null allowed until the
         Knowledge Graph content nodes exist; never AI-filled. */
      sourceFileId: input.sourceFileId || input.examFileId || null,
      subject: input.subject || null,
      chapter: String(input.chapter || ""),
      difficulty: String(input.difficulty || ""),
      questionType: String(input.questionType || ""),
      question: String(input.question || ""),
      options: Array.isArray(input.options) ? input.options.slice() : [],
      answer: input.answer,
      knowledgeId: input.knowledgeId || null,
      sourcePage: (input.sourcePage === undefined) ? null : input.sourcePage,
      sourceParagraph: (input.sourceParagraph === undefined) ? null : input.sourceParagraph,
      ingestedAt: new Date().toISOString()
    };
    var check = validate(record);
    if (!check.valid) { return null; }
    store.seq += 1;
    record.id = "eb_" + store.seq;
    store.items.push(record);
    persist();
    return clone(record);
  }

  /* select(opts) — Random / Chapter / Difficulty / Count. */
  function select(opts) {
    opts = opts || {};
    var pool = store.items.filter(function (q) {
      if (opts.examFileId && q.examFileId !== opts.examFileId) { return false; }
      if (opts.chapter && q.chapter !== opts.chapter) { return false; }
      if (opts.difficulty && q.difficulty !== opts.difficulty) { return false; }
      return true;
    });
    if (opts.mode === "random") {
      pool = pool.slice();
      for (var i = pool.length - 1; i > 0; i -= 1) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
    }
    var count = (typeof opts.count === "number" && opts.count > 0) ? opts.count : pool.length;
    return clone(pool.slice(0, count));
  }

  function list() { return clone(store.items); }
  function count() { return store.items.length; }
  function bankFor(examFileId) {
    return clone(store.items.filter(function (q) { return q.examFileId === examFileId; }));
  }
  function reset() { store = { items: [], seq: 0 }; persist(); }

  return { ingest: ingest, validate: validate, select: select, list: list, count: count, bankFor: bankFor, reset: reset };
})();
