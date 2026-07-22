/* js/components/ReviewWidget.js — Sprint 7.0 · EO-S7.0-003.
   首頁 Review Widget：今日待複習 / 已完成 / 總錯題 + Mastery Progress。
   資料 100% 來自 AHS.ReviewModel（唯讀查詢層）— 不直接讀取任何
   Session（EO 明定），每次 create 即時推導、永不儲存。 */
window.AHS = window.AHS || {};
AHS.ReviewWidget = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var MASTERY_LABELS = [
    { key: "new", label: "New" },
    { key: "learning", label: "Learning" },
    { key: "reviewing", label: "Reviewing" },
    { key: "mastered", label: "Mastered" }
  ];

  function stat(label, value) {
    return el("div", { class: "review-widget__stat" }, [
      el("strong", { class: "review-widget__value", text: String(value) }),
      el("span", { class: "review-widget__label", text: label })
    ]);
  }

  function create() {
    if (!AHS.ReviewModel) { return el("div", {}); }
    var progress = AHS.ReviewModel.getReviewProgress();
    var mastery = AHS.ReviewModel.getMasteryStatistics();
    var total = MASTERY_LABELS.reduce(function (s, m) { return s + mastery[m.key]; }, 0);

    var masteryRow = el("div", { class: "review-widget__mastery" },
      MASTERY_LABELS.map(function (m) {
        var pct = total > 0 ? Math.round((mastery[m.key] / total) * 100) : 0;
        return el("div", { class: "review-widget__mastery-item" }, [
          el("span", { class: "review-widget__mastery-label", text: m.label + " " + mastery[m.key] }),
          el("div", {
            class: "progressbar", role: "progressbar",
            "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100"
          }, [
            el("div", { class: "progressbar__fill review-widget__fill--" + m.key, style: "width:" + pct + "%" })
          ])
        ]);
      }));

    return el("section", { class: "card review-widget", "aria-label": "複習進度" }, [
      el("h2", { class: "card__title", text: "複習進度" }),
      el("div", { class: "review-widget__stats" }, [
        stat("今日待複習", progress.todayDue),
        stat("已完成", progress.completed),
        stat("總錯題", progress.totalWrong)
      ]),
      total > 0 ? masteryRow : el("p", { class: "review-widget__empty", text: "目前沒有錯題紀錄，完成練習後複習進度會顯示在這裡。" })
    ]);
  }

  return { create: create };
})();
