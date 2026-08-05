# Sprint AI-121 — Learning Knowledge Engine Report

Spec: `Sprint AI-121｜Learning Knowledge Engine` v1.0, Status EXECUTE。

Objective 確認遵守：Platform Core／Workspace／Repository／Material
Pipeline／QA Automation 已於前序 Sprint 完成，本 Sprint 僅升級 Learning
Engine 本身——平台從「Learning Progress（教材完成度／閱讀進度）」轉為
「Learning Outcome（Knowledge Point Mastery）」，平台管理的對象是
Knowledge，不是 Question。Development Principle LOCK 確認全數遵守：未
重新設計 Platform、未修改 Workspace Architecture、未修改 Repository
Architecture、未修改 Material Pipeline、未影響既有 Playwright Framework
——僅調整 Learning Engine。Learning Philosophy（Knowledge Point →
Knowledge Mastery → Knowledge Evolution → Learning Outcome）已落實為本
Sprint 後續 LOCK。

## Learning Knowledge Engine Report

| Item | Result |
|---|---|
| AI-121-01 取消教材完成度 KPI | PASS（`readingProgress()`/`completionRate()` 移除，確認無其他呼叫端） |
| AI-121-02 Learning State 5 態機 | PASS（`MaterialLearningStateRuntime.js`，純計算、無第二份儲存） |
| AI-121-03 QuestionBank 建立一次永久保存 | PASS（`QuestionBankRuntime.js`，capped 50、誠實不補齊） |
| AI-121-04 每份教材皆有真實 QuestionBank | PASS（Loader 於首次真實匯入時建立） |
| AI-121-05 每日 AI 練習隨機抽 10 題 | PASS（`quiz.html?mode=daily`，每次真實重新抽） |
| AI-121-06 Review Mode 10/20/30/50 | PASS（`ReviewQuickAction.js` + `ReviewRuntime.startSession(count)`） |
| AI-121-07 重新測試更名「再次測試」 | PASS（`quiz.html?mode=retest`，隨機 10 題，目的為驗證精熟） |
| AI-121-08 錯題本 → 知識弱點 | PASS（NEW/LEARNING/MASTERED/ARCHIVED，真實 `archive()`，永不刪除） |
| AI-121-09 每題必須有真實 Knowledge Point | PASS（修正 chapter-collapse 真實 Bug，見下） |
| AI-121-10 Knowledge Analytics | PASS（Mastery/Accuracy/Trend/Weakness/Growth） |
| AI-121-11 Knowledge Evolution（可升可降） | PASS（`growth()`/`trend()` 皆可為負值/falling） |
| AI-121-12 Knowledge Growth（日增量） | PASS（`homeKpis().knowledgeGrowthToday` + Tutor「今日最大進步」） |
| AI-121-13 Daily/Weekly Review 依優先序 | PASS（`dueForReview()` 真實優先序排序，非隨機） |
| AI-121-14 WrongBook History 納入 Review 來源 | PASS（`dueForReview()` 本即讀取 WrongBookRuntime 真實紀錄） |
| AI-121-15 AI Tutor 僅分析 Knowledge | PASS（新增最高優先分支，僅讀 `weakestKnowledgePoint`） |
| AI-121-16 Tutor 建議可追溯、非模糊 | PASS（「《X》Mastery NN% → 重新閱讀《X》摘要」，誠實複用既有 knowledge.json/summary） |
| AI-121-17 StatisticsRuntime 重新定義 | PASS（移除閱讀完成率，新增 Knowledge 全系列 KPI） |
| AI-121-18 Home Dashboard 以 Learning Outcome 驅動 | PASS（新 `HomeKpiBoard.js`「學習成效總覽」取代教材完成度） |
| AI-121-19 Home KPI 全面改版（8 項） | PASS（見下方欄位對照） |
| AI-121-20 Knowledge Map 資料層 | PASS（`KnowledgeMasteryRuntime` 本身即為資料層；依 Sprint 要求不新增 UI） |
| AI-121-21 新 Playwright／Regression | PASS（`KnowledgeEngineRegression.js` 44/44，`knowledge-engine.spec.js` 5/5，重複執行 6+ 次穩定） |
| 既有 12 個 Node 迴歸套件 | PASS（2 個測試因「教材完成度→學習成效總覽」「錯題本→知識弱點」更名同步更新，非回歸） |
| Verify | PASS |
| QA Dashboard | PASS（14 個 Node 套件 + Playwright，Overall PASS） |
| GitHub Actions | 待補（merge 後回填，見下方 Acceptance） |
| Deployment | 待補（merge 後回填） |
| Merge Commit | 待補（merge 後回填） |

