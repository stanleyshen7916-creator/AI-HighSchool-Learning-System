# KnowledgeGraph_Runtime_Report — EO-S8.0-001（PMO Final Decision 版）

## 定位
`AHS.KnowledgeGraphRuntime`（js/runtime/KnowledgeGraphRuntime.js）—— 全系統唯一知識來源。依 **PMO Decision 2**，本 EO 僅建立 **Knowledge Graph Skeleton**。

## 允許節點（六型，白名單）
`subject` / `chapter` / `section` / `source_file` / `document_type` / `metadata`

## 拒絕節點（十型，等待 Analysis Pipeline）
`knowledge_point` / `definition` / `formula` / `keyword` / `concept` / `exam_point` / `explanation` / `example` / `question` / `answer`
→ `addNode()` 一律回傳 null 並附理由「屬 Analysis Pipeline 範圍（PMO Decision 2）」。**Repo 內不存在任何可建立內容節點的程式路徑** —— Mock/Fake Knowledge 結構上不可能（測試逐型反證）。

## 追溯欄位（強制）
每節點必帶 `sourceFileId`（缺即拒收）；`sourcePage` / `sourceParagraph` 於無資料時**固定 null**（addNode 正規化保證欄位永不省略、永不捏造）；`materialIds[]` 記錄多檔貢獻軌跡。

## Multiple File Rule
結構節點以 natural key 合併：同一章節之教材＋筆記＋考卷自動聚合於單一 chapter 節點（測試驗證 materialIds 同時含兩檔），為未來跨檔知識關聯之基礎。

## buildFromMaterial()
自真實 metadata 建立：`source_file` →（classified_as）→ `document_type`、→（belongs_to）→ `subject` →（has_chapter）→ `chapter`。零內容推論、零解析、零 AI。
