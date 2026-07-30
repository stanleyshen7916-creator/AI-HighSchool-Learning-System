# ExtensionPoints.md — Sprint AI-104A｜Repository Baseline Synchronization

Where new Sprints may add, where they may not, and what "adding" means in each category — to
prevent the repeated pattern of a Sprint asking to "建立 X Runtime" for an X that already exists.

## Runtime (`js/runtime/`, `ai-engine/src/runtime/`)

- ✅ **Allowed**: a genuinely new domain with no existing Runtime (check `RuntimeInventory.md`
  first — 32 + 8 = 40 already exist, spanning Material/Summary/Question/WrongBook/Review/History/
  Statistics/Knowledge/Folder/Classifier/AITutor/Import/Gateway domains).
- ✅ **Allowed**: a purely additive method on an existing Runtime, when the existing API genuinely
  cannot support a new, legitimate need (precedent: `QuestionRuntime.importQuestions()`, Sprint
  AI-103) — must not touch any existing method's signature or behavior.
- ❌ **Forbidden**: creating a new Runtime with the same or a confusingly similar name/role to an
  existing one (the repeated real mistake this Sprint exists to prevent).
- ❌ **Forbidden**: modifying an existing LOCK Runtime's existing method behavior or removing a field.
- ❌ **Forbidden**: a parallel Runtime "just for this Sprint's data" when an existing Runtime's
  `add()`/`sync()`-style API can already accept externally-sourced, already-built records (precedent:
  `MaterialRuntime.add()`, `SummaryRuntime.add()`, `WrongBookRuntime.sync()` all already accept this
  shape — reuse them, do not rebuild them).

## Adapter (`js/ai/`)

- ✅ **Allowed**: a new Adapter for a new `ai-engine` service once that service's Foundation exists
  (precedent: `SummaryAdapter`/`QuestionAdapter`).
- ✅ **Allowed**: additive methods on an existing Adapter (precedent: `generateViaGateway()` added to
  both existing Adapters, Sprint AI-101C, zero existing method touched).
- ❌ **Forbidden**: an Adapter that bypasses its target service/Runtime's own encapsulation (e.g.
  reaching into a Service's private closure-scoped Runtime instance directly).

## Manager / Coordinator (no fixed folder — placed by role)

- ✅ **Allowed**: a new Coordinator that orchestrates existing Runtimes without storing data itself
  (precedent: `ImportRuntime`, Sprint AI-103 — "唯一工作：協調").
- ❌ **Forbidden**: a Coordinator that accumulates its own persistent store — that makes it a Runtime,
  not a Coordinator, and should be named/reviewed as one.

## Engine (`ai-engine/src/services/*/`)

- ✅ **Allowed**: populating one of the five still-empty service slots (`explanation/`, `knowledge/`,
  `prompt/`, `review/`, `tutor/`) — reserved since EO-MIG-002, following the exact Foundation shape
  `summary/`/`question/` already established (Extractor/Builder/Formatter/Validator/Engine).
- ❌ **Forbidden**: a new top-level Engine outside `ai-engine/src/services/*/`'s established pattern.

## Data (`js/data/`)

- ✅ **Allowed**: new static config/seed-data files under `js/data/` (existing precedent:
  `AppConfig.js`, `MockData.js`, `ExamData.js`, `QuotesData.js`, `TasksData.js`) — including
  PMO-authored seed content, loaded via a normal `<script>` tag as a plain JS object/array, never via
  `fetch()`.
- ❌ **Forbidden**: any new top-level `/data/` folder, or any file expected to be loaded via
  `fetch()`/an HTTP request of any kind (breaks `file://`/GitHub Pages compatibility and the
  project's forbidden-pattern rule).

## Component / UI (`js/components/`, `js/ui/`)

- ✅ **Allowed**: new components/widgets for genuinely new UI surfaces (precedent: `AIGatewayPanel.js`,
  additive, mounted alongside existing cards, not replacing them).
- ❌ **Forbidden** (per every recent Sprint's own Baseline Lock language): modifying an existing
  Baseline component's rendering/behavior for Home, Material Center, Quiz Center, Wrong Book, Review
  Center, or Dashboard, except for an explicitly-scoped bug fix.

## Page (`js/pages/`, `*.html`)

- ✅ **Allowed**: a new page + bootstrap file for genuinely new top-level functionality (e.g. a future
  Material Detail reading view, if confirmed to need its own page rather than a Material Center state).
- ✅ **Allowed**: adding new `<script>` tags to an existing page's dependency chain, in correct load
  order, when wiring in an already-built-but-unwired module (precedent: every AI-100/AI-101/AI-103
  Sprint's eventual UI-wiring step).
- ❌ **Forbidden**: changing an existing page's visual layout or removing an existing section, except
  for an explicitly-scoped bug fix.

## Store (any `var store = ...` inside a Runtime)

- ✅ **Allowed**: as part of a new, genuinely-needed Runtime (see Runtime rules above).
- ❌ **Forbidden**: a store hidden inside something declared as a "Coordinator"/"Adapter"/"Manager" —
  those roles are explicitly no-store by convention (see `ImportRuntime`'s own Runtime Rule).

## Docs (`docs/`)

- ✅ **Allowed**: new Sprint report pairs under `docs/migration/`+`docs/QA/`, new specification
  documents under `docs/Architecture/` for genuinely new subsystems.
- ⚠️ **Requires explicit Sprint authorization**: modifying `docs/PMO/*` — CLAUDE.md's standing rule
  protects this folder from casual edits; this Sprint (AI-104A) is itself an example of the explicit
  authorization required, since Task AI104A-06 specifically calls for a Sprint Status update.
