/* js/ui/MaterialSummaryCard.js — Sprint 8.3 · EO-S8.3.004
   AI Summary UI for the material preview overlay: the「AI 重點整理」
   section, its「開始 AI 分析」button, the analysing state, and the
   summary card that shows title + core-concept list + keywords.

   This is a thin presentation helper — it renders whatever the Summary
   capability returns and NEVER produces or re-parses anything itself.
   The button handler calls AHS.AITutorService.ensureLearningSummary()
   (Material → AITutorService → KnowledgeSummaryRuntime), which derives
   the summary from the already-built Knowledge Graph, then re-renders.

   The card reuses the existing summary visual language (核心概念 list +
   關鍵字 chips, mapped to the .mat-summary__* classes added in
   css/components/qiaoqiao.css) rather than introducing a new design. */
window.AHS = window.AHS || {};
AHS.MaterialSummaryCard = (function () {
  "use strict";

  var el = AHS.UI.el;

  function hasSummaryContent(summary) {
    if (!summary || !summary.summary) { return false; }
    var s = summary.summary;
    return ["coreConcepts", "keywords", "definitions", "formulas", "importantPoints"]
      .some(function (k) { return Array.isArray(s[k]) && s[k].length > 0; });
  }

  /* Render the summary card: 標題 + 重點條列 + 關鍵字 (LOCK minimum). */
  function summaryCard(summary) {
    var s = summary.summary || {};
    var children = [
      el("h4", { class: "mat-summary__title", text: summary.title || "AI 重點整理" })
    ];

    /* 重點條列 — core concepts first, then important points, all real. */
    var points = []
      .concat(Array.isArray(s.coreConcepts) ? s.coreConcepts : [])
      .concat(Array.isArray(s.importantPoints) ? s.importantPoints : []);
    if (points.length) {
      children.push(el("p", { class: "mat-summary__label", text: "重點整理" }));
      children.push(el("ul", { class: "mat-summary__points" },
        points.map(function (item) {
          return el("li", { class: "mat-summary__point", text: String(item.text || "") });
        })));
    }

    /* 關鍵字 — reuse a chip row. */
    var keywords = Array.isArray(s.keywords) ? s.keywords : [];
    if (keywords.length) {
      children.push(el("p", { class: "mat-summary__label", text: "關鍵字" }));
      children.push(el("div", { class: "mat-summary__keywords" },
        keywords.map(function (item) {
          return el("span", { class: "mat-summary__chip", text: String(item.text || "") });
        })));
    }

    /* 定義 / 公式 — shown when present, still title+list+keywords minimum met. */
    [["definitions", "重要定義"], ["formulas", "公式"]].forEach(function (pair) {
      var list = Array.isArray(s[pair[0]]) ? s[pair[0]] : [];
      if (!list.length) { return; }
      children.push(el("p", { class: "mat-summary__label", text: pair[1] }));
      children.push(el("ul", { class: "mat-summary__points" },
        list.map(function (item) {
          return el("li", { class: "mat-summary__point", text: String(item.text || "") });
        })));
    });

    return el("div", { class: "mat-summary__card" }, children);
  }

  /* create(item) — the whole「AI 重點整理」section for one material.
     Returns { node, refresh } so the preview can drop it in and the
     button can re-render in place. */
  function create(item) {
    var section = el("section", { class: "mat-summary", "aria-label": "AI 重點整理" });

    function render(state, summary) {
      section.innerHTML = "";
      section.appendChild(el("div", { class: "mat-summary__head" }, [
        el("h3", { class: "mat-summary__heading", text: "AI 重點整理" })
      ]));

      if (state === "loading") {
        section.appendChild(el("p", { class: "mat-summary__loading", text: "AI 正在分析教材..." }));
        return;
      }

      if (state === "ready" && hasSummaryContent(summary)) {
        section.appendChild(summaryCard(summary));
        return;
      }

      if (state === "empty") {
        section.appendChild(el("p", { class: "mat-summary__notice",
          text: "此教材目前尚無可整理的內容（需先具備教材文字內容）。" }));
      }

      /* idle / empty both offer the analyse button. */
      var analyseBtn = el("button", {
        type: "button", class: "mat-summary__btn", text: "開始 AI 分析"
      });
      analyseBtn.addEventListener("click", function () {
        render("loading");
        /* Defer so the loading state paints before the (synchronous,
           in-memory) derivation runs. */
        window.setTimeout(function () {
          var service = AHS.AITutorService;
          var produced = (service && typeof service.ensureLearningSummary === "function")
            ? service.ensureLearningSummary(item.id) : {};
          if (hasSummaryContent(produced)) { render("ready", produced); }
          else { render("empty"); }
        }, 0);
      });
      section.appendChild(analyseBtn);
    }

    /* Initial state: show an existing summary if one is already in
       memory, otherwise offer the button. Reading is pure. */
    var service = AHS.AITutorService;
    var existing = (service && typeof service.getLearningSummary === "function")
      ? service.getLearningSummary(item.id) : {};
    render(hasSummaryContent(existing) ? "ready" : "idle", existing);

    return { node: section, render: render };
  }

  return { create: create, hasSummaryContent: hasSummaryContent };
})();
