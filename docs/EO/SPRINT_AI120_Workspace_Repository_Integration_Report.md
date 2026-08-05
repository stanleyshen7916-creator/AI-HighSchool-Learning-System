# Sprint AI-120 — Workspace Repository Integration Report

Spec: `Sprint AI-120｜Workspace Repository Integration` v1.0, Status EXECUTE.

Objective 確認遵守：完成 Workspace 與 Repository 的最後整合
（Workspace→Repository→Material Center→Folder→Analytics→Tutor），未新增
Runtime、未修改 Platform Core、未修改 Learning Flow。LOCK 確認全數遵守：
`WorkspaceRuntime`／`PersistenceAdapter`／Repository Core（Schema／
Generator 驗證邏輯／`TeachingMaterialAdapter.js`）／Material Pipeline
（`ImportManager.js`／`RepositoryManager.js`）／Learning Flow／Assessment
Architecture／Analytics Architecture（`StatisticsRuntime.js`）／Playwright
Framework／GitHub Actions 皆逐一確認未修改。本 Sprint 是 Sprint AI-119 自己
報告中揭露的兩個開放項目（Material Center 篩選、Repository UI 串接）的
直接後續，證實那兩項揭露是正確、可執行的判斷。

## Workspace Repository Integration Report

| Item | Result |
|---|---|
| AI-120-01 Material Center Workspace Filter | PASS |
| AI-120-02 Folder Integration（直接讀取 Repository） | PASS |
| AI-120-03 Subject Integration | PASS |
| AI-120-04 Workspace Navigation | PASS（既有機制自然延伸，測試驗證） |
| AI-120-05 Analytics Filter | PASS（已知限制：複選未真正合併，見下） |
| AI-120-06 Tutor Context | PASS |
| AI-120-07 Repository Status（Settings） | PASS |
| AI-120-08 Playwright QA | PASS（32/32，含新增 7 項） |
| AI-120-09 Regression（5 個新檔案） | PASS（65/65） |
| AI-120-10 PAT①～⑥ | PASS |
| 既有 12 個 Node 迴歸套件（含 Sprint AI-119 新增） | PASS（零個別測試改寫） |
| Verify | PASS |
| QA Dashboard | PASS |
| GitHub Actions | _(填入合併後之 run)_ |
| Deployment | _(填入合併後之 run)_ |
| Merge Commit | _(填入合併後之 commit)_ |

## Detail per item

**AI-120-01 Material Center Workspace Filter** — 問題根源：
`js/runtime/TeachingMaterialLoader.js` 原本無條件把 Repository 全部內容
橋接進 `MaterialRuntime`，配合 Sprint AI-119 的命名空間隔離，等於每個
Workspace 第一次造訪都各自複製一份「全部」Repository 內容，完全沒有
School/Semester 篩選。修正：新增 `workspaceAllows(school, semester)`——
橋接前比對其 `school`/`semester` 是否符合 `AHS.WorkspaceRuntime.
getCurrent()`（School 需完全相符，Semester 需與目前選取集合有交集），不
符合就整個跳過（連 idempotency map 都不寫入，確保之後真正符合的 Workspace
造訪時仍能正確橋接）；未標記 school/semester 的內容維持對所有人可見（向下
相容）。School/Semester 從 Repository 傳到瀏覽器的路徑：
`GenerateTeachingMaterialData.js` 的 `generate()` 在寫出瀏覽器資料時，把
`rawMetadata.school`/`.semester`（Sprint AI-119 已加入 Schema 的選填欄位）
複製到 `material` 物件上——`TeachingMaterialAdapter.convertMaterial()`
本身完全未修改。`data/materials/CivicsG10Ch5to6Exam20260730.js`（另一條
Repository track 的唯一真實記錄）同樣標記為長榮中學／高一下學期，但用
`workspaceSchool`/`workspaceSemester` 這組新欄位名，避開它自己既有、
語意完全不同的 `semester` 顯示字串欄位（"第二學期"，全 repo grep 確認
從未被任何程式碼讀取）。實測驗證：高一下 Workspace 真實看到 5 筆已遷移
教材，高二上 Workspace 真實為空、顯示誠實的 Empty State（`.mat-empty`）。

