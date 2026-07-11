/* components/LearningTime.js — 今日學習時間 (Learning Time).
   Reads AHS.Mock.learning.todayMinutes and displays it as "N min".
   Falls back to "0 min" when data is missing/invalid — never throws.
   Minimal card, reuses shared .card / .card__head / .card__title
   primitives (shell.css) — no new layout, matches existing rail cards.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.LearningTime = (function () {
  "use strict";
  var el = AHS.UI.el;

  function resolveMinutes(model) {
    var data = model || (AHS.Mock && AHS.Mock.learning);
    var minutes = data && data.todayMinutes;
    return (typeof minutes === "number" && !isNaN(minutes) && minutes >= 0) ? minutes : 0;
  }

  /* create(model?) — model defaults to AHS.Mock.learning. */
  function create(model) {
    var minutes = resolveMinutes(model);

    return el("section", { class: "card learning-time-card", "aria-label": "今日學習時間" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "今日學習時間" })
      ]),
      el("p", { class: "learning-time-card__value", text: minutes + " min" })
    ]);
  }

  return { create: create };
})();
