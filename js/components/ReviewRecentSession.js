/* js/components/ReviewRecentSession.js — Sprint 5 · EO-R001 / EO-R001A.
   Recent Review block: 最近一次複習 (日期 / 完成率 / 花費時間 / 繼續).

   Data note (EO-R001A · PMO Option B): no longer static Mock. ReviewHome.js
   passes in `model`, the most recent entry from AHS.HistoryRuntime.list()
   (or null if that Runtime has no records yet — a real, empty-by-default
   Runtime state, same pattern as WrongBookRuntime). This component does
   no Runtime access and creates no data of its own.

   花費時間 (time spent) has no field anywhere in AutoGrader/HistoryRuntime
   — not a Review-specific gap, nothing in the whole repository tracks
   duration — so it always renders as "尚無資料" per PMO ruling, never
   estimated. 繼續 keeps the existing Mock-feedback convention (Review
   Session still isn't implemented, per EO-R001 / EO-R001A "不得新增功能").
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewRecentSession = (function () {
  "use strict";
  var el = AHS.UI.el;

  function metaItem(label, value) {
    return el("div", { class: "rv-recent__item" }, [
      el("strong", { class: "rv-recent__value", text: value }),
      el("span", { class: "rv-recent__label", text: label })
    ]);
  }

  function emptyState() {
    return el("p", { class: "rv-recent__empty", text: "尚無複習紀錄" });
  }

  /* create(model, handlers)
     model: the most recent AHS.HistoryRuntime record (clone), or null.
     handlers: { onContinue } */
  function create(model, handlers) {
    handlers = handlers || {};

    var status = el("p", {
      class: "rv-recent__status", "aria-live": "polite", hidden: "hidden"
    });

    var continueBtn = el("button", {
      type: "button", class: "rv-recent__btn"
    }, [
      el("span", { text: "繼續" }),
      el("span", { class: "rv-recent__btn-icon", html: AHS.Icons.arrowRight() })
    ]);
    continueBtn.addEventListener("click", function () {
      if (handlers.onContinue) { handlers.onContinue(); }
      status.textContent = "（Mock）尚無可繼續的複習紀錄";
      status.removeAttribute("hidden");
    });

    var body = model
      ? el("div", { class: "rv-recent__meta" }, [
          metaItem("日期", model.when || "--"),
          metaItem("完成率", typeof model.accuracy === "number" ? model.accuracy + "%" : "--"),
          metaItem("花費時間", "尚無資料")
        ])
      : emptyState();

    return el("section", { class: "card rv-recent", "aria-label": "最近一次複習" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "最近一次複習" }),
        continueBtn
      ]),
      body,
      status
    ]);
  }

  return { create: create };
})();
