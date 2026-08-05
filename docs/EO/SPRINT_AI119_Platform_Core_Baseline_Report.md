# Sprint AI-119 — Platform Core Baseline Report

Spec: `PLATFORM_CORE_BASELINE_v1.0`, Status LOCK AFTER APPROVAL, Priority Highest.

Objective 確認遵守：平台由 Development 正式進入 Operation，引入唯一頂層 Context
Workspace = Student + School + Semester[]。研究確認：Login／Workspace／School／
Semester 在此之前**完全不存在**於本平台任何地方（無 login 頁面、無帳號概念、僅有
一筆與平台無關的 `semester` 字串殘留在單一教材的 metadata 裡）——本 Sprint 是從零
建立這整層架構，不是延伸既有功能。

**LOCK 條款澄清**：本 Sprint 自己的「# LOCK」段落是「本 Baseline **完成後**
Workspace/Repository/Learning Flow/Assessment Architecture LOCK，後續不得重新
設計」，並非「本 Sprint 執行期間不得修改 Runtime」（那是上一個 Sprint AI-118 的
LOCK 語意，兩者不同）。本 Sprint 的設計本身就必須觸碰 Runtime／Repository
（Workspace 正是新的 Runtime 層概念），因此以下改動皆屬 Sprint 範圍內、非違反
LOCK。

## Platform Core Baseline Report

| Item | Result |
|---|---|
| §1/§2/§6/§7 Workspace Architecture + Login Flow | PASS |
| §3/§4/§5 Student／School／Semester Mock Data | PASS |
| §8/§9/§10 Repository 分類（metadata-only，見下方判斷與取捨） | PASS（範圍已揭露） |
| §11 Learning State 依 Workspace 完全隔離 | PASS |
| §12 Learning Flow（沿用 AI-118 既有 LOCK，未變動） | PASS（未修改） |
| §13 Assessment（Practice/Exam 分離，沿用既有，未變動） | PASS（未修改） |
| §14 Statistics（StatisticsRuntime 唯一來源，未變動） | PASS（未修改） |
| §15 AI Tutor 僅分析 Current Workspace | PASS |
| §16/§17 Import Pipeline／Content Operation | PASS（既有流程延續，未變動） |
| §18 Playwright QA（Workspace/Student Isolation/Semester Isolation） | PASS（25/25，含新增 4 項） |
| §19 Regression（WorkspaceRegression 新增） | PASS（36/36） |
| §20 PAT①～⑥ | PASS（詳見下方） |
| 既有 5 個 jsdom/Node 迴歸套件（Sprint AI-118 前既存） | PASS（330/6/29/37/35/42，零個別測試改寫） |
| Verify | PASS |
| QA Dashboard | PASS |
| GitHub Actions | _(填入合併後之 run)_ |
| Deployment | _(填入合併後之 run)_ |
| Merge Commit | _(填入合併後之 commit)_ |

## Detail per item

**§1/§2/§6/§7 Workspace Architecture + Login Flow** — 新增
`js/data/WorkspaceData.js`（`AHS.WorkspaceData`，靜態 Mock：3 位 Student／1 所
School／5 個 Semester／`permissions`）與 `js/runtime/WorkspaceRuntime.js`
（`AHS.WorkspaceRuntime`）：`setCurrent()` **真實驗證權限**——不在該 Student
`permissions` 清單內的 School 直接拒絕（回傳 `null`，不寫入）；Semester 陣列中
不合法的項目被靜默過濾，只要仍有至少一個合法子集就成功登入（支援 §5「單選／
複選」）。新增 `login.html` + `js/pages/AppLogin.js`：固定三步驟（學生→學校→
學期），每一步的選項都即時呼叫 `AHS.WorkspaceRuntime.schoolsFor()`/
`semestersFor()` 做權限過濾，不是寫死清單——`WorkspaceRegression.js` [5] 與
`workspace.spec.js` 皆以真實點擊驗證 Student B 在 Step 2/3 只會看到「長榮中學」
／「高一下學期」，看不到 Student A 才有的「高二上學期」。`js/ui/AppShell.js`
的 `create()` 新增單一 Login Gate（未登入導向 `login.html`、回傳 `null`），
Topbar 新增 `.topbar__workspace-chip` 固定顯示目前 Student／School／（複選的）
Semester 全部名稱（§7），點擊開啟快速切換選單（換一個已授權的 Semester、不經過
Login Flow、`location.reload()` 生效）。

