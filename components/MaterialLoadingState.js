/* components/MaterialLoadingState.js — Material Center Sprint 2 · M011.
   Loading State: Skeleton Card / Skeleton Grid / Search Loading /
   Recent Learning Loading. Pure CSS shimmer (a plain keyframes rule in
   css/material.css) — no third-party library, no animation framework.
   Prototype-only: since the whole app is synchronous Mock Data, these
   skeletons are not auto-shown anywhere yet; wiring them into a real
   async flow is M013 Integration scope. They are exposed as factory
   functions so QA (and M013 later) can render each variant.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialLoadingState = (function () {
  "use strict";
  var el = AHS.UI.el;

  /* skeletonCard() — mirrors the real .mat-card block structure
     (cover / title / meta / progress / footer) at the same footprint. */
  function skeletonCard() {
    return el("article", { class: "mat-card mat-skeleton-card", "aria-hidden": "true" }, [
      el("div", { class: "mat-skeleton mat-skeleton--thumb" }),
      el("div", { class: "mat-skeleton mat-skeleton--title" }),
      el("div", { class: "mat-skeleton mat-skeleton--meta" }),
      el("div", { class: "mat-skeleton mat-skeleton--bar" }),
      el("div", { class: "mat-skeleton mat-skeleton--foot" })
    ]);
  }

  /* skeletonGrid(count?) — a .mat-grid filled with skeleton cards. */
  function skeletonGrid(count) {
    var n = typeof count === "number" && count > 0 ? count : 6;
    var cards = [];
    for (var i = 0; i < n; i++) { cards.push(skeletonCard()); }
    return el("div", {
      class: "mat-grid mat-grid--loading", "data-view": "grid",
      role: "status", "aria-label": "教材載入中"
    }, cards);
  }

  /* searchLoading() — slim bar placed under the search input. */
  function searchLoading() {
    return el("div", { class: "mat-search-loading", role: "status", "aria-label": "搜尋中" }, [
      el("div", { class: "mat-skeleton mat-skeleton--searchbar" })
    ]);
  }

  /* recentLearningLoading() — mirrors the Recent Learning banner
     footprint (icon square + two text lines + button pill). */
  function recentLearningLoading() {
    return el("section", {
      class: "card continue-reading mat-recent-loading",
      role: "status", "aria-label": "最近學習載入中", "aria-hidden": "true"
    }, [
      el("div", { class: "mat-skeleton mat-skeleton--icon" }),
      el("div", { class: "mat-recent-loading__meta" }, [
        el("div", { class: "mat-skeleton mat-skeleton--line-short" }),
        el("div", { class: "mat-skeleton mat-skeleton--line-long" })
      ]),
      el("div", { class: "mat-skeleton mat-skeleton--pill" })
    ]);
  }

  return {
    skeletonCard: skeletonCard,
    skeletonGrid: skeletonGrid,
    searchLoading: searchLoading,
    recentLearningLoading: recentLearningLoading
  };
})();
