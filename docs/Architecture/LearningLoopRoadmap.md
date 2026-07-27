# LearningLoopRoadmap.md — Sprint AI-015B Roadmap (Proposal B)

Companion to `docs/Architecture/LearningLoopProposal.md`. Pure planning document — no code, no commitment to exact EO numbers (those are assigned by PMO at execution time); this lays out **phase boundaries and dependency order only**, modeled directly on this Repository's own already-validated AI Summary Migration methodology (EO-AI-011 → EO-AI-012 → EO-AI-012C → EO-AI-012D → EO-AI-012E/EO-AI-010B → Sprint AI-013 → Sprint AI-014 Phase 1), not invented from scratch.

## Why this phasing shape

Every phase boundary below exists because the AI Summary Migration hit a real, evidence-backed reason to stop and re-scope at that exact point (see `docs/migration/EO_AI_012_REPORT.md`, `EO_AI_012C_REPORT.md`, `EO_AI_012D_REPORT.md`, `EO_AI_012E_REPORT.md`, `EO_AI_010B_REPORT.md`, `Sprint_AI_013_REPORT.md`). Question Generation shares the same shape of problem (a new, real content source needs to reach an existing, working UI without breaking it), so the same phase boundaries are the defensible starting point — not a guess.

## Phase 1 — Foundation Bridge (Read-only, no default change)

**Goal**: Build a `QuestionProvider`-style selector (mirrors `SummaryProvider`) that can source Practice content from either the current `SummaryRuntime`-based generator ("legacy") or `QuestionGenerationRuntime` ("new"), with a "compare" mode for equivalence checking. Default stays `legacy` — zero behavior change for real users.

- Design and build the Provider (mode: legacy/new/compare; `getSummary`-equivalent is Read Only in every mode, matching the EO-AI-012C LOCK Contract precedent).
- Verify `QuestionGenerationRuntime` is even reachable where `QuestionGenerationFlow` runs — per Sprint AI-015A's audit, `QuestionGenerationRuntime` is currently loaded **only** on `materials.html`; `quiz.html` (where `QuestionGenerationFlow` runs) does not load it at all. This mirrors EO-AI-012A's "Script Wiring" step exactly — a real, load-bearing task the Roadmap should not skip.
- Migration Bridge: `QuestionGenerationFlow`'s content-source call routes through the Provider instead of hardcoding `SummaryRuntime`, guarded so it falls through to today's exact behavior when the Provider isn't present (identical to the EO-AI-012 Migration Bridge pattern).

**Expected follow-up work** (based on precedent, not guaranteed): a Read/Generate separation Hotfix is likely needed once Generate is actually exercised under the new mode — EO-AI-012C found exactly this class of bug the first time this pattern was tried. Budget for it rather than assume Phase 1 lands clean on the first attempt.

## Phase 2 — Equivalence Validation & Metadata Gaps

**Goal**: Validate Practice content quality against real Repository data (not hand-picked test strings), and fix whatever real gaps that validation finds — precedent strongly suggests there will be at least one.

- Run Compare Mode against real Repository MockData materials (same discipline as Sprint AI-013 Part B / EO-AI-010B) — not synthetic scenarios alone.
- Expect and budget for at least one real content-quality gap, the same way the Summary migration found two (a metadata gap in EO-AI-012E, a classification-pattern gap in EO-AI-010B). Question content classification/formatting is a different rule set than Summary's, so its own gaps — not the same ones — should be expected.
- Confirm `[Stub]`-filtering (`QuizCenter.isRealLearningQuestion()`) correctly recognizes real `QuestionGenerationRuntime`-sourced content as non-stub, since that filter currently keys on the `[Stub]` prefix specifically.

## Phase 3 — Production Cutover

**Goal**: Flip `QuestionProvider`'s default to `new`, with `legacy` preserved as Rollback and `compare` preserved for ongoing QA — exactly the Sprint AI-013 Beta Cutover shape.

- Default Mode Migration (mirrors Sprint AI-013 Part A).
- Runtime Validation: Idle/Generate/Ready/Compare/Rollback states, same discipline as Sprint AI-013 Part C.
- Legacy Manifest audit **before** considering any removal (mirrors Sprint AI-014 Phase 1) — Sprint AI-014 Phase 1's real finding on the Summary side was that the "obviously legacy" chain turned out to be shared infrastructure serving unrelated features; the same audit discipline should be applied here before assuming the `SummaryRuntime`-based Practice generator or the `[Stub]`-only `LearningPipeline` path can be removed. Do not assume; verify.
- Full Regression / BehaviorSuite / Runtime / Browser QA, same bar as every prior Sprint in this track.

## Phase 4 (Deferred, not scoped by this Roadmap) — Legacy Cleanup Consideration

Not part of this Roadmap's committed scope. Flagged here only because the Summary track went through an analogous phase (Sprint AI-014) and found the honest answer was "nothing removable yet" — the same outcome is plausible here, since Loop A (Exam Mode) is untouched by Proposal B and may still depend on pieces someone might otherwise assume are dead. A dedicated audit Sprint, not a code Sprint, should open this phase — same pattern as Sprint AI-014 Phase 1.

## Explicitly out of scope for this Roadmap

- `review.html`'s mismatch between its file names and its real `HistoryRuntime`+`WrongBookRuntime`-only behavior (Sprint AI-015A Part D) is a real, separate finding but belongs to Loop A, which Proposal B does not touch. Fixing it (if desired) needs its own Sprint.
- Unifying the four independent Review consumers (`review.html`, home `ReviewWidget`, materials.html's AI Tutor panel via `ReviewGeneratorRuntime`, and the unused `ReviewRuntime.build()`) is a materially different, larger problem than Question Generation integration and is not assumed as part of this Roadmap.

## Dependency Order (why phases can't be reordered)

```
Phase 1 (Provider + Wiring)
    │  must exist before...
    ▼
Phase 2 (Equivalence Validation)
    │  must find zero unresolved degradation before...
    ▼
Phase 3 (Cutover)
    │  must be stable for a production period before...
    ▼
Phase 4 (Cleanup consideration, separately scoped)
```

Each phase's exit criterion is the next phase's entry precondition — same discipline the Summary track already used successfully, not a new invention.
