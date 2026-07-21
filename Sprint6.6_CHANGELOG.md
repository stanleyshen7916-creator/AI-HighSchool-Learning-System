# Sprint 6.6 — CHANGELOG

## Round 3 — Runtime QA Round 2, Phase 1~4 Bug Fix

### Modified Files
- `js/pages/app.js` — `buildRecentMaterialsModel()`: added real `grade`
  (fixes a hardcoded "高一" found during investigation), `file` (live
  File object reference), `fileName` per item
- `js/components/HomeRecentMaterials.js` (Issue #016) — 開啟/下載 now
  genuinely open/download the file via `URL.createObjectURL()` when a
  live File reference exists; disabled with an explanatory `aria-label`
  when it doesn't (never a fake success message); removed the now-dead
  `announce()` helper; fixed the hardcoded "高一" grade display; Summary
  badge now deep-links with `?materialId=`
- `js/pages/app-summary.js` (Issue #021) — reads `?materialId=` from the
  URL and passes it to `SummaryCenter.create()`
- `js/components/SummaryCenter.js` (Issue #021) — `create(model,
  initialMaterialId)`: when given, renders that one material's Summary
  Detail via the existing `findByMaterialId()`, with the filter dropdown
  pre-selected; shows the Empty State (not a blank screen) if that
  material has no summary yet
- `css/pages/home.css` — disabled-state styling for
  `.recent-card__act`

### Investigated, No Fix Needed
- Issue #019 (Material Search) — re-verified via a real upload +
  keystroke-driven search test; already works correctly (real-time
  filtering by title/chapter/fileName/content/folder name). Likely
  Deploy Lag, consistent with the WO-002 pattern from Round 1/2.

### Unchanged (confirmed via diff)
All Runtimes, Persistence Adapter, Learning Pipeline, and every file
delivered in Rounds 1–2 not listed above (`MaterialCenter.js`,
`QuizCenter.js`, `MyLearning.js`, `BulkUploadDialog.js`,
`TodayMission.js`, `ContinueLearning.js`, `LearningTime.js`,
`AiTutor.js`, `mock-data.js`).

---

## Round 2 (original content, for reference)



### Modified Files
- `js/components/TodayMission.js` — removed internal `AHS.Mock.todayTasks`
  fallback entirely; `create(model)` now only ever renders what it's
  given (real model or `{}`), no Mock read path remains
- `js/components/HomeRecentMaterials.js` — removed internal
  `AHS.Mock.recentMaterials` fallback entirely
- `js/components/ContinueLearning.js` — removed internal
  `AHS.Mock.lastLearning` fallback entirely; updated stale header comment
- `js/components/LearningTime.js` — removed internal `AHS.Mock.learning`
  fallback entirely
- `js/data/mock-data.js` — removed now-fully-orphaned Mock objects:
  `todayTasks`, `recentMaterials`, `lastLearning`, `learning`,
  `studyStats`. `aiTutor` intentionally kept — still used by
  `js/components/AiTutor.js` (`tutor.html`), an unmigrated, still-valid
  Prototype page

### Explicitly Not Touched (scope note, see QA Fix Report for reasoning)
- `archive/`, `developer/`, `prototype/` folders — confirmed dead
  (unreferenced by any live page) but left alone; deleting folders risks
  crossing into "Repository Structure", which this WO explicitly
  protects
- Wrong Book, Dashboard, AI Tutor page, Review Center, Quiz Center Exam
  Mode, and My Learning's non-tab sections — all remain intentionally
  Mock/Prototype-driven; never authorized for Runtime migration, and
  this WO's own "不得修改 Prototype UI" protects them

### Unchanged (confirmed via diff)
Everything delivered in Round 1 (WO-001 through WO-006's actual
implementation files: `js/pages/app.js`, `js/components/MaterialCenter.js`,
`SummaryCenter.js`, `QuizCenter.js`, `MyLearning.js`,
`BulkUploadDialog.js`, `AiTutorHomeCard.js`, `StudyStats.js`,
`materials.html`, `summary.html`), all Runtimes, Persistence Adapter,
Learning Pipeline, Review Runtime, Statistics Runtime, and
`js/components/AiTutor.js`.

---

## Round 1 (original content, for reference)

## New Files
- `js/components/BulkUploadDialog.js` — WO-006 多檔案上傳共同設定 +
  個別修改對話框

## Modified Files

### `js/pages/app.js`（WO-001）
- 新增 `buildRecentMaterialsModel()` / `buildTodayMissionModel()` /
  `buildStudyStatsModel()` / `buildTodayMinutesModel()` /
  `buildContinueLearningModel()`
- `buildHome()` 內五個 Home 元件呼叫皆改為傳入上述真實／明確空 model，
  不再依賴各元件內部的 `AHS.Mock.*` Fallback

### `js/components/AiTutorHomeCard.js`（WO-001）
- 移除 `AHS.Mock.aiTutor` 讀取；`create(model)` 改為要求真實 model，
  否則渲染新增的 Empty State（「AI 老師尚無建議」）

### `js/components/StudyStats.js`（WO-001）
- 移除 `AHS.Mock.studyStats` 讀取；`create(model)` 改為要求真實
  `model.bars` 非空陣列，否則渲染新增的 Empty State（「尚無學習統計」）

### `js/components/SummaryCenter.js`（WO-003）
- 新增 `materialLabel(materialId)`，透過 `AHS.MaterialRuntime.getById()`
  組出人類可讀標籤；`materialFilter()` 的 `<option>` 文字改用此函式，
  不再顯示原始 Runtime id

### `js/components/QuizCenter.js`（WO-004）
- Practice Mode Empty State 文案調整為「尚未建立題目」/
  「請先上傳教材，系統會自動產生練習題。」

### `js/components/MyLearning.js`（WO-005）
- 「本週」分頁維持原有點擊行為
- 「本月」／「今年」／「全部」分頁改為 `disabled`，並附加
  「Coming Soon」標示；移除這三個分頁原有的 Mock 狀態訊息（因已不可
  點擊）

### `js/components/MaterialCenter.js`（WO-006）
- `onFilesPicked()`：偵測到多個檔案時改呼叫新的
  `AHS.BulkUploadDialog.open()`；單檔案時的行為完全不變（仍呼叫既有
  `AHS.MaterialUploadDialog.open()`）

### `materials.html`
- 新增 `<script src="js/components/BulkUploadDialog.js">`

### `summary.html`
- 新增 `<script src="js/runtime/MaterialRuntime.js">`（WO-003 Dropdown
  所需）

### `css/pages/home.css`（WO-001）
- 新增 `.tutor-card__empty*`／`.stats-card__empty*` 樣式

### `css/pages/learning.css`（WO-005）
- `.ml-tab` 新增 flex 排列；新增 `.ml-tab.is-disabled`／`.ml-tab__soon`
  樣式

### `css/pages/material.css`（WO-006）
- 新增 `.mat-dialog--bulk`／`.mat-bulk__*` 樣式群組（共同設定區塊、
  每列個別欄位、RWD 斷點）

## Unchanged（明確確認）
- `js/core/PersistenceAdapter.js`
- `js/runtime/MaterialRuntime.js`／`KnowledgeRuntime.js`／
  `SummaryRuntime.js`／`LearningQuestionRuntime.js`／`QuestionRuntime.js`
  （Public API／Schema）
- `js/runtime/ReviewRuntime.js`／`StatisticsRuntime.js`
- `js/services/LearningPipeline.js`／`MaterialParser.js`／
  `KnowledgeBuilder.js`／`SummaryGenerator.js`／`QuestionGenerator.js`
- `js/components/TodayMission.js`／`HomeRecentMaterials.js`／
  `ContinueLearning.js`／`LearningTime.js`（本身未修改，僅由 `app.js`
  傳入不同的 model）
- `index.html`（本次未新增/調整任何 script 標籤）
- `quiz.html`（Exam Mode 相關 script 與邏輯完全未變）
