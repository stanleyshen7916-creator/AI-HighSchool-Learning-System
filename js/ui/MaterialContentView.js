/* js/ui/MaterialContentView.js — Sprint AI-105 · Task AI105-06 Material Detail
   Renders a material's real `content` field (the same field
   AHS.MaterialRuntime.add()/AITutorService's AI Summary/Question chain
   already reads) as readable Markdown or HTML inside the existing
   Material Preview overlay. No new Runtime, no new Store — this is a
   thin presentation-only addition reading AHS.MaterialRuntime's
   existing record shape, exactly like MaterialSummaryCard.js/
   MaterialQuestionCard.js already do for their own sections.

   Security note: `content` can come from a real uploaded/imported file
   and is therefore untrusted. Markdown is parsed into real DOM nodes
   via AHS.UI.el() — text is always inserted through `text:`
   (textContent), never innerHTML, so no markup in the source can ever
   execute. HTML content is rendered inside a sandboxed <iframe
   sandbox="">  (no `allow-scripts`, no `allow-same-origin`) via
   `srcdoc` — the same isolation technique already used for PDF/text
   preview elsewhere in MaterialPreview.js, extended here with an
   explicit empty sandbox so embedded HTML cannot run script or reach
   the parent page. */
window.AHS = window.AHS || {};
AHS.MaterialContentView = (function () {
  "use strict";

  var el = AHS.UI.el;

  function looksLikeHtml(text) {
    var trimmed = text.trim();
    return /^<!doctype html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed) ||
      (/^</.test(trimmed) && /<\/[a-z]+>\s*$/i.test(trimmed));
  }

  /* Minimal, dependency-free Markdown subset: # headings, blank-line
     paragraphs, - / * / 1. lists, **bold** / *italic* inline spans.
     Deliberately small — enough to render real study-material text
     legibly, not a full CommonMark implementation. */
  function renderMarkdown(text) {
    var lines = text.split(/\r?\n/);
    var container = el("div", { class: "mat-content__markdown" });
    var listNode = null;

    function inline(lineText) {
      var parts = [];
      var rest = lineText;
      var pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/;
      while (rest.length) {
        var m = pattern.exec(rest);
        if (!m) { parts.push(document.createTextNode(rest)); break; }
        if (m.index > 0) { parts.push(document.createTextNode(rest.slice(0, m.index))); }
        if (m[2] !== undefined) { parts.push(el("strong", { text: m[2] })); }
        else { parts.push(el("em", { text: m[3] })); }
        rest = rest.slice(m.index + m[0].length);
      }
      return parts;
    }

    function flushList() { listNode = null; }

    lines.forEach(function (raw) {
      var line = raw;
      var heading = /^(#{1,6})\s+(.*)$/.exec(line);
      var listItem = /^\s*[-*]\s+(.*)$/.exec(line) || /^\s*\d+\.\s+(.*)$/.exec(line);

      if (heading) {
        flushList();
        var level = Math.min(heading[1].length + 3, 6); /* h1 reserved for the overlay title; body starts at h4 */
        var h = document.createElement("h" + level);
        h.className = "mat-content__heading";
        inline(heading[2]).forEach(function (n) { h.appendChild(n); });
        container.appendChild(h);
        return;
      }

      if (listItem) {
        if (!listNode) {
          listNode = el("ul", { class: "mat-content__list" });
          container.appendChild(listNode);
        }
        var li = el("li", {});
        inline(listItem[1]).forEach(function (n) { li.appendChild(n); });
        listNode.appendChild(li);
        return;
      }

      flushList();
      if (line.trim() === "") { return; }
      var p = el("p", { class: "mat-content__paragraph" });
      inline(line).forEach(function (n) { p.appendChild(n); });
      container.appendChild(p);
    });

    return container;
  }

  function renderHtml(text) {
    return el("iframe", {
      class: "mat-content__frame",
      sandbox: "",
      srcdoc: text,
      title: "教材內容"
    });
  }

  /* create(item) -> { node }. Honest empty state when the material has
     no real content yet (e.g. uploaded but not text-extracted) —
     never fabricates placeholder text. */
  function create(item) {
    var section = el("section", { class: "mat-content", "aria-label": "教材內容" });
    section.appendChild(el("div", { class: "mat-summary__head" }, [
      el("h3", { class: "mat-summary__heading", text: "教材內容" })
    ]));

    var content = typeof item.content === "string" ? item.content.trim() : "";
    if (!content) {
      section.appendChild(el("p", { class: "mat-summary__notice", text: "此教材目前尚無可顯示的內容。" }));
      return { node: section };
    }

    section.appendChild(looksLikeHtml(content) ? renderHtml(content) : renderMarkdown(content));
    return { node: section };
  }

  return { create: create };
})();
