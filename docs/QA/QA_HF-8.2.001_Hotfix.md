# Hotfix_Report — HF-8.2.001（Material Center Hotfix Pack）

## HF-001｜首次進入 Material Center 教材列表空白

### Root Cause（已實測重現，非推測）
`js/components/MaterialCenter.js` 之 `create()`：
1. 第 297 行以**空陣列**建立網格：`var theGrid = AHS.MaterialGrid.create([], status, {})`
2. 第 859 行「Initial paint」區塊**只呼叫** `renderRecentLearning()` 與 `renderRecentFiles()` —— **從未呼叫 `renderGrid()` 與 `renderFolders()`**

因此網格維持空白，直到使用者觸發第一個事件（科目分頁／篩選／搜尋／上傳）才由該事件的 `renderGrid()` 補畫 —— 正是回報的「第二次切換才正常顯示」。

**jsdom 重現（修正前）**：`MaterialRuntime.list().length = 2`、`.mat-card = 0`；點一次科目分頁後 `.mat-card = 2`。

### 修正
初始繪製改為呼叫既有的 `renderAll()`（網格 + 最近學習 + 最近檔案 + 資料夾）—— 與所有變更後刷新走同一條路徑，不新增 render 流程。同時移除原本手寫的 Empty State 區塊：`renderGrid()` 本身已完整處理空狀態（Runtime 為空時用 `"empty"` 變體，篩選／搜尋／收藏無結果時用對應變體），手寫版本只會產生相同或較不精確的結果。

**時序安全性**：`main`（817 行）在初始繪製（859 行）之前組成，`theGrid` 已有 parentNode，`renderGrid()` 的 `replaceChild` 安全。

**修正後**：首次載入即 2 張卡片；再切換分頁張數不變（證明初始化完整，非靠事件補救）。

---

## HF-002｜教材下載失效

### Root Cause（已實測重現）
`MaterialRuntime` 的 `file` 欄位存放**活的 File 物件**，其原始碼註解已明載 **"Not persisted"** —— File 無法 JSON 序列化。教材**記錄**經 PersistenceAdapter 存活於 sessionStorage，**檔案本體不會**。

因此自第二次頁面瀏覽起，`doDownload()` 必定落入 `!item.file` 分支，唯一回饋是一行小字狀態 → 使用者感受為「點擊下載無反應」。

**jsdom 重現（修正前）**：教材存在、卡片正常，點擊下載 → `此教材沒有可下載的原始檔案`。

### 修正（不動 Material Runtime Schema、不新增 Runtime）
Download Flow 內建立**檔案位元組附掛存放**：
- 上傳時（單檔與批次兩條路徑）以 `FileReader` 讀取**真實位元組**為 data URL，經 `AHS.PersistenceAdapter` 存於獨立 key `materialFileStore`（與所有 Runtime 相同的 sessionStorage 機制；**未使用** localStorage／indexedDB／網路）
- 下載時優先使用活的 File（同階段上傳），否則將保存的位元組還原為真實 **Blob**（`atob` + `Uint8Array`）
- 刪除教材時同步釋放其位元組，避免暫存空間累積

### 完整驗證（EO 指定五項）
| 項目 | 結果 |
|---|---|
| **Download Event** | 錨點 `click()` 實際觸發，取得 `blob:` URL ✓ |
| **File Metadata** | `a.download` 為原始 `fileName`（`上課講義.pdf`），非 download.bin ✓ |
| **URL** | 優先 ObjectURL；無 `createObjectURL` 時直接以 data URL 為 href（兩者皆同源、免伺服器） ✓ |
| **Blob/ObjectURL** | Blob 由真實位元組重建，**長度與原檔完全一致**（測試以 stub 攔截實際傳入的 Blob 驗證 size） ✓；`revokeObjectURL` 僅對 ObjectURL 執行且維持延遲（data URL 不得 revoke） ✓ |
| **GitHub Pages Compatibility** | 全程用戶端、同源、零網路請求、零伺服器依賴 —— 靜態託管行為與本機一致 ✓（實機驗證需推送後執行，見下） |

### 誠實邊界
sessionStorage 有配額（約 5 MB）。檔案過大無法保存時**不靜默失敗**：記錄 oversize 標記，下載訊息明確說明「僅能於上傳的同一次瀏覽階段下載」。三種失敗情境各有精確訊息（無檔案來源／檔案過大／位元組無法還原）。

---

## 變更足跡
僅 `js/components/MaterialCenter.js`（Scope 明文允許 Material Center / Page Lifecycle / Download Flow / UI Event）＋測試。
**未新增 Runtime、未修改任何 LOCK Runtime、未修改 Material Runtime Schema、未修改任何 UI（CSS/HTML 逐位未變更）、未新增功能。**
