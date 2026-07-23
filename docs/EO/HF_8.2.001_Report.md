# HF-8.2.001_Report — Material Center Hotfix Pack

## Status
COMPLETE — HF-001 與 HF-002 兩項 Bug 均先以 jsdom **實測重現**、定位 root cause 後修正，並固化為迴歸測試。全鏈 Zero Regression、LOCK Runtime byte-identical、UI 零變更。未 Git Push。

## HF-001｜首次進入教材列表空白
**Root Cause**：`MaterialCenter.create()` 的初始繪製只畫最近學習／最近檔案，**未呼叫 `renderGrid()` 與 `renderFolders()`**；網格以空陣列建立，須等第一個使用者事件才補畫 → 「第二次切換才正常」。
**修正**：初始繪製改用既有 `renderAll()`（同一條刷新路徑，不新增流程）；移除手寫 Empty State 區塊（`renderGrid()` 已正確處理，含變體選擇）。
**驗證**：修正前首次 0 張／切換後 2 張；修正後首次即 2 張且切換後不變。

## HF-002｜教材下載失效
**Root Cause**：`MaterialRuntime.file` 為活的 File 物件且**無法持久化**（原始碼註解已載明 "Not persisted"）。教材記錄跨頁存活、檔案本體不存在 → 自第二次瀏覽起下載必落入失敗分支，僅一行小字狀態 → 感受為「無反應」。
**修正**：Download Flow 內建立檔案位元組附掛存放（FileReader → data URL → PersistenceAdapter 獨立 key），下載時優先用活 File、否則還原為真實 Blob；刪除教材同步釋放位元組。**未修改 Material Runtime Schema、未新增 Runtime**。
**驗證**：端到端測試（真實上傳 → 跨頁 → 下載）Blob 長度與原檔完全一致、檔名正確、成功訊息；三種失敗情境各有精確誠實訊息（含 sessionStorage 配額不足）。

## 變更檔案
- js/components/MaterialCenter.js（唯一產品碼變更）
- tests/jsdom/BehaviorSuite.js（新增 [15]–[18]）
- tests/regression/MaterialDownloadFlow.js（新增，端到端 18 項）

## Acceptance
✅ Console Error = 0 ✅ 首次開啟 Material Center 立即顯示教材 ✅ 教材下載正常（跨頁後亦可） ✅ Zero Regression（124 + 18 + 全部 Runtime 套件） ✅ No UI Regression（CSS/HTML 逐位未變更） ✅ No Git Push
⏳ GitHub Pages PASS —— 需推送後依 Regression_QA_Report §GitHub Pages QA 檢核表實機驗證（本環境無 github.io 存取，已誠實揭露）

## Flag
sessionStorage 配額約 5 MB，超大檔案無法跨頁保存 —— 已以 oversize 標記與明確訊息誠實處理，不靜默失敗。若需支援大型檔案跨階段下載，須另開 EO 評估（indexedDB 目前為專案硬禁用項）。
