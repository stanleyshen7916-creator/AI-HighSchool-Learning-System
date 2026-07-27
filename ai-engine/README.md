# AI Engine

Status: Core Foundation (EO-MIG-002 / EO-AI-001 ~ EO-AI-004) plus the `summary` service (EO-AI-005), its Runtime integration (EO-AI-006), a Service Layer (EO-AI-007), a read-only legacy-compatibility bridge (EO-AI-008), rule-based content extraction (EO-AI-009), its Core Concept classification HOTFIX (EO-AI-010A), and a Legacy/New Dual-run selector (EO-AI-011) — still no LLM anywhere. **EO-AI-012A wired a minimum subset (22 files, dependency-traced — not the whole ai-engine/ tree) into `materials.html`**, so `AHS.AIEngine.SummaryProvider` is now really reachable in the browser for the first time; default mode stays `legacy` (no behavior change — verified byte-identical), and the UI is otherwise still untouched by ai-engine. Material Detail's existing AI 重點整理 feature (`MaterialPreview` → `MaterialSummaryCard` → `AITutorService` → `KnowledgeSummaryRuntime`) is a separate, untouched Baseline system and remains the only thing users see. As of EO-AI-009, `SummaryPipeline.run()` output now includes a `.summary` object shaped exactly like `MaterialSummaryCard.js` expects (`coreConcepts`/`keywords`/`definitions`/`formulas`/`importantPoints`, all rule-extracted verbatim from the material's real text — no LLM, no fabrication) — but **actually wiring `MaterialSummaryCard` to use it is still deferred to a future "AI Summary Migration" EO**, not done here. EO-AI-010 added `SummaryComparator` (real-data equivalence validation only, no code change to either pipeline) and found a known Core Concept coverage gap — EO-AI-010A Revision-1 fixed it (added a concept-explanatory-sentence classification rule; the Keyword length rule is unchanged) and re-validated 100% coverage across all five categories with zero regression — see `docs/migration/EO_AI_010_VALIDATION.md`'s "HOTFIX Comparison" section for the real before/after numbers. EO-AI-011 added `SummaryProvider` — a single entry point selecting between `legacy` (default) / `new` / `compare` mode; in `compare` mode both pipelines run and are diffed via the existing `SummaryComparator`, but the value returned (what a caller/UI would see) is always the Legacy summary, and the diff report lives only in an in-memory variable (`getLastComparison()`), never written to any Runtime. EO-AI-012 Revision-1 added a **Migration Bridge**: `js/runtime/AITutorService.js`'s `getLearningSummary()` now checks for `AHS.AIEngine.SummaryProvider` and, when present, delegates the read to it (SummaryProvider alone decides legacy/new/compare — `AITutorService` never inspects the mode); at that point `SummaryProvider` was not yet wired into any page, so the check found nothing and fell through to the exact pre-EO-AI-012 behaviour. EO-AI-012A (see above) wired it in — the check now finds a real `SummaryProvider`, delegates to it, and since its default mode is `legacy`, behaviour is still verified byte-identical to before. `ensureLearningSummary()`'s generation chain is untouched. **EO-AI-012C (Migration Bridge Hotfix)**: an attempt to flip the default mode to `new` (Sprint AI-013 Part A) surfaced a real regression — `SummaryProvider.getSummary()`'s `new`-mode branch called `SummaryService.generate()` unconditionally, so `MaterialSummaryCard`'s very first read (before the user ever clicks anything) silently produced real content and skipped straight to "ready" state, confirmed by 3 real `BehaviorSuite` failures. Fixed by splitting Read and Generate into two separate entry points: `getSummary()` is now **always** read-only in every mode (reads `SummaryService.get()`, never `.generate()`); a new `generateSummary()` is the only thing that actually runs the New pipeline, and nothing calls it automatically — it's meant to be invoked only from an explicit user action. Re-verified: flipping default mode to `new` no longer breaks `BehaviorSuite` (162/162 PASS). **EO-AI-012D (Generate Path Migration)** closed the remaining gap EO-AI-012C deliberately left open: `ensureLearningSummary()`'s generation chain was still hardcoded to Legacy regardless of mode, so with `new` as default, Read used New (empty) while Generate kept writing to Legacy — a real bug where reopening the material preview after analysing lost the "ready" state (New's cache, which is what `new`-mode reads, was never populated). Fixed by routing `ensureLearningSummary()`'s generation on `SummaryProvider`'s mode too: `legacy` keeps the exact original chain; `new` calls `SummaryProvider.generateSummary()` instead (Read and Generate now share the same Runtime); `compare` still generates via Legacy (UI-facing value stays Legacy, per the Compare Contract) and additionally calls `generateSummary()` as a side effect so `getLastComparison()` has real New data to diff. A private, Public-API-invisible `hasProducedContent()` helper makes the idempotency check work across both Legacy's (`materialId`-keyed) and New's (`.summary`-keyed) shapes. **EO-AI-012E (Summary Metadata Migration)**: attempting Sprint AI-013 Part A's default-mode flip surfaced one more real gap — New's `SummaryBuilder` always set `title: null` (an EO-AI-005 stub), so with `new` as default, `MaterialSummaryCard` showed the generic "AI 重點整理" fallback instead of the material's real title. Fixed by adding `title` to `Metadata`'s fixed field set (17 fields now, fully backward compatible — no existing field touched), mapping `material.title -> metadata.title` in `MetadataBuilder.fromMaterial()` (a structural pass-through, not AI-generated, same as subject/grade/chapter), and having `SummaryBuilder` read `metadata.title` instead of hardcoding `null`. `tests/jsdom/BehaviorSuite.js` gained a new, additive test block ([23]) that exercises the full UI flow under `SummaryProvider` mode `'new'` — the pre-existing Legacy-mode assertions (including the `KnowledgeSummaryRuntime`-specific one) are untouched, now pinned to `setMode("legacy")` explicitly since it's no longer the ambient default. **EO-AI-010B (Summary Extraction Rule Expansion)**: Sprint AI-013 Part B's Equivalence Validation, run against all 8 real Repository MockData materials (not synthetic strings), found 6/8 lost their Core Concept — every one opens with "本教材介紹/整理/彙整/說明...", a phrasing `CONCEPT_SENTENCE_PATTERN` didn't cover (only "本節/本章/本單元/本課" + "說明/介紹"). Fixed by adding `本教材` to the subject alternation and `整理`/`彙整` to the verb alternation — Expansion only, every prior alternative unchanged, EO-AI-010A's original test case still matches exactly as before. **Sprint AI-013 Part A**: with both gaps closed and zero degradation confirmed against real data, `SummaryProvider`'s default mode is now **`new`** — Beta Cutover complete. `legacy` remains the Rollback target (`setMode("legacy")`, no code change) and `compare` remains available for equivalence QA; true Legacy removal is a separate future Sprint, gated on a period of production stability and listed component-by-component in `docs/QA/QA_Sprint_AI-013_Legacy_Manifest.md`.

