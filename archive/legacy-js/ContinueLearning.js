/* components/TodayMission.js — 今日任務 (Today Mission).
   Checklist of today's tasks: subject chip + title + done/total counter,
   each toggleable (Mock UI interaction only — checkbox state is not tied
   to done/total, matching the original mock behaviour).
   HOME-F005 Correction (PMO final decision, 2026-07-07): data model
   finalized to { id, subject, title, done, total } — reads
   AHS.Mock.todayTasks directly (no percentage, no AHS.Data/AHS.Utils
   task layer). PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.TodayMission = (function () {
  "use strict";
  var el = AHS.UI.el;

  function taskRow(item) {
    var subj = AHS.Subjects[item.subject];
    var check = el("button", {
      type: "button",
      class: "today-task__check",
      "aria-pressed": "false",
      "aria-label": "標記完成：" + subj.name + " " + item.title
    });
    var row = el("li", { class: "today-task" }, [
      check,
      el("span", {
        class: "chip",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
      }, [el("span", { text: subj.name })]),
      el("span", { class: "today-task__unit", text: item.title }),
      el("span", { class: "today-task__count", text: item.done + "/" + item.total })
    ]);
    check.addEventListener("click", function () {
      var on = check.getAttribute("aria-pressed") === "true";
      check.setAttribute("aria-pressed", on ? "false" : "true");
      row.classList.toggle("is-done", !on);
    });
    return row;
  }

  /* create(model?) — model defaults to AHS.Mock.todayTasks. */
  function create(model) {
    var data = model || AHS.Mock.todayTasks;
    var items = (data && data.items) || [];

    var body = items.length
      ? el("ul", { class: "today-card__list" }, items.map(taskRow))
      : el("p", { class: "today-card__empty", text: "今天沒有安排學習任務" });

    return el("section", { class: "card today-card", "aria-label": data.title || "今日任務" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: data.title || "今日任務" })
      ]),
      body
    ]);
  }

  return { create: create };
})();
