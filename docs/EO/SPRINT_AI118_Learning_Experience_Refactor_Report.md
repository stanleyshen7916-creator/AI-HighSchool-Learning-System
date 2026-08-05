# Sprint AI-118 — Learning Experience (LX) Refactor Report

Spec: Sprint AI-118｜Learning Experience (LX) Refactor, Status READY, Priority Highest.

Objective confirmed honored: 本 Sprint 僅重構使用流程／Navigation／UX／Page Responsibility／
CTA，未新增任何 AI 功能、未串接任何 API、未修改 Teaching Material Repository 內容。LOCK 確認
遵守：`js/runtime/`（`QuestionRuntime.js`／`ExamRuntime.js`／`AutoGrader.js`／
`LearningQuestionRuntime.js`／`WrongBookRuntime.js` 等）、`docs/TeachingMaterials/` Repository
內容、`js/runtime/StatisticsRuntime.js` 本身的計算邏輯、`playwright/config/`、
`.github/workflows/` 全部逐一檢查後確認零修改 —— 本 Sprint 觸碰的 `js/components/QuizCenter.js`
／`js/components/WrongBook.js` 屬於 UI／Component 層（CTA 標籤／統計呈現），非 LOCK 條款所指的
Runtime 層，詳見下方「判斷與取捨」。

## Learning Experience Report

