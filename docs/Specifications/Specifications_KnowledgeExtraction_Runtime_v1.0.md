# KnowledgeExtraction_Runtime_Report — EO-S8.0-002

## 定位
`AHS.KnowledgeExtractionRuntime`（js/runtime/KnowledgeExtractionRuntime.js）—— Knowledge Foundation 第二階段，固定位於：

```
Document → Metadata → AnalysisRuntime → KnowledgeExtractionRuntime → KnowledgeGraphRuntime
```

## 公開 API（恰四個，測試以 Object.keys 驗證無其他）
| API | 行為 |
|---|---|
| `extract(materialId)` | 讀取 AnalysisRuntime；回傳 `{ materialId, status, nodes[], reason }` |
| `validate(node)` | Knowledge Node Schema 驗證（型別白名單 + 五項追溯欄位） |
| `store(nodes)` | 逐節點先 validate；**僅**寫入 KnowledgeGraphRuntime.addNode |
| `status(materialId)` | `pending` / `ready` / `stored` / `unknown` |

## AnalysisRuntime 硬閘門（不得 Fake Extraction）
AnalysisRuntime 現階段恆回 `pending_analysis_pipeline` → extract() 固定 `status: "pending"`、**零 Knowledge Node**、reason 明示原因並記錄 run。模組內不存在任何可自行編造節點內容的程式路徑：候選節點一律自真實分析結果之 items **逐字複製**（含各自 sourceFileId / sourcePage / sourceParagraph）。

## 型別
- **允許**：knowledge_point / definition / formula / keyword / concept
- **禁止**：summary / question / answer / explanation / wrongbook / review / dashboard / progress / study_progress（validate 逐型反證拒絕）

## Source Traceability（五欄位強制）
`knowledgeId`（store 後由 Knowledge Graph 指派）、`sourceFileId`（缺即拒絕）、`sourcePage`、`sourceParagraph`（無資料固定 null，欄位不得省略、不得猜測、不得 Mock）、`documentType`（取自 DocumentClassifierRuntime，非推測）。

## 儲存邊界與 LOCK 衝突之誠實處置
`store()` 唯一寫入目標為 KnowledgeGraphRuntime.addNode()；程式碼零出現 Summary / Question Bank / WrongBook / Review / Dashboard 之任何呼叫（原始碼掃描測試驗證，含 LearningQuestionGenerator / LearningQuestionSession / AnswerBuilderRuntime）。

**已知衝突（待 PMO 裁示）**：依 PMO Decision 2，KnowledgeGraphRuntime（LOCK）目前白名單僅接受 Skeleton 節點，內容節點會被拒收。`store()` **不繞過**此 LOCK 守衛，改回報 `status: "blocked_by_graph_whitelist"` 並附理由。由於 AnalysisRuntime 現為 pending，此路徑於本 EO 不會被觸發；建議由 **Analysis Pipeline EO** 一併解除白名單。
