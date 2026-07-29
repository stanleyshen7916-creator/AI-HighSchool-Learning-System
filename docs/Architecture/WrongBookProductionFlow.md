# WrongBookProductionFlow.md — Sprint AI-015F Part A

Repository Audit of the complete WrongBook architecture. Pure documentation — no code touched. Every claim below is taken from reading `js/runtime/WrongBookRuntime.js`, `js/runtime/WrongBookSession.js`, `js/parser/WrongBookGenerator.js`, `js/components/WrongBook.js`, `js/pages/AppWrongBook.js`, `js/runtime/ReviewQueue.js`, `js/runtime/ReviewModel.js`, `js/runtime/ReviewGeneratorRuntime.js` in full, plus `grep`-verified `<script>` wiring on `quiz.html`/`wrongbook.html`/`materials.html`/`review.html` — not inferred from this Sprint's Baseline diagram. Per this track's established rule ("Repository Truth > PMO Assumption"), every place the real code differs from the spec's diagram is called out explicitly.

There is **no separate "WrongBook Model" file** — confirmed via repository-wide search (`find . -iname "*wrongbook*"`). The WrongBook surface is exactly: `WrongBookRuntime.js`, `WrongBookSession.js`, `WrongBookGenerator.js`, plus the UI/page pair `WrongBook.js` + `AppWrongBook.js`.

## 1. WrongBookGenerator (`js/parser/WrongBookGenerator.js`, Sprint 7.0 · EO-S7.0-001)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | `AHS.LearningQuestionSession` (read-only) — resolves `correctAnswer`, `subject`, `knowledgePoint`, `difficulty`, `questionType`, `explanation`, `traceability`, `materialId`, `chapter`, `section` from the real Session record. `add()` accepts ONLY `{questionId, userAnswer}`; every other field is looked up, never caller-supplied. |
| **Read Path** | `questionFor(questionId)` → `AHS.LearningQuestionSession.getById(questionId)`. No other read source. |
| **Write Path** | `add()`/`update()`/`remove()` all call `AHS.WrongBookSession.store()` / `.removeById()`. This is the **only** write path into `WrongBookSession`. |
| **Identity Mapping** | `questionId` is whatever id the caller passes in `add({questionId, userAnswer})` — as of Sprint AI-015E, `QuizCenter.js` supplies the `LearningQuestionSession` sibling id (resolved via its own Identity Mapping from a displayed `LearningQuestionRuntime` record), not a raw Runtime id. `WrongBookGenerator` itself has no mapping logic of its own — it trusts the caller's `questionId` to already be a real `LearningQuestionSession` id, and simply rejects (`questionFor()` returns `null` → `add()` returns `null`) when it isn't. |
| **Runtime Dependency** | `AHS.WrongBookSession` (write target), `AHS.LearningQuestionSession` (read source), `AHS.LearningQuestionGenerator` (only for its `QUESTION_TYPES`/`DIFFICULTIES` enums, used in `validate()`). **Zero reference to `AHS.WrongBookRuntime`** — confirmed in code and stated explicitly in the file's own header: *"It never touches LearningQuestion-Runtime, Material/Summary Runtimes, the Parser chain, or the legacy Sprint-4 WrongBookRuntime."* |

Duplicate handling (real, not assumed): `add()` looks up `session.getByQuestionId(question.id)`; if found, `wrongCount += 1`, `lastWrongAt` refreshed, `masteryLevel` reset to `"new"`, `firstWrongAt` never overwritten. If not found, a new record is created (`id: "wb_" + Date.now() + "_" + seq`).

## 2. WrongBookSession (`js/runtime/WrongBookSession.js`, Sprint 7.0 · EO-S7.0-001)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | Whatever `WrongBookGenerator` passes to `store()` — the Session has no read source of its own; it is a pure validate-gated store. |
| **Read Path** | `list()`, `getById()`, `getByQuestionId()`, `findBySubject()`, `findByStatus()`, `statistics()` (derived on every call, never cached). |
| **Write Path** | `store(record, validateFn)` — re-runs `WrongBookGenerator.validate()` (or a caller-supplied `validateFn`) as its own gate; `removeById(id)`. **These two functions are, by architecture, called only by `WrongBookGenerator`** — no other file in the repository calls `AHS.WrongBookSession.store(` directly (confirmed by grep). |
| **Identity Mapping** | Own `id` is `WrongBookGenerator`'s `"wb_" + Date.now() + "_" + seq`; `questionId` field is a `LearningQuestionSession` id, verbatim. |
| **Runtime Dependency** | `AHS.PersistenceAdapter` (persists under key `"wrongBookSession"`, sessionStorage-backed). No dependency on `WrongBookRuntime`, `LearningQuestionRuntime`, or any Exam-mode Runtime. |

