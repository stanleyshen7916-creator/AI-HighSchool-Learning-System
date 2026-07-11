/* components/MaterialGrid.js — Material Center · RC-001 Grouped Layout.
   Renders materials grouped by 教材分類 (category). Each non-empty
   category becomes a Group: a Group Header (分類名稱 + 數量) followed by
   a responsive card grid. Empty categories render nothing (no header).
   Sorting is applied per-group by the caller (RC-006); this component
   receives an already-ordered list per group. Responsive via the
   existing .mat-grid CSS. PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialGrid = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* Canonical category order + icon, per RC-001. Categories not in this
     list still render (fallback bucket) after the known ones. */
  var CATEGORY_ORDER = [
    { id: "課本", icon: "📘" },
    { id: "講義", icon: "📄" },
    { id: "考卷", icon: "📑" },
    { id: "筆記", icon: "📝" },
    { id: "補充資料", icon: "📚" },
    { id: "影片", icon: "🎥" },
    { id: "其他", icon: "📦" }
  ];

  function iconFor(cat) {
    for (var i = 0; i < CATEGORY_ORDER.length; i++) {
      if (CATEGORY_ORDER[i].id === cat) { return CATEGORY_ORDER[i].icon; }
    }
    return "📦";
  }

  /* groupByCategory(items) -> ordered array of { category, icon, items }.
     Preserves CATEGORY_ORDER; unknown categories appended in first-seen
     order. Only includes categories that actually have items. */
  function groupByCategory(items) {
    var buckets = {};
    var seenExtra = [];
    (items || []).forEach(function (it) {
      var cat = it.category || "其他";
      if (!buckets[cat]) {
        buckets[cat] = [];
        if (!CATEGORY_ORDER.some(function (c) { return c.id === cat; })) {
          seenExtra.push(cat);
        }
      }
      buckets[cat].push(it);
    });

    var ordered = [];
    CATEGORY_ORDER.forEach(function (c) {
      if (buckets[c.id] && buckets[c.id].length) {
        ordered.push({ category: c.id, icon: c.icon, items: buckets[c.id] });
      }
    });
    seenExtra.forEach(function (cat) {
      if (buckets[cat] && buckets[cat].length) {
        ordered.push({ category: cat, icon: iconFor(cat), items: buckets[cat] });
      }
    });
    return ordered;
  }

  /* create(items, status, opts, sortFn?)
     opts = { onOpen, onDownload, onDelete, onToggleFavorite }
     sortFn(list) -> sorted list, applied PER GROUP (RC-006). */
  function create(items, status, opts, sortFn) {
    var groups = groupByCategory(items);
    var wrap = el("div", { class: "mat-groups", "data-view": "grid" });

    groups.forEach(function (g) {
      var groupItems = typeof sortFn === "function" ? sortFn(g.items.slice()) : g.items;

      var header = el("div", { class: "mat-group__header" }, [
        el("span", { class: "mat-group__icon", "aria-hidden": "true", text: g.icon }),
        el("h3", { class: "mat-group__name", text: g.category }),
        el("span", { class: "mat-group__count", text: "（" + groupItems.length + "）" })
      ]);

      var grid = el("div", { class: "mat-grid" },
        groupItems.map(function (item) {
          return AHS.MaterialCard.create(item, status, opts);
        }));

      wrap.appendChild(el("section", {
        class: "mat-group", "data-category": g.category, "aria-label": g.category
      }, [header, grid]));
    });

    return wrap;
  }

  return { create: create, groupByCategory: groupByCategory };
})();
