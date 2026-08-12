# Sprint AI-122｜Learning Experience UX Hotfix — EO Report

**Status**: Merged（PR #55，merge commit `3da74261`；GitHub Actions QA Automation Framework／Pages 部署皆確認綠燈）— 等待 Project Owner PAT
**Type**: UX Hotfix（非新功能）
**LOCK honored**: 本 Sprint 僅修改 UI / UX / Workflow / Layout / Navigation / Routing。KnowledgeRuntime／StatisticsRuntime 核心演算法／WorkspaceRuntime／PersistenceAdapter／QuestionBank Runtime／Learning Engine 完全未修改（僅以既有、未變更的 public API 讀取，例如 `AHS.WrongBookRuntime.sync()`／`AHS.KnowledgeMasteryRuntime.recordAttempt()`／`AHS.QuestionRuntime.getSet()`——這是本專案一貫的作法，讀取不等於修改）。

## Summary

Sprint AI-121（Learning Knowledge Engine）上線後，Project Owner 實際操作平台提出 12 項 PAT，全部完成。

## AI-122-01｜立即重做 Session Reset

**問題**：點擊「立即重做」後，上一題的答案／解析／正解仍顯示，失去重做意義。

**修正**：`js/components/WrongBook.js` 的 `startReview()` 隱藏 `.wb-detail__answers`／`.wb-detail__explain`，重新掛載乾淨的互動作答元件（未選取任何選項）。

**額外發現並修正的真實 Bug**：`.wb-detail__answers` 這個 class 本身有 `display: flex`，在真實瀏覽器中，author stylesheet 的 `display` 宣告會贏過瀏覽器內建的 `[hidden] { display: none }` UA 規則（等 specificity 時比拼宣告順序，而不是誰有 `[hidden]`）——所以雖然 DOM 上 `hidden="hidden"` 屬性有被正確設定，畫面上卻仍然可見。這是 jsdom 測試（只檢查屬性存在，不做真實 CSS layout 計算）**結構性看不到**的 bug，是這次新增的 Playwright PAT-122-01 用真實點擊才抓到的。已於 `css/pages/wrongbook.css` 新增 `.wb-detail__answers[hidden] { display: none; }` 修正。

## AI-122-02／AI-122-03｜考前練習 Routing + Practice Context

**問題**：所有「前往考前練習」連結（`mode=practice`）都被導向正式測驗；已選教材後，練習模式仍重新列出全部教材。

**Root Cause**：`js/components/QuizCenter.js` 的 `resolveDirectExamId()` + 舊有路由邏輯，源自 HOTFIX-004 當時的一個暫時性 workaround——當時 Practice Mode（`AHS.LearningQuestionRuntime`）對 Repository 教材完全沒有真實內容，所以只要能解析出一個真實 `examId`，就無條件導向正式測驗，即使網址明確帶 `mode=practice`。AI-121 已經為這些教材建立了真實的 `QuestionBankRuntime`／`QuestionRuntime` 內容，這個 workaround 已經不再誠實。

**修正**：
- `mode=practice` 現在永遠贏過 `directExamId`，只有 `mode=daily`／`mode=retest`／完全沒有 `mode=practice` 時才會進入正式測驗或每日/再次練習（這兩者本來就是獨立、正常運作的真實入口，不受影響）。
- 新增 `buildRealPracticeQuestionView()`：真實抽取 `AHS.QuestionRuntime` 的 Exam-compatible 題目，在 Practice Mode 內就地作答、批改，並透過 `AHS.WrongBookRuntime.sync()` + `AHS.KnowledgeMasteryRuntime.recordAttempt()` 寫入**真正的 AI-121 Knowledge Engine**——刻意不重用舊版 `LearningQuestionRuntime` 管線（那條路徑走的是舊的 `WrongBookSession`/`WrongBookGenerator`，跟 AI-121 剛建好的 Knowledge Engine 是兩條互不相通的路），確保練習答錯真的會反映在知識弱點與 Mastery 上。
- Practice Mode 現在完整承接 `materialId`／`examId` context：巧巧老師出題引導 → 練習題列表（只顯示該教材的真實題目，不再顯示 Repository 全部教材清單）→ 單題作答 →「返回列表」永遠回到同一份教材的範圍，不會跳回未篩選的全部清單。
- 教材資料夾（`WorkspaceFolder.js`）與教材卡片（`MaterialCard.js`）內原本就走這個 CTA 的 Repository 列，也一併改為 drill-down 進入真實練習題，不再切到正式測驗，符合 AI-122-10 CTA 一致化。

## AI-122-04／AI-122-05｜知識弱點 Question List + Detail Panel 30/70

**問題**：左側列表顯示教材資訊而非題目本身，看不出「錯哪一題」；右側解析區域太小。

