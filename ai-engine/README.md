# AI Engine

Status: Core Foundation (EO-MIG-002 / EO-AI-001 ~ EO-AI-004) plus the `summary` service (EO-AI-005), its Runtime integration (EO-AI-006), and a Service Layer (EO-AI-007) — still no LLM connected anywhere, and **not wired into any page's visible UI**. Material Detail's existing AI 重點整理 feature (`MaterialPreview` → `MaterialSummaryCard` → `AITutorService` → `KnowledgeSummaryRuntime`) is a separate, untouched Baseline system — see EO-AI-007's REPORT for why this layer stays UI-free.

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
                                 SummaryEngine.generate()) -> SummaryFormatter -> SummaryRuntime.save()
                                 -> SummaryHistory.record() -> return
    service/
      SummaryService.js       — generate(materialId)/generateFromMaterial(material)/get(materialId);
                                 singleton owning one SummaryRuntime + one SummaryPipeline for the
                                 page's lifetime; no DOM, not wired into MaterialPreview.js
    common/
      Constants.js            — reserved service/provider ids
      Errors.js                — unified Error Framework (see below)
      Version.js                — AI Engine layer version
      Utilities.js               — isPlainObject / freeze
```

`js/ai/SummaryAdapter.js` (Platform side, `AHS.SummaryAdapter`) sits in front of
`AHS.AIEngine.SummaryService` — `generate`/`generateFromMaterial`/`get`, no DOM,
never touches `SummaryRuntime`/`SummaryPipeline` directly. Not loaded by any
HTML page yet (no `<script>` tag added).

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
- `AHS.AIEngine.SummaryService` (singleton) / `AHS.SummaryAdapter` (singleton, Platform namespace)

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
