/* components/MaterialRecentLearning.js — Material Center Sprint 2 · M004.
   Recent Learning: Section Title + Continue Learning Card, showing the
   most recently read material/chapter, a visual Progress Bar, and a
   Continue Button.

   This extracts and upgrades the existing "繼續閱讀" banner (previously
   an inline function inside components/MaterialCenter.js, delivered as
   MAT-F005) rather than building a second, parallel "recently read
   material" UI — the two specs describe the same underlying concept.
   Data source is unchanged: AHS.Mock.lastReading (Mock only, no API).
   Hidden entirely when there is no matching material (same behavior as
   MAT-F005). Reuses .progressbar / .progressbar__fill (shared, already
   used by components/HomeRecentMaterials.js) for the new Progress Bar —
   no new Design Token.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialRecentLearning = (function () {
  "use strict";
  var el = AHS.UI.el;

  function findMaterialById(data, id) {
    for (var i = 0; i < data.items.length; i++) {
      if (data.items[i].id === id) { return data.items[i]; }
    }
    return null;
  }

  function clampProgress(value) {
    var n = typeof value === "number" && !isNaN(value) ? value : 0;
    if (n < 0) { return 0; }
    if (n > 100) { return 100; }
    return n;
  }

  /* create(data, onOpenDetail)
     data — AHS.Mock.materials (needed to resolve lastReading.materialId).
     onOpenDetail(id) — reuses MaterialCenter's existing detail-open flow. */
  function create(data, onOpenDetail) {
    var lastReading = AHS.Mock && AHS.Mock.lastReading;
    if (!lastReading || typeof lastReading.materialId !== "number") { return null; }

    var item = findMaterialById(data, lastReading.materialId);
    if (!item) { return null; }

    var subj = AHS.Subjects[item.subject];
    var pct = clampProgress(item.progress);

    var continueBtn = el("button", {
      type: "button", class: "continue-reading__btn", text: "繼續閱讀"
    });
    continueBtn.addEventListener("click", function () {
      onOpenDetail(item.id);
    });

    var card = el("section", { class: "card continue-reading", "aria-label": "最近學習" }, [
      el("span", { class: "continue-reading__icon", html: AHS.Icons.book() }),
      el("div", { class: "continue-reading__meta" }, [
        el("span", { class: "continue-reading__label", text: "上次閱讀" }),
        el("span", { class: "continue-reading__title", text: subj.name + "《" + item.title + "》" }),
        el("span", { class: "continue-reading__chapter", text: item.chapter }),
        el("div", { class: "continue-reading__progress" }, [
          el("div", {
            class: "progressbar",
            role: "progressbar",
            "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100"
          }, [
            el("div", { class: "progressbar__fill", style: "width:" + pct + "%;background-color:" + subj.hex })
          ])
        ])
      ]),
      continueBtn
    ]);

    /* Section Title, wrapping the (unchanged) Continue Learning Card. */
    return el("section", { class: "material-recent-learning", "aria-label": "最近學習" }, [
      el("h2", { class: "material-recent-learning__title", text: "最近學習" }),
      card
    ]);
  }

  return { create: create };
})();
