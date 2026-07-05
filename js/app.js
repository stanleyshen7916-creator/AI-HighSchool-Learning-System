/* js/app.js — bootstraps the Home v1.0 page inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function slot(area, node) {
    var wrap = AHS.UI.el("div", { class: "home__" + area });
    wrap.appendChild(node);
    return wrap;
  }

  function buildHome() {
    var hero = AHS.HeroCard.create(AHS.Mock, {
      onStart: function () { /* Mock event — no real navigation yet. */ },
      onContinue: function () { /* Mock event — no real navigation yet. */ }
    });

    return AHS.UI.el("div", { class: "home" }, [
      slot("hero", hero),
      slot("today", AHS.TodayMission.create()),
      slot("recent", AHS.HomeRecentMaterials.create()),
      slot("tutor", AHS.AiTutorHomeCard.create()),
      slot("stats", AHS.StudyStats.create()),
      slot("plan", AHS.StudyPlan.create()),
      slot("badges", AHS.AchievementBadges.create())
    ]);
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    var shell = AHS.AppShell.create(AHS.Mock, {
      onNavigate: function () { /* Mock navigation — single-page prototype. */ }
    });

    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(buildHome());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
