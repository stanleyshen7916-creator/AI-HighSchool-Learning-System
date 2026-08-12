/* js/components/ReviewSession.js — Sprint AI-114 AI-901: 複習中心's own
   real Review Session — no longer a redirect to wrongbook.html.

   Thin renderer only: all real state/grading lives in AHS.ReviewRuntime
   (startSession/getSession/answerCurrent/completeSession, this Sprint's
   own additions) — this file just draws whatever that Runtime's current
   session state is, step by step, reusing the exact same real
   question-interaction UI AHS.WrongBook.buildReviewInteraction() already
   provides (Sprint AI-114 AI-901/902 — one definition, not a second
   "review a question" UI). PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewSession = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function statBlock(label, value) {
    return el("div", { class: "rv-session__stat" }, [
      el("strong", { class: "rv-session__stat-value", text: String(value) }),
      el("span", { class: "rv-session__stat-label", text: label })
    ]);
  }

  /* create(options) — options: { onComplete(results), count }. Starts a
     real session via AHS.ReviewRuntime.startSession(count) the moment
     this is mounted (matching the AI-901 flow: 開始今日複習 ->
     ReviewRuntime produces + starts the session immediately, no separate
     "confirm" step this Sprint asks for). count (Sprint AI-121 AI-121-06
     Review Mode, optional, additive) is passed straight through — every
     existing caller omitting it keeps the exact prior full-queue
     behavior. Returns null (mounts nothing) when there's genuinely
     nothing due — caller keeps its own existing Empty State/feedback
     message, never a fabricated session. */
  function create(options) {
    if (!el) { return null; }
    var runtime = AHS.ReviewRuntime;
    if (!runtime || typeof runtime.startSession !== "function") { return null; }
    options = options || {};

    var container = el("div", { class: "rv-session" });
    var initial = runtime.startSession(options.count);
    if (!initial) { return null; }

    function renderStep(state) {
      var item = state.current;
      var interaction = AHS.WrongBook.buildReviewInteraction(item, function (wasCorrect, selectedKey) {
        var next = runtime.answerCurrent(wasCorrect, selectedKey);
        if (next && next.active) { renderStep(next); } else { renderResult(next || runtime.completeSession()); }
      });
      container.innerHTML = "";
      container.appendChild(el("div", { class: "rv-session__body" }, [
        el("p", { class: "rv-session__progress", text: "複習進度：" + (state.index + 1) + " / " + state.total }),
        el("h2", { class: "rv-session__title", text: item.title }),
        el("p", { class: "rv-session__question", text: "題目：" + item.question }),
        interaction
      ]));
    }

    function renderResult(state) {
      var results = state ? state.results : { correct: 0, wrong: 0, newlyMastered: 0 };
      var total = state ? state.total : 0;
      var accuracy = total > 0 ? Math.round((results.correct / total) * 100) : 0;
      var doneBtn = el("button", { type: "button", class: "rv-session__btn rv-session__btn--primary" }, [
        el("span", { text: "完成，返回複習中心" })
      ]);
      doneBtn.addEventListener("click", function () {
        if (options.onComplete) { options.onComplete(results); }
      });
      container.innerHTML = "";
      container.appendChild(el("div", { class: "rv-session__body rv-session__result" }, [
        el("h2", { class: "rv-session__title", text: "複習完成" }),
        el("div", { class: "rv-session__stats" }, [
          statBlock("總題數", total),
          statBlock("答對", results.correct),
          statBlock("答錯", results.wrong),
          statBlock("正確率", accuracy + "%"),
          statBlock("新精熟", results.newlyMastered)
        ]),
        doneBtn
      ]));
    }

    renderStep(initial);
    return container;
  }

  return { create: create };
})();
