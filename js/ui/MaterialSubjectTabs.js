/* components/MaterialSubjectTabs.js — Material Center Sprint 2 · M003
   (+ M013 Integration).
   Subject Tabs: 全部 / 國文 / 英文 / 數學 / 自然 / 社會, scrollable
   horizontal layout, exclusive active state.

   M013 change log (integration-necessitated, minimal):
   - create() now accepts an optional onPick(groupId) callback so the
     tabs can drive the Material Grid. Without a callback the component
     behaves exactly as the M003 UI-only version (backward compatible).
   - A leading "全部" tab was added and is the default. Rationale: M003's
     default-active first tab was 國文; once tabs actually filter, that
     default would boot the page into an empty chinese-only grid. "全部"
     is the minimal correction that keeps initial state showing all
     materials — flagged in the delivery note for PMO visibility.
   - GROUPS maps the 自然/社會 aggregate tabs onto existing AHS.Subjects
     keys. No data model change — mapping only.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialSubjectTabs = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var TABS = [
    { id: "all", label: "全部" },
    { id: "chinese", label: "國文" },
    { id: "english", label: "英文" },
    { id: "math", label: "數學" },
    { id: "science", label: "自然" },
    { id: "social", label: "社會" }
  ];

  /* Aggregate tab id -> list of AHS.Subjects keys it covers. */
  var GROUPS = {
    all: null, /* null = no restriction */
    chinese: ["chinese"],
    english: ["english"],
    math: ["math"],
    science: ["physics", "chemistry", "biology"],
    social: ["history", "geography", "civics"]
  };

  /* subjectsForGroup(groupId) -> array of subject keys or null (=all). */
  function subjectsForGroup(groupId) {
    return GROUPS.hasOwnProperty(groupId) ? GROUPS[groupId] : null;
  }

  /* create(onPick?) — onPick(groupId) fires on tab click (after the
     visual active state updates). Also returns a reset() helper on the
     root node so the integrator can programmatically return to 全部. */
  function create(onPick) {
    var buttons = [];

    function activate(btn) {
      buttons.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
    }

    function makeTab(tab, index) {
      var btn = el("button", {
        type: "button",
        class: "mat-subject-tabs__item" + (index === 0 ? " is-active" : ""),
        "data-group-id": tab.id,
        text: tab.label
      });
      btn.addEventListener("click", function () {
        activate(btn);
        if (typeof onPick === "function") { onPick(tab.id); }
      });
      buttons.push(btn);
      return btn;
    }

    var list = el("div", {
      class: "mat-subject-tabs__list", role: "tablist", "aria-label": "科目切換"
    }, TABS.map(function (tab, i) { return makeTab(tab, i); }));

    var root = el("div", { class: "mat-subject-tabs" }, [list]);

    /* resetToAll() — used by M013's unified reset flow. */
    root.resetToAll = function () {
      activate(buttons[0]);
    };

    return root;
  }

  return { create: create, subjectsForGroup: subjectsForGroup };
})();
