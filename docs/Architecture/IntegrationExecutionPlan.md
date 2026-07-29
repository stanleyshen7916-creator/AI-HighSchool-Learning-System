# IntegrationExecutionPlan.md — Sprint AI-017

Defines the minimum implementation sequence to close every remaining gap identified in `ProductionIntegrationBlueprint.md`. No code is written here — this is execution planning only, per this Sprint's Forbidden list ("Implement code" is barred). Detailed per-Sprint definitions are in `RemainingSprintRoadmap.md`; this document explains *why* the sequence is ordered this way and what minimum footprint each step requires.

## What is already done (no further phases needed)

Boundaries 1-4 (`Material → AI Summary → Question → Quiz → WrongBook`) are Production-complete, validated with real evidence, and require zero further implementation. Any future Sprint touching these must treat them as LOCK unless new Repository evidence contradicts this Blueprint (per this Sprint's own PMO Decision section).

## What remains: 4 gaps, in dependency order

```
Gap 5a (review.html wiring)  ──┐
                                 ├── independent, can run in either order or in parallel
Gap 5b (ReviewGeneratorRuntime)─┘

Gap 6 (History Projection)  ──── must complete before Gap 7
        │
        ▼
Gap 7 (Dashboard wiring)  ──── depends on Gap 6's Projection existing
```

Gaps 5a and 5b share the "Review" boundary but are otherwise unrelated implementations (different pages, different Runtimes) — no dependency between them. Gap 7 strictly depends on Gap 6 because `AppDashboard.js` needs a Practice-Mode stats source to build the `model` object `Dashboard.js` already accepts, and that source is exactly what Gap 6 produces.

## Gap 5a — `review.html` Production Wiring

**Minimum footprint**: Script wiring (add `ReviewQueue.js`, `ReviewModel.js`, `WrongBookSession.js`, `LearningQuestionSession.js` — whichever `ReviewModel` actually needs at runtime — to `review.html`'s `<script>` list, following the exact precedent of Sprint AI-015C's materials.html wiring) + `AppReview.js`/`ReviewHomeCard.js` changes to read from `ReviewModel` alongside (not instead of) the existing `HistoryRuntime` read (Exam Mode history must stay — this is additive, not a replacement).

**Why this is the minimum**: `ReviewQueue` and `ReviewModel` are already correct and complete (Blueprint Boundary 5, Item 5) — no Bridge, no new Projection, no Runtime change needed. This is purely a wiring + display gap, the same shape of fix Sprint AI-015C already executed once (script tags) and Sprint AI-015E's Option A validated as the correct minimal-footprint pattern (compose existing pieces where the data already lives, rather than centralizing everything through one page).

**What must NOT change**: `ReviewQueue.js`, `ReviewModel.js`, `WrongBookSession.js` (all Forbidden-listed across every prior Sprint) — this phase only adds `<script>` tags and reads their existing Public APIs.

## Gap 5b — `ReviewGeneratorRuntime` Trigger + Identity Resolution

**Minimum footprint**: Two independent fixes, both narrow:
1. **Trigger**: add a call to `AHS.ReviewGeneratorRuntime.generateReview(materialId)` at a real point in materials.html's AI Tutor flow (candidate: alongside the Boundary 3 button composition, or wherever the AI Tutor panel is actually opened) — mirroring exactly how Sprint AI-015E composed `ensureQuestionSet()` + `bridge()` into one existing button handler.
2. **Identity resolution**: `ReviewGeneratorRuntime.generateReview()`'s internal `quizResult()`/`qr.getQuestion(entry.questionId)` lookup needs to resolve against `LearningQuestionSession`/`LearningQuestionRuntime` (which already hold the real `questionId` space `WrongBookSession` uses) instead of `QuestionGenerationRuntime` (which never did). This is a change **inside** `ReviewGeneratorRuntime.js`'s own resolution logic, not a Public API signature change — `generateReview(materialId)`'s external contract is unaffected. Precedent: `QuizCenter.js`'s `wrongBookQuestionId()` Identity Mapping already solved the identical class of problem (Sprint AI-015E), by reading the target store directly with a matching key rather than assuming a shared id.

**Why this is the minimum**: no new Runtime, no new Bridge type — reuses the exact Identity Mapping pattern already proven correct.

**What must NOT change**: `QuestionGenerationRuntime`, `WrongBookSession`, `LearningQuestionSession`/`LearningQuestionRuntime` Public APIs. `ReviewGeneratorRuntime`'s own Public API (`generateReview`/`getReview`/`getReviewByMaterial`/`getReviewByKnowledgeNode`/`clearReview`/`serialize`) stays exactly as-is — only its private internal resolution function changes.

## Gap 6 — Learning History Projection (Practice Mode)

**Minimum footprint**: One new, small, read-only Projection module (naming/location decided by the implementing Sprint, following `ReviewModel.js`'s exact placement convention in `js/runtime/`) that derives Practice-Mode "history" entries directly from `WrongBookSession`'s existing fields (`firstWrongAt`, `lastWrongAt`, `wrongCount`, `masteryLevel`) — **no new write path, no new stored schema**, purely derived per call, exactly like `ReviewModel.js`'s own getters.

**Why a Projection, not a new Runtime**: `WrongBookSession` already carries every field a "did the student study this" record needs. Building a second, persisted `LearningHistoryRuntime` would duplicate data that already exists and risk the two falling out of sync — the same reasoning `ReviewModel.js`'s own header already documents for why it re-derives rather than stores ("Mastery Progress: 不得永久儲存").

**What must NOT change**: `WrongBookSession`, `ReviewQueue`, `HistoryRuntime` (Exam Mode's own history stays exactly as-is — this Projection is additive, a new read surface, not a replacement or merge).

## Gap 7 — Dashboard Real-Data Wiring

**Minimum footprint**: `AppDashboard.js` only. Add the missing `<script>` tags (`HistoryRuntime.js`, `StatisticsRuntime.js`, `WrongBookSession.js`, `ReviewQueue.js`, plus Gap 6's new Projection module) to `dashboard.html`, then change `AppDashboard.js`'s `init()` to build a real `model` object (Exam stats from `StatisticsRuntime.refresh()`, Practice stats from Gap 6's Projection) and pass it to the **already-existing, unmodified** `AHS.Dashboard.create(model)`.

**Why this is the minimum**: `Dashboard.js` needs zero changes — its `create(model)` branch for real data already exists and was built for exactly this purpose (`EO-S7.0-003`'s own comment: "Until real analytics derive from the Runtimes, the page shows the 正式 Empty State" — implying the real-data path was always intended to be wired in later). This phase is the "later."

**What must NOT change**: `Dashboard.js` (zero changes needed — do not touch its rendering logic or `create(model)` signature), `StatisticsRuntime` (already correct, reuse as-is).

## Secondary, non-blocking cleanup item (not a pipeline gap)

`QuizCenter.js`'s Exam Mode `history()` function's static-Mock fallback (Blueprint's cross-cutting finding) can be resolved independently, in any phase or its own trivial cleanup Sprint — replacing the Mock fallback with the same honest Empty State pattern already used everywhere else. Zero dependency on Gaps 5-7.