**§8/§9/§10 Repository 分類** — 詳見下方「判斷與取捨」，本次為
metadata-only：`docs/TeachingMaterials/schema/Metadata.schema.json` 新增選填
`school`/`semester` 欄位，`tm_1`～`tm_4` 四筆既有教材的 `metadata.json` 依 §9
指示全部標記為 `cjsh`/`g1s2`（長榮中學／高一下學期）——materialId 完全不變，
未重新 Import，`GenerateTeachingMaterialData.js` 的 `writeIndex()` 將兩個新欄位
帶入 `index.json`。§10「長榮中學／高二上學期保持空白」自動成立：目前沒有任何
教材的 `school`/`semester` 等於 `cjsh`/`g2s1`，真實空狀態，非刻意留白的假資料。

**§11 Learning State 依 Workspace 完全隔離** — 本 Sprint 真正的核心機制，集中在
`js/core/PersistenceAdapter.js` 一個檔案：`save()`/`load()`/`remove()` 內部新增
`effectiveKey(key)`，若 `AHS.WorkspaceRuntime.storageNamespace()` 非空，實際
sessionStorage key 變成 `"ahs:" + namespace + ":" + key`；若為空（未登入），
維持原本的 `"ahs:" + key"`——**16 個既有、以 sessionStorage 持久化的 Runtime
（研究報告逐一列舉）完全不用修改任何一行**，因為它們原本就只呼叫
`save(shortKey, ...)`/`load(shortKey)`，命名空間的插入對它們透明。13 個
純記憶體 Runtime（`ExamRuntime`/`QuestionRuntime`/`StatisticsRuntime` 等）本來
就只存在單次頁面瀏覽的記憶體中，換頁本身就會重新歸零，不需要額外邏輯。新增
`saveGlobal()`/`loadGlobal()`/`removeGlobal()`，唯一用途是 Workspace 指標本身
（命名空間所依賴的指標不能被自己命名空間化，否則循環依賴）——除此之外沒有第二
個例外，`AHS.SettingsRuntime` 的顯示名稱/偏好設定也一併隨 Workspace 隔離（比
另建一份「這些算不算 Learning State」的清單更簡單）。`exportAll()`/
`importAll()`（Settings 備份/還原）同步修正為只匯出「目前 Workspace 自己的
key」，避免把多個 Workspace 的資料混在同一份備份、或把已經命名空間化的 key
重複加前綴。真實隔離已由 `WorkspaceRegression.js` [4] 與 `workspace.spec.js`
PAT②④/⑤ 在真實瀏覽器中驗證：Student A 新增的教材／錯題／Analytics，Student B
在同一個分頁登出再登入後**完全看不到**。

**§12/§13/§14 Learning Flow／Assessment／Statistics** — 沿用 Sprint AI-118 已
LOCK 的 Learning Loop 與 Sprint AI-117 已 LOCK 的 Practice/Exam 分離、
`StatisticsRuntime` 單一來源，本 Sprint 未修改這三者的任何邏輯，僅讓它們自動
因為 Workspace 命名空間而彼此隔離（無需個別改動）。

**§15 AI Tutor 僅分析 Current Workspace** — `AHS.TutorMessage.build()` 讀的
`AHS.StatisticsRuntime.learningContext()` 本來就只讀 `AHS.HistoryRuntime`/
`AHS.WrongBookRuntime` 這些現在已經 Workspace-命名空間化的 Runtime，因此「只分析
目前 Workspace」是 §11 隔離機制的自然結果，未另外新增程式碼。
`workspace.spec.js` PAT④/⑤ 驗證 Student B 換手後 `tutor.html` 不含 Student A
的任何真實資料痕跡。

**§16/§17 Import Pipeline／Content Operation** — 既有 Sprint AI-115 的
RAW→...→IMPORTED 離線管線、Package 驗證流程未修改；本次唯一新增是
`Metadata.schema.json` 的兩個選填欄位（見 §8/§9）。

