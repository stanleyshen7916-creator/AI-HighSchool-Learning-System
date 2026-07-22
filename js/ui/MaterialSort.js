/* components/MaterialSort.js — Material Center Sprint 2 · M009.
   Sort: a single select with four options — 最新加入 / 最舊加入 /
   名稱（A-Z）/ 名稱（Z-A）. apply() is a PURE function: it sorts whatever
   array it is handed (in Beta, always the MaterialRuntime-derived list
   from MaterialCenter.computeVisibleItems) and returns a NEW array,
   never mutating the input. It has no data source of its own and does
   not read AHS.Mock.

   newest/oldest use createdKey(): the runtime created-order (`order`, a
   monotonic sequence set by MaterialRuntime.add) for a stable ordering,
   falling back to the day-granularity `date` for any seed-shaped item
   that lacks `order`. No per-item timestamp field is required — flagged
   for PMO visibility as the interim "created order" approach.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialSort = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

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

  /* apply(items, sortId) — returns a NEW sorted array; never mutates the
     input list (which, in Beta, is the MaterialRuntime-derived list). */
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
