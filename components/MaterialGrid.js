/* components/MaterialGrid.js — Material Center Sprint 2 · M005.
   Material Grid: renders AHS.MaterialCard for each material item.
   Responsive via the existing .mat-grid CSS (auto-fill columns) —
   Desktop / Tablet / Mobile all reuse the same rule, no new Design
   Token. No pagination, no lazy loading (out of scope for M005).
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialGrid = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* create(items, status, opts)
     opts = { onOpen, onDownload, onDelete, onToggleFavorite } */
  function create(items, status, opts) {
    var list = items || [];
    return el("div", { class: "mat-grid", "data-view": "grid" },
      list.map(function (item) {
        return AHS.MaterialCard.create(item, status, opts);
      }));
  }

  return { create: create };
})();