## 3. WrongBookRuntime (`js/runtime/WrongBookRuntime.js`, Sprint 4)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | Historically: `AutoGrader.grade()`'s graded result (Exam Mode). As of Sprint 7.0 (EO-S7.0-002), **also** `AppWrongBook.js`'s page-load bridge (see §4) — a second, real write source this Sprint's Baseline diagram does not show. |
| **Read Path** | `list()`, `getById()`, `isEmpty()`. This is the **sole data source `js/components/WrongBook.js` reads** — the file's own comment states it as a PMO ruling: *"wrong-question records always come from AHS.WrongBookRuntime... Runtime is Source of Truth."* |
| **Write Path** | `sync(gradedResult)` — called by `QuizCenter.js`'s `finishExam()` after `AutoGrader.grade()` (Exam Mode), **and** by `AppWrongBook.js`'s `bridgeSessionIntoSprint4Runtime()` on every `wrongbook.html` load (see §4). Same `sync()` function, two real callers. |
| **Identity Mapping** | `questionId` field holds either an Exam-mode `QuestionRuntime` question id (Loop A) or, since the bridge exists, a `LearningQuestionSession` id (Loop B, mirrored). The two id spaces use different prefixes and never collide in practice, but `WrongBookRuntime`'s schema does not distinguish provenance — a `questionId` here is only unambiguous in combination with which caller wrote it. |
| **Runtime Dependency** | None — plain in-memory store (`store = {items:[], seq:0}`), no `PersistenceAdapter`, resets on reload. Every page that displays it (`wrongbook.html`) must re-run whatever populates it (Exam sync never persists across reload either — Exam Mode data is genuinely session-only by design). |

**Real architecture correction to this Sprint's Baseline diagram**: the diagram shows a single linear `WrongBookGenerator ↓ WrongBookRuntime`. That edge does not exist in `WrongBookGenerator.js` — confirmed zero reference. What actually exists is `WrongBookGenerator → WrongBookSession` (Sprint 7.0, real production writes) as one path, and a **separate, page-load-triggered bridge function in `AppWrongBook.js`** — not `WrongBookGenerator` — that mirrors `WrongBookSession`'s content into `WrongBookRuntime` so the legacy Sprint-4 UI component can display it. See §4.

## 4. The real bridge: `AppWrongBook.js`'s `bridgeSessionIntoSprint4Runtime()`

```
wrongbook.html load
        │
        ▼
bridgeSessionIntoSprint4Runtime()          [js/pages/AppWrongBook.js, NOT WrongBookGenerator]
        │  reads AHS.WrongBookSession.list() (every real v1.0 record)
        │  resolves question text/options via AHS.LearningQuestionSession.getById(wb.questionId)
        │  for each record: missing = wb.wrongCount − (WrongBookRuntime's current errorCount for that questionId)
        │  calls AHS.WrongBookRuntime.sync(...) exactly `missing` times (idempotent delta, never over-duplicates)
        ▼
AHS.WrongBookRuntime (now mirrors Session's real content)
        │
        ▼
AHS.WrongBook.create()                      [reads WrongBookRuntime.list() ONCE, at mount]
```

This bridge calls `WrongBookRuntime.sync()` — the **same, existing, unmodified Public API** `AutoGrader.grade()` already used; no new write method was added for this purpose. It is real, already-shipped code (Sprint 7.0 · EO-S7.0-002), not something this Sprint needs to build.

## 5. The "Retry Flow" — `WrongBook.js`'s own in-page review session (WB-004/007/008)

Real, existing capability, entirely inside `wrongbook.html` (distinct from `review.html`): `立即重做` / `開始複習` / `全部重新複習` all funnel into `startReviewSession(queue)`. On each answered question, `syncV1OnReviewResult(item, wasCorrect, selectedKey)` runs:

- **Correct** → `AHS.WrongBookGenerator.update(rec.id, {masteryLevel: next})` — promotes one step up the fixed ladder (`new → learning → reviewing → mastered`).
- **Wrong** → `AHS.WrongBookGenerator.add({questionId: item.questionId, userAnswer})` — same duplicate-handling path as §1 (`wrongCount += 1`, demoted to `"new"`).
- Either branch, if a real v1.0 record existed (`session.getByQuestionId(item.questionId)` found something) → `AHS.ReviewQueue.enqueue({questionId, masteryLevel, priority: wrongCount, nextReviewAt})`.
- **No matching v1.0 record** (a record that only ever existed via the Sprint-4 Exam path, or a stale bridge mirror) → *silently skipped*, per the function's own comment ("查無對應 v1.0 記錄（legacy 資料）則安靜略過") — never fabricated, never thrown.

This retry path writes to `WrongBookSession` (via the same `WrongBookGenerator` Interface as §1 — no bypass) and `ReviewQueue`. It does **not** call `WrongBookRuntime.sync()` directly — the on-screen `item`/`row` (Runtime-shaped, from the initial mount snapshot) is patched locally for immediate UI feedback, and the next full `wrongbook.html` page load reconciles `WrongBookRuntime` again via §4's bridge.

