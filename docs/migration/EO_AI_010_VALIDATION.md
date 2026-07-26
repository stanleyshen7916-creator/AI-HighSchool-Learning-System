# EO_AI_010_VALIDATION.md — AI Summary Equivalence Validation

依 `SummaryComparator`（`ai-engine/src/validator/SummaryComparator.js`）對 Legacy `KnowledgeSummaryRuntime` 與新 `SummaryPipeline`（EO-AI-009 起輸出 `.summary`）跑的**真實**比對——用真實 jsdom 載入 `materials.html` 完整既有管線，兩組不同豐富度的教材各跑一次，無任何數字為假設或編造。

## 測試情境

| 情境 | 內容 |
|---|---|
| rich | 「三角函數／斜邊／正弦：對邊除以斜邊／餘弦定理 a² = b² + c² − 2bc·cosA／本節說明三角函數的定義與應用。」 |
| sparse | 「細胞」（單行、極簡內容） |

## Coverage Summary

### 情境：rich

| 分類 | Legacy Count | New Count | Coverage % | Missing |
|---|---|---|---|---|
| Core Concepts | 1 | 0 | 0% | ⚠️ 是 |
| Keywords | 2 | 2 | 100% | 否 |
| Definitions | 1 | 1 | 100% | 否 |
| Formulas | 1 | 1 | 100% | 否 |
| Important Points | 0 | 1 | 100% | 否（New 額外抓到 Legacy 沒有的） |

### 情境：sparse

| 分類 | Legacy Count | New Count | Coverage % | Missing |
|---|---|---|---|---|
| Core Concepts | 0 | 0 | 0%（雙方皆無） | 否 |
| Keywords | 1 | 1 | 100% | 否 |
| Definitions | 0 | 0 | 0%（雙方皆無） | 否 |
| Formulas | 0 | 0 | 0%（雙方皆無） | 否 |
| Important Points | 0 | 0 | 0%（雙方皆無） | 否 |

## Missing Analysis

**rich 情境發現一個真實落差：`coreConcepts` 分類，Legacy 有 1 筆、New 有 0 筆。**

根本原因：新的 `SummaryContentExtractor`（EO-AI-009）規則是「行長度 ≤ 6 字 → `keywords`，其餘 → `coreConcepts`」。測試教材裡「三角函數」（4 字）跟「斜邊」（2 字）都被歸類進 `keywords`（New 的 keywords=2，剛好對應這兩行），沒有任何行落入 `coreConcepts` 分類。而 Legacy 系統是依知識圖譜節點的**語意類型**（`concept` vs `keyword` node type，來自文件分類/解析階段的判斷）分類，把「三角函數」這種主題詞判斷為 `concept` 而非 `keyword`。

**這不是 Bug，是新舊兩套系統分類粒度不同造成的真實邊界案例**——New 的「短行＝關鍵字」規則過於單純，無法區分「單一主題概念」跟「關鍵字」的語意差異。

sparse 情境沒有發現落差（雙方都誠實回報空值，無資料可比對）。

## Difference Analysis

- **Keywords／Definitions／Formulas**：兩個情境下 New 與 Legacy 數量完全一致（rich：2/2、1/1、1/1），Coverage 100%。分類規則（含「：」為定義、含數學符號為公式）與 Legacy 的知識圖譜節點分類在這兩個測試案例中方向一致。
- **Important Points**：rich 情境 New 找到 1 筆（完整句子「本節說明三角函數的定義與應用。」），Legacy 為 0——這代表 Legacy 的知識圖譜在這個測試案例中沒有把這行歸類為 `knowledge_point`。New 額外覆蓋了這筆內容，非缺失。
- **Core Concepts**：如上，rich 情境有 1 筆落差，原因是分類粒度差異，非內容遺失（該內容存在於 New 的 `keywords` 分類中，只是分類名稱不同）。
- 兩套系統皆未做逐字比對（`SummaryComparator` 原始碼確認無任何 `.text` 字串相等判斷），符合「不得比較字串完全一致，採功能等價驗證」的規格要求。

## Compatibility Validation

直接呼叫真實、未修改的 `AHS.MaterialSummaryCard.hasSummaryContent()`：

| 情境 | Legacy → hasSummaryContent() | New → hasSummaryContent() |
|---|---|---|
| rich | **true**（PASS） | **true**（PASS） |
| sparse | **true**（PASS，因 keywords=1） | **true**（PASS，因 keywords=1） |

兩套系統在兩個測試情境下都符合 `MaterialSummaryCard` 目前的 UI 使用條件（至少一個分類非空）。

## Migration Readiness

**評估：功能等價性大致成立，但尚未達到可放心整批 Migration 的程度。**

- ✅ Keywords／Definitions／Formulas 分類：兩個測試情境下數量完全對齊，Coverage 100%。
- ✅ MaterialSummaryCard 相容性：兩套系統在兩個情境下皆 PASS。
- ⚠️ **Core Concepts 分類存在已知邊界案例**（短詞主題概念被規則誤分類進 keywords）——如果 Migration 直接切換，可能造成部分教材原本會顯示在「重點概念」區塊的內容，改顯示在「關鍵字」區塊，內容不會消失、但呈現位置會跟使用者原本習慣的不同。
- 建議：**在正式 Migration EO 之前，先用一個小型修正 EO 調整 `SummaryContentExtractor` 的 keyword/coreConcept 判斷規則**（例如改用詞性/語意線索而非單純長度），或在 Migration EO 中明確評估此差異是否可接受。
- 本次僅測試 2 個情境（rich／sparse），樣本數有限；正式 Migration 前建議擴大測試教材種類（更多學科、更長文本）以提高信心。

（本檔案僅建立驗證能力與本次真實測試結果，不代表 Migration 已核准或已執行。）
