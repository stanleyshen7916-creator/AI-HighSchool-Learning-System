# REPORT.md — Sprint AI-013｜AI Summary Beta Cutover

Priority：P0 ｜ Type：Sprint ｜ Baseline：EO-AI-001～EO-AI-010B, EO-AI-012～EO-AI-012E（LOCKED）｜ 完成後停止，不自行開始下一個 Sprint。

## Objective

完成 AI Summary Beta Cutover：New Pipeline 成為預設執行流程，Legacy 保留作為 Compare 與 Rollback，Repository 完成 Beta Integration。

## 過程記錄：兩次暫停、兩次 PMO Hotfix，才完成本 Sprint

本 Sprint 執行過程中，Part A（Default Mode Migration）在真正動手前先用真實資料驗證，兩次發現真實缺口，兩次暫停回報 PMO，PMO 分別發出 Hotfix EO 後才重新嘗試：

1. **第一次暫停**：切換預設模式後跑真實 `BehaviorSuite`，發現「卡片顯示標題」與「Summary 已由 KnowledgeSummaryRuntime 產生」兩項失敗。追查後者是 mode='new' 下 Generate 專屬 New Runtime 的預期行為（非 Bug），前者是真實缺陷——New Pipeline 的 `title` 恆為 `null`。回報 PMO，PMO 發出 **EO-AI-012E**（Summary Metadata Migration）：Metadata Schema 新增 `title` 欄位（向下相容），`MetadataBuilder`/`SummaryBuilder` 正確映射教材真實標題；`BehaviorSuite` 依 PMO 指示保留舊測試、新增 New Runtime 專屬測試。
2. **第二次暫停**：修正標題後，用真實 Compare Mode 對全部 8 筆真實 Repository MockData（非合成測試字串）驗證，發現 6/8（75%）Core Concept 遺失——真實教材皆以「本教材介紹/整理/彙整/說明…」開頭，EO-AI-010A 的 Pattern 未涵蓋。回報 PMO，PMO 發出 **EO-AI-010B**（Summary Extraction Rule Expansion）：`CONCEPT_SENTENCE_PATTERN` 新增「本教材」主詞與「整理/彙整」動詞，向下相容，8 筆真實教材全數恢復 100% Coverage。

兩次修正皆已個別完成 REPORT／Commit／Push（見 `docs/migration/EO_AI_012E_REPORT.md`、`docs/migration/EO_AI_010B_REPORT.md`），本 REPORT 記錄的是兩次修正後、Sprint AI-013 全部六個 Part 最終完成的狀態。

## Part A — Default Mode Migration

`ai-engine/src/service/SummaryProvider.js`：`mode` 預設值 `"legacy"` → `"new"`。Compare／Legacy 模式完全保留（`MODES` 陣列未變，`setMode()`/`getSummary()`/`generateSummary()` 邏輯完全未動——僅改變初始值）。Rollback 驗證：`setMode("legacy")` 即可還原，零程式碼變更。

`tests/jsdom/BehaviorSuite.js` 測試 [21] 新增 `A.AIEngine.SummaryProvider.setMode("legacy")` 顯式釘選——因為它驗證的正是 Legacy 通路（以 `KnowledgeSummaryRuntime` 為 ground truth），不應再依賴「目前 ambient 預設剛好是 legacy」這個現已不成立的假設；斷言本身逐字未改。

## Part B — Equivalence Validation

真實驗證見 `docs/QA/QA_Sprint_AI-013_Equivalence_Validation.md`：對全部 8 筆真實 Repository MockData 教材跑 Compare Mode，5 個分類（Core Concepts／Keywords／Definitions／Formulas／Important Points）**零退化**，Compatibility（Legacy／New）皆 PASS。

## Part C — Runtime Validation

真實驗證見 `docs/QA/QA_Sprint_AI-013_Runtime_Validation.md`：Idle／Generate／Ready／Compare／Rollback 五種狀態，在真實 `new` 預設下逐一驗證通過（23/23）。確認 Read API（`getSummary()`/`getLearningSummary()`）在三種模式下皆為永久 Read Only；Generate 僅由「開始 AI 分析」（`ensureLearningSummary()`）觸發。

