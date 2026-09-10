# tm_17 — 長榮中學高二地球科學講義「地球的歷史」＋「天文」

- **科目**：地球科學（高二）——**本平台第10個支援科目**（見下方「判斷提醒」）
- **學校**：長榮中學（`cjsh`，與 `tm_14`／`tm_15`／`tm_16` 同一間學校）
- **命題範圍**：地球的歷史（主題1 地球的起源與演化；主題2 相對地質年代與絕對地質年代）＋天文（主題3～11：恆星的亮度光度與顏色、太陽系、地球防護罩與適居性、宇宙結構與宇宙膨脹、天球中的天體、多波段星空觀測及限制、周日運動與不同緯度的星空、周年運動、四季變化）
- **材料類型**：`TEXTBOOK`（講義）
- **原始檔案**（`source/`，共3份文件＋`source/scans/`內15份原始掃描PDF）：
  - `Claude_EARTHSCI_EarthHistAstro_Round1.md` —— Claude 獨立產出之 Round 1 分析（Self-QA 96/100，未附圖片時期之版本，保留為歷史紀錄，未回溯修改）
  - `TriWeb_Council_EarthSci_Round1.md` —— Project Owner 以 Human-in-the-Loop 方式蒐集之 ChatGPT (Web)、Gemini (Web)、Claude (Web) 三方獨立分析彙整摘要（完整逐字內容於對話中貼入，未另存原始檔，本檔案為處理摘要與稽核索引）
  - `EARTHSCI_EarthHistAstro_Final.md` —— 本 Package 的核心分析文件（Final 版，二次修訂後 Self-QA 99/100，零 HARD FAIL），整合以上兩份輸入、逐節重新比對 SOURCE 後產出，並於二次修訂時依原始掃描圖片核實修正一項內容
  - `scans/` —— Project Owner 於 2026-09-10 補充提供之講義原始掃描 PDF，共15份（part1～part15，涵蓋講義全22頁），用於核實 MinerU OCR 文字無法可靠呈現的圖表、照片與表格內容

## 本 Package 的產出過程（誠實揭露）

本 Package 是一次**跨 AI 整合＋圖片核實**的產出，過程分四個階段：

1. **Round 1（Claude 獨立分析）**：Project Owner 提供本講義原文（MinerU 解析後之 Markdown，共22頁），Claude 依《AI Study Council｜Multi-AI Cross Review Skill》十五大章節格式獨立產出 Round 1 分析（Self-QA 96/100），並誠實標示本回合未附圖片、依賴圖片幾何資訊之題目一律不猜測作答。
2. **Tri-Web Council（ChatGPT (Web) + Gemini (Web) 獨立分析）**：Project Owner 以 Human-in-the-Loop 方式，將同一講義原文分別貼給 ChatGPT (Web)、Gemini (Web) 兩個獨立網頁版 AI（連同 Claude (Web) 之獨立版本），彙整為「地球科學 講義 Final」文件。
3. **Final 初版（本 Package，三方整合）**：Claude 逐節將 Round 1 與 Tri-Web Council 文件的內容重新比對講義 SOURCE 原文，過程中發現並修正兩項具體問題：
   - **Gemini (Web) ⑥文化脈絡的科學史事實錯誤**：Gemini (Web) 原文寫「16世紀哥白尼、伽利略與克卜勒透過天文望遠鏡實測與數學計算推翻托勒密體系」——經查證此為錯誤：望遠鏡遲至1608年才發明，哥白尼（1543年出版《天體運行論》）不可能透過望遠鏡實測；伽利略實際使用望遠鏡觀測是1609年之後（17世紀初）；克卜勒的行星運動定律則是根據第谷．布拉赫的肉眼觀測數據推算而得。Final 版本已重新查證科學史時序後改寫此段。
   - **Gemini (Web) ⑦作者背景之課綱／出版社來源捏造**：Gemini (Web) 宣稱「本講義依據台灣教育部108課綱地球科學核心素養編寫……長榮高中高二選修/必修複習採用此版本」，經比對 SOURCE 全文查無依據；ChatGPT (Web) 在同一節已正確指出「SOURCE 沒有提供明確作者姓名、編者姓名、出版社、正式版本資訊，因此不自行推測」。Final 採 ChatGPT (Web) 之審慎判斷，不採用 Gemini (Web) 該段內容，並在文件中明確註記：**這是 Gemini (Web) 在同類 Tri-Web Council 文件⑦章節第二次出現同類型捏造**（前一份「長榮高中歷史第二章」文件之⑦亦捏造「台灣歷史教科書編審團隊依據108課綱編纂」），屬重複性系統風險，非單一事件。
