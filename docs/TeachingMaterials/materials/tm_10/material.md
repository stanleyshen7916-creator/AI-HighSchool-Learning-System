# tm_10 — 長榮中學高二物理 第1章「測量與不確定度」

- **科目**：物理（高二）
- **命題範圍**：第1章 測量與不確定度（1-1 簡介不確定度、1-2 不確定度的組合、1-3 物理量的因次），課本第1～25頁
- **材料類型**：`TEXTBOOK`（課本）— 來源是課本內容照片掃描，非考卷，因此不觸發 Original Question Rule；本 Package 的全部練習題皆為 Claude 依課本內容延伸出的原創題目，`questionSource` 全部為 `AI_GENERATED`
- **原始檔案**（`source/`，共4份，保留原始檔名與檔案內容，涵蓋課本第1～11頁的連續跨頁掃描）：
  `2a82f451-PHY_H2..._PDFp12_Part1.pdf`（p.1-2）、`1fb9d094-PHY_H2..._PDFp35_Part2.pdf`（p.3-5）、`32a29d42-PHY_H2..._PDFp68_Part3.pdf`（p.6-8）、`0c8669e7-PHY_H2..._PDFp911_Part4.pdf`（p.9-11）

## 本 Package 的產出過程（誠實揭露）

依《AI Study Council｜Multi-AI Cross Review Skill v1.1》流程完整走過三階段：

1. Claude 依課本原始照片獨立完成 Round 1 重點整理＋題庫（15題）＋詳解＋錯題本（`Claude_PHY_Ch1_MeasurementUncertainty_Round1.md`，Self-QA 97/100）。
2. Project Owner 另提供 GPT（教材分析格式，無獨立題庫）、Gemini（自評100/100，6題）之 Round1 成果，Claude 進行 Cross Review：逐題重新驗算後發現 **Gemini 的第4題（矩形面積不確定度）為真實計算錯誤**——正確答案應為4.2 cm²，但其提供的4個選項中沒有一個等於正確答案，已排除不採用；其餘5題確認正確後，選取3題（加減法組合示範、因次辨識、單擺週期因次推導）納入。
3. Claude 依 Cross Review 結論整合出 Final 版本（`PHY_Ch1_Final.md`，Self-QA 98/100，FINAL_PASS，18題）。
4. **第二輪確認**：Project Owner 後續提供2份自稱「GPT/Gemini/Claude聯合審查Final」的文件（自評99/100），但同批附上的第三份文件明確承認「沒有可驗證的GPT Round1正式檔」、狀態為「PARTIAL CROSS REVIEW／FINAL暫停」——兩者互相矛盾，故其自評分數不予採信。逐題比對後確認其內容並無真正超出既有Final範圍的新增題目（多為既有Final內容的重新包裝，含Claude已獨立修正之矩形面積題，使用相同的修正數字），第1章維持18題版本不變。
5. 本 Package 的 `summary.json`／`questionbank.json` 依最終18題內容轉換為本 Repository 的 Package Standard 格式，逐題補上 `difficulty`（易／中等／難）欄位。

## 判斷提醒（Flagged, not silently decided）

- **`materialType` 判定為 `TEXTBOOK` 而非 `EXAM`**：原始上傳檔案是課本內容的照片掃描，不是考卷，因此不適用 Original Question Rule；本 Package 的 18 題練習題皆為原創設計並附完整詳解，`questionSource` 誠實標為 `AI_GENERATED`／`origin: "AI"`。
- **第一章與第二章分開建立 Package（`tm_10`／`tm_11`）**：與既有公民、數學、歷史等 Package 慣例一致，各章節分開獨立產出 Round1／Cross Review／Final 與各自的 materialId。
- **Gemini 第4題（矩形面積不確定度）之計算錯誤已排除**：詳見上方「產出過程」第2點，本 Package 之全部18題皆已獨立驗算確認正確，不含此已知錯誤。
- **逐題 `difficulty` 欄位**：18題依實際內容逐題標註「易／中等／難」，分布為易4／中等9／難5。`metadata.json` 的教材整體 `difficulty` 標為「中等」。
- **`semester` 標示為 `g2s1`（高二上學期）**：依內容判斷（第1章，該冊教材最前段）且與既有慣例（tm_5、tm_6、tm_7、tm_8、tm_9 同為「高二＋g2s1」教材）一致。

## 練習題總覽（18題，完整題幹／選項／詳解見 `questionbank.json`；Q16-18 為 Cross Review 後新增）

| 題號 | 題目重點 | 難度 | 答案 |
|---|---|---|---|
| 1 | A類評估定義判斷 | 易 | 依多次測量數據進行統計分析 |
| 2 | A類計算：硬幣直徑標準差與不確定度 | 難 | (2.6950±0.0065) cm |
| 3 | B類評估：皮尺測量書桌長度 | 中等 | (120.50±0.15) cm |
| 4 | A、B類組合不確定度 | 中等 | 0.13Ω |
| 5 | 加法組合不確定度 | 中等 | (83.80±0.25) g |
| 6 | 乘法組合不確定度：鐵板面積 | 難 | (1000.0±6.5) cm² |
| 7 | 因次：動量 | 易 | MLT⁻¹ |
| 8 | 因次：功 | 易 | ML²T⁻² |
| 9 | 因次分析推導：彈簧週期 | 難 | T=c√(m/k) |
| 10 | 有效數字位數判斷 | 中等 | 3.140×10² |
| 11 | 誤差vs不確定度概念辨析 | 易 | 不需知道真值即可估算不確定度 |
| 12 | 樣本標準差除以n-1之原因 | 中等 | 修正抽樣造成的低估 |
| 13 | B類評估：電壓表 | 中等 | (1532.00±0.29) mV |
| 14 | 除法組合不確定度：密度 | 難 | (3.000±0.026) g/cm³ |
| 15 | 進位規則綜合應用 | 中等 | (15.237±0.085) |
| 16【新增】 | 加減法組合示範（同時展示相加相減） | 中等 | M與ΔM皆為0.50g |
| 17【新增】 | 因次辨識（找出錯誤的動能因次選項） | 中等 | 動能[MLT⁻²]為錯誤敘述 |
| 18【新增】 | 因次推導：單擺週期 | 難 | (1/2,0,-1/2) |
