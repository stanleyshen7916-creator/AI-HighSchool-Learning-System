# Release v1.0 — AI High School Learning System

**Tag (proposed)**: `v1.0.0-rc1` ｜ **Date**: 2026-07-30 ｜ **Type**: Release Candidate ｜ **Sprint**: AI-108

This is the Release Note for the AI High School Learning System's v1.0 Release Candidate,
per `docs/PMO/PMO_Repository_Workflow_v1.0.md`'s requirement that every release carries a
Release Note under `docs/Release/`. It also serves as Sprint AI-108's RC-05 deliverable.
Building directly on `Release_v1.0.0-MVP.md` (Sprint RC-001) — this release consolidates
everything since: Sprints AI-100 through AI-108.

## Highlights

- **Material Center** — real upload (Markdown/text/image), search/filter/sort, Material
  Detail view (safe Markdown rendering, sandboxed-iframe HTML rendering, image preview),
  cross-page sync via `MaterialRuntime`. Verified via real-browser upload-through-preview
  flows (Sprint AI-105/AI-106/AI-107).
- **Summary** — real, rule-based Summary generation reading the Knowledge Graph
  (`KnowledgeSummaryRuntime` / `AITutorService`), honest per-section Empty State when a
  material's content doesn't yet support a given section — never fabricated.
- **AI Practice** — the real Production Question Pipeline
  (`KnowledgeGraphRuntime → QuestionGenerationRuntime → QuestionProviderBridge →
  LearningQuestionSession`), driven by the same real "產生 AI 題目" button end-to-end;
  **as of this release, works for every uploaded material — with or without an explicit
  Folder assignment** (Sprint AI-107 fix, see below).
- **Wrong Book** — sourced exclusively from real Practice/Exam submissions (no Mock/Seed
  data), live stats, favorite/redo actions, verified via a real answer→grade→WrongBook
  walkthrough.
- **Dashboard** — real Statistics + Learning History wiring, honest full-page Empty State
  until at least one real submission exists anywhere in the session; confirmed to read only
  pre-existing Runtimes (`StatisticsRuntime`/`LearningHistoryModel`) — no separate
  `DashboardRuntime` exists or was created.
- **Repository Baseline** — `docs/Architecture/Architecture_Repository_Structure_vNext.md`
  and its companion Runtime/Component Inventory, Data Flow, and Extension Points documents
  (Sprint AI-104A) now govern all Sprint planning, correcting stale documentation that had
  drifted since Sprint 6.6 (js/ was documented as 8 categories, actually 9;
  `ai-engine/` was documented as empty scaffolding, actually 60 real files).

## Fixed (AI-103 → AI-107)

- **AI-103 — Content Import Runtime**: `ImportValidator`/`MetadataParser`/`ContentLoader`/
  `ImportRuntime` (a pure coordinator, no internal store) — a folder-based bulk import path
  built and tested, reusing every existing Runtime's own write API (one small, additive
  `QuestionRuntime.importQuestions()` extension). No UI wiring yet, by design.
