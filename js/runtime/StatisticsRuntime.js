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

  return {
    overview: overview,
    accuracyBySubject: accuracyBySubject,
    getSubject: getSubject,
    refresh: refresh
  };
})();
