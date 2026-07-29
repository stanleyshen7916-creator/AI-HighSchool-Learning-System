# LearningHistoryDependencyAudit.md — Sprint AI-016

Legacy Dependency Audit for Learning History / Dashboard. Pure documentation — no code touched, nothing removed, nothing refactored. Every dependency below is grep-verified against real call sites.

## 1. Dashboard is entirely disconnected from every real Runtime — not a Legacy dependency, an absent one

| | |
|---|---|
| **File** | `js/pages/AppDashboard.js` (`init()`), `js/components/Dashboard.js` (`create()`) |
| **Function** | `AHS.Dashboard.create()` — called with no argument |
| **Dependency** | None — `dashboard.html` doesn't load `HistoryRuntime.js`, `StatisticsRuntime.js`, `WrongBookSession.js`, or `ReviewQueue.js` |
| **Purpose (historical)** | Pre-dates the entire Sprint 4+ Runtime track; `EO-S7.0-003 Production Cleanup` later removed its Mock dataset and replaced it with an honest, unconditional Empty State rather than wiring in real data — the wiring step was deferred, not completed. |
| **Production impact** | **Real**: the Dashboard page — named for exactly the kind of aggregate view a "Production Pipeline" diagram would end at — shows "尚無學習數據" unconditionally, for every user, regardless of how much real Exam or Practice/Production activity exists. This is honest (no fabricated numbers) but incomplete relative to the Sprint's Baseline diagram, which implies Dashboard is the pipeline's terminus. |

## 2. `QuizCenter.js`'s Exam Mode right-rail still falls back to static Mock history

| | |
|---|---|
| **File** | `js/components/QuizCenter.js` (`history()` function) |
| **Function** | `history(mockHistory)` |
| **Dependency** | `AHS.HistoryRuntime.list()`, falling back to a caller-supplied `mockHistory` array when empty |
| **Purpose (historical)** | Documented intentionally: *"falls back to the static Mock history otherwise, so a first-ever visit still shows example content."* |
| **Production impact** | **Real, minor inconsistency**: every other page's equivalent Mock fallback was removed by `EO-S7.0-003 Production Cleanup` (WrongBook, Dashboard, Review Home's `dueToday`, etc. all show honest Empty States instead of Mock content) — this one function in `QuizCenter.js`'s Exam Mode view was never revisited by that cleanup and still shows fabricated example rows when `HistoryRuntime` is empty. Not a crash risk, not a data-integrity issue (Mock rows are visually distinguishable content, not conflated with real records), but an inconsistency with the rest of the codebase's now-established "honest empty state" convention. |

## 3. `StatisticsRuntime` has exactly one real consumer, not Dashboard

| | |
|---|---|
| **File** | `js/components/QuizCenter.js` |
| **Function** | Quiz's own Exam Mode right-rail stat cards / accuracy donut |
| **Dependency** | `AHS.StatisticsRuntime.refresh()` / `.getSubject()`, both derived from `AHS.HistoryRuntime.list()` |
| **Purpose** | Sprint 4's original design — feed Quiz's own in-page statistics, not a site-wide dashboard. |
| **Production impact** | **None negative** — this is working as designed. Flagged here only because a natural assumption (that "Statistics" feeds "Dashboard") does not hold; confirmed via `grep -rln "AHS.StatisticsRuntime\."` returning only `QuizCenter.js`. |

## 4. `ai-engine/src/runtime/SummaryHistory.js` is a deliberately separate concept, not a dependency gap

| | |
|---|---|
| **File** | `ai-engine/src/runtime/SummaryHistory.js` |
| **Function** | Its own internal record-keeping, called from the AI Summary Pipeline (`EO-AI-006`), unrelated to this audit's Quiz/WrongBook/Review/History scope |
| **Dependency** | None on `AHS.HistoryRuntime` — explicitly, by design, per its own header comment |
| **Purpose** | Tracks Summary generation timestamps for the AI Summary track, a completely different feature area. |
| **Production impact** | **None** — included here only to close out this Sprint's "whether multiple History models exist" question with full evidence, not because it represents a gap. |

## Summary

No implementation-blocking Legacy dependency was found *inside* `HistoryRuntime.js` itself (it is small, self-contained, and functions exactly as designed for Exam Mode). The real findings are about what does **not** connect to it: Dashboard has zero wiring to any real Runtime (§1, the largest and most Sprint-relevant finding), and one stale Mock-fallback inconsistency remains in Quiz's own right-rail (§2). Both are documented, neither is removed or refactored here, per this Sprint's explicit Scope ("Audit only. No implementation.").
