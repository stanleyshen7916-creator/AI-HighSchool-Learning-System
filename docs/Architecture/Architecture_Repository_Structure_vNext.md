# Architecture_Repository_Structure_vNext.md — Sprint AI-104A｜Repository Baseline Synchronization

**Generated from real repository inspection** (`find`/`ls`/`git log`), not from the prior
`Architecture_Repository_Structure_v2.1.md`, per this Sprint's explicit instruction ("不得依照舊文件").
That document is not deleted (still governs anything not superseded here) but is now stale in the
respects this document corrects.

## Top-Level Directories

```
AI-HighSchool-Learning-System/
  ai-engine/       — AI Engine layer (Foundation + Summary/Question pipelines + Gateway). See below.
  assets/          — static images/illustrations, flattened (v2.1 rule unchanged: no illustrations/ subfolder)
  css/             — base/ components/ pages/ utilities/ (unchanged from v2.1)
  docs/            — Architecture/ EO/ PMO/ QA/ migration/ Release/ (eight-category doc rule unchanged)
  js/              — NINE categories now, not eight — see below
  platform/        — placeholder, .gitkeep only, not wired into any page (unchanged from v2.1)
  scripts/         — verify/ (VerifyPaths.js, VerifyForbiddenPatterns.js)
  shared/          — placeholder, .gitkeep only, not wired into any page (unchanged from v2.1)
  tests/           — jsdom/ regression/ validator/
  *.html           — index, materials, quiz, wrongbook, review, summary, learning, tutor, dashboard, qiaoqiao-gallery
  CLAUDE.md, ChangedFiles.txt, LICENSE, README.md, package.json, package-lock.json
```

**No top-level `/import` or `/data` folder exists or is authorized.** Two recent Sprint proposals
(Sprint 7/Content Import Runtime's original draft, Sprint MVP-01/Material Runtime Integration) each
asked for one; both were declined per Repository Truth and either corrected (AI-103) or are pending
correction (MVP-01) to use existing categories instead.

## `js/` — NINE fixed categories (not eight — correcting v2.1)

`docs/Architecture/Architecture_Repository_Structure_v2.1.md` states "js/（八分類，不得混放）" — eight
categories. Real repository state has had a **ninth category, `js/ai/`,** since EO-AI-007
(2026-07-26 era) and it is real, growing, production code (`SummaryAdapter.js`, `QuestionAdapter.js`,
`GatewayIntegration.js` — 3 files, Sprint AI-101/AI-101C). This document corrects that count going
forward: **nine categories**, `ai/` added.

| Category | File count | Purpose (unchanged from v2.1 except `ai/`) |
|---|---|---|
| `core/` | 4 | namespace/shared services (`UI`, `Icons`, `Qiaoqiao`, `PersistenceAdapter`) |
| `runtime/` | 32 | stateful business-logic modules, one per domain — see Runtime Inventory |
| `parser/` | 14 | document-processing pipeline chain (stub implementations, sparse output expected) |
| `pages/` | 9 | one bootstrap file per HTML page |
| `components/` | 22 | feature components bound to a specific page/context |
| `ui/` | 21 | reusable, context-independent widgets |
| `data/` | 5 | static mock data / config only |
| `utils/` | 5 | small stateless helpers |
| **`ai/`** | **3** | **Platform-side thin adapters in front of `ai-engine/`'s services (`SummaryAdapter`, `QuestionAdapter`, `GatewayIntegration`) — established EO-AI-007, real production code since Sprint AI-101C** |

## `ai-engine/` — real, substantial, NOT empty scaffolding

`docs/Architecture/Architecture_Repository_Structure_v2.1.md` and CLAUDE.md's Project Overview both
describe `ai-engine/` as placeholder `.gitkeep` scaffolding. **This has been wrong since EO-AI-001
(2026-07-26).** Real, current inventory:

```
ai-engine/src/
  common/       (4)  — Utilities, Errors, Version, Constants
  core/         (4)  — AIEngine, AIEngineFactory, AIService, ServiceRegistry
  providers/    (4)  — BaseProvider, ProviderRegistry, ProviderFactory, ProviderManager (no LLM connection, Foundation only)
  context/      (3)  — ContextManager, ContextBuilder, ContextValidator
  prompt/       (4)  — PromptManager, PromptRegistry, PromptTemplate, PromptContext (Foundation, 5 reserved slots, no content yet)
  knowledge/    (8)  — Metadata/MetadataBuilder/MetadataValidator, KnowledgeCache/Loader/Index/Provider/Registry
  gateway/      (5)  — AIGateway, GatewayConfig, GatewayConfigValidator, ApiClient, HttpApiClient (Sprint AI-100/AI-101C)
  schema/       (4)  — SummarySchema, QuestionSchema, ErrorSchema, SchemaValidator (Sprint AI-100)
  services/summary/ (5) — SummaryExtractor/Builder/Formatter/Validator/Engine
  services/question/ (5) — QuestionExtractor/Builder/Formatter/Validator/Engine (Sprint AI-101)
  services/{explanation,knowledge,prompt,review,tutor}/ — still empty, one future Sprint each
  parser/       (1)  — SummaryContentExtractor (rule-based, no LLM)
  runtime/      (8)  — Summary{Runtime,History,Session,Pipeline}, Question{Runtime,History,Session,Pipeline} (Sprint AI-101 added the Question half)
  service/      (4)  — SummaryService, SummaryProvider, QuestionService, QuestionProvider
  validator/    (1)  — SummaryComparator
```

**Total: 60 real files**, not `.gitkeep` placeholders. `platform/` and `shared/` remain genuinely
empty placeholder scaffolding — the "empty, do not populate" description is still accurate for
those two only.

## `docs/` — categories unchanged, volume grown substantially

`Architecture/`, `EO/`, `PMO/`, `QA/`, `migration/`, `Release/` — same eight-category rule as v2.1.
Notably grown since v2.1: `docs/Architecture/` now holds the 7-document AI Gateway specification set
(Sprint AI-100.5) plus this Sprint's new baseline documents; `docs/migration/` and `docs/QA/` each
hold one report pair per Sprint since AI-015F (dozens of files).

## Naming Rules (LOCK) — unchanged

JS: PascalCase filenames. CSS: kebab-case. Markdown docs: `PMO_`/`EO_`/`QA_`/`PAT_`/`Decision_`/
`Release_`/`Architecture_` prefixes **as a guideline** — real practice (confirmed by directory
listing) has been `Sprint_<ID>_<Kind>.md` under `docs/migration/`/`docs/QA/` since Sprint AI-015F,
which this document does not attempt to retroactively rename.

## Forbidden Patterns — unchanged, one real exception now documented

`localStorage`, `indexedDB`, `fetch(`, `XMLHttpRequest`, `import`/`export` statements,
`window.location.href =` (one pre-existing KNOWN-ISSUE tracked exception) remain forbidden in `js/`
and `css/` (the only directories `scripts/verify/VerifyForbiddenPatterns.js` scans).

**One real, narrow, documented exception now exists**: `ai-engine/src/gateway/HttpApiClient.js`
contains this repository's first-ever real `fetch()` call (Sprint AI-101C). It is outside the
scanner's scanned directories (`js/`/`css/` only — a scanner scope gap, not a rule change), is a
single file, calls exactly one configurable external endpoint (empty by default — no network call
happens without explicit deployer configuration), and exists only because of an explicit, staged
PMO authorization sequence (AI-100 → AI-100.5 → AI-101B → AI-101C). This is not a general license for
`fetch()`/network I/O elsewhere in the codebase — every other file's "no network" discipline is
unchanged and this document does not authorize any further exception.
