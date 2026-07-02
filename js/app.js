/* js/app.js — bootstraps the Home Hero (Task T001). */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var root = document.getElementById("hero-root");
    if (!root) { return; }

    var hero = AHS.HeroCard.create(AHS.Mock, {
      onStart: function () { /* Mock event — no navigation in this task. */ },
      onContinue: function () { /* Mock event — no navigation in this task. */ }
    });

    AHS.UI.mount(root, hero);

    var todayRoot = document.getElementById("today-root");
    if (todayRoot && AHS.TodayMission) {
      AHS.UI.mount(todayRoot, AHS.TodayMission.create());
    }

    var resumeRoot = document.getElementById("resume-root");
    if (resumeRoot && AHS.ResumeLearning) {
      AHS.UI.mount(resumeRoot, AHS.ResumeLearning.create());
    }

    var recentRoot = document.getElementById("recent-materials-root");
    if (recentRoot && AHS.HomeRecentMaterials) {
      AHS.UI.mount(recentRoot, AHS.HomeRecentMaterials.create());
    }

    var bottomNavRoot = document.getElementById("bottom-nav-root");
    if (bottomNavRoot && AHS.HomeBottomNavigation) {
      AHS.UI.mount(bottomNavRoot, AHS.HomeBottomNavigation.create());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
