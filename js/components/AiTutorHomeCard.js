/* components/AiTutorHomeCard.js — AI 巧巧老師 home card.
   Speech message + "ask" button + four quick-action tiles + character
   illustration. NOT a full chat room (Product Baseline forbids that on
   Home) — just an entry point.

   Sprint 6.6 · GitHub QA Fix (WO-001): no AI Runtime or AI API exists
   anywhere in this repository — there is no real source for an "AI
   老師建議" message. Per "不得新增功能", one isn't built here. Rather
   than keep showing Mock suggestion text, this card now requires a real
   model to render its speech/tiles; with none supplied it shows the
   mandated Empty State instead. The character illustration and card
   shell still render (they're static chrome, not "data"), so the entry
   point to AI Tutor (tutor.html) remains visible and useful even while
   empty. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AiTutorHomeCard = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function actionTile(action, status) {
    var btn = el("button", { type: "button", class: "tutor-card__tile" }, [
      el("span", { class: "tutor-card__tile-icon", html: AHS.Icons[action.icon]() }),
      el("span", { class: "tutor-card__tile-label", text: action.label }),
      el("span", { class: "tutor-card__tile-desc", text: action.desc })
    ]);
    btn.addEventListener("click", function () {
      status.textContent = "（Mock）啟動：" + action.label;
      status.removeAttribute("hidden");
    });
    return btn;
  }

  function emptyBody() {
    return el("div", { class: "tutor-card__empty" }, [
      el("span", { class: "tutor-card__empty-icon", html: AHS.Icons.tutor() }),
      el("p", { class: "tutor-card__empty-title", text: "AI 老師尚無建議" }),
      el("p", { class: "tutor-card__empty-hint", text: "完成更多學習後，巧巧老師會主動提供建議。" })
    ]);
  }

  /* create(model?) — no Mock fallback (Sprint 6.6 WO-001). model must be
     a real, fully-shaped suggestion object; anything else renders the
     Empty State. */
  function create(model) {
    var hasData = !!(model && model.message && Array.isArray(model.actions) && model.actions.length);
    var status = el("p", {
      class: "tutor-card__status", "aria-live": "polite", hidden: "hidden"
    });

    var top;
    if (hasData) {
      var askBtn = el("button", { type: "button", class: "tutor-card__ask" }, [
        el("span", { html: AHS.Icons.chat() }),
        el("span", { text: model.askLabel || "詢問巧巧老師" })
      ]);
      askBtn.addEventListener("click", function () {
        status.textContent = model.askFeedback || "（Mock）已送出詢問";
        status.removeAttribute("hidden");
      });
      top = el("div", { class: "tutor-card__top" }, [
        el("div", { class: "tutor-card__speech" }, [
          el("p", { class: "tutor-card__msg", text: model.message }),
          askBtn
        ]),
        el("div", {
          class: "tutor-card__avatar qiaoqiao-full qiaoqiao-full--sm",
          html: AHS.Qiaoqiao.full("pointing")
        })
      ]);
    } else {
      top = el("div", { class: "tutor-card__top" }, [
        emptyBody(),
        el("div", {
          class: "tutor-card__avatar qiaoqiao-full qiaoqiao-full--sm",
          html: AHS.Qiaoqiao.full("pointing")
        })
      ]);
    }

    return el("section", { class: "card tutor-card", "aria-label": "AI 巧巧老師" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "AI 巧巧老師" })
      ]),
      top,
      hasData ? el("div", { class: "tutor-card__tiles" },
        model.actions.map(function (a) { return actionTile(a, status); })) : null,
      status
    ]);
  }

  return { create: create };
})();
