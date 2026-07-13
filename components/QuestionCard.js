/* components/QuestionCard.js — 單題卡片 (WO-Q004).
   Renders ONE question at a time: subject/chapter/difficulty tags +
   stem + single-choice options. Reused by QuizCenter's exam-taking
   view. Data (the full Question Object) is always supplied by the
   caller via AHS.QuestionBank.get() — this component holds no data of
   its own and never compares against `answer` (Auto Grading is out of
   scope for WO-Q004; selection is purely a UI state passed in/out via
   selectedIndex / onSelect).
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionCard = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* create(question, selectedIndex, onSelect)
     question: full Question Object (subject/chapter/difficulty/question/options).
     selectedIndex: currently chosen option index, or null if none yet.
     onSelect(index): called when the learner picks an option. */
  function create(question, selectedIndex, onSelect) {
    var subj = AHS.Subjects[question.subject];

    var options = (question.options || []).map(function (optionText, i) {
      var isSelected = selectedIndex === i;
      var btn = el("button", {
        type: "button",
        class: "q-card__option" + (isSelected ? " is-selected" : ""),
        "aria-pressed": isSelected ? "true" : "false"
      }, [
        el("span", { class: "q-card__option-mark", "aria-hidden": "true" }),
        el("span", { class: "q-card__option-text", text: optionText })
      ]);
      btn.addEventListener("click", function () {
        if (typeof onSelect === "function") { onSelect(i); }
      });
      return btn;
    });

    return el("section", { class: "card q-card", "aria-label": "題目" }, [
      el("div", { class: "q-card__meta" }, [
        subj ? el("span", {
          class: "chip",
          style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
        }, [el("span", { text: subj.name })]) : null,
        question.chapter ? el("span", { class: "q-card__tag", text: question.chapter }) : null,
        question.difficulty ? el("span", { class: "q-card__tag", text: question.difficulty }) : null
      ]),
      el("h2", { class: "q-card__stem", text: question.question }),
      el("div", { class: "q-card__options", role: "radiogroup", "aria-label": "選項" }, options)
    ]);
  }

  return { create: create };
})();
