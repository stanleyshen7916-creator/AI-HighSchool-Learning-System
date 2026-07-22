/* components/ContinueLearning.js — Continue Learning (HOME-F007).
   Sprint 6.6 WO-007: no longer reads AHS.AppConfig.lastLearning. Renders
   whatever real model js/pages/app.js passes in (subject / chapter /
   lesson / progress, derived from AHS.MaterialRuntime). Shows
   "尚無學習紀錄" and disables the click target when data is missing.
   Reuses shared .card / .card__head / .card__title primitives — no new
   layout, matches existing rail cards (e.g. LearningTime, HOME-F006).
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ContinueLearning = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* Actual materials page is materials.html (plural) — the task spec's
     literal "material.html" does not exist in this project, so the real
     filename is used here. */
  var MATERIALS_PAGE = "materials.html";

  function clampProgress(value) {
    var n = typeof value === "number" && !isNaN(value) ? value : 0;
    if (n < 0) { return 0; }
    if (n > 100) { return 100; }
    return n;
  }

  /* create(model) — Sprint 6.6 WO-007: no Mock fallback anymore. app.js
     always passes a real object (real data or {} when nothing has
     called MaterialRuntime.startLearning() yet). */
  function create(model) {
    var data = model || {};
    var hasData = !!(data && data.subject && data.chapter && data.lesson && data.materialId);

    var body;
    if (hasData) {
      var pct = clampProgress(data.progress);
      body = el("a", {
        class: "continue-learning-card__link",
        href: MATERIALS_PAGE + "?id=" + encodeURIComponent(data.materialId)
      }, [
        el("p", { class: "continue-learning-card__subject", text: data.subject + "｜" + data.chapter }),
        el("p", { class: "continue-learning-card__lesson", text: data.lesson }),
        el("p", { class: "continue-learning-card__progress", text: pct + "%" })
      ]);
    } else {
      body = el("p", { class: "continue-learning-card__empty", text: "尚無學習紀錄" });
    }

    return el("section", { class: "card continue-learning-card", "aria-label": "Continue Learning" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "繼續學習" })
      ]),
      body
    ]);
  }

  return { create: create };
})();
