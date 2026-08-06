# Sprint AI-124｜Project Owner PAT FAIL — PAT Fix Report

**Status**：3 項 PAT 修正完成，重新 PAT 通過 — 等待 Project Owner PAT
**Type**：Hotfix（不新增功能，僅依 LOCK 修正 PAT 回報的既有問題）
**Baseline**：LOCK（沿用 Sprint AI-124 本身的 LOCK：僅 UI／Context／Navigation／Binding／Rendering／State Sync，禁止修改 Learning Engine／Knowledge Engine／WrongBook Runtime／Knowledge Mastery Runtime／Statistics Runtime／Repository Runtime／Workspace Runtime）
**Scope 限制已遵守**：本輪僅處理 PAT-01／PAT-02／PAT-03 三項與其重新驗證，未開始 AI-125 或任何其他功能工作。

## PAT-01｜首頁第一次登入，所有 Widget 應一次 Render 完成（不得依賴切換頁面）

**PO 回報現象**：第一次登入首頁，教材資料夾僅顯示「公民」；進入教材中心再返回首頁後，資料才完整。

**真實 Root Cause（追查，非臆測）**：`index.html`／`summary.html`／`learning.html`／`tutor.html` 皆會呼叫 `AHS.TeachingMaterialLoader.load()`（分別經由 `AppHome.js`／`AppSummary.js`／`AppLearning.js`／`AppTutor.js`），但這 4 個頁面從未 `<script>` 載入 `js/data/TeachingMaterialData.js`（Package track 資料來源，涵蓋 數學／tm_1~4 等），只有 `materials.html`／`quiz.html` 有載入。因此 `AHS.TeachingMaterialData` 在這 4 個頁面上是 `undefined`，`TeachingMaterialLoader.load()` 只能橋接 Repository track（公民），Package track 要等到造訪過 `materials.html`（因而載入了該 script）並把資料寫進 `sessionStorage` 後，才會「看似」補齊——這正是 PO 描述的「切換頁面資料才完整」現象，且是真正的初始化缺口，不是 Loader 邏輯或 Workspace 篩選的問題（已排除：`workspaceAllows()` 篩選邏輯本身正確，tm_1-4 的 school/semester 與預設測試 Workspace 相符）。

**修正**：`index.html`／`summary.html`／`learning.html`／`tutor.html` 補上 `<script src="js/data/TeachingMaterialData.js"></script>`，插入位置與 `materials.html`／`quiz.html` 既有慣例一致（`RepositoryStatus.js` 之後）。未動任何 Runtime／Loader 邏輯——純粹補齊缺漏的 script 載入，這正是「不得依賴切換頁面」要求的真正初始化流程修正。

**驗證**：新增 Playwright 斷言（`platform-context-124.spec.js` PAT-124-①），在全新 Workspace、從未造訪過 `materials.html` 的前提下，直接檢查首頁教材資料夾同時顯示「公民」與「數學」。以 `git stash` 移除修正後重跑，確認測試會真實失敗（證明不是巧合通過）；還原修正後測試通過。

## PAT-02｜正式測驗與考前練習是否共用 Practice Runtime（僅調查，未修改）

**PO 要求**：僅調查目前正式測驗與考前練習是否共用同一 Question Flow、是否仍使用 Practice Runtime；若是，說明原因，不得自行修改，等待 PMO 決策。

**調查方法**：對 `AHS.ExamRuntime`／`AHS.QuestionRuntime`／`AHS.AnswerRuntime`／`AHS.AutoGrader` 全部原始碼進行逐檔搜尋，確認是否有任何一處引用 `AHS.LearningQuestionRuntime`（考前練習自己的 Runtime）。

**調查結果**：**沒有**。正式測驗的真實資料流是 `AHS.ExamRuntime` → `AHS.AnswerRuntime` → `AHS.AutoGrader` → `AHS.WrongBookRuntime`／`AHS.HistoryRuntime`／`AHS.KnowledgeMasteryRuntime`，全程未引用 `AHS.LearningQuestionRuntime` 任何一次。正式測驗與考前練習在 UI 層級（`js/components/QuizCenter.js`）確實共用同一個「題目清單／作答畫面」元件與版面（這是 Sprint AI-124 本身就存在、刻意保留的設計——同一教材的正式測驗／考前練習分頁切換不重新 Reset），但兩者各自呼叫**不同的 Runtime**：正式測驗全程走 `ExamRuntime`／`AutoGrader`，考前練習全程走 `LearningQuestionRuntime`／`QuestionRuntime`（AI-122+ 的真實作答流程），繳交後個別寫入各自對應的 `WrongBookRuntime`／`HistoryRuntime`／`KnowledgeMasteryRuntime`，兩者結果不互相污染（另有既有 jsdom 回歸〔`AssessmentMode` 區塊〕證實兩模式的 examId／questionSource 互不混用）。

**結論**：**正式測驗並未使用 Practice Runtime**——PO 觀察到的「共用相同 Question Flow」是 UI／元件層級共用（同一套版面元件），不是資料/邏輯層級共用 Runtime，此為既有架構設計，非本輪缺陷。未修改任何程式碼，等待 PMO 針對此調查結果的後續決策。

## PAT-03｜Knowledge Weakness Statistics 仍為 0，但今日待複習已為 1、Result 已有資料（僅修正同步流程，不修改 Runtime）

**PO 回報現象**：知識弱點頁「錯題即時統計」（Knowledge Weakness Statistics）持續顯示 0，但同頁「今日待複習」已顯示 1，且測驗結果（Result）已有真實資料——代表統計沒有同步到真正的資料來源。

