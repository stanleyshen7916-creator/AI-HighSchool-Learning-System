# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static, client-side prototype of a Chinese-language high-school AI learning platform (`index.html`, `materials.html`, `quiz.html`, `wrongbook.html`, `summary.html`, `learning.html`, `tutor.html`, `dashboard.html`, `review.html`, `qiaoqiao-gallery.html`). Pure HTML5 / CSS3 / vanilla JavaScript — **no framework, no bundler, no Node server, no Docker**. All Runtime/UI/page data is still Mock Data. Must keep working over `file://` and on GitHub Pages.

**Sprint AI-126B exception (PMO-authorized, 2026-08-07)**: the project now has exactly one real backend connection point — `js/repository/` + `js/core/SupabaseClient.js` (the Repository Layer, talking to the real Supabase project provisioned in Sprint AI-126A). This is a narrow, explicit exception, not a general relaxation: every Runtime/UI/page file is still Mock Data only and still fully bound by every rule below (including the `fetch(`/`XMLHttpRequest` ban) until a future, separately-authorized Runtime Integration phase wires a Runtime to the Repository Layer. See `scripts/verify/VerifyForbiddenPatterns.js`'s `AUTHORIZED_EXCEPTIONS` for the exact two files this covers.

## Commands

```bash
npm test              # jsdom BehaviorSuite + Learning Pipeline regression (tests/jsdom, tests/regression)
npm run verify         # VerifyPaths (broken/legacy href-src refs) + VerifyForbiddenPatterns (banned APIs)
npm run validate:html  # html5validator over every root HTML page (requires html5validator + Java installed separately, not via npm)
npm run test:supabase  # Sprint AI-126B Repository Smoke Test — the one test making a real network call to Supabase; requires js/data/SupabaseConfig.js url/anonKey to be set, reports SKIP (not FAIL) otherwise; not part of npm test's default chain
```

There is no build/dev-server script by design — open the HTML files directly or serve the repo root as static files. To run a single jsdom check, edit/read `tests/jsdom/BehaviorSuite.js` (checks accumulate in one file, run via `node tests/jsdom/BehaviorSuite.js`) or `tests/regression/PipelineRegression.js` directly with `node`.

## Architecture

### Script loading model
No ES modules, no imports/exports. Every JS file attaches to a single shared global namespace, `window.AHS`, and files are loaded via manually-ordered `<script>` tags in each HTML page's `<body>`. Order matters: dependencies must load before dependents (see `index.html` for the canonical order — core → data/utils → runtime → ui → components → page bootstrap). When adding a new file, add its `<script>` tag in the correct dependency position in every HTML page that uses it.

