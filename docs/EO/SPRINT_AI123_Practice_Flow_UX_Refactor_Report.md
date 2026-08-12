# Sprint AI-123｜Practice Flow UX Refactor（PAT Hotfix）— EO Report

**Status**: 實作完成，待送出 PR／合併 — 等待 Project Owner PAT
**Type**: UX Improvement（不修改 Learning Engine 核心）
**Baseline**: AI-122
**LOCK honored**：本 Sprint 依 AI-123-13 僅修改 Practice UX／Navigation／View／Component。Learning Engine／Knowledge Engine／Question Runtime／Statistics Logic／WrongBook Logic 完全未修改 —— 每一次批改／同步仍呼叫這些 Runtime 既有、未變更的 public API（`AHS.WrongBookRuntime.sync()`／`AHS.KnowledgeMasteryRuntime.recordAttempt()`／`AHS.QuestionRuntime.getSet()`），與 AI-122 相同的一貫作法：讀取／呼叫既有 API 不等於修改。

## Summary

Project Owner 實際操作「考前練習」後認為目前流程（教材→考前練習→題目清單→點擊題目→右側作答→停留 Detail Panel）不像考試，像資料管理系統。本 Sprint 將「點擊題目」到「作答完成」整段改為全畫面 Practice View（獨立於 `document.body` 的 overlay，涵蓋整個視窗，不只是主內容欄），並新增成績摘要畫面、題目列表即時狀態圖示、離開作答時的未完成提示。12 項 PAT 全部完成。

## AI-123-01｜點擊題目直接開啟全畫面 Practice View

**修正**：`js/components/QuizCenter.js` 新增 `openPracticeSession()` + `buildPracticeSessionView()`。點擊題目列表中任一題（真實 `AHS.QuestionRuntime` 題目或舊版 `AHS.LearningQuestionRuntime` 題目）不再停留於原本「清單原地展開右側作答」的流程，而是直接把一個 `.qpv-overlay` 全畫面覆蓋層 append 到 `document.body`（刻意選在 `practiceRoot`／`root`／AppShell 之外，理由見 AI-123-11），涵蓋整個視窗，包含 Sidebar／Topbar，真正做到「全畫面作答」。

## AI-123-02｜Practice View Header

**修正**：`buildPracticeSessionView()` 的 `.qpv__title` 即時組出「科目／章節／考前練習／第 N / M 題」。科目／章節優先讀取 `repositoryExamCatalog()`（既有、未修改的唯讀函式）比對 `materialId` 取得真實科目／章節；解析不到時 fallback 到題目自身的 `subject`／`chapter` 欄位，解析不到章節時誠實省略（不捏造）。

## AI-123-03｜返回題目列表按鈕

**修正**：`.qpv__back`（左上角）呼叫 `requestExit()`：尚有未作答題目時先彈出確認提示（AI-123-12），否則直接返回。目前作答進度是 `create()` 自身閉包內的 `practiceAnswerState`（純記憶體，session-scoped，非新 Runtime、不落地 sessionStorage——見 AI-123-10 的設計說明），返回題目列表這個動作本身完全不會清空它，只有明確按下「再次測驗」才會清空對應題目的狀態。

## AI-123-04｜完成測驗 → 成績摘要 → 返回題目列表

**修正**：`buildPracticeSessionView()` 內 `finish()` 產生真實計算的成績摘要（`buildScoreSummaryView()`）：本次 X/Y、答對率、答對題數、答錯題數、今日新增錯題、Knowledge Mastery。三個按鈕：返回題目列表／再次測驗／前往錯題本（`<a href="wrongbook.html">`，與既有 `ReviewQuickAction.js`／`SummaryCenter.js` 的真實連結慣例一致，非 `window.location.href =`）。

**判斷（明確揭露）**：PAT 範例「8/10、80% 答對、8 答對、2 答錯」沒有「未作答」這個第三類別。本實作把「完成測驗當下仍未作答」的題目計入答錯題數（`total - correct`），理由是「未完成的考卷」誠實地不等於答對——這個決定與真實紙本考試「空白＝不給分」的直覺一致，但仍在此明確標記給 Project Owner 覆核，因為原始 PAT 文字未對這個情境給出範例。

**今日新增錯題**的計算方式：`finish()` 會在 Practice View 開啟當下先記錄每一題原本的狀態（`beforeState`），完成時比對——只有「這次作答才變成答錯」的題目才計入，避免把學生進入本次作答前就已經是錯題的舊資料重複計入。

**Knowledge Mastery** 讀取本次涉及的所有 `knowledgePoint`，逐一呼叫既有、未修改的 `AHS.KnowledgeMasteryRuntime.get(kp).mastery` 取平均；完全沒有 `knowledgePoint` 資料時誠實顯示「尚無資料」，不捏造數字。

## AI-123-05／AI-123-06｜題目列表 Status Icon 即時更新

**修正**：`buildPracticeListView()` 新增 `statusFor` 參數，每一列真實題目／舊版題目列前方新增 `statusIcon()`（✔ 已答對／✘ 已答錯／○ 尚未作答），資料來源同樣是 `practiceAnswerState`。從 Practice View 返回列表時會重新呼叫 `showPracticeList()`（見 AI-123-11 說明，是唯一一次重新渲染列表的時機），圖示立即反映最新狀態，不需重新整理頁面。