4. **Final 二次修訂（本次，依原始掃描圖片核實）**：Project Owner 補齊講義全部15份原始掃描 PDF（見`source/scans/`）後，Claude 逐份讀取原始圖片，核對先前因 MinerU OCR 亂碼而標示【需確認】的內容，**發現並更正了 Claude 自身先前的一項誤判**：Round 1／初版 Final 皆曾誤以為「地球自轉軸傾斜25度」與教材其餘多處「23.5度」是 SOURCE 自身的矛盾；經圖片核實，第26頁「太陽系的行星」比較表明確顯示「自轉軸傾斜25度」一段實際對應的是**火星**而非地球（地球欄位僅有「我們住的這一顆」一句），且第60頁另有一題獨立的「打鐵趁熱」原本就正確地將25度歸屬於火星，兩項圖片證據互相印證，證明這從來不是 SOURCE 的矛盾，而是 Claude 先前對 OCR 錯位段落的誤判。此更正已完整記錄於 `source/EARTHSCI_EarthHistAstro_Final.md` 開頭修正記錄第5點與⑭Cross Review，Final Score 由 98/100 更新為 99/100。

   完整的逐節整合裁決詳見 `source/EARTHSCI_EarthHistAstro_Final.md` 之⑭Cross Review章節。

## 判斷提醒（Flagged, not silently decided）

- **【本次最重要的判斷】新增「地球科學」為平台第10個支援科目**：本教材上架前，平台僅支援9個固定科目（國文/英文/數學/物理/化學/生物/歷史/地理/公民與社會），程式碼中甚至有明確註解以「地球科學」為例說明「目前無法安全渲染的未知科目 key」。經與 Project Owner 確認後，已正式新增 `earthscience`（地球科學）為第10個科目：
  - `js/core/Icons.js`：`AHS.Subjects` 新增 `earthscience: { name: "地球科學", varName: "--subj-earthscience", hex: "#92400e" }`
  - `css/base/tokens.css`：新增 `--subj-earthscience: #92400e;`（棕色系，呼應「地球」意象，與既有9科顏色不重複）
  - `js/data/AppConfig.js`：`materials.subjectCounts` 與 `wrongBook.subjectOptions` 皆新增地球科學項目；`quiz.subjects` 因既有機制（`QuizCenter.js` 的 `mergedListData()`）會自動將 `AHS.Subjects` 中任何真實存在的科目 key 動態併入篩選清單（既有的「公民與社會」即是如此運作），故不需手動修改。
  - 已確認 `npm run verify`／`npm test` 全數通過，新增科目未破壞既有9科的任何既有行為。
- **校名差異「長榮高中」vs.「長榮中學」**：Project Owner 原始指示中教材 metadata 標註「學校：長榮高中」，但比照 `tm_14`／`tm_15`／`tm_16` 之既有慣例（皆使用 `school: "cjsh"` 長榮中學），本 Package 沿用 `cjsh`，未另外新增第三間學校。
- **`semester` 標示為 `g2s1`（高二上）**：教材 metadata 僅標註「年級：高二」，未指明學期；比照平台目前所有「高二」教材皆屬 `g2s1` 之既有慣例，本 Package 沿用此假設，如與實際開課學期不符，歡迎 Project Owner 指正後調整。
- **`questionbank.json` 全數為 `AI_GENERATED`／`origin: "AI"`**：講義原文雖含大量「打鐵趁熱」「小試身手」練習題，但其中多數附選項的題目（如星跡圖判讀、晝夜分布圖等）依賴原始圖片幾何資訊，本回合初版時並未取得對應圖片，為避免捏造答案，`questionbank.json` 中的25題（含二次修訂時依原始掃描圖片新增之第25題）全數為 Claude 依教材核心概念、易混淆點、常考題型自行編寫的練習題（`AI_GENERATED`），並附教材原文可驗證之標準答案邏輯，比照 `tm_14`／`tm_15`／`tm_16` 之既有慣例。
- **`page` 欄位為 `null`**：教材原文為 MinerU OCR 解析之 Markdown，頁碼標記極為零星且不成結構化格式，無法可靠地將每一題精確對應至教材原始頁碼，依 Schema「unknown values are null, never guessed or fabricated」原則，本 Package 全數題目之 `page` 欄位誠實標示為 `null`。
- **`manifest.json` 的 `analysisEngine` 欄位固定為 `"Claude"`**：此為 Schema 目前唯一允許的 enum 值；本 Package 內容確實整合了三方 AI 的獨立分析，實際貢獻來源已在本檔案與 Final 文件之⑭Cross Review完整揭露。
- **`status: "complete"`**：本 Package 不含任何 `ORIGINAL` 類型題目，25題皆為 `AI_GENERATED` 且內容已逐項比對 SOURCE 核實，不觸發 OCR Rule 的 `pending_review` 狀態，可直接標記為 `complete`。

