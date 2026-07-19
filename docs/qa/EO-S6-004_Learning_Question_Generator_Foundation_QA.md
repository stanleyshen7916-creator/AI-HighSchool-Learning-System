# EO-S6-004 — Learning Question Generator Foundation — QA Report

## Critical Flag (blocking-risk, resolved)

**`js/runtime/QuestionRuntime.js` 已存在，且為 Quiz Center 正在使用的
Sprint 4 模組。** `quiz.html` 會載入它，`QuizCenter.js` 第 419 行呼叫
`AHS.QuestionRuntime.getSet(session.examId)` 進行真實測驗流程。它的用途
與 Schema 完全不同（依 examId 載入題目集合，非本 EO 的 Learning
Question Schema）。

若照 EO 字面在 `js/runtime/QuestionRuntime.js` 建立新檔案，將**覆蓋此
既有檔案並清空 `AHS.QuestionRuntime` 命名空間**，導致 Quiz Center（Do
NOT Modify 清單內）在下次載入時發生真實 Console Error 並無法運作 —
這是嚴重、必須在動手前攔截的衝突，而非可事後修正的小問題。

**解決方式**：依「Repository wins」原則，本 EO 新建的 Runtime 改名為
`js/runtime/LearningQuestionRuntime.js` / `AHS.LearningQuestionRuntime`
——也更符合本 EO 文件中反覆使用的用詞（「Learning Question Engine」／
「Learning Question」，全文從未使用單純的「Question」）。
`js/services/QuestionGenerator.js` / `AHS.QuestionGenerator` 沒有命名
衝突，維持原樣。已用 md5sum 確認 `js/runtime/QuestionRuntime.js` 與
`js/components/QuizCenter.js` 逐位元組與前次交付版本完全一致，未受
影響。

## Scope Confirmation
- 兩個新檔案路徑（除上述改名外）皆依 EO 指定：`js/services/
  QuestionGenerator.js`、`js/runtime/LearningQuestionRuntime.js`
- `QuestionGenerator.js` 為純函式、無狀態，從未讀取或呼叫
  `AHS.LearningQuestionRuntime`、任何 UI、或 AI API（全站無 AI API
  可呼叫）
- 只接受 Knowledge Runtime 記錄（Mode B）或呼叫者提供的真實原始題目
  內容（Mode A）作為輸入，從未直接讀取 Material Document 或
  PDF／DOCX／PPTX／Image／Audio
- `LearningQuestionRuntime.js` 僅負責 Store／Query／Sync，未操作 UI
- 未修改 `MaterialParser.js`／`KnowledgeBuilder.js`／
  `KnowledgeRuntime.js`／`SummaryGenerator.js`／`SummaryRuntime.js`／
  `MaterialRuntime.js`／既有 `QuestionRuntime.js`／`QuizCenter.js`
  （已用 md5sum 逐一確認與前次交付版本完全一致）
- 未修改任何 UI／頁面／Sidebar／Bottom Navigation — 兩個新檔案皆未被
  任何 `.html` 引用（已用 grep 全站確認為零筆），延續 Sprint 6 一貫
  「Foundation 先建立、暫不接線」的模式
- 無 ES Module、無 Router、無新 Framework、無 fetch/XHR/localStorage
- 未呼叫 AI（全站無 AI API；Mode B 的 AI 題目內容為誠實標示的 Stub，
  身分／可追溯欄位皆為真實資料，非 AI 生成）

## Implementation Notes

### 完整性關卡（本 EO 與前三個 EO 的關鍵差異）
`KnowledgeRuntime`／`SummaryRuntime` 的 `add()` 一律接受記錄並補上安全
預設值；但本 EO 明文要求「缺少任何一項：不得加入 Question Runtime」，
故 `LearningQuestionRuntime.add()` 改為：先呼叫
`AHS.QuestionGenerator.validate()`（10 項檢查），**不完整則回傳 `null`
且不寫入 store**。已用測試證明：
- 給予「只有 id、沒有 materialId/subject/concepts」的空洞 Knowledge
  記錄 → `generateAIQuestion()` 仍能產出結構完整的候選物件（不拋例外），
  但 `validate()` 正確回報缺少考點／學習目標／Traceability，
  `add()` 正確拒絕寫入，store 維持空
- 給予真實、有 materialId／concepts／chapter 的 Knowledge 記錄 →
  完整通過 `validate()`，成功寫入

### 兩種 Learning Mode
- **Mode A（Original Question）**：`generateOriginalQuestion(input)` —
  呼叫者提供真實題目／答案／出處，本模組只負責「包裝與豐富化」
  （補上 Traceability、考點、學習目標、結構化詳解），絕不臆測題目本身。
  `input.question` 缺失時回傳 `null`（沒有真實題目可保留）
