# tm_13 — 竹圍高中高二化學 第一章「物質的特性與化學反應」

- **科目**：化學（高二）
- **學校**：竹圍高中（`zwsh`，本次新增為平台第二間學校，見下方「判斷提醒」）
- **命題範圍**：第一章 物質的特性與化學反應（物質特性與鑑定：純物質/混合物判別、色層分析法；化學反應式平衡與化學計量：三大守恆原則、限量試劑、產率；反應熱與熱化學方程式：ΔH、莫耳生成熱、莫耳燃燒熱、赫斯定律），課本第9～52頁
- **材料類型**：`TEXTBOOK`（課本）
- **原始檔案**（`source/`）：`8f2707a7-竹圍高中高二化學講義與習題重點整理解析文檔.md`——這是 **Gemini 已獨立完成的 Round 1 分析文件**（非課本原始照片/PDF掃描），標註「AI：Gemini／版本：Round 1 Final／日期：2026-09-05」

## ⚠️ 本 Package 產出方式的誠實揭露（請務必詳讀）

與本 Repository其他材料（tm_5～tm_12）的產出方式**不同**：

1. **本次未經 Claude 獨立驗算**。Project Owner 上傳的來源是 Gemini 已經獨立完成的分析文件本身，Claude 手上**沒有課本原始照片或PDF**可供逐題重新計算核對。Project Owner 明確指示「先直接依 Gemini 這份文件內容整理成上架格式」，故本 Package 的全部內容皆直接沿用 Gemini 文件的敘述、計算過程與最終答案，未經 Claude 重新驗算把關。
2. **多數「章末習題」缺少完整的原始題幹與選項文字**。Gemini 的分析文件對「章末習題」多數僅提供「主題摘要＋簡短解題思路＋最終答案代號」，而非逐字的原始題目與五個選項文字（例外：少數如第2、4題附上完整的化學反應式）。因此本 Package 對應題目的 `question` 欄位是**依 Gemini 摘要重新描述的主題與已知條件**，並非逐字原始考題，已在每題內容中以「【依 Gemini 分析文件摘要】」或「原始選項文字未提供」字樣明確標示，絕不假冒為逐字原始題目。
3. **因此本 Package 的每一題皆標記 `needsReview: true`**，`ocrConfidence` 亦刻意壓低（0.5～0.85 區間，反映的是「內容取自二手分析摘要、非直接來源」的不確定性，而非傳統定義的「OCR掃描辨識信心」）。這是誠實作法，而非隨意標記——`manifest.json` 的 `status` 因此為 `pending_review`，尚未達到本 Repository「complete」的認定標準。
4. **本次為平台新增第二間學校「竹圍高中」（`zwsh`）**：先前 `js/data/WorkspaceData.js` 僅有「長榮中學」(cjsh) 一間學校。經 Project Owner 明確指示「正式新增竹圍高中為第二間學校（含登入選項）」，已新增 `zwsh` schoolId、新增 `student_c` 學生帳號（僅授權 zwsh／g2s1，示範跨校資料完全隔離），並讓 Admin 同步取得 zwsh 存取權限；Student A／Student B 的既有授權範圍（僅長榮中學）完全不受影響。

## 判斷提醒（Flagged, not silently decided）

- **`questionSource`／`origin` 判定為 `ORIGINAL`／`"Uploaded Material"`**：雖然本次未逐字轉錄原始題幹（因來源本身即為摘要而非原始掃描），但這些題目的化學內容（化學式、數據、計算方法）本質上仍是「轉錄自課本章末習題」而非「Claude/Gemini原創出題」，故仍歸類為 ORIGINAL／Uploaded Material，而非 AI_GENERATED／AI。
- **`manifest.json` 的 `analysisEngine` 欄位固定為 `"Claude"`**：此為 Schema 目前唯一允許的 enum 值（`["Claude"]`），無法誠實表示「Gemini」；已在此 material.md 中明確揭露實際內容來源為 Gemini 分析文件，`manifest.json` 欄位本身的限制已在 Repository README 中有紀錄。
- **`status: "pending_review"`**：因全部24題皆標記 `needsReview: true`，依 EO-S1.1-003 OCR Rule，本 Package 尚未達到 `complete` 狀態，建議待 Project Owner 後續提供課本原始照片後，由 Claude 逐題重新驗算確認，再更新為 `complete`。
- **新增學校「竹圍高中」(zwsh) 與新學生帳號「Student C」**：這是本 Sprint 首次讓平台支援多間學校，`js/data/WorkspaceData.js` 的變更已同步更新相關 regression 測試（`WorkspaceRegression.js`、`LoginRenameSyncRegression.js`）反映新的學生/學校數量。

## 練習題總覽（24題，完整內容見 `questionbank.json`）

| 題號 | 主題 | 頁碼 | 答案 |
|---|---|---|---|
| 練一練1-(1) | 色層分析Rf值比較 | 9 | Rf(Ag⁺)>Rf(Fe³⁺)>Rf(Cu²⁺) |
| 練一練1-(2) | 色層分析未知液鑑定 | 9 | 含Cu²⁺與Fe³⁺ |
| 練一練2 | 限量試劑與產率（鋁+鹽酸） | 29 | 係數2:6:2:3；0.30mol；產率79.9% |
| 練一練3 | 莫耳生成熱（CuO） | 38 | -155.2 kJ/mol |
| 練一練4 | 赫斯定律（石墨轉鑽石） | 39 | +1.9 kJ |
| 章末習題1 | 純物質判別 | 48 | (E) |
| 章末習題2 | 王水溶金平衡 | 48 | (E) 14 |
| 章末習題3 | 氧化數變化產物判斷 | 48 | (E) NO |
| 章末習題4 | 硫化亞銅+硝酸平衡 | 48 | (D) 52 |
| 章末習題5 | 丙烷完全燃燒計量 | 48 | (C) |
| 章末習題6 | 反應質量計算 | 49 | (B) |
| 章末習題7 | 濃度時間圖表判定 | 49 | (A) |
| 章末習題8 | 混合氣體燃燒 | 49 | (D) 3:2 |
| 章末習題9 | 天然氣爆炸比例 | 49 | (E) 1:10 |
| 章末習題10 | 氣體體積變化 | 49 | (A) |
| 章末習題11 | 阿司匹靈合成產率 | 49 | (D) 10.8g |
| 章末習題12 | 銀器硫化反應 | 50 | (A)(B)(E) |
| 章末習題13 | 熱化學敘述 | 50 | (B) |
| 章末習題14 | 赫斯定律應用 | 50 | (C) |
| 章末習題15 | 莫耳生成熱與燃燒熱 | 50 | (A) |
| 章末習題16 | 未知粉末鑑定 | 51 | 含Na2CO3/BaCl2 |
| 章末習題17 | 反應類型判斷 | 51 | ①②⑤為氧化還原 |
| 素養題1 | 重鉻酸銨熱分解 | 52 | (NH4)2Cr2O7→N2+Cr2O3+4H2O |
| 素養題2 | 電石捕魚化學計量 | 52 | 640g CaC2 |
