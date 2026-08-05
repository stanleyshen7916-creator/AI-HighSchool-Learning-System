# Architecture_Workspace_Baseline_v1.0.md

## 目的

Sprint AI-119（PLATFORM_CORE_BASELINE_v1.0）將平台由 Development 正式轉為
Operation，引入本平台唯一的頂層 Context：**Workspace = Student + School +
Semester[]**。本文件記錄該架構的實際落地方式、與既有八大模組
（`Architecture_Module_Responsibility_Matrix_v1.0.md`）的關係，以及為了
「不破壞既有 468 個以上自動化測試」所做的具體設計取捨。

## 1. Workspace 資料模型

- `js/data/WorkspaceData.js`（`AHS.WorkspaceData`）：靜態 Mock 設定 —
  3 位 Student（Admin／Student A／Student B）、1 所 School（長榮中學）、
  5 個 Semester（高一下～高三下）、`permissions`（Student → 可見
  School/Semester 清單）。與 `AHS.Subjects`（`js/core/Icons.js`）同一種
  「id → 顯示資料」靜態設定慣例。
- `js/runtime/WorkspaceRuntime.js`（`AHS.WorkspaceRuntime`）：唯一的
  Workspace 狀態來源。`getCurrent()`／`setCurrent()`（**真實驗證權限**，
  越權組合直接拒絕，不信任呼叫端）／`isLoggedIn()`／`logout()`／
  `storageNamespace()`／`label()`／`schoolsFor(studentId)`／
  `semestersFor(studentId)`（權限過濾清單，供 Login 與 Topbar 共用，同一
  份邏輯不重建第二套）。

## 2. Login Flow（`login.html` + `js/pages/AppLogin.js`）

固定三步驟（Step 1 學生 → Step 2 學校 → Step 3 學期，可複選）、每一步的
選項都是 `AHS.WorkspaceRuntime.schoolsFor()`/`semestersFor()` 的真實權限
過濾結果，不是寫死的清單。獨立頁面，不掛載 `AHS.AppShell`（尚未登入，沒有
Shell 可用）。已登入時直接跳過 Login、導向首頁（換 Workspace 走 Topbar
快速切換，見下）。

## 3. Login Gate（`js/ui/AppShell.js`）

`AHS.AppShell.create()` 是每個頁面的 Bootstrap 都會呼叫的唯一共用入口
（見 `Architecture_Module_Responsibility_Matrix_v1.0.md` 對 AppShell 的
描述），因此 Login Gate 只需要加在**這一個函式**裡：未登入時導向
`login.html` 並回傳 `null`；9 個頁面 Bootstrap 檔（`js/pages/App*.js`）
各自在 `AHS.UI.mount(app, shell.root)` 前補一行 `if (!shell) { return; }`
即可，不需要在每個頁面重寫一份 Gate 邏輯。

## 4. Learning State 隔離（`js/core/PersistenceAdapter.js`）

這是本次 Baseline 真正的核心機制：**只改一個檔案，16 個既有 Runtime 的
`STORAGE_KEY` 呼叫方式完全不用改**。

- `save()`/`load()`/`remove()` 內部呼叫新增的 `effectiveKey(key)`：若
  `AHS.WorkspaceRuntime.storageNamespace()` 非空，實際 key 變成
  `"ahs:" + namespace + ":" + key`；若為空（尚未登入／`WorkspaceRuntime`
  未載入），維持原本的 `"ahs:" + key"`（**向下相容，非近似**）。
- `saveGlobal()`/`loadGlobal()`/`removeGlobal()`：唯一用途是
  `WorkspaceRuntime` 自己的指標（`"workspace"` key）——命名空間所依賴的
  指標本身不能被命名空間化，否則循環依賴。除此之外沒有第二個例外：
  `AHS.SettingsRuntime` 的顯示名稱/偏好設定也一併走一般 `save/load`，
  隨 Workspace 隔離（比另建一份「這些算不算 Learning State」的清單更
  簡單，也更合理——顯示名稱本來就可能因人而異）。
