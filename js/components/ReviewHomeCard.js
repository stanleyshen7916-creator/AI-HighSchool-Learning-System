/* js/components/ReviewHomeCard.js — Sprint 5 · EO-R001 Review Home.
   Builds the Hero ("Review Center" / 開始今日複習) and the Statistics
   row (今日待複習 / 今日已完成 / 本週完成). UI Layout only — this Work
   Order explicitly forbids implementing Review Session, so no button
   here starts a real session; the Hero is a static intro block.

   Data note (EO-R001A · PMO Option B): Statistics are no longer static
   Mock. ReviewHome.js (the page bootstrap) reads AHS.HistoryRuntime.list()
   — the repository's existing real completion-history Runtime — and
   passes the derived numbers in here as `stats`. This component does no
   Runtime access itself and creates no data of its own.
   「今日待複習」has no due-date concept anywhere in the repository (same
   acknowledged gap as Wrong Book's 今日待複習) and is fixed at 0 per PMO
   ruling, not derived. If HistoryRuntime has no records yet (session
   just started), 今日已完成/本週完成 legitimately show 0 — expected
   behavior, not a bug.
   PascalCase component under window.AHS. */
window.AHS = window.AHS || {};
AHS.ReviewHomeCard = (function () {
  "use strict";
  var el = AHS.UI.el;

  var STAT_DEFS = [
    { key: "dueToday", icon: "clock", label: "今日待複習", unit: "題" },
    { key: "doneToday", icon: "check", label: "今日已完成", unit: "題" },
    { key: "doneWeek", icon: "fire", label: "本週完成", unit: "次" }
  ];

  function hero() {
    return el("section", { class: "card rv-hero", "aria-label": "Review Center" }, [
      el("div", { class: "rv-hero__body" }, [
        el("span", { class: "rv-hero__eyebrow", text: "Review Center" }),
        el("h1", { class: "rv-hero__title", text: "複習中心" }),
        el("p", { class: "rv-hero__subtitle", text: "開始今日複習" })
      ]),
      el("div", { class: "rv-hero__figure" }, [
        el("div", {
          class: "rv-hero__avatar qiaoqiao-bust qiaoqiao-bust--lg",
          html: AHS.Qiaoqiao.bust("gentle")
        })
      ])
    ]);
  }

  function statItem(def, stats) {
    var value = (stats && typeof stats[def.key] === "number") ? stats[def.key] : 0;
    var valueEl = el("strong", { class: "rv-stat__value", text: String(value) });
    return {
      key: def.key,
      valueEl: valueEl,
      el: el("div", { class: "rv-stat" }, [
        el("span", { class: "rv-stat__icon", html: AHS.Icons[def.icon]() }),
        el("div", { class: "rv-stat__meta" }, [
          el("div", { class: "rv-stat__row" }, [valueEl, el("span", { class: "rv-stat__unit", text: def.unit })]),
          el("span", { class: "rv-stat__label", text: def.label })
        ])
      ])
    };
  }

  function stats(statsModel) {
    var items = STAT_DEFS.map(function (def) { return statItem(def, statsModel); });
    return el("section", { class: "card rv-stats", "aria-label": "複習統計" },
      items.map(function (i) { return i.el; }));
  }

  /* create(statsModel) — statsModel: { dueToday, doneToday, doneWeek }
     (real numbers from ReviewHome.js / HistoryRuntime, dueToday always 0
     per PMO ruling). Returns a single wrapper node containing the Hero
     and the Statistics row, ready to append into the page's main content. */
  function create(statsModel) {
    return el("div", { class: "rv-home-group" }, [hero(), stats(statsModel)]);
  }

  return { create: create };
})();
