# QA_EO-S6.8-Repository-001 · Repository Audit Report

- 日期：2026-07-22
- 執行：Claude（Frontend）
- 範圍：僅移動／更名／路徑修正／清理 —— Runtime Logic、Business Logic、Data Flow、Parser Interface **零變更**（迴歸測試逐位驗證，見 §6）

---

## 1. 移動檔案清單（41 項，檔名不變）

- `PROJECT_STATUS.json -> docs/PMO/PROJECT_STATUS.json`
- `QA.json -> docs/PMO/QA.json`
- `SPRINT.json -> docs/PMO/SPRINT.json`
- `TASKS.json -> docs/PMO/TASKS.json`
- `VERSION.json -> docs/PMO/VERSION.json`
- `docs/release/Release_Workflow_v1.0.md -> docs/Release/Release_Workflow_v1.0.md`
- `js/services/MaterialParser.js -> js/parser/MaterialParser.js`
- `js/services/KnowledgeBuilder.js -> js/parser/KnowledgeBuilder.js`
- `js/services/SummaryGenerator.js -> js/parser/SummaryGenerator.js`
- `js/services/QuestionGenerator.js -> js/parser/QuestionGenerator.js`
- `js/services/LearningPipeline.js -> js/parser/LearningPipeline.js`
- `js/components/AchievementBadges.js -> js/ui/AchievementBadges.js`
- `js/components/AiTutorHomeCard.js -> js/ui/AiTutorHomeCard.js`
- `js/components/AppShell.js -> js/ui/AppShell.js`
- `js/components/BulkUploadDialog.js -> js/ui/BulkUploadDialog.js`
- `js/components/ContinueLearning.js -> js/ui/ContinueLearning.js`
- `js/components/HeroCard.js -> js/ui/HeroCard.js`
- `js/components/HomeRecentMaterials.js -> js/ui/HomeRecentMaterials.js`
- `js/components/LearningTime.js -> js/ui/LearningTime.js`
- `js/components/MaterialCard.js -> js/ui/MaterialCard.js`
- `js/components/MaterialCategoryTabs.js -> js/ui/MaterialCategoryTabs.js`
- `js/components/MaterialEmptyState.js -> js/ui/MaterialEmptyState.js`
- `js/components/MaterialFilter.js -> js/ui/MaterialFilter.js`
- `js/components/MaterialFolder.js -> js/ui/MaterialFolder.js`
- `js/components/MaterialGrid.js -> js/ui/MaterialGrid.js`
- `js/components/MaterialHeader.js -> js/ui/MaterialHeader.js`
- `js/components/MaterialLoadingState.js -> js/ui/MaterialLoadingState.js`
- `js/components/MaterialPreview.js -> js/ui/MaterialPreview.js`
- `js/components/MaterialRecentLearning.js -> js/ui/MaterialRecentLearning.js`
- `js/components/MaterialSearchBar.js -> js/ui/MaterialSearchBar.js`
- `js/components/MaterialSort.js -> js/ui/MaterialSort.js`
- `js/components/MaterialSubjectTabs.js -> js/ui/MaterialSubjectTabs.js`
- `js/components/MaterialUploadDialog.js -> js/ui/MaterialUploadDialog.js`
- `js/components/QuestionCard.js -> js/ui/QuestionCard.js`
- `js/components/QuestionNavigator.js -> js/ui/QuestionNavigator.js`
- `js/components/ReviewHomeCard.js -> js/ui/ReviewHomeCard.js`
- `js/components/ReviewQuickAction.js -> js/ui/ReviewQuickAction.js`
- `js/components/ReviewRecentSession.js -> js/ui/ReviewRecentSession.js`
- `js/components/StudyPlan.js -> js/ui/StudyPlan.js`
- `js/components/StudyStats.js -> js/ui/StudyStats.js`
- `js/components/TodayMission.js -> js/ui/TodayMission.js`

## 2. 更名清單（76 項，含移動＋更名）

