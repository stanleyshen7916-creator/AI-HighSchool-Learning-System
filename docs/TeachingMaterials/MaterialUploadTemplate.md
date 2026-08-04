# 教材上傳測試 — 資料填寫範本（Material Upload Test Intake Template）

> 用途：本檔案是給**下一個對話視窗**用來啟動一次真實教材上傳測試的填寫範本。
> 請複製本檔案、依下列欄位實際填入一份教材的分類與內容，再把填好的檔案貼到新的對話中，
> 請 Claude 依 `docs/TeachingMaterials/README.md` 既有、已鎖定（`Status: LOCKED`）的
> Teaching Material Package Standard 流程執行完整上傳（New/Existing/Related 判斷 → 建立
> Package → QA Checklist → RepositoryManager → ImportManager → `npm run verify`/`npm test`
> → commit/push）。本範本不建立新的資料格式、不繞過既有 QA 機制，所有分類選項都直接取自
> 平台目前真實的功能選單（見各欄位下方引用的來源檔案），不自創分類。

## 判斷提醒（Flagged, not silently decided）

- **「學期」目前不是平台鎖定的欄位**：`docs/TeachingMaterials/schema/Metadata.schema.json`
  的必填 12 個欄位（`additionalProperties: false`）與 `js/data/AppConfig.js`／
  `js/runtime/MaterialRuntime.js` 都**沒有** `semester` 欄位，只有 `grade`
  （高一／高二／高三）。本範本先以「不修改 LOCKED schema」的保守做法，把學期資訊寫進
  `chapter`／`unit` 的文字描述與 `material.md` 內文（例如「上學期・第一次段考」），不塞進
  任何結構化欄位。若之後要讓「學期」變成可篩選、可查詢的獨立欄位，需要先經 Project Owner
  對 schema 的簽核，再修改 `Metadata.schema.json` + `ValidateMaterial.js` + 對應 UI
  篩選器 — 這不在本次上傳測試範圍內，此處只把這個決定明確攤開，不自行擴充 LOCKED schema。
- 平台目前**同時存在兩套**材料分類（教材中心手動上傳 vs. 教材庫 Package 流程），彼此不是
  同一份資料、沒有完全對應的映射（見下方「材料分類」的對照表與缺口說明）。本範本兩套都請
  填，確保無論走哪一條路徑都能對得上。

---

## 1. 分類資訊（簡易介面 — 請直接勾選，不要自創新分類）

### 學期（Semester）— 描述性欄位，非結構化欄位，見上方判斷提醒

- [ ] 上學期
- [ ] 下學期
- 第幾次段考／測驗（若有）：______________（會寫入「章節/單元」欄位文字中）

### 年級（Grade）— 對應 `js/data/AppConfig.js` `materials.grades` / Package `metadata.json.grade`

- [ ] 高一　　- [ ] 高二　　- [ ] 高三

### 科目（Subject）— 對應 `js/core/Icons.js` `AHS.Subjects`（平台目前僅支援這 9 科）

- [ ] 國文　- [ ] 英文　- [ ] 數學　- [ ] 物理　- [ ] 化學
- [ ] 生物　- [ ] 歷史　- [ ] 地理　- [ ] 公民

### 材料分類（Material Category）— 兩套並存的既有平台分類，請都對照勾選

**(A) 教材中心手動上傳**（`js/ui/MaterialUploadDialog.js` / `AppConfig.materials.categories`，中文，直接寫入 `MaterialRuntime`）

- [ ] 課本　- [ ] 講義　- [ ] 考卷　- [ ] 筆記　- [ ] 補充資料　- [ ] 影片　- [ ] 其他

**(B) 教材庫 Package Standard**（`docs/TeachingMaterials/schema/Metadata.schema.json` 的
`materialType`，英文代碼，走完整 Package → QA → Import 流程）

- [ ] `TEXTBOOK`（課本）
- [ ] `HANDOUT`（講義）
- [ ] `EXAM`（考卷 — **會觸發 Original Question Rule**：所有題目必須 100% 保留原文、
      `questionSource` 全部為 `ORIGINAL`，不得摘要／改寫／AI 優化）
- [ ] `HOMEWORK`（作業）
- [ ] `PPT`
- [ ] `REFERENCE`（參考資料）

**(A) → (B) 對照表**（誠實列出，不存在的對應不硬塞）：

| (A) 教材中心分類 | (B) Package materialType | 說明 |
|---|---|---|
| 課本 | `TEXTBOOK` | 直接對應 |
| 講義 | `HANDOUT` | 直接對應 |
| 考卷 | `EXAM` | 直接對應，會觸發 Original Question Rule |
| （無直接對應） | `HOMEWORK` | (A) 沒有「作業」選項，接近則歸類「補充資料」或「其他」 |
| 補充資料 | `REFERENCE` | 語意最接近，非完全一致 |
| 筆記 | 無對應 | Package Standard 沒有筆記類型，建議走 (A) 教材中心手動上傳，不建立 Package |
| 影片 | 無對應 | 同上，Package Standard 目前只處理可分析的文件/圖檔（PDF/PPT/DOCX/JPG/PNG），不含影片 |
| 其他 | 無對應 | 需人工判斷最接近的 `materialType`，或走 (A) |

### 章節／單元（Chapter / Unit）— 自由文字，對應 `metadata.json` 的 `chapter`/`unit`

______________________________________________________