## 6. ReviewQueue (`js/runtime/ReviewQueue.js`, Sprint 7.0 · EO-S7.0-001)

| Aspect | Repository Truth |
|---|---|
| **Data Source** | Whatever caller supplies to `enqueue({questionId, nextReviewAt, priority, masteryLevel})` — `WrongBookGenerator`'s callers (`QuizCenter.js`'s `wrongBookHook()`, `WrongBook.js`'s `syncV1OnReviewResult()`) are the only real callers. |
| **Read Path** | `list()`, `count()`, `getByQuestionId()`. |
| **Write Path** | `enqueue()` — validate-gated: `questionId` must resolve to a real `AHS.WrongBookSession.getByQuestionId()` entry, or the enqueue is rejected (`"questionId 未對應任何錯題紀錄（不得直接產生 Review）"`). One entry per `questionId` (re-enqueue replaces, never accumulates duplicates). |
| **Identity Mapping** | `questionId` is the same `LearningQuestionSession` id `WrongBookSession` uses — direct passthrough, no separate mapping. |
| **Runtime Dependency** | `AHS.WrongBookSession` (validation only, read-only), `AHS.WrongBookGenerator` (only for its `MASTERY_LEVELS` enum), `AHS.PersistenceAdapter` (key `"reviewQueue"`). **Zero dependency on `WrongBookRuntime`.** |

## 7. ReviewModel (`js/runtime/ReviewModel.js`, Sprint 7.0 · EO-S7.0-001)

Read-only query layer. Header states its own lineage precisely: `WrongBookSession ─▶ ReviewQueue ─▶ ReviewModel(read-only)`. Reads `AHS.WrongBookSession` (record resolution, mastery statistics) and `AHS.ReviewQueue` (queue entries) exclusively. Its one write-adjacent function, `setNextReview()`, routes exclusively through `AHS.WrongBookGenerator.update()` + `AHS.ReviewQueue.enqueue()` — its own header states it "never直接修改 WrongBookSession". **Zero dependency on `WrongBookRuntime`.**

## 8. A fourth consumer worth naming: `ReviewGeneratorRuntime` (`materials.html`, Sprint 8.2)

Not named in this Sprint's Baseline but real and relevant: `materials.html`'s AI Tutor review panel reads `AHS.WrongBookSession.list()` directly (read-only), feeding `AITutorRuntime.getReviewList()`. `materials.html`'s own `<script>` list does **not** load `WrongBookRuntime.js` at all — confirmed via grep — so Loop C (Material AI) never touches the Sprint-4 Runtime, only the real v1.0 `WrongBookSession`.

## 9. Confirmed script wiring (no assumptions, `grep`-verified)

| Page | Loads `WrongBookRuntime.js` | Loads `WrongBookSession.js` + `WrongBookGenerator.js` | Loads `ReviewQueue.js` |
|---|---|---|---|
| `quiz.html` | ✅ (Exam Mode `sync()`) | ✅ (Practice Mode `add()`, via `QuizCenter.js`'s Identity Mapping since Sprint AI-015E) | ✅ |
| `wrongbook.html` | ✅ (bridge target + `WrongBook.js`'s sole read source) | ✅ (bridge source + retry-flow writes) | ✅ |
| `materials.html` | ❌ | ✅ (`ReviewGeneratorRuntime` read-only) | ❌ |
| `review.html` | ✅ (`AppReview.js` reads it directly, per Sprint AI-015A's finding) | ❌ | ❌ |

## 10. Summary diagram (Repository Truth, supersedes this Sprint's Baseline diagram for the WrongBook segment)

```
Quiz (quiz.html, Practice Mode, read-only per Sprint AI-015E)
        │  wrong answer, questionId resolved via QuizCenter.js's
        │  own read-only Identity Mapping (Runtime record -> Session sibling id)
        ▼
WrongBookGenerator.add({questionId, userAnswer})     [Interface, sole writer]
        │  reads LearningQuestionSession (content resolution)
        ▼
WrongBookSession (v1.0 store, PersistenceAdapter-backed)
        │                                   │
        ▼                                   ▼
ReviewQueue.enqueue()              AppWrongBook.js's bridge (page-load only)
        │                                   │
        ▼                                   ▼
ReviewModel (read-only)            WrongBookRuntime.sync()  [existing Sprint-4 API,
        │                                   │                second real caller]
        ▼                                   ▼
(materials.html AI Tutor panel     WrongBook.js reads WrongBookRuntime.list()
 via ReviewGeneratorRuntime,        at mount — the ONLY thing wrongbook.html displays
 review.html via AppReview.js,
 index.html ReviewWidget via
 ReviewQueue/ReviewModel — three
 independent Review consumers,
 unchanged by this Sprint)
```