## 核心分析文件總覽（十五大章節，完整內容見 `source/EARTHSCI_EarthHistAstro_Final.md`）

本講義之完整分析（①核心概念～⑮Final Score）涵蓋：地球的起源與演化（大氣三階段演變、地球分層、除碳作用、顯生元與生物大滅絕）、相對與絕對地質年代（四大定律、放射性定年法）；恆星亮度光度顏色、太陽系（含依原始掃描圖片核實之八大行星逐項特點）、地球防護罩與適居性、宇宙結構與大霹靂學說、天球、多波段觀測、周日運動、周年運動、四季變化。文件包含完整的重點詞彙表、易混淆概念比較表、常考題型歸納、易錯陷阱清單、跨課連結，以及誠實揭露的整合裁決過程（⑭，含一項科學史事實修正、一項來源捏造駁回、一項 Claude 自身誤判之更正）與逐項自評（⑮，Final Score 99/100，零 HARD FAIL）。

## 練習題總覽（25題，完整內容見 `questionbank.json`）

| 題號 | 節次 | 題目重點 | 答案 |
|---|---|---|---|
| 1 | 主題1 | 地球分層構造的驅動力 | 密度分異（鐵鎳下沉、矽酸鹽上浮） |
| 2 | 主題1 | 大氣三階段演變順序 | 太陽星雲氣體→火山釋氣→海氣生物交互作用 |
| 3 | 主題1 | 除碳作用三途徑辨析 | 不含「逸散至外太空」 |
| 4 | 主題1 | 帶狀鐵礦與氧氣延遲累積 | 先與鐵離子反應沉積 |
| 5 | 主題1 | 海洋形成年代推知方式 | 用最古老沉積岩反推 |
| 6 | 主題2 | 標準化石 vs. 指相化石 | 年代 vs. 環境 |
| 7 | 主題2 | 包裹體定律應用 | 被包裹者較早形成 |
| 8 | 主題2 | 均變說核心主張 | 現在是通往過去的鑰匙 |
| 9 | 主題2 | 半衰期比例反推 | 母子1:7 → 3個半衰期 |
| 10 | 主題2 | 放射性定年法極限 | 碳14不能定年40億年前鑽石 |
| 11 | 主題1 | 生物上陸與臭氧層（是非題） | 正確 |
| 12 | 主題3 | 亮度與光度定義 | 光度本身發光；亮度受距離影響 |
| 13 | 主題3 | 距離模數判斷遠近 | m>M → 距離>10pc |
| 14 | 主題3 | 星等差與亮度倍率 | 差5等→100倍 |
| 15 | 主題3 | 恆星顏色 vs. 行星顏色成因 | 溫度 vs. 化學組成 |
| 16 | 主題3 | 太陽演化顏色變化 | 黃→紅降溫；紅→白升溫 |
| 17 | 主題4 | 太陽星雲學說（類地行星成因） | 內側溫度高，留住高熔點物質 |
| 18 | 主題4 | 柯伊伯帶 vs. 歐特雲 | 環狀 vs. 球殼狀分布 |
| 19 | 主題4 | 彗星離子尾方向（是非題） | 錯誤（永遠背離太陽） |
| 20 | 主題6 | 大霹靂學說證據辨析 | 不含范艾倫輻射帶 |
| 21 | 主題6 | 宇宙學紅移 vs. 都卜勒紅移 | 空間膨脹 vs. 星體運動 |
| 22 | 主題10 | 恆星日 vs. 太陽日 | 太陽日較長，多4分鐘 |
| 23 | 主題11 | 四季變化主因（是非題） | 錯誤（主因為地軸傾斜） |
| 24 | 主題11 | 極圈緯度計算 | 90°－25°＝65° |
| 25 | 主題4 | 太陽系比較表「自轉軸傾斜25度」歸屬（依原始掃描圖片新增） | 火星（非地球） |