## Migration Flow (Sprint AI-013)

```
Before (through EO-AI-012D/EO-AI-010B):          After (Sprint AI-013 Part A, current):

materials.html                                    materials.html
  │                                                  │
  ▼                                                  ▼
AITutorService.getLearningSummary()               AITutorService.getLearningSummary()
  │ (Migration Bridge, EO-AI-012)                    │ (unchanged)
  ▼                                                  ▼
SummaryProvider.getSummary()                      SummaryProvider.getSummary()
  │ mode = 'legacy' (default)                        │ mode = 'new' (default)
  ▼                                                  ▼
KnowledgeSummaryRuntime (Legacy)                  AHS.AIEngine.SummaryService (New)
  = what real users saw                             = what real users see now

ensureLearningSummary() (「開始 AI 分析」)          ensureLearningSummary() (「開始 AI 分析」)
  always generated via Legacy chain                 mode='new' → SummaryProvider.generateSummary()
  (EO-AI-012D closed this Read/Generate split)       (Read and Generate share one Runtime)
```

Rollback flow (no code, mode switch only):

```
SummaryProvider.setMode("legacy")
  → getSummary()/generateSummary() both switch back to the Legacy branch
  → MaterialSummaryCard's next read/analyse round-trips through
    KnowledgeSummaryRuntime again, exactly as before Sprint AI-013
```

