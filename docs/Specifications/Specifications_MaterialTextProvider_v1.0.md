# MaterialTextProvider_Report — EO-S8.0-005（Material Text Provider Baseline v1.0）

## 定位
`AHS.MaterialTextProvider`（js/parser/MaterialTextProvider.js）—— **Single Text Entry Point**。這是 Adapter／Helper 層，**不是新的 Foundation Runtime**：自身不持有文字、不持久化、不建立第二套 Content Store，唯一內容來源為 `AHS.MaterialRuntime.getById()`（公開 API，Reuse 非複製）。

## 固定流程
```
Folder → Material → Material Text Provider → AnalysisRuntime
       → KnowledgeExtractionRuntime → KnowledgeGraphRuntime
```
**AnalysisRuntime 已零直讀 `Material.content`**（原始碼掃描驗證：無 `material.content`、無 `getById(`、無 `AHS.MaterialRuntime`），全部文字經 `getText()` 取得。

## API
| API | 行為 |
|---|---|
| `getText(materialId)` | `{ materialId, status, text, source, characterCount, reason, retrievedAt }` |
| `status(materialId)` | 同上之 status |
| `registerAdapter(a)` / `validateAdapter(a)` / `listAdapters()` / `adapterStatus(kind)` | 未來 Parser 插入點（本 EO 零實作） |

## Status（限定三種）
- `ready` —— 取得真實文字，**逐字保留**（不修改、不修正文法、不重排、不 AI 潤飾）
- `insufficient_source` —— content 為 null／空字串／全空白；reason 明示「不得 Mock／推測／OCR／解析 PDF 二進位」
- `failed` —— Material 不存在／缺 materialId／缺 content 欄位／content 型別不合法（非字串）

## Validation
Material 存在 → content 欄位存在 → content 型別合法。任一不符即 `failed`（非 ready）。

## Future Extension（保留，本 EO 零實作）
`RESERVED_ADAPTERS = ["pdf","docx","pptx","ocr"]`，`adapterStatus()` 全數回 `not_supported`。Adapter 合約：`{ id, supports(material) -> boolean, extract(material) -> string }`。註冊之 adapter **優先於** `Material.content` 被諮詢，故未來 PDF／DOCX／OCR EO 只需在此註冊，**AnalysisRuntime 零改動**（永不依賴 Parser）。已於測試前驗：註冊 adapter → 文字改由 adapter 提供且來源標示 `adapter:pdf`；adapter 未取得文字 → `insufficient_source`；adapter 回傳非字串 → `failed`。

## Runtime Rules
Provider 原始碼**零出現** LearningQuestionGenerator／LearningQuestionSession／AnswerBuilderRuntime／KnowledgeGraph／KnowledgeExtraction／AnalysisRuntime／SummaryRuntime／WrongBook／Review／AIProvider 之呼叫；零 fetch／XHR；零 PersistenceAdapter（不建立第二套 Content Store）；零 AI 行為。

## 誠實現況
目前唯一合法來源仍是 `Material.content`，而上傳流程不收集文字（UI 不得改），故實務上多數教材仍回 `insufficient_source` —— 這是**誠實狀態**，非缺陷。文字入口既已統一，日後任一取得文字的途徑（文字上傳 UI、PDF Parser Adapter）都只需接到 Provider，全鏈即自動產出真實知識節點（已以真實文字端到端前驗）。
