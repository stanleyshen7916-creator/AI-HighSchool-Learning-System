# Architecture_Module_Responsibility_Matrix_v1.0.md

## 目的

Sprint AI-113 AI-809 要求：重新定義八個模組（首頁／教材中心／測驗中心／錯題本／學習總結／
複習中心／我的學習／AI Tutor）的職責，若兩個模組功能完全重疊則直接整合，不得保留重複模組，
並提出正式 Module Responsibility Matrix。

本文件是該 Matrix 的正式紀錄，延續 Platform Refactor Master（PAT 11）與本 Sprint AI-801 對
8 個模組的實際稽核結果 — 逐一比對後確認**沒有兩個模組功能完全重疊**，因此本 Sprint 未執行
任何模組整併；本文件記錄的是「為什麼不整併」的具體、逐項證據，而非未經檢查的結論。

## Module Responsibility Matrix

| 模組 | 主要職責（唯一，不與其他模組重疊的核心工作） | 主要真實資料來源 | 與其他模組的關係 |
|---|---|---|---|
| **首頁**（index.html） | 一站式總覽入口：今日任務／最近教材／學習統計摘要／AI 建議摘要／複習提醒。每個區塊都是「導向」其他模組的摘要卡片，本身不做深入內容 | `MaterialRuntime`／`StatisticsRuntime`／`WrongBookRuntime`（透過 `learningContext()`） | 首頁不重複任何模組的完整功能，只呈現各模組的摘要並連結過去 |
| **教材中心**（materials.html） | 教材的新增／瀏覽／搜尋／篩選／下載／預覽。平台上「教材」這個實體唯一的管理介面 | `MaterialRuntime`（`AHS.MaterialRepository`／`AHS.TeachingMaterialData` 透過 Loader 橋接） | 與學習總結／測驗中心透過教材卡片上的「查看摘要」「開始練習」連結，但內容編輯／管理僅在此 |
| **測驗中心**（quiz.html） | 正式測驗（Exam Mode）與練習模式（Practice Mode）的作答、批改、歷史紀錄。唯一能「作答並取得正確率」的介面 | `QuestionRuntime`／`ExamRuntime`／`AutoGrader`／`HistoryRuntime`／`LearningQuestionRuntime`（LOCK：Practice/Exam 分離） | 產出的錯題進入錯題本，產出的歷史進入 `HistoryRuntime`（供 `StatisticsRuntime` 使用），但測驗中心本身不做複習排程 |
| **錯題本**（wrongbook.html） | 錯題的清單、重新作答、精熟度追蹤（`correctStreak`）。唯一能「針對單一錯題重新練習並更新精熟度」的介面 | `WrongBookRuntime` | 複習中心的「錯題複習」直接連到此頁而非重建功能；我的學習／首頁只顯示錯題「統計數字」，不重建錯題清單 UI |
| **學習總結**（summary.html） | 單一教材的內容摘要（核心概念／重要定義／易錯重點／必背內容／複習建議）。唯一呈現「教材本身內容整理」的介面 | `SummaryRuntime` | 與我的學習／複習中心完全不同：後兩者是「跨教材的個人統計／待辦」，學習總結是「單一教材的內容」，兩者資料模型（`SummaryRuntime` vs `HistoryRuntime`/`WrongBookRuntime`）也不同 |
| **複習中心**（review.html） | 「今日待複習」「已完成複習」的待辦總覽，**以及唯一擁有真實 Review Session 的介面**（Sprint AI-114 AI-901：`AHS.ReviewRuntime` 的 `startSession()`/`answerCurrent()`/`completeSession()` + `AHS.ReviewSession.create()`，不再導向錯題本） | `StatisticsRuntime.dueForReview()`／`ReviewRuntime`／`WrongBookRuntime` | 複習中心「開始今日複習」直接在本頁完成整個複習流程，不再跳轉錯題本；錯題本仍是唯一能「瀏覽全部錯題並自由挑選重做」的介面（AI-902：只複習尚未精熟，不混入今日複習），兩者職責因此更清楚地分離，而非重疊 |
| **我的學習**（learning.html） | 個人學習儀表板：學習總覽／學習記錄／週報告／學習日曆／成就徽章／科目進度，6 個區塊皆為跨教材、跨時間的彙總視角 | `StatisticsRuntime`／`MaterialRuntime`／`LearningStateRuntime`（Sprint AI-113 新增） | 與首頁不同：首頁是「今天要做什麼」的摘要入口，我的學習是「過去累積了什麼」的完整儀表板；兩者刻意保留不同深度，非重複 |
| **AI Tutor**（tutor.html） | 唯一的完整對話式介面（訊息串／建議操作／歷史對話）。其餘頁面透過 Tutor Context Tip（Sprint AI-113 AI-808）只顯示「摘要」並連結回這裡 | `StatisticsRuntime.learningContext()` → `TutorMessage.build()`（單一定義，見下） | 首頁的 AI 巧巧老師卡片與其餘 5 頁面的 Tutor Context Tip 都只呈現同一份訊息的「入口摘要」，完整對話能力只存在於本頁 |

