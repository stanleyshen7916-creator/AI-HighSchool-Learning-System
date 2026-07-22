/* components/QuestionNavigator.js — Sprint 4 · Quiz Runtime Foundation.
   Renders exam-taking navigation: a question-number grid (answered /
   current highlighting), Prev / Next controls, and a Finish button on
   the last question. Pure render — callbacks (onGoTo / onPrev / onNext
   / onFinish) are supplied by the integrator (AHS.QuizCenter).
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.QuestionNavigator = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* create(opts) — opts: {
       total, currentIndex (0-based), answeredIds (Set-like array of
       question ids answered so far), questionIds (array aligned with
       total, for answered lookup),
       onGoTo(index), onPrev(), onNext(), onFinish()
     } */
  function create(opts) {
    opts = opts || {};
    var total = opts.total || 0;
    var currentIndex = opts.currentIndex || 0;
    var answeredIds = opts.answeredIds || [];
    var questionIds = opts.questionIds || [];
    var isLast = currentIndex === total - 1;

    var grid = el("div", { class: "qnav__grid" });
    for (var i = 0; i < total; i++) {
      var qid = questionIds[i];
      var isAnswered = answeredIds.indexOf(qid) !== -1;
      var isCurrent = i === currentIndex;
      (function (index) {
        var btn = el("button", {
          type: "button",
          class: "qnav__num" +
            (isCurrent ? " is-current" : "") +
            (isAnswered ? " is-answered" : ""),
          text: String(index + 1)
        });
        btn.addEventListener("click", function () {
          if (typeof opts.onGoTo === "function") { opts.onGoTo(index); }
        });
        grid.appendChild(btn);
      })(i);
    }

    var prevBtn = el("button", {
      type: "button", class: "qnav__prev",
      disabled: currentIndex === 0 ? "disabled" : null
    }, [el("span", { text: "上一題" })]);
    prevBtn.addEventListener("click", function () {
      if (typeof opts.onPrev === "function") { opts.onPrev(); }
    });

    var nextBtn;
    if (isLast) {
      nextBtn = el("button", { type: "button", class: "qnav__finish" }, [
        el("span", { html: AHS.Icons.check() }),
        el("span", { text: "完成測驗" })
      ]);
      nextBtn.addEventListener("click", function () {
        if (typeof opts.onFinish === "function") { opts.onFinish(); }
      });
    } else {
      nextBtn = el("button", { type: "button", class: "qnav__next" }, [
        el("span", { text: "下一題" })
      ]);
      nextBtn.addEventListener("click", function () {
        if (typeof opts.onNext === "function") { opts.onNext(); }
      });
    }

    return el("nav", { class: "card qnav", "aria-label": "題號導覽" }, [
      el("div", { class: "qnav__progress-label", text: (currentIndex + 1) + " / " + total + " 題" }),
      grid,
      el("div", { class: "qnav__actions" }, [prevBtn, nextBtn])
    ]);
  }

  return { create: create };
})();
