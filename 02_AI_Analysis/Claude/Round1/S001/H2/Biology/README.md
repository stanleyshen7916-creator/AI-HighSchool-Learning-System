# S001｜高二生物第1章｜Claude Round 1

## 狀態
`CLAUDE_ROUND1_STATUS = SELF_QA_PASS`
`CLAUDE_ROUND1_SCORE = 98 / 100`
`GEMINI_ROUND1_STATUS = PROVIDED_BY_PROJECT_OWNER`
`CROSS_REVIEW_STATUS = COMPLETE（v1 + v2 候選版評比）`
`FINAL_STATUS = FINAL_PASS`
`FINAL_SCORE = 99 / 100`

## 本目錄用途
保存 Claude 對第1章「生物的起源與演化」之 Round 1 教材分析、Self-QA 工作成果。Gemini 之獨立 Round 1 成果存放於 `02_AI_Analysis/Gemini/Round1/S001/H2/Biology/`。

## 範圍
- 第1章《生物的起源與演化》（1-1 現今生物起源的主要假說／1-2 生物起源的過程／1-3 生命型式的演化歷程），課本 p.1–23。

## 重要記錄
- 使用者曾提供一份標示為「GPT」的檔案，經查核實際內容為另一份不同單元（`docs/TeachingMaterials/materials/tm_5`「細胞膜構造與物質運輸」補充資料）的整理，與第1章無關，**未列入本次 Cross Review**。
- 曾出現的「Final候選A」版本因（a）宣稱整合了無法查證的GPT成果、（b）內共生學說未揭露2011年新解釋、（c）「大考中心命題情境」使用無 Level 2 依據的「必考」語氣，依 Skill v1.0 判定 HARD FAIL，不予採用。

## Quality Gate
- 關卡一（Self-QA ≥95）：Claude 98/100，見 `Claude_BIO_Ch1_Round1.md`。
- 關卡二（Cross Review ≥98）：見 `03_Cross_Review/S001/H2/Biology/Ch1_CrossReview_v1.md`、`Ch1_CrossReview_v2_FinalCandidatesReview.md`。

## 資料流
`原始課本照片 → 02_AI_Analysis/Claude（+Gemini，各自獨立）→ 03_Cross_Review（Claude執行，含候選版評比）→ 03_Cross_Review/.../Ch1_Final_v3_Published.md`

Final 已通過關卡二驗證（99/100，零 HARD FAIL），詳見 `03_Cross_Review/S001/H2/Biology/Ch1_Final_v3_Published.md`。
