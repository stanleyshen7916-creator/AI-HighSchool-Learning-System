# Repository Structure v2.1（LOCK）

- EO：EO-S6.8-Repository-002
- 日期：2026-07-22
- 狀態：**LOCK** —— 本文件為 Repository 結構唯一準則（取代 v2.0）

---

## 一、Repository Tree（183 檔案）

```
AI-HighSchool-Learning-System/
├── LICENSE
├── README.md
├── dashboard.html
├── index.html
├── learning.html
├── materials.html
├── package.json
├── qiaoqiao-gallery.html
├── quiz.html
├── review.html
├── summary.html
├── tutor.html
├── wrongbook.html
│   ├── avatars/
│   │   ├── pose-blackboard.png
│   │   ├── pose-pointing.png
│   │   ├── pose-reading.png
│   │   ├── pose-standing.png
│   │   ├── pose-thumbs-up.png
│   │   ├── pose-wave.png
│   ├── expressions/
│   │   ├── expr-celebrate.png
│   │   ├── expr-cheer.png
│   │   ├── expr-confused.png
│   │   ├── expr-determined.png
│   │   ├── expr-gentle.png
│   │   ├── expr-greeting.png
│   │   ├── expr-love.png
│   │   ├── expr-shy.png
│   │   ├── expr-thinking.png
│   │   ├── expr-tired.png
│   ├── icons/
│   │   ├── favicon.svg
│   ├── images/
│   │   ├── .gitkeep
│   ├── logos/
│   │   ├── .gitkeep
│   ├── base/
│   │   ├── layout.css
│   │   ├── tokens.css
│   ├── components/
│   │   ├── qiaoqiao.css
│   ├── pages/
│   │   ├── dashboard.css
│   │   ├── home.css
│   │   ├── learning.css
│   │   ├── material.css
│   │   ├── qiaoqiao-gallery.css
│   │   ├── quiz.css
│   │   ├── review.css
│   │   ├── summary.css
│   │   ├── tutor.css
│   │   ├── wrongbook.css
│   ├── utilities/
│   │   ├── .gitkeep
│   ├── Architecture/
│   │   ├── Architecture_Dependency_Audit.md
│   │   ├── Architecture_Repository_Structure.md
│   ├── Decision/
│   │   ├── Decision_PMO-025_Architecture_Evolution_v2.0.md
│   ├── EO/
│   │   ├── EO_DEV-006_Home_Prototype_v0.2.md
│   │   ├── EO_S6.8-002_Report.md
│   ├── PAT/
│   │   ├── .gitkeep
│   ├── PMO/
│   │   ├── PMO_Branch_Strategy_v1.0.md
│   │   ├── PMO_Capability_Matrix_v1.0.md
│   │   ├── PMO_Claude_Workspace_Workflow_v1.0.md
│   │   ├── PMO_Commit_Message_Rule_v1.0.md
│   │   ├── PMO_Developer_Platform_Repository_Structure_v1.0.md
│   │   ├── PMO_Developer_Platform_v1.0_Index.md
│   │   ├── PMO_Git_Workflow_v1.0.md
│   │   ├── PMO_QA_Workflow_v1.0.md
│   │   ├── PMO_Repository_Workflow_v1.0.md
│   │   ├── PMO_Version_Rule_v1.0.md
│   │   ├── PROJECT_STATUS.json
│   │   ├── QA.json
│   │   ├── SPRINT.json
│   │   ├── TASKS.json
│   │   ├── VERSION.json
│   ├── QA/
│   │   ├── QA_Bug_Report.md
│   │   ├── QA_EO-R001A_Runtime_Integration.md
│   │   ├── QA_EO-R001_Review_Home.md
│   │   ├── QA_EO-S5-002_Summary_Review_Integration.md
│   │   ├── QA_EO-S5-003_Runtime_QA_Hotfix.md
│   │   ├── QA_EO-S6-001_Material_Parser_Foundation.md
│   │   ├── QA_EO-S6-002_Knowledge_Builder_Foundation.md
│   │   ├── QA_EO-S6-003_Summary_Generator_Foundation.md
│   │   ├── QA_EO-S6-004_Learning_Question_Generator_Foundation.md
│   │   ├── QA_EO-S6-005_Learning_Pipeline_Integration.md
│   │   ├── QA_EO-S6-006_System_Runtime_Integration.md
│   │   ├── QA_EO-S6-007_End-to-End_Integration.md
│   │   ├── QA_EO-S6.8-002_AI_Question_Guide_PAT_Critical.md
│   │   ├── QA_Fix_Report.md
│   │   ├── QA_HOTFIX-001_Runtime_Persistence.md
│   │   ├── QA_Missing_Files.md
│   │   ├── QA_Repository_Audit_Report.md
│   │   ├── QA_Sprint4_Quiz_Runtime_Foundation.md
│   │   ├── QA_Sprint6.6_Fix_Report.md
│   │   ├── QA_Sprint6.6_Runtime_Final_Fix_Report.md
│   │   ├── QA_Sprint6.6_Runtime_Round3_Fix_Report.md
│   ├── Release/
│   │   ├── Release_Changelog.md
│   │   ├── Release_Note.md
│   │   ├── Release_Repository_Changelog.md
│   │   ├── Release_Sprint6.6_Changelog.md
│   │   ├── Release_Sprint6.6_Changelog_Final.md
│   │   ├── Release_Sprint6.6_Changelog_Round4.md
│   │   ├── Release_Workflow_v1.0.md
│   ├── Specifications/
│   │   ├── .gitkeep
│   ├── components/
│   │   ├── AchievementBadges.js
│   │   ├── AiTutor.js
│   │   ├── AiTutorHomeCard.js
│   │   ├── ContinueLearning.js
│   │   ├── Dashboard.js
│   │   ├── HeroCard.js
│   │   ├── HomeRecentMaterials.js
│   │   ├── LearningTime.js
│   │   ├── MaterialCenter.js
│   │   ├── MaterialRecentLearning.js
│   │   ├── MyLearning.js
│   │   ├── QiaoqiaoGallery.js
│   │   ├── QuestionGuide.js
│   │   ├── QuizCenter.js
│   │   ├── ReviewHomeCard.js
│   │   ├── ReviewQuickAction.js
│   │   ├── ReviewRecentSession.js
│   │   ├── StudyPlan.js
│   │   ├── StudyStats.js
│   │   ├── SummaryCenter.js
│   │   ├── TodayMission.js
│   │   ├── WrongBook.js
│   ├── core/
│   │   ├── Icons.js
│   │   ├── PersistenceAdapter.js
│   │   ├── Qiaoqiao.js
│   │   ├── UI.js
│   ├── data/
│   │   ├── ExamData.js
│   │   ├── MockData.js
│   │   ├── QuotesData.js
│   │   ├── TasksData.js
│   ├── pages/
│   │   ├── AppDashboard.js
│   │   ├── AppHome.js
│   │   ├── AppLearning.js
│   │   ├── AppMaterials.js
│   │   ├── AppQuiz.js
│   │   ├── AppReview.js
│   │   ├── AppSummary.js
│   │   ├── AppTutor.js
│   │   ├── AppWrongBook.js
│   ├── parser/
│   │   ├── KnowledgeBuilder.js
│   │   ├── LearningPipeline.js
│   │   ├── MaterialParser.js
│   │   ├── QuestionGenerator.js
│   │   ├── SummaryGenerator.js
│   ├── runtime/
│   │   ├── AnswerRuntime.js
│   │   ├── AutoGrader.js
│   │   ├── ExamRuntime.js
│   │   ├── HistoryRuntime.js
│   │   ├── KnowledgeRuntime.js
│   │   ├── LearningQuestionRuntime.js
│   │   ├── MaterialRuntime.js
│   │   ├── QuestionBank.js
│   │   ├── QuestionRuntime.js
│   │   ├── ReviewRuntime.js
│   │   ├── StatisticsRuntime.js
│   │   ├── SummaryRuntime.js
│   │   ├── WrongBookRuntime.js
│   ├── ui/
│   │   ├── AppShell.js
│   │   ├── BulkUploadDialog.js
│   │   ├── MaterialCard.js
│   │   ├── MaterialCategoryTabs.js
│   │   ├── MaterialEmptyState.js
│   │   ├── MaterialFilter.js
│   │   ├── MaterialFolder.js
│   │   ├── MaterialGrid.js
│   │   ├── MaterialHeader.js
│   │   ├── MaterialLoadingState.js
│   │   ├── MaterialPreview.js
│   │   ├── MaterialSearchBar.js
│   │   ├── MaterialSort.js
│   │   ├── MaterialSubjectTabs.js
│   │   ├── MaterialUploadDialog.js
│   │   ├── QuestionCard.js
│   │   ├── QuestionNavigator.js
│   ├── utils/
│   │   ├── Countdown.js
│   │   ├── DateUtils.js
│   │   ├── Greeting.js
│   │   ├── Quote.js
│   │   ├── TaskUtils.js
│   ├── maintenance/
│   │   ├── .gitkeep
│   ├── release/
│   │   ├── .gitkeep
│   ├── verify/
│   │   ├── VerifyForbiddenPatterns.js
│   │   ├── VerifyPaths.js
│   ├── jsdom/
│   │   ├── BehaviorSuite.js
│   ├── regression/
│   │   ├── PipelineRegression.js
│   ├── validator/
│   │   ├── .gitkeep
│   │   ├── HtmlValidator.js
```

