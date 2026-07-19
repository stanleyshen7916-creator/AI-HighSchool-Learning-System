# EO-S6-006 — System Runtime Integration — QA Report

## Scope Confirmation
- 僅修改本 EO 明文授權的三個頁面／元件：`js/components/MaterialCenter.js`、
  `js/components/SummaryCenter.js`、`js/components/QuizCenter.js`，以及
  它們對應的 `materials.html`／`summary.html`／`quiz.html`（新增 script
  標籤）與 `css/pages/material.css` 之外的 `quiz.css`／`summary.css`
  （純新增／清理未使用規則，無既有規則被改動除 summary.css 的整體性
  重構，見下方說明）
- 未新增任何 Core Engine、未新增任何 Runtime（本 EO 明文禁止，亦未違反）
- 四個 Core Engine（`MaterialParser`／`KnowledgeBuilder`／
  `SummaryGenerator`／`QuestionGenerator`）與其 Public API 完全未修改
- 五個既有 Runtime（`MaterialRuntime`／`KnowledgeRuntime`／
  `SummaryRuntime`／`LearningQuestionRuntime`／`QuestionRuntime`）的
  Schema 與 Public API 完全未修改（已用 md5sum／diff 逐一確認）
- `js/components/AppShell.js`、`js/data/mock-data.js` 與上次交付
  （EO-S6-005）逐位元組完全一致 — 未觸碰 Sidebar／Bottom Navigation
- Home、Dashboard、AI Tutor、Wrong Book、Review Center 之頁面元件檔
  （`WrongBook.js`／`Dashboard.js`／`HeroCard.js`／Review Center 全部
  檔案）逐位元組確認與前次交付一致
- `js/runtime/QuestionRuntime.js`（Sprint 4）逐位元組確認未變動；
  Practice Mode 只呼叫 `AHS.LearningQuestionRuntime`，從未呼叫或修改
  `AHS.QuestionRuntime`

## Implementation Notes

### Material Center：Upload → Learning Pipeline
`onFilesPicked()` 內，`AHS.MaterialRuntime.add()` 的回傳值（真實記錄，
含真實 `id`）現在會被捕捉，並呼叫新增的 `runLearningPipeline(record.id)`
函式：
- 呼叫既有 `AHS.LearningPipeline.process()`（Public API 完全未修改）
- 呼叫 `AHS.LearningPipeline.getProgress()` 取得真實最終狀態
- 以 `setTimeout` 分段播報 Processing → Knowledge → Summary → Question →
  Completed — **這是對「真實已達到的階段」的分段播報動畫，不是假造的
  進度條**：若 Pipeline 實際只跑到「knowledge」就失敗，播報會如實停在
  該階段並顯示錯誤，不會繼續播報後面不存在的階段
- Upload 完成後不再停留於「僅儲存檔案」，已用真實檔案上傳互動測試證明
  （見 Developer QA）

### Summary Center：全面移除 Mock Data
整份檔案改寫：
- 移除全部 Mock 驅動內容（原本的思維導圖／知識樹／相關資源／筆記與
  標籤 — 這些在 Summary Runtime 的固定 Schema 中沒有對應欄位，若保留
  只能繼續讀 Mock，故依 EO 明文「全部移除」一併刪除，而非保留空殼）
- 改為 `AHS.SummaryRuntime.list()` 為主要資料來源，並用
  `AHS.SummaryRuntime.findByMaterialId()`（EO 原文寫
  `findByMaterial()`，為已交付 Runtime 的既有真實方法，同義使用，未
  新增／改名方法）實作教材篩選
- `AHS.SummaryRuntime.isEmpty()` 為空時顯示規定文案「尚未建立教材
  內容。請先上傳教材。」，不使用 Mock Data
- 五段固定格式（核心概念／重要定義／易錯重點／必背內容／複習建議）
  逐一使用既有 `.sum-kp__*`（重點整理）樣式渲染，個別欄位為空時顯示
  「尚無資料」，不虛構內容
- `css/pages/summary.css`：因原本的 mindmap／tree／resources／notes
  相關 CSS 規則已無對應 markup 產生，依 Code Quality「不得：未使用
  CSS」原則一併移除，新增 `.sum-empty*`／`.sum-section*`／
  `.sum-filter*`／`.sum-record` 等規則；`.sum-banner*`／
  `.sum-export*`／`.sum-topic*`／`.sum-kp__*`／`.sum-status` 皆保留
  沿用

### Quiz Center：新增 Practice Mode（與既有 Exam Mode 並存，不互相干擾）
- `create()` 內新增一個模式切換列（正式測驗／練習模式），僅切換
  `hidden` 屬性顯示哪一個 root，**從未修改** `showList()`／
  `startExam()`／`showExam()`／`finishExam()` 這些既有 Exam Mode
  函式的任何一行程式碼