Compare flow (QA only, never shown to users):

```
SummaryProvider.setMode("compare")
  → getSummary() still returns Legacy (UI-facing value never changes)
  → generateSummary() also populates New's cache as a side effect
  → SummaryComparator diffs both, result kept in getLastComparison()
    (never written to any Runtime, never persisted, QA-only)
```

See `docs/QA/QA_Sprint_AI-013_Equivalence_Validation.md` and
`QA_Sprint_AI-013_Runtime_Validation.md` for the full real-data validation
behind this cutover, and `QA_Sprint_AI-013_Legacy_Manifest.md` for exactly
what still depends on Legacy (Rollback + Compare + Question/WrongBook/Review,
which have no New-pipeline equivalent at all).

## Purpose

The single entry point for every AI feature in the platform. Per the
locked Architecture (`Platform -> AI Engine -> Provider -> LLM`), the
Platform layer never calls an LLM provider directly; it always goes
through `AHS.AIEngine.AIEngine`.

## Folder Structure

```
ai-engine/
  README.md
  src/
    core/
      AIEngine.js           — composition root + Lifecycle (initialize/dispose/reset/version)
      AIEngineFactory.js     — single-instance access to AIEngine
      AIService.js           — abstract base for every service (Dependency Injection: provider/context)
      ServiceRegistry.js     — service register/unregister/get/has/list
    providers/
      BaseProvider.js        — abstract Provider interface (no LLM connection)
      ProviderRegistry.js    — provider register/unregister/get/has/list + default provider
      ProviderFactory.js     — registers Provider constructors, instantiates on demand
      ProviderManager.js     — facade combining ProviderRegistry + ProviderFactory
    context/
      ContextManager.js      — holds one value per reserved context type
      ContextBuilder.js      — assembles a frozen context object
      ContextValidator.js    — structural validation only (plain object, known keys)
    knowledge/
      KnowledgeRegistry.js    — register/unregister/get/has/list/clear + getVersion(id) (AIEngine's integration point)
      KnowledgeProvider.js    — load/unload/refresh/supports interface (no external source connected)
      KnowledgeLoader.js       — loadFromObject/loadFromJSON/normalize, plus loadFromMaterial(id)/
                                   loadAllFromMaterialRuntime() reading AHS.MaterialRuntime read-only
      KnowledgeIndex.js         — build/rebuild/search/remove (exact-match only, no semantic search)
      KnowledgeCache.js         — set/get/has/remove/clear/invalidate (memory only, no localStorage/IndexedDB)
      Metadata.js                — 17 reserved fields, see below (studyScope reserved, no logic attached;
                                     title added EO-AI-012E, structural pass-through, not AI-generated)
      MetadataBuilder.js          — fluent builder producing a Metadata instance; fromMaterial(material)
                                     maps a Material Runtime record onto Metadata fields (incl. title)
      MetadataValidator.js        — plain object + known keys, required field, empty value, duplicate
                                     tag, invalid type
    prompt/
      PromptManager.js       — register/unregister/get/has/list, delegates to PromptRegistry
      PromptRegistry.js      — five reserved prompt slots (summary/question/review/explanation/tutor)
      PromptTemplate.js      — render() interface, no prompt content
      PromptContext.js       — five reserved fields (material/history/profile/difficulty/subject)
    services/
      summary/
        SummaryEngine.js       — generate(materialId)/generateByKnowledge(knowledge)/
                                  generateBatch(materialIds); extends AIService, id="summary";
                                  registered via the existing, unmodified AIEngine.registerService()
        SummaryExtractor.js     — pulls structural facts (metadata/tags/chapter/section/content
                                   length) out of a Knowledge Object; no NLP, no content reading
        SummaryBuilder.js        — assembles the 12-field Summary Model; concepts/definitions/
                                    formulas/examples are honest stubs (no AI text generation yet);
                                    keywords is a pass-through of tags; title (EO-AI-012E) is a
                                    structural pass-through of metadata.title, not AI-generated
        SummaryFormatter.js      — toJSON() / toRuntimeObject(); no HTML
        SummaryValidator.js      — required field/empty value/duplicate keyword + delegates
                                    metadata validation to the existing MetadataValidator
      question/  review/  explanation/
      tutor/     knowledge/ prompt/
      (still empty — one future EO per remaining service)
    runtime/
      SummaryRuntime.js    — save/get/list/remove/clear, keyed by materialId; storage delegated
                              to a composed KnowledgeCache (reused, not recreated), remove() calls
                              its invalidate(); id="summaryRuntime" (registrable via registerService).
                              NOT the LOCKED top-level AHS.SummaryRuntime — different namespace,
                              different schema (12-field Summary Model, not the Sprint-5 5-section one)
      SummaryHistory.js     — record()/latest()/list(); generation-time history for Summary Models
                              (does not call the legacy AHS.HistoryRuntime.record() — see EO-AI-006
                              REPORT.md for why: that method's fixed exam-result shape is consumed
                              by StatisticsRuntime and would be corrupted by a Summary payload)
      SummarySession.js      — start(materialId)/stop()/current(); tracks the in-flight materialId
      SummaryPipeline.js      — orchestrates MaterialRuntime -> KnowledgeLoader -> SummaryExtractor
                                 -> SummaryBuilder -> SummaryValidator (all via the unmodified
                                 SummaryEngine.generate()) -> SummaryFormatter ->
                                 SummaryContentExtractor (EO-AI-009, adds `.summary`) ->
                                 SummaryRuntime.save() -> SummaryHistory.record() -> return
    parser/
      SummaryContentExtractor.js — rule-based (regex only, no LLM) line-by-line classification of a
                                    material's raw text into coreConcepts/keywords/definitions/formulas/
                                    importantPoints, each item { text, confidence, sourceRange }; text
                                    is always verbatim from the source, confidence is a fixed per-rule
                                    score, sourceRange is the real 0-based line index. EO-AI-010A
                                    Revision-1 HOTFIX: added CONCEPT_SENTENCE_PATTERN so a concept-
                                    explanatory full sentence (e.g. "本節說明...的定義與應用。") classifies
                                    as coreConcepts instead of importantPoints; Keyword's line-length
                                    rule (KEYWORD_MAX_LENGTH=6) is unchanged. EO-AI-010B expansion:
                                    Sprint AI-013 Part B ran Compare Mode against all 8 real Repository
                                    MockData materials and found 6/8 misclassified (they open with
                                    "本教材介紹/整理/彙整/說明...", not "本節/本章/本單元/本課") —
                                    added 本教材 to the subject alternation and 整理/彙整 to the verb
                                    alternation; every prior alternative unchanged, EO-AI-010A's
                                    original test case still matches exactly as before.
    service/
      SummaryService.js       — generate(materialId)/generateFromMaterial(material)/get(materialId)/
                                 getWithFallback(materialId); singleton owning one SummaryRuntime +
                                 one SummaryPipeline for the page's lifetime; no DOM, not wired into
                                 MaterialPreview.js. getWithFallback() (EO-AI-008): returns this
                                 Service's own content only when it's real (non-empty), otherwise
                                 reads (read-only, never writes) the legacy
                                 AHS.KnowledgeSummaryRuntime.getSummaryByMaterial() — a compatibility
                                 bridge, not a replacement
      SummaryProvider.js       — EO-AI-011: setMode('legacy'|'new'|'compare')/getMode()/
                                 getSummary(materialId)/getLastComparison(); the single entry point
                                 for Dual-run. Default mode is 'new' (Sprint AI-013 Part A — was
                                 'legacy' through EO-AI-010B); 'legacy' is the Rollback target,
                                 never auto-switched to by this file itself.
                                 EO-AI-012C HOTFIX: getSummary() is ALWAYS read-only in every mode
                                 (legacy reads AHS.KnowledgeSummaryRuntime; new reads
                                 SummaryService.get() — never .generate()); compare reads both sides
                                 read-only, diffs via SummaryComparator, keeps the report only in
                                 memory, and still returns the Legacy summary — Compare mode never
                                 changes what a caller/UI would see. generateSummary(materialId) is
                                 the separate, explicit entry point that actually runs the New
                                 pipeline (via the existing SummaryService singleton, no second
                                 Pipeline/Runtime instance) — nothing in this file calls it
                                 automatically.
    common/
      Constants.js            — reserved service/provider ids
      Errors.js                — unified Error Framework (see below)
      Version.js                — AI Engine layer version
      Utilities.js               — isPlainObject / freeze
```

