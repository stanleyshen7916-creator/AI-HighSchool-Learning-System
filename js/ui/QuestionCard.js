/* components/QuestionCard.js — Sprint 4 · Quiz Runtime Foundation.
   Renders a single question (stem + 4 options) for the exam-taking
   view. Pure render: takes a question record (as produced by
   AHS.QuestionBank / AHS.QuestionRuntime) plus the currently-saved
   answer key, and an onSelect(key) callback — it never talks to any
   Runtime directly. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionCard = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* HOTFIX-004 Issue 002: 難度 for a Repository-sourced question never
     survived into QuestionRuntime's own stored shape (js/runtime/
     TeachingMaterialLoader.js is explicitly protected this Hotfix, so
     that can't be fixed at the source this time) — resolved here
     instead via the same real Repository record, matched by the
     question's own real id (js/ui/MaterialDetailRepositorySource.js,
     already built for Material Detail, reused read-only). question.
     knowledgePoint, by contrast, IS already present directly (Loader
     already carries it) — never overridden. Returns "" (not fabricated)
     when unresolvable, exactly like every other honest-gap field here. */
  function resolveDifficulty(question) {
    if (question.difficulty) { return question.difficulty; }
    if (!question.materialId || !AHS.MaterialDetailRepositorySource ||
        typeof AHS.MaterialDetailRepositorySource.resolve !== "function") { return ""; }
    var repo = AHS.MaterialDetailRepositorySource.resolve(question.materialId);
    if (!repo || !repo.quiz || !Array.isArray(repo.quiz.questions)) { return ""; }
    var match = repo.quiz.questions.filter(function (q) { return q.id === question.id; })[0];
    return match ? (match.difficulty || "") : "";
  }

  /* create(question, selectedKey, onSelect) */
  function create(question, selectedKey, onSelect) {
    var subj = AHS.Subjects[question.subject];
    var difficulty = resolveDifficulty(question);
    var metaBits = [];
    if (difficulty) { metaBits.push("難度：" + difficulty); }
    if (question.knowledgePoint) { metaBits.push("考點：" + question.knowledgePoint); }

    var optionButtons = question.options.map(function (opt) {
      var isSelected = selectedKey === opt.key;
      var btn = el("button", {
        type: "button",
        class: "qcard-option" + (isSelected ? " is-selected" : ""),
        "aria-pressed": isSelected ? "true" : "false",
        "data-key": opt.key
      }, [
        el("span", { class: "qcard-option__key", text: opt.key }),
        el("span", { class: "qcard-option__text", text: opt.text })
      ]);
      btn.addEventListener("click", function () {
        if (typeof onSelect === "function") { onSelect(opt.key); }
      });
      return btn;
    });

    return el("section", { class: "card qcard", "aria-label": "第 " + question.index + " 題" }, [
      el("div", { class: "qcard__head" }, [
        el("span", {
          class: "qcard__badge",
          style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a",
          text: subj.name
        }),
        el("span", { class: "qcard__index", text: "第 " + question.index + " 題" }),
        el("span", { class: "qcard__type", text: question.type })
      ]),
      el("h2", { class: "qcard__text", text: question.text }),
      metaBits.length ? el("p", { class: "qcard__meta", text: metaBits.join("　") }) : null,
      el("div", { class: "qcard__options" }, optionButtons)
    ]);
  }

  return { create: create };
})();
