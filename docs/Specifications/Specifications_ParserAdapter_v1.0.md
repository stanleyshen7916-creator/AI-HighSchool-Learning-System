# ParserAdapter_Report — EO-S8.1.001（Parser Adapter Baseline v1.0）

## 定位
`AHS.ParserAdapterRegistry`（js/parser/ParserAdapterRegistry.js）—— 所有文件解析能力的統一接入點。

```
TXT / PDF / DOCX / PPTX / Image → Parser Adapter → MaterialTextProvider
→ AnalysisRuntime → KnowledgeExtractionRuntime → KnowledgeGraphRuntime
```
Parser **永不**直接與 AnalysisRuntime 或 KnowledgeGraphRuntime 串接。

## 零修改整合（本 EO 最關鍵成果）
EO-S8.0-005 交付的 MaterialTextProvider **已內建 adapter 諮詢機制**（adapter 優先於 `Material.content` fallback）並公開 `registerAdapter()`。本 Registry 因此**僅透過其公開 API 接入** —— MaterialTextProvider、AnalysisRuntime、KnowledgeExtractionRuntime、KnowledgeGraphRuntime、SummaryRuntime **全數 byte-identical**（逐位驗證）。

## 雙合約橋接（設計說明）
| 合約 | 形式 |
|---|---|
| EO-S8.1.001 Parser Adapter | `{ id, version, supports(fileType), extract(file) → {status, content, metadata} }` |
| Provider 既有插入合約 | `{ id, supports(material), extract(material) → string }` |

Registry 以**單一 bridge adapter**（id: `parser_adapter_registry`）轉譯。**安全設計**：bridge 僅在某個 parser 確實產出文字（status `ready` 且內容非空）時才接手；否則主動讓位，使 Provider 的 `Material.content` fallback 與 `insufficient_source` 行為完全不變（既有 442 項測試零回歸驗證）。

## 公開 API（恰五個）
`register()`｜`unregister()`｜`getAdapter()`｜`listAdapters()`｜`status()`

`status()` 三種用法：無參數 → 總覽（adapters／bridgeInstalled／textTypes）；`status(id)` → registered／unknown；`status(id, fileType)` → supported／not_supported。

## Default Adapters（五個 Stub）
| Adapter | supports() | extract() |
|---|---|---|
| **txt** | **true**（TXT／MD／MARKDOWN／JSON／TEXT） | 回傳教材記錄之文字，**逐字保留**；空白 → `empty`；型別不合法 → `failed` |
| pdf / docx / pptx / ocr | false | 固定 `not_supported`、零內容、附保留說明 |

**本 EO 未實作任何真正解析**：無 PDF 二進位讀取、無 DOCX／PPTX 解析、無 OCR、無第三方解析程式庫（原始碼掃描驗證無 pdfjs／mammoth／tesseract／require）。

## Extract 輸出（固定）
`{ status, content, metadata }`，metadata 至少含 `parserId`／`fileType`／`createdAt`。status 限定 `ready｜empty｜not_supported｜failed`。
**驗證守衛**：若 adapter 回傳下游資料（knowledge／summary／question／answer／review／wrongbook 任一鍵），Registry 判定格式不合法並讓位 —— Parser 不得直接回傳學習成果（測試反證）。

## 優先順序（已驗證）
Parser Adapter → `Material.content` → `insufficient_source`。
- TXT 檔 → 走 adapter（來源標示 `adapter:parser_adapter_registry`）
- PDF 檔（adapter 不支援）→ 回退 content（來源 `material.content`）
- 兩者皆無 → `insufficient_source`

## 未來擴充
新增 Parser（PDF／DOCX／OCR／HTML／EPUB…）只需實作本合約並 `register()`，**AI Pipeline 完全不需修改**。
