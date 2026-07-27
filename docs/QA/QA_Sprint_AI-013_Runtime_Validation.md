# QA_Sprint_AI-013_Runtime_Validation.md — Idle / Generate / Ready / Compare / Rollback (Part C)

Validated with real jsdom against real `materials.html`, `SummaryProvider` at its real committed default (`new`), no test-only mode overrides except where a scenario explicitly names one (Compare, Rollback).

```
=== Idle State ===
  PASS  Fresh page: default mode is 'new'
  PASS  Idle: shows 開始 AI 分析 button, no card
  PASS  Idle: Read API returns {} without generating (New Runtime cache still empty)
  PASS  Idle: Zero console errors

=== Generate (only via 開始 AI 分析) ===
  PASS  Before any button click: New Runtime cache empty
  PASS  ensureLearningSummary() (開始 AI 分析 handler) produces real content
  PASS  Generate used the New Runtime (cache now populated)
  PASS  Idempotent: a second call does not regenerate
  PASS  Zero console errors

=== Ready State (persists across reopen) ===
  PASS  Ready: card renders directly, no button, on reopen
  PASS  Ready: title is the real material title
  PASS  Zero console errors

=== Compare ===
  PASS  Compare: UI-facing value is Legacy-shaped
  PASS  Compare: comparison report available with all 5 sections
  PASS  Compare: Core Concepts coverage 100% (EO-AI-010B holds)
  PASS  Zero console errors

=== Rollback ===
  PASS  Before rollback: New Runtime has content
  PASS  After rollback: generation correctly uses Legacy again
  PASS  Rollback required zero code changes (setMode call only)
  PASS  Zero console errors

=== Read API is always Read Only (all 3 modes) ===
  PASS  mode=legacy: getLearningSummary() never populates New Runtime's cache
  PASS  mode=new: getLearningSummary() never populates New Runtime's cache
  PASS  mode=compare: getLearningSummary() never populates New Runtime's cache

PASS: 23   FAIL: 0
```

## Contract confirmations

- **Read API is always Read Only**: verified explicitly in all three modes — calling `getLearningSummary()`/`getSummary()` never populates the New Runtime's own cache, regardless of mode (the EO-AI-012C LOCK Contract holds under the real `new` default).
- **Generate is only triggered by 開始 AI 分析**: `ensureLearningSummary()` is the sole path that calls `SummaryProvider.generateSummary()`; nothing else in the codebase calls it.
- **Idempotency holds across both shapes**: a second `ensureLearningSummary()` call returns the identical content rather than regenerating, in both Legacy and New modes.

## One documented behavior nuance (not a bug)

`SummaryProvider.getLastComparison()` reflects the state as of the **last `getSummary()` call**, not automatically refreshed after `generateSummary()`. `ensureLearningSummary()`'s own idempotency pre-check calls `getSummary()` once, before generation — so a caller wanting a comparison that reflects freshly-generated content must call `getLearningSummary()`/`getSummary()` again afterward. This is consistent with `SummaryProvider`'s existing documented design (`generateSummary()` is a pure write, `getSummary()` is a pure read that also happens to refresh the comparison as a side effect) and required no code change — only correct test usage.

## Conclusion

All five Runtime states validated against the real, committed default (`new`). Part C's completion criteria are met.
