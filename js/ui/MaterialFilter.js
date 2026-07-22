/* components/MaterialFilter.js — Material Center Sprint 2 · M008.
   Filter: a Filter Button that toggles a Filter Panel with three
   selects — 科目 / 年級 / 狀態. This component only BUILDS the panel UI;
   the option LABELS for the 科目 / 年級 selects are read from the
   Developer Seed Data (AHS.AppConfig.materials subjectCounts / grades) purely
   to populate the dropdown choices. The actual filtering runs in
   MaterialCenter.computeVisibleItems() against MaterialRuntime — this
   component never filters data itself. No backend, no fetch/XHR. Status
   buckets (未開始/進行中/已完成) are derived from each item's existing
   `progress` field via statusOf() at filter-time — no data structure
   change.

   Deliberately independent from the existing subject sidebar
   (components/MaterialCenter.js's subjectPanel) and from M003's
   decorative Subject Tabs — per this Sprint's roadmap, reconciling
   these parallel subject-selection surfaces is explicit scope for a
   later "M013 Integration" task, not this batch.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.MaterialFilter = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  var STATUS_OPTIONS = [
    { id: "all", label: "全部狀態" },
    { id: "not_started", label: "未開始" },
    { id: "in_progress", label: "進行中" },
    { id: "done", label: "已完成" }
  ];

  /* statusOf(progress) — pure classification, no stored field needed. */
  function statusOf(progress) {
    var p = typeof progress === "number" ? progress : 0;
    if (p <= 0) { return "not_started"; }
    if (p >= 100) { return "done"; }
    return "in_progress";
  }

  function subjectOptions(data) {
    var opts = [{ id: "all", label: "全部科目" }];
    (data.subjectCounts || []).forEach(function (s) {
      var meta = AHS.Subjects[s.subject];
      if (meta) { opts.push({ id: s.subject, label: meta.name }); }
    });
    return opts;
  }

  function select(labelText, options, onChange) {
    var selectEl = el("select", { class: "mat-filter__control", "aria-label": labelText },
      options.map(function (o) { return el("option", { value: o.id, text: o.label }); }));
    selectEl.addEventListener("change", function () { onChange(selectEl.value); });
    return el("label", { class: "mat-filter__field" }, [
      el("span", { class: "mat-filter__field-label", text: labelText }),
      selectEl
    ]);
  }

  /* create(data, onApply) — returns { button, panel } as SEPARATE nodes
     so the integrator can place the panel as its own in-flow block that
     reserves layout space and pushes the grid down (WO-008-001), instead
     of nesting/overlaying. onApply({subject,grade,status}) fires on any
     select change. Panel starts closed; toggled by the button. */
  function create(data, onApply) {
    var state = { subject: "all", grade: "all", status: "all" };

    var panel = el("div", {
      class: "mat-filter__panel", role: "region", "aria-label": "篩選條件", hidden: "hidden"
    }, [
      select("科目", subjectOptions(data), function (v) { state.subject = v; onApply(state); }),
      select("年級", [{ id: "all", label: "全部年級" }].concat(
        (data.grades || []).map(function (g) { return { id: g, label: g }; })
      ), function (v) { state.grade = v; onApply(state); }),
      select("狀態", STATUS_OPTIONS, function (v) { state.status = v; onApply(state); })
    ]);

    var btn = el("button", {
      type: "button", class: "mat-filter__btn", "aria-haspopup": "true", "aria-expanded": "false"
    }, [
      el("span", { html: AHS.Icons.filterX() }),
      el("span", { text: "篩選" })
    ]);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var willOpen = panel.hasAttribute("hidden");
      if (willOpen) {
        panel.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
        btn.classList.add("is-active");
      } else {
        panel.setAttribute("hidden", "hidden");
        btn.setAttribute("aria-expanded", "false");
        btn.classList.remove("is-active");
      }
    });

    return { button: btn, panel: panel };
  }

  return { create: create, statusOf: statusOf };
})();
