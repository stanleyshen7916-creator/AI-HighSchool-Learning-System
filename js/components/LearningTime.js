/* components/LearningTime.js — 今日學習時間 (Learning Time).
   Sprint 6.6 WO-007: no Mock Data fallback anymore. app.js always
   passes a real, computed model (from AHS.MaterialRuntime). Falls back
   to "0 min" only when the model itself is missing/invalid — never
   throws, never reads AHS.Mock.
   Minimal card, reuses shared .card / .card__head / .card__title
   primitives (shell.css) — no new layout, matches existing rail cards.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.LearningTime = (function () {
  "use strict";
  var el = AHS.UI.el;

  function resolveMinutes(model) {
    var minutes = model && model.todayMinutes;
    return (typeof minutes === "number" && !isNaN(minutes) && minutes >= 0) ? minutes : 0;
  }

  /* create(model) — model should be { todayMinutes }. */
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
