/* js/runtime/WeakChapterRuntime.js — 2026-11-27 AHS-FEAT 弱點單元分析與加強練習。

   純計算，不另存資料：
   - units()：從 AHS.KnowledgeMasteryRuntime.attempts() 依「科目／單元（來源教材 tm_N）」彙總
     最近 recentWindow 題的作答數與正確率；不足 minAttempts 題＝資料不足（insufficient），
     正確率 < weakBelow＝需加強（weak）。沒有來源教材的舊紀錄不計入任何單元。
   - pickPractice()：加強練習的出題順序——先出這個單元錯題本裡還沒精熟的題目，再補從未作答過的
     題目，仍不足 count 題才用其餘題目補滿（各層內打亂）。缺圖題不出。
   練習本身一律走測驗中心既有的測驗流程（QuizCenter 的 mode=weak），這裡不出介面。 */
window.AHS = window.AHS || {};
AHS.WeakChapterRuntime = (function () {
  "use strict";

  function config() {
    var c = AHS.WeakChapterConfig || {};
    return {
      minAttempts: c.minAttempts || 5, recentWindow: c.recentWindow || 20,
      weakBelow: typeof c.weakBelow === "number" ? c.weakBelow : 60, practiceCount: c.practiceCount || 10
    };
  }

  /* summarize(attempts, cfg) — attempts 為 { subject, materialId, correct, ts } 清單（舊到新）。 */
  function summarize(attempts, cfg) {
    cfg = cfg || config();
    var groups = {};
    var order = [];
    (attempts || []).forEach(function (a) {
      if (!a || !a.materialId) { return; }
      var key = a.materialId;
      if (!groups[key]) { groups[key] = { materialId: key, subject: a.subject || "", list: [] }; order.push(key); }
      if (a.subject) { groups[key].subject = a.subject; }
      groups[key].list.push(a);
    });
    return order.map(function (key) {
      var g = groups[key];
      var recent = g.list.slice(-cfg.recentWindow);
      var correct = recent.filter(function (a) { return a.correct; }).length;
      var accuracy = recent.length ? Math.round((correct / recent.length) * 100) : null;
      var status = recent.length < cfg.minAttempts ? "insufficient" : (accuracy < cfg.weakBelow ? "weak" : "ok");
      return { materialId: key, subject: g.subject, total: g.list.length, counted: recent.length, correct: correct, accuracy: accuracy, status: status };
    });
  }

  function units() {
    var km = AHS.KnowledgeMasteryRuntime;
    return summarize(km && typeof km.attempts === "function" ? km.attempts() : [], config());
  }

  function shuffle(list, random) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  /* pickPractice({ questions, weakIds: {questionId:true}, attemptedIds: {questionId:true}, count, random })
     -> 題目清單（每題多一個 _tier：wrong／unseen／rest）。 */
  function pickPractice(opts) {
    opts = opts || {};
    var random = opts.random || Math.random;
    var count = opts.count || config().practiceCount;
    var weak = opts.weakIds || {};
    var seen = opts.attemptedIds || {};
    var usable = (opts.questions || []).filter(function (q) { return q && q.id && !(q.figureMissing && !q.figureSvg); });
    var tiers = { wrong: [], unseen: [], rest: [] };
    usable.forEach(function (q) {
      tiers[weak[q.id] ? "wrong" : (seen[q.id] ? "rest" : "unseen")].push(q);
    });
    var out = [];
    ["wrong", "unseen", "rest"].forEach(function (t) {
      shuffle(tiers[t], random).forEach(function (q) {
        if (out.length < count) {
          var copy = {};
          Object.keys(q).forEach(function (k) { copy[k] = q[k]; });
          copy._tier = t;
          out.push(copy);
        }
      });
    });
    return out;
  }

  /* practiceInputs(materialId) — 錯題本中這個單元還沒精熟（連對 < 3、未封存）的題號，以及曾經作答過的題號。 */
  function practiceInputs(materialId) {
    var weakIds = {};
    var attemptedIds = {};
    var prefix = materialId + "_";
    if (AHS.WrongBookRuntime && typeof AHS.WrongBookRuntime.list === "function") {
      AHS.WrongBookRuntime.list().forEach(function (w) {
        if (w && w.questionId && String(w.questionId).indexOf(prefix) === 0 && !w.archived && (w.correctStreak || 0) < 3) {
          weakIds[w.questionId] = true;
        }
      });
    }
    var km = AHS.KnowledgeMasteryRuntime;
    (km && typeof km.attempts === "function" ? km.attempts() : []).forEach(function (a) {
      if (a.questionId) { attemptedIds[a.questionId] = true; }
    });
    return { weakIds: weakIds, attemptedIds: attemptedIds };
  }

  return { config: config, summarize: summarize, units: units, pickPractice: pickPractice, practiceInputs: practiceInputs };
})();
