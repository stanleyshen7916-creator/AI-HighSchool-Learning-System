/* components/HomeRecentMaterials.js — 最近教材 (Home Recent Materials).
   Shows 3~5 recent materials: 科目 / 單元名稱 / 學習進度 / 最後學習時間,
   each card is clickable (Mock Event). PascalCase component; self-contained Mock. */
window.AHS = window.AHS || {};
AHS.HomeRecentMaterials = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Mock data for this task (no API / backend). */
  var MOCK = {
    title: "最近教材",
    items: [
      { subject: "數學", unit: "三角函數", percent: 80, time: "今天" },
      { subject: "英文", unit: "文法", percent: 65, time: "昨天" },
      { subject: "物理", unit: "牛頓運動定律", percent: 45, time: "2 天前" },
      { subject: "化學", unit: "酸鹼鹽", percent: 30, time: "3 天前" }
    ]
  };

  function card(item, status) {
    var pct = Math.max(0, Math.min(100, item.percent));
    var btn = el("button", {
      type: "button",
      class: "recent-card",
      "data-subject": item.subject,
      "data-unit": item.unit
    }, [
      el("div", { class: "recent-card__top" }, [
        el("span", { class: "recent-card__subject", text: item.subject }),
        el("span", { class: "recent-card__time", text: item.time })
      ]),
      el("p", { class: "recent-card__unit", text: item.unit }),
      el("div", {
        class: "recent-card__progressbar",
        role: "progressbar",
        "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100"
      }, [
        el("div", { class: "recent-card__progressfill", style: "width:" + pct + "%" })
      ]),
      el("span", { class: "recent-card__pct", text: "學習進度 " + pct + "%" })
    ]);
    btn.addEventListener("click", function () {
      status.textContent = "（Mock）開啟教材：" + item.subject + "《" + item.unit + "》";
      status.removeAttribute("hidden");
    });
    return btn;
  }

  /* create(model?) — model defaults to the embedded Mock. */
  function create(model) {
    var data = model || MOCK;
    var status = el("p", {
      class: "recent-materials__status", "aria-live": "polite", hidden: "hidden"
    });
    var list = el("div", { class: "recent-materials__list" },
      data.items.map(function (item) { return card(item, status); }));

    return el("section", { class: "recent-materials", "aria-label": data.title }, [
      el("h2", { class: "recent-materials__title", text: data.title }),
      list,
      status
    ]);
  }

  return { create: create };
})();