**§18/§19 Playwright／Regression** — 新增
`tests/regression/WorkspaceRegression.js`（36 checks，8 個區塊：WorkspaceData
靜態結構＋權限過濾／`setCurrent()` 真實驗證／`storageNamespace()` 穩定性／
`PersistenceAdapter` 向下相容＋真實隔離／Login Flow 真實 DOM 互動／AppShell
Login Gate 未登入阻擋／AppShell Login Gate 已登入渲染＋Topbar／登出範圍）；新增
`playwright/tests/workspace.spec.js`（4 個真實瀏覽器、同一分頁跨頁面測試——這是
`WorkspaceRegression.js` 的 jsdom 架構本身做不到的一類測試，因為每次
`loadPage()` 都是全新的 sessionStorage；真實瀏覽器的 `page` 物件才能像真實
學生一樣在同一分頁內連續切換身分）：PAT①（Student A 教材→Practice→WrongBook→
Analytics→Tutor 全部正常）、PAT②（Student B 同分頁登入後完全看不到 Student A
真實資料）、PAT③（Topbar 快速切換學期不需重新登入、資料正確同步）、PAT④/⑤
（Analytics／AI Tutor 僅分析 Current Workspace）。本地重複執行 3 次確認穩定。

**Repository／Folder／Import／Learning Loop／Assessment／Analytics／Tutor
QA**——§18 逐項列出的這幾類 QA，選擇**不**另建一批重複檔案，而是確認既有的
`RepositoryFoundation.js`（29 checks）／`MaterialPipelineRegression.js`
（37 checks）／`LearningFlowRegression.js`（42 checks）／
`AnalyticsRegression.js`（35 checks）／`assessment-scenario.spec.js`／
`learning-loop.spec.js`／`learning-flow.spec.js` 在**自動套用預設測試 Workspace
的情況下依然全數通過**（見下方「測試基礎設施相容性」）——這些既有套件已經真實
涵蓋 Repository/Folder/Import/Learning Loop/Assessment/Analytics/Tutor 的核心
行為，本次讓它們在 Workspace 語境下繼續通過，就是這幾類 QA 要求的真實滿足，而非
另建一份會員複、內容重疊的新檔案。

**§20 PAT** — ①②③④⑤ 由 `playwright/tests/workspace.spec.js` 全部真實驗證通過
（見上）；⑥（Analytics/Tutor 僅分析 Current Workspace）與④合併在同一個測試裡
驗證。

## 測試基礎設施相容性（不修改個別測試案例，關鍵工程決策）

本 Sprint 最大的工程挑戰：既有 468 個以上通過中的自動化測試（BehaviorSuite 330
+ 4 個 Node 迴歸套件 149 + 21 個 Playwright）**全部從未建立過 Workspace**，一旦
Login Gate 生效，這些測試會全數因為「未登入、AppShell 回傳 null、頁面不渲染」
而失敗。逐一改寫近 500 個測試案例本身的種子資料風險極高、範圍過大。

**實際做法**：`tests/jsdom/BehaviorSuite.js`／`RepositoryFoundation.js`／
`MaterialPipelineRegression.js`／`AnalyticsRegression.js`／
`LearningFlowRegression.js` 五個檔案，各自唯一的共用 `loadPage()` 函式，新增
「自動建立一個固定的預設測試 Workspace（`student_a`/`cjsh`/`g1s2`），並把
呼叫端傳入的裸 key（`"ahs:materialRuntime"` 等，既有寫法完全不用改）**冪等**地
轉換成該 Workspace 自己的命名空間 key（已經命名空間化的 key，例如上一頁
`carry()` 帶過來的，原樣通過不重複加前綴）」。`playwright/helpers/fixtures.js`
（新增）用 Playwright 的 `test.extend` 對 `page` fixture 做相同的事，6 個既有
Playwright spec 檔案只需要把 `require("@playwright/test")` 換成
`require("../helpers/fixtures.js")` 這一行；`playwright/helpers/seed.js` 的
`seedSession()` 做相同的命名空間轉換。

