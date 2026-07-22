# Sprint 6.6 — CHANGELOG (Round 4)
Runtime QA Round 3 Bug Fix — Issue #022 / #023 / #024 / Interactive Component Audit

## Modified Files

### `js/components/AppShell.js` (Issue #022)
- `topbar()`: search input now accepts an optional `onGlobalSearch`
  callback, wired to its native `input` event. Every page that doesn't
  pass this option is completely unaffected.
- `create(model, options)`: new optional `options.onGlobalSearch(keyword)`,
  threaded through to `topbar()`.

### `js/components/MaterialCenter.js` (Issue #022, #023)
- `create()`'s returned root now exposes `setKeyword(keyword)`, letting
  an external caller (the shared Header) drive the existing search
  pipeline.
- Search matching now also checks `item.id`（教材編號）in addition to
  title/chapter/fileName/content/folder name.
- Format matching: "其他" now matches any `fileType` not in the named
  list, instead of being a no-op option.

### `js/pages/app-materials.js` (Issue #022)
- Wires `AppShell`'s `onGlobalSearch` to `MaterialCenter`'s new
  `setKeyword()`.

### `js/data/mock-data.js` (Issue #023)
- `formats` expanded from `["全部格式","PDF","PPT","DOCX","MP4"]` to the
  full WO-012 list (17 options including 其他).

### `js/components/SummaryCenter.js` (Issue #024)
- New `noSummaryForMaterialState(materialId)` — distinct from the
  generic `emptyState()` — for a `?materialId=` deep link into a
  material that has no Summary record at all ("尚未建立學習總結").
- `summaryRecordCard()`: when a real record's five sections are ALL
  genuinely empty, renders one consolidated, honest explanatory message
  instead of five repetitive "尚無資料" blocks. When at least one
  section has real content, renders each section individually as
  before (no change to that path).
- `renderRecords()` / `renderAll()`: threads the active materialId
  through so the correct empty-state variant is chosen.

### `css/pages/summary.css` (Issue #024)
- New `.sum-section--pending` / `.sum-section__pending*` styles for the
  consolidated pending-content message.

## Investigated, No Fix Needed
- Header Search's root cause (Issue #022) was real: `.topbar__search-input`
  never had any event listener. Now fixed.
- The Summary Detail investigation (Issue #024) confirmed
  `SummaryCenter.js` correctly reads `AHS.SummaryRuntime` — the empty
  sections are an honest reflection of the current Stub-based pipeline
  (no real document-content extraction exists anywhere in this repo),
  not a Runtime-read bug. Addressed with clearer, honest messaging (see
  above) rather than fabricated content.

## Unchanged (confirmed via diff)
All Runtimes, `js/core/PersistenceAdapter.js`, `js/services/
LearningPipeline.js`, `js/components/QuizCenter.js`, `MyLearning.js`,
`BulkUploadDialog.js`, `TodayMission.js`, `ContinueLearning.js`,
`LearningTime.js`, `AiTutor.js`, `AiTutorHomeCard.js`, `StudyStats.js`,
`js/pages/app.js`, `js/pages/app-summary.js`,
`HomeRecentMaterials.js`, `css/base/tokens.css`, `css/layout/shell.css`.
