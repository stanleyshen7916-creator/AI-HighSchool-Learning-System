# Release v1.0.0-MVP — AI High School Learning System

**Tag**: `v1.0.0-MVP` ｜ **Date**: 2026-07-29 ｜ **Type**: Release Candidate ｜ **Sprint**: RC-001

This is the Release Note/Changelog for the AI High School Learning System's first official MVP release, per `docs/PMO/PMO_Repository_Workflow_v1.0.md`'s requirement that every release carries a Release Note under `docs/Release/`. It also serves as Sprint RC-001's `ReleaseReport.md` deliverable.

## MVP Summary

The complete Production Learning Pipeline — `Material → AI Summary → Question → Quiz → WrongBook → Review → History → Dashboard` — is real and continuous end-to-end for the first time. This release consolidates the Discovery Phase (Sprints AI-015E through AI-017, culminating in the LOCKED `docs/Architecture/ProductionIntegrationBlueprint.md`) and the Implementation Phase (Sprints AI-018 through AI-020) that closed every gap the Blueprint identified, verified end-to-end by Sprint AI-021's Product Acceptance Test.

## Completed Modules

| Module | Status | Established in |
|---|---|---|
| Material → AI Summary | ✅ Production | Sprint AI-013 Beta Cutover (pre-existing baseline) |
| AI Summary → Question | ✅ Production | Sprint AI-015C (Question Provider Bridge) |
| Question → Quiz | ✅ Production | Sprint AI-015E (Quiz Production Cutover) |
| Quiz → WrongBook | ✅ Production | Sprint AI-015F / AI-015E's Identity Mapping |
| WrongBook → Review | ✅ Production | Sprint AI-018 (`review.html` wiring + `ReviewGeneratorRuntime` fix) |
| Review → History | ✅ Production | Sprint AI-019 (`LearningHistoryModel` Projection) |
| History → Dashboard | ✅ Production | Sprint AI-020 (Dashboard real-data wiring) |
| End-to-End verification | ✅ Complete | Sprint AI-021 (PAT — 57/57 real checks, 970/970 regression) |

## Known Limitations

Honestly disclosed, not fabricated or hidden — matching this project's standing "real data or an honest empty state, never fake content" rule:

- **Dashboard**: 6 of 9 display sections (學習趨勢／學習時間分布／學習進度 ring／知識點掌握度 Top10／今日任務／AI 學習建議) have no real Runtime data source anywhere in the repository and show an honest "尚無資料" placeholder rather than fabricated charts. Only 停 stat cards and 科目狀態 (subject mastery) are real-data-driven today.
- **`review.html`**: Exam Mode section (`ReviewHomeCard`/`ReviewQuickAction`/`ReviewRecentSession`) still falls back to a `HistoryRuntime`-only view; the newly-added `ReviewWidget` section is additive, not a redesign of the existing Exam Mode cards.
- **`QuizCenter.js`**: Exam Mode's own right-rail history list still falls back to static Mock content when `HistoryRuntime` is empty — a pre-existing inconsistency (flagged in Sprint AI-016/AI-017's audit, not resolved by this release; a documented, non-blocking cleanup item in `docs/Architecture/RemainingSprintRoadmap.md`).
- **Question variety**: Production questions are `single_choice` only (`QuestionGenerationRuntime`'s LOCK enum); the legacy 4-question-type generator (`QuestionGenerationFlow`) is no longer Quiz's trigger and is effectively retired from the live pipeline (still present in the repository, zero production callers).
- **Difficulty selection**: The Question Guide's difficulty picker UI is preserved but no longer drives generation (Sprint AI-015E MVP scope decision, difficulty enhancement deferred).
- **No LLM/AI generation**: consistent with this repository's entire history — all "AI" content is deterministic, template/rule-derived from real Knowledge Graph or Summary data, never a live model call.
- **Sessions are not durable across browser restarts** for several Runtimes (`QuestionGenerationRuntime`, `WrongBookRuntime`, `HistoryRuntime`, `ReviewRuntime`, `ReviewGeneratorRuntime` are memory-only, by original design) — `PersistenceAdapter`-backed Runtimes (`LearningQuestionSession`/`Runtime`, `WrongBookSession`, `ReviewQueue`) use `sessionStorage`, which clears when the browser tab/session ends (documented project constraint: "sessionStorage-backed runtime persistence").

## QA Summary

- `npm test` (BehaviorSuite + PipelineRegression): **181/181 PASS**
- `npm run verify` (VerifyPaths + VerifyForbiddenPatterns): **PASS** (1 pre-existing KNOWN-ISSUE, tracked, unrelated to this release)
- All 21 permanent regression suites: **789/789 PASS**
- **Grand total: 970/970 automated assertions PASS**

## PAT Summary (Sprint AI-021)

All 8 End-to-End PAT Scenarios passed via one continuous real user journey (real material, real button clicks, real data threaded through every stage): Material Learning, Question Generation, Quiz, Wrong Book, Review, History, Dashboard, End-to-End Data Flow. **57/57 real-evidence checks PASS**, zero console errors across every page touched, zero defects found. Full detail in `docs/QA/Sprint_AI_021_PATReport.md`.

## Architecture Discipline

Every gap the Blueprint identified was closed by reusing existing Runtimes/Projections/patterns already proven in this repository (`QuestionProviderBridge`, `QuizCenter.js`'s Identity Mapping, `ReviewModel.js`'s read-only Projection pattern, `StatisticsRuntime`'s shape-matching pattern) — zero new Runtime, zero Runtime API changes beyond one internal (non-signature) resolution fix in `ReviewGeneratorRuntime.js`, zero architecture redesign. Full detail in `docs/Architecture/ProductionIntegrationBlueprint.md` (LOCKED) and each Sprint's own `ImplementationReport.md`/`QAReport.md` under `docs/migration/` and `docs/QA/`.

## Changed Files (this Release)

See `ChangedFiles.txt` for the complete file-by-file list spanning Sprints AI-015F through RC-001.
