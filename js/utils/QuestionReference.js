/* js/utils/QuestionReference.js — 2026-10-01 題目出處.

   Questions that do not come from the uploaded material itself carry a
   `reference` (出處): past national exam questions (questionSource
   PAST_EXAM, e.g. 「114學年度學科能力測驗 社會考科 第10題（大考中心）」)
   and AI-written 補充題庫 questions (what they were written from).
   Every page that shows a question shows this line under the stem.

   API
     of(q)   -> { text, pastExam, mapping } or null
   mapping (2026-10-02, past exam questions): { lesson, section, fit, note }
   — which lesson (課) / section (節) of the textbook the question maps to.
     node(q) -> HTMLElement (p.qref) or null
   q: { id | questionId, reference?, questionSource?, question | text }.
   Records saved before `reference` existed (e.g. old 知識弱點 rows) are
   looked up in AHS.TeachingMaterialData by questionId, then question text. */
window.AHS = window.AHS || {};

AHS.QuestionReference = (function () {
  "use strict";

  var byId = null;
  var byText = null;

  function index() {
    if (byId) { return; }
    byId = {};
    byText = {};
    (window.AHS.TeachingMaterialData || []).forEach(function (entry) {
      (entry && entry.questions || []).forEach(function (q) {
        if (!q || !q.reference) { return; }
        byId[q.id] = q;
        byText[String(q.question || "").replace(/\s+/g, "")] = q;
      });
    });
  }

  function of(q) {
    if (!q) { return null; }
    var source = q;
    if (!q.reference) {
      index();
      var id = q.questionId || q.id;
      source = (id && byId[id]) || byText[String(q.question || q.text || "").replace(/\s+/g, "")] || null;
    }
    if (!source || !source.reference) { return null; }
    return { text: String(source.reference), pastExam: source.questionSource === "PAST_EXAM", mapping: source.mapping || null };
  }

  function node(q) {
    var ref = of(q);
    if (!ref) { return null; }
    var p = document.createElement("p");
    p.className = "qref" + (ref.pastExam ? " qref--past" : "");
    if (ref.pastExam) {
      var badge = document.createElement("span");
      badge.className = "qref__badge";
      badge.textContent = "歷屆試題";
      p.appendChild(badge);
    }
    p.appendChild(document.createTextNode("出處：" + ref.text));
    if (ref.mapping && ref.mapping.lesson) {
      var map = document.createElement("span");
      map.className = "qref__map";
      map.textContent = "對應：" + ref.mapping.lesson + (ref.mapping.section ? " · " + ref.mapping.section : "") +
        (ref.mapping.fit === "部分對應" ? "（部分對應：" + (ref.mapping.note || "另需其他課的觀念") + "）" : "");
      p.appendChild(map);
    }
    return p;
  }

  return { of: of, node: node };
})();