## AI-123-07｜重新點擊已完成題目 → 重新作答

**修正**：`buildPracticeSessionView()` 的 `renderQuestion()` 每次切換題目（含使用者重新點擊一題已完成的題目）都會呼叫全新的 `renderLegacyQuestionBody()`／`renderRealQuestionBody()`——這兩個函式內部的 `submitted` 旗標永遠從 `false` 開始，選項也永遠從未標記開始，因此「重新開始作答」是結構性保證，不是條件判斷。只有再次送出答案（`finishSubmit()`）後才會呼叫 `renderAnswer()` 顯示解析，與舊有行為一致。

## AI-123-08｜Detail Panel 重新定位

**判斷（明確揭露，本 Sprint 最大的判斷成分）**：AI-123 spec 提到的「Detail Panel／主要作答區」，經比對程式碼與 AI-123-01「不得停留目前 Detail Panel」的用語，判定就是 AI-122 建立的 `buildRealPracticeQuestionView()`／`buildPracticeQuestionView()`——點擊題目後，清單原地被替換成的那一塊作答區（含選項、送出、解析），在概念上等同於「清單旁邊的作答面板」。

本 Sprint 的處理方式：**這兩個函式已被拆解、重新命名為 `renderRealQuestionBody()`／`renderLegacyQuestionBody()`，並移除各自的返回按鈕與外層包裝**，現在唯一的掛載點是全畫面 Practice View（`buildPracticeSessionView()`）——不存在任何獨立、可在「未進入 Practice View」時單獨顯示的作答用 Detail Panel 了。

「只有未進入 Practice View 時 Detail Panel 才存在」這句話，本 Sprint 的實作解讀為：題目清單本身（每一列已顯示科目／題目文字預覽／Knowledge Point／狀態圖示）已經是「未進入 Practice View 時的題目資訊區」，不需要再另外新增一個獨立元件重複顯示同樣的資訊。**沒有新增額外的「題目資訊面板」元件**——如果 Project Owner 認為這裡需要一個獨立於列表列（row）之外的資訊卡片，這是一個需要進一步規格澄清的項目，在此明確提交覆核。

## AI-123-09｜完成後不得返回首頁／教材中心

**修正**：成績摘要（`buildScoreSummaryView()`）只有「返回題目列表」／「再次測驗」／「前往錯題本」三個出口，沒有任何指向 `index.html`／`materials.html` 的連結或按鈕；Practice View 的返回按鈕與確認對話框同樣只會回到題目列表。Playwright `practice-flow-123.spec.js` 明確斷言成績摘要內不存在 `a[href='index.html']`／`a[href='materials.html']`。

## AI-123-10｜每題完成立即同步 Runtime

**修正**：`renderLegacyQuestionBody()`／`renderRealQuestionBody()`（沿用 AI-122 既有的 `wrongBookHook()`／`syncRealPracticeAnswer()`，未修改任何一行邏輯）在**每一題送出答案的當下**、還沒有進到下一題或完成測驗之前，就同步呼叫 `AHS.WrongBookRuntime.sync()`（答錯時）與 `AHS.KnowledgeMasteryRuntime.recordAttempt()`（每次都呼叫，不論對錯）——完全不等全部題目完成才批次處理。

**關於 spec 提到的「KnowledgeRuntime」／「StatisticsRuntime」（釐清，非新增程式碼）**：
- `AHS.KnowledgeRuntime`（`js/runtime/KnowledgeRuntime.js`）是教材解析時建立的知識結構儲存（`sync(materialDocument)`），本身沒有「記錄一次作答」的介面——本專案真正逐題記錄對錯、驅動 Knowledge Mastery 的 Runtime 是 `AHS.KnowledgeMasteryRuntime`，本 Sprint 沿用既有呼叫，未新增。
- `AHS.StatisticsRuntime` 本身完全是**唯讀衍生**（`overview()`／`refresh()`／`knowledgeAnalytics()` 等都是即時從 `WrongBookRuntime`／`HistoryRuntime`／`KnowledgeMasteryRuntime` 重新計算，沒有任何 `sync()`／`record()` 寫入方法）——它「同步」的意義是：只要底層 Runtime 已經寫入，`StatisticsRuntime` 下一次被查詢時就自動反映最新資料，不需要、也沒有獨立的寫入步驟。

## AI-123-11｜返回題目列表保留 Scroll Position

**修正**：Practice View 以 `position: fixed` overlay 直接 append 到 `document.body`（而非掛載在 `practiceRoot` 內），這代表題目清單本身在 Practice View 開啟期間**完全沒有被卸載或重新渲染**，頁面的 `window.scrollY` 也不會因為疊加一個 fixed 覆蓋層而改變。`openPracticeSession()` 在開啟前記錄 `window.scrollY`，離開時（`onExit`）先重新渲染列表（讓 AI-123-05/06 的狀態圖示更新），再用 `window.scrollTo(0, savedScroll)` 還原，不使用 `location.reload()`、不重新查詢頁面以外的資料。

