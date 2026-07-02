/* components/TodayMission.js — 今日任務 (Today Mission) component.
   Shows 今日教材 / 今日考卷 / 今日完成率 (all Mock). PascalCase component
   under window.AHS. Self-contained Mock so no other file is modified. */
window.AHS = window.AHS || {};
AHS.TodayMission = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Mock data for this task (no API / backend). */
  var MOCK = {
    title: "今日任務",
    items: [
      { icon: "📘", label: "今日教材", value: "數學《三角函數》· 課本" },
      { icon: "📝", label: "今日考卷", value: "三角函數 隨堂測驗 · 4 題" }
    ],
    completion: { label: "今日完成率", percent: 40 }
  };

  function itemRow(item) {
    return el("li", { class: "today-card__item" }, [
      el("span", { class: "today-card__item-icon", "aria-hidden": "true", text: item.icon }),
      el("span", { class: "today-card__item-label", text: item.label }),
      el("span", { class: "today-card__item-value", text: item.value })
    ]);
  }

  /* create(model?) — model defaults to the embedded Mock. */
  function create(model) {
    var data = model || MOCK;
    var pct = Math.max(0, Math.min(100, data.completion.percent));

    return el("section", { class: "today-card", "aria-label": data.title }, [
      el("h2", { class: "today-card__title", text: data.title }),
      el("ul", { class: "today-card__list" }, data.items.map(itemRow)),
      el("div", { class: "today-card__progress" }, [
        el("div", { class: "today-card__progress-head" }, [
          el("span", { class: "today-card__item-label", text: data.completion.label }),
          el("span", { class: "today-card__progress-pct", text: pct + "%" })
        ]),
        el("div", {
          class: "today-card__progressbar",
          role: "progressbar",
          "aria-valuenow": String(pct),
          "aria-valuemin": "0",
          "aria-valuemax": "100"
        }, [
          el("div", { class: "today-card__progressfill", style: "width:" + pct + "%" })
        ])
      ])
    ]);
  }

  return { create: create };
})();
