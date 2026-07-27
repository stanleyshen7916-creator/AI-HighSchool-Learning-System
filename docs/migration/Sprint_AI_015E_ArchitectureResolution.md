# Sprint_AI_015E_ArchitectureResolution.md — EO-AI-015E-002

Companion to `docs/Architecture/QuestionPipelineAnalysis.md`. This document connects that technical analysis back to Sprint AI-015E's stalled Part B and lays out the real options for PMO to decide among. It recommends nothing be implemented yet — per this EO's own instruction, analysis only, implementation stays blocked pending approval.

## Why Sprint AI-015E Part B stalled

Part B's literal cutover (Quiz reads `LearningQuestionRuntime` only, and stops calling `QuestionGenerationFlow.run()`) breaks the real, currently-working `summary.html` →「開始 AI 練習」→ Question Guide →「開始練習」deep link, because that flow's *only* content source today is Quiz's own call into `QuestionGenerationFlow`. Removing it without a replacement leaves that entire path permanently empty. Confirmed against the real test suite: 7 `tests/jsdom/BehaviorSuite.js` blocks exercise this path and the suite crashes rather than completing — a direct hit on this Sprint's own Stop Conditions ④ (BehaviorSuite must PASS) and ⑤ (no unresolved Regression).

## What EO-AI-015E-002 found

`docs/Architecture/QuestionPipelineAnalysis.md` §2 shows `AITutorService.ensureQuestionSet()` + `QuestionProviderBridge` are individually complete and already validated (Sprint AI-015C), but:

- **No production code anywhere chains them together** — `QuestionProviderBridge.bridge()` has zero real callers today, even on `materials.html`.
- Retiring `QuestionGenerationFlow` in their favor is not pure plumbing: it **narrows question types** (4 kinds → `single_choice` only) and **drops caller-supplied difficulty** (the Question Guide's difficulty picker has nothing to attach to in the new pipeline).
- `quiz.html` carries none of the new pipeline's dependency chain — wiring it in directly would be a large addition; keeping the trigger on `materials.html` instead needs none.

## Options for PMO

**Option A — Compose on materials.html, Quiz becomes a true pure-reader.**
Add a small composition step (implementation detail, not decided here — either folded into `MaterialQuestionCard.js`'s existing button handler, or a new thin non-Runtime helper, PMO's naming suggestion "QuestionPipelineService" would live here if chosen) that calls `ensureQuestionSet()` then `bridge()` when a student clicks materials.html's existing「產生 AI 題目」button. Quiz's Practice Mode then reads `LearningQuestionRuntime` only, with zero generation trigger of its own — cleanly satisfying "Quiz 只能 Read." Cost: the Summary→Guide→「開始練習」deep link can no longer generate on demand — a student who reaches it before ever visiting materials.html's button sees the honest Empty State instead of an immediate question set. Difficulty-picker UI in the Question Guide would need to be re-scoped or removed (no receiving parameter downstream) — a follow-on product decision, not resolved here.

**Option B — Keep `QuestionGenerationFlow` as Quiz's Practice content source; scope this Sprint down.**
Accept that `LearningQuestionRuntime`-only reads and the retirement of Quiz-triggered generation are not both achievable without the tradeoffs in Option A. Redefine Sprint AI-015E's Acceptance Criteria to something achievable without regression — e.g., Quiz reads whichever of the two stores actually has content for a given question (today's union-read, kept), with the Identity Mapping fix (already built, uncommitted) ensuring WrongBook still resolves regardless of source. This preserves 100% of current working behavior but does not achieve the literal "100% Read: LearningQuestionRuntime" criterion.

**Option C — Something else PMO specifies**, e.g. extending `QuestionGenerationRuntime`/`ensureQuestionSet()` to accept a caller-supplied difficulty (a Runtime API change — would need explicit authorization since it's Forbidden by default) so the new pipeline can fully replace the old one including the difficulty picker, closing gap §2d directly rather than dropping the picker.

## Not decided by this document

No file outside `docs/Architecture/QuestionPipelineAnalysis.md`, this file, and `docs/migration/EO_AI_015E_002_REPORT.md` has been created or modified. `js/components/QuizCenter.js`'s uncommitted Part B changes (Identity Mapping helper + Runtime-only read + generation-trigger removal) remain exactly as they were — uncommitted, unmodified further, per this EO's explicit "不得 Commit 目前 Part B 修改" instruction.
