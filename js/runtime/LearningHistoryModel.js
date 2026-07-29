/* js/runtime/LearningHistoryModel.js — Sprint AI-019
   Learning History Projection — Practice Mode's real-data equivalent of
   AHS.HistoryRuntime (Sprint 4, Exam Mode only).

   Naming (Ruling-1B precedent, same as AHS.ReviewModel vs the LOCK
   Sprint-4 AHS.ReviewRuntime): the existing AHS.HistoryRuntime.js is
   Exam-Mode-native (examId/score/accuracy schema, LOCK, untouched by
   this Sprint — Forbidden list bars Runtime redesign/replacement) and
   has no field that could honestly represent a Practice Mode question's
   journey. Rather than force-fit Practice data into that schema or add
   a second write path into it, this is a NEW, separate, read-only
   Projection — same architectural shape as AHS.ReviewModel.js
   (WrongBookSession + ReviewQueue -> read-only query layer, "single
   flow, no second runtime").

   Fixed lineage (per docs/Architecture/ProductionIntegrationBlueprint.md
   Boundary 6, Gap 6):
     WrongBookSession ─▶ ReviewQueue ─▶ LearningHistoryModel(read-only)
                       ─▶ StatisticsRuntime-compatible stat cards / Dashboard

   Data sources — READ ONLY, always through public query APIs:
     - AHS.WrongBookSession   (every field this module surfaces already
                               lives here: firstWrongAt/lastWrongAt/
                               wrongCount/masteryLevel/traceability —
                               no new write path, no new stored schema)
     - AHS.ReviewQueue        (review identity: priority/nextReviewAt/
                               masteryLevel, read-only)

   Every getter is a pure derivation, recomputed per call, never stored
   — same "Mastery Progress: 不得永久儲存" discipline AHS.ReviewModel.js
   already established. Runtime: MEMORY ONLY, no PersistenceAdapter of
   its own (nothing to persist — it only re-reads already-persisted
   WrongBookSession/ReviewQueue data on every call). */
window.AHS = window.AHS || {};
AHS.LearningHistoryModel = (function () {
  "use strict";

  function wrongBook() {
    return (AHS.WrongBookSession && typeof AHS.WrongBookSession.list === "function")
      ? AHS.WrongBookSession : null;
  }

  function reviewQueue() {
    return (AHS.ReviewQueue && typeof AHS.ReviewQueue.getByQuestionId === "function")
      ? AHS.ReviewQueue : null;
  }

  /* ---- list(materialId?) --------------------------------------------------
     Every real Practice question's learning history, optionally scoped to
     one material. Each entry preserves material identity (materialId),
     review identity (questionId, cross-referenced against the real
     ReviewQueue entry when one exists), and full traceability — copied
     verbatim from the real WrongBookSession record, never re-derived or
     guessed. */
  function list(materialId) {
    var wb = wrongBook();
    if (!wb) { return []; }
    var rq = reviewQueue();

    var items = wb.list();
    if (materialId) {
      items = items.filter(function (i) { return i.materialId === materialId; });
    }

    return items.map(function (item) {
      var queued = rq ? rq.getByQuestionId(item.questionId) : null;
      return {
        materialId: item.materialId,
        questionId: item.questionId,
        subject: item.subject,
        knowledgePoint: item.knowledgePoint,
        wrongCount: item.wrongCount,
        masteryLevel: item.masteryLevel,
        status: item.status,
        firstWrongAt: item.firstWrongAt,
        lastWrongAt: item.lastWrongAt,
        traceability: item.traceability,
        review: queued
          ? { priority: queued.priority, nextReviewAt: queued.nextReviewAt, masteryLevel: queued.masteryLevel }
          : null
      };
    });
  }

  /* ---- masteryRateBySubject() ----------------------------------------------
     Same output shape as AHS.StatisticsRuntime.accuracyBySubject()
     ([{subject, percent}]) so a future Dashboard can render both without
     a shape adapter. Practice Mode has no "correct answer count" to form
     an accuracy rate from (WrongBookSession only ever records misses) —
     the honest, real-data-derived equivalent is mastery rate: the real
     percentage of that subject's wrong questions now at masteryLevel
     "mastered". Never fabricated, never guessed. */
  function masteryRateBySubject() {
    var wb = wrongBook();
    if (!wb) { return []; }
    var bucket = {};
    wb.list().forEach(function (item) {
      bucket[item.subject] = bucket[item.subject] || { total: 0, mastered: 0 };
      bucket[item.subject].total += 1;
      if (item.masteryLevel === "mastered") { bucket[item.subject].mastered += 1; }
    });
    return Object.keys(bucket).map(function (subject) {
      var b = bucket[subject];
      return { subject: subject, percent: b.total ? Math.round((b.mastered / b.total) * 100) : 0 };
    });
  }

  function getSubject(subject) {
    var all = masteryRateBySubject();
    for (var i = 0; i < all.length; i += 1) {
      if (all[i].subject === subject) { return all[i]; }
    }
    return null;
  }

  /* ---- refresh() ------------------------------------------------------------
     Shapes real WrongBookSession/ReviewQueue data into the EXACT
     {stats: [...], accuracyByStudy: [...]} shape
     AHS.StatisticsRuntime.refresh() already produces for Exam Mode —
     the same "so the UI can swap from static Mock numbers to live
     Runtime numbers without any markup change" precedent that file's
     own header documents. A future Dashboard Sprint (AI-020, out of
     this Sprint's scope) can concatenate this Sprint's stats array with
     StatisticsRuntime's own, unmodified. */
  function refresh() {
    var wb = wrongBook();
    var wbStats = wb ? wb.statistics() : { total: 0, totalWrongCount: 0, byMastery: {} };
    var rm = (AHS.ReviewModel && typeof AHS.ReviewModel.getReviewProgress === "function") ? AHS.ReviewModel : null;
    var progress = rm ? rm.getReviewProgress() : { todayDue: 0, completed: 0, totalWrong: 0 };

    return {
      stats: [
        { icon: "wrong", label: "練習答錯題數", value: String(wbStats.totalWrongCount || 0), unit: "次", delta: "本次 Session" },
        { icon: "award", label: "已精熟題數", value: String(progress.completed || 0), unit: "題", delta: "本次 Session" },
        { icon: "clock", label: "待複習題數", value: String(progress.todayDue || 0), unit: "題", delta: "本次 Session" },
        { icon: "book", label: "練習錯題總數", value: String(wbStats.total || 0), unit: "題", delta: "本次 Session" }
      ],
      accuracyByStudy: masteryRateBySubject()
    };
  }

  return {
    list: list,
    masteryRateBySubject: masteryRateBySubject,
    getSubject: getSubject,
    refresh: refresh
  };
})();
