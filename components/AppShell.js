/* components/AppShell.js — shared application frame used by every page:
   top bar (logo + search + notifications + student), left sidebar (desktop),
   a main content slot, and the bottom navigation (mobile). PascalCase
   component under window.AHS. Depends on AHS.Icons + AHS.Mock.nav. */
window.AHS = window.AHS || {};
AHS.AppShell = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Pages that actually exist as standalone files. Nav items pointing here
     render as real links; the rest stay mock (single-page prototype). */
  var ROUTES = {
    home: "index.html",
    materials: "materials.html",
    quiz: "quiz.html",
    wrongbook: "wrongbook.html",
    summary: "summary.html",
    learning: "learning.html",
    tutor: "tutor.html"
  };

  function topbar(model) {
    var search = el("div", { class: "topbar__search" }, [
      el("span", { class: "topbar__search-icon", html: AHS.Icons.search() }),
      el("input", {
        class: "topbar__search-input",
        type: "search",
        placeholder: "搜尋教材、課程、題目…",
        "aria-label": "搜尋"
      }),
      el("kbd", { class: "topbar__search-kbd", text: "⌘K" })
    ]);

    return el("header", { class: "topbar" }, [
      el("a", { class: "topbar__brand", href: "index.html" }, [
        el("span", { class: "topbar__logo", html: AHS.Icons.book() }),
        el("span", { class: "topbar__brand-text" }, [
          el("strong", { text: "AI 高中學習系統" }),
          el("small", { text: "AI High School Learning System" })
        ])
      ]),
      search,
      el("div", { class: "topbar__tools" }, [
        el("button", {
          type: "button", class: "topbar__icon-btn",
          "aria-label": "通知", html: AHS.Icons.bell()
        }, [el("span", { class: "topbar__badge", text: "3" })]),
        el("button", {
          type: "button", class: "topbar__icon-btn",
          "aria-label": "訊息", html: AHS.Icons.chat()
        }),
        el("div", { class: "topbar__user" }, [
          el("span", {
            class: "topbar__avatar qiaoqiao-bust qiaoqiao-bust--sm",
            html: AHS.Qiaoqiao.bust("gentle")
          }),
          el("span", { class: "topbar__user-meta" }, [
            el("strong", { text: "同學你好！" }),
            el("small", { text: model.student.grade })
          ])
        ])
      ])
    ]);
  }

  function sidebar(nav, active, onNavigate) {
    var list = el("ul", { class: "sidebar__list" });
    nav.items.forEach(function (item) {
      var isActive = item.id === active;
      var route = ROUTES[item.id];
      var inner = [
        el("span", { class: "sidebar__icon", html: AHS.Icons[item.icon]() }),
        el("span", { class: "sidebar__label", text: item.label })
      ];
      var node;
      if (route && !isActive) {
        node = el("a", {
          class: "sidebar__item", href: route, "data-id": item.id
        }, inner);
      } else {
        node = el("button", {
          type: "button",
          class: "sidebar__item" + (isActive ? " is-active" : ""),
          "data-id": item.id,
          "aria-current": isActive ? "page" : null
        }, inner);
        node.addEventListener("click", function () { onNavigate(item); });
      }
      list.appendChild(el("li", {}, [node]));
    });

    return el("aside", { class: "sidebar", "aria-label": "主要導覽" }, [
      list,
      el("div", { class: "sidebar__foot" }, [
        el("button", {
          type: "button", class: "sidebar__item",
          html: AHS.Icons.settings()
        }, [el("span", { class: "sidebar__label", text: "設定" })]),
        el("button", {
          type: "button", class: "sidebar__item",
          html: AHS.Icons.logout()
        }, [el("span", { class: "sidebar__label", text: "登出" })])
      ])
    ]);
  }

  function bottomNav(nav, active, onNavigate) {
    var inner = el("div", { class: "bottom-nav__inner" });
    nav.bottomItems.forEach(function (item) {
      var isActive = item.id === active;
      var route = ROUTES[item.id];
      var content = [
        el("span", { class: "bottom-nav__icon", html: AHS.Icons[item.icon]() }),
        el("span", { class: "bottom-nav__label", text: item.label })
      ];
      var node;
      if (route && !isActive) {
        node = el("a", {
          class: "bottom-nav__item", href: route, "data-id": item.id
        }, content);
      } else {
        node = el("button", {
          type: "button",
          class: "bottom-nav__item" + (isActive ? " is-active" : ""),
          "data-id": item.id,
          "aria-current": isActive ? "page" : null
        }, content);
        node.addEventListener("click", function () { onNavigate(item); });
      }
      inner.appendChild(node);
    });
    return el("nav", {
      class: "bottom-nav", role: "navigation", "aria-label": "底部導覽"
    }, [inner]);
  }

  /* create(model, options)
     options.active — active nav id (defaults to model.nav.active).
     options.onNavigate(item) — mock navigation callback (optional).
     Returns { root, main } — caller mounts page content into `main`. */
  function create(model, options) {
    options = options || {};
    var onNavigate = options.onNavigate || function () {};
    var active = options.active || model.nav.active;
    var nav = model.nav;

    var main = el("main", { class: "shell__main", id: "shell-main" });

    var root = el("div", { class: "shell" }, [
      topbar(model),
      el("div", { class: "shell__body" }, [
        sidebar(nav, active, onNavigate),
        main
      ]),
      bottomNav(nav, active, onNavigate)
    ]);

    return { root: root, main: main };
  }

  return { create: create };
})();