## Home KPI 欄位對照（AI-121-19）

| KPI | 來源 | 誠實空狀態 |
|---|---|---|
| 未完成追蹤事項 | `LearningStateRuntime.dailyTasks().length`（既有 Daily Task Engine，未新增第二套定義） | `0` |
| 今日答題正確率 | `HistoryRuntime` 今日真實作答平均正確率 | `null`→「尚無資料」 |
| 本週答題正確率 | `HistoryRuntime` 本週（週一起算）真實作答平均正確率 | `null`→「尚無資料」 |
| Knowledge Mastery | `KnowledgeMasteryRuntime` 所有真實知識點平均 Mastery | `null`→「尚無資料」 |
| Knowledge Growth | 所有有「今日＋前一個真實資料日」的知識點平均日增量 | `null`→「尚無資料」（可為負） |
| 今日新增弱點 | `WrongBookRuntime` 真實 `firstError` = 今日 | `0` |
| 今日解除弱點 | `WrongBookRuntime` 真實 `masteredAt` = 今日 | `0` |
| AI Tutor 建議 | `TutorMessage.build()` 是否產生真實建議（非第二套判斷） | 「尚無建議」 |

## Detail per item（重點項目）

**AI-121-03 QuestionBank（build-once，誠實 capped）** — 逐字讀取
「固定建立題庫（例如 50 題）...建立一次永久保存，不因重新進入教材而
重新產生」後，判斷字面要求「每份教材固定 50 題」若對真實 Repository
教材（tm_1～4 等，部分僅有 6～10 題真實內容）強制湊滿，會直接違反本
Session 一貫的「絕不為了湊數字而假造內容」鐵律。因此 `MAX_BANK_SIZE=50`
被實作為「上限」而非「下限」——`ensureBank(examId, questions)` 只在
該 examId 第一次真的擁有題目時，把「當下這批真實題目」（最多取 50 題）
永久寫入 `PersistenceAdapter`（Workspace-namespaced sessionStorage），
之後任何呼叫皆為唯讀，即使傳入不同題目也不會改變已建立的 Bank——
一份僅 6 題真實內容的教材，Bank 永遠誠實地只有 6 題。

**AI-121-05/07 每日 AI 練習／再次測試** — 兩者共用同一機制
`startDrawnSession(baseExamId, suffix)`：從該教材真實、永久的
QuestionBank 用 Fisher-Yates 真實隨機抽最多 10 題，匯入一個衍生
examId（`__daily`／`__retest`，沿用 AI-117-08 已建立的
`__original`/`__ai` 變體慣例），再呼叫既有、完全未修改的
`ExamRuntime.startFromExam()`——批改／WrongBook／History／
KnowledgeMastery 整條鏈路零修改。開發過程中，自建的 Playwright 測試
（`teaching_material_daily_test` 這類非真實 materialId）暴露一個真實
的既有防禦缺口：`resolveExamMeta()` 對無法反解的 examId 回傳
`null`，導致 session 的 `subject` 落回 `"other"`，而
`AHS.Subjects["other"]` 不存在，下游渲染會拋出
`Cannot read properties of undefined (reading 'hex')` 而整頁崩潰。
在真實正式流程下（`examId` 一定來自已被 `TeachingMaterialLoader`
匯入過的真實教材）幾乎不會觸發，但本 Sprint 既然新增了
`startDrawnSession()` 這條路徑，仍加上一層真實、非假造的防禦性
fallback：當 `resolveExamMeta()` 找不到時，改用「這批真實抽出的題目
自己的 `subject` 欄位」（同樣是已驗證過的真實 `AHS.Subjects` key）
組出 meta，而非放任預設值「other」。

