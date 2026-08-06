# Sprint AI-124｜Platform Context & UX Consistency Hotfix — EO Report

**Status**: 實作完成，待送出 PR／合併 — 等待 Project Owner PAT
**Type**: UX Hotfix + Context Integration（不修改 Learning Engine 核心邏輯）
**Baseline**: LOCK（不得重新設計 UI）
**LOCK honored**：本 Sprint 完全未修改 Learning Engine／Knowledge Engine／WrongBook Runtime／Knowledge Mastery Runtime／Statistics Runtime／Repository Runtime／Workspace Runtime 任一個檔案。所有修正僅動：UI／Context／Navigation／Binding／Rendering／State Sync，且每一次批改／同步／查詢仍呼叫這些 Runtime 既有、未變更的 public API（唯讀呼叫不等於修改，本專案一貫作法）。

## Summary

Project Owner 實機操作後回報一系列跨頁 Context 遺失與資訊不同步的真實問題。逐一追查後，多數 PAT 項目對應到具體、可重現的程式碼缺陷（而非需要「重新設計」的架構問題），已於本 Sprint 修正；AI-124-06／AI-124-10／AI-124-11 三項在追查過程中確認已由 AI-122 完成，僅補上真實回歸測試佐證，未新增變更。

## AI-124-02｜Platform Context 統一

**修正**：新增 `js/core/PlatformContext.js`——唯一、共用、唯讀的 Context 解析／傳遞工具（非新 Runtime，不落地任何 sessionStorage key，只讀取當前頁面的 URL query string，並沿用既有的 `teaching_material_<id>` materialId↔examId 慣例）。已在所有 10 個根 HTML 頁面的 `<script>` 順序中，於 `PersistenceAdapter.js` 之後載入。

`js/pages/AppQuiz.js`／`AppSummary.js`／`AppTutor.js`（原本各自獨立呼叫 `new URLSearchParams(window.location.search)`，三份互不相同的實作）已全部改為呼叫 `AHS.PlatformContext.resolve()`。`materials.html` 的既有 `?id=` 慣例（與其他頁面的 `?materialId=` 不同名，且已有既有連結依賴此名稱）刻意保留不變——判斷已於下方明確揭露。

## AI-124-03／AI-124-04／AI-124-12｜正式測驗↔考前練習 Context 一致

**Root Cause（真實找到，非臆測）**：`js/components/QuizCenter.js` 的正式測驗／考前練習分頁按鈕（`examTab`/`practiceTab`）過去只切換 `hidden` 屬性顯示／隱藏，`root`（正式測驗清單）本身的內容從 `create()` 一開始就固定是未篩選的 `showList()`（全部教材），與 `practiceRoot`（考前練習，正確 scoped 到目前教材）完全不同步——這正是 PO 回報的「Practice：生物，Quiz：全部教材」。

**修正**：新增 `showScopedList(materialId)`——當存在真實 `practiceMaterialId` context 時，`root` 的初始內容改為只包含該教材自己的正式測驗項目（透過既有、未修改的 `repositoryExamCatalog()` 過濾），完全沒有真實內容可 scoped 時才誠實 fallback 回 `showList()`（不得假造一個空的「已篩選」畫面）。分頁按鈕本身邏輯完全未變——只切換顯示／隱藏，這代表切換分頁本身天生「不會重新 Reset」（AI-124-12），因為 `root`／`practiceRoot` 的內容各自只在真正需要時建立一次。

## AI-124-05｜Knowledge Weakness 左右同步

**Root Cause（真實找到）**：`js/components/WrongBook.js` 的 `applyView()` 早已正確處理「篩選後所選題目仍在結果內 → 保留選取」與「篩選後所選題目不在結果內但仍有其他符合項目 → 自動選取第一筆」兩種情況；唯獨遺漏「篩選後真的一筆都不符合」——此時右側 Detail Panel 會誠實地「什麼都不做」，繼續顯示上一筆（已被篩掉的）題目資料，正是「不得保留上一筆資料」的真實反例。

**修正**：新增 `clearDetail()`，`applyView()` 在 `matching.length === 0` 時呼叫，清空 Detail Panel 並顯示一句真實狀態文字「目前篩選條件沒有符合的題目。」（`css/pages/wrongbook.css` 新增對應 `.wb-detail__empty` 樣式）。

## AI-124-06｜Knowledge Weakness 左側 Question List

**稽核結果：已由 AI-122-04 完成，本 Sprint未修改**。核對 `questionRow()` 現有欄位：題號（第 N 題）／題目（`item.question`）／Knowledge Point／Difficulty／Wrong Count／Last Wrong，六項與 PAT 要求逐一比對皆已存在。未新增任何程式碼。

