/* js/components/ReviewQuickAction.js — Sprint 5 · EO-R001 Review Home.
   Quick Actions block: 開始今日複習 / 錯題複習 / 繼續上次 Session.

   No Review Session implementation is permitted this Work Order.
   開始今日複習 and 錯題複習 route to the one real review mechanism that
   already exists in the repository — the Wrong Book page's 全部重新複習
   flow (wrongbook.html) — which is Reuse, not new Session logic.
   繼續上次 Session has no real backing (session-scoped only, no
   Storage permitted) so it follows the same Mock-feedback convention
   already used elsewhere in the repo (see AppShell.js profilePanel).
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewQuickAction = (function () {
  "use strict";
  var el = AHS.UI.el;

  function actionButton(variant, icon, label, handler) {
    var btn = el("button", {
      type: "button",
      class: "rv-quick__btn rv-quick__btn--" + variant
    }, [
      el("span", { class: "rv-quick__btn-icon", html: AHS.Icons[icon]() }),
      el("span", { text: label })
    ]);
    btn.addEventListener("click", handler);
    return btn;
  }

  /* create(handlers)
     handlers: { onStartToday, onWrongReview, onContinueSession } */
  function create(handlers) {
    handlers = handlers || {};

    var status = el("p", {
      class: "rv-quick__status", "aria-live": "polite", hidden: "hidden"
    });
    function feedback(message) {
      status.textContent = message;
      status.removeAttribute("hidden");
    }

    var startBtn = actionButton("primary", "play", "開始今日複習", function () {
      if (handlers.onStartToday) { handlers.onStartToday(); }
      window.location.href = "wrongbook.html";
    });
    var wrongBtn = actionButton("ghost", "wrong", "錯題複習", function () {
      if (handlers.onWrongReview) { handlers.onWrongReview(); }
      window.location.href = "wrongbook.html";
    });
    var continueBtn = actionButton("ghost", "refresh", "繼續上次 Session", function () {
      if (handlers.onContinueSession) { handlers.onContinueSession(); }
      feedback("（Mock）尚無可繼續的上次 Session");
    });

    return el("section", { class: "card rv-quick", "aria-label": "快速操作" }, [
      el("h2", { class: "card__title", text: "快速操作" }),
      el("div", { class: "rv-quick__list" }, [startBtn, wrongBtn, continueBtn]),
      status
    ]);
  }

  return { create: create };
})();
