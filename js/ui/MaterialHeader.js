/* components/MaterialHeader.js — Material Center Sprint 2 · M001.
   Material Header: Title + Subtitle container only. Reuses the exact
   existing markup/classes already defined in css/material.css
   (.mat-header__titles / .mat-header__title / .mat-header__subtitle) —
   zero new CSS, zero Design Token change, zero visual redesign.

   Scope (per M001): Header Container, Page Title, Subtitle, spacing,
   responsive layout ONLY. Search Bar / Tabs / Grid / Filter / Sort /
   Favorite / Loading / Empty State are explicitly out of scope and are
   NOT implemented here — they remain (unchanged, pre-existing) in
   components/MaterialCenter.js's own header() function, which now
   delegates the title/subtitle portion to this component.

   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialHeader = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var DEFAULT_TITLE = "教材中心";
  var DEFAULT_SUBTITLE = "選擇教材，開始今天的學習。";

  /* create(model?) — model defaults to AHS.AppConfig.materials.
     Falls back to the UI Library's fixed copy if title/subtitle are
     missing, per this feature's spec ("若 UI Library 已固定文案，
     請以 UI Library 為準"). Never throws. */
  function create(model) {
    var data = model || (AHS.AppConfig && AHS.AppConfig.materials) || {};
    var title = data.title || DEFAULT_TITLE;
    var subtitle = data.subtitle || DEFAULT_SUBTITLE;

    return el("div", { class: "mat-header__titles" }, [
      el("h1", { class: "mat-header__title", text: title }),
      el("p", { class: "mat-header__subtitle", text: subtitle })
    ]);
  }

  return { create: create };
})();