- `BUG_REPORT.md -> docs/QA/QA_Bug_Report.md`
- `CHANGELOG.md -> docs/Release/Release_Changelog.md`
- `RELEASE_NOTE.md -> docs/Release/Release_Note.md`
- `REPORT.md -> docs/EO/EO_S6.8-002_Report.md`
- `Sprint6.6_CHANGELOG.md -> docs/Release/Release_Sprint6.6_Changelog.md`
- `Sprint6.6_CHANGELOG_Final.md -> docs/Release/Release_Sprint6.6_Changelog_Final.md`
- `Sprint6.6_CHANGELOG_Round4.md -> docs/Release/Release_Sprint6.6_Changelog_Round4.md`
- `Sprint6.6_QA_FIX_REPORT.md -> docs/QA/QA_Sprint6.6_Fix_Report.md`
- `Sprint6.6_Runtime_QA_Final_FIX_REPORT.md -> docs/QA/QA_Sprint6.6_Runtime_Final_Fix_Report.md`
- `Sprint6.6_Runtime_QA_Round3_FIX_REPORT.md -> docs/QA/QA_Sprint6.6_Runtime_Round3_Fix_Report.md`
- `docs/Dependency_Audit.md -> docs/Architecture/Architecture_Dependency_Audit.md`
- `docs/MISSING_FILES.md -> docs/QA/QA_Missing_Files.md`
- `docs/QA_FIX_Report.md -> docs/QA/QA_Fix_Report.md`
- `docs/Repository_ChangeLog.md -> docs/Release/Release_Repository_Changelog.md`
- `docs/qa/GPT_QA_Workflow_v1.0.md -> docs/PMO/PMO_QA_Workflow_v1.0.md`
- `docs/qa/HOTFIX-001_Architecture_Update.md -> docs/Decision/Decision_PMO-025_Architecture_Evolution_v2.0.md`
- `docs/tasks/DEV-006_Home_Prototype_v0.2.md -> docs/EO/EO_DEV-006_Home_Prototype_v0.2.md`
- `docs/workflow/Claude_Workspace_Workflow_v1.0.md -> docs/PMO/PMO_Claude_Workspace_Workflow_v1.0.md`
- `docs/workflow/Git_Workflow_v1.0.md -> docs/PMO/PMO_Git_Workflow_v1.0.md`
- `docs/workflow/Repository_Workflow_v1.0.md -> docs/PMO/PMO_Repository_Workflow_v1.0.md`
- `docs/developer-platform/Branch_Strategy_v1.0.md -> docs/PMO/PMO_Branch_Strategy_v1.0.md`
- `docs/developer-platform/Capability_Matrix_v1.0.md -> docs/PMO/PMO_Capability_Matrix_v1.0.md`
- `docs/developer-platform/Commit_Message_Rule_v1.0.md -> docs/PMO/PMO_Commit_Message_Rule_v1.0.md`
- `docs/developer-platform/Developer_Platform_Repository_Structure_v1.0.md -> docs/PMO/PMO_Developer_Platform_Repository_Structure_v1.0.md`
- `docs/developer-platform/Developer_Platform_v1.0_Index.md -> docs/PMO/PMO_Developer_Platform_v1.0_Index.md`
- `docs/developer-platform/Version_Rule_v1.0.md -> docs/PMO/PMO_Version_Rule_v1.0.md`
- `docs/qa/EO-R001A_Runtime_Integration_QA.md -> docs/QA/QA_EO-R001A_Runtime_Integration.md`
- `docs/qa/EO-R001_Review_Home_QA.md -> docs/QA/QA_EO-R001_Review_Home.md`
- `docs/qa/EO-S5-002_Summary_Review_Integration_QA.md -> docs/QA/QA_EO-S5-002_Summary_Review_Integration.md`
- `docs/qa/EO-S5-003_Runtime_QA_Hotfix_QA.md -> docs/QA/QA_EO-S5-003_Runtime_QA_Hotfix.md`
- `docs/qa/EO-S6-001_Material_Parser_Foundation_QA.md -> docs/QA/QA_EO-S6-001_Material_Parser_Foundation.md`
- `docs/qa/EO-S6-002_Knowledge_Builder_Foundation_QA.md -> docs/QA/QA_EO-S6-002_Knowledge_Builder_Foundation.md`
- `docs/qa/EO-S6-003_Summary_Generator_Foundation_QA.md -> docs/QA/QA_EO-S6-003_Summary_Generator_Foundation.md`
- `docs/qa/EO-S6-004_Learning_Question_Generator_Foundation_QA.md -> docs/QA/QA_EO-S6-004_Learning_Question_Generator_Foundation.md`
- `docs/qa/EO-S6-005_Learning_Pipeline_Integration_QA.md -> docs/QA/QA_EO-S6-005_Learning_Pipeline_Integration.md`
- `docs/qa/EO-S6-006_System_Runtime_Integration_QA.md -> docs/QA/QA_EO-S6-006_System_Runtime_Integration.md`
- `docs/qa/EO-S6-007_End-to-End_Integration_QA.md -> docs/QA/QA_EO-S6-007_End-to-End_Integration.md`
- `docs/qa/EO-S6.8-002_AI_Question_Guide_PAT_Critical_QA.md -> docs/QA/QA_EO-S6.8-002_AI_Question_Guide_PAT_Critical.md`
- `docs/qa/HOTFIX-001_Runtime_Persistence_QA.md -> docs/QA/QA_HOTFIX-001_Runtime_Persistence.md`
- `docs/qa/Sprint4_Quiz_Runtime_Foundation_QA.md -> docs/QA/QA_Sprint4_Quiz_Runtime_Foundation.md`
- `js/core/ui.js -> js/core/UI.js`
- `js/data/mock-data.js -> js/core/MockData.js`
- `js/data/exam.js -> js/core/ExamData.js`
- `js/data/quotes.js -> js/core/QuotesData.js`
- `js/data/tasks.js -> js/core/TasksData.js`
- `js/pages/app.js -> js/core/AppHome.js`
- `js/pages/app-materials.js -> js/core/AppMaterials.js`
- `js/pages/app-summary.js -> js/core/AppSummary.js`
- `js/pages/app-quiz.js -> js/core/AppQuiz.js`
- `js/pages/app-wrongbook.js -> js/core/AppWrongBook.js`
- `js/pages/app-learning.js -> js/core/AppLearning.js`
- `js/pages/app-dashboard.js -> js/core/AppDashboard.js`
- `js/pages/app-tutor.js -> js/core/AppTutor.js`
- `js/pages/ReviewHome.js -> js/core/AppReview.js`
- `js/utils/countdown.js -> js/utils/Countdown.js`
- `js/utils/date.js -> js/utils/DateUtils.js`
- `js/utils/greeting.js -> js/utils/Greeting.js`
- `js/utils/quote.js -> js/utils/Quote.js`
- `js/utils/task.js -> js/utils/TaskUtils.js`
- `css/layout/shell.css -> css/base/layout.css`
- `assets/expressions/expr_celebrate.png -> assets/illustrations/expressions/expr-celebrate.png`
- `assets/expressions/expr_cheer.png -> assets/illustrations/expressions/expr-cheer.png`
- `assets/expressions/expr_confused.png -> assets/illustrations/expressions/expr-confused.png`
- `assets/expressions/expr_determined.png -> assets/illustrations/expressions/expr-determined.png`
- `assets/expressions/expr_gentle.png -> assets/illustrations/expressions/expr-gentle.png`
- `assets/expressions/expr_greeting.png -> assets/illustrations/expressions/expr-greeting.png`
- `assets/expressions/expr_love.png -> assets/illustrations/expressions/expr-love.png`
- `assets/expressions/expr_shy.png -> assets/illustrations/expressions/expr-shy.png`
- `assets/expressions/expr_thinking.png -> assets/illustrations/expressions/expr-thinking.png`
- `assets/expressions/expr_tired.png -> assets/illustrations/expressions/expr-tired.png`
- `assets/avatars/pose_blackboard.png -> assets/illustrations/avatars/pose-blackboard.png`
- `assets/avatars/pose_pointing.png -> assets/illustrations/avatars/pose-pointing.png`
- `assets/avatars/pose_reading.png -> assets/illustrations/avatars/pose-reading.png`
- `assets/avatars/pose_standing.png -> assets/illustrations/avatars/pose-standing.png`
- `assets/avatars/pose_thumbsUp.png -> assets/illustrations/avatars/pose-thumbs-up.png`
- `assets/avatars/pose_wave.png -> assets/illustrations/avatars/pose-wave.png`