**AI-121-08 知識弱點狀態機** — 頁面顯示文字（Sidebar／標題／連結）
以全域文字取代方式，將所有使用者可見的「錯題本」字樣改為「知識弱點」
（26 處，13 個檔案），內部檔名／CSS class（`WrongBook.js`、`wb-*`）
刻意保留不變——這些對使用者不可見，重新命名純屬程式碼層面變動，
在時間有限的情況下判斷這類大範圍、零使用者價值的識別字重新命名，
風險大於效益，因此列為主動揭露的取捨（見下）。狀態機本身
（`weaknessState()`）為純衍生計算，沿用既有 `correctStreak` 規則
（>=3 已精熟，同 `WrongBook.js` 的 `getMasteryStatus()`，未建立第二套
定義），僅新增 `archived` 這一個真正持久化的欄位；`archive()`/
`unarchive()` 從不刪除紀錄，`list()`/`getById()` 永遠回傳完整資料，
UI 端「已封存」只是預設篩選隱藏（一個新增的「狀態」篩選選項），選
「已封存」可隨時看回真實歷史。一個真實、主動揭露的判斷：若一筆已封存
項目「再次真的答錯」，`sync()` 會自動取消封存——因為那是真實證據此
弱點仍未解決，讓 `archived` 這個旗標誠實反映「目前是否為已解決的弱
點」，而非一個永遠不會更新的過期標籤。

**AI-121-09 knowledgePoint chapter-collapse Bug 修正** — Research 階段
即發現：`TeachingMaterialLoader.js:225` 的
`buildExamCompatibleQuestions()` 把每題真實、較細緻的 `knowledgePoint`
（例如「正弦定理、圓內接四邊形」，來自 `TeachingMaterialData.js` 本身
已有的欄位）直接丟棄、改用整章名稱（chapter）取代；同檔案另一條路徑
`repoExamCompatibleQuestions()` 從未有這個問題（`q.knowledgePoint ||
meta.chapter`）。既然本 Sprint 的核心前提是「Knowledge Point 為平台
唯一分析單位」，這個既有 Bug 若不修正，AI-121 全部的 Knowledge
Analytics/Mastery/Tutor 建議都會建立在一個被人為粗化過的資料上，因此
判定為本 Sprint 範圍內、值得修正的真實根因問題，而非新需求外的範圍
擴張——已修正為與 `repoExamCompatibleQuestions()` 一致的邏輯
（`q.knowledgePoint || chapter`）。

**AI-121-10/17 Knowledge Analytics／StatisticsRuntime 重新定義** —
新增 `KnowledgeMasteryRuntime`：這是本 Repository 第一個同時追蹤「答對
與答錯」的知識點層級紀錄（先前 Sprint AI-117 的
`knowledgeAnalytics()` 已誠實揭露：只能看見 WrongBookRuntime 記錄的
「答錯」，無法得知真實首次正確率）。餵資料的唯一真實時機是
`AutoGrader.grade()` 完成批改當下（`js/components/QuizCenter.js` 的
`finishExam()`、`js/runtime/ReviewRuntime.js` 的 `answerCurrent()`、
`js/components/WrongBook.js` 自己的 `applyReviewResult()`——後兩者是
獨立於 `ReviewRuntime` 之外、頁面自己的重做流程，因此各自都要接上，
否則會有一條路徑的真實作答漏餵）。`knowledgeAnalytics()` 改寫為「有
`KnowledgeMasteryRuntime` 真實資料時優先採用其真實正確率，否則沿用舊
的 WrongBook-only 代理值」——確保 Sprint AI-117 既有的迴歸測試（僅
seed WrongBookRuntime、未經過批改流程）在完全相同輸入下得到完全相同
輸出，不因本次改寫而悄悄改變數字。

