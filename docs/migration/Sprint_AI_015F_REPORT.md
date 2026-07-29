# REPORT.md — Sprint AI-015F｜WrongBook Production Integration (Analysis Only)

Priority：P0 ｜ Type：Architecture Audit + Production Validation ｜ Baseline Commit：7190fef ｜ 完成後停止，等待 PMO 依證據授權 AI-015F Implementation。**本 Sprint 依 QA Requirements 明確規定：無實作、無 Commit、無 Push，僅分析。**

## Objective

在 Sprint AI-015E 建立的 Production Pipeline 基礎上，完成 WrongBook 的 Production 整合前置分析：完整記錄 WrongBook 架構、驗證 Production Flow 是否正確抵達 WrongBook、盤點所有殘留的 Legacy 依賴。

## Development

### Part A — Repository Architecture Audit

完整讀取 `WrongBookGenerator.js`、`WrongBookSession.js`、`WrongBookRuntime.js`、`WrongBook.js`、`AppWrongBook.js`、`ReviewQueue.js`、`ReviewModel.js`、`ReviewGeneratorRuntime.js`，逐一記錄 Data Source／Read Path／Write Path／Identity Mapping／Runtime Dependency。詳見 `docs/Architecture/WrongBookProductionFlow.md`。

**對 Sprint 規格 Baseline 圖的真實修正**：規格圖示 `WrongBookGenerator ↓ WrongBookRuntime` 為單一線性路徑，但 `WrongBookGenerator.js` 原始碼與標頭皆明確聲明「never touches... the legacy Sprint-4 WrongBookRuntime」，grep 確認零交叉引用。真實路徑是 `WrongBookGenerator → WrongBookSession`（Sprint 7.0 正式寫入路徑）另有一條**獨立、頁面載入時觸發**的橋接（`js/pages/AppWrongBook.js` 的 `bridgeSessionIntoSprint4Runtime()`，非 `WrongBookGenerator` 本身）將 `WrongBookSession` 內容鏡射進 `WrongBookRuntime`，供既有 `WrongBook.js` UI 元件顯示（該元件唯讀 `WrongBookRuntime`，PMO 既有裁定「Runtime is Source of Truth」）。此橋接呼叫的是既有、未修改的 `WrongBookRuntime.sync()` API（與 `AutoGrader.grade()` 共用），非新建寫入路徑。

同時發現並記錄「重做流程」（WB-004/007/008，`WrongBook.js` 自身的頁內複習機制）：答對經 `WrongBookGenerator.update()` 升級 Mastery、答錯經 `WrongBookGenerator.add()` 走相同去重路徑，兩者皆同步 `ReviewQueue.enqueue()`；查無對應 v1.0 記錄則安靜略過，從不捏造。

### Part B — Production Validation

以真實 jsdom 執行（`materials.html` 真實按鈕觸發 → `quiz.html` 真實 Runtime-only 讀取 → 答錯 → `WrongBookGenerator` → `WrongBookSession` → `wrongbook.html` 橋接 → `WrongBookRuntime` → 重做流程）驗證：答錯建立、WrongBook 記錄建立、去重處理、重做流程、統計更新，共 22/22 PASS。詳見 `docs/QA/WrongBookProductionValidation.md`。驗證腳本為暫存腳本，執行後已刪除，未納入版本控制，未修改任何程式碼。

### Part C — Legacy Dependency Audit

Grep 全庫確認：`QuestionGenerationFlow.run()` 已無任何生產呼叫端（`quiz.html` 的 `<script>` 標籤已成孤兒載入，僅定義未被呼叫）；`LearningPipeline.js` 的 `buildQuestions()` 仍在**每次教材上傳時自動**寫入 `[Stub]` 內容進 `LearningQuestionRuntime`（經 `MaterialCenter.js` 的 `runLearningPipeline()`），與 Production Pipeline 共用同一個 Store 但不影響顯示正確性（`isRealLearningQuestion()` 過濾器不變）；`WrongBookRuntime` 的兩個真實寫入來源（Exam Mode sync + Sprint 7.0 橋接）皆為合法、仍必要的依賴，非待清理項目。詳見 `docs/Architecture/WrongBookDependencyAudit.md`，逐項附 File／Function／Dependency／Purpose／Production impact。

## Changed Files

**新增（4 檔案，Deliverables，僅文件）**
```
docs/Architecture/WrongBookProductionFlow.md
docs/Architecture/WrongBookDependencyAudit.md
docs/QA/WrongBookProductionValidation.md
docs/migration/Sprint_AI_015F_REPORT.md
```

**零修改（本 Sprint 明確禁止任何實作，已確認）**
```
git status 確認僅新增上述 4 個 Markdown 檔案，無任何既有 .js／.html 檔案被修改。
Quiz / Review / QuestionProviderBridge / LearningQuestionRuntime / 任何 LOCK Runtime API — 全數未觸碰。
```

## QA

- ☑ Repository Architecture Analysis 完成（Part A，7 個檔案逐一讀取，100% 依真實原始碼）
- ☑ Dependency Mapping 完成（Part C，3 項真實殘留依賴逐一附證據）
- ☑ Production Validation 完成（Part B，22/22 PASS，真實 jsdom 執行）
- ☑ Repository Truth 確認（規格 Baseline 圖的「Session→Runtime」假設已修正為真實路徑）
- ☑ 無實作、無 Commit、無 Push（依本 Sprint QA Requirements）

## Root Cause

無（Analysis Sprint，非 Bug Fix）。

## Impact Analysis

僅新增 4 份 Markdown 文件，零程式碼變更。

## Regression

不適用——本 Sprint 未修改任何可執行程式碼。

## QA Summary

WrongBook 完整架構已 100% 依 Repository 真實內容記錄（含對規格 Baseline 圖的一項真實修正），Production Pipeline 抵達 WrongBook 的完整鏈路（答錯建立／去重／重做／統計）已以真實 jsdom 執行驗證 22/22 PASS，殘留 Legacy 依賴已誠實盤點三項且註明各自的真實 Production Impact（其中兩項為顯示安全、一項為孤兒但無害）。未觸發任何 Stop Condition。

## 完成後

依 Sprint 指示，**完成分析後停止**，等待 PMO 依本次證據決定是否授權 AI-015F Implementation。