**修正**：
- `questionRow()` 改為：題號（第 N 題）→ 題目本文（第一行）→ Knowledge Point → 難度／錯誤次數／最近錯誤日期，不再重複教材名稱。
- 教材資訊（`item.title`／`item.chapter`）改為只顯示在 Detail Panel 自己的 Header（`.wb-detail__material`），唯一顯示位置。
- `.wb-layout` grid 比例由 `1fr / 400px`（固定側欄）改為 `3fr / 7fr`，Detail Panel 成為主要閱讀區，內文字級也放大（15px→17px，行高 1.7→1.8）。
- 移除不再對應真實欄位排列的 `.wb-list__cols` 表頭（難易度／錯誤次數／最後錯誤——這是舊版水平表格排版的殘留，narrow 30% 欄位下已無法對齊任何實際內容）。

## AI-122-06｜首頁 Recent Material 三日規則

**問題**：「最近教材」跟「教材資料夾」內容完全相同。

**修正**：`js/pages/AppHome.js` 的 `buildRecentMaterialsModel()` 改為篩選 `createdAt >= 今天-3天`，並依 `createdAt` 由新到舊排序；0 筆時顯示「目前近三日沒有新增教材」（不再重複顯示全部教材）。

**額外發現並修正的真實 Bug**：`js/runtime/TeachingMaterialLoader.js` 的 `repoMaterialPartial()` 原本把 Repository 教材真實的 `metadata.createdAt`（例如 `data/materials/CivicsG10Ch5to6Exam20260730.js` 標記的 `"2026-07-30"`）**只寫進顯示用的 `date` 欄位**，從未寫進 `MaterialRuntime.add()` 實際用來判斷「新增時間」的 `createdAt` 欄位——導致每次重新整理／新 Session，Repository 教材的 `createdAt` 都預設回「現在」，永遠看起來是「剛新增」。這個 bug 讓「三日內新增」這個新規則本身失去意義（每個教材永遠都會落在三日內），已一併修正：`repoMaterialPartial()` 現在同時寫入 `date`（既有顯示用途，不變）與 `createdAt`（真正的判斷依據）。

## AI-122-07｜教材資料夾 唯一教材入口

**修正**：`js/components/WorkspaceFolder.js` 的教材標題原本是純文字，直接跳過「教材」這一步進入學習總結。現在補上真實連結 `materials.html?id=<id>`（沿用 `HomeRecentMaterials.js` 已經在用的同一個深連結慣例，HOTFIX-009-1），完整補齊「教材資料夾→教材→學習總結→考前練習→每日 AI 練習」這五步流程中缺的那一步。

## AI-122-08｜首頁資訊排序

**判斷（已在此明確揭露）**：PO 明定的順序是 Hero→今日任務→學習成果總覽→最近新增教材→教材資料夾→AI Tutor，共 6 個區塊，一個線性順序。原本首頁是 AI-118-10 建立的 main／rail 雙欄式排版（今日任務在右側 rail，跟主欄的最近教材／學習成效總覽並排，而非接續其後）——雙欄排版無法誠實表示 PO 這個單一線性順序。

判斷：**首頁改為單一直向欄位**（`.home` grid 由 `1fr 360px` 改為單欄 `1fr`），依上述 6 個區塊的順序堆疊。同時，`複習進度`（ReviewWidget，Sprint 7.0 以來一直掛在首頁的 rail）**不在 PO 這份明定的 6 個區塊清單內**，且其「今日待複習」數字已經被「今日任務」涵蓋（`dailyTasks()` 本身就把 Review 項目排最前），Mastery 拆解也跟「學習成效總覽」的 Knowledge Mastery／今日新增弱點／今日解除弱點在概念上重疊——依 AI-122-11「不得資訊重複」的原則，本 Sprint 不再於首頁自動掛載它。**元件本身完全保留在程式碼中**（`js/components/ReviewWidget.js` 未刪除，未動一行），沿用 AI-118 報告自己建立的「本 Sprint 範圍外不刪除原始檔案」慣例。

這是本 Sprint 最大的判斷成分，在此明確提交 Project Owner 覆核；若 PO 認為複習進度應保留於首頁，屬單純的重新掛載，不涉及元件邏輯變更。

## AI-122-09｜首頁 Recent Material Action Button

**修正**：`js/components/HomeRecentMaterials.js` 的「查看全部」原本是 `href="#"`——技術上是個真的 `<a>` 標籤，但點了哪裡都不會去，違反「不得可點擊沒有事件」的精神。已改為真實連結 `materials.html`。卡片本身的「開啟教材」／「下載教材」兩個按鈕原本就已經是真實功能（有檔案時可用，沒檔案時誠實 disabled），未受影響。

## AI-122-10｜CTA 一致化

全面盤點程式碼內所有「前往考前練習」／「前往正式測驗」出現點（`WorkspaceFolder.js`／`MaterialCard.js`／`SummaryCenter.js`／`TutorMessage.js`），確認每一處的 `href` 都正確帶 `mode=practice`（考前練習）或不帶 `mode`／帶 `mode=daily`／`mode=retest`（正式測驗／每日練習／再次測試），沒有混用。此項主要由 AI-122-02 的路由修正直接解決；此處為額外的全面覆核，未發現需要修改的第二個站點。

## AI-122-11｜首頁資訊原則

