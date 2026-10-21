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
    var m = /^(tm_\d+)(?:_|$)/.exec(String(idOrItem));
    return m ? m[1] : null;
  }

  function forMaterial(idOrItem) {
    var key = materialKey(idOrItem);
    if (!key) { return null; }
    return lessons().filter(function (l) { return l.materialIds.indexOf(key) !== -1; })[0] || null;
  }

  function normalize(s) { return String(s || "").replace(/\s+/g, "").toLowerCase(); }

  function scoreCard(card, text) {
    var t = normalize(text);
    if (!t) { return 0; }
    var score = 0;
    (card.keywords || []).concat([card.title]).forEach(function (kw) {
      var k = normalize(kw);
      if (k && t.indexOf(k) !== -1) { score += k.length; }
    });
    return score;
  }

  function match(text, opts) {
    opts = opts || {};
    var best = null;
    lessons().forEach(function (lesson) {
      if (opts.lesson && opts.lesson !== lesson) { return; }
      if (Array.isArray(opts.materialIds) &&
          !lesson.materialIds.some(function (id) { return opts.materialIds.indexOf(id) !== -1; })) { return; }
      lesson.cards.forEach(function (card) {
        var s = scoreCard(card, text);
        if (s >= MIN_SCORE && (!best || s > best.score)) { best = { lesson: lesson, card: card, score: s }; }
      });
    });
    return best;
  }

  function forQuestion(q) {
    if (!q) { return null; }
    var lesson = forMaterial(q.id || q.questionId || q.sourceId);
    if (!lesson) { return null; }
    /* knowledgePoint names the concept directly, so it decides first; the
       stem is only a fallback (it often mentions several ideas at once). */
    return match(q.knowledgePoint || "", { lesson: lesson }) ||
      match(q.text || q.question || "", { lesson: lesson });
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