**真實 Root Cause（追查每個數字實際讀取的 Runtime）**：`js/pages/AppWrongBook.js` 的「錯題即時統計」卡片（`buildSessionStatsCard()`）過去只讀 `AHS.WrongBookSession.statistics()`——這是 v1.0 舊版錯題儲存區，只有舊版 `WrongBookGenerator`／`LearningQuestionSession` 練習流程會寫入。但目前系統**所有真實批改路徑**——正式測驗（`AHS.ExamRuntime` → `AHS.AutoGrader` → `AHS.WrongBookRuntime.sync()`）與 AI-122+ 的真實考前練習（`js/components/QuizCenter.js` 的 `wrongBookHook()`/`syncRealPracticeAnswer()`，同樣呼叫 `AHS.WrongBookRuntime.sync()`）——寫入的都是 `AHS.WrongBookRuntime`，從未寫入 `AHS.WrongBookSession`。這正是為何同頁「今日待複習」（`AHS.StatisticsRuntime.dueForReview()`，讀的是 `AHS.WrongBookRuntime`——與頁面自己既有的 wb-summary 卡片讀的是同一個真實 Runtime）能正確顯示 1，而「錯題即時統計」卡片卻停滯在 0：**兩個互不相通的資料儲存區，不是 Runtime 本身的錯誤**。

**修正（僅動 View／同步流程，`AHS.WrongBookRuntime.js` 本身未改一行）**：重寫 `js/pages/AppWrongBook.js` 的 `buildSessionStatsCard()`，改為呼叫 `AHS.WrongBookRuntime.list()`（既有、未修改的 public API，與 `js/components/WrongBook.js` 的 `questionRow()`／`renderDetail()` 讀的是同一個 API）即時計算：Total Wrong／Active／Archived／New／Learning／Mastered。`AHS.WrongBookRuntime.weaknessState()` 的真實狀態只有 `NEW`／`LEARNING`／`MASTERED`／`ARCHIVED` 四種（無「Reviewing」分級），因此舊卡片原有的「Reviewing」統計項誠實移除，不偽造成不存在的狀態。

**驗證**：新增 Playwright PAT（`platform-context-124.spec.js` PAT-124-PAT-03），直接 seed 真實 `AHS.WrongBookRuntime` 資料（1 筆 active/new、1 筆 archived），檢查「錯題即時統計」卡片的 Total Wrong／Active／Archived／New 是否與 seed 一致。以 `git stash` 移除修正後重跑，確認測試真實失敗（4 個數值全部收到 0，重現 PO 回報的現象）；還原修正後測試通過。

## 修正過程中發現並修正的連帶回歸（非新功能，屬本輪必要的重新驗證範圍）

PAT-01 為 `index.html`／`summary.html`／`learning.html`／`tutor.html` 補上 `js/data/TeachingMaterialData.js` 後，`npm test` 一度回報 3 個既有 jsdom 測試失敗與 1 個既有回歸測試失敗——追查後確認並非新缺陷，而是這些測試自己原本仰賴 `loadPage()` 的 `excludeScripts` 選項模擬「真正沒有教材資料」的情境，其排除清單當時只排除 `data/materials/`，未排除新增的 `js/data/TeachingMaterialData.js`，導致 Package track 測試資料意外滲入原本應為空／可控的測試情境：

- `tests/jsdom/BehaviorSuite.js`：3 處 `loadPage("summary.html"/"index.html", ...)` 呼叫補上 `"js/data/TeachingMaterialData.js"` 排除項。
- `tests/regression/AnalyticsRegression.js`：`loadPage()` 本身補上 `excludeScripts` 支援（與 BehaviorSuite.js 相同機制），並在 Subject Analytics 聚合統計測試套用，避免額外橋接的 Package track 教材改變聚合分母。

修正後 `npm test`／`npm run verify`／Playwright／`npm run qa:dashboard` 全數重新驗證為 0 FAIL。

## 重新 PAT — 最終驗證結果

| 項目 | 結果 |
|---|---|
| `npm run verify`（VerifyPaths + VerifyForbiddenPatterns） | PASS（0 broken / 0 legacy references / 0 forbidden-pattern hits） |
| `npm test`（BehaviorSuite + PipelineRegression + AnalyticsRegression） | 330 + 6 + 35 PASS / 0 FAIL |
| `npm run qa:dashboard`（全部 13 個 jsdom/regression 套件 + Playwright） | **Overall: PASS**（全部 14 個項目 0 FAIL，含新增的 Playwright PAT-124-PAT-03） |
| Playwright（全量） | 59 PASS / 0 FAIL（含本輪新增 1 項，及因 PAT-01 真實行為變更而重新產生、已人工檢視確認正確的 `home.png`／`summary.png` 視覺基準線） |

## LOCK 遵循聲明

本輪修正全程未修改：`AHS.WrongBookRuntime.js`、`AHS.StatisticsRuntime.js`、`AHS.ExamRuntime.js`、`AHS.QuestionRuntime.js`、`AHS.AnswerRuntime.js`、`AHS.AutoGrader.js`、`AHS.KnowledgeMasteryRuntime.js`、`AHS.WorkspaceRuntime.js`、`AHS.TeachingMaterialLoader.js` 或任何其他 Runtime 檔案一行程式碼。所有變更僅為：4 個 HTML 頁面補齊缺漏的 `<script>` 標籤、1 個頁面 View 檔案（`AppWrongBook.js`）改讀取正確的既有 Runtime API、測試檔案本身的修正與新增。PAT-02 依指示僅調查未修改任何程式碼。