由 AI-122-06（最近教材=近三日資訊，不再重複教材資料夾的全部清單）與 AI-122-08（ReviewWidget 因資訊重複而不再自動掛載）共同滿足。首頁現在每個區塊各自對應一個真實、不重疊的目的：最近教材=近三日新增資訊、教材資料夾=教材入口、今日任務=今日待完成、學習成效總覽=真實 KPI、AI Tutor=學習建議。

## AI-122-12｜Playwright PAT

新增 `playwright/tests/ux-hotfix-122.spec.js`，PAT-122-01～08，共 8 個真實瀏覽器測試，覆蓋本 Sprint 每一項行為修正。

**過程中發現並修正的真實 Flake（含真機 CI 重現，非僅本地環境）**：PR 第一次真實 GitHub Actions CI 執行時，`PAT-122-04` 真的失敗了（重試一次仍失敗）——並非本地沙盒特有的雜訊。追查過程：
1. 第一輪懷疑是「`AppWrongBook.js` 的 `init()` 尚未執行完成」（跟 Sprint AI-121 修過的「每日 AI 練習」測試同一類 race），加上等待 `.wb-header__title` render 完成再寫入種子資料——仍會失敗，且失敗時的畫面截圖顯示頁面**已經完整 render 完成**、且誠實顯示「目前沒有錯題紀錄」空狀態，證明先前的診斷不成立。
2. 進一步用 `page.evaluate()` 直接讀回 `sessionStorage` 內容，確認失敗當下該筆資料**完全不存在**（連 key 都沒有），即使在 `page.reload()` 前已用 `page.waitForFunction()` 在同一頁面內確認寫入生效——顯示 `page.evaluate()` 的 Promise 在 Node 端 resolve 的時機，與該筆寫入真正在瀏覽器行程內落地之間，在高負載下仍可能存在競爭。
3. 最終修正：捨棄「`page.evaluate()` 呼叫 `AHS.WrongBookRuntime.sync()` 後立刻 `page.reload()`」這整套流程，改用本套件其餘 Runtime 早已建立的既有慣例——`seedSession()`（透過 `page.addInitScript()` 在任何頁面腳本執行前就把資料寫進 `sessionStorage`），完全避開「寫入→立即導覽」的競爭視窗。套用範圍：`ux-hotfix-122.spec.js` 的 PAT-122-01／04／05，以及 `knowledge-engine.spec.js` 既有的兩個測試（知識弱點封存、每日 AI 練習——後者原本呼叫 `AHS.QuestionRuntime.importQuestions()`／`AHS.QuestionBankRuntime.ensureBank()` 後立刻二次 `page.goto()`，同一類問題）。

修正後於本機以 `--workers=2/4`、`--retries=0` 重複壓力測試 70 次以上（含完整 45 項 Playwright 套件跑 3 次）皆全綠；推送後真實 GitHub Actions 亦確認綠燈（第二輪 CI，commit `331dc68`）。

## Definition of Done

- [x] `npm run verify` PASS（0 broken paths／0 legacy references／0 forbidden-pattern hits）
- [x] `npm test` 全綠：BehaviorSuite 330/330、PipelineRegression 6/6、RepositoryFoundation 29/29、MaterialPipelineRegression 37/37、AnalyticsRegression 35/35、LearningFlowRegression 45/45、WorkspaceRegression 36/36、MaterialCenterRegression 12/12、FolderRegression 11/11、AnalyticsFilterRegression 6/6、TutorRegression 8/8、WorkspaceUIRegression 28/28、KnowledgeEngineRegression 44/44
- [x] Playwright 45/45（37 既有 + 8 新增 PAT-122），含 Snapshot（`home.png` baseline 因首頁單欄排版變更而重新產生，已核對畫面正確）
- [x] QA Dashboard：Overall PASS
- [ ] `npm run validate:html`（html5validator）：此開發環境未安裝該工具（CLAUDE.md 本身即載明「requires html5validator + Java installed separately, not via npm」），未執行；本 repo 的 GitHub Actions 目前也未將其納入自動化流程，與先前數個 Sprint（AI-120／AI-121）的實際情況一致。
- [x] 無死碼／無未使用 CSS／JS
- [x] 無虛構內容——所有修正皆對應真實 Runtime／真實資料
- [x] Manual review sweep：完成

## 判斷成分彙總（提交 Project Owner 覆核）

1. **首頁改為單欄排版**（AI-122-08）：PO 明定單一線性順序，雙欄排版無法誠實表示；已改為單欄。
2. **ReviewWidget 不再自動掛載於首頁**（AI-122-08）：不在 PO 明定的 6 個區塊清單內，且資訊與學習成效總覽／今日任務重疊；元件本身保留在程式碼中，僅未掛載。

以上兩項皆為誠實的最貼近字面解讀，如 PO 期望不同的呈現方式（例如恢復雙欄、或保留複習進度），皆為前端排版層級的小幅調整，不涉及本 Sprint LOCK 範圍。

完成後等待 Project Owner PAT。不得直接進入下一 Sprint。
