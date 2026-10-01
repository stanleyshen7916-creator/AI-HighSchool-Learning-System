/* js/runtime/RandomPracticeRuntime.js — 2026-10-01 綜合隨機練習（方案 C）.

   測驗中心「綜合隨機練習」: one exam drawn across EVERY material of one
   subject in the current semester, so a student with a small per-lesson
   bank doesn't keep seeing the same 10 questions. No question is created
   here — it only chooses among the real questions the caller passes in.

   Priority (each tier shuffled):
     1 weak    — in 知識弱點 and not yet mastered; at most WEAK_SHARE of the
                 exam, so practice isn't only old mistakes;
     2 unseen  — not yet drawn in that material's current cycle
                 (AHS.QuestionBankRuntime.undrawnIds());
     3 weak    — any weak questions left over;
     4 rest    — everything else.
   Picks are spread over the materials (round-robin within a tier) so one
   large material doesn't fill the whole exam.

   pick({ pools: [{ examId, questions, undrawnIds|null, source }],
          weakIds: { questionId: true }, count, random? })
     -> [question + { _examId, _tier, sourceTitle, sourceChapter }]
   null undrawnIds means the material has no bank/cycle yet (all unseen). */
window.AHS = window.AHS || {};

AHS.RandomPracticeRuntime = (function () {
  "use strict";

  var WEAK_SHARE = 0.4;

  function shuffle(list, random) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function copy(q, extra) {
    var out = {};
    Object.keys(q).forEach(function (k) { out[k] = q[k]; });
    Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  /* Round-robin over materials: [a1,a2,a3],[b1] -> a1,b1,a2,a3 (each
     material's own list already shuffled; material order shuffled too). */
  function interleave(groups, random) {
    var lists = shuffle(groups.filter(function (g) { return g.length; }), random).map(function (g) { return g.slice(); });
    var out = [];
    while (lists.some(function (l) { return l.length; })) {
      lists.forEach(function (l) { if (l.length) { out.push(l.shift()); } });
    }
    return out;
  }

  function pick(opts) {
    opts = opts || {};
    var random = typeof opts.random === "function" ? opts.random : Math.random;
    var weakIds = opts.weakIds || {};
    var count = Math.max(0, Math.floor(opts.count || 0));
    var tiers = { weak: [], unseen: [], rest: [] };
    var seen = {};
    (opts.pools || []).forEach(function (pool) {
      var undrawn = null;
      if (Array.isArray(pool.undrawnIds)) {
        undrawn = {};
        pool.undrawnIds.forEach(function (id) { undrawn[id] = true; });
      }
      var groups = { weak: [], unseen: [], rest: [] };
      (pool.questions || []).forEach(function (q) {
        if (!q || !q.id || seen[q.id]) { return; }
        seen[q.id] = true;
        var tier = weakIds[q.id] ? "weak" : (!undrawn || undrawn[q.id] ? "unseen" : "rest");
        var src = pool.source || {};
        groups[tier].push(copy(q, {
          _examId: pool.examId, _tier: tier,
          sourceTitle: src.title || "", sourceChapter: src.chapter || ""
        }));
      });
      ["weak", "unseen", "rest"].forEach(function (t) { tiers[t].push(shuffle(groups[t], random)); });
    });
    var weak = interleave(tiers.weak, random);
    var unseen = interleave(tiers.unseen, random);
    var rest = interleave(tiers.rest, random);
    var weakFirst = Math.min(weak.length, Math.floor(count * WEAK_SHARE));
    var ordered = weak.slice(0, weakFirst).concat(unseen, weak.slice(weakFirst), rest);
    return shuffle(ordered.slice(0, count), random);
  }

  return { pick: pick, WEAK_SHARE: WEAK_SHARE };
})();
