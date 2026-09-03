# tm_8 — 長榮中學高二公民與社會 第1章「社會資源的分配」

- **科目**：公民與社會（高二）
- **命題範圍**：第1章 社會資源的分配（第1節 資源分配與行為誘因、第2節 生產與專業分工、第3節 政府的資源分配），課本第0～27頁
- **材料類型**：`TEXTBOOK`（課本）— 來源是課本內容照片掃描，非考卷，因此不觸發 Original Question Rule；本 Package 的全部練習題皆為 Claude 依課本內容延伸出的原創題目，`questionSource` 全部為 `AI_GENERATED`
- **原始檔案**（`source/`，共7份，保留原始檔名與檔案內容，涵蓋課本第0～27頁的連續跨頁掃描）：
  `cfbb348b-CIV_H2____p0003.pdf`（P.0-3）、`adb8497b-CIV_H2____p0407.pdf`（P.4-7）、`33b41aab-CIV_H2____p0811.pdf`（P.8-11）、`209af72e-CIV_H2____p1215.pdf`（P.12-15）、`cfc742e9-CIV_H2____p1619.pdf`（P.16-19）、`58361007-CIV_H2____p2023.pdf`（P.20-23）、`3b73c849-CIV_H2____p2427.pdf`（P.24-27）

## 本 Package 的產出過程（誠實揭露，含第二輪 Cross Review）

依《AI Study Council｜Multi-AI Cross Review Skill v1.1》流程完整走過三階段，並於上架後再經一輪 Cross Review 修訂：

1. Claude 依課本原始照片（P.0–27）獨立完成 Round 1 重點整理＋題庫（15題）＋詳解＋錯題本（`Claude_CIV_Ch1_Round1.md`，Self-QA 97/100）。
2. Project Owner 另提供 GPT、Gemini 兩個 AI 平台各自獨立完成的 Round 1 成果，Claude 進行 Cross Review：三方核心概念、常考點、易錯點方向一致、無矛盾；發現 Gemini 之 Self-QA Scorecard 聲稱「10題答案分布(A):3,(B):3,(C):2,(D):2」，經重新核算實際為 A:2,B:4,C:3,D:1，與其自評聲稱不符——此問題不影響 Gemini 本身10題內容的正確性，但確認不應採信任一方 Round1 自評分數（`CIV_Ch1_CrossReview.md`）。
3. Claude 依 Cross Review 結論整合出 v1 Final（`CIV_Ch1_Final.md`，Self-QA 98/100，FINAL_PASS，15題）並上架為本 Package 初版。
4. **【第二輪，2026-09-03】** Project Owner 再提供 GPT 重新整理版與 Gemini Final（皆自評高分），Claude 逐題以 Python／邏輯重新驗算（不採信自評分數），確認12題 Gemini 新題中有4題屬於既有 Final 完全未測驗過的真實內容缺口（會計利潤vs經濟利潤定義、光電農地2公頃門檻政策、雙產品雙廠商比較利益綜合應用、誘因四象限新範例），其餘8題因與既有內容重複而未採用；GPT 重新整理版本身無新增可驗證題目，確認既有內容方向正確、無需修正。整合為 `CIV_Ch1_Final_v2.md`（Self-QA 99/100，FINAL_PASS，19題），完整增修對照表見該檔案 ⑭。
5. 本 Package 的 `summary.json`／`questionbank.json` 依 v2 Final（19題）內容轉換為本 Repository 的 Package Standard 格式，並逐題補上 `difficulty`（易／中等／難）欄位；`metadata.json` 的 `version` 同步由 `1` 增為 `2`（Import Rule：原地更新版本，不重複建立 materialId）。

## 判斷提醒（Flagged, not silently decided）