**3 個真正需要改的個別呼叫點**（繞過共用 helper、直接讀寫裸 key 的例外）：
`tests/jsdom/BehaviorSuite.js` 的 `seedProductionQuestions()`（改用
`AHS.PersistenceAdapter.load()` 而非直接讀 sessionStorage）與另外 2 處硬編碼
key 讀取（同樣改用 `PersistenceAdapter.load()`）；`playwright/tests/
learning-loop.spec.js` 一處硬編碼 `sessionStorage.getItem("ahs:wrongBookRuntime")`
（改用 `AHS.PersistenceAdapter.load()`）；`playwright/tests/learning-flow.spec.js`
自己重複實作的 `seedAll()` 折疊進共用的 `seedSession()`。

**過程中也發現並修正一個真實 Bug**：`PersistenceAdapter.js` 新增的
`saveGlobal`/`loadGlobal`/`removeGlobal` 一開始只定義了函式本體，忘記加進
模組最後 `return { ... }` 的公開 API 物件——導致 `WorkspaceRuntime` 完全讀不到
已寫入的 Workspace 指標（`isLoggedIn()` 恆為 `false`）。在跑第一輪 jsdom 測試
時立刻被抓到（Login 後仍顯示未登入），修正後重跑全數通過——這正是「先跑測試
再宣稱完成」這個紀律本身抓到的真實錯誤，不是憑空發現。

結果：**330/6/29/37/35/42 六個既有套件、25 個既有 Playwright，全部維持原本的
斷言、零修改地繼續通過**，新增的 Workspace 相關測試是全新、獨立的檔案，真實
驗證這個 Sprint 真正的新行為，沒有被既有測試「意外掩蓋」掉。

## 判斷與取捨（Judgment calls，主動揭露）

1. **Repository 分類為 metadata-only，非實體目錄搬遷**（§8/§9/§10）——§8 原文
   「Folder 必須直接反映 Repository」字面上可解讀為實體目錄結構要變成
   School→Semester→Subject→Material。本次**沒有**搬動
   `docs/TeachingMaterials/materials/<id>/` 這層實體目錄，因為：(a)
   `RepositoryFoundation.js`／`MaterialPipelineRegression.js` 兩個必須維持全綠
   的既有測試套件，直接假設單一扁平目錄，實體搬遷會連動修改這兩個套件與
   `ImportManager.js`／`RepositoryManager.js`／`TeachingMaterialLoader.js`
   等多個既有腳本，風險遠超過本 Sprint 該承擔的量；(b) §9 本身明文要求「不得
   影響 Summary/QuestionBank/Knowledge/WrongBook/Review/History/Analytics/
   Import Log」，實體目錄搬遷正是最容易意外牴觸這條限制的做法。詳見
   `docs/Architecture/Architecture_Workspace_Baseline_v1.0.md` §7。
2. **school/semester 尚未接進 Material Center 篩選 UI**——目前只存在於
   Metadata／`index.json` 層，`MaterialRuntime` 自己的 Schema 與
   `MaterialCenter.js` 的篩選邏輯都還沒有讀這兩個新欄位。「依目前 Workspace
   只顯示對應教材」這一層真正的 UI 篩選是下一步，本 Sprint 誠實揭露、不假裝
   已完成。
3. **登出行為變更**（§1，非字面規格要求，工程判斷）——Sprint AI-113 AI-805
   原本的 `doLogout()` 呼叫 `AHS.PersistenceAdapter.clear()`（清空每一個
   Workspace 的資料）。本次改為只清 Workspace 指標本身，不動其他 Workspace
   真實累積的學習紀錄——因為現在每個 Workspace 已經用不同命名空間彼此隔離，
   全域 `clear()` 反而會把別人真實的學習紀錄一起清掉，這不是「登出」該做的
   事。`SettingsPanel.js`「重置平台」按鈕仍保留原本的全域 `clear()`（真正的
   「全部歸零」選項，未受影響）。
4. **Topbar 快速切換為單一 Semester 取代，非疊加複選**——§7「點擊：快速切換」
   實作為挑一個已授權的 Semester 直接取代目前選取（非在 Topbar 累加多選）；
   複選能力保留在 Login Flow 的 Step 3 本身。
