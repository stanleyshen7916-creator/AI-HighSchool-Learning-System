/* js/app-materials.js — bootstraps 教材中心 inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "materials",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });

    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.MaterialCenter.create());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
