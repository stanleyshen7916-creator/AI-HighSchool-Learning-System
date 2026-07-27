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

> **更新（EO-AI-010A Revision-1）**：上面「Core Concepts 已知邊界案例」已修正——見下方「HOTFIX Comparison」，目前 2 個測試情境 Core Concepts Coverage 已達 100%，其餘分類 Coverage 未降低。

---

## HOTFIX Comparison（EO-AI-010A Revision-1）

### 一個重要的過程記錄：第一版假設是錯的

EO-AI-010A 原始 Background 假設「三角函數／一次函數／氧化還原／細胞分裂這類短詞應該被歸類為 Core Concept」。**用真實 Legacy 資料驗證後發現這個假設不成立**——直接印出 Legacy 對 rich 教材的實際分類：

```
Legacy 真實輸出：
coreConcepts: ["本節說明三角函數的定義與應用。"]   ← 是一句完整說明句
keywords:     ["三角函數", "斜邊"]                ← 短詞本來就被 Legacy 分類為 Keywords
```

真正的差異：**不是「短詞該歸類成 Core Concept」，而是「具概念說明性的完整句該歸類成 Core Concept，而非 Important Point」**。已在套用第一版錯誤假設的修正前先發現、暫停回報，PMO 確認後發出 Revision-1 修正方向。

### Before（EO-AI-009 原規則）

| 分類 | Legacy Count | New Count | Coverage % |
|---|---|---|---|
| Core Concepts | 1 | 0 | 0% |
| Keywords | 2 | 2 | 100% |
| Definitions | 1 | 1 | 100% |
| Formulas | 1 | 1 | 100% |
| Important Points | 0 | 1 | 100%（New 多找到一筆，Legacy 無） |

### After（EO-AI-010A Revision-1：新增「說明句 → Core Concept」規則，Keyword 長度規則完全不變）

| 分類 | Legacy Count | New Count | Coverage % |
|---|---|---|---|
| Core Concepts | 1 | 1 | **100%**（0% → 100%） |
| Keywords | 2 | 2 | 100%（不變，未降低） |
| Definitions | 1 | 1 | 100%（不變） |
| Formulas | 1 | 1 | 100%（不變） |
| Important Points | 0 | 0 | 0%（雙方一致，New 不再誤放句子進這裡） |

### Coverage Difference

- **Core Concepts：0% → 100%**（真正修正——New 現在把「本節說明三角函數的定義與應用。」正確歸類為 Core Concept，逐字與 Legacy 分類的內容一致）
- **Keywords：100% → 100%**（未下降，符合規格要求）
- **Definitions／Formulas：100% → 100%**（未受影響）
- **Important Points：兩者皆 0**（New 原本額外多出的那 1 筆其實就是被誤放的說明句，修正後正確歸位到 Core Concepts，不算「消失」）

sparse 情境（單行「細胞」）修正前後數字完全相同（皆為 keywords 1/1，其餘 0/0），未受影響。

### Remaining Gap

**目前 2 個測試情境下無殘留落差**——rich／sparse 情境的所有 5 個分類 Coverage 皆為 100% 或雙方一致的 0%。

樣本數仍然有限（僅 2 個情境），建議正式 Migration 前用更多學科/更長文本擴大測試覆蓋，確認這個「說明句 pattern」規則對其他措辭方式（例如「本章介紹…」「…主要探討…」等）也同樣適用，而不僅限於本次測試句型。

（本次 HOTFIX 未改變 Keyword 分類規則，也未進行 Legacy Migration。）

---

## Pattern Expansion（EO-AI-010B）

上一節結尾建議的「用更多學科擴大測試覆蓋」在 Sprint AI-013 Part B（Equivalence Validation）真正執行時發生了：用真實 jsdom 載入 `materials.html`，對 `js/data/MockData.js` 全部 8 筆真實 Repository 教材（非合成測試字串）跑 Compare Mode，發現：

```
Aggregate across all 8 Repository MockData materials:
  coreConcepts   totalLegacy=8  totalNew=2   materials-with-degradation=6
```

**6/8（75%）真實教材的 Core Concept 遺失**（誤分類為 Important Point）。逐一檢視 8 筆真實內容的開頭句型：

| 學科 | 開頭句型 |
|---|---|
| math | 本教材**介紹**二次函數的圖形特徵… |
| english | 本教材**整理**閱讀理解常見題型… |
| physics | 本教材**彙整**牛頓三大運動定律… |
| chemistry | 本教材**說明**化學反應速率… |
| biology | 本教材**介紹**動植物細胞… |
| history | 本教材**整理**中國古代重要朝代… |
| geography | 本教材**說明**臺灣主要地形分布… |
| civics | 本教材**介紹**憲法的基本原則… |

全部 8 筆真實教材皆以「**本教材**」開頭（而非 EO-AI-010A 涵蓋的「本節/本章/本單元/本課」），且使用「**整理**」「**彙整**」兩個 EO-AI-010A 尚未涵蓋的動詞。其中 english（含「包含」）與 physics（含「的定義」）恰好因句子後段其他觸發詞而僥倖符合，其餘 6 筆完全沒有匹配任何既有規則。

### 修正（EO-AI-010B，僅 Pattern Expansion）

`CONCEPT_SENTENCE_PATTERN` 主詞新增「本教材」、動詞新增「整理／彙整」：

```
Before: /^(本節|本章|本單元|本課)(說明|介紹)|的(定義|概念)|主要探討|可分為|包含/
After:  /^(本節|本章|本單元|本課|本教材)(說明|介紹|整理|彙整)|的(定義|概念)|主要探討|可分為|包含/
```

僅新增選項，既有選項（本節/本章/本單元/本課、說明/介紹、的定義/的概念/主要探討/可分為/包含）逐字未動，Keyword 長度規則未受影響。

### After（EO-AI-010B，真實 8 筆 Repository MockData）

| 學科 | Legacy Count | New Count | Coverage % |
|---|---|---|---|
| math | 1 | 1 | 100% |
| english | 1 | 1 | 100% |
| physics | 1 | 1 | 100% |
| chemistry | 1 | 1 | 100% |
| biology | 1 | 1 | 100% |
| history | 1 | 1 | 100% |
| geography | 1 | 1 | 100% |
| civics | 1 | 1 | 100% |

**全部 8 筆真實教材 Core Concepts Coverage 100%**（0% → 100% 的有 6 筆：math／chemistry／biology／history／geography／civics；english／physics 原本僥倖符合，維持 100%）。

### Backward Compatibility 確認

- EO-AI-010A 原始測試句「本節說明三角函數的定義與應用。」修正後仍正確分類為 coreConcepts（逐字比對一致）。
- 短詞 Keyword 分類（三角函數／斜邊等）完全未受影響，仍分類為 keywords。

### Remaining Gap

目前 8 筆真實 Repository MockData 全數 Coverage 100%，無殘留落差。未來若 Repository 新增使用其他措辭風格的真實教材，建議比照本次流程用 Compare Mode 對照真實資料驗證，而非僅用單一手寫測試句。
