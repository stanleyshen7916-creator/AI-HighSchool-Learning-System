/* js/runtime/ExamRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   ExamRuntime owns the exam session state machine:
     draft -> ready -> running -> finished
   Enforces exactly one running exam at a time (starting a new exam while
   one is already "running" is rejected). Depends on AHS.QuestionRuntime
   (which in turn depends on AHS.QuestionBank) to materialize the
   question set for the session. In-memory only, PascalCase component
   under window.AHS. */
window.AHS = window.AHS || {};
AHS.ExamRuntime = (function () {
  "use strict";

  var STATES = { DRAFT: "draft", READY: "ready", RUNNING: "running", FINISHED: "finished" };

  /* sessions: examId -> session record. activeExamId: the single
     currently-running exam (or null). */
  var sessions = {};
  var activeExamId = null;
  var seq = 0;

  function buildExamId(meta) {
    seq += 1;
    var base = (meta.subject || "exam") + "_" + (meta.title || "quiz");
    return "exam_" + seq + "_" + base.replace(/\s+/g, "");
  }

  /* start(examMeta) — examMeta: { subject, title, chapter, grade,
     count, type, difficulty }. Creates a session in "draft", moves it
     to "ready", loads its question set via QuestionRuntime, then marks
     it "running". Returns the session (clone), or null if another exam
     is already running. */
  function start(examMeta) {
    if (activeExamId && sessions[activeExamId] && sessions[activeExamId].status === STATES.RUNNING) {
      return null;
    }
    var meta = examMeta || {};
    var examId = buildExamId(meta);
    var session = {
      examId: examId,
      subject: meta.subject || "other",
      title: meta.title || "未命名測驗",
      chapter: meta.chapter || "",
      grade: meta.grade || "高一",
      status: STATES.DRAFT,
      currentIndex: 0,
      totalQuestions: 0,
      startedAt: null,
      finishedAt: null
    };
    sessions[examId] = session;

    session.status = STATES.READY;
    var questions = AHS.QuestionRuntime.loadForExam({
      examId: examId,
      subject: session.subject,
      title: session.title,
      chapter: session.chapter,
      grade: session.grade,
      count: meta.count,
      type: meta.type,
      difficulty: meta.difficulty
    });
    session.totalQuestions = questions.length;

    /* Sprint AI-117 AI-117-09 Random Exam Session: real display-order
       shuffle on every session start, additive (QuestionRuntime.
       shuffleOrder() is new this Sprint; every other line above/below is
       unchanged). Question IDs/content are untouched — see that
       function's own header for why grading/Wrong Book/Statistics are
       provably unaffected. */
    if (typeof AHS.QuestionRuntime.shuffleOrder === "function") { AHS.QuestionRuntime.shuffleOrder(examId); }

    session.status = STATES.RUNNING;
    session.startedAt = new Date().toISOString();
    activeExamId = examId;

    return clone(session);
  }

  /* startFromExam(examId, meta) — Sprint v1.6 Module C, additive Runtime
     Extension (same sanctioned pattern as Sprint AI-103's
     QuestionRuntime.importQuestions(): "若 API 不足：請提出 Runtime
     Extension，不得自行建立 Parallel Runtime"). Unlike start(), this
     does NOT call buildExamId()/QuestionRuntime.loadForExam() — it never
     touches QuestionBank.generate() at all — it creates a RUNNING
     session directly for an examId whose question set was already
     written to QuestionRuntime by someone else (here,
     TeachingMaterialLoader.js via importQuestions()). meta supplies the
     session's display fields (subject/title/chapter/grade) — the caller
     is responsible for these being real, not fabricated. Returns null
     (same "can't start" contract as start()) if another exam is already
     running, or if QuestionRuntime has no question set for this examId
     — never creates an empty/broken session. start()/goTo()/next()/
     prev()/finish() are completely unmodified; sessions created either
     way are indistinguishable to every other function in this file. */
  function startFromExam(examId, meta) {
    if (activeExamId && sessions[activeExamId] && sessions[activeExamId].status === STATES.RUNNING) {
      return null;
    }
    if (!examId || !AHS.QuestionRuntime || typeof AHS.QuestionRuntime.hasExam !== "function" ||
        !AHS.QuestionRuntime.hasExam(examId)) {
      return null;
    }
    var m = meta || {};
    var session = {
      examId: examId,
      subject: m.subject || "other",
      title: m.title || "未命名測驗",
      chapter: m.chapter || "",
      grade: m.grade || "高一",
      status: STATES.DRAFT,
      currentIndex: 0,
      totalQuestions: 0,
      startedAt: null,
      finishedAt: null
    };
    sessions[examId] = session;

    session.status = STATES.READY;
    session.totalQuestions = AHS.QuestionRuntime.count(examId);

    /* Sprint AI-117 AI-117-09 Random Exam Session: this is the exact
       "重複練習" path AI-117-09 names — examId is stable across attempts
       here (unlike start()'s own per-call buildExamId()), so re-entering
       the SAME real exam (e.g. a Teaching-Material-sourced exam,
       Assessment Mode) now genuinely reshuffles display order each time
       while every question's own real id/content stays identical. */
    if (typeof AHS.QuestionRuntime.shuffleOrder === "function") { AHS.QuestionRuntime.shuffleOrder(examId); }

    session.status = STATES.RUNNING;
    session.startedAt = new Date().toISOString();
    activeExamId = examId;

    return clone(session);
  }

  function isRunning() {
    return !!(activeExamId && sessions[activeExamId] && sessions[activeExamId].status === STATES.RUNNING);
  }

  function getCurrent() {
    return activeExamId && sessions[activeExamId] ? clone(sessions[activeExamId]) : null;
  }

  function getById(examId) {
    return sessions[examId] ? clone(sessions[examId]) : null;
  }

  function goTo(examId, index) {
    var session = sessions[examId];
    if (!session || session.status !== STATES.RUNNING) { return null; }
    var max = session.totalQuestions - 1;
    session.currentIndex = Math.max(0, Math.min(max, index));
    return clone(session);
  }

  function next(examId) {
    var session = sessions[examId];
    if (!session) { return null; }
    return goTo(examId, session.currentIndex + 1);
  }

  function prev(examId) {
    var session = sessions[examId];
    if (!session) { return null; }
    return goTo(examId, session.currentIndex - 1);
  }

  /* finish(examId) — moves a running exam to "finished". Frees the
     "one running exam" slot. Returns the finalized session (clone), or
     null if the exam wasn't running. */
  function finish(examId) {
    var session = sessions[examId];
    if (!session || session.status !== STATES.RUNNING) { return null; }
    session.status = STATES.FINISHED;
    session.finishedAt = new Date().toISOString();
    if (activeExamId === examId) { activeExamId = null; }
    return clone(session);
  }

  /* abandon(examId) — Sprint AI-117 AI-117-08 Assessment Mode, additive
     Runtime Extension. Distinct from finish(): finish() is "the student
     submitted this exam", which js/components/QuizCenter.js's own
     finishExam() then grades (AutoGrader/WrongBookRuntime/HistoryRuntime)
     — switching 原始試卷/AI 練習 mid-session is not a submission, and
     must never grade/record a partial attempt. abandon() simply frees
     the "one running exam" slot and discards the session record so a
     new startFromExam() for the other mode can begin — no grading, no
     WrongBook/History write, nothing else in this file changed. */
  function abandon(examId) {
    if (!sessions[examId]) { return null; }
    if (activeExamId === examId) { activeExamId = null; }
    delete sessions[examId];
    return null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* reset() — test helper. */
  function reset() {
    sessions = {};
    activeExamId = null;
    seq = 0;
  }

  return {
    STATES: STATES,
    start: start,
    startFromExam: startFromExam,
    isRunning: isRunning,
    getCurrent: getCurrent,
    getById: getById,
    goTo: goTo,
    next: next,
    prev: prev,
    finish: finish,
    abandon: abandon,
    reset: reset
  };
})();
