/* js/components/MaterialCompletionOverview.js — Sprint AI-118 AI-118-02/
   AI-118-10 「教材完成度」— Home's own real completion overview, folded
   in from 我的學習 (learning.html)'s 科目進度 section rather than left
   as a second, home-only computation. Reads AHS.StatisticsRuntime.
   subjectAnalytics() only (the same Single Source js/components/
   MyLearning.js's own progress() already reads — no second definition,
   no Runtime touched). PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialCompletionOverview = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function computeSubjectProgress() {
    var analytics = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.subjectAnalytics === "function")
      ? AHS.StatisticsRuntime.subjectAnalytics() : [];
    return analytics.map(function (a) {
      var status = a.materialCompletionRate >= 100 ? "已完成" : a.materialCompletionRate > 0 ? "進行中" : "尚未開始";
      return { subject: a.subject, percent: a.materialCompletionRate, status: status };
    });
  }

  function create() {
    var items = computeSubjectProgress();

    var body = items.length
      ? el("div", { class: "home-completion__grid" },
          items.map(function (it) {
            var subj = AHS.Subjects[it.subject] || { name: it.subject, hex: "#6b7280" };
            return el("div", { class: "home-completion__item" }, [
              el("div", { class: "home-completion__top" }, [
                el("span", { class: "home-completion__dot", style: "background-color:" + subj.hex }),
                el("span", { class: "home-completion__name", text: subj.name }),
                el("span", { class: "home-completion__pct", text: it.percent + "%" })
              ]),
              el("div", { class: "progressbar" }, [
                el("div", { class: "progressbar__fill",
                  style: "width:" + it.percent + "%;background-color:" + subj.hex })
              ]),
              el("span", { class: "home-completion__status", text: it.status })
            ]);
          }))
      : el("p", { class: "home-completion__empty", text: "尚無教材，無法顯示教材完成度。" });

    return el("section", { class: "card home-completion", "aria-label": "教材完成度" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "教材完成度" })
      ]),
      body
    ]);
  }

  return { create: create };
})();
