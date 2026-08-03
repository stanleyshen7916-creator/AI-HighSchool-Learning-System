/* js/runtime/ReviewRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   ReviewRuntime.build(examId) shapes the finished AutoGrader result
   into the view-model the Review screen renders (question-by-question
   right/wrong breakdown). It does not grade or store anything itself —
   purely reads AHS.AutoGrader's cached result for the exam.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewRuntime = (function () {
  "use strict";

  /* ---- Sprint AI-114 AI-901: Review Session ------------------------------
     複習中心 no longer redirects straight to WrongBook — it owns a real
     Review Session flow. Session state lives here (memory-only, same
     pattern as AHS.ExamRuntime's own current-session state) so 複習中心's
     "ReviewRuntime → 產生今日待複習 → 開始今日複習 → 完成 Session" flow
     has one real owner, not scattered UI-local state.

     generateTodayQueue() delegates to AHS.StatisticsRuntime.dueForReview()
     — the exact same real WrongBookRuntime-derived "not yet 已精熟" list
     every other page already reads (AI-905 Single Source) — this
     function does not redefine what "today's due review" means, it only
     gives ReviewRuntime the literal responsibility of producing it. */
  var session = null;

  function generateTodayQueue() {
    return (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.dueForReview === "function")
      ? AHS.StatisticsRuntime.dueForReview() : [];
  }

  function cloneSession() {
    if (!session) { return null; }
    return {
      queue: session.queue.slice(),
      index: session.index,
      total: session.queue.length,
      current: session.index < session.queue.length ? session.queue[session.index] : null,
      results: { correct: session.results.correct, wrong: session.results.wrong, newlyMastered: session.results.newlyMastered },
      active: session.active
    };
  }

  /* startSession() — snapshots a real, current queue (generateTodayQueue())
     at the moment the user actually starts, so answering one item doesn't
     shift indices under a mid-session user. Returns the new session state
     (clone), or null if there's genuinely nothing due right now. */
  function startSession() {
    var queue = generateTodayQueue();
    if (!queue.length) { session = null; return null; }
    session = { queue: queue, index: 0, results: { correct: 0, wrong: 0, newlyMastered: 0 }, active: true };
    return cloneSession();
  }

  function getSession() {
    return cloneSession();
  }

  /* answerCurrent(wasCorrect, selectedKey) — grades the session's current
     item via the exact same real Runtime calls js/components/WrongBook.js's
     own applyReviewResult() uses (AHS.WrongBookRuntime.sync() when wrong,
     recordRetry() always) — same single source, not a second grading
     definition — then advances to the next item. Returns the updated
     session state (clone), or null if there's no active session. */
  function answerCurrent(wasCorrect, selectedKey) {
    if (!session || !session.active) { return null; }
    var item = session.queue[session.index];
    if (!item) { return null; }
    var runtime = AHS.WrongBookRuntime;
    var wasMasteredBefore = (item.correctStreak || 0) >= 3;

    if (!wasCorrect && runtime && typeof runtime.sync === "function") {
      var touched = runtime.sync({
        subject: item.subject, title: item.title, chapter: item.chapter,
        wrong: [{
          questionId: item.questionId, knowledgePoint: item.knowledgePoint,
          text: item.question, options: item.options,
          yourAnswer: selectedKey, correctAnswer: item.correctAnswer,
          explanation: item.explanation
        }]
      });
      if (touched && touched[0]) {
        Object.keys(touched[0]).forEach(function (k) { item[k] = touched[0][k]; });
      }
    } else {
      item.yourAnswer = selectedKey;
    }
    if (runtime && typeof runtime.recordRetry === "function") {
      var retried = runtime.recordRetry(item.id, wasCorrect);
      if (retried) { Object.keys(retried).forEach(function (k) { item[k] = retried[k]; }); }
    }

    if (wasCorrect) { session.results.correct += 1; } else { session.results.wrong += 1; }
    if (!wasMasteredBefore && (item.correctStreak || 0) >= 3) { session.results.newlyMastered += 1; }
    session.index += 1;
    if (session.index >= session.queue.length) { session.active = false; }
    return cloneSession();
  }

  /* completeSession() — finalizes and clears the active session. Every
     downstream consumer (Statistics/首頁/Tutor/Review 本身) re-derives
     from AHS.WrongBookRuntime/AHS.StatisticsRuntime fresh on next render
     — already-updated by answerCurrent()'s real recordRetry()/sync()
     calls above — so nothing here needs to "push" an update anywhere. */
  function completeSession() {
    var result = cloneSession();
    session = null;
    return result;
  }

  /* build(examId) — returns a review view-model (clone), or null if the
     exam hasn't been graded yet. */
  function build(examId) {
    var graded = AHS.AutoGrader.getGraded(examId);
    if (!graded) { return null; }
    return {
      examId: graded.examId,
      subject: graded.subject,
      title: graded.title,
      chapter: graded.chapter,
      score: graded.score,
      accuracy: graded.accuracy,
      correctCount: graded.correctCount,
      totalCount: graded.totalCount,
      gradedAt: graded.gradedAt,
      questions: graded.results.map(function (r) {
        return {
          index: r.index,
          text: r.text,
          options: r.options,
          yourAnswer: r.yourAnswer,
          correctAnswer: r.correctAnswer,
          isCorrect: r.isCorrect,
          explanation: r.explanation
        };
      })
    };
  }

  return {
    build: build,
    generateTodayQueue: generateTodayQueue,
    startSession: startSession,
    getSession: getSession,
    answerCurrent: answerCurrent,
    completeSession: completeSession
  };
})();
