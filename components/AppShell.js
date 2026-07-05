/* components/AppShell.js — shared application frame used by every page:
   top bar (logo + search + notifications + student), left sidebar (desktop),
   a main content slot, and the bottom navigation (mobile). PascalCase
   component under window.AHS. Depends on AHS.Icons + AHS.Mock.nav. */
window.AHS = window.AHS || {};
AHS.AppShell = (function () {
  "use strict";
  var el = AHS.UI.el;

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

  function sidebar(nav, onNavigate) {
    var list = el("ul", { class: "sidebar__list" });
    nav.items.forEach(function (item) {
      var isActive = item.id === nav.active;
      var btn = el("button", {
        type: "button",
        class: "sidebar__item" + (isActive ? " is-active" : ""),
        "data-id": item.id,
        "aria-current": isActive ? "page" : null
      }, [
        el("span", { class: "sidebar__icon", html: AHS.Icons[item.icon]() }),
        el("span", { class: "sidebar__label", text: item.label })
      ]);
      btn.addEventListener("click", function () { onNavigate(item); });
      list.appendChild(el("li", {}, [btn]));
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

  function bottomNav(nav, onNavigate) {
    var inner = el("div", { class: "bottom-nav__inner" });
    var buttons = [];
    nav.bottomItems.forEach(function (item) {
      var isActive = item.id === nav.active;
      var btn = el("button", {
        type: "button",
        class: "bottom-nav__item" + (isActive ? " is-active" : ""),
        "data-id": item.id,
        "aria-current": isActive ? "page" : null
      }, [
        el("span", { class: "bottom-nav__icon", html: AHS.Icons[item.icon]() }),
        el("span", { class: "bottom-nav__label", text: item.label })
      ]);
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("is-active");
          b.removeAttribute("aria-current");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-current", "page");
        onNavigate(item);
      });
      buttons.push(btn);
      inner.appendChild(btn);
    });
    return el("nav", {
      class: "bottom-nav", role: "navigation", "aria-label": "底部導覽"
    }, [inner]);
  }

  /* create(model, options)
     options.onNavigate(item) — mock navigation callback (optional).
     Returns { root, main } — caller mounts page content into `main`. */
  function create(model, options) {
    options = options || {};
    var onNavigate = options.onNavigate || function () {};
    var nav = model.nav;

    var main = el("main", { class: "shell__main", id: "shell-main" });

    var root = el("div", { class: "shell" }, [
      topbar(model),
      el("div", { class: "shell__body" }, [
        sidebar(nav, onNavigate),
        main
      ]),
      bottomNav(nav, onNavigate)
    ]);

    return { root: root, main: main };
  }

  return { create: create };
})();
