# CHANGELOG (SSOT)

## v0.6.6-beta.5 — 2026-07-21 — Sprint 6.6 Runtime QA Final Bug Fix
Learning Center Runtime Integration (Issue #026, #027). Sprint 6.6
Runtime QA officially closed pending PMO confirmation. See
`Sprint6.6_Runtime_QA_Final_FIX_REPORT.md` and
`Sprint6.6_CHANGELOG_Final.md` for full detail.

## v0.6.6-beta.4 — 2026-07-21 — Sprint 6.6 Runtime QA Round 3 Bug Fix
Material Center Header Search (Issue #022), Format Filter (Issue #023),
Summary Detail content messaging (Issue #024), Interactive Component
Audit. See `Sprint6.6_Runtime_QA_Round3_FIX_REPORT.md`.

## v0.6.6-beta.3 — 2026-07-20 — Sprint 6.6 Runtime QA Round 2 Fix
Home Recent Material Action (Issue #016), Summary Detail deep-link
(Issue #021); Material Search (Issue #019) investigated, no fix needed.
See `Sprint6.6_QA_FIX_REPORT.md` (Round 3 section).

## v0.6.6-beta.2 — 2026-07-20 — Sprint 6.6 Runtime Integration Fix
Prototype Mock Cleanup (WO-007): removed remaining internal Mock
fallback code paths from Home's TodayMission/HomeRecentMaterials/
ContinueLearning/LearningTime components and their now-orphaned
mock-data.js entries. See `Sprint6.6_QA_FIX_REPORT.md` (Round 2
section).

## v0.6.6-beta.1 — 2026-07-20 — Sprint 6.6 GitHub QA Fix
WO-001 Home Runtime Integration, WO-002 Bulk Upload Metadata, WO-003
Summary Dropdown, WO-004 Quiz Runtime, WO-005 Learning Center tabs
(Disabled + Coming Soon), WO-006 Bulk Upload. See
`Sprint6.6_QA_FIX_REPORT.md`.

## v0.6.6-beta.0 — 2026-07-20 — HOTFIX-001 Runtime Persistence & Home Sync
PMO Decision 025 — Architecture Evolution v2.0. Established the
sessionStorage-based Persistence Adapter layer
(`js/core/PersistenceAdapter.js`) and wired
MaterialRuntime/KnowledgeRuntime/SummaryRuntime/LearningQuestionRuntime
to hydrate/persist through it. Reworked Home to read Runtime state at
init time instead of relying on shared JS context. See
`docs/qa/HOTFIX-001_Architecture_Update.md`.

## Sprint 6 (EO-S6-001 through EO-S6-007)
Material Parser → Knowledge Builder → Summary Generator → Question
Generator → Learning Pipeline → System Runtime Integration → End-to-End
Integration QA. See `docs/qa/` for the full per-EO QA trail.
