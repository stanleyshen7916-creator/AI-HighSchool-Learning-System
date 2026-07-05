/* components/TodayMission.js — 今日任務 (Today Mission) v1.0.
   Checklist of today's tasks: subject chip + unit + done/total counter,
   each toggleable (Mock). PascalCase component under window.AHS. */
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
      "aria-label": "標記完成：" + subj.name + " " + item.unit
    });
    var row = el("li", { class: "today-task" }, [
      check,
      el("span", {
        class: "chip",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
      }, [el("span", { text: subj.name })]),
      el("span", { class: "today-task__unit", text: item.unit }),
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

    var addBtn = el("button", {
      type: "button", class: "today-card__add"
    }, [
      el("span", { class: "today-card__add-icon", html: AHS.Icons.plus() }),
      el("span", { text: "新增任務" })
    ]);

    return el("section", { class: "card today-card", "aria-label": data.title }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: data.title }),
        el("a", { class: "card__more", href: "#" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      el("ul", { class: "today-card__list" }, data.items.map(taskRow)),
      addBtn
    ]);
  }

  return { create: create };
})();
