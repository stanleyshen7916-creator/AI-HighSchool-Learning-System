/* js/runtime/ReviewModel.js — Sprint 7.0 · EO-S7.0-003
   Review Runtime Integration — read-only review query layer.

   Naming (Ruling-1B precedent): the EO's "ReviewRuntime" already exists
   as the Sprint-5 review-session store (LOCK, untouched); this new
   read-only layer is therefore named AHS.ReviewModel.

   Fixed lineage (single flow, no second runtime):
     WrongBookSession ─▶ ReviewQueue ─▶ ReviewModel(read-only)
                       ─▶ Today Review / Due Review / Dashboard Widget

   Data sources — READ ONLY, always through public query APIs:
     - AHS.ReviewQueue        (the queue; never rebuilt, never re-derived
                               from WrongBook — Queue Integration rule)
     - AHS.WrongBookSession   (record resolution + mastery statistics;
                               NEVER written from here)

   The four getters are pure derivations, recomputed per call, never
   stored (Mastery Progress: 不得永久儲存):
     getTodayReview()        queue entries whose nextReviewAt is non-null
                             AND <= today, resolved to wrong-book
                             records. nextReviewAt === null entries are
                             EXCLUDED — they wait for the Scheduler
                             Sprint (不得列入).
     getDueReview()          all schedulable (non-null nextReviewAt)
                             entries sorted ASC by nextReviewAt — plain
                             deterministic sort, no AI ordering.
     getReviewProgress()     { todayDue, completed, totalWrong } where
                             completed = masteryLevel === "mastered"
                             count (deterministic definition, flagged in
                             the EO report).
     getMasteryStatistics()  { new, learning, reviewing, mastered }.

   Scheduler Foundation: setNextReview(questionId, nextReviewAt) is the
   PRESERVED interface for the future Scheduler Sprint. It writes only
   through the existing interfaces (WrongBookGenerator.update +
   ReviewQueue.enqueue — never直接修改 WrongBookSession) and is called
   by NOTHING automatically in this Sprint (不得自動排程). */
window.AHS = window.AHS || {};
AHS.ReviewModel = (function () {
  "use strict";

  function todayStamp() {
    var d = new Date();
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T23:59:59.999Z";
  }

  function queueEntries() {
    return (AHS.ReviewQueue && typeof AHS.ReviewQueue.list === "function")
      ? AHS.ReviewQueue.list() : [];
  }

  function recordFor(questionId) {
    return (AHS.WrongBookSession && typeof AHS.WrongBookSession.getByQuestionId === "function")
      ? AHS.WrongBookSession.getByQuestionId(questionId) : null;
  }

  /* ---- getTodayReview() ---- */
  function getTodayReview() {
    var cutoff = todayStamp();
    return queueEntries()
      .filter(function (e) { return e.nextReviewAt !== null && e.nextReviewAt <= cutoff; })
      .map(function (e) {
        return { queue: e, record: recordFor(e.questionId) };
      })
      .filter(function (x) { return !!x.record; });
  }

  /* ---- getDueReview() — ASC by nextReviewAt, deterministic ---- */
  function getDueReview() {
    return queueEntries()
      .filter(function (e) { return e.nextReviewAt !== null; })
      .sort(function (a, b) {
        if (a.nextReviewAt === b.nextReviewAt) { return b.priority - a.priority; }
        return a.nextReviewAt < b.nextReviewAt ? -1 : 1;
      })
      .map(function (e) { return { queue: e, record: recordFor(e.questionId) }; })
      .filter(function (x) { return !!x.record; });
  }

  /* ---- getMasteryStatistics() — derived per call, never stored ---- */
  function getMasteryStatistics() {
    var by = (AHS.WrongBookSession && typeof AHS.WrongBookSession.statistics === "function")
      ? AHS.WrongBookSession.statistics().byMastery : {};
    return {
      "new": by["new"] || 0,
      learning: by.learning || 0,
      reviewing: by.reviewing || 0,
      mastered: by.mastered || 0
    };
  }

  /* ---- getReviewProgress() ---- */
  function getReviewProgress() {
    var stats = (AHS.WrongBookSession && typeof AHS.WrongBookSession.statistics === "function")
      ? AHS.WrongBookSession.statistics() : { total: 0, byMastery: {} };
    return {
      todayDue: getTodayReview().length,
      completed: (stats.byMastery && stats.byMastery.mastered) || 0,
      totalWrong: stats.total || 0
    };
  }

  /* ---- Scheduler Foundation (preserved interface, no auto-calls) ---- */
  function setNextReview(questionId, nextReviewAt) {
    var session = AHS.WrongBookSession, gen = AHS.WrongBookGenerator, queue = AHS.ReviewQueue;
    if (!session || !gen || !queue) { return null; }
    var record = session.getByQuestionId(questionId);
    if (!record) { return null; }
    var updated = gen.update(record.id, { nextReviewAt: nextReviewAt || null });
    if (!updated) { return null; }
    queue.enqueue({
      questionId: updated.questionId,
      masteryLevel: updated.masteryLevel,
      priority: updated.wrongCount,
      nextReviewAt: updated.nextReviewAt
    });
    return updated;
  }

  return {
    getTodayReview: getTodayReview,
    getDueReview: getDueReview,
    getReviewProgress: getReviewProgress,
    getMasteryStatistics: getMasteryStatistics,
    setNextReview: setNextReview
  };
})();
