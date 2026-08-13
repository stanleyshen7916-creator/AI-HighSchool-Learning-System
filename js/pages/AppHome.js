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

  /* Sprint AI-122 AI-122-06: parses MaterialRuntime's real createdAt
     field ("YYYY/MM/DD" for genuinely-new records — js/runtime/
     MaterialRuntime.js's own formatDate(); "YYYY-MM-DD" for the
     Repository track's real authored date — data/materials/*.js's own
     metadata.createdAt, now actually wired through by this Sprint's
     TeachingMaterialLoader.js fix). Both are valid Date constructor
     input; never throws — genuinely unparseable data is honestly
     excluded (null), not treated as "recent" by default. */
  function parseCreatedAt(str) {
    if (!str) { return null; }
    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  function buildRecentMaterialsModel() {
    var emptyModel = { title: "最近新增教材", items: [], emptyText: "目前近三日沒有新增教材" };
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.list !== "function") {
      return emptyModel;
    }
    var items = AHS.MaterialRuntime.list();
    if (!items.length) { return emptyModel; }

    var summarizedMaterialIds = {};
    if (AHS.SummaryRuntime && typeof AHS.SummaryRuntime.list === "function") {
      AHS.SummaryRuntime.list().forEach(function (s) {
        if (s.materialId) { summarizedMaterialIds[s.materialId] = true; }
      });
    }

    /* AI-122-06: 最近教材重新定義為「近三日新增教材」（CreatedAt >=
       Today -3 Days）— replaces the old "just show the newest 4,
       regardless of age" behavior, which duplicated 教材資料夾's own
       full material listing in a different sort order (AI-122-11). */
    var cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 3);

    var withDate = items
      .map(function (m) { return { m: m, createdAt: parseCreatedAt(m.createdAt) }; })
      .filter(function (x) { return x.createdAt && x.createdAt >= cutoff; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });

    if (!withDate.length) { return emptyModel; }

    return {
      title: "最近新增教材",
      items: withDate.map(function (x) {
        var m = x.m;
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

  /* Sprint AI-134（真實 PO 需求）："巧巧老師的小提醒可以與寵物飼養結合，
     進行每日飼養提醒" — 選了寵物之後，Hero Card 既有的巧巧老師提醒泡泡
     文字改為寵物飼養主題（AHS.PetRuntime.growth().hint，會隨真實教材
     完成度變化，不是固定文字）；尚未選寵物前保持 AppConfig 原本的通用
     提醒文字不變（誠實反映「還沒開始養」，不假裝已經有寵物內容）。 */
  function applyPetTip() {
    if (!AHS.PetRuntime || typeof AHS.PetRuntime.tipMessage !== "function") { return; }
    var msg = AHS.PetRuntime.tipMessage();
    if (!msg) { return; }
    AHS.AppConfig.hero.tipTitle = msg.title;
    AHS.AppConfig.hero.tip = msg.text;
  }

  function buildHome() {
    /* Sprint 1 · Task 001: 依系統時間更新問候文字，其餘 hero 內容不變。 */
    if (AHS.Utils && typeof AHS.Utils.getGreeting === "function") {
      AHS.AppConfig.hero.greeting = AHS.Utils.getGreeting();
    }
    applyPetTip();

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

    /* Sprint AI-134 續（真實 PO 回饋）："寵物可否不要獨立在一個項目"——
       直接把 AHS.PetWidget.create() 掛進 Hero Card 本身（.hero-card__pet
       插槽，見 js/components/HeroCard.js／PetWidget.js 標頭說明），不再
       是首頁另一個獨立 <section>。掛在 Hero 既有內容（body+figure）之
       後，讓 Hero 這張卡片本身往下長高，仍是同一張卡片。 */
    if (AHS.PetWidget) { hero.appendChild(AHS.PetWidget.create()); }

    var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

    /* Sprint AI-122 AI-122-08 (首頁資訊排序): PO's PAT mandates one
       explicit, literal top-to-bottom order — Hero→今日任務→學習成果
       總覽→最近新增教材→教材資料夾→AI Tutor — exactly 6 sections, no
       more. A two-column main/rail split (Sprint AI-118's own layout)
       can't honestly represent one single asserted sequence (今日任務
       used to sit in a side rail, visually parallel to 最近教材/學習
       成效總覽 rather than after them), so Home collapses to one single
       stacked column here, in this exact order.
       複習進度 (ReviewWidget, previously kept in the rail since Sprint
       7.0/AI-114) is intentionally NOT in the PO's 6-item list and is
       removed from Home this Sprint — its own 今日待複習 count already
       surfaces via 今日任務 (AHS.LearningStateRuntime.dailyTasks()
       prioritizes real Review items first) and its Mastery breakdown
       overlaps 學習成效總覽's own Knowledge Mastery/新增弱點/解除弱點
       KPIs (AI-122-11: 不得資訊重複). Not deleted from the codebase —
       same conservative "don't delete source files outside this
       Sprint's scope" precedent AI-118's own report already established
       for 學習統計/學習計畫/成就勳章/今日學習時間/繼續學習. Flagged in
       this Sprint's EO report as a judgment call for PO review.

       Sprint AI-134 判斷／衝突揭露: 上面這條規則明確寫死「exactly 6
       sections, no more」，而這個 Sprint 的真實 PO 需求是「目前的首頁
       可否增加一個飼養寵物的小遊戲」——本身就是要求在首頁新增內容。這裡
       選擇服從「目前這次、更新的 PO 指示」，因為新的明確指示晚於且優先
       於舊的一次性 PAT 鎖定；沒有回頭修改上面 AI-122-08 那段舊註解本身
       （保留原始決策紀錄），只在這裡誠實記錄「這次刻意打破了那條 6 個
       區塊的規則」，供之後 PO 覆核。續（PO 回饋「寵物不要獨立在一個項
       目」）：飼養寵物小遊戲最終沒有成為第 7 個獨立區塊，而是掛進上面
       hero 這張卡片本身（見上方 AHS.PetWidget.create() 呼叫），這裡的
       6 個區塊仍是原本那 6 個，沒有變動。 */
    var main = el("div", { class: "home__main" }, [
      hero,
      AHS.TodayMission.create(buildTodayMissionModel()),
      /* Sprint AI-121 AI-121-01/19: 學習成效總覽 — real Learning Outcome
         (Knowledge Mastery/Growth/Weakness), never reading completion. */
      (AHS.HomeKpiBoard ? AHS.HomeKpiBoard.create() : null),
      /* Sprint AI-122 AI-122-06: 最近教材重新定義為「近三日新增教材」
         （見 buildRecentMaterialsModel 本身的真實 CreatedAt 篩選）。 */
      AHS.HomeRecentMaterials.create(buildRecentMaterialsModel()),
      /* Sprint AI-120 AI-120-02/03 + AI-122-07: 教材資料夾 — 唯一教材
         入口，real Current-Workspace materials grouped by Subject
         (School/Semester already fixed by the Workspace itself), each
         linking straight into 學習總結/考前練習。 */
      (AHS.WorkspaceFolder ? AHS.WorkspaceFolder.create() : null),
      AHS.AiTutorHomeCard.create(buildAiTutorModel())
    ].filter(Boolean));

    return el("div", { class: "home" }, [main]);
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

  /* AI Supabase Persistence Root Cause Fix (Root Cause B): re-run the same,
     unmodified guardedInit() whenever a background Repository pull just
     merged fresh rows into a Runtime's Memory Cache (js/repository/
     RepositorySync.js's own header explains why this is necessary — the
     first render almost always happens before a real network pull
     resolves). guardedInit()/init() is idempotent (AHS.UI.mount() clears
     and rebuilds #app every call), so simply calling it again is enough —
     no Runtime Public API change, no UI file needs a Promise. */
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("ahs:repository-pulled", guardedInit);
  }
})();
