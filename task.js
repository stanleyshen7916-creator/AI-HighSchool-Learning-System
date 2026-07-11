/* js/app-wrongbook.js — bootstraps 錯題本 inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "wrongbook",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });

    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.WrongBook.create());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
