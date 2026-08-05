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

  /* deriveStats(historyItems, dueCount, masteredCount) — real counts
     only, from real records. Sprint AI-114 AI-905: doneToday/doneWeek
     moved to AHS.StatisticsRuntime.doneToday()/doneThisWeek() (Single
     Source — this file no longer keeps its own copy of the date math).
     Sprint AI-111 AI-609/AI-610: dueToday/masteredReview real via
     AHS.StatisticsRuntime.dueForReview()/masteredReviewItems() — the
     exact same rule js/components/WrongBook.js's own getMasteryStatus()
     already uses, not a second definition. */
  function deriveStats(dueCount, masteredCount) {
    return {
      dueToday: dueCount || 0,
      doneToday: (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.doneToday === "function")
        ? AHS.StatisticsRuntime.doneToday() : 0,
      doneWeek: (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.doneThisWeek === "function")
        ? AHS.StatisticsRuntime.doneThisWeek() : 0,
      masteredReview: masteredCount || 0
    };
  }

  /* buildPage() — real content only, called both on first load and again
     after a Review Session completes (Sprint AI-114 AI-901's own flow:
     完成 Session -> 更新 Statistics -> 更新 Review — every Runtime read
     here is fresh, so simply rebuilding this page re-reads the real,
     just-updated state; no separate "push" mechanism is needed). */
  function buildPage(shell) {
    var historyItems = (AHS.HistoryRuntime ? AHS.HistoryRuntime.list() : []);
    var wrongItems = (AHS.WrongBookRuntime ? AHS.WrongBookRuntime.list() : []);
    var dueItems = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.dueForReview === "function")
      ? AHS.StatisticsRuntime.dueForReview() : wrongItems;
    var masteredItems = (AHS.StatisticsRuntime && typeof AHS.StatisticsRuntime.masteredReviewItems === "function")
      ? AHS.StatisticsRuntime.masteredReviewItems() : [];
    var stats = deriveStats(dueItems.length, masteredItems.length);
    var mostRecent = historyItems.length ? historyItems[0] : null; // list() is newest-first

    var page = document.createElement("div");
    page.className = "rv-page";

    /* Platform Refactor Master (PAT 8/9/10): same real Tutor Context
       首頁/AI Tutor already share (Sprint AI-111), reused verbatim —
       renders nothing when there is no real data yet. */
    var tip = AHS.TutorContextTip && AHS.TutorContextTip.create({ page: "review" });
    if (tip) { page.appendChild(tip); }

    page.appendChild(AHS.ReviewHomeCard.create(stats));

    /* Sprint AI-114 AI-901: real Review Session mount point — 開始今日複習
       renders js/components/ReviewSession.js here, in place, instead of
       navigating to wrongbook.html. onComplete rebuilds the whole page
       so every stat (Statistics/首頁/Tutor/Review — AI-901's own flow)
       reflects the session's real results immediately. */
    var sessionSlot = document.createElement("div");
    page.appendChild(sessionSlot);

    var row = document.createElement("div");
    row.className = "rv-row2";
    row.appendChild(AHS.ReviewQuickAction.create(
      { dueToday: stats.dueToday, hasWrongItems: wrongItems.length > 0 },
      {
        onStartToday: function (count) {
          if (!AHS.ReviewSession || typeof AHS.ReviewSession.create !== "function") { return; }
          var sessionEl = AHS.ReviewSession.create({
            count: count,
            onComplete: function () {
              shell.main.innerHTML = "";
              shell.main.appendChild(buildPage(shell));
            }
          });
          if (sessionEl) {
            sessionSlot.innerHTML = "";
            sessionSlot.appendChild(sessionEl);
            /* Inline style (not the `hidden` attribute) — always wins
               over any stylesheet rule regardless of CSS specificity,
               avoiding the exact class of bug HOTFIX-006 fixed
               (.rv-row2 already declares its own `display: grid`). */
            row.style.display = "none";
          }
        }
      }
    ));
    row.appendChild(AHS.ReviewRecentSession.create(mostRecent, {}));
    page.appendChild(row);

    return page;
  }

  function init() {
    var app = document.getElementById("app");
    if (!app) { return; }

    var shell = AHS.AppShell.create(AHS.AppConfig, {
      active: "review",
      onNavigate: function () { /* Mock navigation — prototype. */ }
    });
    if (!shell) { return; } /* Sprint AI-119: not logged in — AppShell already redirected to login.html */
    AHS.UI.mount(app, shell.root);
    shell.main.appendChild(buildPage(shell));
  }

  function coreReady() {
    return !!(window.AHS && AHS.UI && typeof AHS.UI.el === "function" &&
              AHS.AppShell && typeof AHS.AppShell.create === "function");
  }

  /* EO-S7.0-HOTFIX-001 · Initialization Order gate: Browser -> window.AHS
     -> Core Runtime -> AppShell -> Page Runtime -> Component -> Render.
     Components are never created before AppShell's dependencies exist.
     On core-load failure (e.g. a 404'd script), show a diagnostic
     instead of a white page. */
  function guardedInit() {
    if (coreReady()) { init(); return; }
    var app = document.getElementById("app");
    if (app) {
      app.textContent = "系統資源載入失敗（js/core/UI.js 或 AppShell 未載入）。請重新整理；若持續發生，請回報 PMO 檢查部署檔案。";
    }
    if (window.console && console.warn) {
      console.warn("AHS core not ready — component mount aborted (EO-S7.0-HOTFIX-001 gate).");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardedInit);
  } else {
    guardedInit();
  }
})();
