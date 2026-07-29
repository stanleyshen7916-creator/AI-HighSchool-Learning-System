# ImplementationReport.md — Sprint AI-018｜Review Production Integration

Priority：Highest ｜ Type：Implementation Sprint ｜ 完成後停止，等待 PMO QA。**本 Sprint 依 Forbidden 明確規定：無 Commit、無 Push**（即使是實作 Sprint）——所有變更保留在工作目錄，未提交。

## Objective

依 `docs/Architecture/ProductionIntegrationBlueprint.md`（Sprint AI-017 LOCKED）完成 Review 階段剩餘的兩項缺口（Gap 5a／Gap 5b），僅限 Review 範圍，不觸及 History／Dashboard。

## Repository Truth 澄清（實作前）

本 Sprint 規格的 Validation 段落所繪「WrongBook ↓ ReviewGeneratorRuntime ↓ ReviewRuntime ↓ review.html ↓ Review Widget」為單一線性鏈路示意，與 Blueprint 已確認的 Repository Truth 不完全一致：`ReviewGeneratorRuntime`（materials.html AI Tutor 面板）與 `ReviewRuntime`（Sprint 4 Exam 詳情、既有 PMO 裁定不使用於聚合）、`review.html`（原僅讀 `HistoryRuntime`+`WrongBookRuntime`）三者彼此獨立，`Review Widget` 位於 `index.html` 而非 `review.html`。本 Sprint 依 LOCKED Blueprint 的真實 Gap 5a／5b 定義實作，而非強行套用規格示意圖；此為既定的「Repository Truth > 規格假設」原則之延續，未觸發任何 Stop Condition（非架構衝突，僅示意圖精確度落差）。

## Development

### Gap 5b-1｜ReviewGeneratorRuntime Identity Mapping 修復

**檔案**：`js/runtime/ReviewGeneratorRuntime.js`（內部解析邏輯，Public API 簽名未變）。

**問題**：`generateReview()` 原本僅以 `entry.questionId`（`LearningQuestionSession` id 空間，如 `lqv1_N`）直接呼叫 `QuestionGenerationRuntime.getQuestion()`（僅認得自己的 `qg_N` id 空間），對所有真實 Production Bridge 產生的 WrongBook 記錄必然回傳 `null`（Sprint AI-015G 已確認）。

**修復**：保留原本的直接查找作為第一嘗試（相容任何 id 恰好對齊的呼叫端，且維持既有測試對 `getQuestion(` 字面出現的斷言），查找失敗時新增 Fallback：以 WrongBook 記錄自身已攜帶的真實 `traceability.knowledgeId`（Bridge 從產生時就逐字複製自同一 Knowledge Graph 節點 id，橫跨 `QuestionGenerationRuntime`／`LearningQuestionSession`／`WrongBookSession` 三者皆相同），在該教材的 `QuestionGenerationRuntime.getQuestionsByMaterial(materialId)` 題目池中比對 `knowledgeNodeId` 找出正確題目記錄。全程僅讀取既有 Public API（`getQuestionsByMaterial`，早已存在），不新增 Runtime、不修改任何 Public API 簽名、未引入 `KnowledgeGraphRuntime` 依賴（該依賴被本檔標頭明文禁止，source-scan 斷言於既有測試——已確認未違反）。

### Gap 5b-2｜ReviewGeneratorRuntime 真實觸發點

**檔案**：`js/ui/MaterialQuestionCard.js`（`generate()` 函式）。

在既有的「產生 AI 題目」／「重新產生題目」按鈕成功產生並橋接題目後（緊接 Sprint AI-015E 已組合的 `QuestionProviderBridge.bridge()` 呼叫之後），新增一行呼叫既有、未修改的 `AHS.ReviewGeneratorRuntime.generateReview(item.id)`。與 `QuestionGenerationRuntime`／`ensureQuestionSet()` 同為 Memory Only 特性一致：每次真實觸發皆重新推導，誠實反映當下真實 WrongBook 狀態；無錯題時誠實回傳 `null`，非錯誤。

### Gap 5a｜review.html Production Wiring

**檔案**：`review.html`、`js/pages/AppReview.js`。

