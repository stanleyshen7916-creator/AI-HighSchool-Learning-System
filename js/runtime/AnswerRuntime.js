/* js/runtime/AnswerRuntime.js — Quiz Center Answer Runtime (WO-Q005).
   Follows the MaterialRuntime / QuestionRuntime Pattern (LOCKED):
     window.AHS → Runtime → Render → UI

   AnswerRuntime manages exam ANSWER SESSIONS only. It cross-references
   window.AHS.ExamRuntime (to know which exam / which questionIds an
   Answer Session belongs to) and window.AHS.QuestionBank (to validate a
   questionId is a real question) — it never stores a copy of question
   content itself, so there is no second Question Memory anywhere here.

   Scope (WO-Q005 LOCKED): Answer Session bookkeeping only.
   - finish() ends the Answer Session. It does NOT grade, does NOT
     compute a score, does NOT touch Wrong Book, does NOT touch
     Statistics, and does NOT modify AHS.ExamRuntime in any way.
   - Auto Grading / Wrong Book / Review / History / Statistics are
     later Work Orders.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AnswerRuntime = (function () {
  "use strict";

  /* store.sessions: { [examId]: Session }
     Session (internal shape): { examId, answers: { [questionId]: Answer },
     startedAt, lastUpdatedAt, finishedAt }. `answers` is an object map
     internally (so "同一題再次作答覆蓋原答案，不產生重複紀錄" is simply
     "set the same key" — structurally impossible to duplicate), and is
     converted to an array of Answer Model records only when exposed via
     getSession()/list() (Deep Clone either way). */
  var store = { sessions: {} };

  function clone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }

  function getExam(examId) {
    return (AHS.ExamRuntime && typeof AHS.ExamRuntime.get === "function")
      ? AHS.ExamRuntime.get(examId) : null;
  }

  function questionBelongsToExam(exam, questionId) {
    return !!exam && exam.questionIds.indexOf(questionId) !== -1;
  }

  /* toPublicSession(session) — answers map -> Answer Model array (Deep
     Clone throughout). */
  function toPublicSession(session) {
    var answers = Object.keys(session.answers).map(function (qid) {
      return clone(session.answers[qid]);
    });
    return {
      examId: session.examId,
      answers: answers,
      startedAt: session.startedAt,
      lastUpdatedAt: session.lastUpdatedAt,
      finishedAt: session.finishedAt
    };
  }

  /* init() — clears all Answer Sessions. AnswerRuntime has no Seed
     Data of its own (per WO-Q005 spec); every session originates from
     an explicit start(examId) call. */
  function init() {
    store.sessions = {};
    return true;
  }

  /* start(examId) — creates a brand-new Answer Session for this exam
     (always fresh: any previous session/answers for the same examId
     are replaced, supporting a clean retake). Returns null if examId
     does not resolve to a real exam via ExamRuntime. Never calls
     ExamRuntime.start() / never mutates ExamRuntime. */
  function start(examId) {
    var exam = getExam(examId);
    if (!exam) { return null; }
    var now = new Date().toISOString();
    var session = {
      examId: examId,
      answers: {},
      startedAt: now,
      lastUpdatedAt: now,
      finishedAt: null
    };
    store.sessions[examId] = session;
    return toPublicSession(session);
  }

  function getSession(examId) {
    var session = store.sessions[examId];
    return session ? toPublicSession(session) : null;
  }

  function getAnswer(examId, questionId) {
    var session = store.sessions[examId];
    if (!session || !session.answers[questionId]) { return null; }
    return clone(session.answers[questionId]);
  }

  /* saveAnswer(examId, questionId, answer) — same-question re-answer
     overwrites in place (object-key assignment); no duplicate Answer
     records are structurally possible. If no session exists yet for
     examId, one is created implicitly (so saveAnswer never requires
     the caller to separately call start() first) WITHOUT resetting an
     already-existing session's other answers. Rejects (returns null)
     if examId/questionId do not resolve to a real exam+question pair. */
  function saveAnswer(examId, questionId, answer) {
    var exam = getExam(examId);
    if (!exam || !questionBelongsToExam(exam, questionId)) { return null; }
    if (AHS.QuestionBank && typeof AHS.QuestionBank.exists === "function" &&
      !AHS.QuestionBank.exists(questionId)) { return null; }

    var session = store.sessions[examId];
    var now = new Date().toISOString();
    if (!session) {
      session = { examId: examId, answers: {}, startedAt: now, lastUpdatedAt: now, finishedAt: null };
      store.sessions[examId] = session;
    }
    session.answers[questionId] = {
      examId: examId,
      questionId: questionId,
      answer: clone(answer),
      answeredAt: now,
      isMarked: session.answers[questionId] ? session.answers[questionId].isMarked : false
    };
    session.lastUpdatedAt = now;
    return clone(session.answers[questionId]);
  }

  /* removeAnswer(examId, questionId) — removes a single Answer record.
     Returns true if one was removed, false otherwise. */
  function removeAnswer(examId, questionId) {
    var session = store.sessions[examId];
    if (!session || !session.answers[questionId]) { return false; }
    delete session.answers[questionId];
    session.lastUpdatedAt = new Date().toISOString();
    return true;
  }

  /* clearAnswers(examId) — removes ALL Answer records for the session
     but keeps the session itself (startedAt intact). Returns true if a
     session existed, false otherwise. */
  function clearAnswers(examId) {
    var session = store.sessions[examId];
    if (!session) { return false; }
    session.answers = {};
    session.lastUpdatedAt = new Date().toISOString();
    return true;
  }

  /* finish(examId) — ends the Answer Session ONLY: sets finishedAt.
     No grading, no score, no Wrong Book, no Statistics, no ExamRuntime
     mutation of any kind. Returns null if no session exists. */
  function finish(examId) {
    var session = store.sessions[examId];
    if (!session) { return null; }
    var now = new Date().toISOString();
    session.finishedAt = now;
    session.lastUpdatedAt = now;
    return toPublicSession(session);
  }

  /* isCompleted(examId) — true once the Answer Session has been
     finish()'d (finishedAt set). Not a grading/correctness signal. */
  function isCompleted(examId) {
    var session = store.sessions[examId];
    return !!(session && session.finishedAt);
  }

  function countAnswered(examId) {
    var session = store.sessions[examId];
    return session ? Object.keys(session.answers).length : 0;
  }

  function countUnanswered(examId) {
    var exam = getExam(examId);
    var total = exam ? exam.questionIds.length : 0;
    var answered = countAnswered(examId);
    return Math.max(0, total - answered);
  }

  /* getProgress(examId) — { answered, unanswered, total, progress }.
     progress is 0–100 (rounded), based on the exam's total question
     count (from ExamRuntime), not on how many answers happen to exist. */
  function getProgress(examId) {
    var exam = getExam(examId);
    var total = exam ? exam.questionIds.length : 0;
    var answered = countAnswered(examId);
    var unanswered = Math.max(0, total - answered);
    var progress = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { answered: answered, unanswered: unanswered, total: total, progress: progress };
  }

  function list() {
    return Object.keys(store.sessions).map(function (examId) {
      return toPublicSession(store.sessions[examId]);
    });
  }

  /* reset() — clears all Answer Sessions (no Seed Data to restore to). */
  function reset() {
    return init();
  }

  return {
    init: init,
    start: start,
    getSession: getSession,
    getAnswer: getAnswer,
    saveAnswer: saveAnswer,
    removeAnswer: removeAnswer,
    clearAnswers: clearAnswers,
    finish: finish,
    isCompleted: isCompleted,
    countAnswered: countAnswered,
    countUnanswered: countUnanswered,
    getProgress: getProgress,
    list: list,
    reset: reset
  };
})();