- `exportAll()`/`importAll()`（Settings 的備份/還原）：`exportAll()`
  現在只匯出「目前 Workspace 自己的 key」（用 `splitKey()` 判斷
  namespace 是否等於目前值），避免把好幾個 Workspace 的資料混在同一份
  備份、或把已經命名空間化的 key 重複加上前綴。
- 純記憶體 Runtime（`ExamRuntime`／`QuestionRuntime`／`AnswerRuntime`／
  `AutoGrader`／`StatisticsRuntime`／`LearningStateRuntime`／
  `ReviewRuntime`／`AITutorRuntime`／`AITutorService`
  等，見研究報告列舉的 13 個）本來就只存在單次頁面瀏覽的記憶體中，每次
  換頁（含換 Workspace 造成的 `location.reload()`）本來就會重新歸零 —
  不需要、也沒有額外的隔離邏輯要加。

## 5. Topbar Current Workspace 顯示／快速切換（§7）

`AHS.AppShell.js` 的 `topbar()` 新增 `.topbar__workspace-chip`：固定顯示
目前 Student／School／（複選的）Semester 全部名稱。點擊開啟
`.workspace-menu`，列出該 Student 被授權的 Semester，點選任一個即呼叫
`AHS.WorkspaceRuntime.setCurrent()`（單一 Semester，取代目前選取）後
`location.reload()` —— 不經過 Login Flow、不需要重新登入，同時真正切換
了 `storageNamespace()`，讓整頁在下一次 render 時讀到新 Workspace 自己的
資料。

## 6. Logout（行為變更，明確揭露）

Sprint AI-113 AI-805 原本的 `doLogout()` 呼叫
`AHS.PersistenceAdapter.clear()`（清空**每一個** `"ahs:"` 開頭的 key，
不分 Workspace）。本次改為只呼叫 `AHS.WorkspaceRuntime.logout()`（只清
Workspace 指標本身）並導向 `login.html`（原本導向 `index.html`）。

**理由**：每個 Workspace 的資料現在已經用不同的 sessionStorage
namespace 彼此隔離，登出/換人本身就不會看到別人的資料 —— 用全域
`clear()` 反而會把其他 Workspace 真實累積的學習紀錄一起清掉，這不是
「登出」該做的事。`SettingsPanel.js`「重置平台」按鈕仍使用原本的
`PersistenceAdapter.clear()`（保留成真正的「全部歸零」選項，未受影響）。

## 7. Repository 分類（§8/§9，metadata-only，非實體目錄搬遷）

**判斷與取捨（主動揭露）**：§8 原文「Folder 必須直接反映 Repository」
字面上暗示實體目錄結構本身要變成 School → Semester → Subject →
Material。本次**沒有**搬動 `docs/TeachingMaterials/materials/<id>/` 這層
實體目錄結構，原因：

1. `tests/regression/RepositoryFoundation.js`／`MaterialPipelineRegression.js`
   兩個既有、必須維持全綠的 Node 測試套件，直接假設「單一扁平目錄」
   （逐一列舉真實檔案路徑 `docs/TeachingMaterials/materials/<id>/`），
   實體搬遷會連動修改這兩個套件、`ImportManager.js`／
   `RepositoryManager.js`／`TeachingMaterialLoader.js` 等多個既有腳本，
   風險與範圍遠超過本次「Workspace 基礎架構」這一個 Sprint 該承擔的量。
2. §9 本身明文要求「不得重新 Import／不得重新建立 Material ID／不得
   影響 Summary/QuestionBank/Knowledge/WrongBook/Review/History/
   Analytics/Import Log」——實體目錄搬遷正是最容易意外影響到這些路徑
   相依邏輯的做法；metadata-only 的加欄位是唯一能同時滿足這條「不得
   影響」限制、又達成分類目的的做法。

