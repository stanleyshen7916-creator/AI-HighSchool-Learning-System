/* js/components/WorkspaceFolder.js — Sprint AI-120 (Workspace Repository
   Integration) AI-120-02/AI-120-03 「教材資料夾」— Home widget showing
   Current Workspace's own real materials grouped by Subject (School／
   Semester are already fixed by the Workspace itself — see
   AHS.WorkspaceRuntime.label() — so Subject is the one real grouping
   axis left to show: School → Semester → Subject → Material).

   Reads AHS.MaterialRuntime.list() only — the exact same Single Source
   every other Material-listing UI already reads (MaterialCard/Material
   Center), already Workspace-scoped automatically since Sprint AI-119's
   PersistenceAdapter namespacing plus this Sprint's own
   TeachingMaterialLoader Workspace filter (AI-120-01) — no second
   filtering logic invented here, no Runtime touched. "立即同步" (real-
   time sync with Repository) is automatic: this renders fresh from
   MaterialRuntime's current state on every page load, the same way
   every other Home widget already does in this static multi-page app —
   no polling/live-update mechanism needed or added. */
window.AHS = window.AHS || {};
AHS.WorkspaceFolder = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function groupBySubject(materials) {
    var order = [];
    var bySubject = {};
    materials.forEach(function (m) {
      var key = m.subject || "unknown";
      if (!bySubject[key]) { bySubject[key] = []; order.push(key); }
      bySubject[key].push(m);
    });
    return order.map(function (key) { return { subject: key, materials: bySubject[key] }; });
  }

  /* Sprint AI-121 AI-121-01/02: real per-material Learning State
     (NOT_STARTED/READING/READY_FOR_PRACTICE/READY_FOR_RETEST/MASTERED),
     replacing the retired 教材完成度 percentage as the honest "what stage
     is this material at" signal shown on Home. Renders nothing when the
     Runtime genuinely isn't available (never a fabricated label). */
  function stateBadge(materialId) {
    var lsr = AHS.MaterialLearningStateRuntime;
    var state = (lsr && typeof lsr.state === "function") ? lsr.state(materialId) : null;
    if (!state) { return null; }
    return el("span", { class: "workspace-folder__state workspace-folder__state--" + state.state, text: state.label });
  }

  /* Sprint AI-122 AI-122-07 (教材資料夾定義為唯一教材入口): the PO's own
     flow — 教材資料夾→教材→學習總結→考前總複習 — names 教材
     as its own real step between the folder and 學習總結. The title used
     to be a plain <span> (no way to open the material itself from here),
     skipping straight to 學習總結 — a real gap given this widget is now
     the flow's own documented starting point. materials.html?id=<id> is
     the same already-real deep link HomeRecentMaterials.js's own card
     uses (HOTFIX-009-1), reused here rather than inventing a second one.
     Sprint AI-143（PO 回報：「每日 AI 練習」與「平時練習」實質重複——
     兩者題目都來自同一份 QuestionBank，只是抽法不同，且「每日 AI 練習」
     從未有真正被推廣使用）：移除這顆連結，保留「平時練習」作為唯一的
     隨機抽題練習入口。 */
  function materialRow(m) {
    return el("li", { class: "workspace-folder__material" }, [
      el("a", {
        class: "workspace-folder__material-title",
        href: "materials.html?id=" + encodeURIComponent(m.id),
        text: m.title || "（未命名教材）"
      }),
      stateBadge(m.id),
      el("div", { class: "workspace-folder__material-links" }, [
        el("a", {
          class: "workspace-folder__link",
          href: "summary.html?materialId=" + encodeURIComponent(m.id),
          text: "前往學習總結"
        }),
        el("a", {
          class: "workspace-folder__link",
          href: "quiz.html?mode=practice&examId=" + encodeURIComponent("teaching_material_" + m.id),
          text: "前往考前總複習"
        })
      ])
    ]);
  }

  function subjectGroup(group) {
    var subj = (AHS.Subjects && AHS.Subjects[group.subject]) || { name: group.subject, hex: "#6b7280" };
    return el("div", { class: "workspace-folder__group" }, [
      el("div", { class: "workspace-folder__group-head" }, [
        el("span", { class: "workspace-folder__group-dot", style: "background-color:" + subj.hex }),
        el("strong", { class: "workspace-folder__group-name", text: subj.name }),
        el("span", { class: "workspace-folder__group-count", text: group.materials.length + " 筆" })
      ]),
      el("ul", { class: "workspace-folder__material-list" }, group.materials.map(materialRow))
    ]);
  }

  function create() {
    var ws = (AHS.WorkspaceRuntime && typeof AHS.WorkspaceRuntime.label === "function")
      ? AHS.WorkspaceRuntime.label() : null;
    var materials = (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.list === "function")
      ? AHS.MaterialRuntime.list() : [];
    var groups = groupBySubject(materials);

    var subtitle = ws
      ? ws.schoolName + "・" + ws.semesterNames.join("、")
      : null;

    var body = groups.length
      ? el("div", { class: "workspace-folder__groups" }, groups.map(subjectGroup))
      : el("p", { class: "workspace-folder__empty", text: "目前 Workspace 尚無教材。" });

    return el("section", { class: "card workspace-folder", "aria-label": "教材資料夾" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: "教材資料夾" }),
        subtitle ? el("span", { class: "workspace-folder__subtitle", text: subtitle }) : null
      ].filter(Boolean)),
      body
    ]);
  }

  return { create: create };
})();
