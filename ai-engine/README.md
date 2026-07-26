# AI Engine

Status: Core Foundation (EO-MIG-002 / EO-AI-001 ~ EO-AI-004) plus the `summary` service (EO-AI-005), its Runtime integration (EO-AI-006), a Service Layer (EO-AI-007), a read-only legacy-compatibility bridge (EO-AI-008), rule-based content extraction (EO-AI-009), its Core Concept classification HOTFIX (EO-AI-010A), and a Legacy/New Dual-run selector (EO-AI-011) — still no LLM anywhere, and **not wired into any page's visible UI**. Material Detail's existing AI 重點整理 feature (`MaterialPreview` → `MaterialSummaryCard` → `AITutorService` → `KnowledgeSummaryRuntime`) is a separate, untouched Baseline system and remains the only thing users see. As of EO-AI-009, `SummaryPipeline.run()` output now includes a `.summary` object shaped exactly like `MaterialSummaryCard.js` expects (`coreConcepts`/`keywords`/`definitions`/`formulas`/`importantPoints`, all rule-extracted verbatim from the material's real text — no LLM, no fabrication) — but **actually wiring `MaterialSummaryCard` to use it is still deferred to a future "AI Summary Migration" EO**, not done here. EO-AI-010 added `SummaryComparator` (real-data equivalence validation only, no code change to either pipeline) and found a known Core Concept coverage gap — EO-AI-010A Revision-1 fixed it (added a concept-explanatory-sentence classification rule; the Keyword length rule is unchanged) and re-validated 100% coverage across all five categories with zero regression — see `docs/migration/EO_AI_010_VALIDATION.md`'s "HOTFIX Comparison" section for the real before/after numbers. EO-AI-011 added `SummaryProvider` — a single entry point selecting between `legacy` (default) / `new` / `compare` mode; in `compare` mode both pipelines run and are diffed via the existing `SummaryComparator`, but the value returned (what a caller/UI would see) is always the Legacy summary, and the diff report lives only in an in-memory variable (`getLastComparison()`), never written to any Runtime. EO-AI-012 Revision-1 added a **Migration Bridge**: `js/runtime/AITutorService.js`'s `getLearningSummary()` now checks for `AHS.AIEngine.SummaryProvider` and, when present, delegates the read to it (SummaryProvider alone decides legacy/new/compare — `AITutorService` never inspects the mode); `SummaryProvider` is still not wired into any page (that is EO-AI-012A), so on every real page today this check finds nothing and falls through to the exact pre-EO-AI-012 behaviour — verified byte-identical. `ensureLearningSummary()`'s generation chain is untouched. Default mode stays `legacy` — flipping it is EO-AI-012B, and true Legacy removal is a separate future EO-AI-013 (`Legacy Cleanup`, gated on a Sprint of stability).

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
      Metadata.js                — 16 reserved fields, see below (studyScope reserved, no logic attached)
      MetadataBuilder.js          — fluent builder producing a Metadata instance; fromMaterial(material)
                                     maps a Material Runtime record onto Metadata fields
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
        SummaryBuilder.js        — assembles the 12-field Summary Model; title/concepts/
                                    definitions/formulas/examples are honest stubs (no AI text
                                    generation yet); keywords is a pass-through of tags
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
                                    rule (KEYWORD_MAX_LENGTH=6) is unchanged.
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
                                 for Dual-run. legacy reads AHS.KnowledgeSummaryRuntime read-only; new
                                 delegates to the existing SummaryService singleton (no second
                                 Pipeline/Runtime instance); compare runs both, diffs them via the
                                 existing SummaryComparator, keeps the report only in memory, and
                                 still returns the Legacy summary — Compare mode never changes what a
                                 caller/UI would see. Default mode is 'legacy', never auto-switched.
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
additive, the four EO-AI-007/008 methods above are unchanged. Not loaded by
any HTML page yet (no `<script>` tag added) — `MaterialSummaryCard.js` does
not call it.

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
- `AHS.AIEngine.SummaryProvider` (singleton) — `setMode`/`getMode`/`getSummary`/`getLastComparison`
  (EO-AI-011 Dual-run selector, default mode `legacy`)

### Summary Model fields (12)

`title subject grade chapter section keywords concepts definitions formulas examples difficulty metadata`

### Metadata fields (16)

`subject grade chapter section topic difficulty source tags version` (EO-AI-003) plus
`id materialId semester publisher createdAt updatedAt` (EO-AI-004) plus `studyScope`
(EO-AI-004, reserved — field exists, no logic attached).

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
