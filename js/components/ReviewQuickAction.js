/* js/components/ReviewQuickAction.js — Sprint 5 · EO-R001 / EO-S5-002 /
   EO-S5-003.
   Quick Actions block: 開始今日複習 / 錯題複習 / 繼續上次複習.

   EO-S5-003 (WB-S5-002): 開始今日複習 and 錯題複習 now run genuinely
   different flows with genuinely different real-data checks — they no
   longer share the same navigation.

   開始今日複習 → checks model.dueToday (real number, computed for real in
   ReviewHome.js from the same source Statistics uses). If > 0 it would
   create a Today's Review Session and enter it — but dueToday is fixed
   at 0 across the whole repository (no due-date concept exists anywhere;
   the same acknowledged gap as Wrong Book's 今日待複習, and this EO
   forbids new Architecture/features), so that branch is real code but
   currently unreachable. The reachable branch — dueToday === 0 — shows
   the exact Empty State copy specified in EO-S5-003.

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

    /* ---- 開始今日複習 ---------------------------------------------------- */
    var startBtn = el("button", {
      type: "button", class: "rv-quick__btn rv-quick__btn--primary"
    }, iconLabel("play", "開始今日複習"));
    startBtn.addEventListener("click", function () {
      if (handlers.onStartToday) { handlers.onStartToday(); }
      if (model.dueToday > 0) {
        /* Real branch, currently unreachable — see file header note.
           Kept honest rather than building a Review Session destination
           (new Architecture/feature, out of scope this EO). */
        feedback("Review Session 尚未實作");
      } else {
        feedback("今天沒有待複習內容。可先完成新的測驗或前往錯題本。");
      }
    });

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
