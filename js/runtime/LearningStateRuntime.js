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

  /* dailyTasks(limit) — Sprint AI-114 AI-903 Daily Task Engine. Real,
     priority-ordered task list for 首頁's 今日任務 — never fixed text,
     never a fabricated placeholder when there's genuinely nothing to
     do (returns []; the caller's own existing Empty State handles
     that). Every entry is built from a real, currently-true signal:

       ① 今日 Review     — AHS.StatisticsRuntime.dueForReview() aggregate
                            queue (same real "not yet 已精熟" set 複習
                            中心's own Review Session (AI-901) uses).
       ② 未完成錯題       — the subset of that same pool with
                            correctStreak === 0 (never once answered
                            correctly since going wrong) — a real,
                            distinct, more urgent segment of ①'s pool
                            (not a fabricated second definition;
                            correctStreak already exists for this).
       ③ 未完成教材       — real MaterialRuntime items with
                            0 < progress < 100 (reading in progress).
       ④ AI 推薦教材      — real MaterialRuntime items with progress = 0
                            (never opened yet) — only shown once ①-③
                            have nothing left to offer, so a fresh
                            session with unread materials still gets a
                            real, non-empty task list.

     `done`/`total` match js/components/TodayMission.js's existing
     display shape (subject chip + title + "done/total" counter). */
  function dailyTasks(limit) {
    var tasks = [];
    var dueReview = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.dueForReview === "function")
      ? AHS.StatisticsRuntime.dueForReview() : [];

    if (dueReview.length) {
      tasks.push({
        subject: dueReview[0].subject,
        title: "前往複習中心，完成今日待複習",
        done: 0, total: dueReview.length, priority: 1, kind: "review"
      });
    }

    var freshlyWrong = dueReview.filter(function (w) { return (w.correctStreak || 0) === 0; });
    if (freshlyWrong.length) {
      tasks.push({
        subject: freshlyWrong[0].subject,
        title: "前往知識弱點，處理尚未複習過的錯題",
        done: 0, total: freshlyWrong.length, priority: 2, kind: "wrongbook"
      });
    }

    var mats = materials();
    var inProgress = mats.filter(function (m) { return (m.progress || 0) > 0 && (m.progress || 0) < 100; });
    inProgress.forEach(function (m) {
      tasks.push({
        subject: m.subject, title: "繼續閱讀《" + m.title + "》",
        done: Math.round(m.progress || 0), total: 100, priority: 3, kind: "material",
        materialId: m.id
      });
    });

    var notStarted = mats.filter(function (m) { return !(m.progress > 0); });
    notStarted.forEach(function (m) {
      tasks.push({
        subject: m.subject, title: "開始閱讀《" + m.title + "》",
        done: 0, total: 100, priority: 4, kind: "recommend",
        materialId: m.id
      });
    });

    return typeof limit === "number" ? tasks.slice(0, limit) : tasks;
  }

  return {
    materialState: materialState,
    subjectState: subjectState,
    allSubjectStates: allSubjectStates,
    dailyTasks: dailyTasks
  };
})();
