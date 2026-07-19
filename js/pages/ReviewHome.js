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

   EO-S5-002 flag: that EO's "Review Runtime" section restates "所有資料
   由 ReviewRuntime 提供" / "不得建立第二份 Runtime" — the same framing
   already superseded by the PMO's Option B ruling on EO-R001A (nothing
   changed technically: ReviewRuntime.build(examId) still cannot
   aggregate). This file keeps the Option B architecture; "ReviewRuntime
   正常載入" / "Review Runtime 正常運作" are treated as confirming that
   architecture still functions, not as a mandate to revert it. Flagged
   for PMO in REPORT.md.

   Path/role note carried from EO-R001: page-content components live in
   js/components/ (repository convention) with this file as the thin
   bootstrap, matching js/pages/app-wrongbook.js's role.

   EO-S5-002: "review" is now a real Sidebar nav id (複習中心 was added to
   js/data/mock-data.js's nav.items and js/components/AppShell.js's
   ROUTES as part of the formal Sidebar IA). AppShell is mounted with
   active: "review" exactly as every other page mounts its own id — no
   workaround needed anymore.

   EO-S5-003 (WB-S5-002): 開始今日複習 and 錯題複習 must run genuinely
   different flows. This file now also reads AHS.WrongBookRuntime.list()
   — the existing, unmodified Wrong Book Runtime, read-only, same reuse
   pattern already used for HistoryRuntime — to give ReviewQuickAction.js
   a real hasWrongItems check for 錯題複習. dueToday (already computed
   below, fixed at 0) is passed through unchanged for 開始今日複習's own
   real check. No new Runtime, no Storage, no Architecture change. */
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
    var wrongItems = (AHS.WrongBookRuntime ? AHS.WrongBookRuntime.list() : []);

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
    row.appendChild(AHS.ReviewQuickAction.create(
      { dueToday: stats.dueToday, hasWrongItems: wrongItems.length > 0 },
      {}
    ));
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
