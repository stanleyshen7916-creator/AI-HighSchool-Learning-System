/* js/pages/ReviewHome.js — Sprint 5 · EO-R001 / EO-R001A Review Home
   bootstrap.

   EO-R001A · PMO Option B ruling: Statistics and Recent Review are no
   longer static Mock. This file reads the existing, real
   AHS.HistoryRuntime.list() (already trusted elsewhere by Quiz Center's
   StatisticsRuntime) and derives:
     - 今日已完成 / 本週完成 — real counts of history records whose
       `when` date falls today / within the current calendar week
       (Monday-start).
     - Recent Review — the most recent history record (list() is already
       sorted newest-first), or null if there are none yet.
   No new Runtime is created, no Runtime API is modified, nothing is
   hardcoded or estimated:
     - 今日待複習 stays fixed at 0 — no due-date concept exists anywhere
       in the repository (same acknowledged gap as Wrong Book's
       今日待複習).
     - 花費時間 is never computed here — AutoGrader/HistoryRuntime carry
       no duration field at all; ReviewRecentSession.js renders "尚無資料"
       on its own.
   AHS.ReviewRuntime (build(examId)) is intentionally NOT used on this
   page — its shape only supports a single already-graded exam's detail
   view, which doesn't fit a Home page with no exam context. It remains
   reserved for Review Session / Review Result (per PMO ruling), and is
   still loaded in review.html so it initializes correctly (Acceptance:
   "ReviewRuntime 正常載入").

   Path/role note carried from EO-R001: page-content components live in
   js/components/ (repository convention) with this file as the thin
   bootstrap, matching js/pages/app-wrongbook.js's role. AppShell.js is
   mounted with a non-matching "review" active id since Review Center has
   no Bottom Navigation / Sidebar slot (Product Baseline's nav sets were
   not modified). */
window.AHS = window.AHS || {};
(function () {
  "use strict";

  /* Parses HistoryRuntime's "YYYY/MM/DD HH:MM" `when` string into a Date.
     Returns null (never throws) if the format is unexpected. */
  function parseWhen(when) {
    if (!when) { return null; }
    var m = /^(\d{4})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}))?/.exec(when);
    if (!m) { return null; }
    return new Date(
      parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10),
      m[4] ? parseInt(m[4], 10) : 0, m[5] ? parseInt(m[5], 10) : 0
    );
  }

  function isSameCalendarDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  /* Monday-start week boundary (no existing week-range convention is
     defined elsewhere in the repository for this to follow). */
  function startOfWeek(d) {
    var start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var offset = (start.getDay() + 6) % 7; // Mon=0 ... Sun=6
    start.setDate(start.getDate() - offset);
    return start;
  }

  /* deriveStats(historyItems) — real counts only, from real records. */
  function deriveStats(historyItems) {
    var now = new Date();
    var weekStart = startOfWeek(now);
    var doneToday = 0;
    var doneWeek = 0;

    historyItems.forEach(function (item) {
      var when = parseWhen(item.when);
      if (!when) { return; }
      if (isSameCalendarDay(when, now)) { doneToday += 1; }
      if (when >= weekStart) { doneWeek += 1; }
    });

    return {
      dueToday: 0, /* fixed — no due-date concept exists (PMO ruling) */
      doneToday: doneToday,
      doneWeek: doneWeek
    };
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    var historyItems = (AHS.HistoryRuntime ? AHS.HistoryRuntime.list() : []);
    var stats = deriveStats(historyItems);
    var mostRecent = historyItems.length ? historyItems[0] : null; // list() is newest-first

    var shell = AHS.AppShell.create(AHS.Mock, {
      active: "review",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    AHS.UI.mount(app, shell.root);

    var page = document.createElement("div");
    page.className = "rv-page";
    page.appendChild(AHS.ReviewHomeCard.create(stats));

    var row = document.createElement("div");
    row.className = "rv-row2";
    row.appendChild(AHS.ReviewQuickAction.create({}));
    row.appendChild(AHS.ReviewRecentSession.create(mostRecent, {}));
    page.appendChild(row);

    shell.main.appendChild(page);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
