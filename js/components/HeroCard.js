/* js/HeroCard.js — Home Hero (v1.0): greeting + headline + primary/ghost
   actions on the left, AI 巧巧老師 illustration + speech-bubble tip on the
   right. Character art comes from the shared AHS.Qiaoqiao library so the
   look never diverges. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.HeroCard = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* create(model, handlers)
     model: AHS.AppConfig (student, hero)
     handlers: { onStart, onContinue } — invoked on button clicks. */
  function create(model, handlers) {
    handlers = handlers || {};
    var hero = model.hero;

    var status = el("p", {
      class: "hero-card__status", "aria-live": "polite", hidden: "hidden"
    });

    function fire(cb, message) {
      if (cb) { cb(); }
      status.textContent = message;
      status.removeAttribute("hidden");
    }

    var startBtn = el("button", {
      type: "button",
      class: "hero-card__btn hero-card__btn--primary",
      "data-action": "start",
      onclick: function () { fire(handlers.onStart, hero.startFeedback); }
    }, [
      el("span", { class: "hero-card__btn-icon", html: AHS.Icons.play() }),
      el("span", { text: hero.startLabel })
    ]);

    var continueBtn = el("button", {
      type: "button",
      class: "hero-card__btn hero-card__btn--ghost",
      "data-action": "continue",
      onclick: function () { fire(handlers.onContinue, hero.continueFeedback); }
    }, [
      el("span", { text: hero.continueLabel }),
      el("span", { class: "hero-card__btn-icon", html: AHS.Icons.arrowRight() })
    ]);

    var bubble = el("div", { class: "hero-card__bubble" }, [
      el("span", { class: "hero-card__bubble-title", text: hero.tipTitle }),
      el("p", { class: "hero-card__bubble-text", text: hero.tip }),
      el("span", { class: "hero-card__bubble-heart", html: AHS.Icons.heart() })
    ]);

    var dateInfo = el("div", { class: "hero-date-info" }, [
      el("span", { class: "hero-date" }),
      el("span", { class: "hero-weekday" })
    ]);

    var examInfo = el("div", { class: "hero-exam-info" }, [
      el("span", { class: "hero-exam-name" }),
      el("span", { class: "hero-exam-days" })
    ]);

    var quoteInfo = el("p", { class: "hero-quote" });

    return el("section", { class: "hero-card", "aria-label": "首頁 Hero" }, [
      el("div", { class: "hero-card__body" }, [
        el("p", { class: "hero-card__greeting", text: hero.greeting }),
        dateInfo,
        examInfo,
        quoteInfo,
        el("h1", { class: "hero-card__headline", text: hero.headline }),
        el("p", { class: "hero-card__reco", text: hero.recommendation }),
        el("div", { class: "hero-card__actions" }, [startBtn, continueBtn]),
        status
      ]),
      el("div", { class: "hero-card__figure" }, [
        el("div", {
          class: "hero-card__avatar qiaoqiao-full qiaoqiao-full--md",
          html: AHS.Qiaoqiao.full("pointing")
        }),
        bubble
      ])
    ]);
  }

  return { create: create };
})();
