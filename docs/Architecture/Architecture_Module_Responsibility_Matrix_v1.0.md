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
| **複習中心**（review.html） | 「今日待複習」「已完成複習」等待辦導向的複習佇列，唯一的複習行動入口 | `StatisticsRuntime.dueForReview()`／`WrongBookRuntime` | 複習中心本身不重新顯示錯題內容或統計圖表全貌，只做「待辦」導向，實際複習動作導到錯題本 |
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
