# Hotfix_Report — HF-8.2.003（Batch Image Upload Persistence）

## Root Cause（實測重現，非推測）

HF-8.2.001 的位元組存放把**所有檔案放在同一個 storage key**（`materialFileStore`）。每次保存都要重寫整份集合，因此批次上傳時：

1. 第 1 張寫入 → 成功
2. 第 2 張寫入時，值必須同時容納「第 1 張 + 第 2 張」→ 超出 sessionStorage 約 5 MB 配額 → `setItem` 拋錯 → PersistenceAdapter 回 false → 靜默降級為 oversize
3. 第 3 張同理失敗

**單張 PASS、批次失效** —— 與回報症狀完全一致。

**實測（3 張各 2 MB 圖片，模擬 5 MB 配額，修正前）**：
```
rt_1  bytes len 2796226
rt_2  OVERSIZE（無位元組）
rt_3  OVERSIZE（無位元組）
```

第二個獨立缺陷：`MaterialPreview` 只使用 `item.file`（跨頁必為 null）—— HF-8.2.001 只修了下載，**預覽完全未接位元組還原**，故批次上傳的圖片跨頁後預覽必失敗。

---

## 修正

### 1. 每個檔案一個唯一 Storage Key（要求 4）
新增 `AHS.MaterialFileStore`（`js/ui/MaterialFileStore.js`，UI 層 helper，非 Runtime）：

| 用途 | Key |
|---|---|
| 位元組 | `materialFile:<materialId>` —— **每張獨立、永不共用** |
| 索引 | `materialFileIndex` —— 僅存 id／檔名／MIME／狀態（極小） |

每次寫入只碰自己的 key：**兩張圖片在機制上不可能互相覆蓋**，且單張的配額失敗**不影響任何其他檔案**（修正前會連鎖失敗）。

### 2. 預覽改由位元組還原（要求 1、2）
`MaterialPreview` 改為：live File →（無則）`MaterialFileStore.blobFor()` → ObjectURL；若無 `createObjectURL` 則直接以 data URL 作為 `src`。MIME 判定亦讀取保存的 type，故無副檔名的圖片跨頁後仍能正確判定為 image。ObjectURL 才會 revoke，data URL 不會（避免誤失效）。

### 3. 逐張誠實回報（要求 3、5）
批次上傳每張的保存結果individually 回收，狀態列**具名列出**哪些檔案未能保存：
```
已新增 3 個教材；其中 2 個檔案超出瀏覽器暫存空間（大圖2.png、大圖3.png），僅能於本次瀏覽階段預覽與下載。
```
（此訊息會在 Learning Pipeline 的階段訊息鏈結束後重申一次，因兩者共用同一狀態列。權威回饋仍在使用當下：下載／預覽會針對該檔案給出精確訊息。）

### 4. 損毀位元組不再誤報
位元組存在但無法解碼時回報「檔案內容已無法還原，請重新上傳」，而非誤稱「沒有原始檔案」。

### 5. 向下相容
HF-8.2.001 的舊單一 key 仍會被讀取（data URL 直接作為 href），使既有瀏覽階段不致遺失位元組。

---

## 六項要求驗收（實測）

| 要求 | 結果 |
|---|---|
| 1. 單張 PASS | ✅ 跨頁下載檔名與位元組長度正確 |
| 2. 批次 PASS | ✅ 三張全部保存、跨頁預覽 3/3、跨頁下載 3/3 |
| 3. 每張皆有 Persistence Bytes | ✅ `stored=3, oversize=0, failed=0`；各張 Blob 長度 = 原檔長度且互異 |
| 4. 每張唯一 Storage Key、不互相覆蓋 | ✅ `materialFile:rt_1` / `rt_2` / `rt_3`，key 唯一且內容獨立 |
| 5. Download 全部正常 | ✅ 三張檔名逐張正確不重複、Blob 為真實位元組 |
| 6. GitHub Pages PASS | 全程用戶端、同源、零網路請求（VerifyForbiddenPatterns 通過）→ 靜態託管行為與本機一致；**實機驗證需推送後執行**（本環境無 github.io 存取） |

---

## 誠實邊界（請 PMO 知悉）

sessionStorage 配額（約 5 MB）是**瀏覽器硬限制**，且 base64 會使位元組膨脹約 33%。因此：

- 小型／中型圖片批次：**全部保存，六項要求完全達成**
- 大型圖片批次（例如 3 張各 2 MB）：**物理上無法全部存入**。修正後行為為「能存幾張就存幾張、逐張誠實標記、彼此不再連鎖失敗」，並具名告知使用者哪些檔案僅限本次階段 —— 而非修正前的靜默失敗。

若需支援大型圖片批次的跨階段下載，須 PMO 裁示解禁 **indexedDB**（目前為專案硬禁用項，VerifyForbiddenPatterns 會攔阻）。這是唯一能真正突破容量限制的途徑。

---

## 變更足跡
- `js/ui/MaterialFileStore.js`（新增，UI helper）
- `js/components/MaterialCenter.js`（改用共用存放、逐張回報、損毀處理）
- `js/ui/MaterialPreview.js`（位元組還原）
- `materials.html`（1 行 script 接線）
- 測試 3 檔

**未修改**：MaterialRuntime、MaterialTextProvider、AnalysisRuntime、KnowledgeGraphRuntime、KnowledgeExtractionRuntime、FolderRuntime、DocumentClassifierRuntime、KnowledgePipeline、ParserAdapterRegistry、SummaryRuntime、PersistenceAdapter —— **全數逐位一致**。CSS 零變更。
