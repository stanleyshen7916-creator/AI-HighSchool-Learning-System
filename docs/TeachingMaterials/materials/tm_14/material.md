# tm_14 — 長榮中學高二世界史「序篇：從臺灣走向世界」

- **科目**：歷史（高二）
- **命題範圍**：序篇：從臺灣走向世界，課本第2～6頁
- **材料類型**：`TEXTBOOK`（課本）
- **原始檔案**（`source/`，共2份）：`b0ad0860-____12_.pdf`（課本p.2-3）、`ccfedacb-____34_.pdf`（p.4-6）

## 本 Package 的產出過程（誠實揭露）

**本 Package 是既有 `tm_6`（長榮中學高二世界史 序篇＋第1章）的拆分結果，非全新獨立分析。** 原 `tm_6` 依《AI Study Council｜Multi-AI Cross Review Skill v1.1》流程完成 Round 1／Cross Review／Final（詳見拆分前 `tm_6` 自身 material.md 記載的完整產出過程），其中僅1題（原題號1）屬於「序篇：從臺灣走向世界」範圍。

依 Project Owner 指示「長榮中學歷史課本內容沒有將章節分類出來，需補上」，並比照本 Repository其他科目（物理、化學、公民等）「一個章節＝一筆獨立教材」的既有慣例，將原 `tm_6` 拆分為：
- **`tm_14`（本 Package）**：序篇，1題
- **`tm_15`**：第1章：歐洲文化與基督教傳統（第1/2/3節），34題

拆分過程中題目內容（題幹、選項、答案、詳解）**完全未變動**，僅重新分配 `questionId`／`materialId`／`questionNumber`，並新增 `section` 欄位標示所屬節次。原 `tm_6` 已標記 `archived: true`（見 `docs/TeachingMaterials/materials/tm_6/manifest.json`），保留完整歷史紀錄供稽核，但不再出現於平台的教材清單中，以避免與 `tm_14`／`tm_15` 重複顯示。

## 判斷提醒（Flagged, not silently decided）

- **`materialType` 判定為 `TEXTBOOK`**，`questionSource` 沿用原 `tm_6` 之 `AI_GENERATED`／`origin: "AI"`（本題為 Claude 依課本內容原創設計並附完整詳解，非逐字轉錄自考卷）。
- **序篇僅1題，教材篇幅明顯短於本 Repository其他教材**：這是忠實反映原始課本「序篇」本身篇幅較短（僅5頁）的真實情況，非刻意精簡或遺漏——原 `tm_6` 的35題練習題中，可歸類為「序篇」範圍的確實只有第1題。
- **`semester` 標示為 `g2s1`**：沿用原 `tm_6` 的既有判斷（見 tm_6 material.md 記載）。

## 練習題總覽（1題，完整內容見 `questionbank.json`）

| 題號 | 題目重點 | 答案 |
|---|---|---|
| 1 | 序篇：世界史知識的實用價值（關東大地震例子） | 世界史知識可作為理解自身位置、面對世界性問題的參考座標 |