新增 4 個 `<script>` 標籤（`WrongBookSession.js`／`ReviewQueue.js`／`ReviewModel.js`／`ReviewWidget.js`，另補上先前缺漏的 `PersistenceAdapter.js` 使前三者的 sessionStorage 讀取生效）。`AppReview.js` 的 `init()` 新增一行，掛載既有、完全未修改的 `AHS.ReviewWidget.create()`（Sprint AI-015G 已確認為唯一真正連接 Production Chain 的 Review 消費端）——附加於既有 Exam Mode 卡片（`ReviewHomeCard`／`ReviewQuickAction`／`ReviewRecentSession`）之後，不修改、不移除任何既有卡片。依 Reuse Policy 優先序（Existing UI Components 排序第 5，但 Repository Truth 確認無其他可重用方案更貼合），未新增任何新元件檔案。

### Reuse Policy 落實摘要

| 優先序 | 使用項目 |
|---|---|
| 1. Existing Runtime | `WrongBookSession`／`ReviewQueue`／`ReviewModel`／`QuestionGenerationRuntime`（均未修改） |
| 2. Existing Projection | `ReviewModel`（本 Sprint 唯讀重用） |
| 3. Existing Bridge | `QuestionProviderBridge`（未修改，僅重用其既有觸發點旁新增呼叫） |
| 4. Existing Identity Mapping | 沿用 `QuizCenter.js` 的 `wrongBookQuestionId()` 手法精神（讀取真實共用欄位比對，而非假設共用 id） |
| 5. Existing UI Components | `ReviewWidget.create()`（review.html 新增掛載，元件本身零修改） |

未新增任何 Runtime、Bridge、Projection 類型；未修改任何既有 Public API 簽名。

## Validation

以真實 jsdom 執行（`materials.html` 真實按鈕點擊 → `quiz.html` 真實答錯 → 真實 sessionStorage 攜帶 → 重返 `materials.html` 真實按鈕點擊 → `review.html` 真實載入）驗證兩項缺口皆已關閉，共 24/24 PASS：

- Gap 5b：`ReviewGeneratorRuntime.getReviewByMaterial()` 對真實 Production WrongBook 記錄不再回傳 `null`，`knowledgeType`／`knowledgeNodeId` 皆為真實值且可回溯真實圖譜節點，`AITutorRuntime.getReviewList()` 回傳真實資料。
- Gap 5a：`review.html` 真實顯示 `ReviewWidget`，「總錯題」正確反映真實 `WrongBookSession` 資料，既有 Exam Mode 卡片維持不變。
- Regression：`git diff` 逐檔確認 Forbidden 清單（`QuestionGenerationRuntime`／`QuestionProviderBridge`／`LearningQuestionRuntime`／`WrongBookGenerator`／`WrongBookSession`／`ReviewQueue`／`ReviewModel`／`ReviewWidget`／`HistoryRuntime`／`Dashboard.js`／`AppDashboard.js`／`QuizCenter.js`）全數零修改；`index.html` 既有 `ReviewWidget` 不受影響。

詳見 `QAReport.md`（`docs/QA/Sprint_AI_018_QAReport.md`）。驗證腳本為暫存腳本，執行後已刪除，未納入版本控制。

## Changed Files

見 `ChangedFiles.txt`。

## Forbidden 合規確認

- ☑ 未修改 History
- ☑ 未修改 Dashboard
- ☑ 未修改任何 Runtime Public API（`ReviewGeneratorRuntime` 內部解析邏輯變更，對外簽名不變）
- ☑ 未新增 Runtime
- ☑ 未 Refactor 無關模組（`QuizCenter.js` 完全未觸碰）
- ☑ 未重新設計架構
- ☑ 未 Commit
- ☑ 未 Push

## Completion Criteria 確認

- ☑ Review Production Integration 完全可運作（真實驗證 24/24）
- ☑ 所有 Review 消費端已連接（`index.html` 原已連接；`review.html` 本 Sprint 新增連接；materials.html AI Tutor 面板本 Sprint 修復可運作）
- ☑ Runtime flow 連續（WrongBook → ReviewGeneratorRuntime 已驗證；WrongBook → ReviewQueue → ReviewModel → ReviewWidget 已於 review.html 驗證）
- ☑ 既有功能通過驗證（`npm test` 175/175、`npm run verify` PASS、全部 20 個 regression 檔案 PASS，含新增之 `ReviewGeneratorV1.js` 8 項新斷言 70/70）
- ☑ 未引入架構變更
- ☑ Repository 維持 Blueprint compliant

## 完成後

依 Sprint 指示，**完成實作後停止**，等待 PMO QA。未 Commit、未 Push。
