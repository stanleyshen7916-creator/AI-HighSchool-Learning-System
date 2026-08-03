/* js/runtime/StatisticsRuntime.js — Sprint 4 · Quiz Runtime Foundation.
   StatisticsRuntime is purely computed: it never stores raw rows of its
   own, it only reads AHS.HistoryRuntime.list() and derives numbers from
   it each time it's asked. getSubject() and refresh() always recompute
   independently from the current history — there is no cached
   aggregate to go stale. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.StatisticsRuntime = (function () {
  "use strict";

  /* overview() — total exams taken / average accuracy / total score /
     total questions answered correctly, computed fresh from history. */
  function overview() {
    var items = AHS.HistoryRuntime.list();
    var totalCount = items.length;
    var totalAccuracy = 0;
    var totalScore = 0;
    var totalCorrect = 0;
    items.forEach(function (h) {
      totalAccuracy += h.accuracy || 0;
      totalScore += h.score || 0;
      totalCorrect += h.correctCount || 0;
    });
    return {
      totalCount: totalCount,
      avgAccuracy: totalCount ? Math.round(totalAccuracy / totalCount) : 0,
      totalScore: totalScore,
      totalCorrect: totalCorrect
    };
  }

  /* accuracyBySubject() — average accuracy per subject, computed fresh
     from history each call (BUG-free by construction: no stored state
     to drift from the source list). */
  function accuracyBySubject() {
    var items = AHS.HistoryRuntime.list();
    var bucket = {};
    items.forEach(function (h) {
      bucket[h.subject] = bucket[h.subject] || { sum: 0, n: 0 };
      bucket[h.subject].sum += h.accuracy || 0;
      bucket[h.subject].n += 1;
    });
    return Object.keys(bucket).map(function (subject) {
      var b = bucket[subject];
      return { subject: subject, percent: Math.round(b.sum / b.n) };
    });
  }

  function getSubject(subject) {
    var all = accuracyBySubject();
    for (var i = 0; i < all.length; i++) {
      if (all[i].subject === subject) { return all[i]; }
    }
    return null;
  }

  /* refresh() — shapes overview() + accuracyBySubject() into the exact
     stat-card / donut shape AHS.QuizCenter already renders
     (AHS.Mock.quiz.stats / accuracyByStudy), so the UI can swap from
     static Mock numbers to live Runtime numbers without any markup
     change. */
  function refresh() {
    var ov = overview();
    return {
      stats: [
        { icon: "clock", label: "總測驗次數", value: String(ov.totalCount), unit: "次", delta: "本次 Session" },
        { icon: "target", label: "平均正確率", value: String(ov.avgAccuracy), unit: "%", delta: "本次 Session" },
        { icon: "award", label: "總得分", value: String(ov.totalScore), unit: "分", delta: "本次 Session" },
        { icon: "check", label: "答對題數", value: String(ov.totalCorrect), unit: "題", delta: "本次 Session" }
      ],
      accuracyByStudy: accuracyBySubject()
    };
  }

  /* ---- Sprint AI-111 additions (AI-609/611/612) --------------------------
     Still purely computed — every function below reads only
     AHS.WrongBookRuntime.list() / AHS.HistoryRuntime.list() fresh on each
     call, stores nothing of its own, and is additive to this file's
     existing Public API (overview/accuracyBySubject/getSubject/refresh
     are all unchanged). This is the single, real source both 複習中心
     (AppReview.js), 首頁 (AppHome.js) and AI Tutor (AiTutor.js /
     AiTutorHomeCard) read from — "不得建立第二份統計". */

  function wrongItems() {
    return (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.list === "function")
      ? AHS.WrongBookRuntime.list() : [];
  }

  /* dueForReview() — real WrongBookRuntime entries not yet 已精熟 (AI-610's
     own real correctStreak field, persisted). This is the same, single,
     deterministic "three consecutive correct reviews" rule WrongBook.js's
     own getMasteryStatus() already uses — not a second definition, not an
     AI-inferred schedule ("不得自動排程" is respected: no date/time
     reasoning here, just "has this real wrong item been mastered yet"). */
  function dueForReview() {
    return wrongItems().filter(function (w) { return (w.correctStreak || 0) < 3; });
  }

  function masteredReviewItems() {
    return wrongItems().filter(function (w) { return (w.correctStreak || 0) >= 3; });
  }

  /* recentWrongItems(limit) — most recently missed real entries. */
  function recentWrongItems(limit) {
    var items = wrongItems().slice().sort(function (a, b) {
      return (b.lastError || "").localeCompare(a.lastError || "");
    });
    return typeof limit === "number" ? items.slice(0, limit) : items;
  }

  /* weakestSubject() — the real subject with the lowest average accuracy
     among exams actually taken; null when there's no history yet (never
     a fabricated "weakness"). */
  function weakestSubject() {
    var all = accuracyBySubject();
    if (!all.length) { return null; }
    return all.slice().sort(function (a, b) { return a.percent - b.percent; })[0];
  }

  /* recommendedRetest() — the real, already-taken exam with the lowest
     accuracy, worth retaking; null with no history. Deterministic
     (lowest-accuracy-first), not an AI/opaque ranking. */
  function recommendedRetest() {
    var items = AHS.HistoryRuntime.list();
    if (!items.length) { return null; }
    return items.slice().sort(function (a, b) { return (a.accuracy || 0) - (b.accuracy || 0); })[0];
  }

  /* recommendedChapters(limit) — real chapters with the most outstanding
     (not-yet-mastered) wrong items, most first. */
  function recommendedChapters(limit) {
    var bucket = {};
    dueForReview().forEach(function (w) {
      var key = w.chapter || "";
      if (!key) { return; }
      bucket[key] = (bucket[key] || 0) + 1;
    });
    var chapters = Object.keys(bucket).map(function (chapter) {
      return { chapter: chapter, count: bucket[chapter] };
    }).sort(function (a, b) { return b.count - a.count; });
    return typeof limit === "number" ? chapters.slice(0, limit) : chapters;
  }

  /* completionSignals() — Sprint AI-114 AI-906: real material-completion
     state for the AI Tutor's priority chain ("教材完成 -> 推薦下一教材",
     "全部完成 -> 推薦挑戰測驗"). Reads AHS.LearningStateRuntime's own
     real per-material `completed` flag (Sprint AI-113 AI-803 — reading
     AND mastery, never reading alone) — not a second definition of
     "completed". Honest when there's no real data: completedMaterial/
     nextMaterial are null, allComplete is false, whenever there are no
     materials at all (never vacuously "all complete" on an empty
     session). */
  function completionSignals() {
    var mats = (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
    var lsr = AHS.LearningStateRuntime;
    if (!mats.length || !lsr || typeof lsr.materialState !== "function") {
      return { completedMaterial: null, nextMaterial: null, allComplete: false };
    }
    var states = mats.map(function (m) { return { material: m, state: lsr.materialState(m.id) }; });
    var completed = states.filter(function (s) { return s.state.completed; });
    var notStarted = mats.filter(function (m) { return !(m.progress > 0); });
    return {
      completedMaterial: completed.length ? completed[completed.length - 1].material : null,
      nextMaterial: notStarted.length ? notStarted[0] : null,
      allComplete: completed.length === mats.length
    };
  }

  /* learningContext() — the single real view-model both 首頁 (AiTutorHomeCard)
     and AI Tutor (tutor.html) build their message text from. Every field
     is real, derived fresh; a genuinely-empty repository/session yields
     empty arrays/nulls (callers must show an honest empty state, never
     invent text — see AiTutorHomeCard.js's own existing Empty State). */
  function learningContext() {
    var completion = completionSignals();
    return {
      weakestSubject: weakestSubject(),
      dueForReview: dueForReview(),
      masteredCount: masteredReviewItems().length,
      recentWrongItems: recentWrongItems(3),
      recommendedRetest: recommendedRetest(),
      recommendedChapters: recommendedChapters(3),
      completedMaterial: completion.completedMaterial,
      nextMaterial: completion.nextMaterial,
      allComplete: completion.allComplete
    };
  }

  /* ---- Sprint AI-114 additions (AI-905 Single Source) ---------------------
     AI-905 names 閱讀進度/正確率/完成率/最高分/今日完成/今日待複習/錯題/
     精熟/歷史 as values that must come from this Runtime, not be
     recalculated per page. accuracy/dueForReview/wrong/mastered/history
     already existed above; the functions below close the remaining real
     gaps that were previously computed locally by individual pages
     (js/components/QuizCenter.js's own realStatsFor(), js/pages/
     AppReview.js's own doneToday/doneWeek date-math) — moved here
     verbatim (same logic, same real HistoryRuntime/MaterialRuntime
     source), those call sites now call these instead of keeping their
     own copy. */

  function materials() {
    return (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
  }

  /* readingProgress() — real average AHS.MaterialRuntime progress across
     every material in this session; 0 when there are none yet (never a
     fabricated baseline). This is 閱讀進度 (Reading Progress) per
     Architecture_Platform_Terminology_v1.0.md — distinct from Exam Mode
     accuracy/mastery below. */
  function readingProgress() {
    var mats = materials();
    if (!mats.length) { return 0; }
    var sum = mats.reduce(function (s, m) { return s + (typeof m.progress === "number" ? m.progress : 0); }, 0);
    return Math.round(sum / mats.length);
  }

  /* completionRate() — real % of materials whose reading progress has
     reached 100. */
  function completionRate() {
    var mats = materials();
    if (!mats.length) { return 0; }
    var done = mats.filter(function (m) { return (m.progress || 0) >= 100; }).length;
    return Math.round((done / mats.length) * 100);
  }

  /* examStats(examId) — moved verbatim from js/components/QuizCenter.js's
     own realStatsFor() (Sprint HOTFIX-005 AI-501): a material never
     attempted keeps progress/accuracy/best at a real, honest 0/false,
     exactly like a Mock item that's never been taken. QuizCenter.js now
     calls this instead of keeping its own copy — same real
     AHS.HistoryRuntime source, one definition. */
  function examStats(examId) {
    var attempts = AHS.HistoryRuntime.list().filter(function (h) { return h.examId === examId; });
    if (!attempts.length) { return { progress: 0, accuracy: 0, best: 0, done: false, attempts: 0 }; }
    var best = attempts.reduce(function (max, h) { return Math.max(max, h.score || 0); }, 0);
    return { progress: 100, accuracy: attempts[0].accuracy || 0, best: best, done: true, attempts: attempts.length };
  }

  function parseWhen(when) {
    if (!when) { return null; }
    var m = /^(\d{4})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}))?/.exec(when);
    if (!m) { return null; }
    return new Date(
      parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10),
      m[4] ? parseInt(m[4], 10) : 0, m[5] ? parseInt(m[5], 10) : 0
    );
  }

  function isSameCalendarDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /* Monday-start week boundary — moved verbatim from js/pages/AppReview.js
     (no existing week-range convention is defined elsewhere in the
     repository for this to follow, same disclosure that file's own
     comment already made). */
  function startOfWeek(d) {
    var start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    return start;
  }

  /* doneToday() / doneThisWeek() — real counts of finished exams (real
     AHS.HistoryRuntime records) whose `when` falls today / within the
     current calendar week. Moved verbatim from js/pages/AppReview.js's
     own deriveStats() — that file now calls these instead of keeping a
     second copy of the same date math. */
  function doneToday() {
    var now = new Date();
    return AHS.HistoryRuntime.list().filter(function (h) {
      var when = parseWhen(h.when);
      return !!when && isSameCalendarDay(when, now);
    }).length;
  }

  function doneThisWeek() {
    var now = new Date();
    var weekStart = startOfWeek(now);
    return AHS.HistoryRuntime.list().filter(function (h) {
      var when = parseWhen(h.when);
      return !!when && when >= weekStart;
    }).length;
  }

  return {
    overview: overview,
    accuracyBySubject: accuracyBySubject,
    getSubject: getSubject,
    refresh: refresh,
    dueForReview: dueForReview,
    masteredReviewItems: masteredReviewItems,
    recentWrongItems: recentWrongItems,
    weakestSubject: weakestSubject,
    recommendedRetest: recommendedRetest,
    recommendedChapters: recommendedChapters,
    learningContext: learningContext,
    readingProgress: readingProgress,
    completionRate: completionRate,
    examStats: examStats,
    doneToday: doneToday,
    doneThisWeek: doneThisWeek
  };
})();
