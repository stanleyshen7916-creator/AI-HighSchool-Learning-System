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
   existing AHS.AppConfig.* Developer Seed Data, unchanged) whenever there's
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
          grade: m.grade,
          unit: m.chapter,
          title: m.title,
          teacher: "", /* no real teacher field exists on MaterialRuntime records — left honestly empty, never fabricated */
          lastOpened: m.lastOpenedAt || m.date,
          progress: typeof m.progress === "number" ? m.progress : 0,
          hasSummary: !!summarizedMaterialIds[m.id],
          /* Sprint 6.6 Runtime QA Round 2 (WO-008, Issue #016): the live
             File object reference (in-memory only — never persisted,
             see js/runtime/MaterialRuntime.js's own hydrate()/persist()
             comments) so 開啟/下載 can be genuinely functional when
             available, and cleanly disabled (not a fake Mock message)
             when it isn't (e.g. after a page reload that lost it). */
          file: m.file || null,
          fileName: m.fileName || m.title
        };
      })
    };
  }

  /* Sprint AI-114 AI-903 Daily Task Engine: 今日任務 now has a real
     source — AHS.LearningStateRuntime.dailyTasks() (this Sprint's own
     new function), built from real Review/WrongBook/Material signals,
     recomputed on every page load (never cached, so "每日重新計算" is
     automatically true — there is no stored state to go stale). Still
     renders TodayMission.js's own existing Empty State honestly when
     genuinely nothing is due (a session with zero materials and zero
     wrong items) — never a fabricated task. */
  function buildTodayMissionModel() {
    var items = (AHS.LearningStateRuntime && typeof AHS.LearningStateRuntime.dailyTasks === "function")
      ? AHS.LearningStateRuntime.dailyTasks(4) : [];
    return { title: "今日任務", items: items };
  }

  /* Sprint AI-111 AI-611/AI-612: AiTutorHomeCard.create(model) already
     had a real-data path (see that file's own header — "requires a real
     model... with none supplied it shows the mandated Empty State") that
     was simply never fed one. AHS.StatisticsRuntime.learningContext()
     (additive, Sprint AI-111) reads live WrongBookRuntime/HistoryRuntime;
     AHS.TutorMessage.build() (new stateless util, shared verbatim with
     tutor.html's own real chat message) turns that into real sentences.
     Returns undefined (renders the existing Empty State) when there is
     genuinely no real learning data yet — never fabricated. */
  function buildAiTutorModel() {
    /* Sprint AI-113 AI-804: real Settings > Learning > "顯示 AI 巧巧老師
       建議卡片" toggle. Off means the same honest Empty State the card
       already shows when there's no real data — never a different,
       second behavior invented for "hidden". */
    if (AHS.SettingsRuntime && typeof AHS.SettingsRuntime.get === "function" &&
        AHS.SettingsRuntime.get().showTutorSuggestions === false) { return undefined; }
    if (!AHS.StatisticsRuntime || typeof AHS.StatisticsRuntime.learningContext !== "function" ||
        !AHS.TutorMessage || typeof AHS.TutorMessage.build !== "function") { return undefined; }
    var built = AHS.TutorMessage.build(AHS.StatisticsRuntime.learningContext(), { page: "home" });
    return built || undefined;
  }

  function buildHome() {
    /* Sprint 1 · Task 001: 依系統時間更新問候文字，其餘 hero 內容不變。 */
    if (AHS.Utils && typeof AHS.Utils.getGreeting === "function") {
      AHS.AppConfig.hero.greeting = AHS.Utils.getGreeting();
    }

    var hero = AHS.HeroCard.create(AHS.AppConfig, {
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

    var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

    /* Sprint AI-118 AI-118-10 · Home 重新整理: "今天要做什麼" — exactly 5
       content widgets, no duplicate info/stats/materials. Main column:
       hero (page chrome/greeting, not a content widget — kept), 最近教材,
       教材完成度 (folded in from 我的學習's 科目進度, AI-118-02). Right
       rail: 今日任務, 待複習 (ReviewWidget, unchanged name/source), AI
       Tutor. Removed from Home this Sprint: 學習統計/學習計畫/成就勳章/
       今日學習時間/繼續學習 — each either duplicated 最近教材/今日任務's
       own information in a different framing, or (成就勳章) was already
       an Empty-State-only stub. Not deleted from the codebase (still
       real files, still loaded on no other page than the one that used
       them) — a conservative choice per the Sprint AI-118 report, since
       deleting source files is outside "僅重構：使用流程/Navigation/UX/
       Page Responsibility/CTA" scope. */
    var main = el("div", { class: "home__main" }, [
      hero,
      AHS.HomeRecentMaterials.create(buildRecentMaterialsModel()),
      /* Sprint AI-121 AI-121-01/19: 教材完成度 (reading-progress-driven)
         retired as a Home KPI — replaced by 學習成效總覽, driven by real
         Learning Outcome (Knowledge Mastery/Growth/Weakness), never
         reading completion. AHS.MaterialCompletionOverview.js itself is
         kept as a real, unused-on-Home file (same conservative "don't
         delete source files outside this Sprint's scope" precedent
         AI-118's own report already established), still loaded above in
         case a future Sprint restores it elsewhere. */
      (AHS.HomeKpiBoard ? AHS.HomeKpiBoard.create() : null),
      /* Sprint AI-120 AI-120-02/03: 教材資料夾 — real Current-Workspace
         materials grouped by Subject (School/Semester already fixed by
         the Workspace itself), each linking straight into 學習總結/
         考前練習. */
      (AHS.WorkspaceFolder ? AHS.WorkspaceFolder.create() : null)
    ].filter(Boolean));

    var rail = el("div", { class: "home__rail" }, [
      AHS.TodayMission.create(buildTodayMissionModel()),
      /* EO-S7.0-003 · Review Widget：今日待複習/已完成/總錯題/Mastery
         Progress，資料全部來自 AHS.ReviewModel（唯讀查詢層）。 */
      (AHS.ReviewWidget ? AHS.ReviewWidget.create() : null),
      AHS.AiTutorHomeCard.create(buildAiTutorModel())
    ].filter(Boolean));

    return el("div", { class: "home" }, [main, rail]);
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    /* HOTFIX-001 Repository Loader Integration: load Repository content
       into MaterialRuntime before buildHome() reads it. */
    if (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.load === "function") {
      AHS.TeachingMaterialLoader.load();
    }

    var shell = AHS.AppShell.create(AHS.AppConfig, {
      onNavigate: function () { /* Mock navigation — single-page prototype. */ }
    });

    if (!shell) { return; } /* Sprint AI-119: not logged in — AppShell already redirected to login.html */
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(buildHome());
  }

  function coreReady() {
    return !!(window.AHS && AHS.UI && typeof AHS.UI.el === "function" &&
              AHS.AppShell && typeof AHS.AppShell.create === "function");
  }

  /* EO-S7.0-HOTFIX-001 · Initialization Order gate: Browser -> window.AHS
     -> Core Runtime -> AppShell -> Page Runtime -> Component -> Render.
     Components are never created before AppShell's dependencies exist.
     On core-load failure (e.g. a 404'd script), show a diagnostic
     instead of a white page. */
  function guardedInit() {
    if (coreReady()) { init(); return; }
    var app = document.getElementById("app");
    if (app) {
      app.textContent = "系統資源載入失敗（js/core/UI.js 或 AppShell 未載入）。請重新整理；若持續發生，請回報 PMO 檢查部署檔案。";
    }
    if (window.console && console.warn) {
      console.warn("AHS core not ready — component mount aborted (EO-S7.0-HOTFIX-001 gate).");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardedInit);
  } else {
    guardedInit();
  }
})();
