# Foundation_QA_Report — EO-S8.0-001（PMO Final Decision）

## Foundation 專屬：tests/regression/KnowledgeFoundationV1.js — **38 PASS / 0 FAIL**

### Decision 1 · Document Classifier
教材/考卷/筆記/解答 正確辨識；**無法判定固定輸出 other（signal="none"，不得猜測）**；不由 UI 分類欄位決定（考卷 category='講義' 仍判 exam）。實作僅用檔名／副檔名／metadata —— 零 OCR、零 LLM、零 Parser、零 AI。

### Decision 2 · Knowledge Graph Skeleton
允許六型白名單；**七類內容節點逐一反證拒收**（knowledge_point／definition／formula／keyword／concept／exam_point／explanation）；Skeleton 正確建立 source_file＋document_type＋subject＋chapter；無資料時 sourcePage／sourceParagraph 固定 null；缺 sourceFileId 拒收；多檔共建單一圖譜。

### Decision 3 · AnalysisRuntime + Summary Schema v2
七段 Schema 齊備且**向下相容**（含 LOCK 五段中三段同名，擴充四段）；`analyze()` **不產生 Summary**，誠實回報 `pending_analysis_pipeline` 且零記錄儲存；`store()` 拒絕無法追溯之自由生成內容。**SummaryRuntime 維持 LOCK、byte-identical**。

### Decision 4 · Question Mode A
Repo 出貨**零預設題庫**；非考卷檔 ingest 拒收；原題逐字保留；**API 無 update／edit／enhance／rewrite／fix**（AI 修改/美化/修正結構上不可能）；預留 knowledgeId／sourceFileId／sourcePage／sourceParagraph 四欄（允許 null，待 KG 完成串接）；Random／Chapter／Difficulty／Count 選題可用。

### Decision 5 + Decision 019 · Foundation Only
Pipeline 收束於 `awaiting_analysis_pipeline`（教材）／`exam_bank`（考卷，不得重新產題）；**Metadata → Question 禁止**：全程零題產生；**Material → Question 禁止**：以原始碼掃描驗證 KnowledgePipeline.js 內無任何產題程式；process() 無 difficulty 參數；material 不存在即 failed 停止。AnswerBuilder 為 Interface Only，Skeleton 階段誠實回報「缺少完整解答」＋ missing 清單，零猜測。AI Provider 固定四家、合約驗證、`getActive()` 恆 null、全庫零 fetch/XHR。

## Regression（零回歸）
jsdom **107/107**｜ReviewModel 10/10｜WrongBookFoundation 37/37｜GenerationFlow 18/18｜QuestionFoundation 29/29｜Pipeline 6/6｜InitializationGuard 6/6｜html5validator 10 頁 **0 errors**｜VerifyPaths／VerifyForbiddenPatterns **PASS**｜**Console Error = 0**（Foundation 未接線，頁面零變更）。

## LOCK Runtime byte-identical
既有 js 檔案差異數 = **0**（diff 僅含新檔）；Material／Summary／LearningQuestion／WrongBook／Review 全部 LOCK Runtime 逐位一致。
