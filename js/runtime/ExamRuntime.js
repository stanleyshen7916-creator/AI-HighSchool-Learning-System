/* js/runtime/ExamRuntime.js — Quiz Center Exam Runtime (WO-Q003).
   Follows the MaterialRuntime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   ExamRuntime is the Quiz Center exam-core Runtime. It draws questions
   from window.AHS.QuestionBank (which itself reads window.AHS.QuestionRuntime)
   and stores ONLY questionIds — never a copy of the full Question Object.
   There is no second Question Memory anywhere in this file; every full
   question lookup must go through QuestionBank.get() at render time.

   Scope (WO-Q003 LOCKED): Exam Runtime only. Does NOT implement Exam UI,
   Answer Runtime, Auto Grading, Wrong Book, Review, History, or
   Statistics — those are later Work Orders.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ExamRuntime = (function () {
  "use strict";

  var DIFF_ORDER = { "易": 1, "中等": 2, "難": 3 };

  /* ~5 fixed Developer Seed Exams (WO-Q003 spec): 數學/英文/國文/生物/化學.
     questionIds are drawn live from QuestionBank at (re)build time —
     never hardcoded — so they always reference real, existing questions. */
  var SEED_DEFS = [
    { title: "數學隨堂測驗", subject: "math", grade: "高一", chapter: "綜合複習", difficulty: "中等", questionCount: 3, duration: 20 },
    { title: "英文隨堂測驗", subject: "english", grade: "高一", chapter: "綜合複習", difficulty: "中等", questionCount: 3, duration: 20 },
    { title: "國文隨堂測驗", subject: "chinese", grade: "高一", chapter: "綜合複習", difficulty: "中等", questionCount: 3, duration: 20 },
    { title: "生物隨堂測驗", subject: "biology", grade: "高一", chapter: "綜合複習", difficulty: "中等", questionCount: 2, duration: 15 },
    { title: "化學隨堂測驗", subject: "chemistry", grade: "高一", chapter: "綜合複習", difficulty: "中等", questionCount: 3, duration: 20 }
  ];

  var store = {
    exams: [],
    seq: 0
  };

  function clone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }

  /* getBank() — the single, required data source. ExamRuntime never
     touches AHS.QuestionRuntime directly and never keeps its own copy
     of question content. */
  function getBank() {
    return (AHS.QuestionBank && typeof AHS.QuestionBank.random === "function")
      ? AHS.QuestionBank : null;
  }

  /* buildSeedExams() — draws questionIds for each seed definition via
     QuestionBank.random(count, {subject}). If the bank has no matching
     questions yet (e.g. QuestionRuntime not initialized), the exam is
     seeded with an empty questionIds list and status "draft" instead
     of failing. */
  function buildSeedExams() {
    var bank = getBank();
    var now = new Date().toISOString();
    return SEED_DEFS.map(function (def, i) {
      var picked = bank ? bank.random(def.questionCount, { subject: def.subject }) : [];
      var questionIds = picked.map(function (q) { return q.id; });
      return {
        id: "exam_seed_" + (i + 1),
        title: def.title,
        subject: def.subject,
        grade: def.grade,
        chapter: def.chapter,
        difficulty: def.difficulty,
        questionIds: questionIds,
        totalQuestions: questionIds.length,
        duration: def.duration,
        status: questionIds.length > 0 ? "ready" : "draft",
        createdAt: now,
        startedAt: null,
        finishedAt: null
      };
    });
  }

  /* init() — (re)populate the store from Seed Data. Idempotent; also
     the basis for reset(). Runtime-created exams use id prefix "exam_"
     (via seq); seed exams use "exam_seed_N" — the two id spaces never
     collide. */
  function init() {
    store.exams = buildSeedExams();
    store.seq = 0;
    return true;
  }

  function findById(id) {
    for (var i = 0; i < store.exams.length; i++) {
      if (store.exams[i].id === id) { return store.exams[i]; }
    }
    return null;
  }

  function findRunning() {
    for (var i = 0; i < store.exams.length; i++) {
      if (store.exams[i].status === "running") { return store.exams[i]; }
    }
    return null;
  }

  function list() {
    return clone(store.exams);
  }

  function get(examId) {
    var e = findById(examId);
    return e ? clone(e) : null;
  }

  /* create(options) — options: { title, subject, grade, chapter,
     difficulty, questionCount, duration, tags }. Questions are drawn
     via QuestionBank.random(); only their ids are kept. status is
     "ready" when questions were found, otherwise "draft". */
  function create(options) {
    options = options || {};
    var bank = getBank();
    var count = typeof options.questionCount === "number" ? options.questionCount : 10;
    var picked = bank ? bank.random(count, {
      subject: options.subject,
      grade: options.grade,
      chapter: options.chapter,
      difficulty: options.difficulty,
      tags: options.tags
    }) : [];
    var questionIds = picked.map(function (q) { return q.id; });

    store.seq += 1;
    var now = new Date().toISOString();
    var record = {
      id: "exam_" + store.seq,
      title: options.title || "未命名測驗",
      subject: options.subject || "",
      grade: options.grade || "高一",
      chapter: options.chapter || "",
      difficulty: options.difficulty || "中等",
      questionIds: questionIds,
      totalQuestions: questionIds.length,
      duration: typeof options.duration === "number" ? options.duration : 20,
      status: questionIds.length > 0 ? "ready" : "draft",
      createdAt: now,
      startedAt: null,
      finishedAt: null
    };
    store.exams.push(record);
    return clone(record);
  }

  /* update(exam) — exam.id required. Only metadata fields are editable
     here; status/startedAt/finishedAt/questionIds are lifecycle-owned
     by start()/finish()/create() and are not accepted through update(),
     to keep the state machine consistent. */
  function update(exam) {
    if (!exam || !exam.id) { return null; }
    var record = findById(exam.id);
    if (!record) { return null; }
    var fields = ["title", "subject", "grade", "chapter", "difficulty", "duration"];
    fields.forEach(function (f) {
      if (Object.prototype.hasOwnProperty.call(exam, f)) { record[f] = exam[f]; }
    });
    return clone(record);
  }

  function remove(examId) {
    var next = [];
    var removed = false;
    for (var i = 0; i < store.exams.length; i++) {
      if (store.exams[i].id === examId) { removed = true; }
      else { next.push(store.exams[i]); }
    }
    store.exams = next;
    return removed;
  }

  /* start(examId) — sets startedAt + status="running". Enforces "同時間
     僅允許一份 Running Exam": if a DIFFERENT exam is already running,
     start() is rejected (returns null) rather than force-finishing it. */
  function start(examId) {
    var running = findRunning();
    if (running && running.id !== examId) { return null; }
    var exam = findById(examId);
    if (!exam) { return null; }
    exam.startedAt = new Date().toISOString();
    exam.status = "running";
    return clone(exam);
  }

  /* finish(examId) — sets finishedAt + status="finished". Only valid
     from status "running"; otherwise returns null. */
  function finish(examId) {
    var exam = findById(examId);
    if (!exam || exam.status !== "running") { return null; }
    exam.finishedAt = new Date().toISOString();
    exam.status = "finished";
    return clone(exam);
  }

  function getCurrent() {
    var running = findRunning();
    return running ? clone(running) : null;
  }

  function isRunning() {
    return findRunning() !== null;
  }

  /* search(keyword) — matches title / subject / chapter (case-insensitive
     substring). Empty keyword returns the full list. */
  function search(keyword) {
    var k = String(keyword == null ? "" : keyword).trim().toLowerCase();
    if (!k) { return list(); }
    var out = store.exams.filter(function (e) {
      if (e.title && String(e.title).toLowerCase().indexOf(k) !== -1) { return true; }
      if (e.subject && String(e.subject).toLowerCase().indexOf(k) !== -1) { return true; }
      if (e.chapter && String(e.chapter).toLowerCase().indexOf(k) !== -1) { return true; }
      return false;
    });
    return clone(out);
  }

  /* filter(options) — options: { subject, grade, chapter, difficulty,
     status }. Unset / "all" fields are ignored. */
  function filter(options) {
    options = options || {};
    var out = store.exams.filter(function (e) {
      if (options.subject && options.subject !== "all" && e.subject !== options.subject) { return false; }
      if (options.grade && options.grade !== "all" && e.grade !== options.grade) { return false; }
      if (options.chapter && options.chapter !== "all" && e.chapter !== options.chapter) { return false; }
      if (options.difficulty && options.difficulty !== "all" && e.difficulty !== options.difficulty) { return false; }
      if (options.status && options.status !== "all" && e.status !== options.status) { return false; }
      return true;
    });
    return clone(out);
  }

  /* sort(type) — "newest" (default) | "oldest" | "subject" | "difficulty". */
  function sort(type) {
    var arr = list();
    switch (type) {
      case "oldest":
        arr.sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
        break;
      case "subject":
        arr.sort(function (a, b) { return String(a.subject).localeCompare(String(b.subject)); });
        break;
      case "difficulty":
        arr.sort(function (a, b) {
          return (DIFF_ORDER[a.difficulty] || 0) - (DIFF_ORDER[b.difficulty] || 0);
        });
        break;
      case "newest":
      default:
        arr.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    }
    return arr;
  }

  /* reset() — restores the store back to the fixed Developer Seed Data
     (~5 exams: 數學/英文/國文/生物/化學). */
  function reset() {
    return init();
  }

  return {
    init: init,
    list: list,
    get: get,
    create: create,
    update: update,
    remove: remove,
    start: start,
    finish: finish,
    getCurrent: getCurrent,
    isRunning: isRunning,
    search: search,
    filter: filter,
    sort: sort,
    reset: reset
  };
})();