## 3. 路徑修正清單

### HTML（10 頁全數更新）
- `dashboard.html: 5 個引用更新`
- `index.html: 22 個引用更新`
- `learning.html: 5 個引用更新`
- `materials.html: 25 個引用更新`
- `qiaoqiao-gallery.html: 1 個引用更新`
- `quiz.html: 7 個引用更新`
- `review.html: 8 個引用更新`
- `summary.html: 5 個引用更新`
- `tutor.html: 5 個引用更新`
- `wrongbook.html: 5 個引用更新`

### JavaScript（1 檔）
- `js/core/Qiaoqiao.js`：`EXPR_BASE` → `assets/illustrations/expressions/`、`POSE_BASE` → `assets/illustrations/avatars/`；檔名前綴 `expr_`/`pose_` → `expr-`/`pose-`，新增 `kebab()` 純路徑轉換（`thumbsUp` → `thumbs-up`）。**兩個獨立 base 常數依既有教訓保留、未合併**。全部 16 個建構路徑經腳本逐一驗證存在。

### CSS（1 檔，機械等價修正）
- `css/pages/material.css`：2 處禁用之 `inset: 0` 簡寫 → `top/right/bottom/left: 0` 長寫（渲染結果逐位等價，零視覺變更）。

## 4. 移除清單（25 項）

