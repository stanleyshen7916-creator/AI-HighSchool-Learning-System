/* components/AchievementBadges.js — 成就徽章 (Achievement Badges).
   Grid of gamified badges (icon + label + description). Duolingo-style
   reward surface. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AchievementBadges = (function () {
  "use strict";
  var el = AHS.UI.el;

  var TONE = {
    gold: "#f2b705",
    brand: "#7c5cff",
    physics: "#f59e0b",
    chemistry: "#3b82f6",
    history: "#ef4444",
    english: "#22b573"
  };

  function badge(item) {
    var color = TONE[item.tone] || TONE.brand;
    return el("div", { class: "badge-item" }, [
      el("span", {
        class: "badge-item__icon",
        style: "color:" + color + ";background-color:" + color + "1a",
        html: AHS.Icons[item.icon]()
      }),
      el("span", { class: "badge-item__label", text: item.label }),
      el("span", { class: "badge-item__desc", text: item.desc })
    ]);
  }

  function create(model) {
    var data = model || AHS.Mock.achievements;
    return el("section", { class: "card badges-card", "aria-label": data.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: data.title }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      el("div", { class: "badges-card__grid" }, data.items.map(badge))
    ]);
  }

  return { create: create };
})();
