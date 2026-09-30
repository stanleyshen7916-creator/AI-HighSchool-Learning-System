/* js/utils/OptionOrder.js — 2026-09-30 選項顯示順序.

   Some AI-generated question banks put the correct answer first every
   time (tm_16 / tm_17: 22 of 22 are option A), so a student learns "pick
   A". The teaching-material data is never modified; instead every page
   that shows these options shows them in a shuffled order that is FIXED
   per question (seeded by the question id — the same order in 測驗中心,
   its result page, 知識弱點 and 學習助教, on every device and reload),
   labelled A, B, C… by display position. Answers are still recorded with
   the ORIGINAL option keys, so every stored record stays valid.

   Only shuffled when it is safe:
     - package-track (AHS.TeachingMaterialData) questions that are
       AI_GENERATED — original exam/textbook questions keep their order;
     - at least 3 options;
     - no option carries its own label ("(1) …", "(E) …", "甲、…") or
       refers to other options' positions (「以上皆非」「兩者皆是」「上述」…).

   API
     order(q)          -> [{ key, text, label }] in display order
     labelFor(q, key)  -> display label of an ORIGINAL key ("A".."F")
     describe(q, key)  -> "C「選項文字」" for answer summaries
   q: { id | questionId, options: [{ key, text }] | ["text", ...] }. */
window.AHS = window.AHS || {};

AHS.OptionOrder = (function () {
  "use strict";

  var LABELS = ["A", "B", "C", "D", "E", "F"];
  var SELF_LABEL = /^\s*[(（]?\s*([A-Fa-f]|[1-9]|[①-⑨]|[甲乙丙丁戊])\s*[)）.．、:：]/;
  var POSITIONAL = /以上|皆是|皆非|兩者|上述|前述|都對|都不對|都正確|都錯|above|both of|neither|none of/i;

  var sourceIndex = null;

  /* questionId -> questionSource, from the package track only. */
  function packageSource(id) {
    if (!sourceIndex) {
      sourceIndex = {};
      (Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : []).forEach(function (e) {
        (e && e.questions || []).forEach(function (q) { if (q && q.id) { sourceIndex[q.id] = q.questionSource || ""; } });
      });
    }
    return Object.prototype.hasOwnProperty.call(sourceIndex, id) ? sourceIndex[id] : null;
  }

  function idOf(q) { return String((q && (q.questionId || q.id)) || ""); }

  function normalized(q) {
    return (Array.isArray(q && q.options) ? q.options : []).map(function (o, i) {
      if (o && typeof o === "object") { return { key: o.key != null ? String(o.key) : LABELS[i], text: String(o.text != null ? o.text : "") }; }
      return { key: LABELS[i], text: String(o) };
    });
  }

  function shouldShuffle(q, opts) {
    if (opts.length < 3) { return false; }
    if (packageSource(idOf(q)) !== "AI_GENERATED") { return false; }
    return !opts.some(function (o) { return SELF_LABEL.test(o.text) || POSITIONAL.test(o.text); });
  }

  /* FNV-1a 32-bit hash -> mulberry32 PRNG: deterministic per question id. */
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    var a = h >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function order(q) {
    var opts = normalized(q);
    if (shouldShuffle(q, opts)) {
      var random = seeded(idOf(q));
      for (var i = opts.length - 1; i > 0; i--) {
        var j = Math.floor(random() * (i + 1));
        var t = opts[i]; opts[i] = opts[j]; opts[j] = t;
      }
    }
    return opts.map(function (o, i) { return { key: o.key, text: o.text, label: LABELS[i] || String(i + 1) }; });
  }

  function labelFor(q, key) {
    var found = order(q).filter(function (o) { return o.key === String(key); })[0];
    return found ? found.label : String(key);
  }

  function describe(q, key) {
    if (key == null || key === "") { return "未作答"; }
    var found = order(q).filter(function (o) { return o.key === String(key); })[0];
    return found ? found.label + "「" + found.text + "」" : String(key);
  }

  /* reset() — test helper: rebuild the package index. */
  function reset() { sourceIndex = null; }

  return { order: order, labelFor: labelFor, describe: describe, reset: reset };
})();
