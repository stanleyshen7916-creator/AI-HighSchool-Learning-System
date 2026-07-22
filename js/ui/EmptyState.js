/* js/ui/EmptyState.js — Sprint 7.0 · EO-S7.0-003 Production Cleanup.
   Reusable 正式 Empty State card (Component Rules: 不得重複撰寫相同 UI).
   Used by every module whose Developer/Mock data was removed: real data
   or this — never auto-created fake data. */
window.AHS = window.AHS || {};
AHS.EmptyState = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  /* create({ title, hint, ariaLabel?, compact? }) */
  function create(opts) {
    opts = opts || {};
    return el("section", {
      class: "card empty-state" + (opts.compact ? " empty-state--compact" : ""),
      role: "status",
      "aria-label": opts.ariaLabel || opts.title || "尚無資料"
    }, [
      el("h3", { class: "empty-state__title", text: opts.title || "尚無資料" }),
      opts.hint ? el("p", { class: "empty-state__hint", text: opts.hint }) : null
    ].filter(Boolean));
  }
  return { create: create };
})();