## 判定標準

「功能完全重疊」的判定標準：兩個模組若讀取同一份 Runtime 資料、產出同一種使用者可執行的
動作、且移除其中一個不會讓平台喪失任何唯一能力 — 才視為重疊，需整併。

逐一核對後，8 個模組彼此之間都至少有一項「唯一能力」（見上表最右欄的具體區隔），因此本
Sprint 的結論是：**不執行模組整併**。這與 Platform Refactor Master（PAT 11）針對「學習總結
／我的學習／複習中心」三者的個別調查結論一致（三者職責已個別確認互不重疊），本文件將該
結論擴大到全部 8 個模組並提供逐項對照表。

## 已執行的整合（非模組合併，是重複邏輯收斂）

雖然沒有任何模組被整併，但本 Sprint（AI-113）與前一個 Sprint（Platform Refactor Master）
確實收斂了「同一份資料被多處各自計算」的重複：

- 正確率／Progress／Mastery 的定義統一於 `Architecture_Platform_Terminology_v1.0.md`（PAT 2）。
- AI 建議文字統一由 `AHS.TutorMessage.build()` 產生，8 個模組中有 7 個（首頁＋6 個透過
  Tutor Context Tip／AI Tutor 本身）共用同一份邏輯，無任何模組自行組合建議文字。
- 科目進度「已完成」狀態統一由 `AHS.LearningStateRuntime`（Sprint AI-113 AI-803）判定，
  不再只用單一模組（我的學習）自己的閱讀進度平均值。

## Sprint AI-114 更新（AI-907 重新確認）

Sprint AI-114 建立了複習中心的真實 Review Session（AI-901）後，重新核對本表：複習中心與
錯題本的職責邊界因此變得**更清楚**，不是更模糊——複習中心負責「今日待辦導向的複習流程」，
錯題本負責「瀏覽全部錯題、自由挑選重做」，兩者共用同一個真實資料來源
（`WrongBookRuntime`）與同一個真實作答互動元件（`AHS.WrongBook.buildReviewInteraction()`），
但擁有各自唯一的進入點與情境，因此**沒有功能重疊**，維持「不執行模組整併」的結論不變。

另外，本 Sprint 也將以下計算集中到 `AHS.StatisticsRuntime`（AI-905），移除了原本散落在
`js/components/QuizCenter.js`（最高分／進度／正確率）與 `js/pages/AppReview.js`（今日完成／
本週完成）各自的重複計算，8 個模組的「資訊沒有衝突」（AI-907 自身要求）因此有更強的技術
保證，而非僅止於人工核對。

## Sprint AI-118 更新 — Learning Experience (LX) Refactor（Platform UX Baseline v2.0）

Sprint AI-118 的 Objective 明確排除「模組整併」的討論範圍（LOCK：不修改 Runtime／
Repository／Learning Analytics），本次調整的是**使用流程與 Navigation**，因此上表 8 個模組
「彼此無功能完全重疊」的結論本身不變；改變的是使用者「從哪裡進入」與「用什麼順序走過」
這些模組。逐項更新如下：

