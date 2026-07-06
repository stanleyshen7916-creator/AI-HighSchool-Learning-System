/* js/app.js — bootstraps the Home v1.0 page inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function buildHome() {
    var hero = AHS.HeroCard.create(AHS.Mock, {
      onStart: function () { /* Mock event — no real navigation yet. */ },
      onContinue: function () { /* Mock event — no real navigation yet. */ }
    });

    var el = AHS.UI.el;

    /* Main column (left): hero, recent materials, then 學習統計 | 學習計畫
       side by side. Right rail: 今日任務, AI 巧巧老師, 成就勳章.
       Two independent vertical stacks — matches the approved mockup and
       keeps card heights from coupling across columns. */
    var main = el("div", { class: "home__main" }, [
      hero,
      AHS.HomeRecentMaterials.create(),
      el("div", { class: "home__statsplan" }, [
        AHS.StudyStats.create(),
        AHS.StudyPlan.create()
      ])
    ]);

    var rail = el("div", { class: "home__rail" }, [
      AHS.TodayMission.create(),
      AHS.AiTutorHomeCard.create(),
      AHS.AchievementBadges.create()
    ]);

    return el("div", { class: "home" }, [main, rail]);
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