註：LOCK 樹以九個主頁面為結構基準；根目錄另依 v2.0 既有規範保留 `README.md`、`LICENSE`、`package.json`，以及既有展示頁 `qiaoqiao-gallery.html`（移除即屬功能變更，本 EO 禁止）。

---

## 二、分類規則

### assets/（v2.1：攤平，不得建立 illustrations/）
`avatars/`（巧巧全身姿勢 6 張）｜`expressions/`（巧巧表情半身 10 張）｜`icons/`｜`images/`｜`logos/`
巧巧圖片路徑僅得經 `Qiaoqiao.js` 之 `EXPR_BASE`／`POSE_BASE` **兩個獨立常數**建構（不得合併，歷史 404 教訓）。

### css/
`base/`（tokens.css、layout.css）｜`components/`（共用元件 CSS）｜`pages/`（每頁一份 kebab-case，不得跨頁混放）｜`utilities/`（v2.1 新增：helper／animation／spacing 類；目前為保留空分類 —— 依「不得新增未引用 CSS」不建立空殼檔案）

### js/（八分類，不得混放）
| 分類 | 內容 |
|---|---|
| `core/` | namespace／shared：`UI.js`、`Icons.js`、`Qiaoqiao.js`、`PersistenceAdapter.js` |
| `runtime/` | 全部 13 個 Runtime |
| `parser/` | 解析／生成引擎鏈：MaterialParser、KnowledgeBuilder、SummaryGenerator、QuestionGenerator、LearningPipeline |
| `pages/` | 每頁 bootstrap（v2.1 恢復）：AppHome／AppMaterials／AppSummary／AppQuiz／AppWrongBook／AppReview／AppLearning／AppDashboard／AppTutor（+ AppQiaoqiaoGallery 頁沿用 QiaoqiaoGallery 元件自掛載） |
| `components/` | **Feature Component**：頁面級 Center（MaterialCenter、SummaryCenter、QuizCenter、QuestionGuide、WrongBook、MyLearning、Dashboard、AiTutor、QiaoqiaoGallery）＋功能區塊（AchievementBadges、AiTutorHomeCard、ContinueLearning、HeroCard、HomeRecentMaterials、LearningTime、MaterialRecentLearning、ReviewHomeCard、ReviewQuickAction、ReviewRecentSession、StudyPlan、StudyStats、TodayMission） |
| `ui/` | **Reusable UI**：AppShell、MaterialCard／Grid／Preview／EmptyState／LoadingState／Filter／Folder／Header／SearchBar／Sort／SubjectTabs／CategoryTabs、MaterialUploadDialog、BulkUploadDialog、QuestionCard、QuestionNavigator |
| `data/` | v2.1 恢復：ExamData、QuotesData、TasksData、MockData。未來所有 Static Data／Metadata／Config 皆置此 |
| `utils/` | Countdown、DateUtils、Greeting、Quote、TaskUtils |

