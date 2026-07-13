/* js/app-quiz.js — bootstraps 測驗中心 inside the shared AppShell. */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    /* WO-Q001/Q003: QuestionRuntime and ExamRuntime start empty until
       init() seeds them. QuestionBank is stateless and needs no init
       of its own — it always reads live from QuestionRuntime. Order
       matters: ExamRuntime.init() draws its Seed Exams' questionIds
       via QuestionBank, which requires QuestionRuntime to be seeded
       first. */
    AHS.QuestionRuntime.init();
    AHS.ExamRuntime.init();

    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "quiz",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });

    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(AHS.QuizCenter.create());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
