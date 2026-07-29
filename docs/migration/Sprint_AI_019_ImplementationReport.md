# ImplementationReport.md — Sprint AI-019｜History Production Integration

Priority：Highest ｜ Type：Implementation Sprint ｜ 完成後停止，等待 PMO QA。**依 Forbidden 明確規定：無 Commit、無 Push。**

## Objective

依 `docs/Architecture/ProductionIntegrationBlueprint.md`（LOCKED）Boundary 6 完成 History 階段（Gap 6），僅限 History 範圍，不觸及 Dashboard。

## Repository Truth 澄清（實作前）

本 Sprint 規格 Validation 段落所繪「Review ↓ History Projection ↓ History Runtime」，若解讀為「Projection 之後仍須寫入既有 `HistoryRuntime.js`（Sprint 4，Exam-only schema）」，將與本 Sprint自身 Reuse Policy 明文規定（「History shall be implemented as a Projection. Do NOT introduce a new Runtime.」）及 Forbidden 清單（「No Runtime redesign／No Runtime replacement／No API modification」）直接牴觸，也會與 LOCKED Blueprint 的 Gap 6 建議（唯讀 Projection、零新寫入路徑）牴觸。經確認 Sprint 全文脈絡（Reuse Policy 段落已明文排除新 Runtime），判定 Validation 段落的「History Runtime」為結果記錄的口語稱呼，非指字面 `HistoryRuntime.js` 檔案——依 LOCKED Blueprint 與本 Sprint 自身 Reuse Policy 實作，未觸發 Stop Condition。

## Development

### 新增 `js/runtime/LearningHistoryModel.js`（Gap 6，唯讀 Projection，命名比照 `ReviewModel.js` 慣例）

不新增 Runtime、不新增寫入路徑、不修改任何既有檔案。完全依既有真實資料即時推導：

- **Data Source**：`AHS.WrongBookSession`（`firstWrongAt`／`lastWrongAt`／`wrongCount`／`masteryLevel`／`traceability` 等既有欄位——本 Sprint 未新增任何欄位）與 `AHS.ReviewQueue`（複習身分：priority／nextReviewAt／masteryLevel）。
- **Public API（四個）**：
  - `list(materialId?)` — 每筆真實 Practice 題目的學習歷程，保留 `materialId`（教材身分）、`questionId`（複習身分）、完整 `traceability`（逐字取自 WrongBookSession，未改寫），並附上該題在 `ReviewQueue` 的真實對應（無對應則誠實為 `null`，不虛構）。
  - `masteryRateBySubject()` / `getSubject(subject)` — 與 `StatisticsRuntime.accuracyBySubject()`/`getSubject()` 相同輸出形狀（`[{subject, percent}]`）。Practice Mode 無「正確率」概念（WrongBookSession 僅記錄答錯），誠實改以「精熟率」（該科目答錯題目中已達 `mastered` 的真實比例）呈現，而非虛構或借用不相符的語意。
  - `refresh()` — 與 `AHS.StatisticsRuntime.refresh()` **完全相同**的輸出形狀（`{stats: [...4 項...], accuracyByStudy: [...]}`，每個 stats 項目皆為 `{icon, label, value, unit, delta}`），確保「StatisticsRuntime compatibility」與「Dashboard dependencies fully prepared without modifying Dashboard」——未來 Dashboard Sprint 只需將本模組的 `stats`/`accuracyByStudy` 與 `StatisticsRuntime` 的併列即可，`StatisticsRuntime.js` 本身零修改。

### 新增 `tests/regression/LearningHistoryModelV1.js`（永久回歸測試，比照既有 `ReviewModelV1.js` 慣例）

41 項斷言：API 完整性、`list()`/`masteryRateBySubject()`/`getSubject()`/`refresh()` 正確性、身分與 Traceability 保留、唯讀確認（無 add/store/remove/reset/update）、Forbidden Dependencies source-scan（未依賴 `HistoryRuntime`／`StatisticsRuntime`／`QuestionGenerationRuntime`／`KnowledgeGraphRuntime`／`MaterialRuntime` 等）、Memory Only 確認、誠實空狀態確認。

