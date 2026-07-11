/* components/StudyStats.js — 學習統計 (Study Stats).
   Total study hours + week delta + a per-subject bar chart (pure CSS bars,
   no external chart lib). PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.StudyStats = (function () {
  "use strict";
  var el = AHS.UI.el;

  function create(model) {
    var data = model || AHS.Mock.studyStats;
    var max = data.bars.reduce(function (m, b) {
      return Math.max(m, b.hours);
    }, 0) || 1;

    var bars = el("div", { class: "stats-card__chart" },
      data.bars.map(function (b) {
        var subj = AHS.Subjects[b.subject];
        var h = Math.round((b.hours / max) * 100);
        return el("div", { class: "stats-card__bar-col" }, [
          el("span", { class: "stats-card__bar-val", text: b.hours + "h" }),
          el("div", { class: "stats-card__bar-track" }, [
            el("div", {
              class: "stats-card__bar-fill",
              style: "height:" + h + "%;background-color:" + subj.hex,
              role: "img",
              "aria-label": subj.name + " " + b.hours + " 小時"
            })
          ]),
          el("span", { class: "stats-card__bar-label", text: subj.name })
        ]);
      }));

    var delta = data.deltaHours >= 0
      ? "較上週 +" + data.deltaHours + " 小時"
      : "較上週 " + data.deltaHours + " 小時";

    return el("section", { class: "card stats-card", "aria-label": data.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: data.title }),
        el("span", { class: "stats-card__range", text: data.rangeLabel })
      ]),
      el("div", { class: "stats-card__total" }, [
        el("span", { class: "stats-card__total-icon", html: AHS.Icons.clock() }),
        el("div", {}, [
          el("span", { class: "stats-card__total-label", text: "學習總時數" }),
          el("strong", { class: "stats-card__total-num" }, [
            el("span", { text: String(data.totalHours) }),
            el("small", { text: " 小時" })
          ]),
          el("span", { class: "stats-card__total-delta", text: delta })
        ])
      ]),
      el("p", { class: "stats-card__caption", text: "各科學習時數" }),
      bars
    ]);
  }

  return { create: create };
})();