`js/ai/SummaryAdapter.js` (Platform side, `AHS.SummaryAdapter`) sits in front of
`AHS.AIEngine.SummaryService` — `generate`/`generateFromMaterial`/`get`/
`getWithFallback`, no DOM, never touches `SummaryRuntime`/`SummaryPipeline`
directly. EO-AI-011 added a second, independent route through
`AHS.AIEngine.SummaryProvider` — `setMode`/`getMode`/`getSummary` — purely
additive, the four EO-AI-007/008 methods above are unchanged. EO-AI-012C
added `generateSummary` — a passthrough to `SummaryProvider.generateSummary()`,
the explicit Generate API; `getSummary()` remains read-only in every mode.
Still not loaded by any HTML page — nothing calls `AHS.SummaryAdapter` yet (the
Migration Bridge in `js/runtime/AITutorService.js` talks to
`AHS.AIEngine.SummaryProvider` directly), so it was correctly left out of
EO-AI-012A's wiring below.

## Browser Wiring (EO-AI-012A)

`materials.html` — the only page that loads `js/runtime/AITutorService.js`
— now also loads a **dependency-traced minimum subset of ai-engine** (22
files, not the whole tree), inserted right before `AITutorService.js` so
`AHS.AIEngine.SummaryProvider` exists by the time it's ever called:

