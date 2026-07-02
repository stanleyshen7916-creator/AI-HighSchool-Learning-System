/* components/ResumeLearning.js — 繼續學習 (Resume Learning) component.
   Shows 最近學習科目 / 上次閱讀章節 / 學習進度 (Progress Bar) + 繼續學習 button.
   PascalCase component under window.AHS. Self-contained Mock. */
window.AHS = window.AHS || {};
AHS.ResumeLearning = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Mock data for this task (no API / backend). */
  var MOCK = {
    title: "繼續學習",
    subject: "英文",
    chapter: "文法 · 第 2 章",
    percent: 65,
    buttonLabel: "繼續學習",
    feedback: "（Mock）繼續學習：英文《文法》第 2 章"
  };

  /* create(model?) — model defaults to the embedded Mock. */
  function create(model) {
    var data = model || MOCK;
    var pct = Math.max(0, Math.min(100, data.percent));

    var status = el("p", {
      class: "resume-card__status", "aria-live": "polite", hidden: "hidden"
    });

    var continueBtn = el("button", {
      type: "button",
      class: "resume-card__btn",
      "data-action": "resume",
      onclick: function () {
        status.textContent = data.feedback;
        status.removeAttribute("hidden");
      }
    }, [
      el("span", { class: "resume-card__btn-icon", "aria-hidden": "true", text: "▶" }),
      el("span", { text: data.buttonLabel })
    ]);

    return el("section", { class: "resume-card", "aria-label": data.title }, [
      el("h2", { class: "resume-card__title", text: data.title }),
      el("div", { class: "resume-card__meta" }, [
        el("span", { class: "resume-card__subject", text: data.subject }),
        el("span", { class: "resume-card__chapter", text: data.chapter })
      ]),
      el("div", { class: "resume-card__progress" }, [
        el("div", { class: "resume-card__progress-head" }, [
          el("span", { class: "resume-card__progress-label", text: "學習進度" }),
          el("span", { class: "resume-card__progress-pct", text: pct + "%" })
        ]),
        el("div", {
          class: "resume-card__progressbar",
          role: "progressbar",
          "aria-valuenow": String(pct),
          "aria-valuemin": "0",
          "aria-valuemax": "100"
        }, [
          el("div", { class: "resume-card__progressfill", style: "width:" + pct + "%" })
        ])
      ]),
      el("div", { class: "resume-card__actions" }, [continueBtn]),
      status
    ]);
  }

  return { create: create };
})();