### 出版社／來源（Publisher / Source）— 自由文字，對應 `metadata.json` 的 `publisher`/`source`

- 出版社：______________（例如：南一版／翰林版／三民版，未知留白，不得猜測）
- 來源：______________（例如：教科書／講義／考卷／教師補充教材）

### 難度（Difficulty）— 對應平台既有詞彙（`AppConfig.quiz.difficulties`）

- [ ] 易　　- [ ] 中等　　- [ ] 難

---

## 2. 教材內容（Content）— 對應 Summary + Question Bank

### 核心概念（核心概念，陣列，每行一項）

- ______________________________________________________

### 定義（定義，陣列）

- ______________________________________________________

### 重點整理（重點整理，陣列）

- ______________________________________________________

### 易錯觀念（易錯觀念，陣列）

- ______________________________________________________

### 題目（Question Bank）— 每題請標明題型／題號／正確答案／來源

| 題號 | 題型（單選/是非/填充/計算/申論） | 題幹 | 選項（單選題用） | 正確答案 | 題目來源 `questionSource` |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |

**`questionSource` 只能是下列三者之一，且必須與 `origin` 配對一致**（`ValidateMaterial.js`
會強制檢查）：

| `questionSource` | `origin` | 適用情境 |
|---|---|---|
| `ORIGINAL` | `Uploaded Material` | 題目逐字照抄自你上傳的原始檔案，不得改寫/簡化 |
| `AI_GENERATED` | `AI` | Claude 依教材內容延伸出的題目 |
| `TEACHER_CREATED` | `Teacher` | 教師自行出的題目，由你提供 |

- 若題目來源是 `ORIGINAL`，還需誠實填 `ocrConfidence`（0–1）與 `needsReview`
  （`ocrConfidence < 0.90` 時必須是 `true`）— 這兩個欄位在 `AI_GENERATED`/`TEACHER_CREATED`
  題目上必須**不存在**。
- 若上面「材料分類」選了 `EXAM`，**所有**題目都必須是 `ORIGINAL`。

---

## 3. 原始檔案（Source Files）

請附上原始檔案（PDF/PPT/DOCX/JPG/PNG 或掃描檔），**保持原檔名、不得重新壓縮或修改** —
會被放進 Package 的 `source/` 資料夾，作為之後人工／OCR 覆核的依據。

- 檔案 1：______________
- 檔案 2：______________

---

## 4. QA 機制（與平台既有機制完全相同，缺一不可）

依 `docs/TeachingMaterials/README.md` 既有的 QA Checklist 逐項執行，這是本平台唯一的教材
上傳 QA 機制，不會為了這次測試另外簡化：

- [ ] Metadata 完整（含 `materialType`；未知值一律 `null`/`[]`，不得猜測）
- [ ] `manifest.json` 撰寫（`status` 誠實反映是否有題目待審：`draft`/`pending_review`/`complete`）
- [ ] `source/` 放入未經修改的原始檔
- [ ] Summary 完整
- [ ] Question Bank 建立（`questionSource`/`origin` 配對正確；`EXAM` 材料所有題目為 `ORIGINAL`）
- [ ] Related Materials 檢查（找到真正重疊才連結，不得重複建立教材 `materialId`）
- [ ] `node docs/TeachingMaterials/scripts/ValidateMaterial.js <materialId>` — PASS
- [ ] `node docs/TeachingMaterials/scripts/RepositoryManager.js`（`prepare()`，推進到
      `READY_FOR_IMPORT`，衍生 `knowledge.json`/`report.md`）
- [ ] `node docs/TeachingMaterials/scripts/ImportManager.js`（正式 Import，含
      Duplicate Detection，推進到 `IMPORTED`，重新產生 `js/data/TeachingMaterialData.js`/
      `index.json`；任何一步失敗會自動 Rollback 並寫入 `import-log.json`）
- [ ] `npm run verify` — PASS（0 broken paths / 0 legacy references / 0 forbidden patterns）
- [ ] `npm test` — PASS（含 `tests/regression/MaterialPipelineRegression.js`）
- [ ] （建議）`npm run test:e2e`（Playwright Smoke，至少確認 `materials.html`/`quiz.html`
      開啟正常、無 console error）
- [ ] Git commit：`feat(material): import <materialId>`
- [ ] Git push

## 5. 完成後如何確認資料已經可在平台使用

- 開啟 `materials.html`／`quiz.html`，確認新教材卡片、Summary、Quiz 均可見（真實 Runtime
  資料，不是 Mock）
- 確認 `AHS.StatisticsRuntime.materialCompletion(materialId)` 有回傳正確的三階段完成度
  （Sprint AI-117 起，教材完成度顯示的唯一來源）
- 確認 `docs/TeachingMaterials/index.json` 已新增這個 `materialId` 的真實條目
- 確認 `import-log.json` 這次匯入紀錄是 `result: "SUCCESS"`

---

### 如何使用本範本

1. 複製本檔案內容（或直接使用這個檔案路徑）。
2. 依上方各節，填入一份**真實**教材的分類勾選與內容（不得用虛構/占位內容 — 本平台
   `CLAUDE.md` 明文禁止 Mock/Demo/Placeholder 教材內容）。
3. 附上原始檔案。
4. 在新的對話視窗中提供填好的範本 + 原始檔案，請 Claude 依
   `docs/TeachingMaterials/README.md` 的 Workflow 執行完整上傳與 QA。
