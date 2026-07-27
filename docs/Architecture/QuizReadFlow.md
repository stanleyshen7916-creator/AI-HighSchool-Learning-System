# QuizReadFlow.md — Sprint AI-015E Part A

Repository Audit of Quiz's real, current Question read flow. Pure documentation — no code touched. Every claim below is taken from reading `js/components/QuizCenter.js`, `js/parser/WrongBookGenerator.js`, `js/runtime/LearningQuestionRuntime.js`, `js/runtime/LearningQuestionSession.js`, `js/parser/QuestionGenerator.js`, `js/parser/LearningQuestionGenerator.js` in full — not inferred from the Sprint spec's Baseline diagram. Per this Sprint's own Architecture Rule ("Repository Truth > PMO Assumption"), where the real code disagrees with the spec's diagram, the real code is reported as-is.

## 1. Quiz today reads from TWO stores, not one

`QuizCenter.js buildPracticeListView()` (line 581) and `showQuestionGuide()` (line 881) both build their question list as a **union**:

```js
var items = AHS.LearningQuestionRuntime.list() / .findByMaterialId(materialId);
items = items.filter(isRealLearningQuestion);          // drop [Stub]-prefixed
items = items.concat(sessionQuestions(materialId));     // + AHS.LearningQuestionSession
```

`sessionQuestions()` (line 558) reads `AHS.LearningQuestionSession.list()`/`.findByMaterialId()`, filtered by the same `isRealLearningQuestion()`. Both sources are already Stub-filtered before display — Quiz today shows 0% Stub content, but it is **not** sourced from `LearningQuestionRuntime` alone.

## 2. The spec's "Session → Runtime" arrow is not a real code path

The Sprint's Baseline diagram draws `LearningQuestionSession ↓ LearningQuestionRuntime` as sequential. No such write path exists anywhere in the repository — confirmed by reading both files in full and grepping each for the other's namespace (zero cross-references). They are two **independent, parallel** stores:

- `LearningQuestionSession` is written by `LearningQuestionGenerator.generate()` + `.add()` — sourced historically from `QuestionGenerationFlow` (top-level `SummaryRuntime`-derived, Sprint 6.9) and, since Sprint AI-015C, also by `QuestionProviderBridge`.
- `LearningQuestionRuntime` is written by its own `add()`/`sync()` — sourced historically from `LearningPipeline.buildQuestions()` → `QuestionGenerator.generateAIQuestion()` (Stub-only, Sprint 6) and, since Sprint AI-015C, also by `QuestionProviderBridge`.

`QuestionProviderBridge.bridge()` is the only thing that writes to both stores for the same source question — but it writes two **independently-generated records with independently-assigned, unrelated ids** (`LearningQuestionGenerator.generate()` assigns `lqv1_<n>`; `QuestionGenerator.generate()` inside `LearningQuestionRuntime.sync()` assigns `lq_<n>`). There is no shared id, no record linking the two beyond `metadata.sourceQuestionId` on the Session side pointing back to the original `QuestionGenerationRuntime` question — nothing links a Session record to its Runtime sibling.

## 3. Real architecture conflict — WrongBook is hardwired to `LearningQuestionSession` only

`js/parser/WrongBookGenerator.js`'s own header (line 3): `LearningQuestionSession ─▶ WrongBookGenerator ─▶ WrongBookSession`, and explicitly: *"This module reads LearningQuestionSession (read-only)... It never touches LearningQuestionRuntime."* Confirmed in code — `questionFor(questionId)` (line 68) calls `AHS.LearningQuestionSession.getById(questionId)` exclusively; there is no fallback to `LearningQuestionRuntime`.

`QuizCenter.js`'s wrong-answer hook (line 632, called from line 716 whenever a Practice answer is incorrect) does:
```js
AHS.WrongBookGenerator.add({ questionId: rec.id, userAnswer: userAnswer });
```
passing whatever `record.id` the displayed question happened to carry — **regardless of which store it came from**. Today:

