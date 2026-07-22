/* components/MaterialCategoryTabs.js — Material Center · RC-002.
   Top category tabs that CONTROL the grouped layout: 全部分類 / 課本 /
   講義 / 考卷 / 筆記 / 補充資料 / 影片 / 其他. Selecting a category shows
   only that category's Group; 全部分類 shows every Group. Exclusive
   active state, horizontally scrollable. Reuses the existing
   .mat-subject-tabs styling so no new Design Token is introduced.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialCategoryTabs = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var TABS = [
    { id: "all", label: "全部分類" },
    { id: "課本", label: "課本" },
    { id: "講義", label: "講義" },
    { id: "考卷", label: "考卷" },
    { id: "筆記", label: "筆記" },
    { id: "補充資料", label: "補充資料" },
    { id: "影片", label: "影片" },
    { id: "其他", label: "其他" }
  ];

  /* create(onPick) — onPick(categoryId) fires on tab click. Returns the
     root with a resetToAll() helper for the unified reset flow. */
  function create(onPick) {
    var buttons = [];

    function activate(btn) {
      buttons.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
    }

    function makeTab(tab, index) {
      var btn = el("button", {
        type: "button",
        class: "mat-subject-tabs__item" + (index === 0 ? " is-active" : ""),
        "data-category-id": tab.id,
        text: tab.label
      });
      btn.addEventListener("click", function () {
        activate(btn);
        if (typeof onPick === "function") { onPick(tab.id); }
      });
      buttons.push(btn);
      return btn;
    }

    var list = el("div", {
      class: "mat-subject-tabs__list", role: "tablist", "aria-label": "教材分類切換"
    }, TABS.map(function (tab, i) { return makeTab(tab, i); }));

    var root = el("div", { class: "mat-subject-tabs mat-category-tabs" }, [list]);

    root.resetToAll = function () { activate(buttons[0]); };

    return root;
  }

  return { create: create };
})();
