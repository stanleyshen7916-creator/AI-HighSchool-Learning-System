/* components/MaterialSearchBar.js — Material Center Sprint 2 · M002
   (+ M013 Integration).
   Search Bar UI is unchanged from M002 (Input + Icon + Placeholder).
   M013 adds an optional onSearch(keyword) callback wired to the native
   "input" event — without a callback the component remains the exact
   M002 UI-only control. No fake/real API; filtering happens in the
   integrator against AHS.Mock in memory.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialSearchBar = (function () {
  "use strict";
  var el = AHS.UI.el;

  var PLACEHOLDER = "搜尋教材、章節或關鍵字";

  /* create(onSearch?) — onSearch(keyword) fires on every input event.
     Returns the root node with a clear() helper for the unified reset
     flow (M013). */
  function create(onSearch) {
    var input = el("input", {
      class: "mat-search__input",
      type: "search",
      placeholder: PLACEHOLDER,
      "aria-label": "搜尋教材"
    });

    if (typeof onSearch === "function") {
      input.addEventListener("input", function () {
        onSearch(input.value);
      });
    }

    var root = el("div", { class: "mat-search" }, [
      el("span", { class: "mat-search__icon", html: AHS.Icons.search() }),
      input
    ]);

    root.clear = function () {
      input.value = "";
    };

    return root;
  }

  return { create: create };
})();
