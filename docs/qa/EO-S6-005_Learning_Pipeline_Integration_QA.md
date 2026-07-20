# EO-S6-005 — Learning Pipeline Integration — QA Report

## Scope Confirmation
- `js/services/LearningPipeline.js`（新增）路徑完全依 EO 指定
- 未修改四個 Core Engine 的 Public API：`MaterialParser.js`／
  `KnowledgeBuilder.js`／`SummaryGenerator.js`／`QuestionGenerator.js`
  逐位元組確認與前次交付版本完全一致（md5sum）
- 未修改任何既有 Runtime：`KnowledgeRuntime.js`／`SummaryRuntime.js`／
  `LearningQuestionRuntime.js`／既有 `MaterialRuntime.js`／既有
  `QuestionRuntime.js` 皆逐位元組確認未變動
- `LearningPipeline.js` 本身不自行解析教材、不自行建立 Knowledge、不
  自行建立 Summary、不自行建立 Question — 每一步驟都是呼叫對應 Runtime
  的 `sync()`（其內部才呼叫對應 Engine），未在本檔案內重寫任何一段
  萃取／生成邏輯
- 對 `AHS.MaterialRuntime` 僅呼叫 `getById()`（唯讀），從未寫入
- 未操作任何 UI／頁面／Sidebar／Bottom Navigation — 本檔案未被任何
  `.html` 引用（已用 grep 全站確認為零筆），延續 Sprint 6 一貫模式
- 無 ES Module、無 Router、無新 Framework、無 fetch/XHR/localStorage

## Implementation Notes

### Pipeline Flow
`processMaterial(materialId)` 讀取既有 `AHS.MaterialRuntime.getById()`
取得真實教材記錄，轉交 `AHS.MaterialParser.parse()` 產生 Material
Document → `buildKnowledge()` 委派 `AHS.KnowledgeRuntime.sync()` →
`buildSummary()` 委派 `AHS.SummaryRuntime.sync()` → `buildQuestions()`
委派 `AHS.LearningQuestionRuntime.sync()`。完全依 EO 指定的固定流程，
四個 Runtime 皆確實被呼叫（已用真實資料端對端測試驗證）。

### Validation 與失敗即停止
`process()` 逐階段檢查回傳值，任一階段回傳空／null 立即
`stop + 回傳 Error`，不繼續下一階段 — 已用「materialId 不存在」情境
測試證明：流程正確停在 `stage:"material", status:"error"`，
`knowledge`／`summary`／`questions` 完全未被呼叫。

`buildQuestions()` 回傳空陣列（例如目前 Knowledge 內容不足以通過
`LearningQuestionRuntime` 的完整性關卡）**不視為硬性失敗** —
記錄為 `errors` 陣列中的一則資訊性訊息，但 Pipeline 仍回報
`status:"success"`。這是刻意設計：教材／知識／摘要三個階段確實成功時，
「暫時沒有產生任何 Learning Question」是 Sprint 6 目前系統狀態下的
誠實、預期結果，不是系統錯誤，不應讓整條 Pipeline 被判定失敗。

### Progress
`getProgress()` 回傳固定形狀 `{stage, status, progress, errors:[]}`，
初始為 `{stage:"idle", status:"pending", progress:0, errors:[]}`，
隨 `process()` 執行即時更新（material 25% → knowledge 50% →
summary 75% → questions 90% → done 100%），供未來 Upload Progress UI
使用。

### validate()
重複使用各 Engine 自己的 `validate()`（`KnowledgeBuilder.validate()`／
`SummaryGenerator.validate()`／`QuestionGenerator.validate()`），未
重新實作檢查邏輯。預設驗證最近一次 `process()` 的結果，亦可傳入自訂
artifacts 物件獨立驗證。已測試兩種情境：完整成功的 lastRun（全部
valid:true）與刻意給空 artifacts（正確列出 3 項缺漏）。

### reset()
只清空 Pipeline 自身的 `progress`／`lastRun` 追蹤狀態，**不會**呼叫
任何 Runtime 的 `reset()`（不重新建立 Runtime，符合 EO 規則）。已測試
證明：呼叫 `LearningPipeline.reset()` 後，`AHS.KnowledgeRuntime.list()`
仍保留先前成功寫入的記錄。

## Developer QA
- [x] `node --check` — 通過
- [x] 禁用模式 grep — 乾淨
- [x] 獨立 jsdom 測試（九檔案：MaterialRuntime + 四個 Engine + 三個
  Sprint 6 Runtime + LearningPipeline 一起載入於最小 HTML shell，未
  接線任何頁面）：
  - 8 個 Public API 全部存在，皆為函式，不帶參數呼叫皆不拋例外
  - **Material → Knowledge → Summary → Learning Question Pipeline**：
    以 `AHS.MaterialRuntime.add()`（既有公開 API）植入一筆真實教材，
    呼叫 `process(materialId)` 完整跑完四階段，`KnowledgeRuntime`／
    `SummaryRuntime`／`LearningQuestionRuntime` 皆確實寫入真實記錄
    → PASS
  - **Progress**：初始 idle，成功流程逐階段更新至
    `{stage:"done", status:"success", progress:100}` → PASS
  - **Validation**：`validate()` 對成功流程回報 valid:true；對刻意
    給空 artifacts 正確列出缺漏 → PASS
  - **Error Handling**：`process("nonexistent_material_id")` 正確
    停在 material 階段、回報 `status:"error"`，後續階段完全未執行
    → PASS
  - Console Error = 0
- [x] `diff -rq` + `md5sum` 比對前次交付 — 除本次新增
  `LearningPipeline.js` 外，其餘既有檔案（含 Sprint 5 全部交付、
  Sprint 6 前四個 EO 交付的全部檔案、既有 `MaterialRuntime.js`／
  `QuestionRuntime.js`／`QuizCenter.js`）逐位元組未變動；新檔案未被
  任何 `.html` 引用

## Acceptance Checklist
- [x] Material → Knowledge → Summary → Learning Question Pipeline PASS
- [x] Progress PASS
- [x] Validation PASS
- [x] Error Handling PASS
- [x] Console Error = 0
- [x] 除新增 LearningPipeline.js 外，其他 Runtime 未修改

## Known Issues
1. 承接自 EO-S6-004：當 Knowledge 記錄缺乏真實 concept／chapter 時，
   AI 模式產生的 `knowledgePoint` 會出現如「chemistry - chemistry」的
   輕微重複字樣（因 anchor 退回使用 subject 本身）。這是既有 Core
   Engine（`QuestionGenerator.js`）的實作細節，本 EO 明文禁止修改
   四個 Engine 的 Public API／實作，故未調整，純屬外觀瑕疵，不影響
   完整性關卡或任何驗證結果。
2. `buildQuestions()` 在目前系統狀態下常回傳僅 1 筆（因 Knowledge
   Runtime 的 concepts 陣列多為空，回退為單一 fallback 錨點），待上游
   Engine 未來有真實多概念資料時會自然產生多筆。