## Part D — Legacy Manifest

見 `docs/QA/QA_Sprint_AI-013_Legacy_Manifest.md`：列出 Legacy Runtime（`KnowledgeSummaryRuntime.js`／`AITutorRuntime.js`）、Legacy Service（`generateLegacySummary()`／`ensureQuestionSet()`）、完整內容分析依賴鏈（`MaterialTextPipeline`→`KnowledgePipeline`→…）、Compare 依賴（`SummaryComparator`）、Rollback 依賴（上述全部）。全部保留，未刪除任何 Legacy Code。

## Part E — Documentation

`ai-engine/README.md` 更新：Status 列反映 Sprint AI-013 最終狀態、`SummaryProvider.js` 描述更新為預設 `new`、Public API 清單更新、新增「Migration Flow」章節（Before/After 圖、Rollback Flow、Compare Flow 三張 ASCII 圖）。

## Part F — Repository QA

全部完成，見下方 Regression 表格。`materials.html → SummaryProvider（Default=new） → AITutorService → MaterialSummaryCard` 全流程驗證正常（Part C）。

## Changed Files（本次最終 Commit）

**修改（3 檔案）**
```
ai-engine/src/service/SummaryProvider.js — mode 預設值 legacy → new，header 註解更新
tests/jsdom/BehaviorSuite.js             — 測試 [21] 新增 setMode("legacy") 顯式釘選
ai-engine/README.md                      — Migration Flow 章節、Status 列、Public API 更新
```

**新增（3 檔案，Deliverables）**
```
docs/QA/QA_Sprint_AI-013_Equivalence_Validation.md
docs/QA/QA_Sprint_AI-013_Runtime_Validation.md
docs/QA/QA_Sprint_AI-013_Legacy_Manifest.md
```

**新增（1 檔案，本 REPORT）**
```
docs/migration/Sprint_AI_013_REPORT.md
```

**零修改（依 Forbidden 清單逐一以 `git diff --stat` 確認）**
```
js/ui/MaterialSummaryCard.js         — 未變
js/ui/MaterialPreview.js             — 未變
js/runtime/AITutorService.js         — 未變（Public API 逐字未變）
```

## Regression（本次最終 Commit 前的完整驗證）

| 項目 | 結果 |
|---|---|
| VerifyPaths | PASS（0 broken / 0 legacy） |
| VerifyForbiddenPatterns | PASS |
| jsdom BehaviorSuite | 174 / 174 PASS |
| PipelineRegression | 6 / 6 PASS |
| Regression Suite（20 檔） | 739 / 739 PASS |
| html5validator（vnu，全部根頁面） | 0 errors，exit 0 |
| Console Error | 0 |
| Sprint AI-013 Part A 驗證 | 6 / 6 PASS |
| Sprint AI-013 Part B 驗證（8 筆真實教材） | 零退化 |
| Sprint AI-013 Part C 驗證 | 23 / 23 PASS |

## Completion Criteria

☑ Default = new
☑ Compare PASS
☑ Rollback PASS
☑ Read/Generate Contract 維持
☑ BehaviorSuite PASS
☑ jsdom PASS
☑ Regression PASS
☑ Runtime PASS
☑ Browser PASS
☑ GitHub Push（見下方）
☑ REPORT 完成

## QA Summary

New Pipeline 正式成為預設執行流程（`SummaryProvider` mode='new'），Legacy 完整保留作為 Compare 與 Rollback（零刪除），Read/Generate Contract 在三種模式下皆維持永久成立，兩次真實資料驗證中發現的缺口（Title 缺失、Concept Pattern 涵蓋不足）皆已個別回報 PMO 並由對應 Hotfix EO 修正，本 Sprint 最終以零退化、零回歸完成 Beta Cutover。無 LLM、無外部套件、無 fetch/XHR/localStorage、無第二套 Runtime/Namespace/Architecture、未刪除任何 Legacy 元件。

## 完成後

依 Sprint 指示，**完成後停止，不自行開始下一個 Sprint（Sprint AI-014 Legacy Cleanup）**。