**AI-120-02/03 Folder／Subject Integration** — 新增
`js/components/WorkspaceFolder.js`（Home 頁「教材資料夾」），唯一讀取
`AHS.MaterialRuntime.list()`（AI-120-01 的篩選已讓它自動只含 Current
Workspace 的教材），依 `subject` 分組——School／Semester 已是整個
Workspace 固定的上下文（Topbar 已顯示），不在 Folder 裡重複分一層。每筆
教材附上真實的「前往學習總結」／「前往考前練習」連結（沿用
`MaterialCard.js` 既有 href 慣例）。「立即同步」不需要輪詢——這是多頁面
靜態 App，`create()` 每次都全新讀取 `MaterialRuntime.list()` 當下狀態，
真實新增教材後重新整理即可看到。

**AI-120-04/05/06 Navigation／Analytics／Tutor 一致性** — 三項在程式碼
層級幾乎不需要新增邏輯，全部是 Sprint AI-119 `PersistenceAdapter` 命名
空間機制與本 Sprint AI-120-01 篩選機制的自然結果：Workspace 存在
sessionStorage、換頁自然保留；`AHS.StatisticsRuntime`／
`AHS.TutorMessage.build()`（本 Sprint 完全未修改，尊重對應 LOCK）只讀
已命名空間化的 Runtime，切換 Workspace 自然只看得到新命名空間的資料，
Tutor 自然無從推薦「不存在於這個 Workspace 的教材」。因此這三項的交付
以**測試驗證**為主（見下方新增套件），而非新應用邏輯——誠實反映「既有
機制的自然延伸，不是重新發明」。

**AI-120-07 Repository Status（Settings）** — `js/ui/SettingsPanel.js`
的 `repositorySection()` 新增 `workspaceRepositoryLine()`：真實 School／
Semester（`AHS.WorkspaceRuntime.label()`）、Subject 分佈統計、Material
Count、Question Count（沿用既有 `"teaching_material_" + materialId`
examId 慣例逐一查 `AHS.QuestionRuntime.getSet()`，非發明新 id 規則）。
「Import Time」刻意未做成假造欄位——App 沒有任何真實記錄「Repository 何時
被匯入」的事件，改為誠實顯示 Current Workspace 教材當中最新的真實
`date` 欄位。

**AI-120-08/09/10 Playwright／Regression／PAT** — 新增 5 個 Node 迴歸
檔案（對應規格逐項命名，非合併簡化）：`MaterialCenterRegression.js`
（12 checks：篩選正確性、空狀態、Student 隔離、未登入 Gate）、
`FolderRegression.js`（11 checks：School/Semester/Subject 顯示、真實
連結、Repository 新增立即同步、空狀態）、`AnalyticsFilterRegression.js`
（6 checks：dueForReview/subjectAnalytics 依 Workspace 隔離）、
`TutorRegression.js`（8 checks：Tutor 建議真實反映 Workspace、不洩漏
其他 Semester 內容）、`WorkspaceUIRegression.js`（28 checks：6 個頁面
Navigation 皆維持 Workspace、Settings Repository Status 真實資訊、未
登入 Gate）。新增 `playwright/tests/workspace-repository.spec.js`（7
tests，真實瀏覽器，涵蓋 §20 PAT①～⑥：Student A 高一下只看到高一下教材、
高二上誠實空狀態、Student B 看不到 Student A 教材、Workspace 快速切換
教材中心立即同步、Folder 新增教材立即同步、Analytics 切換立即同步、
Tutor 切換立即同步——本地重複執行 3 次確認穩定）。

## 判斷與取捨（Judgment calls，主動揭露）

1. **多選 Semester 的 Analytics 並非真正合併分析**（延續自 Sprint
   AI-119，本 Sprint 未解決，如實揭露）——規格 AI-120-05 提到「複選：
   高一下＋高二上，Analytics 重新分析」，但 `WorkspaceRuntime.
   storageNamespace()`（本 Sprint LOCK）把「高一下」「高二上」「高一下
   +高二上」視為三個各自獨立的命名空間，並非把兩者資料在讀取時合併查詢
   ——複選兩個 Semester 登入看到的是該特定組合**自己獨立**的資料，不是
   兩個 Semester 個別資料的聯集。真正做到跨命名空間查詢需要修改
   `WorkspaceRuntime`／`PersistenceAdapter`，兩者本 Sprint 皆 LOCK，
   留待未來明確排除此 LOCK 的 Sprint 處理。
