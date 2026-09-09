# tm_16 — 長榮中學高二歷史 第2章「歐洲自由與民主的發展」

- **科目**：歷史（高二）
- **學校**：長榮中學（`cjsh`，與 `tm_14`／`tm_15` 同一冊世界史教材，見下方「判斷提醒」關於校名差異的說明）
- **命題範圍**：第2章 歐洲自由與民主的發展（第1節 從宗教改革到啟蒙運動；第2節 十八、十九世紀政治與經濟的新思維），課本約第43～70頁
- **材料類型**：`TEXTBOOK`（課本）
- **原始檔案**（`source/`，共2份）：
  - `HIST_Ch2_EuropeFreedomDemocracy_Final.md` —— 本 Package 的核心分析文件（Final 版，Self-QA 98/100，零 HARD FAIL），採《AI Study Council｜Multi-AI Cross Review Skill》十五大章節（①核心概念～⑮Final Score）格式深度分析本章教材
  - `TriWeb_Council_Round1.md` —— Project Owner 以 Human-in-the-Loop 方式蒐集之 ChatGPT (Web)、Gemini (Web) 獨立分析文件（Tri-Web Council 版），為 Final 版整合三方內容時的原始輸入之一，保留供稽核

## 本 Package 的產出過程（誠實揭露）

本 Package 是一次**跨 AI 整合**的產出，過程分三個階段：

1. **Round 1（Claude 獨立分析）**：Project Owner 提供本章教材原文（MinerU 解析後之 Markdown，共15頁），Claude 依《AI Study Council｜Multi-AI Cross Review Skill》十五大章節格式獨立產出 Round 1 分析（Self-QA 97/100）。
2. **Tri-Web Council（ChatGPT (Web) + Gemini (Web) 獨立分析）**：Project Owner 另以 Human-in-the-Loop 方式，將同一教材原文分別貼給 ChatGPT (Web)、Gemini (Web) 兩個獨立網頁版 AI，取得兩份獨立分析，彙整為「歷史 第二章 Final」文件（即 `source/TriWeb_Council_Round1.md`）。
3. **Final（本 Package，真正的三方整合）**：Project Owner 指示「整合這一份與 claude 所產出的內容，修正優缺點，完成最終版本並上傳到學習平台」。Claude 逐節將 Round 1 與 Tri-Web Council 兩份文件的內容重新比對教材 SOURCE 原文（而非單純拼接文字），過程中發現並修正三項具體問題：
   - **Tri-Web Council 文件 ⑭⑮ 分數自相矛盾**：該文件一方面陳述「Claude (Web) 貢獻 0/13 章節」，另一方面卻列出「Claude (Web) 97」作為自評分數並據此算出「99/100（通過）」——邏輯矛盾，判定為未經實際查核的不實分數，本 Final 不予採用。
   - **Gemini (Web) ⑦作者背景之出版社／課綱來源捏造**：Gemini (Web) 宣稱教材「由台灣歷史教科書編審團隊依據高中108課綱編纂」，經比對 SOURCE 全文查無依據；ChatGPT (Web) 在同一節已正確指出 SOURCE 未提供此類資訊、不應捏造。Final 採 ChatGPT (Web) 之審慎判斷，不採用 Gemini (Web) 該段內容。
   - **Claude Round 1 之亂碼與內容遺漏**：Round 1 ⑬節有一處亂碼／誤植英文字（已修正），且未涵蓋 SOURCE 中「加里波底為薩丁尼亞國王穿上義大利靴子」（義大利統一漫畫）、「臺契爾兜售贖罪券叫賣詞」、「衰廢市鎮」等內容——這些內容經重新查對 SOURCE 原文確認**確實存在**，由 Gemini (Web) 的獨立分析補齊、Claude Round 1 之疏漏，本 Final 已全數併入。

   完整的逐節整合裁決（哪些內容取自何方、如何裁決分歧）詳見 `source/HIST_Ch2_EuropeFreedomDemocracy_Final.md` 之⑭Cross Review章節。

## 判斷提醒（Flagged, not silently decided）