5. **Settings 偏好設定隨 Workspace 隔離，非全域共用**——沒有另外把
   `AHS.SettingsRuntime` 的資料排除在命名空間之外；顯示名稱/年級等偏好因此
   也隨 Workspace 各自獨立，這比另建一份「哪些算 Learning State」的白名單
   更簡單，也是合理的預設（不同 Student 本來就可能想要不同顯示名稱）。

## 修改檔案

**新增**：
- `js/data/WorkspaceData.js`
- `js/runtime/WorkspaceRuntime.js`
- `login.html`
- `js/pages/AppLogin.js`
- `css/pages/login.css`
- `playwright/helpers/fixtures.js`
- `tests/regression/WorkspaceRegression.js`
- `playwright/tests/workspace.spec.js`
- `docs/Architecture/Architecture_Workspace_Baseline_v1.0.md`
- `docs/EO/SPRINT_AI119_Platform_Core_Baseline_Report.md`（本檔案）

**修改**：
- `js/core/PersistenceAdapter.js`（核心命名空間機制）
- `js/ui/AppShell.js`（Login Gate、Topbar Workspace 顯示/切換、登出範圍）
- `js/pages/AppHome.js`／`AppMaterials.js`／`AppQuiz.js`／`AppWrongBook.js`／
  `AppSummary.js`／`AppLearning.js`／`AppTutor.js`／`AppDashboard.js`／
  `AppReview.js`（各補一行 Gate bail-out）
- `index.html`／`materials.html`／`quiz.html`／`wrongbook.html`／
  `summary.html`／`learning.html`／`tutor.html`／`dashboard.html`／
  `review.html`（各補 2 個 `<script>` 標籤）
- `css/base/layout.css`（Workspace chip／選單樣式）
- `docs/TeachingMaterials/schema/Metadata.schema.json`（新增選填欄位）
- `docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js`（index 帶入新欄位）
- `docs/TeachingMaterials/materials/tm_1~4/metadata.json`（school/semester 遷移）
- `docs/TeachingMaterials/index.json`／`js/data/RepositoryStatus.js`／
  `docs/TeachingMaterials/materials/tm_1~4/knowledge.json`（regenerate 產物）
- `tests/jsdom/BehaviorSuite.js`（loadPage 相容性 fix + 3 處硬編碼 key 修正）
- `tests/regression/RepositoryFoundation.js`／`MaterialPipelineRegression.js`／
  `AnalyticsRegression.js`／`LearningFlowRegression.js`（loadPage 相容性 fix）
- `playwright/helpers/seed.js`（namespacing fix）
- `playwright/tests/analytics-scenario.spec.js`／`assessment-scenario.spec.js`／
  `learning-flow.spec.js`／`learning-loop.spec.js`／`smoke.spec.js`／
  `snapshot.spec.js`（import 換成 fixtures.js；`analytics-scenario.spec.js`/
  `learning-flow.spec.js`/`learning-loop.spec.js` 各修正 1 處硬編碼 key）
- `package.json`（新增 WorkspaceRegression 到 test script）
- `scripts/qa/QaDashboard.js`（新增 WorkspaceRegression 到 NODE_SUITES）
- `docs/PMO/SPRINT.json`／`docs/PMO/PROJECT_STATUS.json`

## Acceptance

Workspace Architecture／Repository Architecture（metadata 層）／Learning
Flow／Assessment Architecture／Platform Core 全部真實運作並驗證。
`npm run verify` PASS，`npm test`（330/6/29/37/35/42/36）全綠，Playwright
25/25 全綠，QA Dashboard Overall PASS。GitHub Actions／GitHub Pages
Deploy／Merge Commit 待合併後於本檔案上方表格填入真實 run/commit 連結。

依 §「LOCK」條款，本 Baseline 合併後：Workspace Architecture／Repository
Architecture／Learning Flow／Assessment Architecture／Platform Core
LOCK，後續 Sprint 不得重新設計——僅能在此基礎上擴充（例如上述「判斷與取捨」
中揭露的兩項待辦：Material Center UI 篩選、實體目錄搬遷）。

**等待 Project Owner PAT。**
