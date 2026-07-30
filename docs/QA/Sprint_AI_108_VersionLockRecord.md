# Sprint AI-108｜Release Candidate — RC-06 Version Lock Record

## Version

**v1.0.0** (previous: `v0.6.6-beta.5`) — recorded in `docs/PMO/VERSION.json`.

This is the first `v1.x` version this repository's `VERSION.json` has ever recorded; per
`CLAUDE.md`'s own documented version progression ("Prototype v0.x → Beta v1.x → Release
v1.x"), this Release Candidate marks the transition out of the Prototype/Beta phase.

## Commit Locked

`8e442ab` (Sprint AI-107) plus this Sprint's own commit (Repository Audit cleanup,
Documentation Audit, Release Notes, Version Lock, RC deliverables) on branch
`claude/code-usage-explanation-zyx8n3`.

## LOCK Scope

Per this Sprint's own explicit constraints ("不修改 Architecture／不修改 Runtime"), this
version bump **locks documentation and release state**, not new architecture — the
underlying Architecture/Runtime/Repository Baseline being locked was already established
and is unchanged by this Sprint:

| Item | LOCK Reference | Status |
|---|---|---|
| **Architecture** | `docs/Architecture/Architecture_Repository_Structure_vNext.md` (Sprint AI-104A) | LOCK — nine `js/` categories, `ai-engine/`'s real 60-file inventory, no `/import`/`/data` top-level folder authorized |
| **Runtime** | `docs/Architecture/RuntimeInventory.md` (Sprint AI-104A, entries unchanged by AI-105～AI-108) | LOCK — every Runtime's public API surface verified unchanged across this Sprint sequence; AI-107's fix touched internal validation logic only, zero signature changes (verified via a dedicated regression assertion in `FolderOptionalV1.js`) |
| **Repository Baseline** | `docs/Architecture/ComponentInventory.md` / `DataFlow.md` / `ExtensionPoints.md` (Sprint AI-104A, corrected by this Sprint's RC-01/RC-04 for real drift since — `MaterialSubjectTabs` removal, `MaterialContentView` addition) | LOCK, as corrected |

## What Changed Under This Version (for the record)

Per `docs/Release/Release_v1.0.md`: Sprints AI-103 (Content Import Runtime, built/tested,
not UI-wired) through AI-108 (this Sprint). Two real defects found and fixed (AI-107): the
Folder-Optional Knowledge Graph gate, and the mobile TopBar overflow. Zero new Runtime, zero
Runtime API change, zero architecture redesign across the entire sequence — confirmed by
every Sprint's own regression suite and this Sprint's Repository/Documentation Audits.

## Verification This LOCK Is Real (not asserted)

- `npm run verify` PASS (VerifyPaths + VerifyForbiddenPatterns — the structural/forbidden-
  pattern gates that would catch an unauthorized architecture change)
- All 27 regression suites PASS, including three suites (`KnowledgeExtractionV1.js`,
  `AnalysisPipelineIntegration.js`, `KnowledgeFoundationV1.js`) that explicitly assert every
  affected Runtime's public API keys are unchanged (`Object.keys(...)` equality checks)
- `FolderOptionalV1.js`'s own dedicated "Runtime Rules" section asserts
  `KnowledgePipeline`/`KnowledgeExtractionRuntime`/`KnowledgeGraphRuntime`'s public API
  shapes are byte-identical to their pre-AI-107 form

## Effective Immediately Upon This Sprint's Commit

`docs/PMO/VERSION.json`, `docs/PMO/PROJECT_STATUS.json`, and `docs/PMO/SPRINT.json` all now
consistently state `v1.0.0` / `Sprint AI-108` / `Release Candidate` as current — see Sprint
AI-108's Documentation Audit Report for the full consistency check.

## Next Version Gate

Per this Sprint's own closing instruction: no new feature planning until PMO grants v1.0.0
Release Approval. The next version number (`v1.0.0` final vs. a further `-rcN`) is a PMO
decision made after reviewing this Release Candidate's full deliverable set — not
predetermined here.
