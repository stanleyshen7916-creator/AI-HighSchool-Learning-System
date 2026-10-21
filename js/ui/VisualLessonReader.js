/* js/ui/VisualLessonReader.js — 2026-10-21 教材中心・圖解教材閱讀畫面.

   A material that has a visual lesson (AHS.VisualLesson.forMaterial) opens
   in this full-screen reader instead of the small preview modal:

     ┌ 返回 │ 科目・章名（完整名稱在 title 提示）│ 互動圖解｜文字教材與練習 │ 開新分頁 下載 ┐
     ├ 公式目錄（依節分組、目前位置、已完成）│ 教材頁 iframe（填滿剩餘高度）       ┤

   The lesson page and this reader talk with postMessage (also works
   between file:// pages):
     lesson → reader  { type: "ahs-visual-lesson:state", active, done[] }
     reader → lesson  { type: "ahs-visual-lesson:goto", card }
   「文字教材與練習」shows the same sections the preview modal shows
   (content / AI 重點整理 / AI 練習題), passed in as textNodes.

   open({ item, lesson, textNodes, onDownload }) -> overlay node. */
window.AHS = window.AHS || {};

AHS.VisualLessonReader = (function () {
  "use strict";

  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined;

  function open(opts) {
    var item = opts.item, lesson = opts.lesson, VL = AHS.VisualLesson;
    var subj = (AHS.Subjects && AHS.Subjects[item.subject]) || { name: lesson.subject };
    var state = { active: null, done: {} };

    var overlay = el("div", { class: "vreader", role: "dialog", "aria-modal": "true", "aria-label": lesson.title });
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function close() {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("message", onMessage);
      document.removeEventListener("keydown", onKey);
      if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
    }
    function onKey(ev) { if (ev.key === "Escape") { close(); } }
    document.addEventListener("keydown", onKey);

    /* ---- 教材頁 ---------------------------------------------------------- */
    var frame = el("iframe", { class: "vreader__frame", src: VL.lessonUrl(lesson), title: lesson.title });
    function goTo(cardId) {
      if (frame.contentWindow) {
        try { frame.contentWindow.postMessage({ type: "ahs-visual-lesson:goto", card: cardId }, "*"); } catch (e) { /* ignore */ }
      }
      setActive(cardId);
      showTab("lesson");
    }

    /* ---- 公式目錄 -------------------------------------------------------- */
    var navButtons = {};
    var progressText = el("span", { class: "vreader__progress-text" });
    var progressFill = el("span", { class: "vreader__progress-fill" });
    var nav = el("nav", { class: "vreader__nav", "aria-label": "公式目錄" }, [
      el("div", { class: "vreader__progress" }, [
        progressText,
        el("span", { class: "vreader__progress-bar" }, [progressFill])
      ])
    ]);
    (lesson.sections || []).forEach(function (s) {
      var list = el("ol", { class: "vreader__list" });
      lesson.cards.filter(function (c) { return c.section === s.id; }).forEach(function (c) {
        var b = el("button", { type: "button", class: "vreader__item", "data-card": c.id }, [
          el("span", { class: "vreader__item-code", text: c.id }),
          el("span", { class: "vreader__item-title", text: c.title }),
          el("span", { class: "vreader__item-check", "aria-hidden": "true", text: "✓" })
        ]);
        b.addEventListener("click", function () { goTo(c.id); });
        navButtons[c.id] = b;
        list.appendChild(el("li", {}, [b]));
      });
      nav.appendChild(el("div", { class: "vreader__group" }, [
        el("p", { class: "vreader__group-title" }, [
          el("span", { class: "vreader__group-no", text: s.id }), el("span", { text: s.title })
        ]),
        list
      ]));
    });

    /* 窄螢幕：目錄改成下拉選單 */
    var jump = el("select", { class: "vreader__jump", id: "vreader-jump", "aria-label": "跳到公式" });
    (lesson.sections || []).forEach(function (s) {
      var g = el("optgroup", { label: s.id + " " + s.title });
      lesson.cards.filter(function (c) { return c.section === s.id; }).forEach(function (c) {
        g.appendChild(el("option", { value: c.id, text: c.id + "　" + c.title }));
      });
      jump.appendChild(g);
    });
    jump.addEventListener("change", function () { if (jump.value) { goTo(jump.value); } });

    function setActive(cardId) {
      if (!cardId || !navButtons[cardId]) { return; }
      state.active = cardId;
      Object.keys(navButtons).forEach(function (id) {
        var on = id === cardId;
        navButtons[id].classList.toggle("is-active", on);
        if (on) { navButtons[id].setAttribute("aria-current", "true"); } else { navButtons[id].removeAttribute("aria-current"); }
      });
      if (jump.value !== cardId) { jump.value = cardId; }
    }
    function setDone(list) {
      state.done = {};
      (list || []).forEach(function (id) { state.done[id] = true; });
      var n = 0;
      Object.keys(navButtons).forEach(function (id) {
        navButtons[id].classList.toggle("is-done", !!state.done[id]);
        if (state.done[id]) { n += 1; }
      });
      var total = lesson.cards.length;
      progressText.textContent = "已完成 " + n + " / " + total;
      progressFill.style.width = Math.round(n / total * 100) + "%";
    }
    setDone([]);
    setActive(lesson.cards[0] && lesson.cards[0].id);

    function onMessage(ev) {
      var d = ev && ev.data;
      if (!d || d.type !== "ahs-visual-lesson:state" || ev.source !== frame.contentWindow) { return; }
      if (d.active) { setActive(d.active); }
      if (Array.isArray(d.done)) { setDone(d.done); }
    }
    window.addEventListener("message", onMessage);

    /* ---- 分頁 ------------------------------------------------------------ */
    var lessonPane = el("div", { class: "vreader__pane vreader__pane--lesson", role: "tabpanel", id: "vreader-pane-lesson" }, [nav, el("div", { class: "vreader__stage" }, [frame])]);
    var textPane = el("div", { class: "vreader__pane vreader__pane--text", role: "tabpanel", id: "vreader-pane-text", hidden: "hidden" }, [
      el("div", { class: "vreader__text" }, opts.textNodes || [])
    ]);
    var tabs = el("div", { class: "vreader__tabs", role: "tablist" });
    [["lesson", "互動圖解"], ["text", "文字教材與練習"]].forEach(function (t) {
      var b = el("button", { type: "button", class: "vreader__tab", role: "tab", "data-tab": t[0], "aria-controls": "vreader-pane-" + t[0], text: t[1] });
      b.addEventListener("click", function () { showTab(t[0]); });
      tabs.appendChild(b);
    });
    function showTab(key) {
      Array.prototype.forEach.call(tabs.children, function (b) {
        b.setAttribute("aria-selected", b.getAttribute("data-tab") === key ? "true" : "false");
      });
      if (key === "lesson") { lessonPane.removeAttribute("hidden"); textPane.setAttribute("hidden", "hidden"); jump.removeAttribute("hidden"); }
      else { textPane.removeAttribute("hidden"); lessonPane.setAttribute("hidden", "hidden"); jump.setAttribute("hidden", "hidden"); }
    }
    showTab("lesson");

    /* ---- 標頭 ------------------------------------------------------------ */
    var back = el("button", { type: "button", class: "vreader__back", text: "← 返回教材中心" });
    back.addEventListener("click", close);
    var dl = el("button", { type: "button", class: "vreader__btn vreader__btn--primary", text: "下載教材" });
    dl.addEventListener("click", function () { if (typeof opts.onDownload === "function") { opts.onDownload(item); } });
    var head = el("header", { class: "vreader__head" }, [
      back,
      el("div", { class: "vreader__heading", title: item.title || "" }, [
        el("p", { class: "vreader__eyebrow" }, [
          el("span", { class: "vreader__subject", text: subj.name }),
          el("span", { text: (item.grade || "") + "・" + lesson.cards.length + " 個公式・" + (lesson.source || "") })
        ]),
        el("h2", { class: "vreader__title", text: lesson.title })
      ]),
      tabs,
      el("div", { class: "vreader__actions" }, [
        jump,
        el("a", { class: "vreader__btn", href: lesson.href, target: "_blank", rel: "noopener", text: "開新分頁" }),
        dl
      ])
    ]);

    overlay.appendChild(head);
    overlay.appendChild(el("div", { class: "vreader__body" }, [lessonPane, textPane]));
    setTimeout(function () { if (back.focus) { back.focus(); } }, 0);
    return overlay;
  }

  return { open: open };
})();