### `js/` — nine fixed categories (do not mix)
- `core/` — namespace/shared services: `UI.js` (DOM helpers), `Icons.js`, `Qiaoqiao.js` (mascot art builder — image paths must go through its `EXPR_BASE`/`POSE_BASE` constants only), `PersistenceAdapter.js` (sessionStorage-backed runtime persistence; **not** localStorage — that's a forbidden pattern), `SupabaseClient.js` (Sprint AI-126B — the one file allowed to call `fetch(` against the real Supabase project; never called directly by a Runtime, only by `js/repository/`)
- `repository/` — Sprint AI-126B: the sole entry point for real backend I/O (`Repository.js` abstract interface, `SupabaseRepository.js` implementation, `RepositoryFactory.js` provider switch — keeps a future `LocalRepository` swappable). No Runtime, UI, or page file may import/call `js/core/SupabaseClient.js` directly — only through this layer.
- `runtime/` — stateful business-logic modules, one per domain (MaterialRuntime, KnowledgeRuntime, SummaryRuntime, QuestionRuntime, ReviewRuntime, WrongBookRuntime, ExamRuntime, StatisticsRuntime, AITutorRuntime, etc.)
- `parser/` — the document-processing pipeline chain: `MaterialParser` → `KnowledgeBuilder` → `SummaryGenerator` → `QuestionGenerator` → `LearningPipeline`. These are currently **stub implementations** (no real PDF/text extraction) — sparse output from this chain is expected, not a bug, unless a task says otherwise.
- `pages/` — one bootstrap file per HTML page (`AppHome.js`, `AppMaterials.js`, `AppQuiz.js`, ...), each the last `<script>` loaded on its page
- `components/` — feature components bound to a specific page/context (MaterialCenter, QuizCenter, WrongBook, Dashboard, AiTutor, TodayMission, StudyStats, ...)
- `ui/` — reusable, context-independent widgets (AppShell, MaterialCard/Grid/Filter/Preview, QuestionCard, upload dialogs, ...)
- `data/` — static mock data / config only (MockData, ExamData, QuotesData, TasksData, AppConfig)
- `utils/` — small stateless helpers (DateUtils, Greeting, Quote, Countdown, TaskUtils)

Rule of thumb for `components/` vs `ui/`: if it's tied to one page's feature it's a component; if it's a reusable control/card/dialog/shell usable across pages it's `ui/`.

### `css/`
`base/` (tokens.css, layout.css) — `components/` (shared component CSS) — `pages/` (one kebab-case file per page, never mixed across pages) — `utilities/` (reserved for helper/animation/spacing classes; stays empty until something actually needs it — don't pre-create files here).

### Placeholder directories — do not populate without explicit instruction
`ai-engine/`, `platform/`, `shared/` exist only as empty `.gitkeep` scaffolding for a future real backend/AI-engine layer. They are not wired into any page and are not part of the current runtime. Do not add code to them speculatively.

### Naming and forbidden patterns (enforced by `npm run verify`)
- JS: PascalCase filenames. CSS: kebab-case. Markdown docs: `PMO_` / `EO_` / `QA_` / `PAT_` / `Decision_` / `Release_` / `Architecture_` prefixes.
- Forbidden in production JS: `localStorage`, `indexedDB`, `fetch(`, `XMLHttpRequest`, `import`/`export` statements, `window.location.href =` (one pre-existing, tracked exception in `HomeRecentMaterials.js`). **`fetch(` exception (Sprint AI-126B, PMO-authorized)**: `js/core/SupabaseClient.js` and `js/repository/SupabaseRepository.js` only — these two files exist specifically to talk to the real Supabase backend; every other file remains fully forbidden from `fetch(`/`XMLHttpRequest`, including every Runtime and every `js/pages/`/`js/components/`/`js/ui/` file.
- Forbidden in CSS: `linear-gradient(...var(...))`, `calc(var(...) +/- var(...))`, `env(safe-area...)`, `inset:`, `NNdvh`.
- Every `src=`/`href=` in every root HTML page must resolve to a real file; references to legacy pre-v2.0 paths (`js/services/`, `css/layout/`, `assets/illustrations/`, `archive/`, `prototype/`, `developer/`) fail verification.
- Full structural rules are LOCKed in `docs/Architecture/Architecture_Repository_Structure_v2.1.md` — read it before restructuring anything; changes to the top-level structure require PMO sign-off per that doc.

## Development Workflow

This repo follows a documented human/AI role split (`docs/PMO/PMO_Repository_Workflow_v1.0.md`, `PMO_Claude_Workspace_Workflow_v1.0.md`): a PO/GPT role owns product planning, architecture, sprint planning and QA and hands down a Task; Claude's scope is implementing that task in HTML/CSS/JS/components/mock data; a human developer owns the actual `git commit`/`push`. Practically, this means:
- Implement the requested task's file changes; don't unilaterally change repository structure, workflow docs, or product requirements.
- Don't modify `docs/PMO/`, `.github/`, or the repo root layout unless the task explicitly calls for it.
- Sprint/EO (Executive Order) status is tracked in `docs/PMO/SPRINT.json`, `PROJECT_STATUS.json`, `VERSION.json`, and `docs/EO/*.md` — check these for current sprint context, but treat them as a snapshot that can lag behind `git log`.
- Version progression is Prototype `v0.x` → Beta `v1.x` → Release `v1.x`; every release needs a Release Note/Changelog under `docs/Release/`.

## Git Workflow

- Single branch in active use: `main` (also the GitHub Pages deploy source). `develop` and `feature/*` are reserved for future use, not currently active.
- Standard loop: pull latest → make changes → run `npm run verify` and `npm test` → commit → push → GitHub Pages auto-deploys → QA pass → issue/next task.
- Any structural change must pass both `npm run verify` (VerifyPaths + VerifyForbiddenPatterns) and `npm test` before it's considered deliverable.

## QA Checklist

Before considering a change done, verify (per `README.md` "品質狀態" and `docs/PMO/QA.json`):
- [ ] `npm run verify` passes (0 broken paths, 0 legacy-path references, 0 forbidden-pattern hits)
- [ ] `npm test` passes (jsdom BehaviorSuite + pipeline regression — 0 console errors across all pages)
- [ ] `npm run validate:html` passes (html5validator, if the tool is installed locally)
- [ ] No dead code, unused CSS, or unused JS introduced
- [ ] No fabricated/mocked-as-real content — stub limitations (e.g. sparse Summary Center output) must be surfaced honestly (empty state / "coming soon"), not faked
- [ ] Manual review sweep: UI, UX, responsive layout, functional behavior, and accessibility, across every page touched

## Commit Message Rules

`docs/PMO/PMO_Commit_Message_Rule_v1.0.md` documents a conventional-commit-style prefix scheme (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `test:`, `release:`). In practice, `git log` shows the project has never followed this — actual commits use a date + Sprint/EO label style instead, e.g.:

```
07/26 Sprint 9｜MVP Development
Sprint 8.3 AI Tutor Runtime Foundation Complete
Sprint 7.0｜EO-S7.0-HOTFIX-002｜Git Case-only Rename Repair（ui/greeting/countdown/quote → PascalCase）｜2026-07-22
```

Match the observed convention (`<Sprint/EO/Hotfix label>｜<short description>`, optionally date-prefixed) unless a human explicitly asks you to switch to the documented `feat:`/`fix:` scheme.