2. **`workspaceSchool`/`workspaceSemester` 與 Package track的
   `school`/`semester` 欄位命名不一致**——刻意為之，避免與 Civics 記錄
   既有、語意不同的 `semester`（顯示字串）欄位衝突；`TeachingMaterialLoader.
   js` 的 `workspaceAllows()` 對兩條 track 讀取各自對應的欄位名，已在
   程式碼註解中明確記錄這個不一致的原因。
3. **`GenerateTeachingMaterialData.js` 的改動範圍界定**——判斷「在
   `generate()` 輸出瀏覽器資料時多帶 2 個已存在的選填欄位過去」屬於
   Repository→瀏覽器的資料橋接（本 Sprint 目標本身），不算修改
   「Repository Core」（Schema／驗證／Lifecycle 掃描邏輯本身完全未觸碰）
   ——與 `TeachingMaterialLoader.js` 被歷來多個 Sprint（HOTFIX-002/003/
   004）一致認定為「Wiring 允許修改」同一判斷基準。
4. **Repository/Folder/Import QA 沿用既有套件，未重複新建**——AI-120-08
   規格列出的「Repository QA／Folder QA／Import QA」等項目中，Repository
   /Import 的核心行為已由既有 `RepositoryFoundation.js`／
   `MaterialPipelineRegression.js` 涵蓋（本 Sprint 確認在自動建立的預設
   Workspace 下依然全數通過），僅 Folder（全新功能）與 Material Center
   篩選（全新行為）建立專屬新檔案，避免重複覆蓋既有已驗證的行為。

## 修改檔案

**新增**：
- `js/components/WorkspaceFolder.js`
- `tests/regression/MaterialCenterRegression.js`
- `tests/regression/FolderRegression.js`
- `tests/regression/AnalyticsFilterRegression.js`
- `tests/regression/TutorRegression.js`
- `tests/regression/WorkspaceUIRegression.js`
- `playwright/tests/workspace-repository.spec.js`
- `docs/EO/SPRINT_AI120_Workspace_Repository_Integration_Report.md`（本檔案）

**修改**：
- `js/runtime/TeachingMaterialLoader.js`（`workspaceAllows()` 篩選）
- `docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js`
  （school/semester 傳遞至瀏覽器資料）
- `data/materials/CivicsG10Ch5to6Exam20260730.js`
  （`workspaceSchool`/`workspaceSemester` 標記）
- `js/pages/AppHome.js`（掛載 WorkspaceFolder）
- `index.html`（新增 `<script>` 標籤）
- `css/pages/home.css`（`.workspace-folder__*` 樣式）
- `js/ui/SettingsPanel.js`（`workspaceRepositoryLine()`）
- `package.json`（新增 5 個 Node 套件到 test script）
- `scripts/qa/QaDashboard.js`（新增 5 個套件到 NODE_SUITES）
- `docs/Architecture/Architecture_Workspace_Baseline_v1.0.md`（新增 §10）
- `docs/PMO/SPRINT.json`／`docs/PMO/PROJECT_STATUS.json`
- `js/data/TeachingMaterialData.js`／`docs/TeachingMaterials/index.json`／
  `js/data/RepositoryStatus.js`／`docs/TeachingMaterials/materials/
  tm_1~4/knowledge.json`（regenerate 產物，反映 school/semester 傳遞）
- `playwright/tests/snapshot.spec.js-snapshots/home-chromium-linux.png`
  （真實高度成長，新增教材資料夾 widget）

## Acceptance

Workspace／Repository／Material Center／Folder／Analytics／Tutor 全部
完成真正整合，驗證方式為真實瀏覽器點擊 + jsdom 迴歸，非假設。`npm run
verify` PASS，`npm test`（330/6/29/37/35/42/36/12/11/6/8/28）全綠，
Playwright 32/32 全綠，QA Dashboard Overall PASS。GitHub Actions／
GitHub Pages Deploy／Merge Commit 待合併後於本檔案上方表格填入真實
run/commit 連結。

**等待 Project Owner PAT。**
