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

  /* learningContext() — the single real view-model both 首頁 (AiTutorHomeCard)
     and AI Tutor (tutor.html) build their message text from. Every field
     is real, derived fresh; a genuinely-empty repository/session yields
     empty arrays/nulls (callers must show an honest empty state, never
     invent text — see AiTutorHomeCard.js's own existing Empty State). */
  function learningContext() {
    return {
      weakestSubject: weakestSubject(),
      dueForReview: dueForReview(),
      masteredCount: masteredReviewItems().length,
      recentWrongItems: recentWrongItems(3),
      recommendedRetest: recommendedRetest(),
      recommendedChapters: recommendedChapters(3)
    };
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
    learningContext: learningContext
  };
})();