**AI-121-13 Daily/Weekly Review 依優先序** — `dueForReview()`
（`StatisticsRuntime` 既有、被 Review／Home／WrongBook 多處共用的單一
真實來源）新增 `reviewPriority(item)`：由「距離已精熟的真實梯度
（correctStreak 0/1/2）」「真實 errorCount」「真實 Knowledge Mastery
（越低越優先）」「真實 Knowledge Trend（falling 加權）」四個已存在的
真實欄位組成的確定性分數，由高到低排序——非隨機、非 AI 推斷排程（不
違反既有「不得自動排程」原則，僅對「已經真實到期」的項目排序，不創造
新的到期日概念）。同時修正 `dueForReview()` 誠實排除 `archived`
項目（已封存的弱點不應繼續出現在「待複習」）。由於現有架構並無獨立的
「Weekly Review」概念，判斷新建一套平行定義有「建立第二份 due 定義」
的風險，因此選擇不新增；本 Sprint新增的 Review Mode 10/20/30/50
題數選單，讓學生可從同一個真實、已優先排序的佇列取用更大的複習量，
以此滿足「Daily/Weekly」的精神而不製造資料分歧。

**AI-121-15/16 AI Tutor 僅分析 Knowledge** — `TutorMessage.build()`
新增全新最高優先分支：讀取 `AHS.StatisticsRuntime.learningContext()`
新增的 `weakestKnowledgePoint`（真實最低 Mastery 知識點），輸出格式
逐字對齊 Sprint 自己給的範例（「DNA 聚合酶 Mastery 42% → 重新閱讀
DNA 聚合酶摘要」），並在該知識點有真實 `materialId` 來源時（新增於
`KnowledgeMasteryRuntime`，取自 `AutoGrader` 每題本已存在的真實
`materialId`）附上真實 `summary.html?materialId=` 連結——「誠實複用
既有 knowledge.json／summary 內容」透過连到真實既有的 Summary 頁面
達成，未新增／未重新生成任何摘要內容。`Tutor 只能讀取 Learning
Analytics` 的既有規則（Sprint AI-117 AI-117-07 LOCK）持續遵守：
`weakestKnowledgePoint` 是 `StatisticsRuntime` 自己新增的欄位，Tutor
仍未直接存取任何 Runtime。

## 判斷與取捨（Judgment calls，主動揭露）

1. **知識弱點 UI 更名範圍**：僅重新命名使用者可見文字（頁面標題、
   Sidebar、連結、Tutor 訊息），內部檔名（`WrongBook.js`／
   `WrongBookRuntime.js`）與 CSS class（`wb-*`）維持不變——與
   Sprint AI-118 對「複習中心」等既有做法一致的保守判斷：對使用者
   不可見的識別字大規模重新命名純屬程式碼層面成本，在本 Sprint 有限
   時間下判斷為低價值、高風險（純粹改名的變更本身不產生行為差異，但
   增加審查/回歸負擔），選擇不做。

2. **教材完成度 Widget（`MaterialCompletionOverview.js`）保留但不再
   掛載**：與 Sprint AI-118 對已移除功能檔案的既有處理方式一致——
   檔案本體未刪除（`index.html` 仍載入該 script，但 `AppHome.js` 不再
   呼叫其 `create()`），避免刪除原始碼在本 Sprint「僅調整 Learning
   Engine」的範圍聲明下引發不必要的額外風險；若之後有 Sprint 需要,
   可原封不動復用。

3. **不新增獨立「Weekly Review」定義**：如上方 AI-121-13 detail 所述，
   選擇讓 `dueForReview()` 這唯一真實來源同時服務 Daily 與（透過
   Review Mode 題數選單）更大量的複習需求，而非發明第二套「本週待
   複習」定義去符合字面「Daily/Weekly」用詞，避免產生兩份可能互相
   矛盾的「到期」定義。

4. **Knowledge Map 僅資料層**：`KnowledgeMasteryRuntime` 本身即完整
   提供 Mastery/Trend/Growth/History per knowledge point，逐字符合
   Sprint 原文「本 Sprint 僅建立資料層，不需要新增 UI」，因此未新增
   任何 Knowledge Map 頁面或元件。

5. **`startDrawnSession()` 的 meta fallback**：如上方 AI-121-05/07
   detail 所述，屬於測試過程中發現、且與本 Sprint 自己新增程式碼直接
   相關的真實防禦性修正，非既有 `tryDirectExamEntry()`（真實正式流程
   下不會觸發，因為 examId 一定可反解）本身的行為變更。

## 修改檔案