- **`materialType` 判定為 `TEXTBOOK` 而非 `EXAM`**：原始上傳檔案是課本內容的照片掃描，不是考卷，因此不適用 Original Question Rule；本 Package 的 19 題練習題皆為原創設計並附完整詳解，`questionSource` 誠實標為 `AI_GENERATED`／`origin: "AI"`。
- **第一章與第二章分開建立 Package（`tm_8`／`tm_9`）**：Project Owner 明確要求「第一章與第二章必須分開」，故未合併為單一 Package，各自獨立產出 Round1／Cross Review／Final 與各自的 materialId。
- **`subject` 由「公民」改為「公民與社會」（Project Owner 明確要求）**：`js/core/Icons.js` 的 `AHS.Subjects.civics.name` 與本 Package `metadata.json` 之 `subject` 欄位已同步更新，避免科目顯示名稱不一致；`tm_3`（既有公民考卷 Package）之 `subject` 亦一併同步更新以維持平台內科目名稱一致。
- **`source` 由「教科書」修正為「課本」（分類 bug 修正）**：`docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js` 的 `category` 只接受 Material Center 既有 7 個真實分類值（課本／講義／考卷／筆記／補充資料／影片／其他），先前 `tm_6`／`tm_7`／`tm_8`／`tm_9` 誤填「教科書」（不在清單內），導致這 4 筆教材在平台上全部靜默 fallback 顯示分類「其他」。本次一併修正這 4 筆教材的 `source` 欄位為「課本」。
- **逐題 `difficulty` 欄位**：19題依實際內容逐題標註「易／中等／難」（分類依據：易＝單一事實或定義的直接回憶；中等＝需計算或掌握單一因果/方向關係；難＝需跨多個概念綜合判斷、或辨析多組容易混淆的敘述組合），分布為易6／中等9／難4。`metadata.json` 的教材整體 `difficulty` 標為「中等」。
- **`semester` 標示為 `g2s1`（高二上學期）**：依內容判斷（第1章，該冊教材最前段）且與既有慣例（tm_5、tm_6、tm_7 同為「高二＋g2s1」教材）一致。

## 練習題總覽（19題，完整題幹／選項／詳解見 `questionbank.json`；Q16-19 為第二輪新增）

| 題號 | 題目重點 | 難度 | 答案 |
|---|---|---|---|
| 1 | 機會成本計算（阿明咖啡攤） | 中等 | 13萬元 |
| 2 | 稀少性定義判斷 | 易 | 稀少性取決於資源相對於人們欲望之間的比較 |
| 3 | 誘因分類：金錢正向（節能補助） | 易 | 金錢正向誘因 |
| 4 | 誘因分類：非金錢負向（酒駕修法） | 易 | 非金錢負向誘因 |
| 5 | PPC線上點意涵 | 易 | 資源與技術被充分利用，為最有效率的生產組合 |
| 6 | PPC線內移原因判斷 | 中等 | 整條曲線向內移動 |
| 7 | PPC凹向原點原因 | 中等 | 放棄的另一產品數量隨產量遞增 |
| 8 | 絕對利益判斷（甲乙工廠） | 中等 | 甲工廠生產手機與耳機皆具絕對利益 |
| 9 | 機會成本計算（延續上題） | 中等 | 2個耳機 |
| 10 | 比較利益法則判斷 | 難 | 甲工廠應專門生產手機 |
| 11 | 絕對利益vs比較利益敘述辨析 | 難 | 專業分工應依循比較利益法則 |
| 12 | 成本效益淨效益（道路建設） | 中等 | 乙方案，淨效益較高 |
| 13 | 累進稅率定義 | 易 | 課稅所得或財產額愈高，適用稅率愈高 |
| 14 | 政治考量判斷 | 易 | 政治上的考量 |
| 15 | WEF環境永續啟示 | 中等 | 推動綠能發電時應同時考量農漁民生計與生態環境 |
| 16【新增】 | 會計利潤vs經濟利潤（咖啡廳案例） | 難 | 會計利潤5萬元，經濟利潤-3萬元（經濟虧損） |
| 17【新增】 | 光電農地2公頃門檻政策取捨 | 中等 | 短期光電開發效率與農地零碎化／生態環境永續之間的取捨 |
| 18【新增】 | 雙產品雙廠商比較利益綜合應用 | 難 | 甲皆具絕對利益；乙具平板比較利益 |
| 19【新增】 | 誘因四象限綜合應用（囤房稅等） | 中等 | 囤房稅為負向金錢誘因 |
