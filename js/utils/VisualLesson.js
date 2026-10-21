/* js/utils/VisualLesson.js — 2026-10-21 圖解教材（互動）.

   Stateless lookups over AHS.VisualLessonData:

     forMaterial(id)        -> lesson or null. id: "tm_7", a MaterialRuntime
                               record ({ originKey, id }), or a question id
                               like "tm_7_q12".
     match(text, opts)      -> { lesson, card, score } or null. Picks the
                               formula card whose keywords best cover the
                               text (longer keyword = stronger evidence).
                               opts.materialIds limits it to lessons of those
                               materials (e.g. the student's current
                               Workspace); opts.lesson limits it to one.
     forQuestion(q)         -> { lesson, card } or null for a quiz question
                               ({ id, knowledgePoint, text|question }).
     cardUrl(lesson, cardId) / lessonUrl(lesson, cardId?) -> iframe src. */
window.AHS = window.AHS || {};

AHS.VisualLesson = (function () {
  "use strict";

  var MIN_SCORE = 2;

  function lessons() {
    return Array.isArray(window.AHS.VisualLessonData) ? window.AHS.VisualLessonData : [];
  }

  function materialKey(idOrItem) {
    if (!idOrItem) { return null; }
    if (typeof idOrItem === "object") {
      return materialKey(idOrItem.originKey || idOrItem.materialId || idOrItem.sourceId || idOrItem.id);
    }
    /* 教材包 tm_N（含 tm_N_q3 這類題目 id）取 tm_N；舊版教材庫（data/materials/*.js）
       的紀錄 id（如 biology-g11-origin-and-evolution-of-life）原樣比對 materialIds。 */
    var m = /^(tm_\d+)(?:_|$)/.exec(String(idOrItem));
    return m ? m[1] : String(idOrItem).replace(/-q\d+$/, "");
  }

  function forMaterial(idOrItem) {
    var key = materialKey(idOrItem);
    if (!key) { return null; }
    return lessons().filter(function (l) { return l.materialIds.indexOf(key) !== -1; })[0] || null;
  }

  function normalize(s) { return String(s || "").replace(/\s+/g, "").toLowerCase(); }

  /* Each matched keyword scores its length; a keyword the text STARTS with
     earns a one-time bonus, because knowledge points name their main topic
     first (「疊合與三角方程式」is a 疊合 question, not an equation one). */
  var LEAD_BONUS = 6;
  function scoreCard(card, text) {
    var t = normalize(text);
    if (!t) { return 0; }
    var score = 0, lead = false;
    (card.keywords || []).concat([card.title]).forEach(function (kw) {
      var k = normalize(kw);
      if (k && t.indexOf(k) !== -1) { score += k.length; if (t.indexOf(k) === 0) { lead = true; } }
    });
    return score + (lead ? LEAD_BONUS : 0);
  }

  function match(text, opts) {
    opts = opts || {};
    var best = null;
    lessons().forEach(function (lesson) {
      if (opts.lesson && opts.lesson !== lesson) { return; }
      if (Array.isArray(opts.materialIds) &&
          !lesson.materialIds.some(function (id) { return opts.materialIds.indexOf(id) !== -1; })) { return; }
      lesson.cards.forEach(function (card) {
        if (opts.section && card.section !== opts.section) { return; }
        var s = scoreCard(card, text);
        if (s >= MIN_SCORE && (!best || s > best.score)) { best = { lesson: lesson, card: card, score: s }; }
      });
    });
    return best;
  }

  function forQuestion(q) {
    if (!q) { return null; }
    var key = null, lesson = null;
    [q.sourceId, q.materialId, q.id, q.questionId].some(function (id) {
      var l = id ? forMaterial(id) : null;
      if (l) { lesson = l; key = materialKey(id); }
      return !!l;
    });
    if (!lesson) { return null; }
    /* knowledgePoint names the concept directly, so it decides first; the
       stem is only a fallback (it often mentions several ideas at once).
       A package that is one whole text (e.g. a single 國文 lesson) can name
       its card in materialCards, used when neither mentions a keyword. */
    var fallback = lesson.materialCards && lesson.materialCards[key] ? card(lesson, lesson.materialCards[key]) : null;
    var opts = { lesson: lesson, section: fallback ? fallback.section : null };
    var hit = match(q.knowledgePoint || "", opts) || match(q.text || q.question || "", opts);
    if (hit) { return hit; }
    return fallback ? { lesson: lesson, card: fallback, score: 0 } : null;
  }

  function lessonUrl(lesson, cardId) {
    return lesson.href + "?embed=1&theme=light" + (cardId ? "#" + cardId : "");
  }

  function cardUrl(lesson, cardId) {
    return lesson.href + "?card=" + encodeURIComponent(cardId) + "&theme=light";
  }

  function card(lesson, cardId) {
    return (lesson && lesson.cards.filter(function (c) { return c.id === cardId; })[0]) || null;
  }

  return {
    lessons: lessons,
    forMaterial: forMaterial,
    match: match,
    forQuestion: forQuestion,
    lessonUrl: lessonUrl,
    cardUrl: cardUrl,
    card: card
  };
})();
