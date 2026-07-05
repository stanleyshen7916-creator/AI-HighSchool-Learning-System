/* js/app-tutor.js — bootstraps AI Tutor inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";
  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }
    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "tutor",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.AiTutor.create());
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
