# QA_Sprint_AI-013_Legacy_Manifest.md — Legacy Component Inventory

Sprint AI-013 Part D deliverable. This is an **inventory only** — nothing listed here is deleted, refactored, or modified by this Sprint. It exists so a future, separately-scoped Legacy Cleanup EO can consult a single source of truth for what still depends on Legacy before removing anything.

## Why this exists

Now that `SummaryProvider`'s default mode is `new` (Sprint AI-013 Part A), Legacy is no longer the primary execution path for AI Summary — but it is still load-bearing for three things: **Rollback**, **Compare**, and (until wired otherwise) every other AI Tutor capability (Questions/WrongBook/Review) that never had a New-pipeline equivalent built. None of the components below may be removed without first re-verifying each of the three roles they still serve.

## Legacy Runtime

| Component | File | Still required for |
|---|---|---|
| Knowledge Summary Runtime | `js/runtime/KnowledgeSummaryRuntime.js` | Rollback (`setMode("legacy")` reads/writes here); Compare (Legacy side of every diff); the only Summary store `AITutorRuntime.getKnowledgeSummary()` reads |
| AI Tutor Runtime | `js/runtime/AITutorRuntime.js` | Read-only coordination for Summary (Legacy fallback path)/Questions/WrongBook/Review — Questions/WrongBook/Review have **no New-pipeline equivalent at all**, so this stays required regardless of Summary's migration state |

## Legacy Service (Generation Trigger)

| Component | File | Still required for |
|---|---|---|
| `generateLegacySummary()` (private helper) | `js/runtime/AITutorService.js` | The exact chain `ensureLearningSummary()` runs when `SummaryProvider` mode is `legacy` (Rollback) or `compare` (UI-facing generation) |
| `ensureQuestionSet()` | `js/runtime/AITutorService.js` | Practice question generation — entirely Legacy, no New-pipeline path exists for this capability |

## Legacy Content-Analysis Dependency Chain

`generateLegacySummary()` (and thus Rollback/Compare) transitively depends on the full pre-ai-engine analysis pipeline:

```
MaterialTextPipeline.js → KnowledgePipeline.js → AnalysisRuntime.js
  → KnowledgeExtractionRuntime.js → KnowledgeGraphRuntime.js
  → DocumentClassifierRuntime.js, MaterialTextProvider.js, ParserAdapterRegistry.js
  → KnowledgeSummaryRuntime.createSummary()
```

Every file in this chain (`js/parser/MaterialTextPipeline.js`, `js/parser/KnowledgePipeline.js`, `js/parser/AnalysisRuntime.js`, `js/runtime/KnowledgeExtractionRuntime.js`, `js/runtime/KnowledgeGraphRuntime.js`, `js/runtime/DocumentClassifierRuntime.js`, `js/parser/MaterialTextProvider.js`, `js/parser/ParserAdapterRegistry.js`) must stay intact for Rollback and Compare to keep working, and also independently backs Question/WrongBook/Review generation (`ensureQuestionSet()`, `WrongBookGenerator`, `ReviewGeneratorRuntime`) which has no migration path at all yet.

## Compare Dependency

| Component | File | Role |
|---|---|---|
| `SummaryComparator` | `ai-engine/src/validator/SummaryComparator.js` | Diffs Legacy vs New; reads `AHS.KnowledgeSummaryRuntime` (Legacy) and the real, unmodified `AHS.MaterialSummaryCard.hasSummaryContent()` for compatibility checks |
| `SummaryProvider.runCompare()` | `ai-engine/src/service/SummaryProvider.js` | Orchestrates the diff, stores it in `getLastComparison()` |

Compare Mode is structurally incapable of functioning without `KnowledgeSummaryRuntime` present and populated — it is the entire Legacy side of every comparison.

## Rollback Dependency

Rollback is `SummaryProvider.setMode("legacy")` — a mode switch, no code change. Everything under "Legacy Runtime", "Legacy Service", and "Legacy Content-Analysis Dependency Chain" above is, by definition, the Rollback dependency set: if any of it is removed, Rollback silently stops working (or throws) the next time someone calls `setMode("legacy")`.

## Explicitly NOT Legacy (safe to reason about separately)

- `ai-engine/**` (New Pipeline) — already the default; not part of this manifest.
- `js/runtime/AITutorService.js`'s public API (`ensureLearningSummary`/`getLearningSummary`/etc.) — the Migration Bridge itself, not Legacy.
- `js/ui/MaterialSummaryCard.js`, `js/ui/MaterialPreview.js` — pure presentation, don't know or care which pipeline produced their input.

## Conclusion

**No component in this manifest may be removed today.** Rollback and Compare are both currently active, tested capabilities that depend on 100% of the above. A future Legacy Cleanup EO must independently re-verify, for each item, that removing it does not break Rollback, Compare, or (for the content-analysis chain and Question/WrongBook/Review pieces) any capability that has no New-pipeline equivalent — and per Sprint AI-014's own precondition, must stop and report to PMO the moment any such dependency is found, rather than force removal.