```
common/Errors.js, common/Constants.js, common/Utilities.js
core/AIService.js
knowledge/Metadata.js, MetadataBuilder.js, MetadataValidator.js, KnowledgeCache.js, KnowledgeLoader.js
services/summary/SummaryExtractor.js, SummaryBuilder.js, SummaryFormatter.js, SummaryValidator.js, SummaryEngine.js
parser/SummaryContentExtractor.js
runtime/SummaryRuntime.js, SummaryHistory.js, SummarySession.js, SummaryPipeline.js
service/SummaryService.js
validator/SummaryComparator.js
service/SummaryProvider.js
```

Deliberately **not** wired (traced and confirmed not a real dependency of
this chain): `core/AIEngine.js` (composition root — nothing in the Summary
chain calls `AIEngineFactory`/`new AIEngine()`), `providers/*`, `context/*`,
`prompt/*`, `knowledge/KnowledgeRegistry.js`/`KnowledgeProvider.js`/
`KnowledgeIndex.js`, and `js/ai/SummaryAdapter.js`. `SummaryProvider`'s
default mode is still `legacy`, so this is Infrastructure only — verified
byte-identical behaviour on every existing page flow; flipping the default
to `new` is EO-AI-012B, not this EO.

## Public API (Reserved)

Foundation-only surface; no provider is registered and nothing is auto-registered — a caller must explicitly `engine.registerService(new AHS.AIEngine.SummaryEngine())` to use it.

