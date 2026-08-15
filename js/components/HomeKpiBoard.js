/* js/components/HomeKpiBoard.js — Sprint AI-121 (Learning Knowledge
   Engine) AI-121-01/19: Home KPI redefinition. Replaces the retired
   教材完成度 (Material Completion) widget — 平台從 Learning Progress
   （教材完成度／閱讀進度）轉為 Learning Outcome（Knowledge Mastery）.

   Exactly the 8 real KPIs the Sprint names: 未完成追蹤事項／今日答題
   正確率／本週答題正確率／Knowledge Mastery／Knowledge Growth／今日
   新增弱點／今日解除弱點／AI Tutor 建議. Reads ONLY
   AHS.StatisticsRuntime.homeKpis() (this Sprint's own single real
   aggregation point, itself reading only already-real Runtimes) — no
   second Statistics source, no Runtime touched directly here. Every
   card shows an honest "尚無資料" placeholder instead of a fabricated
   0/percentage when its own real signal genuinely doesn't exist yet
   (null, not coerced to 0). */
window.AHS = window.AHS || {};
AHS.HomeKpiBoard = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function formatPercent(v) {
    return typeof v === "number" ? v + "%" : "尚無資料";
  }

  function formatDelta(v) {
    if (typeof v !== "number") { return "尚無資料"; }
    if (v > 0) { return "+" + v + "%"; }
    if (v < 0) { return v + "%"; }
    return "持平";
  }

  function kpiCard(key, label, value, tone, sub) {
    return el("div", {
      class: "home-kpi__item" + (tone ? " home-kpi__item--" + tone : ""), "data-kpi": key
    }, [
      el("span", { class: "home-kpi__label", text: label }),
      el("strong", { class: "home-kpi__value", text: value }),
      sub ? el("span", { class: "home-kpi__sub", text: sub }) : null
    ].filter(Boolean));
  }

  /* create() — reads AHS.StatisticsRuntime.homeKpis() itself (matching
     every other Home widget's own convention of pulling its real data
     at create() time). AHS.AiTutorHomeCard remains the full AI Tutor
     card elsewhere on Home — this card is only a compact KPI pointer to
     "is there a real suggestion right now", not a second Tutor message
     surface. */
  function create() {
    var kpis = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.homeKpis === "function")
      ? AHS.StatisticsRuntime.homeKpis() : null;
    if (!kpis) { return null; }

    var hasTutorSuggestion = !!(AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.learningContext === "function" &&
      AHS.TutorMessage && typeof AHS.TutorMessage.build === "function" &&
      AHS.TutorMessage.build(AHS.StatisticsRuntime.learningContext(), { page: "home" }));

    /* Sprint AI-141（PO 回報）: 同 Sprint AI-138 的 showTutorSuggestions
       開關（AI Tutor 尚未串接真實 API）——這張 KPI 卡本身就是「有沒有新的
       AI Tutor 建議」的指標，開關關閉時沒有理由還留著，直接從 8 張縮成
       7 張，而不是留一張永遠顯示「尚無建議」的空卡。 */
    var showTutor = !(AHS.SettingsRuntime && typeof AHS.SettingsRuntime.get === "function" &&
      AHS.SettingsRuntime.get().showTutorSuggestions === false);

    var growthTone = typeof kpis.knowledgeGrowthToday === "number"
      ? (kpis.knowledgeGrowthToday > 0 ? "up" : kpis.knowledgeGrowthToday < 0 ? "down" : null)
      : null;

    var growthSub = kpis.topGrowthPoint
      ? "今日進步最多：" + kpis.topGrowthPoint.knowledgePoint
      : null;

    var grid = el("div", { class: "home-kpi__grid" }, [
      kpiCard("outstandingTasks", "未完成追蹤事項", String(kpis.outstandingTasks), kpis.outstandingTasks > 0 ? "warn" : null),
      kpiCard("accuracyToday", "今日答題正確率", formatPercent(kpis.accuracyToday)),
      kpiCard("accuracyThisWeek", "本週答題正確率", formatPercent(kpis.accuracyThisWeek)),
      kpiCard("knowledgeMastery", "Knowledge Mastery", formatPercent(kpis.knowledgeMasteryAvg)),
      kpiCard("knowledgeGrowth", "Knowledge Growth", formatDelta(kpis.knowledgeGrowthToday), growthTone, growthSub),
      kpiCard("newWeaknesses", "今日新增弱點", String(kpis.newWeaknessesToday), kpis.newWeaknessesToday > 0 ? "warn" : null),
      kpiCard("resolvedWeaknesses", "今日解除弱點", String(kpis.resolvedWeaknessesToday), kpis.resolvedWeaknessesToday > 0 ? "up" : null),
      showTutor ? kpiCard("tutorSuggestion", "AI Tutor 建議", hasTutorSuggestion ? "有新建議" : "尚無建議", hasTutorSuggestion ? "up" : null) : null
    ].filter(Boolean));

    return el("section", { class: "card home-kpi", "aria-label": "學習成效總覽" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "學習成效總覽" })
      ]),
      grid
    ]);
  }

  return { create: create };
})();
