# EO-S6.8-002 · AI Question Guide + PAT Critical Issues — QA Report

- 日期：2026-07-22
- 執行：Claude（Frontend）
- 依據：EO-S6.8-002（PMO Ruling：Task 003 改為誠實 Pending State，不得虛構五段式內容、不得修改 Parser）

---

## 修改檔案（diff 摘要）

| 檔案 | 變更 | 說明 |
|---|---|---|
| `js/components/QuestionGuide.js` | **新增**（+213） | Task 001：AI Question Guide 元件 |
| `js/components/QuizCenter.js` | +52 / −1 | Task 001 Guide 整合；Task 004 `[Stub]` 過濾 |
| `js/components/SummaryCenter.js` | +15 / −5 | Task 003 Pending State 三句固定文案 |
| `quiz.html` | +2 | 新增 `SummaryRuntime.js`、`QuestionGuide.js` 有序 script |
| `css/pages/quiz.css` | +31 | `.qguide__*` BEM 樣式（tokens only） |

未修改（Baseline Protected，diff 確認 0 變更）：Runtime Architecture、MaterialParser.js、KnowledgeBuilder.js、Parser Interface、QuestionRuntime.js、QuestionBank.js、ExamRuntime.js、QuestionGenerator.js、LearningQuestionRuntime.js、SummaryRuntime.js、MaterialRuntime.js、PersistenceAdapter.js。

---

## Task 001 — AI Question Guide

流程：Summary Detail「開始 AI 練習」→ `quiz.html?mode=practice&materialId=...` → **巧巧老師出題引導** → 「開始練習」→ Practice 列表。

六項內容全部由真實資料推導（SummaryRuntime 唯讀 + 已過濾之 LearningQuestionRuntime 記錄），無任何虛構：

| 欄位 | 資料來源 | 無資料時 |
|---|---|---|
| 出題引導 | 真實題數 + Summary title | 誠實「教材仍在分析中」 |
| 建議閱讀方式 | Summary 五段中「實際有內容」的段落順序 | 分析中訊息 |
| 建議題型 | 真實題目 `questionType` 統計 | 「暫無題型建議」 |
| 建議難度 | 真實題目 `difficulty` 分佈 | 「暫無難度建議」 |
| 作答提醒 | Summary `pitfalls` 真實數量 | 誠實訊息 |
| 學習建議 | Summary `reviewSuggestions` passthrough | 分析中訊息 |

無 materialId 的一般進入（模式 Tab）完全不經過 Guide — 純 additive，Exam Mode 保持現況。返回學習總結使用真實 `<a href>`。

## Task 002 — 教材下載（PAT Critical）

Regression 確認 Sprint 6.7 Hotfix 修正全數保留：延遲 `revokeObjectURL`（防 silent cancel）、無檔案時明確狀態訊息（永不 Silent Fail）、原始 `fileName` 逐字保留。下載機制為格式無關之 Blob URL — JPG/PNG/PDF/DOCX/PPTX/XLSX/MP4/MP3/ZIP/TXT 一律同一路徑；可預覽格式（PDF/圖片/影音/TXT）走 inline 預覽 + 明確下載鈕，不可預覽格式（DOCX/PPTX/XLSX/ZIP）走資訊頁 + 明確下載鈕。本 Task 無需新增程式碼。

## Task 003 — AI Summary Pending State（PMO Ruling）

Parser 未完成解析（五段全空）時固定顯示三句：

1. AI 正在分析教材
2. 尚未取得可整理內容
3. 完成分析後將自動更新

同步更新巧巧老師導讀之無內容分支與提醒事項分支為同一語系文案。禁用文案（「尚未包含具體內容」「尚未有具體…」）已全數移除（jsdom 全文掃描確認）。**自動更新保證**：渲染邏輯以 `anyContent` 分支判斷 — Parser 於未來 EO 產出真實內容後，Summary Runtime 五段陣列有值即自動切換為真實五段式呈現，Pending 區塊自動消失，無需再改任何 UI 程式（測試 [5] 以真實內容 record 驗證通過）。未產生任何虛構之核心概念/重要定義/易錯重點/必背內容/複習建議。

## Task 004 — Quiz Center Practice Mode Audit（PAT Critical）

**發現之 Critical Bug**：`QuestionGenerator` Mode B 產生之候選題 `question`/`answer` 為 `[Stub] …` 佔位字串，但十項完整性檢核全數通過（欄位皆存在），故被 `LearningQuestionRuntime` 儲存並顯示於 Practice Mode — 即本 Task 禁止之 Placeholder 狀態。

**修正**（UI 層，Runtime 零變更）：`QuizCenter.js` 新增 `isRealLearningQuestion()`，Practice 列表與 Question Guide 統計一律排除 `[Stub]` 開頭之題目/答案；無真實題目時顯示既有 mandated Empty State。真實 AI 內容未來取代 Stub 後，同批記錄零修改即自動浮現。Exam Mode 完全未動（保持現況）。

## Task 005 — PAT QA 結果

**jsdom 行為測試：61 PASS / 0 FAIL**（`getComputedStyle` 等 jsdom 可驗證範圍）

- [1] Stub-only 資料：Guide 為入口、五列齊全、統計不含 Stub、開始練習 → Empty State、`[Stub]` 全頁零出現、Console Error 0
- [2] 真實資料：閱讀順序推導、題型/難度僅計真實題、易錯提醒、學習建議 passthrough、Practice 列表恰 1 題真實題
- [3] Regression：無參數進入 → Exam Tab active、Practice root hidden、無 Guide、Exam 列表正常
- [4] Pending 三句、禁用文案 0、無虛構五段、導讀分析中文案、Console Error 0
- [5] 真實內容 → 五段自動呈現、Pending 消失、深連結 href 正確
- [6] 下載機制 audit（Hotfix 保留、11 格式路徑、`kindOf` 副檔名 + MIME fallback）
- [7] 九個進入頁 Console Error 全數 = 0

**其他驗證**

- `node --check`：3 個修改之 JS 檔全數通過
- Forbidden-pattern grep（JS + CSS）：CLEAN（含 `var()` in gradient、`calc(var+var)`、`inset:`、`dvh`、`env(safe-area)`、localStorage/IndexedDB/fetch/XHR/import/export/inline handler/programmatic location navigation）
- `html5validator`：9 個進入頁 0 errors
- Pipeline E2E（Node）：process() done/success、validate() true、Runtime 行為與修改前逐位一致

**jsdom 無法驗證、留待 PMO 真機 PAT**：真實瀏覽器檔案下載儲存行為、跨頁導航後 sessionStorage 實際還原、真實渲染/RWD 視覺。

---

## 結論

Task 001 ✅　Task 002 ✅（既有 Hotfix 驗證保留）　Task 003 ✅（依 PMO Ruling）　Task 004 ✅（Critical Bug 已修）　Task 005 ✅

Console Error = 0。Runtime Architecture / Parser Interface 零變更。等待 PMO Final QA。