- **新 Learning Flow（AI-118-01）**：首頁 → 教材中心 → 學習總結 → 測驗中心 → 錯題本 →
  首頁，形成一個完整 Loop（取代舊版「首頁→教材中心→學習總結→複習中心→測驗中心→
  錯題本」）。
- **我的學習（learning.html）— 移出 Navigation（AI-118-02）**：頁面與其 Runtime 讀取
  （`StatisticsRuntime`／`MaterialRuntime`／`LearningStateRuntime`）維持不變（LOCK），但不再是
  獨立導覽入口；其「今天要做什麼」相關內容（最近教材／今日任務／學習統計／教材完成度／
  AI Tutor 建議）整併進首頁本身的區塊組成，首頁因此從「摘要入口」變成「唯一的每日入口」。
  上表「我的學習 vs 首頁」欄位描述的「兩者刻意保留不同深度」在 Navigation 層級不再適用 ——
  但這是**入口精簡**，不是**模組整併**：`learning.html` 本身、其 Runtime 讀取邏輯、其 6 大區塊
  一律保留，只是不再出現在 Sidebar／Bottom Nav。
- **複習中心（review.html）— 移出 Navigation（AI-118-03）**：同上，頁面與
  `AHS.ReviewRuntime`／`AHS.ReviewSession`（Sprint AI-114 建立的真實 Session）依 LOCK 完整
  保留，僅移除導覽入口；上表原本「複習中心負責今日待辦導向的複習流程，錯題本負責瀏覽
  全部錯題」的職責切分，其入口現在唯一整併到**錯題本**（AI-118-07：錯題本新增「今日待複習」
  單一統計，直接讀 `AHS.StatisticsRuntime.dueForReview()`，取代原本複習中心自算的待辦計數）。
- **學習總結（summary.html）CTA 收斂（AI-118-04/05）**：教材中心卡片的「查看摘要」改稱
  「前往學習總結」且不得直接展開內容（維持「唯一呈現教材內容整理」的職責不變，只是不能
  被繞過）；學習總結頁移除「前往正式測驗」CTA，改為「前往考前練習」／「前往錯題本」，
  使其在 Loop 中的位置更明確地夾在教材中心與測驗中心之間。
- **測驗中心兩種模式重新標籤（AI-118-06）**：`quiz.html` 原有的 Practice/Exam 分離（LOCK，見
  上表第 3 列）UI 標籤改為「考前練習」／「正式測驗」，資料模型與批改邏輯不變。**已知的
  Loop 純度落差（供 Project Owner 判斷）**：教材卡片自身的「前往考前練習」CTA 因既有實作
  （`directExamId` 優先於 `mode=practice`）實際仍會經由 `AHS.ExamRuntime.startFromExam()`
  這條「正式測驗」批改管線，而非 `AHS.LearningQuestionRuntime` 的真練習管線 —— 詳見對應
  EO Report 的「判斷與取捨」章節，本次未依 LOCK 動 Runtime 修正，僅誠實揭露。
- **AI Tutor 推薦流程（AI-118-08）**：`AHS.TutorMessage.build()`（本表原文所述「單一定義」）
  的每個 `actions` 項目新增真實 `href`，固定指向 教材中心→學習總結→考前練習→正式測驗→
  錯題本→（再次）教材中心 這條路徑上的實際頁面，不再是無連結的純文字建議 —— 沿用、未
  新增新的訊息產生邏輯，僅補上導向。
- **Navigation 順序（AI-118-09）**：`AHS.AppConfig.nav.items` 改為
  首頁／教材中心／學習總結／測驗中心／錯題本／AI Tutor／設定／登出（6 個功能入口 + 設定
  + 登出），`nav.bottomItems` 改為首頁／教材／總結／測驗／錯題（5 項）——「我的學習」
  「複習中心」兩個入口從兩處導覽同時移除，其餘 6 個模組彼此的職責邊界（上表主體）不受影響。

**結論延續**：8 個模組「無功能完全重疊」的判定標準與結果不變；本次是 Navigation／Loop／CTA
層級的入口精簡，不是模組整併，`learning.html`／`review.html` 兩頁與其 Runtime 依 Sprint AI-118
的 LOCK 條款完整保留，僅導覽入口收斂。
