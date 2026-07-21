/* js/app-summary.js — bootstraps 總結中心 inside the shared AppShell.

   Sprint 6.6 Runtime QA Round 2 (WO-010, Issue #021): reads an optional
   ?materialId=... query param so links into a SPECIFIC material's
   Summary Detail (e.g. from HomeRecentMaterials.js's "已生成學習總結"
   badge) actually land on that material's summary, instead of always
   showing the undifferentiated full list. */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "summary",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    AHS.UI.mount(app, shell.root);

    var params = new URLSearchParams(window.location.search);
    var materialId = params.get("materialId") || null;

    shell.main.appendChild(AHS.SummaryCenter.create(undefined, materialId));
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
