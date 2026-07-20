/* js/app.js — bootstraps the Home v1.0 page inside the shared AppShell.

   PMO Decision 025 · Architecture Evolution v2.0 (2026-07-20) Fix-002:
   Home now reads AHS.MaterialRuntime / AHS.SummaryRuntime at init time
   (both hydrated from AHS.PersistenceAdapter's sessionStorage by the
   time this script runs, since they're loaded earlier in index.html) to
   build real models for 最近教材 (Recent Material) / 學習統計
   (Statistics) / 繼續學習 (Recent Learning) — "Home 應於初始化時讀取
   Runtime Persistence，而不是依賴同一 JS Context". Home never touches
   sessionStorage or AHS.PersistenceAdapter directly — only each
   Runtime's own already-existing Public API (list()), keeping storage
   access centralized in the Adapter as required.

   Each buildXModel() below returns undefined (falling back to the
   existing AHS.Mock.* Developer Seed Data, unchanged) whenever there's
   no real data yet — never fabricates content to fill a gap. This
   preserves "維持目前 Repository 行為" for Mock Data (PMO Decision 025's
   Fix-003 note) while genuinely syncing real data once it exists. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function buildRecentMaterialsModel() {
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.list !== "function") {
      return { title: "最近教材", items: [] };
    }
    var items = AHS.MaterialRuntime.list();
    if (!items.length) { return { title: "最近教材", items: [] }; }

    var summarizedMaterialIds = {};
    if (AHS.SummaryRuntime && typeof AHS.SummaryRuntime.list === "function") {
      AHS.SummaryRuntime.list().forEach(function (s) {
        if (s.materialId) { summarizedMaterialIds[s.materialId] = true; }
      });
    }

    var sorted = items.slice().sort(function (a, b) { return (b.order || 0) - (a.order || 0); }).slice(0, 4);
    return {
      title: "最近教材",
      items: sorted.map(function (m) {
        return {
          id: m.id,
          subject: m.subject,
          unit: m.chapter,
          title: m.title,
          teacher: "", /* no real teacher field exists on MaterialRuntime records — left honestly empty, never fabricated */
          lastOpened: m.lastOpenedAt || m.date,
          progress: typeof m.progress === "number" ? m.progress : 0,
          hasSummary: !!summarizedMaterialIds[m.id]
        };
      })
    };
  }

  /* Sprint 6.6 · GitHub QA Fix (WO-001): 今日任務 has no Runtime anywhere
     in this repository (no Task/Mission Runtime was ever built, and
     building one now would be a new feature, out of scope). Always
     returns an explicit empty model — never AHS.Mock.todayTasks — so
     TodayMission.js's own existing Empty State ("今天沒有安排學習任務")
     renders honestly instead of Mock content. */
  function buildTodayMissionModel() {
    return { title: "今日任務", items: [] };
  }

  function buildStudyStatsModel() {
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.list !== "function") { return undefined; }
    var items = AHS.MaterialRuntime.list();
    if (!items.length) { return undefined; }

    var bySubject = {};
    var totalMinutes = 0;
    items.forEach(function (m) {
      var minutes = typeof m.learningTime === "number" ? m.learningTime : 0;
      totalMinutes += minutes;
      bySubject[m.subject] = (bySubject[m.subject] || 0) + minutes;
    });
    var bars = Object.keys(bySubject).map(function (subj) {
      return { subject: subj, hours: Math.round((bySubject[subj] / 60) * 10) / 10 };
    });
    if (!bars.length) { bars = [{ subject: items[0].subject, hours: 0 }]; }

    return {
      title: "學習統計",
      rangeLabel: "本次 Session",
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      deltaHours: 0, /* no historical baseline exists to compare against — honestly 0, never fabricated */
      bars: bars
    };
  }

  /* Sprint 6.6 · GitHub QA Fix (WO-001) 今日學習: real computation from
     AHS.MaterialRuntime — sums learningTime (minutes) for materials
     whose lastLearningAt falls on today's calendar date. Honestly 0
     whenever nothing has called MaterialRuntime.startLearning() yet
     (currently always, since no page wires that call — see Known
     Issues), never fabricated. */
  function buildTodayMinutesModel() {
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.list !== "function") { return { todayMinutes: 0 }; }
    var now = new Date();
    var minutes = 0;
    AHS.MaterialRuntime.list().forEach(function (m) {
      if (!m.lastLearningAt) { return; }
      var d = new Date(m.lastLearningAt);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
        minutes += (typeof m.learningTime === "number" ? m.learningTime : 0);
      }
    });
    return { todayMinutes: minutes };
  }

  function buildContinueLearningModel() {
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.list !== "function") { return {}; }
    var items = AHS.MaterialRuntime.list().filter(function (m) { return !!m.lastLearningAt; });
    if (!items.length) { return {}; } /* nothing has called startLearning() yet — honest empty, ContinueLearning.js shows "尚無學習紀錄" */

    var latest = items.sort(function (a, b) { return new Date(b.lastLearningAt) - new Date(a.lastLearningAt); })[0];
    var subj = AHS.Subjects[latest.subject];
    return {
      subject: subj ? subj.name : latest.subject,
      chapter: latest.chapter,
      lesson: latest.title,
      progress: latest.progress,
      materialId: latest.id
    };
  }

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
      AHS.HomeRecentMaterials.create(buildRecentMaterialsModel()),
      el("div", { class: "home__statsplan" }, [
        AHS.StudyStats.create(buildStudyStatsModel()),
        AHS.StudyPlan.create()
      ])
    ]);

    var rail = el("div", { class: "home__rail" }, [
      AHS.TodayMission.create(buildTodayMissionModel()),
      AHS.AiTutorHomeCard.create(),
      AHS.AchievementBadges.create(),
      AHS.LearningTime.create(buildTodayMinutesModel()),
      AHS.ContinueLearning.create(buildContinueLearningModel())
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