- 新增 `buildPracticeListView()`／`buildPracticeQuestionView()`：完全
  獨立的資料流，只讀 `AHS.LearningQuestionRuntime.list()`，從未讀取
  或呼叫 `AHS.QuestionRuntime`、`AHS.ExamRuntime`、`AHS.AutoGrader`、
  `AHS.WrongBookRuntime`、`AHS.HistoryRuntime` — 兩種模式的資料流完全
  不共用（「兩者不得混用」）
- Practice 題目沒有資料時顯示規定 Empty State 文案
- 顯示解答會揭露真實記錄上的 `answer`、`explanation`（五維度：解題
  步驟／為什麼答案正確／其他選項錯誤原因／常見錯誤／解題技巧）、
  `knowledgePoint`、`learningObjective` — 皆為 Learning Question
  Runtime 記錄上已有的真實欄位，非本次新產生
- 開發過程中一度誤刪 `function create(model) {` 這行宣告（自我審查時
  用 `node --check` 立即發現並修正，修正後再次確認語法正確）

## Developer QA

### Upload → Learning Pipeline → KnowledgeRuntime → SummaryRuntime → LearningQuestionRuntime — PASS
以真實瀏覽器互動模擬（jsdom + 真實 DOM 事件）：觸發檔案輸入 change
事件 → 開啟新增教材對話框 → 填寫科目/年級/分類 → 點擊「建立教材」→
確認 `MaterialRuntime.list()`／`KnowledgeRuntime.list()`／
`SummaryRuntime.list()`／`LearningQuestionRuntime.list()` 皆產生對應
真實記錄，且章節（「第五章 化學平衡」）正確從檔名擷取並貫穿整條管線；
狀態文字最終顯示「學習內容已建立完成」。Console Error = 0。

### Summary Center — PASS
- 預設（無資料）：顯示規定 Empty State 文案，無 Mock Data
- 植入兩筆真實 `SummaryRuntime` 記錄（一筆有內容、一筆全空）：正確
  渲染兩張卡片，五段格式標題順序正確，全空記錄五段皆顯示「尚無資料」，
  篩選器正確依 `materialId` 篩選

### Practice Mode — PASS
- 無資料：顯示規定 Empty State
- 植入一筆真實 `LearningQuestionRuntime` 記錄（選擇題）：列表正確顯示
  題目；點入後顯示題目與 4 個選項；解答預設隱藏；點擊「顯示解答」後
  正確顯示標準答案、5 個詳解區塊、考點、學習目標；返回列表功能正常
- 確認 `AHS.QuestionRuntime.getSet` 仍為函式（Sprint 4 Runtime 完全
  未受影響）

### Exam Mode — PASS（迴歸測試）
- 模式切換：預設顯示正式測驗、練習模式初始為 `hidden`；切換至練習
  模式後正式測驗變為 `hidden`；切回正式測驗後測驗列表（5 筆 Mock 項目）
  完整存在
- 點擊既有「開始測驗」按鈕：`AHS.ExamRuntime.getCurrent()` 正確回傳
  進行中 Session，測驗畫面正確顯示 — 與整合前行為完全一致

### QuestionRuntime 未修改 — PASS
`js/runtime/QuestionRuntime.js` 以 diff／md5sum 確認逐位元組與前次
交付完全一致。

### Empty State — PASS
Summary Center 與 Practice Mode 皆已驗證：無資料時顯示規定文案，不使用
Mock Data。

### Console Error = 0 — PASS
全部測試情境（Material 上傳管線、Summary Center 兩種資料情境、Quiz
Center 兩種模式、其餘 6 個既有頁面之迴歸測試）皆為 0 錯誤。

### 迴歸測試
- `index.html`／`wrongbook.html`／`review.html`／`dashboard.html`／
  `learning.html`／`tutor.html`：全數重新載入，0 錯誤
- `diff -rq` + 針對 `AppShell.js`／`mock-data.js`／所有 Do NOT Modify
  頁面元件檔／五個既有 Runtime／四個 Core Engine 的個別 diff：確認
  逐位元組與前次交付（EO-S6-005）完全一致

## Acceptance Checklist
- [x] Upload → Learning Pipeline → KnowledgeRuntime → SummaryRuntime →
  LearningQuestionRuntime PASS
- [x] Summary Center PASS
- [x] Practice Mode PASS
- [x] Exam Mode PASS
- [x] QuestionRuntime 未修改 PASS
- [x] LearningQuestionRuntime 正常讀取 PASS
- [x] Empty State PASS
- [x] Console Error = 0
- [x] Core Engine Public API 全部未修改

## Known Issues
1. Practice Mode 目前題目來源為 `list()` 全部練習題（無分頁／篩選），
   待未來 EO 視需要擴充
2. Material Center 的 Pipeline 進度播報為同步結果的分段呈現（非真正
   非同步串流），因 `LearningPipeline.process()` 本身為同步實作（見
   EO-S6-005），非本 EO 可調整範圍
