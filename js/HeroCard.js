/* js/HeroCard.js — Home Hero component (AI 巧巧老師 + greeting + actions).
   PascalCase component under window.AHS. Avatar is an inline SVG so the
   page makes zero network requests (works on file://). */
window.AHS = window.AHS || {};
AHS.HeroCard = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Inline avatar: AI 巧巧老師 — friendly female teacher, ink-green blazer,
     glasses. Kept as a compact, self-contained SVG. */
  var AVATAR_SVG =
    '<svg viewBox="0 0 120 120" role="img" aria-label="AI 巧巧老師頭像" ' +
    'xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="60" cy="60" r="60" fill="#e7f2ec"/>' +
      '<circle cx="60" cy="60" r="60" fill="none" stroke="#cfe4d8" stroke-width="2"/>' +
      /* hair back */
      '<path d="M30 58c0-20 13-34 30-34s30 14 30 34c0 8-2 15-5 20l-6-3c2-6 3-12 3-18 ' +
      '0-15-9-25-22-25S38 42 38 58c0 6 1 12 3 18l-6 3c-3-5-5-12-5-21z" fill="#5a3a2e"/>' +
      /* neck */
      '<rect x="53" y="72" width="14" height="16" rx="6" fill="#f0c19b"/>' +
      /* blazer (ink-green) */
      '<path d="M30 116c0-16 12-27 30-27s30 11 30 27z" fill="#1a4a3c"/>' +
      '<path d="M60 90l-9 26h18z" fill="#ffffff"/>' +
      '<path d="M60 90l-9 5 3 8 6-6 6 6 3-8z" fill="#e7f2ec"/>' +
      /* face */
      '<circle cx="60" cy="54" r="24" fill="#f7cda6"/>' +
      /* fringe */
      '<path d="M37 50c2-14 11-22 23-22s21 8 23 22c-6-6-14-9-23-9s-17 3-23 9z" fill="#5a3a2e"/>' +
      /* glasses */
      '<circle cx="50" cy="54" r="8" fill="#ffffff" fill-opacity="0.35" ' +
      'stroke="#1a4a3c" stroke-width="2.5"/>' +
      '<circle cx="70" cy="54" r="8" fill="#ffffff" fill-opacity="0.35" ' +
      'stroke="#1a4a3c" stroke-width="2.5"/>' +
      '<line x1="58" y1="54" x2="62" y2="54" stroke="#1a4a3c" stroke-width="2.5"/>' +
      /* eyes + smile */
      '<circle cx="50" cy="54" r="2.4" fill="#3a2a20"/>' +
      '<circle cx="70" cy="54" r="2.4" fill="#3a2a20"/>' +
      '<path d="M52 64c3 3 13 3 16 0" fill="none" stroke="#b5674a" ' +
      'stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle cx="44" cy="61" r="3" fill="#f6a98f" fill-opacity="0.6"/>' +
      '<circle cx="76" cy="61" r="3" fill="#f6a98f" fill-opacity="0.6"/>' +
    '</svg>';

  /* create(model, handlers)
     model: AHS.Mock (teacher, student, hero)
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
      el("span", { class: "hero-card__btn-icon", "aria-hidden": "true", text: "★" }),
      el("span", { text: hero.startLabel })
    ]);

    var continueBtn = el("button", {
      type: "button",
      class: "hero-card__btn hero-card__btn--ghost",
      "data-action": "continue",
      onclick: function () { fire(handlers.onContinue, hero.continueFeedback); }
    }, [
      el("span", { class: "hero-card__btn-icon", "aria-hidden": "true", text: "▶" }),
      el("span", { text: hero.continueLabel })
    ]);

    return el("article", { class: "hero-card" }, [
      el("div", { class: "hero-card__avatar", html: AVATAR_SVG }),
      el("div", { class: "hero-card__body" }, [
        el("span", { class: "hero-card__teacher" }, [
          el("span", { class: "hero-card__dot", "aria-hidden": "true" }),
          el("span", { text: model.teacher.name })
        ]),
        el("h1", { class: "hero-card__greeting", text: hero.greeting }),
        el("p", { class: "hero-card__reco", text: hero.recommendation }),
        el("div", { class: "hero-card__actions" }, [startBtn, continueBtn]),
        status
      ])
    ]);
  }

  return { create: create };
})();
