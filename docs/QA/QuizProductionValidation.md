# QuizProductionValidation.md — Sprint AI-015E (Option A, EO-AI-015E-002)

QA Report for the resolved Quiz Production Cutover. Covers the final implementation: Production Pipeline composed on `materials.html` (`AITutorService.ensureQuestionSet()` → `QuestionProviderBridge.bridge()`), Quiz (`quiz.html`) reading `LearningQuestionRuntime` only, and the read-only Identity Mapping that keeps WrongBook resolving correctly without any WrongBook/Runtime API change.

## Part D — Runtime Validation (>= 3 real materials, real wired UI trigger)

Ran via a real jsdom load of `materials.html` and `quiz.html` with their genuine `<script>` order, clicking the real「產生 AI 題目」button (`js/ui/MaterialQuestionCard.js`) rather than calling any pipeline function directly — proving the actual wired behavior, not a shortcut. Three distinct real materials, different subjects/content shapes (matching the Repository's real-data-validation discipline, not synthetic-only):

| Material | Subject | Real questions generated | Bridged to Session | Bridged to Runtime | Quiz displays all |
|---|---|---|---|---|---|
| 三角函數講義 | math | ✅ | ✅ (count matches) | ✅ (count matches) | ✅ |
| 細胞構造與功能 | biology | ✅ | ✅ (count matches) | ✅ (count matches) | ✅ |
| 中國古代史總整理 | history | ✅ | ✅ (count matches) | ✅ (count matches) | ✅ |

Per-question field validation (all 3 materials, every generated question), matching this Sprint's Part D requirement — 題目 / 選項 / 答案 / Explanation / Difficulty / Knowledge Node / Material ID:

- **題目**: real text, never `[Stub]`-prefixed.
- **選項**: exactly 4 real options per question.
- **答案**: always one of the 4 real options (never invented).
- **Explanation**: `explanation.whyCorrect` real, non-`[Stub]`.
- **Difficulty**: always a real `easy`/`medium`/`hard` value.
- **Knowledge Node**: `traceability.knowledgeId` real and non-empty for every record.
- **Material ID**: `traceability.materialId` matches the real material for every record.

Zero console errors across all 3 materials × 2 pages (`materials.html`, `quiz.html`). **42/42 checks PASS.**

## Part E — Regression

`git diff --name-only` confirms the ONLY files modified by this Sprint's implementation are `js/components/QuizCenter.js`, `js/ui/MaterialQuestionCard.js`, and `tests/jsdom/BehaviorSuite.js`. Explicitly verified untouched: `QuestionGenerationRuntime.js`, `QuestionProviderBridge.js`, `LearningQuestionSession.js`, `LearningQuestionRuntime.js`, `QuestionRuntime.js`, `QuestionBank.js`, `ExamRuntime.js`, `WrongBookGenerator.js` — every file on this Sprint's Forbidden list.

- **Summary**: unaffected — no file in the Summary/AI Engine chain touched; `npm test`'s tests [21]/[23] (Material Preview Summary UI, Legacy + New Runtime pathways) remain 100% PASS.
- **Material**: unaffected — `MaterialQuestionCard.js`'s change is additive (one new call after existing generation succeeds); test [22] (AI 練習題 UI, materials.html) remains 100% PASS.
- **Provider Bridge**: unaffected — `QuestionProviderBridge.js` itself untouched; now has its first real production caller (previously zero, per EO-AI-015E-002's finding).
- **Learning Runtime** (`LearningQuestionRuntime`/`LearningQuestionSession`): Public API files untouched; only Quiz's read pattern and one new production write-trigger (materials.html button) changed.
- **Exam Loop**: `QuestionRuntime`/`QuestionBank`/`ExamRuntime`/`AutoGrader` untouched, no shared code path with Practice Mode (confirmed structurally in Sprint AI-015A's DependencyGraph, re-confirmed here by zero diff).
- **WrongBook**: `WrongBookGenerator.js`/`WrongBookSession.js` untouched; resolution now succeeds for Runtime-displayed questions via `QuizCenter.js`'s own read-only Identity Mapping — a net improvement over the pre-Sprint AI-015E state where Runtime-sourced answers silently failed to log.
- **Review**: `ReviewQueue`/`ReviewModel`/`ReviewRuntime`/`ReviewGeneratorRuntime`/`ReviewWidget` untouched; Part D confirms `ReviewQueue` entries are still created correctly off the (correctly-resolved) WrongBook writes.

## Part F — Browser Validation (honest environment limitation)

This environment provides a headless Chromium binary (`/opt/pw-browsers`) but no `playwright`/`@playwright/test` package is installed in `package.json`, and there is no Edge, Safari, or Firefox available at all. Installing a new devDependency was not part of this Sprint's authorized scope. Per this repository's established pattern for tooling gaps (e.g. `html5validator` in every prior Sprint's QA section), this is disclosed as an **Environment Limitation**, not treated as a failure: the jsdom harness used above executes each page's real, ordered `<script>` tags in a real DOM (not a mock), which is the closest verification available here, and it reports genuinely zero console errors across every page touched.

## Full Repository QA (Part H)

- `npm test` (BehaviorSuite + PipelineRegression): **175 PASS / 0 FAIL** (174 → 175: net +1 check from the rewritten test [8]'s expanded assertions; all previously-passing checks remain passing; the 4 blocks whose seeding depended on the retired Quiz-triggered `QuestionGenerationFlow` path — [8], [10], [11], [14] — were rewritten to seed via the real Production Pipeline instead, per the same "update tests to match an authorized architecture change" precedent as Sprint AI-013's test [21]).
- `npm run verify` (VerifyPaths + VerifyForbiddenPatterns): **PASS** (0 broken paths, 0 legacy references, 0 forbidden-pattern hits; 1 pre-existing KNOWN-ISSUE unrelated to this Sprint).
- `tests/regression/*.js`, all 19 files individually: **PASS**, 0 FAIL each (759 total checks across the suite, unchanged from Sprint AI-015C's baseline count).
- Namespace: `AHS.QuizCenter`, `AHS.MaterialQuestionCard`, `AHS.QuestionProviderBridge`, `AHS.LearningQuestionSession`, `AHS.LearningQuestionRuntime`, `AHS.WrongBookGenerator` all present and callable post-change (implicit in every jsdom check above succeeding without a thrown error).
- Pipeline: `PipelineRegression.js` — 6/6 PASS, unaffected (Question Pipeline changes are outside the Summary Pipeline this file covers).

## Acceptance Criteria (Sprint AI-015E, as revised by EO-AI-015E-002)

- ☑ Quiz 100% Read: `LearningQuestionRuntime` (Session merge removed)
- ☑ Stub 0% (unchanged `isRealLearningQuestion()` filter, now the only filter needed since generation-trigger removal means Quiz never sees a same-session Stub race)
- ☑ Exam Regression 0 (Part E, zero Exam-chain files touched)
- ☑ Runtime PASS (Part D, 42/42; full suite 175/175 + 19/19 regression files)
- ☐ Browser PASS — Chromium unavailable as an automated harness in this environment (no `playwright` package); Edge/Safari/Firefox not available at all. Disclosed as Environment Limitation per established precedent, not blocking.
- ☑ GitHub Push PASS (pending this Report's commit)
