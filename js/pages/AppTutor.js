/* js/app-tutor.js — bootstraps AI Tutor inside the shared AppShell.

   Sprint AI-111 AI-612: AHS.AiTutor.create() previously always ran on
   the raw AHS.AppConfig.aiTutorPage Mock config with no real message
   appended anywhere. This now appends ONE real, Runtime-derived message
   (今日弱點/建議教材/建議重新測驗/推薦錯題/建議複習章節, via the shared
   AHS.TutorMessage.build() — the same real derivation 首頁's
   AiTutorHomeCard uses) to the END of the existing chat thread, reusing
   AiTutor.js's own unmodified bubble() rendering — no new UI, no new
   entry point ("不得重新設計 UI"/"不得新增功能入口"). The rest of the
   page (canned welcome messages, suggestion tiles, history, resources)
   is untouched; when there is genuinely no real learning data yet,
   nothing is appended and the page renders exactly as before. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function buildRealTutorMessage() {
    if (!AHS.StatisticsRuntime || typeof AHS.StatisticsRuntime.learningContext !== "function" ||
        !AHS.TutorMessage || typeof AHS.TutorMessage.build !== "function") { return null; }
    var built = AHS.TutorMessage.build(AHS.StatisticsRuntime.learningContext());
    return built ? { role: "assistant", time: "剛剛", text: built.message } : null;
  }

  function buildModel() {
    var base = AHS.AppConfig.aiTutorPage;
    if (!base) { return undefined; }
    var realMsg = buildRealTutorMessage();
    if (!realMsg) { return base; }
    var model = {};
    Object.keys(base).forEach(function (k) { model[k] = base[k]; });
    model.messages = (base.messages || []).concat([realMsg]);
    return model;
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    /* Bootstrap Repository content on a cold tutor.html-first visit too,
       same as index.html/quiz.html — so a real learningContext() can
       exist even without visiting materials.html first this session. */
    if (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.load === "function") {
      AHS.TeachingMaterialLoader.load();
    }

    var shell = AHS.AppShell.create(AHS.AppConfig, {
      active: "tutor",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.AiTutor.create(buildModel()));
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
