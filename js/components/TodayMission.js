/* components/TodayMission.js — 今日任務 (Today Mission).
   Checklist of today's tasks: subject chip + title + done/total counter.
   The checkbox itself stays Mock UI interaction only (not tied to
   done/total, matching the original mock behaviour) — it's a personal
   "我自己勾起來" marker, never a Runtime write.

   Sprint AI-140（PO 回報）: 每一列本身現在是真正可點擊的入口，行為與
   js/components/MaterialCenter.js 的「開始學習」一致——AHS.LearningStateRuntime.
   dailyTasks() 的 kind==="material"/"recommend" 這兩種任務綁定單一真實教材
   （帶 materialId），點擊時先呼叫 AHS.MaterialRuntime.startLearning() 推進
   真實進度（與教材中心「開始學習」按鈕呼叫的是同一個 Runtime 方法），再導向
   該教材的「重點整理」（summary.html?materialId=...，全站既有慣例，見
   js/ui/MaterialCard.js 的 summaryLink）。kind==="review"/"wrongbook" 這兩種
   是跨教材的彙總提示（不對應單一教材），直接導向文字本身描述的目的地
   （review.html／wrongbook.html）。沒有可辨識 kind 的任務誠實維持不可點擊
   （不假造連結）。

   Sprint 6.6 Runtime Integration Fix (WO-007): no Mock Data fallback
   anymore. No Task/Mission Runtime exists anywhere in this repository
   (building one would be a new feature, out of scope), so js/pages/
   app.js always passes an explicit model — real if one ever exists,
   otherwise { title: "今日任務", items: [] } — and this component always
   honestly renders whatever it's given, including the Empty State when
   items is empty. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.TodayMission = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* AI-127 Follow-up (Single Source of Truth fix): AHS.Subjects
     (js/core/Icons.js) is the one real, still-existing subject UI-
     metadata source (chinese/english/math/physics/chemistry/biology/
     history/geography/civics) — never removed by Production Cleanup, so
     TodayMission must reuse it directly rather than keep its own,
     necessarily-divergent copy (the previous hotfix's local SUBJECTS
     table used different hex values than AHS.Subjects' real ones for
     the same code, e.g. math). A subject value AHS.Subjects doesn't
     recognize (e.g. "" or "other", both real placeholder values
     WrongBookRuntime.js/MaterialRuntime.js's own pullFromRepository()
     assign to a record newly created from a real Supabase pull) still
     needs a safe, non-throwing fallback — never a fabricated new
     subject or a new visual system. */
  function subjectMeta(value) {
    var known = AHS.Subjects && AHS.Subjects[value];
    if (known) { return known; }
    return { name: value || "科目", hex: "#7c5cff" };
  }

  /* taskHref(item) — kind→destination map. "material"/"recommend" only
     resolve when a real materialId is present (never a fabricated link);
     "review"/"wrongbook" go to the exact page their own title text
     already promises ("前往複習中心"/"前往知識弱點"). Any other/unknown
     kind stays honestly non-clickable. */
  function taskHref(item) {
    if (!item) { return null; }
    if ((item.kind === "material" || item.kind === "recommend") && item.materialId) {
      return "summary.html?materialId=" + encodeURIComponent(item.materialId);
    }
    if (item.kind === "review") { return "review.html"; }
    if (item.kind === "wrongbook") { return "wrongbook.html"; }
    return null;
  }

  function taskRow(item) {
    var subj = subjectMeta(item && item.subject);
    var title = item && item.title ? item.title : "學習任務";
    var done = item && typeof item.done === "number" ? item.done : 0;
    var total = item && typeof item.total === "number" ? item.total : 0;
    var check = el("button", {
      type: "button",
      class: "today-task__check",
      "aria-pressed": "false",
      "aria-label": "標記完成：" + subj.name + " " + title
    });

    var content = [
      el("span", {
        class: "chip",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
      }, [el("span", { text: subj.name })]),
      el("span", { class: "today-task__unit", text: title }),
      el("span", { class: "today-task__count", text: done + "/" + total })
    ];

    var href = taskHref(item);
    var body;
    if (href) {
      body = el("a", { class: "today-task__link", href: href }, content);
      if (item.kind === "material" || item.kind === "recommend") {
        /* 與 js/components/MaterialCenter.js 的 startLearningSession()
           呼叫同一個真實 Runtime 方法，讓「今日任務」點下去跟教材中心的
           「開始學習」按鈕有一樣的真實效果（進度推進），而不是只換頁。 */
        body.addEventListener("click", function () {
          if (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.startLearning === "function") {
            AHS.MaterialRuntime.startLearning(item.materialId);
          }
        });
      }
    } else {
      body = el("span", { class: "today-task__link today-task__link--static" }, content);
    }

    var row = el("li", { class: "today-task" }, [check, body]);
    check.addEventListener("click", function (e) {
      e.stopPropagation();
      var on = check.getAttribute("aria-pressed") === "true";
      check.setAttribute("aria-pressed", on ? "false" : "true");
      row.classList.toggle("is-done", !on);
    });
    return row;
  }

  /* create(model) — model must be a real, fully-shaped object
     ({ title, items }); no Mock fallback. Missing/invalid input renders
     the Empty State rather than throwing. */
  function create(model) {
    var data = model || {};
    var items = Array.isArray(data.items) ? data.items : [];

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
