/* components/MaterialSort.js — Material Center Sprint 2 · M009.
   Sort: a single select with the four required options. Sorting reads
   only existing fields already on AHS.Mock.materials.items (date /
   progress / title) — no data structure change, no new per-item field.

   Note on "最近學習" (Recently Studied): the data model has no dedicated
   per-item "last studied" timestamp (only a page-level
   AHS.Mock.lastReading / lastLearning, and per-item `date` / `progress`).
   Given "不得修改資料結構", this option is implemented as: progress > 0
   items first (has been studied at all), ordered by progress desc, then
   by date desc as a tiebreaker. This is a reasonable approximation, not
   a literal "last studied" timestamp — flagged for PMO visibility.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialSort = (function () {
  "use strict";
  var el = AHS.UI.el;

  var OPTIONS = [
    { id: "newest", label: "最新加入" },
    { id: "oldest", label: "最舊加入" },
    { id: "title_asc", label: "名稱（A-Z）" },
    { id: "title_desc", label: "名稱（Z-A）" }
  ];

  function parseDate(str) {
    var t = str ? Date.parse(str.replace(/\//g, "-")) : NaN;
    return isNaN(t) ? 0 : t;
  }

  /* createdKey(item) — prefer the runtime created-order (`order`, a
     monotonic sequence) for a stable newest/oldest sort; fall back to
     the day-granularity `date` for seed-shaped items without `order`. */
  function createdKey(item) {
    if (typeof item.order === "number") { return item.order; }
    return parseDate(item.date);
  }

  /* apply(items, sortId) — returns a NEW sorted array; never mutates
     the input (so AHS.Mock.materials.items itself is left untouched). */
  function apply(items, sortId) {
    var list = (items || []).slice();

    switch (sortId) {
      case "newest":
        list.sort(function (a, b) { return createdKey(b) - createdKey(a); });
        break;
      case "oldest":
        list.sort(function (a, b) { return createdKey(a) - createdKey(b); });
        break;
      case "title_asc":
        list.sort(function (a, b) { return String(a.title).localeCompare(String(b.title), "zh-Hant"); });
        break;
      case "title_desc":
        list.sort(function (a, b) { return String(b.title).localeCompare(String(a.title), "zh-Hant"); });
        break;
      default:
        break;
    }
    return list;
  }

  /* create(onSortChange) — onSortChange(sortId) fires on select change.
     Default sort is "newest" (first option). */
  function create(onSortChange) {
    var selectEl = el("select", { class: "mat-sort__control", "aria-label": "排序" },
      OPTIONS.map(function (o) { return el("option", { value: o.id, text: o.label }); }));
    selectEl.addEventListener("change", function () { onSortChange(selectEl.value); });

    return el("label", { class: "mat-sort" }, [
      el("span", { class: "mat-sort__label", text: "排序" }),
      selectEl
    ]);
  }

  return { create: create, apply: apply };
})();
