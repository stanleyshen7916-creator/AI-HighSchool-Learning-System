# HF-8.2.003_Report — Batch Image Upload Persistence

## Status
COMPLETE — 批次上傳圖片之預覽與下載修復。Root cause 經 jsdom 實測重現後定位並修正，六項要求逐項驗收，全鏈 Zero Regression，禁改清單全數 byte-identical。未 Git Push。

## Root Cause
1. **單一共用 storage key**（HF-8.2.001）：每次保存重寫整份集合 → 批次第 2 張起必然超出 sessionStorage 約 5 MB 配額 → 靜默降級 → 單張 PASS、批次失效。
2. **MaterialPreview 完全未接位元組還原**：僅用 `item.file`，跨頁必為 null → 批次圖片跨頁預覽必失敗。

## 修正
- 新增 `AHS.MaterialFileStore`（UI helper，非 Runtime）：**每個教材一個唯一 key `materialFile:<id>`** ＋極小索引；單檔失敗不波及他人，兩張圖片機制上不可能互相覆蓋。
- `MaterialPreview` 改由位元組還原（Blob 優先、data URL 備援；MIME 亦取自保存值）。
- 批次上傳逐張回收保存結果，狀態列具名告知未能保存者。
- 位元組損毀改回報「無法還原，請重新上傳」。
- 保留 HF-8.2.001 舊 key 讀取（向下相容）。

## 六項要求
✅ 1 單張 ✅ 2 批次 ✅ 3 每張皆有 Persistence Bytes ✅ 4 每張唯一 Storage Key／不互相覆蓋 ✅ 5 Download 全部正常 ⏳ 6 GitHub Pages（推送後實機驗證，全程用戶端同源零網路）

## 誠實邊界
sessionStorage 約 5 MB 為瀏覽器硬限制、base64 膨脹約 33%。小／中型圖片批次可完全保存；**大型圖片批次物理上無法全部存入**，修正後為「能存幾張存幾張、逐張誠實標記、彼此不連鎖失敗、具名告知」。若須支援大型圖片跨階段下載，須 PMO 裁示解禁 indexedDB（現為專案硬禁用項）。

## 變更檔案
js/ui/MaterialFileStore.js（新增）｜js/components/MaterialCenter.js｜js/ui/MaterialPreview.js｜materials.html（1 行）｜tests/regression/MaterialBatchPersistence.js（新增）｜tests/regression/MaterialDownloadFlow.js（更新至新機制）｜tests/jsdom/BehaviorSuite.js（新增 [19][20]，[17][18] 改用新 key）

## Acceptance
✅ Console Error = 0 ✅ Zero Regression（129 + 27 + 19 + 全部 Runtime 套件） ✅ 禁改 Runtime byte-identical ✅ No UI Regression（CSS 零變更） ✅ No Git Push
