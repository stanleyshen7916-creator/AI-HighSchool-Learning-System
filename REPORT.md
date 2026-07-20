# REPORT — HOTFIX-001 Runtime Persistence & Home Sync

## Status
COMPLETE — Architecture Evolution v2.0（PMO Decision 025）已實作並
驗證，提交審核。

## PMO Decision 025 Applied
撤銷 Sprint 1 Baseline 的 Memory-Only 限制，建立 sessionStorage-based
Runtime Persistence Layer（UI → Runtime → Persistence Adapter →
sessionStorage）。詳見 docs/qa/HOTFIX-001_Architecture_Update.md。

## New Files
- js/core/PersistenceAdapter.js（唯一直接操作 sessionStorage 的模組）
- docs/qa/HOTFIX-001_Runtime_Persistence_QA.md
- docs/qa/HOTFIX-001_Architecture_Update.md

## Modified Files
- js/runtime/MaterialRuntime.js（新增 hydrate/persist，8 個 mutating
  方法皆已接上 persist()；Public API／Schema 未變）
- js/runtime/KnowledgeRuntime.js／SummaryRuntime.js／
  LearningQuestionRuntime.js（同上模式：hydrate on load + persist on
  add()/reset()；Public API／Schema 未變）
- js/pages/app.js（Fix-002：新增 3 個 buildXModel() 函式，讀取真實
  Runtime 資料傳入既有元件，元件本身未修改）
- js/components/HomeRecentMaterials.js（新增誠實的 Summary 徽章，僅
  在真實 SummaryRuntime 有對應記錄時顯示）
- css/pages/home.css（新增徽章樣式）
- index.html／materials.html／summary.html／quiz.html（新增
  PersistenceAdapter.js 及既有 Runtime 之 script 標籤）

## Unmodified（已逐一確認）
四個 Core Engine 之 Public API／Schema；Learning Pipeline（零程式碼
修改，因完全透過 Runtime 既有方法運作）；既有 QuestionRuntime.js
（Sprint 4）；QuizCenter.js；SummaryCenter.js；Wrong Book／Dashboard／
AI Tutor／Review Center 全部頁面元件；Repository Structure（僅新增
一個檔案於既有 js/core/，未新增資料夾）。

## Fix-001（Runtime Persistence）— 已解決
以真實檔案上傳互動 + 模擬瀏覽器分頁間 sessionStorage 共用（誠實記錄
測試方法：jsdom 不會自動跨執行個體共用 storage，故於頁面 script
執行前明確轉移，如實模擬真實瀏覽器分頁行為）驗證：上傳教材 → 離開
`materials.html` → 重新進入：四個 Runtime 資料皆正確還原，UI 正確
渲染，Console Error = 0。

## Fix-002（Home Sync）— 已解決
`index.html` 於初始化時透過既有 `AHS.MaterialRuntime.list()`／
`AHS.SummaryRuntime.list()`（唯讀）建立真實 model，傳入既有
HomeRecentMaterials／StudyStats／ContinueLearning 元件（三者皆已有
Mock Fallback 機制，元件本身未修改）。已驗證：上傳前顯示既有 Mock
Seed Data；上傳後正確改為顯示真實「最近教材」／「已生成學習總結」
徽章／「學習統計」（誠實反映真實資料，含尚無真實學習時數時顯示 0，
不虛構）。僅更新需要的 Component，未重新整理整個 App。

## Fix-003（Beta Mode Mock Data）— 確認無需變動
已確認全部 Runtime（含新增持久化的四個）起始狀態仍為空，本次持久化
實作未改變此行為。未新增 Developer Mode（依 PMO 指示不需要）。

## Developer QA
詳見 docs/qa/HOTFIX-001_Runtime_Persistence_QA.md。摘要：第一次開啟
全空、上傳教材、切換頁面、重新返回 Material、首頁立即更新、Summary
更新、Practice Mode 更新，皆 PASS；Console Error = 0。

## Regression QA
diff -rq 比對前次交付（EO-S6-007）：確認變動範圍精確符合本次授權
（見上方 Modified Files），Core Engine／Learning Pipeline／既有
QuestionRuntime／QuizCenter／SummaryCenter／其他 Do NOT Modify 頁面
元件逐一 diff 確認未變動。9 個頁面重新載入測試：0 錯誤。

## Known Issues
1. `file`（上傳檔案物件參考）無法跨頁保存，還原後為 null（符合原始
   碼既有註明，非本次引入的限制）
2. 「Recent Learning」目前仍顯示 Mock，因無流程呼叫 startLearning()
3. 測試過程中一項測試方法造成的假象已排除並記錄（見 QA 文件）

## Next
提交 GPT PMO 審核 Architecture Evolution v2.0 之 Compatibility Review
與 Regression QA。