- **Mode B（AI Generated Question）**：`generateAIQuestion(knowledge)` —
  只讀 Knowledge Runtime，絕不引用外部教材。因全站無 AI API，題目／
  答案文字為誠實標示的 `[Stub]`，但身分／可追溯欄位（materialId／
  knowledgeId／chapter／concept）皆為 Knowledge 記錄的真實資料，非
  虛構。`knowledge` 完全無身分資訊（無 id/materialId/subject）時回傳
  `null`

### Explanation（五維結構）
`buildExplanation()` 回傳物件恆包含 `steps`／`whyCorrect`／
`whyOthersWrong`／`commonMistakes`／`tips` 五個欄位，符合「不得只有
答案」規則。Mode A 若呼叫者提供真實 `steps`／`whyCorrect` 則採用真實
內容（已測試證明）；未提供的維度落回誠實 Stub。`whyOthersWrong`
只在選擇題（有 `options` 或 `questionType==="multiple_choice"`）時
填入內容，否則為空陣列（符合「若為選擇題」的條件式規則）

### Source／Traceability
- `buildSource("ai", ...)`：`type` 固定 `"ai_generated"`，`materials`
  恆為 `[]`（已測試驗證），`reference` 記錄來源 Knowledge Runtime id
- `buildSource("original", ...)`：完整保留呼叫者提供的
  materials／chapter／section／page／reference
- Traceability 恆包含 `materialId`／`knowledgeId`／`summaryId`
  （`summaryId` 可為 `null`，非本 EO 要求必填），已用測試證明
  Question → Knowledge → Material 的鏈路正確

## Developer QA
- [x] `node --check` — 兩個檔案皆通過
- [x] 禁用模式 grep — 乾淨
- [x] 獨立 jsdom 測試（五檔案：MaterialParser + KnowledgeBuilder +
  KnowledgeRuntime + QuestionGenerator + LearningQuestionRuntime 一起
  載入於最小 HTML shell，未接線任何頁面；並確認未載入舊
  `AHS.QuestionRuntime` 情況下無命名衝突）：
  - `QuestionGenerator` 11 個、`LearningQuestionRuntime` 9 個 Public
    API 全部存在，皆為函式
  - 全部 11 個 Generator 方法「不帶參數呼叫」皆不拋例外
  - **Original Question Pipeline**：真實輸入 → `validate()` 
    valid:true → `add()` 成功寫入 → PASS
  - **AI Question Pipeline (Stub)**：完整端對端
    MaterialParser→KnowledgeBuilder→KnowledgeRuntime→
    QuestionGenerator→LearningQuestionRuntime，`validate()` valid:true
    → `add()` 成功寫入 → PASS
  - **完整性關卡拒絕測試**：空洞 Knowledge → 候選產生但 `add()` 正確
    拒絕，store 維持空 → PASS
  - **Explanation**：五維度齊全，Mode A 真實內容正確採用 → PASS
  - **Knowledge Point／Learning Objective**：正確由真實 concept/chapter
    衍生 → PASS
  - **Source**：AI 模式 `materials:[]`／`type:"ai_generated"`；
    Original 模式完整保留呼叫者資料 → PASS
  - **Traceability**：Question→Knowledge→Material 鏈路以真實 id 驗證
    → PASS
  - **validate()**：對完整記錄回報 valid:true、對不完整記錄正確列出
    缺漏項目 → PASS
  - Console Error = 0
- [x] `diff -rq` + `md5sum` 比對前次交付 — 除本次新增兩個檔案外，其餘
  既有檔案（含 Sprint 5 全部交付、Sprint 6 前三個 EO 交付的全部檔案、
  既有 `QuestionRuntime.js`、`QuizCenter.js`）逐位元組未變動；兩個新
  檔案皆未被任何 `.html` 引用

## Acceptance Checklist
- [x] QuestionGenerator.js
- [x] QuestionRuntime.js（已改名為 LearningQuestionRuntime.js，見上方
  Critical Flag）
- [x] Question Runtime Schema（完全符合指定 21 個欄位）
- [x] Knowledge Runtime → Question Generator → Question Runtime
- [x] Original Question Pipeline PASS
- [x] AI Question Pipeline（Stub）PASS
- [x] Explanation PASS
- [x] Knowledge Point PASS
- [x] Learning Objective PASS
- [x] Source PASS
- [x] Traceability PASS
- [x] validate() PASS
- [x] Console Error = 0
- [x] 除新增 QuestionGenerator.js／LearningQuestionRuntime.js 外，其他
  Repository 未修改

## Known Issues
1. `QuestionRuntime.js` 命名衝突（見 Critical Flag），已改名為
   `LearningQuestionRuntime.js`，待 PMO 確認
2. 目前多數欄位因上游 Knowledge Runtime 仍為 Stub 而誠實為空／Stub
   內容，真實內容將隨上游模組未來實作真正解析而自動填充，不需修改本
   EO 的邏輯
