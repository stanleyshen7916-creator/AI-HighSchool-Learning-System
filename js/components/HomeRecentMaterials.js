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
    var pct = Math.max(0, Math.min(100, item.progress));

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
          el("span", { text: "學習進度" }),
          el("span", { class: "recent-card__pct", text: pct + "%" })
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
    var data = model || { title: "最近教材", items: [] };
    var status = el("p", {
      class: "recent-materials__status", "aria-live": "polite", hidden: "hidden"
    });
    var items = (data && data.items) || [];

    /* Empty state reuses the existing .today-card__empty utility class —
       no new Empty UI is introduced, per HOME-F008 requirement. */
    var body = items.length
      ? el("div", { class: "recent-materials__list" },
          items.map(function (item) { return card(item, status); }))
      : el("p", { class: "today-card__empty", text: "目前沒有教材" });

    return el("section", { class: "card recent-materials", "aria-label": (data && data.title) || "最近教材" }, [
      el("div", { class: "card__head" }, [
        el("h2", { class: "card__title", text: (data && data.title) || "最近教材" }),
        el("a", { class: "card__more", href: "#" }, [
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