### 未新增任何 HTML 接線

依 LOCKED Blueprint 的 Roadmap Phase 3（「no existing file modified」）與本 Sprint「Dashboard remains out of scope」的明文規定，本 Sprint 刻意不將 `LearningHistoryModel.js` 接入任何頁面（該接線是 Phase 4／Dashboard Sprint 的職責）。驗證改以既有慣例（未接線檔案透過 `window.eval()` 疊加）於真實頁面情境中驗證，證明模組本身正確無誤、隨時可供 Dashboard Sprint 直接掛載。

## Reuse Policy 落實摘要

| 優先序 | 使用項目 |
|---|---|
| 1. Existing Runtime | `WrongBookSession`／`ReviewQueue`（唯讀，均未修改） |
| 2. Existing Projection | 直接沿用 `ReviewModel.getReviewProgress()` 作為 `refresh()` 的資料來源之一 |
| 3. Existing Bridge | 不適用（本階段無需新 Bridge） |
| 4. Existing Identity Mapping | 沿用 WrongBookSession 記錄自身已保留的真實 `traceability`／`questionId`，無需另建對應 |
| 5. StatisticsRuntime-compatible 結構 | `refresh()` 逐欄位比照 `StatisticsRuntime.refresh()` 形狀 |

未新增 Runtime、未新增 Bridge、未新增 Identity Mapping 機制、未修改任何既有 Public API。

## Validation

以真實 jsdom 執行（`materials.html` 真實按鈕點擊 → `quiz.html` 真實答錯 → 真實 sessionStorage 攜帶 → `LearningHistoryModel.js` 疊加於 `index.html` 情境驗證）確認：

- Review output 成功進入 History：`list()` 正確反映真實 WrongBook/ReviewQueue 資料。
- 教材身分（materialId）、複習身分（questionId + review 對應）、Traceability 全數保留、逐字正確。
- `refresh()` 與 `StatisticsRuntime.refresh()` 輸出形狀完全一致（相同頂層欄位、相同 stats 項目欄位）。
- `StatisticsRuntime` 本身（Exam Mode 真實流程）完全不受影響。
- `git diff` 確認本 Sprint 除新增兩個檔案外，未修改任何既有檔案（Modified 清單中的既有檔案異動全數屬於 Sprint AI-018，已於該 Sprint 報告確認）。

共 18/18 PASS。詳見 `docs/QA/Sprint_AI_019_QAReport.md`。驗證腳本為暫存腳本，執行後已刪除。

## Changed Files

見 `ChangedFiles.txt`。

## Forbidden 合規確認

- ☑ 未修改 Dashboard／Dashboard.js
- ☑ 未修改任何 Runtime Public API
- ☑ 未新增 Runtime（`LearningHistoryModel` 為唯讀 Projection，非 Runtime）
- ☑ 未 Refactor 無關模組
- ☑ 未重新設計架構
- ☑ 未 Commit
- ☑ 未 Push

## Completion Criteria 確認

- ☑ History Production Integration 完全可運作（真實驗證 18/18）
- ☑ Review output 成功進入 History
- ☑ History Projection 已實作（`LearningHistoryModel.js`）
- ☑ Runtime flow 連續（WrongBook → ReviewQueue → LearningHistoryModel 全鏈已驗證）
- ☑ 既有功能通過驗證（`npm test` 175/175、`npm run verify` PASS、全部 21 個 regression 檔案 PASS）
- ☑ StatisticsRuntime compatibility 保留（形狀完全一致，`StatisticsRuntime.js` 零修改）
- ☑ Dashboard 依賴已備妥且未實作 Dashboard（`refresh()` 可直接供未來 Dashboard Sprint 併用）
- ☑ Repository 維持 Blueprint compliant

## 完成後

依 Sprint 指示，**完成實作後停止**，等待 PMO QA。未 Commit、未 Push。
