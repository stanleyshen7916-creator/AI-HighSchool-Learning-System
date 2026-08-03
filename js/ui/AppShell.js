/* components/AppShell.js — shared application frame used by every page:
   top bar (logo + search + notifications + student), left sidebar (desktop),
   a main content slot, and the bottom navigation (mobile). PascalCase
   component under window.AHS. Depends on AHS.Icons + AHS.AppConfig.nav. */
window.AHS = window.AHS || {};
AHS.AppShell = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* Pages that actually exist as standalone files. Nav items pointing here
     render as real links; the rest stay mock (single-page prototype). */
  var ROUTES = {
    home: "index.html",
    materials: "materials.html",
    quiz: "quiz.html",
    wrongbook: "wrongbook.html",
    summary: "summary.html",
    review: "review.html",
    learning: "learning.html",
    tutor: "tutor.html",
    dashboard: "dashboard.html"
  };

  /* ---- Notification menu (HOME-F009) ------------------------------------
     Extends the existing bell icon-button (already in topbar) with a
     real dropdown driven by AHS.AppConfig.notifications. Empty state reuses
     the project's existing shared empty-state style (.today-card__empty)
     — no new Empty UI is designed. */
  function notificationItem(n, onToggleRead) {
    var item = el("li", {
      class: "notif-menu__item" + (n.unread ? " is-unread" : ""),
      role: "menuitem"
    }, [
      el("p", { class: "notif-menu__title", text: n.title }),
      el("p", { class: "notif-menu__message", text: n.message }),
      el("span", { class: "notif-menu__time", text: n.time })
    ]);
    item.addEventListener("click", function () { onToggleRead(n.id, item); });
    return item;
  }

  function notificationPanel(notifications, onToggleRead) {
    var body = notifications.length
      ? el("ul", { class: "notif-menu__list" },
          notifications.map(function (n) { return notificationItem(n, onToggleRead); }))
      : el("p", { class: "today-card__empty", text: "尚無通知" });

    return el("div", { class: "notif-menu", role: "menu", "aria-label": "通知", hidden: "hidden" }, [
      el("div", { class: "notif-menu__head" }, [el("strong", { text: "通知" })]),
      body
    ]);
  }

  /* Sprint AI-113 AI-805: real logout — clears every AHS-namespaced
     sessionStorage key (the same clear() every Runtime's own reset()
     already uses) and returns to 首頁, a fresh first-open session. Not
     a fabricated auth system (this app has none) — for a
     sessionStorage-persisted static prototype, this genuinely IS what
     "logging out" means: end the current session's accumulated state. */
  function doLogout() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.clear === "function") {
      AHS.PersistenceAdapter.clear();
    }
    window.location.assign("index.html");
  }

  /* ---- Profile menu (HOME-F010) ------------------------------------------
     Extends the existing .topbar__user block with a dropdown. Guest
     fallback when AHS.AppConfig.user is missing — never throws. */
  function profilePanel(onAction) {
    var actions = [
      { id: "profile", label: "Profile" },
      { id: "settings", label: "Settings" },
      { id: "logout", label: "Logout" }
    ];
    var list = el("ul", { class: "profile-menu__list" });
    actions.forEach(function (a) {
      var btn = el("button", {
        type: "button", class: "profile-menu__item", role: "menuitem", text: a.label
      });
      btn.addEventListener("click", function () { onAction(a.id); });
      list.appendChild(el("li", {}, [btn]));
    });
    return el("div", { class: "profile-menu", role: "menu", "aria-label": "使用者選單", hidden: "hidden" }, [list]);
  }

  function topbar(model, onGlobalSearch, openSettings) {
    var searchInput = el("input", {
      class: "topbar__search-input",
      type: "search",
      placeholder: "搜尋教材、課程、題目…",
      "aria-label": "搜尋"
    });
    if (typeof onGlobalSearch === "function") {
      searchInput.addEventListener("input", function () {
        onGlobalSearch(searchInput.value);
      });
    }
    var search = el("div", { class: "topbar__search" }, [
      el("span", { class: "topbar__search-icon", html: AHS.Icons.search() }),
      searchInput,
      el("kbd", { class: "topbar__search-kbd", text: "⌘K" })
    ]);

    var notifications = (model && model.notifications) || [];
    var user = (model && model.user) || null; // Guest fallback below.

    var badge = el("span", { class: "topbar__badge" });
    function unreadCount() {
      var n = 0;
      notifications.forEach(function (item) { if (item.unread) { n += 1; } });
      return n;
    }
    function syncBadge() {
      var count = unreadCount();
      if (count > 0) {
        badge.textContent = String(count);
        badge.removeAttribute("hidden");
      } else {
        badge.setAttribute("hidden", "hidden");
      }
    }
    syncBadge();

    function closeMenus() {
      notifPanel.setAttribute("hidden", "hidden");
      profMenu.setAttribute("hidden", "hidden");
    }

    var notifPanel = notificationPanel(notifications, function (id, itemEl) {
      var target = notifications.filter(function (n) { return n.id === id; })[0];
      if (target && target.unread) {
        target.unread = false;
        itemEl.classList.remove("is-unread");
        syncBadge();
      }
    });

    var bellBtn = el("button", {
      type: "button", class: "topbar__icon-btn",
      "aria-label": "通知", "aria-haspopup": "true", html: AHS.Icons.bell()
    }, [badge]);
    bellBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var willOpen = notifPanel.hasAttribute("hidden");
      closeMenus();
      if (willOpen) { notifPanel.removeAttribute("hidden"); }
    });

    var profMenu = profilePanel(function (actionId) {
      /* Sprint AI-113 AI-805: Profile/Settings both open the real
         Settings panel (Profile section is its first section); Logout
         performs the real logout above. Previously (Sprint AI-107
         RC-01) these were Mock/no-op — this is the fix, not a redesign
         of the menu itself. */
      closeMenus();
      if (actionId === "logout") { doLogout(); return; }
      if (typeof openSettings === "function") { openSettings(); }
    });

    var userName = user && user.name ? user.name : "Guest";
    var userBtn = el("div", {
      class: "topbar__user", role: "button", tabindex: "0", "aria-haspopup": "true",
      "aria-label": userName
    }, [
      el("span", {
        class: "topbar__avatar qiaoqiao-bust qiaoqiao-bust--sm",
        html: AHS.Qiaoqiao.bust("gentle")
      }),
      el("span", { class: "topbar__user-meta" }, [
        el("strong", { text: userName }),
        el("small", { text: model.student.grade })
      ])
    ]);
    function toggleProfileMenu() {
      var willOpen = profMenu.hasAttribute("hidden");
      closeMenus();
      if (willOpen) { profMenu.removeAttribute("hidden"); }
    }
    userBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleProfileMenu();
    });
    userBtn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleProfileMenu();
      }
    });

    document.addEventListener("click", closeMenus);

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
        el("div", { class: "topbar__menu-slot" }, [bellBtn, notifPanel]),
        el("button", {
          type: "button", class: "topbar__icon-btn",
          "aria-label": "訊息", html: AHS.Icons.chat()
        }),
        el("div", { class: "topbar__menu-slot" }, [userBtn, profMenu])
      ])
    ]);
  }

  function sidebar(nav, active, onNavigate, openSettings) {
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

    /* Sprint AI-113 AI-804/AI-805: both real now (previously no click
       handler at all — a true Stub, not just Mock-labeled). */
    var settingsBtn = el("button", { type: "button", class: "sidebar__item" }, [
      el("span", { class: "sidebar__icon", html: AHS.Icons.settings() }),
      el("span", { class: "sidebar__label", text: "設定" })
    ]);
    settingsBtn.addEventListener("click", function () {
      if (typeof openSettings === "function") { openSettings(); }
    });
    var logoutBtn = el("button", { type: "button", class: "sidebar__item" }, [
      el("span", { class: "sidebar__icon", html: AHS.Icons.logout() }),
      el("span", { class: "sidebar__label", text: "登出" })
    ]);
    logoutBtn.addEventListener("click", doLogout);

    return el("aside", { class: "sidebar", "aria-label": "主要導覽" }, [
      list,
      el("div", { class: "sidebar__foot" }, [
        settingsBtn,
        logoutBtn
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
     options.onGlobalSearch(keyword) — Sprint 6.6 Runtime QA Round 3
       (WO-011): fires on every keystroke in the topbar search input.
       Optional; every page that doesn't pass it keeps the exact same
       (previously non-functional) input, unaffected by this change.
     Returns { root, main } — caller mounts page content into `main`. */
  function create(model, options) {
    options = options || {};
    var onNavigate = options.onNavigate || function () {};
    var active = options.active || model.nav.active;
    var nav = model.nav;

    var main = el("main", { class: "shell__main", id: "shell-main" });

    /* Sprint AI-113 AI-804: one real Settings panel per page, same
       instance the Sidebar's 設定 button and the Profile menu's
       Settings/Profile items both open — single source, not two
       separately-built panels. Degrades to a no-op opener if
       AHS.SettingsRuntime/AHS.SettingsPanel aren't loaded on a given
       page (defensive, same "never throw at load time" discipline as
       the rest of this file). */
    var settingsPanel = (AHS.SettingsPanel && typeof AHS.SettingsPanel.create === "function" &&
      AHS.SettingsRuntime) ? AHS.SettingsPanel.create() : null;
    var openSettings = settingsPanel ? settingsPanel.open : function () {};

    var root = el("div", { class: "shell" }, [
      topbar(model, options.onGlobalSearch, openSettings),
      el("div", { class: "shell__body" }, [
        sidebar(nav, active, onNavigate, openSettings),
        main
      ]),
      bottomNav(nav, active, onNavigate),
      settingsPanel ? settingsPanel.root : null
    ].filter(Boolean));

    return { root: root, main: main };
  }

  return { create: create };
})();
