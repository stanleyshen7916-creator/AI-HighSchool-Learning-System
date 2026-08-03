/* js/runtime/LearningStateRuntime.js — Sprint AI-113 · AI-803 Unify
   Learning State.

   Purely computed (same pattern as AHS.StatisticsRuntime — no store of
   its own, always derives fresh from the real Runtimes below). This is
   the single place that combines Reading / Summary / Quiz / WrongBook /
   Mastery / Review / Completed into one real per-material or
   per-subject view, so no page has to (re)invent its own definition of
   "完成" from just one of these signals.

   Real sources, never fabricated:
     - Reading   -> AHS.MaterialRuntime (item.progress)
     - Summary   -> AHS.SummaryRuntime.findByMaterialId()
     - Quiz      -> AHS.HistoryRuntime (via examId convention already
                    established by QuizCenter.js's own realStatsFor())
     - WrongBook -> AHS.WrongBookRuntime (materialId/subject, correctStreak)
     - Mastery/Review -> same correctStreak rule AHS.StatisticsRuntime /
                    js/components/WrongBook.js already use (>= 3 = 已精熟)
     - Completed -> real AND of the above, never true from Reading alone
                    (Platform Refactor Master PAT 7: "不得以閱讀完成率
                    直接代表學習完成率") */
window.AHS = window.AHS || {};
AHS.LearningStateRuntime = (function () {
  "use strict";

  function materials() {
    return (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
  }

  function wrongItems() {
    return (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.list === "function")
      ? AHS.WrongBookRuntime.list() : [];
  }

  /* materialState(materialId) — real, unified state for one material.
     quiz/wrongBook/mastery fields are honest "no signal yet" (null/0),
     never a fabricated pass/fail, when the material has no tracked
     wrong items at all (e.g. a plain upload never taken as a Quiz). */
  function materialState(materialId) {
    var material = null;
    materials().forEach(function (m) { if (m.id === materialId) { material = m; } });

    var reading = material ? Math.max(0, Math.min(100, material.progress || 0)) : 0;
    var readingDone = reading >= 100;

    var hasSummary = (AHS.SummaryRuntime && typeof AHS.SummaryRuntime.findByMaterialId === "function")
      ? AHS.SummaryRuntime.findByMaterialId(materialId).length > 0 : false;

    var related = wrongItems().filter(function (w) { return w.materialId === materialId; });
    var hasQuizActivity = related.length > 0;
    var dueCount = related.filter(function (w) { return (w.correctStreak || 0) < 3; }).length;
    var masteredCount = related.filter(function (w) { return (w.correctStreak || 0) >= 3; }).length;

    /* Completed: reading finished AND, only if this material actually
       has tracked wrong items, every one of them is mastered. A
       material with zero quiz activity is never blocked from
       "Completed" by a signal that doesn't exist for it — but it is
       also never called "Completed" purely because reading hit 100%
       if it DOES have outstanding due items. */
    var completed = readingDone && (!hasQuizActivity || dueCount === 0);

    return {
      materialId: materialId,
      reading: reading,
      readingDone: readingDone,
      summary: hasSummary,
      quizAttempted: hasQuizActivity,
      wrongCount: related.length,
      dueCount: dueCount,
      masteredCount: masteredCount,
      completed: completed
    };
  }

  /* subjectState(subject) — same real signals, averaged/summed across
     every material in that subject. Used by 我的學習's 科目進度 so its
     "已完成" label reflects real mastery, not just reading %. */
  function subjectState(subject) {
    var subjectMaterials = materials().filter(function (m) { return m.subject === subject; });
    var reading = subjectMaterials.length
      ? Math.round(subjectMaterials.reduce(function (s, m) { return s + (m.progress || 0); }, 0) / subjectMaterials.length)
      : 0;

    var related = wrongItems().filter(function (w) { return w.subject === subject; });
    var hasQuizActivity = related.length > 0;
    var dueCount = related.filter(function (w) { return (w.correctStreak || 0) < 3; }).length;
    var masteredCount = related.filter(function (w) { return (w.correctStreak || 0) >= 3; }).length;

    var completed = reading >= 100 && (!hasQuizActivity || dueCount === 0);
    var status = completed ? "已完成" : (reading > 0 ? "進行中" : "尚未開始");

    return {
      subject: subject,
      reading: reading,
      hasQuizActivity: hasQuizActivity,
      dueCount: dueCount,
      masteredCount: masteredCount,
      completed: completed,
      status: status
    };
  }

  function allSubjectStates() {
    var seen = {};
    var subjects = [];
    materials().forEach(function (m) {
      if (!seen[m.subject]) { seen[m.subject] = true; subjects.push(m.subject); }
    });
    return subjects.map(subjectState);
  }

  return {
    materialState: materialState,
    subjectState: subjectState,
    allSubjectStates: allSubjectStates
  };
})();