## AI-124-07／AI-124-08｜AI Tutor Context 限定＋真實自動組合

**Root Cause（真實找到，兩處）**：
1. `js/utils/TutorMessage.js` 的 `build(context, pageContext)` 即使收到真實 `pageContext.materialId`，也只在最前面加一句「你目前在「X」...」，後面仍照舊混入**整個 Workspace**（跨教材）的 `weakestKnowledgePoint`／`weakestSubject`／`recommendedChapters`／`recommendedRetest`——這正是「AI Tutor 可能引用其他教材」的真實成因。
2. `js/ui/TutorContextTip.js` 的連結過去是寫死的 `href: "tutor.html"`——即使 `pageContext.materialId` 已經被用來組出訊息文字，連結本身完全沒有把這個 context 帶進 tutor.html，一點進去 Context 就遺失了。

**修正**：
- `TutorMessage.js` 新增 `buildMaterialScopedMessage()`：當有真實 `pageContext.materialId` 時，**完全** 改用這個函式，不再混入任何跨教材訊號——句子完全來自「這份教材的完成度」「這份教材自己的最弱知識點＋Mastery＋Growth（`AHS.KnowledgeMasteryRuntime.list()` 過濾 `materialId`）」「這份教材自己的正確率（`AHS.StatisticsRuntime.examStats()`）」三個真實、既有、未修改的 Runtime 讀取。沒有 materialId context 時（例如首頁的 AI Tutor 卡片），維持原本 Workspace 全域訊號，未改變既有行為。
- `TutorContextTip.js` 的連結改用 `AHS.PlatformContext.toQuery(pageContext)` 組出真實 `href`，materialId／examId 不再遺失。

**判斷（明確揭露）**：`buildMaterialScopedMessage()` 為取得「這份教材自己的知識點」，直接呼叫 `AHS.KnowledgeMasteryRuntime.list()`（唯讀，未修改該 Runtime 任何一行），而非透過 `AHS.StatisticsRuntime`——因為 `StatisticsRuntime.knowledgeAnalytics()` 現有回傳格式沒有 `materialId` 欄位可篩選，而本 Sprint LOCK 禁止修改 Statistics Runtime（即使只是新增一個唯讀欄位）。這與 AI-117-07 當初建立的「Tutor 僅透過 StatisticsRuntime 讀取」慣例有一處明確、狹窄的例外，在此提交 Project Owner 覆核。

## AI-124-09｜Difficulty 真正生效於 QuestionBank

**Root Cause（真實找到）**：`js/components/QuestionGuide.js` 的 Easy／Medium／Hard 選擇器，選擇後只用來解除「開始練習」按鈕的 disabled 狀態，`chosenDifficulty` 這個值透過 `onStart(chosenDifficulty)` 傳出後，`QuizCenter.js` 的呼叫端 `onStart: function () { showPracticeList(); }`——**完全沒有接收這個參數**，難度選擇對實際出現的題目沒有任何影響。

**修正**：
- 新增共用 `difficultyRank()`／`resolveRealQuestionDifficulty()`（後者從既有重複的行內邏輯抽出，供顯示與篩選共用同一份判斷，永不分歧）／`filterByDifficulty()`。
- `filterByDifficulty()` 邏輯：真實符合所選難度的題目存在 → 只顯示這些；真實完全沒有 → 不偽造，改為誠實使用「目前可取得的最高難度」（PAT 原文字面要求）；連任何真實難度資料都沒有 → 誠實顯示全部（不強行篩到空清單）。
- `showQuestionGuide()` 的 `onStart(chosenDifficulty)` 現在真的把選擇存入 `practiceDifficulty`（session-scoped、純記憶體、非新 Runtime），`showPracticeList()`／`buildPracticeListView()` 據此同時過濾 `LearningQuestionRuntime` 記錄與真實 `QuestionRuntime` 題目兩種內容來源。

## AI-124-10／AI-124-11｜首頁教材唯一入口＋避免資訊重複

**稽核結果：已由 AI-122-06／07／08／11 完成，本 Sprint未修改**。核對現況：最新教材＝真實 `createdAt >= 今日-3天`，0 筆時顯示「目前近三日沒有新增教材」；教材資料夾維持唯一全部教材入口；兩者資訊互不重疊。新增 Playwright PAT-124-⑦ 佐證，未修改程式碼。

## AI-124-01｜Home 首次登入初始化

**稽核結果**：追查 `js/pages/AppHome.js` 的 `buildHome()`，確認首頁六大 Widget（今日任務／學習成效總覽／最新新增教材／教材資料夾／AI Tutor／KPI）全部在**同一次同步 render**（`buildHome()` 單一函式呼叫）中建立，沒有任何非同步／延遲載入／`setTimeout` 存在。以真實 Login Flow（`login.html` 真實點擊選學生／學校／學期）驅動的 Playwright PAT-124-①，在全新、零快取的 Workspace 下驗證全部 6 個 Widget 根節點與 8 個 KPI 項目皆於首頁第一次 render 後立即存在。未發現需要修改程式碼的真實缺陷；已有真實回歸測試佐證此行為，避免日後意外回歸。