- `AHS.AIEngine.AIEngineFactory.getInstance()` — returns the singleton `AIEngine`
- `AIEngine.initialize()` / `dispose()` / `reset()` / `version()` / `isInitialized()` — Lifecycle
- `AIEngine.registerProvider(provider)` / `AIEngine.getProvider(id)` — delegates to `AIEngine.providers` (`ProviderManager`)
- `AIEngine.registerService(service)` / `AIEngine.getService(id)` — delegates to `AIEngine.services` (`ServiceRegistry`)
- `AIEngine.contexts` — a `ContextManager` instance
- `AIEngine.knowledge` — a `KnowledgeRegistry` instance
- `AHS.AIEngine.BaseProvider` — interface every provider extends
- `AHS.AIEngine.AIService` — interface every service extends; constructor accepts `{ provider, context }` for Dependency Injection
- `AHS.AIEngine.ProviderManager` / `ProviderRegistry` / `ProviderFactory`
- `AHS.AIEngine.ServiceRegistry`
- `AHS.AIEngine.ContextManager` / `ContextBuilder` / `ContextValidator`
- `AHS.AIEngine.PromptManager` / `PromptRegistry` / `PromptTemplate` / `PromptContext`
- `AHS.AIEngine.KnowledgeRegistry` / `KnowledgeProvider` / `KnowledgeLoader` / `KnowledgeIndex` / `KnowledgeCache`
- `AHS.AIEngine.Metadata` / `MetadataBuilder` / `MetadataValidator`
- `AHS.AIEngine.SummaryEngine` / `SummaryExtractor` / `SummaryBuilder` / `SummaryFormatter` / `SummaryValidator`
- `AHS.AIEngine.SummaryRuntime` / `SummaryHistory` / `SummarySession` / `SummaryPipeline`
- `AHS.AIEngine.SummaryContentExtractor`
- `AHS.AIEngine.SummaryComparator` (`ai-engine/src/validator/`) — compare/coverageReport/missingItems/
  checkCompatibility (the last calls the real `AHS.MaterialSummaryCard.hasSummaryContent()`)
- `AHS.AIEngine.SummaryService` (singleton) / `AHS.SummaryAdapter` (singleton, Platform namespace)
- `AHS.AIEngine.SummaryProvider` (singleton) — `setMode`/`getMode`/`getSummary`/`generateSummary`/
  `getLastComparison` (EO-AI-011 Dual-run selector, default mode `new` as of Sprint AI-013 Part A;
  EO-AI-012C: `getSummary()` is always read-only, `generateSummary()` is the only method that runs
  the New pipeline)

### Summary Model fields (12)

`title subject grade chapter section keywords concepts definitions formulas examples difficulty metadata`

`title` (EO-AI-012E): a structural pass-through of `metadata.title` — the material's
real title, not AI-generated — falls back to `null` when the material has none.
Previously an unconditional `null` stub.

### Metadata fields (17)

`subject grade chapter section topic difficulty source tags version` (EO-AI-003) plus
`id materialId semester publisher createdAt updatedAt` (EO-AI-004) plus `studyScope`
(EO-AI-004, reserved — field exists, no logic attached) plus `title` (EO-AI-012E,
mapped from the material's real title by `MetadataBuilder.fromMaterial()`, `null`
when absent — backward compatible, every pre-existing field unchanged).

### Error Framework

```
AIEngineError
  ProviderError    -> ProviderNotRegisteredError
  ServiceError      -> ServiceNotImplementedError
  ContextError
  RegistryError
  ValidationError
```

## Version

`AHS.AIEngine.VERSION` — see `src/common/Version.js`.