- Answering wrong on a **Session-sourced** record (`lqv1_*` id) → `WrongBookGenerator.add()` finds it via `LearningQuestionSession.getById()` → **WrongBook entry created** (working as designed).
- Answering wrong on a **Runtime-sourced** record (`lq_*` id from `QuestionGenerator`, or any other id not present in Session) → `LearningQuestionSession.getById()` returns `null` → `add()` rejects (missing resolved fields) → **no WrongBook entry, silently** (this is WrongBookGenerator's own documented, intentional design — "no fake wrong-book entry can appear" — not a bug, and pre-dates this Sprint).

**Consequence for this Sprint's literal Acceptance Criterion ("Quiz 100% Read: LearningQuestionRuntime")**: if `buildPracticeListView()`/`showQuestionGuide()` stop reading `LearningQuestionSession` and show only `LearningQuestionRuntime` records, then *every* Practice Mode question a student can see going forward carries a Runtime-only id that `WrongBookGenerator` cannot resolve. The wrong-answer → WrongBook write path — which partially works today for Session-sourced questions — would go to **zero working cases**, for 100% of Practice Mode. This is a real, evidence-backed regression to a store this Sprint explicitly forbids modifying ("不得修改：WrongBook") and explicitly requires stay regression-free (Part G: "確認：WrongBook 正常...不得：Regression").

This is reported per this Sprint's own Stop Condition ①（Repository 真實架構衝突）before any Part B code is written.

---

## 4. Resolution (EO-AI-015E-002, PMO-approved Option A) — final, implemented architecture

The conflict in §3 is resolved by composing the Production Pipeline **upstream of Quiz**, on `materials.html`, instead of inside Quiz:

```
materials.html「產生 AI 題目」button (js/ui/MaterialQuestionCard.js)
        │
        ▼
AITutorService.ensureQuestionSet(materialId)      [Generate — Knowledge Graph, existing, unmodified]
        │
        ▼
QuestionProviderBridge.bridge(materialId)         [Shape Map + write — existing, unmodified, Sprint AI-015C]
        │
        ├──▶ LearningQuestionSession    (Target A)
        └──▶ LearningQuestionRuntime    (Target B)
```

Both calls are the SAME existing, unmodified functions this document's §2 already described — the only change is that `MaterialQuestionCard.js`'s button handler now calls both in sequence (previously it called `ensureQuestionSet()` only). No new Runtime, no new file, no second pipeline.

`QuizCenter.js` (`buildPracticeListView()` / `showQuestionGuide()`) now reads **`LearningQuestionRuntime` only** — the `sessionQuestions()` Session-merge described in §1 is removed. Quiz no longer calls `QuestionGenerationFlow.run()` at all (removed from `showQuestionGuide()`'s `onStart`) — Quiz is a pure reader, exactly as required.

**§3's WrongBook conflict is resolved by a read-only Identity Mapping, not by touching WrongBook.** `QuizCenter.js` adds `wrongBookQuestionId(record)`: given a displayed `LearningQuestionRuntime` record, it looks up `AHS.LearningQuestionSession.findByMaterialId()` for the sibling record sharing the same `materialId` + `traceability.knowledgeId` + verbatim `question` text (both siblings were written by the same `bridge()` call from the same source question, so this match is exact, not inferred) and returns *that* record's id. `wrongBookHook()` now calls `WrongBookGenerator.add({questionId: wrongBookQuestionId(rec), ...})` instead of `{questionId: rec.id, ...}`. `WrongBookGenerator.js` itself — its code, its Public API, its Session-only resolution design — is completely untouched; Quiz simply now supplies the id it actually expects.

**Net effect**: the Summary→Guide→Practice deep link remains functional for any material a student has already had generated via materials.html's button (the realistic case, since materials.html is where students upload/manage material). A material with no generated content yet honestly shows the existing `quiz-practice__empty` state — no crash, no fabricated content, consistent with every other Empty State in this codebase.

Real-evidence validation (Sprint AI-015E Part D/E, EO-AI-015E-002 follow-through): 3 distinct real materials (math/biology/history), each carried through the real wired button click → both stores bridged → Quiz displays every bridged question → wrong-answer correctly resolves through the Identity Mapping into `WrongBookSession`/`ReviewQueue`. See `docs/QA/QuizProductionValidation.md`.