- **AI-104A — Repository Baseline Synchronization**: corrected two stale architectural
  claims (js/ category count, `ai-engine/`'s real size) that had misled multiple prior
  Sprint proposals into requesting already-existing Runtimes/folders.
- **AI-105 — Platform Integration & MVP Completion**: confirmed the full Material→Summary→
  Practice→WrongBook→Review→Dashboard chain has no real integration bugs; implemented
  Material Detail content rendering (`MaterialContentView.js`), the one genuinely missing
  piece, with XSS-safe rendering (sandboxed iframe for HTML, safe DOM construction for
  Markdown — verified via a dedicated regression suite including an explicit script-escape
  check).
- **AI-106 — Platform Acceptance Test (PAT-1)**: the first real-Chromium, real-upload,
  real-click, real-cross-page-navigation acceptance test — closing the gap the jsdom
  BehaviorSuite had explicitly disclosed as untested ("no real browser rendering... no
  cross-page navigation"). Found two real, previously-undetected issues (below).
- **AI-107 — Release Stabilization**: fixed both AI-106 findings.
  - **Folder-Optional fix (P0)**: materials uploaded without an explicit Folder — the
    default, most common real upload path — previously and silently never got a real
    Knowledge Graph built, permanently blocking AI Summary/Question generation with no
    error surfaced to the user. `KnowledgePipeline`/`KnowledgeExtractionRuntime`/
    `KnowledgeGraphRuntime` now correctly treat "no Folder" as a valid, deliberate unscoped
    Study Scope; materials that do have a Folder are provably unaffected (a dedicated A/B
    regression suite verifies byte-identical output either way, differing only in
    `folderId`).
  - **Mobile TopBar overflow fix (P3)**: the shared app shell's top bar overflowed
    horizontally by ~68px on phones ≤~400px wide, on every page. Fixed with a single
    `min-width: 0` CSS property; verified 0px overflow at 320px/375px, Desktop/Tablet
    layout confirmed unaffected.

## Known Limitations

Honestly disclosed, not fabricated or hidden — matching this project's standing "real data
or an honest empty state, never fake content" rule. All items below are pre-existing,
documented, and judged non-blocking for v1.0:

- **Summary Center's five sections** are mostly empty for real uploads because
  `MaterialParser`/`KnowledgeBuilder` remain Stub Implementations (no real PDF/document text
  extraction exists in this repository). Not a bug — documented architecture since Sprint 6.
- **AI Gateway** (`ai-engine/src/gateway/`) is code-complete in both this repository and the
  separate `AI-HighSchool-AI-Gateway` repository, but not deployed (missing Cloudflare
  credentials). Zero live network traffic occurs by design — the endpoint is empty by
  default. Optional, inert-until-configured; not a v1.0 blocker.
- **28 files** across `ai-engine/`'s Context/Prompt/Provider/Knowledge Foundation layers,
  `js/data/{MockData,ExamData,TasksData}.js`, `js/parser/AIProviderInterface.js`,
  `js/runtime/{AnswerBuilderRuntime,ExamBankRuntime}.js`, and AI-103's Content Import Runtime
  files are real, tested, PMO-documented Foundation/Interface-only code, deliberately not
  yet page-wired (see Sprint AI-108's Repository Audit Report for the complete, itemized
  list and rationale for each).
- **Dashboard**'s 學習趨勢／學習時間分布／學習進度 ring／知識點掌握度 Top10／今日任務／
  AI 學習建議 sections have no real Runtime data source anywhere in the repository and show
  an honest placeholder rather than fabricated charts (unchanged since the v1.0.0-MVP
  release).
- **No LLM/AI generation** — consistent with this repository's entire history, all "AI"
  content is deterministic, template/rule-derived from real Knowledge Graph or Summary data,
  never a live model call.
- **Sessions are not durable across browser restarts** for several memory-only Runtimes
  (`QuestionGenerationRuntime`, `WrongBookRuntime`, `HistoryRuntime`, `ReviewRuntime` — by
  original design); `PersistenceAdapter`-backed Runtimes (`MaterialRuntime`,
  `LearningQuestionSession`/`Runtime`, `WrongBookSession`, `ReviewQueue`, and others) use
  `sessionStorage`, which clears when the browser tab/session ends.
- **This release's branch has not yet been merged into `main`** (the GitHub Pages deploy
  source) — a human-authorized merge and a live-URL re-verification are required before this
  Release Candidate is actually publicly reachable. See Sprint AI-108's Build Consistency
  and GitHub Pages Verification Reports.

## QA Summary

- `npm test` (BehaviorSuite + PipelineRegression): **181/181 PASS**
- `npm run verify` (VerifyPaths + VerifyForbiddenPatterns): **PASS** (1 pre-existing
  KNOWN-ISSUE, tracked, unrelated)
- All 27 permanent regression suites: **1015/1015 PASS**
- **Grand total: 1190/1190 automated assertions PASS**
- Playwright real-browser PAT-1 (Sprint AI-106) re-run after fixes (Sprint AI-107):
  **124/125 PASS** (the one remaining item is a benign Chromium sandbox-enforcement
  console message confirming the XSS protection works correctly — not a defect)

Full detail in `docs/QA/Sprint_AI_106_PAT1_Report.md`, `docs/QA/
Sprint_AI_107_ReleaseStabilization_Report.md`, and Sprint AI-108's own RC-08 Final QA
section of `docs/QA/Sprint_AI_108_ReleaseCandidateReport.md`.

## Architecture Discipline

No new Runtime, no Runtime API surface change, no architecture redesign across AI-103
through AI-108 — every fix was a narrow, additive change at the exact point a real,
evidenced defect was found (matching this repository's "Reuse Before Create / Baseline
Lock" discipline). Full detail in each Sprint's own report under `docs/QA/` and
`docs/migration/`.
