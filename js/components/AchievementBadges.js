/* components/AchievementBadges.js — 成就徽章 (Achievement Badges).
   Grid of gamified badges (icon + label + description). Duolingo-style
   reward surface. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.AchievementBadges = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

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
    /* EO-S7.0-003 Production Cleanup: Mock achievements removed. */
    var data = model;
    if (!data || !Array.isArray(data.items) || !data.items.length) {
      return AHS.EmptyState.create({
        title: "尚未獲得成就",
        hint: "持續完成學習任務，成就徽章會出現在這裡。",
        ariaLabel: "成就徽章"
      });
    }
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