| Item | Result |
|---|---|
| AI-118-01 重新定義 Learning Flow | PASS |
| AI-118-02 移除「我的學習」入口，整併首頁 | PASS |
| AI-118-03 取消「複習中心」入口，Runtime/Session/Page 保留 | PASS |
| AI-118-04 教材卡片「前往學習總結」CTA | PASS |
| AI-118-05 學習總結 CTA 重組 | PASS |
| AI-118-06 測驗中心兩種模式標籤 | PASS（附帶已知落差，見下） |
| AI-118-07 錯題本聚焦弱點修正、統計走 StatisticsRuntime | PASS |
| AI-118-08 AI Tutor 推薦流程固定（真實連結） | PASS |
| AI-118-09 Menu 排序 | PASS |
| AI-118-10 首頁「今天要做什麼」最終組成 | PASS |
| AI-118-11 UX Audit（重複功能/資訊/統計/矛盾） | PASS |
| AI-118-12 Playwright Learning Flow E2E | PASS |
| AI-118-13 Snapshot QA Baseline 重建 | PASS |
| AI-118-14 LearningFlowRegression.js | PASS（42/42） |
| AI-118-15 Deliverables | PASS |
| Verify | PASS |
| Test（含 LearningFlowRegression） | PASS |
| QA Dashboard | PASS |
| GitHub Actions | PASS（`QA Automation Framework` run [30988800426](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/30988800426)，commit `6f01b8f8`） |
| Deployment | PASS（GitHub Pages `pages build and deployment` run [30988799838](https://github.com/stanleyshen7916-creator/AI-HighSchool-Learning-System/actions/runs/30988799838)，commit `6f01b8f8`） |
| Merge Commit | `6f01b8f815fd96f6a3c79b29c56a9b3f3b01a7ce`（PR #47，merged into `main`） |

## Detail per item

**AI-118-01 重新定義 Learning Flow** — 新 Loop：首頁 → 教材中心 → 學習總結 → 測驗中心 →
錯題本 → 首頁。這是 Navigation 排序（AI-118-09）與各頁 CTA（AI-118-04/05/06/07/08）共同組成
的結果，沒有新增獨立的「Flow 控制」程式碼 —— 每一步都是使用者透過真實 CTA 點擊完成，並由
`playwright/tests/learning-flow.spec.js`（AI-118-12）逐步驗證整條 Loop 真的走得通。

**AI-118-02 移除「我的學習」** — `js/data/AppConfig.js` 的 `nav.items`／`nav.bottomItems`
移除 `learning` 項目；`js/pages/AppHome.js` 新增首頁區塊取代其「今天要做什麼」相關內容：
最近教材（既有 `HomeRecentMaterials`）、今日任務（既有 `TodayMission`）、學習統計（新增
`js/components/MaterialCompletionOverview.js`，讀取 `AHS.StatisticsRuntime.subjectAnalytics()`
——與 `learning.html` 自己的科目進度區塊讀同一函式，不是第二套計算）、AI Tutor 建議（既有
`AiTutorHomeCard`）。`learning.html` 頁面本身、`js/components/MyLearning.js`
與其 6 大區塊完全未修改（LOCK：Learning Analytics 不得修改）——僅移除導覽入口，非刪除頁面
或功能。舊有首頁區塊 `StudyStats`／`StudyPlan`／`AchievementBadges`／`LearningTime`／
`ContinueLearning` 的 `<script>` 標籤從 `index.html` 移除（與 AI-118-10 首頁最終組成合併執行，
見下）；對應 `.js` 檔案本身保留在檔案系統中未刪除（僅 `index.html`／`dashboard.html`／
`learning.html` 曾引用，逐一 grep 確認後三者皆已不再引用，刪除檔案屬於此 Sprint UX/Navigation
範圍之外的清理工作，未在本次一併執行，如需清理留待下個 Sprint）。

**AI-118-03 取消「複習中心」** — 同上模式：`nav.items` 移除 `review`；`review.html`／
`AHS.ReviewRuntime`／`AHS.ReviewSession`（Sprint AI-114 建立的真實 Session：`startSession()`／
`answerCurrent()`／`completeSession()`）完全未修改。所有入口整併到錯題本：錯題本新增
「今日待複習」單一統計（見 AI-118-07）取代複習中心原本自算的今日待辦數字。

**AI-118-04 教材卡片 CTA** — `js/ui/MaterialCard.js` 的 `summaryLink` 標籤／`data-tip`／
`aria-label` 由「查看摘要」改為「前往學習總結」，`href` 不變（仍是 `summary.html?materialId=`），
不再有任何行內展開摘要內容的互動——原本就沒有行內展開邏輯，本項要求已天然滿足，僅更新
標籤使其名實相符。同時移除卡片上獨立的「預覽教材」圖示按鈕（HOTFIX-009 既有修正，本 Sprint
未變動）。

**AI-118-05 學習總結 CTA 重組** — `js/components/SummaryCenter.js` 的 `summaryFooter()`：
保留重點整理／易錯觀念／考前十分鐘／AI Tutor 建議（`aiGenerateEntry` 亦保留，未在移除清單
內）；移除「前往正式測驗」CTA（`examLink`，原 `href="quiz.html"`）；「開始 AI 練習」改標籤為
「前往考前練習」（`href` 不變：`quiz.html?mode=practice&materialId=...`）；新增「前往錯題本」
CTA（`wrongBookLink`，`href="wrongbook.html"`）。CSS class `.sum-footer__exam` 全部改名
`.sum-footer__wrongbook`（`js/components/SummaryCenter.js`／`css/pages/summary.css` 同步）。

**AI-118-06 測驗中心兩種模式** — `js/components/QuizCenter.js` 的 `examTab`／`practiceTab`
標籤改為「考前練習」（原「練習模式」）／「正式測驗」（不變），兩者新增 `data-tip` 說明真實
特性（可重複/立即解析/不計成績 vs 固定題序/固定時間/永久保存），CSS 沿用 `material.css` 既有
`[data-tip]` tooltip pattern（`css/pages/quiz.css` 新增對應區塊）。

**已知落差（誠實揭露，非隱瞞）**：教材卡片自身的「前往考前練習」CTA
（`quiz.html?mode=practice&examId=teaching_material_<id>`）因既有實作
`directExamId` 優先於 `mode=practice` 判斷，實際仍會經由 `AHS.ExamRuntime.startFromExam()`
這條「正式測驗」批改管線寫入 `WrongBookRuntime`／`HistoryRuntime`，而非
`AHS.LearningQuestionRuntime` 支撐的真練習管線（`summary.html` 自己的「前往考前練習」CTA，
`quiz.html?mode=practice&materialId=...`，不帶 `examId`，才會走上真練習管線）。本 Sprint
**未**修改這段既有路由邏輯——這屬於 Runtime 層行為（`ExamRuntime.startFromExam` 的優先序判斷），
修改它會牴觸本 Sprint 自己的 LOCK（不得修改 Runtime）。若要讓教材卡片的「前往考前練習」
真正只用 `materialId`（不帶 `examId`），目前所有真實已上傳教材（`tm_1`～`tm_4`）都只存在於
`QuestionRuntime`、從未寫入 `LearningQuestionRuntime`，切換後會導致這 4 筆真實教材在按下
「前往考前練習」後看到空狀態——為了不犧牲真實資料的可用性，本 Sprint 選擇保留現況、如實
揭露這個不對稱，留給 Project Owner 判斷是否要開一個新 Sprint 處理（可能需要修改 Runtime，
超出本次 LOCK 範圍）。

同樣被評估、最終撤回的項目：`buildPracticeListView()` 曾嘗試加入 Fisher-Yates 隨機排序以滿足
「題號亂數」字面要求，但發現 `tests/jsdom/BehaviorSuite.js` 內多個既有測試假設「畫面題目順序
＝`LearningQuestionRuntime.findByMaterialId()` 的原始儲存順序」（例如 `openRow(idx)` 輔助函式），
隨機排序會使這些測試變得不穩定/錯誤。已撤回隨機排序，改以程式碼註解誠實記錄此範圍取捨，
未静默省略。

**AI-118-07 錯題本聚焦弱點修正** — `js/components/WrongBook.js`：`SUMMARY_DEFS`
由 4 項（總數／尚未精熟／已精熟／我的最愛）縮減為 1 項「今日待複習」，`summaryCounts()`
改為呼叫 `AHS.StatisticsRuntime.dueForReview().length`（StatisticsRuntime 未載入時有同規則的
本地備援 `correctStreak < 3`，非第二套邏輯）。`headerBlock()` 標籤：「全部重新複習」→
「全部重新練習」、「我的最愛」→「收藏」（行為不變）。`css/pages/wrongbook.css` 的
`.wb-summary` grid 由固定 4 欄改為 `repeat(auto-fit, minmax(200px, 240px))` 因應統計項目減少。

**AI-118-08 AI Tutor 推薦流程固定** — `js/utils/TutorMessage.js` 的 `build()` 每個
`actions.push(...)` 呼叫新增真實 `href`（原本只有文字標籤、無連結）：
`dueForReview`→錯題本、`completedMaterial`/`nextMaterial`→教材中心（帶 `id`）、
`allComplete`→正式測驗、`weakestSubject`→考前練習、`recommendedRetest`→重新測驗（帶
`examId` 若有）。`js/components/AiTutorHomeCard.js` 的 `actionTile()` 在 `action.href` 存在時
渲染真實 `<a href>`（原本一律是無作用的 `<button>`），無 `href` 時維持原按鈕行為向下相容。
CSS `.tutor-card__tile` 補上 `color: inherit; text-decoration: none;` 避免 `<a>` 預設藍色
底線樣式造成視覺回歸（實作時主動發現並修正，未等測試抓到才補）。

**AI-118-09 Menu 排序** — `js/data/AppConfig.js`：`nav.items` 改為
`[home, materials, summary, quiz, wrongbook, tutor]`（+設定/登出，UI 固定不在此陣列）；
`nav.bottomItems` 改為 `[home, materials, summary, quiz, wrongbook]`（5 項，Bottom Nav
既有 5 格慣例維持不變——Sidebar 有 6 項而 Bottom Nav 維持 5 項是延續既有慣例的判斷，非規格
明文要求，特此揭露）。

**AI-118-10 首頁最終組成** — `js/pages/AppHome.js`：移除 `buildStudyStatsModel()`／
`buildTodayMinutesModel()`／`buildContinueLearningModel()`；`main` 欄位精簡為
`[hero, HomeRecentMaterials, MaterialCompletionOverview]`；`rail` 精簡為
`[TodayMission, ReviewWidget, AiTutorHomeCard]`（移除 AchievementBadges／LearningTime／
ContinueLearning）。首頁最終只保留：今日任務／最近教材／教材完成度／待複習／AI Tutor，
符合規格「不得重複資訊/統計/教材」要求。

**AI-118-11 UX Audit** — 逐項核對後找出並處理的重複：(1) 首頁與我的學習曾同時呈現「學習時數」
「連續學習天數」等統計——已隨 AI-118-02 移除首頁側的重複呈現，我的學習頁保留（Analytics
LOCK）；(2) 複習中心與錯題本曾同時呈現「今日待複習」數字——已隨 AI-118-03/07 整併為錯題本
唯一入口；(3) 學習總結與教材中心卡片曾同時可「開始練習」——已將教材中心卡片統一導向學習
總結（AI-118-04），避免兩個並行入口各自導向不同管線（見 AI-118-06 已知落差段落）；(4) 測驗
中心「練習模式」標籤與學習總結「開始 AI 練習」用語不一致——已統一為「考前練習」。無發現
其餘互相矛盾的資訊呈現。

**AI-118-12 Playwright Learning Flow E2E** — 新增 `playwright/tests/learning-flow.spec.js`：
於 `materials.html` 用真實管線（`AHS.AITutorService.ensureQuestionSet()` →
`AHS.QuestionProviderBridge.bridge()`，與 `tests/jsdom/BehaviorSuite.js` 自己的
`seedProductionQuestions()` 同一條路徑）產生真練習題，接著依序真實點擊走完
首頁（Nav 檢查＋`.home-completion` 可見）→教材中心（點 `.mat-card__summary-link`）→學習總結
（驗證重點整理／易錯觀念、確認「前往正式測驗」CTA 已不存在、點 `.sum-footer__quiz`）→
考前練習（點選難度／開始／作答，驗證 `.quiz-practice__result` 立即顯示）→正式測驗（透過
`page.evaluate()` 呼叫真實 `QuestionRuntime.importQuestions`／`ExamRuntime.startFromExam`／
`AnswerRuntime.saveAnswer`／`ExamRuntime.finish`／`AutoGrader.grade`／`WrongBookRuntime.sync`／
`HistoryRuntime.record`，與既有 `assessment-scenario.spec.js` 相同的既定模式，因為目前沒有
真實的雙模式 Package 目錄可供點擊觸發正式測驗）→錯題本（驗證「今日待複習」數字與
`StatisticsRuntime.dueForReview()` 相符，驗證「全部重新練習」／「收藏」按鈕存在）→首頁
（驗證 AI Tutor 推薦連結為真實 href、非 `#`，驗證教材完成度百分比與 `subjectAnalytics()`
相符）。全程監控 `pageerror`／console error，斷言為空陣列。本地重複執行 3 次確認穩定
（非偶發通過）。

**AI-118-13 Snapshot QA Baseline 重建** — `playwright/tests/snapshot.spec.js` 的 `PAGES`
陣列由 `[home, materials, quiz, wrongbook, review, tutor]` 改為
`[home, materials, summary, quiz, wrongbook, tutor]`（複習中心移出、學習總結新增，對應
Navigation 變動）。重新產生 `home-chromium-linux.png`／`wrongbook-chromium-linux.png`（內容
移除造成真實高度縮減）／新增 `summary-chromium-linux.png`；刪除孤兒檔案
`review-chromium-linux.png`（已不在 `PAGES` 內）。`review.html` 頁面本身仍可正常渲染
（LOCK：Page 保留），只是不再是 Snapshot 固定基準集合的一員。

**AI-118-14 LearningFlowRegression.js** — 新增 `tests/regression/LearningFlowRegression.js`
（42 項檢查，8 大區塊）：[1] Navigation（順序／標籤／確認無「複習」「我的學習」／所有
href 對應檔案存在）[2] `review.html`／`learning.html` 仍可正常渲染（LOCK 驗證）[3] 教材卡片
CTA 標籤 [4] 學習總結 CTA 組合 [5] 測驗中心分頁標籤 [6] 錯題本單一統計與
`StatisticsRuntime` 一致性 [7] AI Tutor 真實 href [8] 首頁組成（5 個新區塊存在、5 個舊區塊
不存在）。`package.json` 的 `test` script 串接此檔案；`scripts/qa/QaDashboard.js` 的
`NODE_SUITES` 新增對應項目。42/42 全數通過。

**AI-118-15 Deliverables** — `docs/PMO/SPRINT.json`／`docs/PMO/PROJECT_STATUS.json` 已更新
（含本報告揭露的 AI-118-06 已知落差）；`docs/Architecture/Architecture_Module_Responsibility_Matrix_v1.0.md`
新增「Sprint AI-118 更新」章節，說明 Navigation 精簡不等於模組整併，8 模組原有「無功能完全
重疊」結論不變；本報告即 Report 交付物；QA Dashboard／Playwright／GitHub Actions／Merge
Main／GitHub Pages Deploy／Restart Branch 見下方與本檔案最上方表格。

## 判斷與取捨（Judgment calls，主動揭露）

1. **AI-118-06 練習/正式測驗路由不對稱**（見上方詳述）——教材卡片「前往考前練習」實際仍走
   正式測驗批改管線，因真實教材資料只存在 `QuestionRuntime` 而非 `LearningQuestionRuntime`；
   為避免真實教材出現空狀態，選擇保留現況、誠實揭露，未違反 LOCK 修改 Runtime。
2. **練習模式「題號亂數」未實作**——會破壞既有測試對「畫面順序＝Runtime 原始順序」的假設，
   已撤回，程式碼留有說明註解。
3. **`StudyStats.js`／`StudyPlan.js`／`AchievementBadges.js`／`LearningTime.js`／
   `ContinueLearning.js` 檔案本身未刪除**——僅移除 `index.html` 的 `<script>` 引用；確認
   `dashboard.html`／`learning.html` 皆未引用後，刪除檔案本身視為此 Sprint UX/Navigation 範圍
   外的清理工作，留待下個 Sprint 或由 Project Owner 指示。
4. **Bottom Nav 維持 5 格、Sidebar 為 6 項**——延續既有 5 格 Bottom Nav 慣例的判斷，非規格
   明文逐字要求，特此揭露供確認。

## 修改檔案

- `js/data/AppConfig.js`
- `js/components/MaterialCompletionOverview.js`（新增）
- `js/pages/AppHome.js`
- `index.html`
- `js/ui/MaterialCard.js`
- `js/components/SummaryCenter.js`
- `js/components/QuizCenter.js`
- `js/components/WrongBook.js`
- `js/components/AiTutorHomeCard.js`
- `js/utils/TutorMessage.js`
- `css/pages/home.css`
- `css/pages/summary.css`
- `css/pages/quiz.css`
- `css/pages/wrongbook.css`
- `tests/jsdom/BehaviorSuite.js`
- `tests/regression/LearningFlowRegression.js`（新增）
- `playwright/tests/learning-loop.spec.js`
- `playwright/tests/learning-flow.spec.js`（新增）
- `playwright/tests/snapshot.spec.js`
- `playwright/tests/snapshot.spec.js-snapshots/home-chromium-linux.png`
- `playwright/tests/snapshot.spec.js-snapshots/wrongbook-chromium-linux.png`
- `playwright/tests/snapshot.spec.js-snapshots/summary-chromium-linux.png`（新增）
- `playwright/tests/snapshot.spec.js-snapshots/review-chromium-linux.png`（刪除）
- `package.json`
- `scripts/qa/QaDashboard.js`
- `docs/PMO/SPRINT.json`
- `docs/PMO/PROJECT_STATUS.json`
- `docs/QA/QaDashboard.json`
- `docs/Architecture/Architecture_Module_Responsibility_Matrix_v1.0.md`
- `docs/EO/SPRINT_AI118_Learning_Experience_Refactor_Report.md`（本檔案，新增）

## Acceptance

Platform UX Baseline v2.0 完成，Learning Flow 固定，Navigation 固定，Playwright 全綠，
`npm run verify`／`npm test` 全綠，QA Dashboard PASS。GitHub Actions／GitHub Pages Deploy／
Merge Commit 待合併後於本檔案上方表格填入真實 run/commit 連結（依本 Session 既有流程）。

**等待 Project Owner PAT。**
