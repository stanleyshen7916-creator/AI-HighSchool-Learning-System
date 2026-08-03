/* js/components/ReviewQuickAction.js — Sprint 5 · EO-R001 / EO-S5-002 /
   EO-S5-003.
   Quick Actions block: 開始今日複習 / 錯題複習 / 繼續上次複習.

   EO-S5-003 (WB-S5-002): 開始今日複習 and 錯題複習 now run genuinely
   different flows with genuinely different real-data checks — they no
   longer share the same navigation.

   開始今日複習 → checks model.dueToday (real number, computed for real in
   AppReview.js from AHS.StatisticsRuntime.dueForReview()). Sprint AI-111
   AI-609/AI-610 gave dueToday a real, non-fixed value (WrongBookRuntime's
   own persisted correctStreak field — "not yet 已精熟"), so this branch
   is reachable now.

   Sprint AI-114 AI-901: 複習中心 now owns a real, in-page Review Session
   (js/components/ReviewSession.js + js/runtime/ReviewRuntime.js's own
   session API) instead of redirecting to wrongbook.html — the earlier
   Sprint AI-111 decision to reuse wrongbook.html as a stand-in (quoted
   above, kept for history) is explicitly superseded by this Sprint's own
   "不得直接跳轉 WrongBook" instruction. dueToday > 0 now renders as a
   real <button> that calls handlers.onStartToday() (AppReview.js mounts
   the session in place); the dueToday === 0 branch keeps the exact
   existing Empty State copy, unchanged.

   錯題複習 → checks model.hasWrongItems, a real read of the existing
   AHS.WrongBookRuntime.list() (done once in ReviewHome.js, not created
   here). If there are real wrong-answer records it renders as a genuine
   <a href="wrongbook.html"> link (no window.location.href, matching this
   EO's Bottom Navigation Rules pattern applied consistently here too).
   If there are none, it renders as a <button> showing the specified
   "目前沒有可複習錯題。" message instead of linking to an empty page.

   繼續上次複習 is unchanged from EO-S5-002 (out of scope this EO) — kept
   on the existing Mock-feedback convention.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewQuickAction = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function iconLabel(icon, label) {
    return [
      el("span", { class: "rv-quick__btn-icon", html: AHS.Icons[icon]() }),
      el("span", { text: label })
    ];
  }

  /* create(model, handlers)
     model: { dueToday, hasWrongItems } — real values from ReviewHome.js.
     handlers: { onStartToday, onWrongReview, onContinueSession } */
  function create(model, handlers) {
    model = model || {};
    handlers = handlers || {};

    var status = el("p", {
      class: "rv-quick__status", "aria-live": "polite", hidden: "hidden"
    });
    function feedback(message) {
      status.textContent = message;
      status.removeAttribute("hidden");
    }

    /* ---- 開始今日複習 ----------------------------------------------------
       Sprint AI-114 AI-901: dueToday > 0 now starts a real, in-page
       Review Session (handlers.onStartToday(), which AppReview.js wires
       to mount js/components/ReviewSession.js) instead of navigating
       anywhere. dueToday === 0 keeps the existing button + Empty State
       copy, unchanged. */
    var startBtn;
    if (model.dueToday > 0) {
      startBtn = el("button", {
        type: "button", class: "rv-quick__btn rv-quick__btn--primary"
      }, iconLabel("play", "開始今日複習"));
      startBtn.addEventListener("click", function () {
        if (handlers.onStartToday) { handlers.onStartToday(); }
      });
    } else {
      startBtn = el("button", {
        type: "button", class: "rv-quick__btn rv-quick__btn--primary"
      }, iconLabel("play", "開始今日複習"));
      startBtn.addEventListener("click", function () {
        if (handlers.onStartToday) { handlers.onStartToday(); }
        feedback("今天沒有待複習內容。可先完成新的測驗或前往錯題本。");
      });
    }

    /* ---- 錯題複習 ---------------------------------------------------------
       Real check, decided once at render time (same pattern AppShell.js
       already uses for isActive-based <a> vs <button> rendering). */
    var wrongBtn;
    if (model.hasWrongItems) {
      wrongBtn = el("a", {
        class: "rv-quick__btn rv-quick__btn--ghost", href: "wrongbook.html"
      }, iconLabel("wrong", "錯題複習"));
      wrongBtn.addEventListener("click", function () {
        if (handlers.onWrongReview) { handlers.onWrongReview(); }
      });
    } else {
      wrongBtn = el("button", {
        type: "button", class: "rv-quick__btn rv-quick__btn--ghost"
      }, iconLabel("wrong", "錯題複習"));
      wrongBtn.addEventListener("click", function () {
        if (handlers.onWrongReview) { handlers.onWrongReview(); }
        feedback("目前沒有可複習錯題。");
      });
    }

    /* ---- 繼續上次複習 ------------------------------------------------------ */
    var continueBtn = el("button", {
      type: "button", class: "rv-quick__btn rv-quick__btn--ghost"
    }, iconLabel("refresh", "繼續上次複習"));
    continueBtn.addEventListener("click", function () {
      if (handlers.onContinueSession) { handlers.onContinueSession(); }
      feedback("尚無可繼續的上次複習");
    });

    return el("section", { class: "card rv-quick", "aria-label": "快速操作" }, [
      el("h2", { class: "card__title", text: "快速操作" }),
      el("div", { class: "rv-quick__list" }, [startBtn, wrongBtn, continueBtn]),
      status
    ]);
  }

  return { create: create };
})();
