/* components/QuestionNavigator.js — 題號導覽 (WO-Q004).
   A numbered grid that lets the learner jump directly to any question
   in the current exam. "Answered" is purely a UI-visible marker (a
   local selection was recorded for that question) — it carries no
   correctness information; Auto Grading is out of scope for WO-Q004.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionNavigator = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* create(total, currentIndex, answeredSet, onJump)
     total: number of questions in the exam.
     currentIndex: index (0-based) of the question currently shown.
     answeredSet: { [index]: true } — which questions have a selection.
     onJump(index): called when a question number is clicked. */
  function create(total, currentIndex, answeredSet, onJump) {
    answeredSet = answeredSet || {};
    var items = [];
    for (var i = 0; i < total; i++) {
      items.push(makeItem(i, i === currentIndex, !!answeredSet[i], onJump));
    }
    return el("div", { class: "q-nav", "aria-label": "題號導覽" }, items);
  }

  function makeItem(index, isCurrent, isAnswered, onJump) {
    var btn = el("button", {
      type: "button",
      class: "q-nav__item" + (isCurrent ? " is-current" : "") + (isAnswered ? " is-answered" : ""),
      "aria-current": isCurrent ? "true" : "false",
      text: String(index + 1)
    });
    btn.addEventListener("click", function () {
      if (typeof onJump === "function") { onJump(index); }
    });
    return btn;
  }

  return { create: create };
})();
