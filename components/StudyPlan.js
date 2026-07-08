/* components/StudyPlan.js — 學習計畫 (Study Plan) timeline.
   Time-ordered slots (time + subject chip + unit + 開始學習) and a points
   progress footer. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.StudyPlan = (function () {
  "use strict";
  var el = AHS.UI.el;

  function slotRow(slot, status) {
    var subj = AHS.Subjects[slot.subject];
    var startBtn = el("button", {
      type: "button", class: "plan-card__start"
    }, [el("span", { text: "開始學習" })]);
    startBtn.addEventListener("click", function () {
      status.textContent = "（Mock）開始學習：" + subj.name + "《" + slot.unit + "》";
      status.removeAttribute("hidden");
    });

    return el("li", { class: "plan-card__slot" }, [
      el("span", { class: "plan-card__time", text: slot.time }),
      el("span", { class: "plan-card__dot", "aria-hidden": "true",
        style: "background-color:" + subj.hex }),
      el("span", {
        class: "chip",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
      }, [el("span", { text: subj.name })]),
      el("span", { class: "plan-card__unit", text: slot.unit }),
      startBtn
    ]);
  }

  function create(model) {
    var data = model || AHS.Mock.studyPlan;
    var status = el("p", {
      class: "plan-card__status", "aria-live": "polite", hidden: "hidden"
    });
    var pts = data.points;
    var pct = pts.target ? Math.round((pts.earned / pts.target) * 100) : 0;

    return el("section", { class: "card plan-card", "aria-label": data.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: data.title }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      el("ul", { class: "plan-card__list" },
        data.slots.map(function (s) { return slotRow(s, status); })),
      el("div", { class: "plan-card__points" }, [
        el("span", { class: "plan-card__points-icon", html: AHS.Icons.star() }),
        el("span", { class: "plan-card__points-text",
          text: "完成所有任務可獲得 " + pts.target + " 學習點數！" }),
        el("span", { class: "plan-card__points-count",
          text: pts.earned + " / " + pts.target })
      ]),
      status
    ]);
  }

  return { create: create };
})();
