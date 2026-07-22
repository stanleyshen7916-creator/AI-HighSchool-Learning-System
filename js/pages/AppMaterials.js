/* js/app-materials.js — bootstraps 教材中心 inside the shared AppShell.

   Sprint 6.6 Runtime QA Round 3 (WO-011, Issue #022): the shared Header
   search bar (js/components/AppShell.js's topbar) now forwards keystrokes
   into Material Center's existing, already-working search/filter
   pipeline via the setKeyword() hook — real-time, same matching rules
   (title/chapter/fileName/content/folder name) as Material Center's own
   in-page search bar, same Empty State on no matches. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    var materialCenterRoot = AHS.MaterialCenter.create();

    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "materials",
      onNavigate: function () { /* Mock navigation — prototype. */ },
      onGlobalSearch: function (keyword) {
        if (materialCenterRoot.setKeyword) { materialCenterRoot.setKeyword(keyword); }
      }
    });

    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(materialCenterRoot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
