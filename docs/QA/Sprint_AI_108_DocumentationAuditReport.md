# Sprint AI-108｜Release Candidate — RC-04 Documentation Audit Report

## Scope

`docs/Architecture/` (Architecture_Repository_Structure_vNext.md, RuntimeInventory.md,
ComponentInventory.md, DataFlow.md, ExtensionPoints.md — the AI-104A Baseline set),
`docs/QA/` + `docs/migration/` (QA/PAT Sprint reports), and `docs/PMO/` (Version/Status
tracking files), checked for internal consistency with real repository state.

## Findings & Fixes

### 1. `docs/PMO/VERSION.json` — badly stale (Sprint 6.6, 2026-07-21)

Frozen at `v0.6.6-beta.5` / "Sprint 6.6", predating the entire AI-1xx Sprint series.
**Not fixed here** — this is RC-06's explicit job (Version Lock to `v1.0.0`); fixing it
in both RC-04 and RC-06 would be redundant. Flagged here, resolved there.

### 2. `docs/PMO/PROJECT_STATUS.json` — badly stale (Sprint 6.6, 2026-07-21)

Same staleness as VERSION.json, and not covered by RC-06 (which only updates VERSION.json).
**Fixed**: regenerated with real, current `runtimeIntegration` status (verified via this
Sprint's and Sprint AI-105/106/107's audits — e.g., Practice Mode's real Question Generation
Pipeline, WrongBook's real Practice/Exam-only sourcing, Dashboard's real Statistics/History
wiring, the AI-107 Folder-Optional fix), real `runtimePersistence.coveredRuntimes` (re-verified
by grepping every runtime file for `PersistenceAdapter` usage — `WrongBookSession` and
`ReviewQueue` are session-persisted and were missing from the old list; `WrongBookRuntime`/
`HistoryRuntime`/`ReviewRuntime`/`StatisticsRuntime` remain correctly memory-only), and current
`knownLimitations` (carrying forward the still-true Sprint 6.6-era limitations plus the AI
Gateway's non-deployment and the 28 documented-Foundation-code files from RC-01).

### 3. `docs/PMO/SPRINT.json` — stopped at Sprint AI-104A "IN PROGRESS"

Written by AI-104A itself, before Sprints AI-105 through AI-108 happened; its `history[]`
array was missing all four, and its Sprint AI-103 entry incorrectly still said "PENDING PMO
ACCEPTANCE (not pushed)" even though AI-103 was committed (with AI-104A/105) in `02c52e0`.
**Fixed**: appended AI-104A/105/106/107/108 history entries, corrected AI-103's status to
`LOCK`, updated `realRepositoryPosition` (added `folderScope` and `branchStatus` — the
branch-vs-`main` gap RC-03 documents — as real, current facts), updated `openItems` to the
Sprint AI-108-era actual open items (PMO Release Approval, the pending human merge, live
Pages re-verification) rather than the now-resolved AI-103-era ones.

### 4. `docs/Architecture/ComponentInventory.md` — stale after RC-01's own cleanup

Fixed in RC-01 itself (not duplicated here): `MaterialSubjectTabs` removed from the `js/ui/`
listing, `MaterialContentView` added, counts corrected 21→22→(post-RC-01 removal)→still 22
net (AI-105 +1, AI-107 −1).

### 5. `RuntimeInventory.md` / `DataFlow.md` / `ExtensionPoints.md` — checked, no changes needed

Specifically checked every `Folder`/`folderId` mention against AI-107's fix: none describe
Folder as a hard requirement in a way the fix now contradicts — all three documents describe
`FolderRuntime`/Folder Scope at a level (`"scopes every AI flow"`, `"Study Scope container"`)
that remains accurate after the fix (Folder still scopes real Folders' own nodes; it is the
*requirement* that changed, not the *concept*). `KnowledgeGraphRuntime`/
`KnowledgeExtractionRuntime`/`KnowledgePipeline` entries in `RuntimeInventory.md` describe
purpose/API/callers, none of which AI-107 changed (only an internal validation gate). No
edits needed.

### 6. `docs/QA/*.md` / `docs/migration/*.md` — Sprint reports, checked, consistent

Every QA/PAT report produced this session (AI-105 through AI-108) was written directly
against real, freshly-executed command output (never carried-forward estimates) — cross-
checked here for consistency: Sprint AI-107's Report states "1190/1190 PASS, zero drift from
AI-105" and Sprint AI-108's own RC-08 re-run (below) confirms the same baseline plus this
Sprint's own additive `FolderOptionalV1.js` suite. No contradictions found between reports.

### 7. Out of this Sprint's explicit scope, disclosed only

`docs/PMO/TASKS.json` (explicitly scoped `"sprint": "6.6"` — a historical snapshot of that
Sprint's own issue list, not a rolling tracker; rewriting it would misrepresent Sprint 6.6's
own history) and `docs/PMO/QA.json` (`lastUpdated: 2026-07-21`, ambiguous whether intended as
a rolling tracker or a Sprint-6.6 snapshot) were both left untouched — neither is named in
RC-04's explicit scope list (Architecture / Runtime Inventory / Component Inventory / Data
Flow / Extension Points / QA Reports / PAT Reports), and `ChangedFiles.txt` establishes this
repository's own precedent of keeping historical Sprint-scoped logs frozen rather than
retroactively rewritten. Flagged for a future Sprint's explicit attention if PMO wants a
rolling `QA.json` tracker going forward.

## Version/Status Consistency

After the fixes above, `docs/PMO/SPRINT.json` and `docs/PMO/PROJECT_STATUS.json` both now
correctly state `Sprint AI-108` / `Release Candidate — v1.0.0-rc1 prepared, awaiting PMO
Release Approval` as current status, consistent with each other and with this Release
Candidate Report. `docs/PMO/VERSION.json` is updated to match in RC-06 (below), completing
version/status alignment across all three files.

## Result: Documentation Audit **PASS**