**實際做法**：`docs/TeachingMaterials/schema/Metadata.schema.json`
新增 `school`／`semester` 兩個**選填**欄位（對應
`AHS.WorkspaceData.schools[].id`／`semesters[].id`）；
`tm_1`～`tm_4` 四筆既有教材的 `metadata.json` 依 §9 指示全部標記為
`"cjsh"`／`"g1s2"`（長榮中學／高一下學期）——materialId 完全不變、
未重新 Import；`docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js`
的 `writeIndex()` 將這兩個欄位帶入 `index.json`。**§10「長榮中學／
高二上學期保持空白」自動成立**：目前沒有任何教材的 `school`/`semester`
等於 `cjsh`/`g2s1`，這是真實的空狀態，不是刻意留白的假資料。

**尚未做、明確揭露的部分**：`js/runtime/MaterialRuntime.js` 自己的
Schema、`js/components/MaterialCenter.js` 的篩選 UI，目前都還沒有讀
`school`/`semester` 這兩個新欄位——也就是說，Repository 的
School/Semester 分類目前只存在於**資料/Metadata 層**，尚未接進 Material
Center 頁面「依目前 Workspace 只顯示對應教材」這一層真正的 UI 篩選。
這是一個real、有意義的下一步，建議另開 Sprint 處理（牽涉
`MaterialRuntime`/`MaterialCenter`/`TeachingMaterialLoader` 三個檔案的
橋接邏輯），本 Sprint 誠實揭露、不假裝已完成。

## 8. 與既有八大模組的關係

Workspace 是**新增的頂層 Context**，不是第 9 個模組——它不擁有任何一種
「唯一使用者可執行的動作」（`Architecture_Module_Responsibility_Matrix_v1.0.md`
的判定標準），只負責「目前是誰、看得到什麼」，所有既有 8 個模組
（首頁／教材中心／測驗中心／錯題本／學習總結／複習中心／我的學習／
AI Tutor）的職責邊界完全不變，只是它們讀寫的 Learning State 現在自動
依 Workspace 隔離。

## 9. 測試基礎設施的相容性設計（不修改個別測試案例）

`tests/jsdom/BehaviorSuite.js`／`RepositoryFoundation.js`／
`MaterialPipelineRegression.js`／`AnalyticsRegression.js`／
`LearningFlowRegression.js` 五個檔案，各自唯一的共用 `loadPage()`
函式，新增「自動建立一個固定的預設測試 Workspace（`student_a` /
`cjsh` / `g1s2`），並把呼叫端傳入的裸 key（`"ahs:materialRuntime"` 等，
既有寫法完全不用改）透明轉換成該 Workspace 自己的命名空間 key」——
**冪等**（已經是命名空間化的 key，例如上一頁 `carry()` 帶過來的，原樣
通過不重複加前綴）。`playwright/helpers/fixtures.js`（新增）用
Playwright 的 `test.extend` 對 `page` fixture 做相同的事，
`playwright/helpers/seed.js` 的 `seedSession()` 做相同的命名空間轉換
——所有既有 Playwright spec 只需要把
`require("@playwright/test")` 換成 `require("../helpers/fixtures.js")`
這一行，不需要逐一修改每個測試案例本身。

需要測試「未登入」／「不同 Student 互不干擾」這件事本身的測試
（`tests/regression/WorkspaceRegression.js`、
`playwright/tests/workspace.spec.js`）則用 `skipLogin`／
`skipDefaultLogin` 選項退出這個自動預設，自己完整掌控 Workspace 狀態。

這個設計讓 468 個既有測試（`BehaviorSuite.js` 330 + 4 個 Node 迴歸套件
149 + 21 個既有 Playwright）**全部維持原本的斷言、零修改地繼續通過**，
同時新增的 Workspace 相關測試是全新、獨立的檔案，真實驗證這個 Sprint
真正的新行為，而不是被既有測試「意外掩蓋」掉。