### docs/（八分類）
`PMO/`｜`EO/`｜`QA/`｜`PAT/`｜`Decision/`｜`Architecture/`｜`Specifications/`（v2.1 新增，保留）｜`Release/`

### tests/ 與 scripts/
`tests/jsdom/`（BehaviorSuite.js，累積）｜`tests/regression/`（PipelineRegression.js）｜`tests/validator/`（HtmlValidator.js）
`scripts/verify/`（VerifyPaths.js、VerifyForbiddenPatterns.js）｜`scripts/release/`｜`scripts/maintenance/`

---

## 三、命名規則（LOCK）

JavaScript：PascalCase｜CSS：kebab-case｜Markdown：`PMO_` `EO_` `QA_` `PAT_` `Decision_` `Release_` `Architecture_` 前綴｜圖片：小寫 kebab-case。
全庫禁止：空格、中文檔名、重複命名（`.gitkeep` 除外）。

## 四、新增規範（v2.1）

1. **Feature vs Reusable 判準**：綁定特定頁面功能情境者 → `js/components/`；跨情境可重用之控制元件／卡片／對話框／版面殼 → `js/ui/`。
2. Static Data／Metadata／Config 一律入 `js/data/`，不得散落 core。
3. `css/utilities/` 為 helper 類 CSS 唯一合法位置；引用前不得建檔。
4. 任何結構調整必須通過 `npm run verify`（VerifyPaths + VerifyForbiddenPatterns）與 `npm test` 後方可交付。
5. 本結構 LOCK 後，新增資料夾／分類需 PMO 裁示。
