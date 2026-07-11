/* components/HomeBottomNavigation.js — 底部導覽 (Home Bottom Navigation).
   Five items: Home / 教材 / 考卷 / 錯題本 / 我的. Shows Active state and
   switches Active on click (Mock Event). PascalCase component; self-contained. */
window.AHS = window.AHS || {};
AHS.HomeBottomNavigation = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Mock nav model (no routing yet — Active switch is Mock). */
  var MOCK = {
    active: "home",
    items: [
      { id: "home", label: "Home", icon: "🏠" },
      { id: "materials", label: "教材", icon: "📚" },
      { id: "papers", label: "考卷", icon: "📝" },
      { id: "wrongbook", label: "錯題本", icon: "❗" },
      { id: "me", label: "我的", icon: "👤" }
    ]
  };

  /* create(model?) — model defaults to the embedded Mock. */
  function create(model) {
    var data = model || MOCK;
    var inner = el("div", { class: "bottom-nav__inner" });
    var buttons = [];

    data.items.forEach(function (item) {
      var isActive = item.id === data.active;
      var btn = el("button", {
        type: "button",
        class: "bottom-nav__item" + (isActive ? " is-active" : ""),
        "data-id": item.id,
        "aria-current": isActive ? "page" : null
      }, [
        el("span", { class: "bottom-nav__icon", "aria-hidden": "true", text: item.icon }),
        el("span", { class: "bottom-nav__label", text: item.label })
      ]);
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("is-active");
          b.removeAttribute("aria-current");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-current", "page");
      });
      buttons.push(btn);
      inner.appendChild(btn);
    });

    return el("nav", {
      class: "bottom-nav", role: "navigation", "aria-label": "底部導覽"
    }, [inner]);
  }

  return { create: create };
})();
