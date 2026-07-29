# ImplementationReport.md — Sprint AI-020｜Dashboard Production Integration

Priority：Highest ｜ Type：Implementation Sprint ｜ 完成後停止，等待 PMO QA。**依 Forbidden 明確規定：無 Commit、無 Push。**

## Objective

依 `docs/Architecture/ProductionIntegrationBlueprint.md`（LOCKED）Boundary 7 完成 Dashboard 階段（Gap 7），完成整條 AI Learning Pipeline 最後一段。

## 實作前發現的真實架構缺口（已回報並取得決策後才動工）

完整讀取 `js/components/Dashboard.js` 後確認：`create(model)` 預期的完整 model 包含 9 個欄位（`stats`／`trend`／`timeDist`／`progress`／`knowledge`／`todayTasks`／`subjectStatus`／`aiTips`／`title`/`subtitle`），且渲染函式（`lineChart`/`donut`/`progressCard`/`knowledgeCard`/`todayTasks`/`aiTips`）皆無防禦性寫法，直接解構欄位（如 `trend.days.length`），對缺欄位會直接拋錯。全庫比對確認：僅 `stats`（結合 `StatisticsRuntime` + Sprint AI-019 的 `LearningHistoryModel`）與 `subjectStatus`（`LearningHistoryModel.masteryRateBySubject()`）有真實資料來源；其餘 6 個欄位（`trend`／`timeDist`／`progress`／`knowledge`／`todayTasks`／`aiTips`）在整個 Repository 中**從未被任何 Sprint 建置過真實資料來源**（無每日學習時數趨勢追蹤、無時間分布統計、無獨立於精熟率之外的整體進度環、無逐知識點掌握度排行、無每日任務／目標系統、無 AI 建議生成）。

此為與本 Sprint Completion Criteria（「Dashboard shall correctly display... Existing dashboard metrics」）真實牴觸之處：若要完整顯示全部既有 9 個欄位，除了捏造資料（違反本專案自 Sprint 一路延續至今、每個 Sprint 皆明文要求的「絕不虛構，誠實空狀態」鐵律）別無他法。已回報 PMO 並提供三個選項，PMO 確認繼續後，依「Partial Dashboard」方案實作：僅渲染有真實資料的區塊，其餘 6 個區塊以既有、未修改的 `AHS.EmptyState` 元件（compact 模式）逐區塊誠實顯示「尚無資料」，而非整頁全有全無或捏造內容。

## Development

### `js/components/Dashboard.js`（新增 `sectionEmpty()` helper + `create()` 條件式渲染）

`create(model)` 的「無 model → 整頁 Empty State」路徑完全不變（零真實資料時，行為與今日完全相同）。當呼叫端提供真實 model 時，逐區塊依欄位是否存在決定渲染真實內容或呼叫 `sectionEmpty(title, hint)`（內部呼叫既有、未修改的 `AHS.EmptyState.create({title:"尚無資料", hint, compact:true})`）。`banner()`/`statCards()`/`subjectStatus()` 三個既有渲染函式完全未修改；僅 `create()` 本身新增條件判斷與一個新的私有 helper 函式。

### `js/pages/AppDashboard.js`（新增 `buildModel()`）

`buildStats()` 合併 `AHS.StatisticsRuntime.refresh().stats`（Exam Mode，既有未修改）與 `AHS.LearningHistoryModel.refresh().stats`（Practice Mode，Sprint AI-019 既有未修改）——兩者皆為既有、未修改 Public API 的直接呼叫，零額外資料轉換。`buildSubjectStatus()` 僅使用 `LearningHistoryModel.masteryRateBySubject()`（Practice 精熟率），刻意不與 Exam 正確率混合呈現同一個 percent 欄位（避免發明未經授權的合併邏輯，違反 Reuse Policy「without additional data transformation beyond Blueprint-defined integration」）。`hasAnyRealData()` 確認 `HistoryRuntime`／`WrongBookSession` 兩者皆無真實記錄時，`buildModel()` 回傳 `null`，維持既有整頁 Empty State 行為不變。

