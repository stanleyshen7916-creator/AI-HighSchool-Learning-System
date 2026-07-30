# ComponentInventory.md — Sprint AI-104A｜Repository Baseline Synchronization

Complete inventory of Components / Pages / Managers / Adapters / Engines / Stores, verified by
directory listing, to prevent PMO re-issuing work for something that already exists.

## Pages (`js/pages/`, 9 files — one bootstrap per HTML page)

`AppHome.js`, `AppMaterials.js`, `AppQuiz.js`, `AppWrongBook.js`, `AppReview.js`, `AppSummary.js`,
`AppLearning.js`, `AppTutor.js`, `AppDashboard.js`. Each is the last `<script>` loaded on its page;
none contain business logic beyond mounting a shell + root component.

**No `material-detail.html`/`AppMaterialDetail.js` or equivalent exists** — a Sprint asking for a
Material Detail reading view with chapter navigation (e.g. MVP-01) is asking for genuinely new
functionality, not something already built elsewhere under a different name.

## Components (`js/components/`, 22 files — page/feature-bound)

| Component | Bound to | Data source |
|---|---|---|
| `MaterialCenter` | materials.html | `MaterialRuntime`, `FolderRuntime` |
| `MaterialRecentLearning`, `HomeRecentMaterials` | index.html | `MaterialRuntime` |
| `QuizCenter` | quiz.html | `QuestionRuntime`(Exam)/`LearningQuestionRuntime`(Practice) |
| `WrongBook` | wrongbook.html | `WrongBookSession` |
| `SummaryCenter` | summary.html | `SummaryRuntime` (js/runtime/, Sprint 5 schema) |
| `Dashboard` | dashboard.html | `StatisticsRuntime`, `LearningHistoryModel` (NOT a Runtime itself — see Runtime Inventory) |
| `AiTutor`, `AiTutorHomeCard` | tutor.html, index.html | `AITutorService` |
| `QuestionGuide` | materials.html (deep link) | `LearningQuestionRuntime` |
| `ReviewHomeCard`, `ReviewQuickAction`, `ReviewRecentSession` | index.html/review.html | `HistoryRuntime` (Exam Mode) |
| `ReviewWidget` | review.html | `ReviewQueue`/`ReviewModel` (Practice Mode, additive since Sprint AI-018) |
| `ContinueLearning`, `HeroCard`, `LearningTime`, `MyLearning`, `StudyPlan`, `StudyStats`, `TodayMission`, `AchievementBadges` | index.html/learning.html | mixed real Runtime reads + honest Empty States where no Runtime exists |
| `QiaoqiaoGallery` | qiaoqiao-gallery.html | static assets only |

## UI Widgets (`js/ui/`, 22 files — reusable/context-independent)

AI107-01 note: `MaterialSubjectTabs` was removed (Sprint AI-107 Repository Audit) —
script-tagged in `materials.html` but never instantiated anywhere; superseded by
`MaterialCategoryTabs`, which `MaterialCenter.js` actually wires. `MaterialContentView`
(Sprint AI-105) added since this document's original count.

Material-specific widget cluster (17): `MaterialCard`, `MaterialGrid`, `MaterialFilter`, `MaterialSort`,
`MaterialHeader`, `MaterialSearchBar`, `MaterialCategoryTabs`, `MaterialContentView`,
`MaterialEmptyState`, `MaterialLoadingState`, `MaterialFileStore`, `MaterialFolder`,
`MaterialUploadDialog`, `BulkUploadDialog`, `MaterialPreview`, `MaterialSummaryCard`,
`MaterialQuestionCard` (17 total material-related).

Quiz-specific (2): `QuestionCard`, `QuestionNavigator`.

Cross-page (2): `AppShell` (the shared shell every page mounts into), `EmptyState` (the shared honest
empty-state component every page reuses).

**New since AI-101C** (1): `AIGatewayPanel` — additive Gateway-backed generation panel, mounted in
`MaterialPreview.js` alongside (not replacing) `MaterialSummaryCard`/`MaterialQuestionCard`.

## "Manager" modules

No file in this repository is literally named `*Manager.js` under `js/`. Under `ai-engine/`:
`PromptManager.js` (prompt/, Foundation, 5 reserved slots, no content), `ProviderManager.js`
(providers/, facade over Registry+Factory), `ServiceRegistry`/`ContextManager` also act as
manager-role classes despite not using the word "Manager" in every case. There is no
`RuntimeManager`/`ImportManager`/`ContentManager` anywhere — a Sprint requesting one of these is
requesting new work, not duplicate work, but should first check whether the functional need is
already covered by an existing Coordinator (e.g. `ImportRuntime` already is the "Import Manager"
role, deliberately not named that way per Sprint AI-103's own Runtime Rule).

## Adapters (`js/ai/`, 3 files) + `js/services/`

`SummaryAdapter`, `QuestionAdapter`, `GatewayIntegration` — see Runtime Inventory. **No
`js/services/` directory exists** — `AIProviderInterface.js` lives under `js/parser/`, not a
services folder (naming note for future Sprints referencing "the Service layer").

## Engines

`ai-engine/src/services/summary/SummaryEngine.js`, `ai-engine/src/services/question/QuestionEngine.js`
— the only two files literally named `*Engine.js`. `ai-engine/src/core/AIEngine.js` is the composition
root (Foundation, no provider/service auto-registered). No `ImportEngine`/`ContentEngine` exists.

## Stores

Every `js/runtime/*.js` file with an internal `var store = ...` is functionally a Store — see Runtime
Inventory for the full, authoritative list (32 files). `ImportRuntime` is the one deliberate exception
(Coordinator, explicitly no internal store, per Sprint AI-103).

## Parser Chain (`js/parser/`, 14 files)

`MaterialParser` → `KnowledgeBuilder` → `SummaryGenerator` → `QuestionGenerator` → `LearningPipeline`
(the original Sprint-6 stub chain, sparse output by design) coexists with the newer, real Sprint-8.0
chain: `MaterialTextProvider` → `MaterialTextPipeline` → `ParserAdapterRegistry` → `AnalysisRuntime`
→ (feeds `KnowledgeExtractionRuntime` in `js/runtime/`) → `KnowledgePipeline`. `QuestionGenerationFlow`
(legacy 4-type generator) and `WrongBookGenerator` (real, Practice Mode) round out the directory.
`AIProviderInterface.js` is a Foundation-only interface file, no concrete provider.
