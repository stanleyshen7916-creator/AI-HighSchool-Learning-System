# LearningLoopProposal.md — Sprint AI-015B Architecture Design

Pure design document. No code, HTML, Runtime, API, README, or test file was modified to produce this proposal. Every claim about current behavior is grounded in `docs/Architecture/QuestionArchitecture.md` and `docs/Architecture/DependencyGraph.md` (Sprint AI-015A's real, grep-verified audit) — this document does not re-derive facts, it reasons from them.

## Part A — Loop A Analysis (Exam Mode)

```
QuestionBank → QuestionRuntime → AutoGrader → WrongBookRuntime → review.html
```

**優點**
- 唯一真正跨頁「完整銜接」的迴圈——Quiz → Grade → WrongBook → Review 每一步都是真實呼叫鏈，非片段。
- 最成熟穩定：Sprint 4，此 Repository 現存最早、最少變動的 Runtime 群組，`AutoGrader`/`ExamRuntime`/`AnswerRuntime` 的評分機制已被多個後續 EO 間接依賴（`ReviewRuntime.build()` 讀它、`StatisticsRuntime` 讀它）。
- 結構單純：`examId` 為單一定址鍵，資料流無分支。

**缺點**
- 內容 100% 來自 `AHS.Mock.quiz.items`，與任何真實教材、任何 AI 生成完全無關——這是與本 Sprint 目標（AI Question 整合）方向相反的根本限制。
- `QuestionRuntime`/`QuestionBank` 的資料形狀綁定「examId + 固定 exam meta（subject/title/chapter/count/difficulty/type）」，與 Practice Mode 的「materialId 為定址鍵」模型不相容，若要塞入 AI 內容需重新設計定址與資料形狀。
- `review.html` 目前只片面使用這條鏈（`AppReview.js` 直接讀 `HistoryRuntime`+`WrongBookRuntime`，明確聲明不呼叫 `ReviewRuntime.build()`）——真要修好 `review.html` 本身需要額外工作，不是本迴圈現狀就已完整。

**可保留部分**：`AutoGrader`／`ExamRuntime`／`AnswerRuntime` 的評分機制（作為未來「批改」能力的參考實作，非必須直接重用）；`ReviewRuntime.build()` 的 view-model shaping 手法可作範本。

**不可保留部分**：`QuestionBank.generate()`（Mock-Data-only，無法承載 AI 內容）；`QuestionRuntime` 的 examId 定址模型（與教材為中心的模型不符）。

## Part B — Loop B Analysis (Practice Mode)

```
QuestionGenerationFlow → LearningQuestionSession → WrongBookGenerator → ReviewQueue → ReviewModel → ReviewWidget
```

**優點**
- **精神上最貼近本 Sprint 目標**：唯一真正跨頁銜接「Material → Summary → Question → Quiz → WrongBook → Review」精神的迴圈（`materials.html` 的「開始 AI 練習」→ `quiz.html` Practice Mode → 答錯寫入 WrongBook → Review）。
- Review 端具備「錯題感知」的進階概念（`ReviewQueue` 的 `masteryLevel`/`nextReviewAt`/`priority` 結構），比 Loop A 的扁平 WrongBook 更接近正式間隔複習系統的雛型。
- 已有完整 UI 骨架：`QuestionGuide`（巧巧老師出題引導）、`QuestionCard`、Practice List、答對/答錯處理、`ReviewWidget`——這些全部已經是真實、通過測試的程式碼，不需要重新設計互動流程。
- `WrongBookGenerator.add()` 已正確實作「答錯才寫入」規則，且會驗證 `questionId` 對應真實 `LearningQuestionSession` 記錄——資料完整性規則已到位。

**缺點**
- 內容來源是**錯誤的 Summary**：`QuestionGenerationFlow`/`LearningQuestionGenerator` 讀的是頂層 `AHS.SummaryRuntime`（Sprint-5，確定性規則，非 AI、非本 Repository 近期整個 EO-AI-* 系列在建置的 New AI Pipeline）——內容品質與「AI Question」的期待有落差。
- 存在一個死路徑：`LearningPipeline.buildQuestions()` 自動觸發、經 `QuestionGenerator.generateAIQuestion()` 寫入 `LearningQuestionRuntime` 的內容永遠是 `"[Stub] AI 題目尚未產生"`，且 `QuizCenter.isRealLearningQuestion()` 主動把它濾掉——這段程式碼目前對使用者完全不可見，是技術債。
- Review 終點是首頁 `ReviewWidget`，不是 `review.html` 頁面本身——若 PMO／使用者期待「複習中心」看到這些內容，目前並不會。

**可保留部分**：`QuestionGuide`／`LearningQuestionSession`／`WrongBookGenerator`／`WrongBookSession`／`ReviewQueue`／`ReviewModel`／`ReviewWidget` 整條下游骨架——這是本次盤點中最完整、風險最低的「可重用管線」。

**不可保留部分**：`QuestionGenerationFlow`/`LearningQuestionGenerator` 對頂層 `SummaryRuntime` 的內容來源綁定（需替換）；`LearningPipeline`→`QuestionGenerator`→`LearningQuestionRuntime` 這條產出 `[Stub]` 死內容的自動觸發路徑（技術債，是否移除留待未來 Legacy Cleanup 類 EO 決定，非本次範圍）。

## Part C — Loop C Analysis (Material AI)

```
KnowledgeGraphRuntime → QuestionGenerationRuntime → MaterialQuestionCard
```

**優點**
- **三條迴圈中唯一真正「AI」且內容源自真實教材文字**的一條——`QuestionGenerationRuntime` 直接讀 `KnowledgeGraphRuntime` 的真實內容節點，非 Mock、非泛用規則。
- 與 AI Summary Migration 同源（皆消費 `KnowledgeGraphRuntime`，Sprint 8.2 與 EO-AI-* 系列在架構上一脈相承），技術風格與品質標準與本 Repository 近期主線一致。
- 職責單純：`QuestionGenerationRuntime` 是純粹的內容產生器，無 UI、無 Session、無評分邏輯混雜，介面乾淨（`generateQuestions(materialId)`）。

**缺點**
- 完全孤立：零跨頁整合，沒有 Quiz Session、沒有評分、沒有 WrongBook 寫入、沒有 Review 銜接——不是一個「Loop」，只是一個內容產生器。
- 沒有「答對/答錯」判定與記錄機制——`MaterialQuestionCard` 目前僅顯示題目+正解，無使用者作答狀態追蹤。

**可保留部分**：`QuestionGenerationRuntime.generateQuestions()` 本身——這是本次盤點認定品質最高的內容產生源，應作為未來整合的「內容供應端」。

**不可保留部分**：無——此迴圈没有需要捨棄的東西，只是不完整（缺 Session/Grading/WrongBook 銜接），須靠其他迴圈的骨架補足。

---

# Part D — Architecture Proposals

## Proposal A — Exam 為主，AI 擴充

**Architecture Diagram**
```
QuestionBank (擴充: 除 Mock，另支援 AI/Material 來源)
        │
        ▼
QuestionRuntime (擴充: examId 定址 → 需另支援 materialId 定址)
        │
        ▼
ExamRuntime → AnswerRuntime → AutoGrader
        │
        ▼
WrongBookRuntime → review.html
```

**Runtime Flow**：`QuestionGenerationRuntime`（Loop C）的內容需轉譯成 `QuestionBank`/`QuestionRuntime` 的 examId-based 資料形狀後注入，`AutoGrader` 評分邏輯沿用。

**Runtime Reuse**：`AutoGrader`／`ExamRuntime`／`AnswerRuntime`／`WrongBookRuntime`／`review.html` 現狀邏輯。

**Migration Cost**：**高**——`QuestionRuntime`/`QuestionBank` 的資料模型（examId、固定 exam meta）與教材為中心的 AI 內容模型不相容，需重新設計定址層；`review.html`／`wrongbook.html` 的既有 Mock-based UI 假設也可能需要調整以容納教材關聯資訊（chapter/materialId）。

**Regression Risk**：**高**——直接修改 Repository 現存最穩定、最多其他模組依賴（`StatisticsRuntime`／`ReviewRuntime`）的 Sprint 4 Runtime 群組，任何資料形狀變動都有連鎖風險。

**預估 EO 數量**：約 6-8（定址模型重設計、QuestionBank 擴充、AutoGrader 相容性驗證、review.html/wrongbook.html UI 調整、Regression 全面驗證……）。

**是否符合目前 Repository**：**不符合**——`QuestionRuntime.js`／`QuestionGenerator.js` 的既有標頭註解明確將此定位為「Exam Mode 專用、與 Practice/AI 無關」的鎖定架構（"naming flag" 系列註解），擴充等同違反其自身文件化的設計邊界。

---

## Proposal B — Practice 為主，Merge AI

**Architecture Diagram**
```
Material → KnowledgeGraphRuntime → QuestionGenerationRuntime (內容源，來自 Loop C)
        │
        ▼
QuestionGenerationFlow (改接內容源，骨架不變)
        │
        ▼
LearningQuestionSession (不變)
        │
        ▼
QuizCenter Practice Mode (不變)
        │  答錯
        ▼
WrongBookGenerator → WrongBookSession (不變)
        │
        ▼
ReviewQueue → ReviewModel → ReviewWidget (不變)
```

**Runtime Flow**：僅替換 Loop B 最上游的內容來源——`QuestionGenerationFlow`/`LearningQuestionGenerator` 改讀 `QuestionGenerationRuntime`（或未來的 New AI Pipeline Summary）而非頂層 `SummaryRuntime`；下游（Session/WrongBook/ReviewQueue/ReviewModel/ReviewWidget）完全不動。

**Runtime Reuse**：`LearningQuestionSession`／`WrongBookGenerator`／`WrongBookSession`／`ReviewQueue`／`ReviewModel`／`ReviewWidget`／`QuestionGuide`／`QuestionCard`——Loop B 下游全部沿用，這是三個 Proposal 中重用比例最高的一個。

**Migration Cost**：**低**——沿用本 Repository 已在 AI Summary Migration（EO-AI-011～EO-AI-012D）驗證過的「Provider/Dual-run/Migration Bridge」模式：新增一個 Read-only 的內容來源選擇層（類似 `SummaryProvider`），預設仍走舊來源（Rollback 保證），僅在切換後才改走 `QuestionGenerationRuntime`。

**Regression Risk**：**低**——Loop A（Exam Mode）完全不受影響；Loop B 下游程式碼零修改，僅上游來源替換，且該來源替換點（`QuestionGenerationFlow`）本身架構單純（單一函式入口）。

**預估 EO 數量**：約 5（詳見 Roadmap）。

**是否符合目前 Repository**：**符合**——直接複用已被本 Repository AI Summary Migration 證明可行的架構模式（Provider 分流、Read/Generate 分離、Compare/Rollback 保留、Beta Cutover），且不違反任何現存檔案的「naming flag」/LOCK 邊界（`QuestionGenerationFlow`本就是本 Sprint 明確授權可修改的整合點）。

---

## Proposal C — Material AI 為唯一入口，全部重新統一

**Architecture Diagram**
```
Material → KnowledgeGraphRuntime → QuestionGenerationRuntime
        │
        ▼
(新建) Practice Session Runtime  ← 需從零設計：Session/Grading/Navigation
        │
        ▼
(新建或重接) WrongBook Runtime  ← 需決定沿用 WrongBookSession 或全新設計
        │
        ▼
(新建或重接) Review Runtime  ← 需統一 review.html／首頁 Widget／AI Tutor 面板三個消費端
```

**Runtime Flow**：以 `QuestionGenerationRuntime` 為唯一內容源，但其下游（Session/Grading/WrongBook/Review）目前完全不存在對應機制，需要新建或大幅重構 Loop A／Loop B 的下游元件使其能被 Loop C 驅動。

**Runtime Reuse**：僅 `QuestionGenerationRuntime` 本身；下游幾乎無法直接重用（Loop A 的 examId 模型、Loop B 的 SummaryRuntime 綁定皆需拆除重建）。

**Migration Cost**：**最高**——等同重新設計並實作一整條 Session/Grading/WrongBook/Review 管線，同時要處理 `review.html`／首頁 Widget／AI Tutor 面板三個現存 Review 消費端的統一或並存問題。

**Regression Risk**：**最高**——影響面涵蓋 `materials.html`／`quiz.html`／`wrongbook.html`／`review.html`／`index.html` 五個頁面，且需要同時處理三套 Legacy WrongBook/Review 邏輯的去留，遠超本 Sprint「不得修改任何程式」以外任何後續 Sprint 能安全一次完成的範圍。

**預估 EO 數量**：約 15-20 以上（新建 Session Runtime、新建/重接 Grading、新建/重接 WrongBook、統一三個 Review 消費端、五個頁面的 UI 調整、全面 Regression……）。

**是否符合目前 Repository**：**不符合**——直接牴觸 Sprint AI-015／AI-015A／AI-015B 反覆重申的「Reuse 既有 Runtime，不得新增 Runtime，不得建立第二份 Learning Session」原則；本質上是「新建一切」而非「整合既有」。

---

# Part E — Recommendation

**推薦：Proposal B（Practice 為主，Merge AI）**

理由（依 Repository 真實架構，非個人偏好）：

1. **Migration Cost 與 Regression Risk 皆為三者最低**——這不是主觀判斷，而是直接對照 Part D 的 Runtime Reuse 欄位得出：Proposal B 重用 Loop B 下游全部 6 個元件且零修改，Proposal A 需重新設計 Loop A 的定址模型，Proposal C 幾乎無法重用任何下游元件。
2. **唯一不牴觸「不得新增 Runtime」原則的方案**——Proposal A 需擴充 `QuestionBank`/`QuestionRuntime` 的資料模型（實質上是新增能力），Proposal C 需新建 Session/Grading/WrongBook/Review 對應機制；只有 Proposal B 是純粹的「替換一個內容來源函式」，符合 Sprint AI-015 原始 Forbidden 清單「不得新增 Runtime」「Reuse 既有 LearningQuestionSession」的字面要求。
3. **有本 Repository 自己已驗證成功的先例可循**——AI Summary Migration（EO-AI-011 SummaryProvider → EO-AI-012 Migration Bridge → EO-AI-012C Read/Generate 分離 → EO-AI-012D Generate Path Migration → EO-AI-012E/EO-AI-010B 修正真實缺口 → Sprint AI-013 Beta Cutover → Sprint AI-014 Phase 1 Legacy Audit）這一整套「Provider 分流、先建能力再切預設、每步驟用真實資料驗證」的方法論已經在同一個 Repository 裡被證明可行且風險可控。Proposal B 的 Roadmap（Part F）直接沿用此方法論，不是重新發明。
4. **`QuestionGenerationFlow` 本身架構單純、修改面小**——它是一個單一函式入口（`run(materialId, difficulty)`），替換其內容來源（改讀 `QuestionGenerationRuntime` 而非 `SummaryRuntime`）是局部、可獨立驗證的變更，不牽動 UI、不牽動 Session/WrongBook/Review 的資料形狀。

Proposal A 被排除，因為它要求修改 Repository 現存最穩定、被最多其他模組依賴的 Sprint 4 Runtime 群組，且其資料模型（examId 定址）與教材為中心的 AI 內容模型存在根本性不相容，並非「擴充」可以低風險達成。

Proposal C 被排除，因為它本質上是「捨棄現有兩條迴圈的下游、只留內容產生器」，這既牴觸「不得新增 Runtime」的明文禁止，也讓 Migration Cost 與 Regression Risk 雙雙落在不可接受的範圍，且尚未處理三個 Review 消費端如何統一這個更根本的問題（本身可能需要獨立於本次整合的另一個 Sprint 來解決）。

---

# Part F — Roadmap（若採用 Proposal B）

見 `docs/Architecture/LearningLoopRoadmap.md` 的完整 Phase 拆分。
