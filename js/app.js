/* js/app.js — bootstraps the Home v1.0 page inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function buildHome() {
    /* Sprint 1 · Task 001: 依系統時間更新問候文字，其餘 hero 內容不變。 */
    if (AHS.Utils && typeof AHS.Utils.getGreeting === "function") {
      AHS.Mock.hero.greeting = AHS.Utils.getGreeting();
    }

    var hero = AHS.HeroCard.create(AHS.Mock, {
      onStart: function () { /* Mock event — no real navigation yet. */ },
      onContinue: function () { /* Mock event — no real navigation yet. */ }
    });

    /* Sprint 1 · Task 002: 填入 Hero Card 日期／星期區塊（不修改其他元件）。 */
    if (AHS.Utils && typeof AHS.Utils.getCurrentDate === "function") {
      var dateInfo = AHS.Utils.getCurrentDate();
      var dateEl = hero.querySelector(".hero-date");
      var weekdayEl = hero.querySelector(".hero-weekday");
      if (dateEl) { dateEl.textContent = dateInfo.date; }
      if (weekdayEl) { weekdayEl.textContent = dateInfo.weekday; }
    }

    /* Sprint 1 · Task 003: 填入 Hero Card 下一次段考倒數區塊。
       若 exam Data 不存在，顯示「尚未設定段考資訊」，不得產生 Console Error。 */
    if (AHS.Utils && typeof AHS.Utils.getExamCountdown === "function") {
      var examCountdown = AHS.Utils.getExamCountdown();
      var examNameEl = hero.querySelector(".hero-exam-name");
      var examDaysEl = hero.querySelector(".hero-exam-days");
      if (examCountdown) {
        if (examNameEl) { examNameEl.textContent = examCountdown.examName; }
        if (examDaysEl) { examDaysEl.textContent = "倒數 " + examCountdown.remainingDays + " 天"; }
      } else {
        if (examNameEl) { examNameEl.textContent = "尚未設定段考資訊"; }
        if (examDaysEl) { examDaysEl.textContent = ""; }
      }
    }

    /* Sprint 1 · Task 004: 填入 Hero Card 今日鼓勵文字（每次初始化隨機一句）。 */
    if (AHS.Utils && typeof AHS.Utils.getDailyQuote === "function") {
      var quoteEl = hero.querySelector(".hero-quote");
      if (quoteEl) { quoteEl.textContent = AHS.Utils.getDailyQuote(); }
    }

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
      AHS.AchievementBadges.create(),
      AHS.LearningTime.create()
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
