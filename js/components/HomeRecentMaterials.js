/* components/HomeRecentMaterials.js — 最近教材 (Home Recent Materials) v1.1.
   HOME-F008: cards now also show Title + Last Opened, and the whole card
   links to materials.html?id=<id> — reusing the same plain-<a> navigation
   pattern already established in components/ContinueLearning.js (no new
   Navigation Helper introduced). Empty state reuses the existing
   .today-card__empty utility class from home.css (no new Empty UI).
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.HomeRecentMaterials = (function () {
  "use strict";
  var el = (window.AHS && AHS.UI) ? AHS.UI.el : undefined; /* EO-S7.0-HOTFIX-001: never throw at load time */

  function card(item, status) {
    var subj = AHS.Subjects[item.subject];
    /* Sprint AI-117 AI-117-01/AI-117-10: same Material Completion single
       source as js/ui/MaterialCard.js — see that file's own comment for
       the full rationale. Falls back to raw reading progress only when
       StatisticsRuntime isn't loaded on this page. */
    var completion = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.materialCompletion === "function")
      ? AHS.StatisticsRuntime.materialCompletion(item.id) : null;
    var pct = completion ? completion.percent : Math.max(0, Math.min(100, item.progress));
    var completionLabel = completion ? completion.label + "（" + completion.percent + "%）" : (pct + "%");

    var canAccessFile = !!item.file;
    var docBtn = el("button", {
      type: "button", class: "recent-card__act" + (canAccessFile ? "" : " is-disabled"),
      disabled: canAccessFile ? null : "disabled",
      "aria-label": canAccessFile ? "開啟教材" : "教材檔案暫無法開啟（請重新整理教材中心分頁後再試）",
      html: AHS.Icons.doc()
    });
    var dlBtn = el("button", {
      type: "button", class: "recent-card__act" + (canAccessFile ? "" : " is-disabled"),
      disabled: canAccessFile ? null : "disabled",
      "aria-label": canAccessFile ? "下載教材" : "教材檔案暫無法下載（請重新整理教材中心分頁後再試）",
      html: AHS.Icons.download()
    });
    if (canAccessFile) {
      docBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var url = URL.createObjectURL(item.file);
        window.open(url, "_blank");
      });
      dlBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var url = URL.createObjectURL(item.file);
        var a = document.createElement("a");
        a.href = url;
        a.download = item.fileName || item.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    }
    /* WO-008: when the file reference is genuinely gone (File objects
       can't survive a page's own PersistenceAdapter-backed hydration,
       per HOTFIX-001), the honest, correct behavior is a disabled
       control (aria-label explains why) — not a clickable button with
       a fake success message. Disabled buttons don't fire click events
       in a real browser, so no handler is attached in that case. */

    /* HOME-F008 acceptance: clicking the card opens the material.
       Kept as <article> (not <a>) because it contains <button>
       descendants — nesting interactive content inside an <a href>
       violates the HTML content model. Navigation uses the same plain
       location assignment an <a href> would perform; role="link" +
       tabindex + Enter/Space keydown preserve keyboard accessibility. */
    var href = "materials.html?id=" + encodeURIComponent(item.id);
    var cardEl = el("article", {
      class: "recent-card",
      role: "link",
      tabindex: "0",
      "data-href": href,
      "aria-label": subj.name + "《" + item.title + "》"
    }, [
      el("span", {
        class: "chip",
        style: "color:" + subj.hex + ";background-color:" + subj.hex + "1a"
      }, [el("span", { text: subj.name })]),
      el("h3", { class: "recent-card__unit", text: item.unit }),
      el("p", { class: "recent-card__title", text: item.title }),
      el("p", { class: "recent-card__meta", text: (item.grade || "") + subj.name + "｜" + item.teacher }),
      el("p", { class: "recent-card__last-opened", text: "上次開啟：" + item.lastOpened }),
      item.hasSummary
        ? el("a", { class: "recent-card__summary-badge", href: "summary.html?materialId=" + encodeURIComponent(item.id) }, [
            el("span", { html: AHS.Icons.summary() }),
            el("span", { text: "已生成學習總結" })
          ])
        : null,
      el("div", { class: "recent-card__progress" }, [
        el("div", { class: "recent-card__progress-head" }, [
          el("span", { text: "教材完成度" }),
          el("span", { class: "recent-card__pct", text: completionLabel })
        ]),
        el("div", {
          class: "progressbar",
          role: "progressbar",
          "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100"
        }, [
          el("div", {
            class: "progressbar__fill",
            style: "width:" + pct + "%;background-color:" + subj.hex
          })
        ])
      ]),
      el("div", { class: "recent-card__acts" }, [docBtn, dlBtn])
    ]);

    cardEl.addEventListener("click", function () {
      window.location.href = href;
    });
    cardEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = href;
      }
    });

    return cardEl;
  }

  /* create(model) — Sprint 6.6 WO-007: no Mock fallback anymore. model
     must be a real, fully-shaped object; js/pages/app.js always passes
     one (real data or an explicit empty shape). Missing/invalid input
     renders the Empty State rather than throwing. */
  function create(model) {
    var data = model || { title: "最近新增教材", items: [], emptyText: "目前近三日沒有新增教材" };
    var status = el("p", {
      class: "recent-materials__status", "aria-live": "polite", hidden: "hidden"
    });
    var items = (data && data.items) || [];

    /* Empty state reuses the existing .today-card__empty utility class —
       no new Empty UI is introduced, per HOME-F008 requirement. Sprint
       AI-122 AI-122-06: honest, context-specific copy (data.emptyText,
       "目前近三日沒有新增教材") — not the old generic "目前沒有教材",
       which would have misleadingly implied the Repository itself is
       empty rather than just "nothing new in the last 3 days". */
    var body = items.length
      ? el("div", { class: "recent-materials__list" },
          items.map(function (item) { return card(item, status); }))
      : el("p", { class: "today-card__empty", text: (data && data.emptyText) || "目前沒有教材" });

    /* Sprint AI-122 AI-122-09: 查看全部 previously href="#" — a real
       link, but one that navigates nowhere ("可點擊沒有事件" in spirit,
       even though it's technically a working anchor tag). Wired to the
       real 教材資料夾/Material Center entry point (materials.html) —
       every action button on this card is now either genuinely
       functional or honestly disabled, never a dead click. */
    return el("section", { class: "card recent-materials", "aria-label": (data && data.title) || "最近新增教材" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: (data && data.title) || "最近新增教材" }),
        el("a", { class: "card__more", href: "materials.html" }, [
          el("span", { text: "查看全部" }),
          el("span", { html: AHS.Icons.chevronRight() })
        ])
      ]),
      body,
      status
    ]);
  }

  return { create: create };
})();