- `docs/Repository_Tree.md`
- `docs/qa/ (整個資料夾，1 檔)`
- `docs/release/ (整個資料夾，1 檔)`
- `docs/tasks/ (整個資料夾，1 檔)`
- `docs/workflow/ (整個資料夾，1 檔)`
- `docs/developer-platform/ (整個資料夾，1 檔)`
- `docs/changelog/ (整個資料夾，1 檔)`
- `docs/dashboard/ (整個資料夾，1 檔)`
- `docs/design/ (整個資料夾，1 檔)`
- `docs/governance/ (整個資料夾，1 檔)`
- `docs/issues/ (整個資料夾，1 檔)`
- `docs/meeting/ (整個資料夾，1 檔)`
- `docs/.gitkeep`
- `js/services/.gitkeep`
- `js/services/ (整個資料夾，0 檔)`
- `js/data/ (整個資料夾，0 檔)`
- `js/pages/ (整個資料夾，0 檔)`
- `css/layout/ (整個資料夾，0 檔)`
- `css/themes/ (整個資料夾，1 檔)`
- `assets/expressions/ (整個資料夾，0 檔)`
- `assets/avatars/ (整個資料夾，0 檔)`
- `assets/.gitkeep`
- `archive/ (整個資料夾，80 檔)`
- `prototype/ (整個資料夾，7 檔)`
- `developer/ (整個資料夾，6 檔)`

理由：`archive/`（77 檔）為現行檔案之舊版重複（legacy-js／legacy-css／legacy-images 全數與現行版本重複）；`prototype/`、`developer/` 僅含空 `.gitkeep`；`docs/Repository_Tree.md` 由本次 `Architecture_Repository_Structure.md` 取代（重複 Markdown）。**未刪除任何正式 Runtime**（`js/runtime/` 13 檔逐一保留，內容 md5 不變）。

## 5. 新建

- `docs/PAT/`（保留分類）、`tests/`（jsdom／regression／validator）、`scripts/`（verify／release／maintenance）、`package.json`（test／verify scripts，devDependency jsdom）
- 稽核工具：`scripts/verify/VerifyPaths.js`、`scripts/verify/VerifyForbiddenPatterns.js`、`tests/validator/HtmlValidator.js`
- `tests/jsdom/BehaviorSuite.js`（EO-S6.8-002 累積套件遷入、改為 repo-root 相對路徑）、`tests/regression/PipelineRegression.js`

## 6. Regression QA 結果

| 項目 | 結果 |
|---|---|
| jsdom 行為測試（tests/jsdom/BehaviorSuite.js） | **61 PASS / 0 FAIL** |
| Pipeline E2E 迴歸（tests/regression/PipelineRegression.js） | **6 PASS / 0 FAIL**（stage/status、validate()、五段 schema、誠實空內容、完整性 gate、traceability 全數與重構前一致） |
| `node --check`（js/ tests/ scripts/ 全部 JS） | 全數通過 |
| html5validator（10 頁） | **0 errors** |
| `VerifyPaths.js`（全 HTML src/href ＋ 16 個巧巧圖片建構路徑） | **PASS：0 Broken Path／0 Missing File／0 legacy 路徑殘留** |
| `VerifyForbiddenPatterns.js`（JS＋CSS，忽略註解） | **PASS** |
| 命名合規掃描（PascalCase／kebab-case／MD 前綴／無空格／無中文／無重複） | **全數合規** |
| 九個進入頁 Console Error | **全數 = 0** |
| Script 順序 | 各頁順序未動，僅路徑改寫（jsdom 依 HTML 實際順序載入並通過全部行為測試） |

## 7. Flags（記錄予 PMO）

1. **`js/ui/HomeRecentMaterials.js`（既有偏差，未修）**：卡片點擊以 `window.location.href` 導航，違反專案「導航一律真實 `<a href>`」規則。修正需改動元件 DOM 結構與行為，超出本 EO「不得修改功能」範圍 —— 已於 `VerifyForbiddenPatterns.js` 以 KNOWN-ISSUE 明列追蹤，建議後續 WO 處理。
2. **`css/base/` 未建立空的 `reset.css`／`typography.css`**：相關規則現存於 `tokens.css`；建立空檔將違反 Code Quality「不得未使用 CSS」。名稱依標準保留，未來拆分時使用。
3. **`js/parser/` 收納整條解析／生成引擎鏈**（含 KnowledgeBuilder／SummaryGenerator／QuestionGenerator／LearningPipeline）：標準之六分類無 services/，該五檔同屬 Material→Knowledge→Summary→Question 解析生成管線，依「不得混放」歸入 parser/。檔案內容零變更。
4. **components/ 檔名未改為 `*Center` 全稱**（如 `WrongBook.js` 未改 `WrongBookCenter.js`）：改檔名將與 `AHS.WrongBook` 等 namespace 脫鉤（違反命名一致），改 namespace 則觸碰 Business Logic（本 EO 禁止）。現行檔名已符合 PascalCase 規則。
5. 交付文件名依「不得空格」規則調整為底線：`Architecture_Repository_Structure.md`、`QA_Repository_Audit_Report.md`（即本檔）。
