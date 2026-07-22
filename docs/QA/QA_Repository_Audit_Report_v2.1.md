# QA_Repository_Audit_Report_v2.1

- EO：EO-S6.8-Repository-002（Repository Structure v2.1 Final → LOCK）
- 日期：2026-07-22
- 基準：v2.0（EO-S6.8-Repository-001 交付狀態）

---

## 1. Move List（42 項，檔名全數不變 —— 本次零更名）

- `js/core/AppHome.js -> js/pages/AppHome.js`
- `js/core/AppMaterials.js -> js/pages/AppMaterials.js`
- `js/core/AppSummary.js -> js/pages/AppSummary.js`
- `js/core/AppQuiz.js -> js/pages/AppQuiz.js`
- `js/core/AppWrongBook.js -> js/pages/AppWrongBook.js`
- `js/core/AppReview.js -> js/pages/AppReview.js`
- `js/core/AppLearning.js -> js/pages/AppLearning.js`
- `js/core/AppDashboard.js -> js/pages/AppDashboard.js`
- `js/core/AppTutor.js -> js/pages/AppTutor.js`
- `js/core/ExamData.js -> js/data/ExamData.js`
- `js/core/QuotesData.js -> js/data/QuotesData.js`
- `js/core/TasksData.js -> js/data/TasksData.js`
- `js/core/MockData.js -> js/data/MockData.js`
- `js/ui/AchievementBadges.js -> js/components/AchievementBadges.js`
- `js/ui/AiTutorHomeCard.js -> js/components/AiTutorHomeCard.js`
- `js/ui/ContinueLearning.js -> js/components/ContinueLearning.js`
- `js/ui/HeroCard.js -> js/components/HeroCard.js`
- `js/ui/HomeRecentMaterials.js -> js/components/HomeRecentMaterials.js`
- `js/ui/LearningTime.js -> js/components/LearningTime.js`
- `js/ui/MaterialRecentLearning.js -> js/components/MaterialRecentLearning.js`
- `js/ui/ReviewHomeCard.js -> js/components/ReviewHomeCard.js`
- `js/ui/ReviewQuickAction.js -> js/components/ReviewQuickAction.js`
- `js/ui/ReviewRecentSession.js -> js/components/ReviewRecentSession.js`
- `js/ui/StudyPlan.js -> js/components/StudyPlan.js`
- `js/ui/StudyStats.js -> js/components/StudyStats.js`
- `js/ui/TodayMission.js -> js/components/TodayMission.js`
- `assets/illustrations/expressions/expr-celebrate.png -> assets/expressions/expr-celebrate.png`
- `assets/illustrations/expressions/expr-cheer.png -> assets/expressions/expr-cheer.png`
- `assets/illustrations/expressions/expr-confused.png -> assets/expressions/expr-confused.png`
- `assets/illustrations/expressions/expr-determined.png -> assets/expressions/expr-determined.png`
- `assets/illustrations/expressions/expr-gentle.png -> assets/expressions/expr-gentle.png`
- `assets/illustrations/expressions/expr-greeting.png -> assets/expressions/expr-greeting.png`
- `assets/illustrations/expressions/expr-love.png -> assets/expressions/expr-love.png`
- `assets/illustrations/expressions/expr-shy.png -> assets/expressions/expr-shy.png`
- `assets/illustrations/expressions/expr-thinking.png -> assets/expressions/expr-thinking.png`
- `assets/illustrations/expressions/expr-tired.png -> assets/expressions/expr-tired.png`
- `assets/illustrations/avatars/pose-blackboard.png -> assets/avatars/pose-blackboard.png`
- `assets/illustrations/avatars/pose-pointing.png -> assets/avatars/pose-pointing.png`
- `assets/illustrations/avatars/pose-reading.png -> assets/avatars/pose-reading.png`
- `assets/illustrations/avatars/pose-standing.png -> assets/avatars/pose-standing.png`
- `assets/illustrations/avatars/pose-thumbs-up.png -> assets/avatars/pose-thumbs-up.png`
- `assets/illustrations/avatars/pose-wave.png -> assets/avatars/pose-wave.png`

## 2. Rename List

-（無）—— v2.1 僅調整分類位置；所有檔名已於 v2.0 完成合規化，本次未更動任何檔名。

## 3. Path Update

### HTML（9 頁）
- `dashboard.html: 2 個引用更新`
- `index.html: 14 個引用更新`
- `learning.html: 2 個引用更新`
- `materials.html: 3 個引用更新`
- `quiz.html: 2 個引用更新`
- `review.html: 5 個引用更新`
- `summary.html: 2 個引用更新`
- `tutor.html: 2 個引用更新`
- `wrongbook.html: 2 個引用更新`
（qiaoqiao-gallery.html 引用之三檔皆未移動，無需更新。）

### JavaScript（1 檔）
- `js/core/Qiaoqiao.js`：`EXPR_BASE`／`POSE_BASE` 由 `assets/illustrations/...` 攤平回 `assets/expressions/`、`assets/avatars/`（兩獨立常數保留）。16 個建構路徑逐一驗證存在。

### 稽核工具同步（2 檔）
- `scripts/verify/VerifyPaths.js`：legacy 路徑清單更新為 v2.1 定義（`js/pages/`、`js/data/`、`assets/expressions|avatars/` 恢復為正式路徑；`assets/illustrations/` 改列 legacy）。
- `scripts/verify/VerifyForbiddenPatterns.js`：KNOWN-ISSUE 追蹤路徑隨檔案移動更新（`js/components/HomeRecentMaterials.js`）。

## 4. Cleanup

- `assets/illustrations/ (層級攤平)`
- `docs/Architecture/Architecture_Repository_Structure.md`（v2.0，由 v2.1 LOCK 版取代 —— 重複 Markdown）

新建保留分類：- `css/utilities/ (保留空分類，未新增未引用 CSS)`
- `docs/Specifications/ (保留分類)`

## 5. Regression QA

| 項目 | 結果 |
|---|---|
| jsdom（tests/jsdom/BehaviorSuite.js） | **61 PASS / 0 FAIL** |
| HTML Validator（10 頁） | **0 errors** |
| Repository Audit（命名合規掃描：PascalCase／kebab／MD 前綴／無空格中文重複） | **全數合規** |
| VerifyPaths | **PASS：Broken Path = 0／Missing File = 0／legacy 殘留 = 0**（含 16 個巧巧圖片建構路徑） |
| VerifyForbiddenPatterns | **PASS**（1 項既有 KNOWN-ISSUE 持續追蹤，見 §6） |
| Pipeline E2E 迴歸 | **6 PASS / 0 FAIL** |
| `node --check`（全部 JS） | 通過 |
| Console Error（九個進入頁） | **全數 = 0** |

## 6. Final Verification（逐位比對 v2.0 快照）

| 項目 | 結果 |
|---|---|
| `js/runtime/`（13 檔） | **diff = 0，零修改** ✓ |
| `js/parser/`（5 檔，Parser Interface） | **diff = 0，零修改** ✓ |
| `js/core/PersistenceAdapter.js` | 零修改 ✓ |
| 全部 Center／Feature Component／Reusable UI 內容 | 零修改（僅位置移動）✓ |
| Business Logic／Data Flow／UI Design／功能 | 零變更 ✓ |
| Repository Structure v2.1 | **完成，LOCK** ✓ |

## 7. 既有 Flag（延續 v2.0，未解決）

- `js/components/HomeRecentMaterials.js`：既有 `window.location.href` 卡片導航（違反 `<a href>` 規則）。修正屬功能變更，本 EO 禁止 —— 持續以 KNOWN-ISSUE 列管，建議後續 WO。