## AI-123-12｜未完成時按返回列表 → 確認提示

**修正**：`buildPracticeSessionView()` 的 `requestExit()` 統計本次題組中仍為 `null`（尚未作答）的題目數，> 0 時顯示 `.qpv-confirm-overlay`：「尚有 N 題未完成。是否返回？」，提供「繼續作答」（關閉提示，停留原題）／「返回列表」（實際離開）兩個按鈕，字級與位置與現有 `mat-dialog__overlay` 慣例一致（`position: fixed` + 明確 `top/right/bottom/left`，未使用被禁止的 `inset` 簡寫）。

## 測試

- `npm run verify`：PASS（0 broken paths／0 legacy references／0 forbidden-pattern hits；`window.location.href =` 的既有 known-issue 與本 Sprint 無關，未新增）。
- `npm test`：全綠。BehaviorSuite 330 PASS / 0 FAIL；PipelineRegression 6／RepositoryFoundation 29／MaterialPipelineRegression 37／AnalyticsRegression 35／LearningFlowRegression 45／WorkspaceRegression 36／MaterialCenterRegression 12／FolderRegression 11／AnalyticsFilterRegression 6／TutorRegression 8／WorkspaceUIRegression 28／KnowledgeEngineRegression 44，全部 0 FAIL。
  - `tests/jsdom/BehaviorSuite.js` 的既有 [8]／[10]／[11]／[14] 區塊原本假設「作答互動元件掛載在 QuizCenter 自身的 mount root 內」，本 Sprint 改為掛載在 `document.body`（見 AI-123-11），已同步修正這些既有測試的查詢範圍（改從 `doc`／`window.document` 查詢，而非 `mountEl`），新增 `backFromPractice()` 測試輔助函式處理「返回」現在可能先彈出確認對話框的新行為。這些既有測試本身沒有任何斷言邏輯被弱化，只有查詢範圍隨著真實 DOM 結構調整。
- Playwright：全綠，共 50 個測試（45 個既有 + 5 個新增 `practice-flow-123.spec.js`）。既有 `ux-hotfix-122.spec.js` 的 PAT-122-03 因為「點擊題目」現在會先進入全畫面 Practice View（而非舊有的原地展開），且該測試情境下題組尚有題目未作答，返回按鈕會先彈出 AI-123-12 的確認提示，已同步更新該測試的互動步驟（新增等待與點擊「返回列表」）——測試驗證的實際行為（返回同一份教材的題目清單）完全未改變，只是多了一步真實存在的確認互動。
  - 新增 `playwright/tests/practice-flow-123.spec.js`（5 個測試），覆蓋 AI-123-01/02（全畫面 Header）、AI-123-03/11（返回不遺失進度＋Scroll Position）、AI-123-05/06/07（狀態圖示即時更新＋重新作答不直接顯示答案）、AI-123-04/09（成績摘要三按鈕、不含首頁/教材中心連結）、AI-123-04 再次測驗（重置為未作答）。
  - 全部 50 個測試（含新增的 5 個）重複執行 3 次，皆 100% 通過，確認非 flaky。
- `npm run validate:html`：本機環境未安裝 `html5validator`／Java（與先前 Sprint 相同的既有限制，非本 Sprint 新增），未執行；`css/pages/quiz.css`／`js/components/QuizCenter.js` 的變更未新增任何 HTML 結構，僅新增既有 App Shell 之外的 overlay `<div>`／既有元素慣例（`<button>`／`<a>`／`<section>`），風險低。

## Definition of Done

- [x] 點擊題目後直接進入 Practice View。
- [x] Practice View 可返回題目列表。
- [x] 返回後保留 Scroll Position。
- [x] 每題立即更新：✔／✘／○ 狀態。
- [x] 完成全部題目後顯示成績摘要。
- [x] 成績摘要可：返回題目列表／再次測驗／前往錯題本。
- [x] Detail Panel 不再作為主要作答區（判斷已於 AI-123-08 明確揭露，待 PO 覆核是否需要獨立資訊面板）。
- [x] 所有 Runtime 維持相容（未修改 Learning Engine／Knowledge Engine／Question Runtime／Statistics Logic／WrongBook Logic 任何一行）。
- [x] `npm run verify` PASS。
- [x] `npm test` PASS。
- [x] Playwright PASS（50/50，含新增 5 個，重複 3 次確認非 flaky）。
- [x] QA Dashboard PASS（`npm run qa:dashboard`）。

## 提交 Project Owner 覆核的判斷（彙整）

1. **AI-123-04 未完成題目的計分方式**：成績摘要把「完成測驗當下仍未作答」的題目計入答錯，而非另立「未作答」類別（原始 PAT 範例未涵蓋此情境）。
2. **AI-123-08 Detail Panel 的最終型態**：本 Sprint 判定「未進入 Practice View 時的題目資訊」已由題目列表列（row）本身承載，未新增獨立的資訊面板元件；若 Project Owner 期待的是一個獨立卡片，需要進一步規格澄清。

Deliverable：PR、EO Report（本文件）、等待 Project Owner PAT。
