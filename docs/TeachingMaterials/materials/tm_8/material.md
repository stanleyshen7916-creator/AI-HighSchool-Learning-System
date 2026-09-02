# tm_8 — 長榮中學高二公民與社會 第1章「社會資源的分配」

- **科目**：公民與社會（高二）
- **命題範圍**：第1章 社會資源的分配（第1節 資源分配與行為誘因、第2節 生產與專業分工、第3節 政府的資源分配），課本第0～27頁
- **材料類型**：`TEXTBOOK`（課本）— 來源是課本內容照片掃描，非考卷，因此不觸發 Original Question Rule；本 Package 的全部練習題皆為 Claude 依課本內容延伸出的原創題目，`questionSource` 全部為 `AI_GENERATED`
- **原始檔案**（`source/`，共7份，保留原始檔名與檔案內容，涵蓋課本第0～27頁的連續跨頁掃描）：
  `cfbb348b-CIV_H2____p0003.pdf`（P.0-3）、`adb8497b-CIV_H2____p0407.pdf`（P.4-7）、`33b41aab-CIV_H2____p0811.pdf`（P.8-11）、`209af72e-CIV_H2____p1215.pdf`（P.12-15）、`cfc742e9-CIV_H2____p1619.pdf`（P.16-19）、`58361007-CIV_H2____p2023.pdf`（P.20-23）、`3b73c849-CIV_H2____p2427.pdf`（P.24-27）

## 本 Package 的產出過程（誠實揭露）

依《AI Study Council｜Multi-AI Cross Review Skill v1.1》流程完整走過三階段：

1. Claude 依課本原始照片（P.0–27）獨立完成 Round 1 重點整理＋題庫（15題）＋詳解＋錯題本（`Claude_CIV_Ch1_Round1.md`，Self-QA 97/100）。
2. Project Owner 另提供 GPT、Gemini 兩個 AI 平台各自獨立完成的 Round 1 成果，Claude 進行 Cross Review：三方核心概念、常考點、易錯點方向一致、無矛盾；發現 Gemini 之 Self-QA Scorecard 聲稱「10題答案分布(A):3,(B):3,(C):2,(D):2」，經重新核算實際為 A:2,B:4,C:3,D:1，與其自評聲稱不符——此問題不影響 Gemini 本身10題內容的正確性，但確認不應採信任一方 Round1 自評分數（`CIV_Ch1_CrossReview.md`）。
3. Claude 依 Cross Review 結論整合出 Final 版本（`CIV_Ch1_Final.md`，Self-QA 98/100，FINAL_PASS）：①核心概念主幹採 Claude Round1（含完整課本數字範例），吸收 Gemini 的口訣化速記形式與 GPT 嚴謹的「無實際考卷」揭露語句。
4. 本 Package 的 `summary.json`／`questionbank.json` 即依該 Final 版本（15題）內容轉換為本 Repository 的 Package Standard 格式，並依 Sprint 慣例逐題補上 `difficulty`（易／中等／難）欄位。

## 判斷提醒（Flagged, not silently decided）

- **`materialType` 判定為 `TEXTBOOK` 而非 `EXAM`**：原始上傳檔案是課本內容的照片掃描，不是考卷，因此不適用 Original Question Rule；本 Package 的 15 題練習題皆為原創設計並附完整詳解，`questionSource` 誠實標為 `AI_GENERATED`／`origin: "AI"`。
- **第一章與第二章分開建立 Package（`tm_8`／`tm_9`）**：Project Owner 明確要求「第一章與第二章必須分開」，故未合併為單一 Package，各自獨立產出 Round1／Cross Review／Final 與各自的 materialId。
- **逐題 `difficulty` 欄位**：本教材上架時即依 Sprint 跟進慣例（tm_2、tm_5、tm_6 之逐題難度補正）直接於初版納入，15題依實際內容逐題標註「易／中等／難」（分類依據：易＝單一事實或定義的直接回憶；中等＝需計算或掌握單一因果/方向關係；難＝需跨多個概念綜合判斷、或辨析多組容易混淆的敘述組合），分布為易6／中等7／難2。`metadata.json` 的教材整體 `difficulty` 標為「中等」（反映本章橫跨易到難的整體命題難度重心）。
- **`semester` 標示為 `g2s1`（高二上學期）**：依內容判斷（第1章，該冊教材最前段）且與既有慣例（tm_5、tm_6、tm_7 同為「高二＋g2s1」教材）一致。此分類會使 `tests/regression/MaterialCenterRegression.js` 原有的高二上教材筆數斷言需要同步更新，屬於「新增真實教材必然使既有測試基準數字同步變動」的正常維護，已於本次匯入一併完成。

## 練習題總覽（15題，完整題幹／選項／詳解見 `questionbank.json`）

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