- **校名差異「長榮高中」vs.「長榮中學」**：Project Owner 原始指示中教材 metadata 標註「學校：長榮高中」，但本 Repository 既有 `tm_14`／`tm_15`（同一冊世界史教材前序篇、第1章）皆使用 `school: "cjsh"`（長榮中學）。經判斷本章與 `tm_14`／`tm_15` 顯然是同一套世界史教材的連續章節（皆為高二上、同一出版社課本、序篇→第1章→第2章的自然銜接），故本 Package 沿用 `cjsh`（長榮中學）以維持同一教材的資料一致性，未另外新增「長榮高中」為第三間學校。此為判斷而非確認事實，如與實際校名不符，歡迎 Project Owner 指正後調整。
- **`questionbank.json` 全數為 `AI_GENERATED`／`origin: "AI"`**：與 `tm_13`（原始為考卷摘要，`ORIGINAL`）不同，本教材 SOURCE 原文為敘事性課本內容＋一手史料引文＋開放式討論題（如「玩轉實作坊」人物分析），並未包含任何附選項的正式選擇題／是非題，因此 `questionbank.json` 中的24題全部為 Claude 依教材核心概念、易混淆點、常考題型自行編寫的練習題（`AI_GENERATED`），並非逐字轉錄自教材本身的既有題目，比照 `tm_14`／`tm_15` 之既有慣例。
- **`page` 欄位為 `null`**：教材原文為 MinerU OCR 解析之 Markdown，僅零星可見原始頁碼（如「44」「58」「69」等字樣，穿插於文字段落中，非結構化的頁碼標記），無法可靠地將每一題精確對應至教材原始頁碼，依 Schema「unknown values are null, never guessed or fabricated」原則，本 Package 全數題目之 `page` 欄位誠實標示為 `null`，並於 `metadata.json` 之 `unit` 欄位改以「約第43～70頁」呈現全章的約略頁碼範圍（依可見頁碼字樣43/44、58、69推算），非逐題精確對照。
- **`manifest.json` 的 `analysisEngine` 欄位固定為 `"Claude"`**：此為 Schema 目前唯一允許的 enum 值，無法誠實表示「ChatGPT／Gemini」共同參與；本 Package 內容確實整合了三方 AI 的獨立分析，實際貢獻來源已在 `material.md`（本檔案）與 Final 文件之⑭Cross Review完整揭露，`manifest.json` 欄位本身的限制沿用本 Repository README 既有紀錄的做法處理。
- **`status: "complete"`**：本 Package 不含任何 `ORIGINAL` 類型題目（無 OCR 逐字轉錄需求），24題皆為 `AI_GENERATED` 且內容已逐項比對 SOURCE 核實，故不觸發 OCR Rule 的 `pending_review` 狀態，可直接標記為 `complete`。

## 核心分析文件總覽（十五大章節，完整內容見 `source/HIST_Ch2_EuropeFreedomDemocracy_Final.md`）

本章之完整分析（①核心概念～⑮Final Score）收錄於 `source/` 之 Final 文件，涵蓋：宗教改革、科學革命、啟蒙運動（第1節）；英國君主立憲、美國獨立革命、法國大革命、維也納會議與保守復辟、義大利／德意志統一、工業革命、社會主義與工人運動（第2節）。文件包含完整的重點詞彙表、易混淆概念比較表、常考題型歸納、易錯陷阱清單、跨課連結，以及誠實揭露的三方整合裁決過程（⑭）與逐項自評（⑮，Final Score 98/100，零 HARD FAIL）。

## 練習題總覽（24題，完整內容見 `questionbank.json`）

| 題號 | 節次 | 題目重點 | 答案 |
|---|---|---|---|
| 1 | 第1節 | 臺契爾贖罪券叫賣詞與路德「因信稱義」 | 人能否得救完全依憑上帝恩典 |
| 2 | 第1節 | 路德派、喀爾文派、英格蘭教會辨析 | 喀爾文派主張「預選說」 |
| 3 | 第1節 | 三十年戰爭性質轉變 | 後期轉為法、西爭霸戰場 |
| 4 | 第1節 | 哥白尼提出日心說的動機 | 更真實認識上帝創造宇宙的計畫 |
| 5 | 第1節 | 哥白尼／克卜勒／伽利略貢獻順序 | 提出→數學化→觀測證實 |
| 6 | 第1節 | 歸納法（培根）vs. 演繹法（笛卡兒） | 方向相反 |
| 7 | 第1節 | 洛克／孟德斯鳩／盧梭主張配對 | 天賦人權／三權分立／社會契約論 |
| 8 | 第1節 | 科學革命是否等於反宗教（是非題） | 錯誤 |
| 9 | 第2節 | 英國君主立憲三文件時序 | 大憲章→權利請願書→權利法案 |
| 10 | 第2節 | 「無代表則不納稅」核心訴求 | 賦稅須經人民代表同意 |
| 11 | 第2節 | 邦聯 vs. 聯邦體制差異 | 聯邦具強大中央實權 |
| 12 | 第2節 | 羅蘭夫人／羅伯斯比所屬派系 | 吉倫特派／雅各賓派 |
| 13 | 第2節 | 恐怖統治的結束方式 | 熱月政變，同陣營代表推翻 |
| 14 | 第2節 | 維也納會議的歷史意義 | 保守勢力復辟，非終結自由主義 |
| 15 | 第2節 | 七月革命 vs. 二月革命後政體 | 七月王朝／第二共和 |
| 16 | 第2節 | 加里波底獻靴漫畫意涵 | 南義大利獻入薩丁尼亞版圖 |
| 17 | 第2節 | 俾斯麥「鐵血政策」 | 透過戰爭排除外國勢力統一 |
| 18 | 第2節 | 1846年廢除穀物法之意義 | 自由放任理念的勝利 |
| 19 | 第2節 | 邊沁功利主義核心主張 | 最大多數人的最大利益 |
| 20 | 第2節 | 烏托邦社會主義 vs. 馬克思社會主義 | 體制內改良 vs. 階級革命 |
| 21 | 第2節 | 英國選舉權擴大歷程 | 1832→1867→1884→1918→1928 |
| 22 | 第2節 | 美國憲法三權分立實踐者 | 孟德斯鳩 |
| 23 | 第2節 | 工業革命是否等於資本主義（是非題） | 錯誤 |
| 24 | 第2節 | 《共產主義宣言》核心主張 | 無產階級團結、階級革命 |