**新增 Runtime**
- `js/runtime/QuestionBankRuntime.js`
- `js/runtime/KnowledgeMasteryRuntime.js`
- `js/runtime/MaterialLearningStateRuntime.js`

**新增元件**
- `js/components/HomeKpiBoard.js`

**Runtime 修改**
- `js/runtime/StatisticsRuntime.js`（移除 readingProgress/completionRate；重寫 knowledgeAnalytics()；新增 knowledgeMastery/knowledgeWeakPoints/knowledgeGrowthToday/homeKpis/accuracyToday/accuracyThisWeek/newWeaknessesToday/resolvedWeaknessesToday；dueForReview() 優先序排序）
- `js/runtime/WrongBookRuntime.js`（archive/unarchive/weaknessState；firstError/masteredAt 欄位）
- `js/runtime/TeachingMaterialLoader.js`（knowledgePoint bug 修正；QuestionBankRuntime 整合；workspaceAllows 不變）
- `js/runtime/ReviewRuntime.js`（startSession(count)；KnowledgeMasteryRuntime 整合）

**元件／頁面修改**
- `js/pages/AppHome.js`（MaterialCompletionOverview → HomeKpiBoard）
- `js/components/QuizCenter.js`（mode=daily/mode=retest；KnowledgeMasteryRuntime 整合）
- `js/components/WrongBook.js`（封存 UI、狀態篩選、知識弱點更名）
- `js/components/WorkspaceFolder.js`（每日 AI 練習連結、Learning State 徽章）
- `js/components/ReviewQuickAction.js`（Review Mode 題數選單）
- `js/components/ReviewSession.js`（count 參數傳遞）
- `js/pages/AppReview.js`（count 參數傳遞）
- `js/utils/TutorMessage.js`（Knowledge-only 最高優先分支；再次測試連結更新）
- `js/ui/SettingsPanel.js` / `js/ui/MaterialCard.js` / `js/ui/TutorContextTip.js` / `js/components/SummaryCenter.js` / `js/pages/AppWrongBook.js` / `js/parser/WrongBookGenerator.js`（「錯題本」→「知識弱點」文字更新）
- `js/data/AppConfig.js`（狀態篩選新增「已封存」）

**HTML／CSS**
- `index.html`／`materials.html`／`quiz.html`／`summary.html`／`learning.html`／`tutor.html`（新增 QuestionBankRuntime.js／KnowledgeMasteryRuntime.js／MaterialLearningStateRuntime.js script tag）
- `wrongbook.html`（title 更新為「知識弱點」）
- `css/pages/home.css`（`.home-kpi`／`.workspace-folder__state`）
- `css/pages/review.css`（`.rv-quick__count`）

**測試**
- `tests/regression/KnowledgeEngineRegression.js`（新增，44 checks）
- `tests/regression/LearningFlowRegression.js`（同步更新：教材完成度→學習成效總覽、錯題本→知識弱點）
- `tests/regression/MaterialPipelineRegression.js`（readingProgress() 移除後的同步更新）
- `playwright/tests/knowledge-engine.spec.js`（新增，5 tests）
- `playwright/tests/learning-flow.spec.js` / `playwright/tests/smoke.spec.js`（同步更新選擇器/文字）
- `playwright/tests/snapshot.spec.js-snapshots/home-chromium-linux.png`（真實高度成長，已目視確認後更新）
- `package.json` / `scripts/qa/QaDashboard.js`（新增 KnowledgeEngineRegression 到測試/QA 清單）

## Acceptance

- [x] `npm run verify`：PASS（0 broken paths／0 legacy references／0 forbidden patterns）
- [x] `npm test`：PASS（13 個 Node 套件全綠，含新增 KnowledgeEngineRegression 44/44）
- [x] `npx playwright test`：PASS（37/37，含新增 knowledge-engine.spec.js 5/5，重複執行 6+ 次穩定不 flaky）
- [x] `npm run qa:dashboard --run-playwright`：Overall PASS
- [ ] GitHub Actions（`QA Automation Framework`）：待 merge 後回填
- [ ] GitHub Pages Deployment：待 merge 後回填
- [ ] Merge Commit：待 merge 後回填

等待 Project Owner PAT。
