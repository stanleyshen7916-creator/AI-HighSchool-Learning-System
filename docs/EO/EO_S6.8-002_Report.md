# REPORT — EO-S6.8-002 AI Question Guide + PAT Critical Issues

## Status
COMPLETE — 四項任務全數完成並通過 QA（61/61 jsdom 行為測試、
html5validator 0 errors、Console Error = 0），提交 PMO Final QA。
依 Acceptance：未 Git Push、未 GitHub QA、Runtime Architecture 零變更。

## PMO Ruling Applied（Task 003）
依 PMO 修訂裁示：Parser 未完成解析時，AI Summary 顯示誠實 Pending
State（三句固定文案），不得 Placeholder／Lorem／Mock／虛構五段式內容；
Parser 完成後自動呈現真實五段式內容。Material Parser／Knowledge
Builder／Parser Interface 未修改（diff 確認）。

## New Files
- js/components/QuestionGuide.js（Task 001，AI Question Guide 元件）
- docs/qa/EO-S6.8-002_AI_Question_Guide_PAT_Critical_QA.md

## Modified Files
- js/components/QuizCenter.js
  - Task 001：`mode=practice&materialId` 深連結改以 巧巧老師出題引導
    為入口（Summary → Question Guide → Practice 固定流程）；「開始
    練習」揭示既有 Practice 列表。無 materialId 之進入完全不變
    （additive only），Exam Mode 保持現況、零修改。
  - Task 004（PAT Critical）：新增 `isRealLearningQuestion()` —
    Practice 列表與 Guide 統計一律排除 `[Stub]` 佔位題（question 或
    answer 以 `[Stub]` 開頭者），無真實題目時顯示 mandated Empty
    State。修正於 UI 層；QuestionGenerator／LearningQuestionRuntime
    未動，未來真實 AI 內容取代 Stub 後同批記錄零修改自動浮現。
- js/components/SummaryCenter.js
  - Task 003：五段全空之 Pending 區塊固定顯示「AI 正在分析教材／
    尚未取得可整理內容／完成分析後將自動更新」三句；巧巧老師導讀
    無內容分支與提醒事項分支同步改為分析中語系。禁用之舊文案已全
    數移除。自動更新由既有 `anyContent` 分支保證（真實內容測試已
    驗證自動切換）。
- quiz.html：有序 script 新增 `js/runtime/SummaryRuntime.js`（Guide
  唯讀資料來源）與 `js/components/QuestionGuide.js`。
- css/pages/quiz.css：新增 `.qguide__*` BEM 樣式（tokens only，無任何
  forbidden CSS pattern）。

## Task 002（PAT Critical，教材下載）
Regression 驗證：Sprint 6.7 Hotfix 修正全數保留（延遲
revokeObjectURL、無檔案時明確狀態訊息、原始 fileName 逐字保留）。
下載為格式無關 Blob URL 路徑 — JPG／PNG／PDF／DOCX／PPTX／XLSX／
MP4／MP3／ZIP／TXT 全數走同一機制；不可預覽格式經資訊頁 + 明確下載
鈕，永不 Silent Fail。本 Task 無需新增程式碼。

## Task 004 Root Cause（記錄）
QuestionGenerator Mode B 之 `[Stub]` 候選題十項欄位皆存在，故通過
完整性檢核並被 Runtime 儲存、顯示於 Practice Mode — 即 PAT 所指之
Placeholder 狀態。已於 UI 層過濾修正；Runtime 行為（含完整性檢核）
與修改前逐位一致（Node E2E 驗證）。

## QA（Task 005）
- jsdom 行為測試 61 PASS／0 FAIL（Guide 六列真實推導、Stub 過濾、
  Pending 三句、真實內容自動切換、下載 audit、九頁 Console Error 0）
- node --check：全數通過；Forbidden-pattern grep（JS＋CSS）：CLEAN
- html5validator：9 個進入頁 0 errors
- Pipeline E2E：process() done/success、validate() true、Regression 0
- jsdom 限制（真機下載儲存、跨頁 sessionStorage 還原、真實渲染）
  已於 QA 報告揭露，留待 PMO 真機 PAT。

詳見 docs/qa/EO-S6.8-002_AI_Question_Guide_PAT_Critical_QA.md。

## Baseline Protected（0 變更，diff 確認）
Runtime Architecture、Material Runtime Schema、QuestionRuntime、
QuestionBank、ExamRuntime、Parser Interface、MaterialParser、
KnowledgeBuilder、QuestionGenerator、LearningQuestionRuntime、
SummaryRuntime、PersistenceAdapter。
