/* components/QuestionCard.js — Sprint 4 · Quiz Runtime Foundation.
   Renders a single question (stem + 4 options) for the exam-taking
   view. Pure render: takes a question record (as produced by
   AHS.QuestionBank / AHS.QuestionRuntime) plus the currently-saved
   answer key, and an onSelect(key) callback — it never talks to any
   Runtime directly. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionCard = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* create(question, selectedKey, onSelect) */
  function create(question, selectedKey, onSelect) {
    var subj = AHS.Subjects[question.subject];

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
      el("div", { class: "qcard__options" }, optionButtons)
    ]);
  }

  return { create: create };
})();