### `dashboard.html`（Script Wiring）

新增 7 個 `<script>` 標籤：`PersistenceAdapter.js`、`HistoryRuntime.js`、`StatisticsRuntime.js`、`WrongBookSession.js`、`ReviewQueue.js`、`ReviewModel.js`、`LearningHistoryModel.js`。皆為既有、未修改檔案。

## Reuse Policy 落實摘要

| 優先序 | 使用項目 |
|---|---|
| 1. Existing Runtime | `HistoryRuntime`／`WrongBookSession`／`ReviewQueue`（唯讀，均未修改） |
| 2. Existing Projection | `LearningHistoryModel`（Sprint AI-019，唯讀，未修改） |
| 3. Existing StatisticsRuntime | `StatisticsRuntime.refresh()`（唯讀，未修改） |
| 4. Existing Dashboard components | `AHS.EmptyState`（既有、未修改，新增 compact 用法） |
| 5. Existing Identity Mapping | 不適用（本階段無需身分對應） |

未新增任何 Runtime；`HistoryRuntime`／`StatisticsRuntime`／`ReviewRuntime`／History Projection（`LearningHistoryModel.js`）／Review 相關檔案全數零修改。

## Validation

以真實 jsdom 執行驗證完整鏈路（`materials.html` 真實按鈕 → `quiz.html` 真實答錯 → 真實 sessionStorage 攜帶 → `dashboard.html` 真實載入），共 21/21 PASS：

- 零真實資料時，`dashboard.html` 行為與今日完全相同（單一整頁 Empty State，零 stat 卡片、零區塊 Empty State）。
- 有真實資料時：8 張真實 stat 卡片正確顯示（Exam 4 + Practice 4）、真實「練習答錯題數」正確反映真實答錯數、真實「科目狀態」正確反映真實精熟率、恰好 6 個無真實資料來源的區塊皆顯示誠實「尚無資料」、零捏造圖表/進度/任務內容。
- Regression：`git diff` 確認除 Sprint AI-018/019 已回報之檔案外，本 Sprint 僅修改 `Dashboard.js`／`AppDashboard.js`／`dashboard.html` 三個檔案；`HistoryRuntime.js`／`StatisticsRuntime.js`／`LearningHistoryModel.js`／`ReviewQueue.js`／`ReviewModel.js`／`ReviewRuntime.js`／WrongBook 相關檔案全數零修改；`review.html`（Sprint AI-018）不受影響。

詳見 `docs/QA/Sprint_AI_020_QAReport.md`。驗證腳本為暫存腳本，執行後已刪除。

## Changed Files

見 `ChangedFiles.txt`。

## Forbidden 合規確認

- ☑ 未修改 Review／ReviewRuntime／`review.html`
- ☑ 未修改 History Projection（`LearningHistoryModel.js`）
- ☑ 未修改 `HistoryRuntime`／`StatisticsRuntime`
- ☑ 未修改任何 Runtime Public API
- ☑ 未新增 Runtime
- ☑ 未 Refactor 無關模組
- ☑ 未重新設計架構（`Dashboard.js` 的修改為既有渲染路徑的條件式擴充，非結構重寫）
- ☑ 未 Commit
- ☑ 未 Push

## Completion Criteria 確認

- ☑ Dashboard Production Integration 完全可運作（真實驗證 21/21）
- ☑ Dashboard 正確消費 History Projection
- ☑ Dashboard 正確消費 StatisticsRuntime-compatible 資料
- ☑ Runtime flow 連續（Review → History Projection → Dashboard → AppDashboard 全鏈已驗證）
- ☑ 既有 Dashboard 功能通過驗證（零資料情境行為完全不變；`npm test` 175/175、`npm run verify` PASS、全部 21 個 regression 檔案 PASS）
- ☑ 未引入架構變更
- ☑ Repository 維持 Blueprint compliant

## 完成後

依 Sprint 指示，**完成實作後停止**，等待 PMO QA。未 Commit、未 Push。
