/* js/ui/VisualLessonFrame.js — 2026-10-21 圖解教材（互動）.

   Shows a lesson from AHS.VisualLessonData inside an <iframe>, so the
   lesson's own canvas/CSS never mixes with the platform's.

     full(lesson)              教材中心: the whole lesson, fixed-height frame
                               with its own scroll + a「跳到公式」selector and
                               an「開新分頁」link.
     card(lesson, cardId)      學習助教: one formula card only; the frame
                               grows to the card's real height (the lesson
                               posts it with postMessage, which also works
                               between file:// pages).
     cardToggle(lesson, cardId) a「看互動圖解」button that opens card() below
                               itself on first click (for quiz feedback).

   No fetch / storage; the lesson page is loaded by the browser like any
   other same-site page. */
window.AHS = window.AHS || {};

AHS.VisualLessonFrame = (function () {
  "use strict";

  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined;
  var listening = false;
  var frames = [];

  function listen() {
    if (listening || typeof window.addEventListener !== "function") { return; }
    listening = true;
    window.addEventListener("message", function (ev) {
      var d = ev && ev.data;
      if (!d || d.type !== "ahs-visual-lesson:height" || typeof d.height !== "number") { return; }
      frames = frames.filter(function (f) { return f.isConnected !== false; });
      frames.forEach(function (f) {
        if (f.contentWindow && f.contentWindow === ev.source) {
          f.style.height = Math.max(120, Math.min(4000, Math.ceil(d.height) + 4)) + "px";
        }
      });
    });
  }

  function sectionTitle(lesson, sectionId) {
    var s = (lesson.sections || []).filter(function (x) { return x.id === sectionId; })[0];
    return s ? s.title : "";
  }

  function full(lesson) {
    var VL = AHS.VisualLesson;
    var frame = el("iframe", {
      class: "vlesson__frame", src: VL.lessonUrl(lesson), title: lesson.title, loading: "lazy"
    });
    var select = el("select", { class: "vlesson__jump", "aria-label": "跳到公式", id: "vlesson-jump-" + lesson.lessonId });
    select.appendChild(el("option", { value: "", text: "跳到公式…" }));
    (lesson.sections || []).forEach(function (s) {
      var group = el("optgroup", { label: s.id + " " + s.title });
      lesson.cards.filter(function (c) { return c.section === s.id; }).forEach(function (c) {
        group.appendChild(el("option", { value: c.id, text: c.title }));
      });
      select.appendChild(group);
    });
    select.addEventListener("change", function () {
      if (select.value) { frame.setAttribute("src", VL.lessonUrl(lesson, select.value)); }
    });
    return el("div", { class: "vlesson vlesson--full" }, [
      el("div", { class: "vlesson__bar" }, [
        el("span", { class: "vlesson__badge", text: "互動圖解" }),
        el("span", { class: "vlesson__meta", text: lesson.cards.length + " 個公式・" + (lesson.source || "") }),
        select,
        el("a", { class: "vlesson__open", href: lesson.href, target: "_blank", rel: "noopener", text: "開新分頁" })
      ]),
      frame
    ]);
  }

  function card(lesson, cardId) {
    listen();
    var VL = AHS.VisualLesson;
    var c = VL.card(lesson, cardId);
    if (!c) { return null; }
    var frame = el("iframe", {
      class: "vlesson__frame vlesson__frame--card", src: VL.cardUrl(lesson, cardId),
      title: "互動圖解：" + c.title, loading: "lazy"
    });
    frames.push(frame);
    return el("div", { class: "vlesson vlesson--card" }, [
      el("div", { class: "vlesson__bar" }, [
        el("span", { class: "vlesson__badge", text: "互動圖解" }),
        el("span", { class: "vlesson__meta", text: c.section + " " + sectionTitle(lesson, c.section) + "・" + c.title }),
        el("a", { class: "vlesson__open", href: lesson.href + "#" + c.id, target: "_blank", rel: "noopener", text: "看完整圖解教材" })
      ]),
      frame
    ]);
  }

  function cardToggle(lesson, cardId, onOpen) {
    var c = AHS.VisualLesson.card(lesson, cardId);
    if (!c) { return null; }
    var holder = el("div", { class: "vlesson-toggle" });
    var btn = el("button", { type: "button", class: "vlesson-toggle__btn", "aria-expanded": "false", text: "看互動圖解：" + c.title });
    var body = null;
    btn.addEventListener("click", function () {
      if (!body) { body = card(lesson, cardId); holder.appendChild(body); }
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { body.removeAttribute("hidden"); } else { body.setAttribute("hidden", "hidden"); }
      if (open && typeof onOpen === "function") { onOpen(); }
    });
    holder.appendChild(btn);
    return holder;
  }

  return { full: full, card: card, cardToggle: cardToggle };
})();
