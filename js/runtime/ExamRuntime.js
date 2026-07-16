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
    isRunning: isRunning,
    getCurrent: getCurrent,
    getById: getById,
    goTo: goTo,
    next: next,
    prev: prev,
    finish: finish,
    reset: reset
  };
})();
