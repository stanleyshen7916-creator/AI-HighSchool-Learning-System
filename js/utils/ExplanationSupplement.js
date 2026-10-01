/* js/utils/ExplanationSupplement.js — 2026-10-01 數學詳解補強.

   The uploaded teaching-material packages are never modified. Richer
   worked solutions live in js/data/ExplanationSupplementData.js (generated
   by docs/TeachingMaterials/scripts/GenerateExplanationSupplement.js),
   keyed by questionId. Every page that shows an explanation asks this
   module first; when a supplement exists it shows

     解題關鍵 → 示意圖（附說明）→ 詳細步驟 → 常見錯誤 → 覆核提醒
     → 原始詳解（收合，內容不變）

   and otherwise the page keeps showing the original explanation exactly
   as before.

   API
     find(q)                 -> supplement entry or null
     render(q, originalText) -> HTMLElement (div.xsup) or null
   q: "tm_7_q1" | { questionId | id, question | text }. Matching by the
   question text covers old 知識弱點 records saved before questionId. */
window.AHS = window.AHS || {};

AHS.ExplanationSupplement = (function () {
  "use strict";

  var byText = null;

  function data() { return window.AHS.ExplanationSupplementData || {}; }

  function normalize(s) { return String(s || "").replace(/\s+/g, ""); }

  function find(q) {
    if (!q) { return null; }
    var all = data();
    var id = typeof q === "string" ? q : (q.questionId || q.id || "");
    if (id && Object.prototype.hasOwnProperty.call(all, id)) { return all[id]; }
    if (typeof q === "string") { return null; }
    var text = normalize(q.question || q.text);
    if (!text) { return null; }
    if (!byText) {
      byText = {};
      Object.keys(all).forEach(function (k) { if (all[k].question) { byText[normalize(all[k].question)] = all[k]; } });
    }
    return byText[text] || null;
  }

  function node(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined && text !== null) { e.textContent = String(text); }
    return e;
  }

  function section(title, cls) {
    var s = node("div", "xsup__section " + cls);
    s.appendChild(node("p", "xsup__label", title));
    return s;
  }

  function render(q, originalText) {
    var entry = find(q);
    if (!entry) { return null; }
    var root = node("div", "xsup");

    var concept = section("解題關鍵", "xsup__concept");
    concept.appendChild(node("p", "xsup__text", entry.concept));
    root.appendChild(concept);

    if (entry.figures && entry.figures.length) {
      var figs = node("div", "xsup__figures");
      entry.figures.forEach(function (f) {
        var fig = node("figure", "xsup__figure");
        var svg = node("div", "xsup__svg");
        /* generator-validated plain SVG (no script / handlers / links) */
        svg.innerHTML = f.svg;
        fig.appendChild(svg);
        fig.appendChild(node("figcaption", "xsup__caption", f.caption));
        figs.appendChild(fig);
      });
      root.appendChild(figs);
    }

    var steps = section("詳細步驟", "xsup__steps");
    var ol = node("ol", "xsup__list");
    entry.steps.forEach(function (s) { ol.appendChild(node("li", "", s)); });
    steps.appendChild(ol);
    root.appendChild(steps);

    if (entry.pitfalls && entry.pitfalls.length) {
      var pit = section("常見錯誤", "xsup__pitfalls");
      var ul = node("ul", "xsup__list");
      entry.pitfalls.forEach(function (s) { ul.appendChild(node("li", "", s)); });
      pit.appendChild(ul);
      root.appendChild(pit);
    }

    if (entry.note) {
      var note = node("p", "xsup__note");
      note.appendChild(node("strong", "", "覆核提醒："));
      note.appendChild(document.createTextNode(entry.note));
      root.appendChild(note);
    }

    if (originalText) {
      var details = node("details", "xsup__original");
      details.appendChild(node("summary", "", "原始詳解"));
      details.appendChild(node("p", "xsup__text", originalText));
      root.appendChild(details);
    }
    return root;
  }

  return { find: find, render: render };
})();