## AI-124-13｜首頁資料一致性

**稽核結果**：逐一檢視 `AppHome.js` 六個 `buildXModel()` 函式，確認全部即時呼叫 `AHS.MaterialRuntime`／`AHS.SummaryRuntime`／`AHS.LearningStateRuntime`／`AHS.StatisticsRuntime`／`AHS.TutorMessage` 等既有 Runtime 的 public API，沒有任何頁面內快取、`setTimeout` 延遲、或寫死數值；唯一存在的 `AHS.AppConfig` 靜態資料僅用於 Hero Card 的問候語／每日金句等純 UI 裝飾內容，與 KPI／Statistics 完全無關。新增 Playwright PAT-124-⑧ 交叉驗證同一筆真實資料在首頁與知識弱點頁面上數值一致。

## 測試

- `npm run verify`：PASS（0 broken paths／0 legacy references／0 forbidden-pattern hits；既有 `window.location.href =` known-issue 與本 Sprint 無關）。
- `npm test`：全綠。BehaviorSuite 330 PASS / 0 FAIL；PipelineRegression 6／RepositoryFoundation 29／MaterialPipelineRegression 37／AnalyticsRegression 35／LearningFlowRegression 45／WorkspaceRegression 36／MaterialCenterRegression 12／FolderRegression 11／AnalyticsFilterRegression 6／TutorRegression 8／WorkspaceUIRegression 28／KnowledgeEngineRegression 44，全部 0 FAIL。
- Playwright：全綠，共 58 個測試（50 個既有 + 新增 `playwright/tests/platform-context-124.spec.js` 8 個，對應 PAT-124-①～⑧）。既有 45 個既有測試（含 AI-122／AI-123 兩個 Sprint 建立的套件）與新增測試皆重複執行多次確認非 flaky。
- `npm run qa:dashboard`：Overall PASS（14 個套件全部 PASS，含新增的 8 個 Playwright 測試）。

## Definition of Done

- [x] 首頁全部 Widget 一次 Render 完成（AI-124-01，已驗證，未發現需修正的缺陷）。
- [x] Platform Context 統一（AI-124-02，新增 `js/core/PlatformContext.js`）。
- [x] 正式測驗 Context 不重新列出全部教材（AI-124-03）。
- [x] Practice/Quiz Context 一致（AI-124-04）。
- [x] Knowledge Weakness 左右即時同步，不保留上一筆（AI-124-05）。
- [x] Knowledge Weakness 左側 Question List（AI-124-06，已由 AI-122-04 完成）。
- [x] AI Tutor 不跨教材（AI-124-07）。
- [x] AI Tutor 建議真實引用 Mastery／Growth／Accuracy 自動組合（AI-124-08）。
- [x] Difficulty 真正生效於 QuestionBank（AI-124-09）。
- [x] 首頁教材唯一入口＋避免資訊重複（AI-124-10/11，已由 AI-122 完成）。
- [x] 正式測驗/考前練習來回切換不 Reset（AI-124-12）。
- [x] 首頁資料一致性，全部即時計算（AI-124-13）。
- [x] Playwright PAT 至少 8 項，涵蓋①～⑧（AI-124-14，實際 8 項）。
- [x] `npm run verify` PASS。
- [x] `npm test` PASS。
- [x] Playwright 全部 PASS（58/58）。
- [x] QA Dashboard PASS。

## 提交 Project Owner 覆核的判斷（彙整）

1. **`materials.html` 的 `?id=` 參數命名未統一為 `?materialId=`**：與其他頁面（quiz/summary/tutor）使用的 `?materialId=` 不同名，但因為既有連結（例如 `HomeRecentMaterials.js`）已依賴 `?id=` 這個名稱，重新命名會是一次真正的 Breaking Change，本 Sprint 選擇不動，只讓 `AHS.PlatformContext` 服務其餘四個頁面共用的 `?materialId=`／`?examId=` 慣例。
2. **`TutorMessage.js` 的材料範圍限定改為直接讀取 `AHS.KnowledgeMasteryRuntime.list()`**，而非透過 `AHS.StatisticsRuntime`——因為 LOCK 禁止修改 Statistics Runtime（即使是新增一個唯讀欄位），這是 AI-117-07 既定慣例的一處狹窄例外，已於上方明確說明原因。

Deliverable：PR、EO Report（本文件）、等待 Project Owner PAT。
