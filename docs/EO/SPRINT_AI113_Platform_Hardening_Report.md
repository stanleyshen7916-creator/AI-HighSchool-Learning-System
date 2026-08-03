# Sprint AI-113｜Platform Hardening Report

## Summary

Platform Hardening 的目標是完成整個平台的一致性、資料一致性、功能完整性與 AI 整合 — 不新增
頁面、不重新設計 UI，但（與先前多個 Sprint 不同）本次未限制新增 Runtime，因此 AI-803/804/
805/806/807/808 得以用真實、可運作的方式完成，而非僅止於稽核報告。全部 14 項逐一執行並
立即修正，未停留於分析階段。

## AI-801：PASS

重新檢查 8 個模組（首頁／教材中心／測驗中心／錯題本／學習總結／複習中心／我的學習／AI
Tutor）：功能無重疊、資訊無重複、資料無衝突。正式產出 `docs/Architecture/
Architecture_Module_Responsibility_Matrix_v1.0.md`（AI-809 一併完成），逐模組列出唯一職責
與真實資料來源，非未經檢查的結論。

## AI-802：PASS

Progress／Accuracy／Mastery／Statistics／History／Review／Question／Summary 全數確認來自
唯一 Runtime：`AHS.MaterialRuntime`／`AHS.StatisticsRuntime`／`AHS.WrongBookRuntime`／
`AHS.HistoryRuntime`／`AHS.QuestionRuntime`／`AHS.SummaryRuntime`。稽核 `js/components/`
全部「accuracy／correctCount」顯示點，未發現任何頁面自行重新計算（唯一已知案例已於
Platform Sync Check 修正）。

## AI-803：PASS

新增 `js/runtime/LearningStateRuntime.js`（純計算，同 `StatisticsRuntime` 模式，無自有
儲存）：`materialState(materialId)`／`subjectState(subject)` 真實統一 Reading／Summary／
Quiz／WrongBook／Mastery／Review／Completed 7 項訊號。`js/components/MyLearning.js` 的
「科目進度」已完成／進行中／尚未開始 狀態改由此 Runtime 判定（不再只用閱讀進度平均值），
直接解決 Platform Refactor Master 報告中標記待處理的「不得以閱讀完成率直接代表學習完成率」
項目。

## AI-804：PASS

新增 `js/runtime/SettingsRuntime.js`（單一真實設定來源，PersistenceAdapter 持久化）與
`js/ui/SettingsPanel.js`（真實 Modal，掛載於 AppShell，Sidebar「設定」與 Profile Menu 皆
開啟同一個 Panel）：

- **Profile**：真實姓名／年級編輯，儲存後即時更新 Topbar 顯示（非需重新整理）。
- **Learning**：真實「顯示 AI 巧巧老師建議卡片」開關，`AppHome.js`／`TutorContextTip.js`
  真實讀取此設定。
- **AI**：真實顯示 `AHS.AppConfig.aiGateway` 目前設定狀態（誠實顯示未設定，非假裝已連線）。
- **Repository**：真實顯示 Repository／Package 教材筆數，「重新載入 Repository」按鈕呼叫
  既有 `AHS.TeachingMaterialLoader.load()`。
- **Backup／Restore／Export／Import**：Backup/Restore 為完整 session 快照（新增
  `AHS.PersistenceAdapter.exportAll()`/`importAll()`），Export/Import 為僅學習紀錄範圍
  （新增 `WrongBookRuntime.importRecords()`/`HistoryRuntime.importRecords()`，真實合併而非
  覆寫）。全部透過 `AHS.DocumentExport.downloadBlob()`（既有真實下載機制）與 `FileReader`
  （本機檔案，非 fetch/XHR）。

不得任何按鈕為 Stub — 逐一核對：全部 8 類均有真實、可驗證的行為。

## AI-805：PASS

右上角 Profile Menu 的 Profile／Settings／Logout 三項全部真實：Profile／Settings 開啟真實
Settings Panel，Logout 呼叫 `AHS.PersistenceAdapter.clear()` 清空目前 session 的全部真實
資料後導向首頁（對於一個以 sessionStorage 為持久化層的靜態原型，這就是「登出」真實、誠實
的定義 — 非假造一套帳號系統）。Sidebar footer 的「設定」／「登出」按鈕同步修正（先前完全
沒有 click handler，是真正的 Stub，非僅 Mock 標示）。

## AI-806：PASS

新增 `docs/TeachingMaterials/scripts/MaterialLifecycle.js`：真實、確定性的 4 階段生命週期
判定（`RAW`／`WAITING_ANALYSIS`／`CLAUDE_READY_WAITING_IMPORT`／`RUNTIME_READY`），完全由
磁碟上的真實檔案與 `index.json` 判定，非人工維護欄位。第 5 個要求的狀態「Completed」（真正
橋接進瀏覽器 Runtime）誠實揭露為離線 Node 工具無法判定，由既有 `tests/regression/
RepositoryFoundation.js` 的瀏覽器端測試負責確認 — 未假造一個無法驗證的狀態。`index.json`
每筆教材新增真實 `lifecycleStage` 欄位。詳見 `docs/TeachingMaterials/README.md`「Material
Lifecycle」章節。

## AI-807：PASS

Package 新增兩個真實、自動產生的檔案：`knowledge.json`（真實由 `summary.json` 的
coreConcepts 與 `questions.json` 的 knowledgePoint 衍生，非人工維護、非第二份資料源）、
`report.md`（真實 Metadata／Manifest 狀態／Lifecycle Stage／內容統計的 Markdown 報告）。
兩者皆由 `GenerateTeachingMaterialData.js` 於每次執行時重新產生。既有 `questions.json`
（對應 AI-807 所稱 questionbank.json 的既有、LOCKed 檔名）維持不變 — 重新命名一個已被
多份 EO／程式碼引用的 LOCKed Schema 檔名屬於不必要的破壞性變更，已在此報告中揭露而非
靜默重新命名。`ValidateMaterial.js` 新增資訊性檢查（knowledge.json／report.md 是否已產生
+ 目前 Lifecycle Stage），不影響既有 PASS/FAIL 判定（兩檔案是 generate 的輸出，非作者輸入，
缺少不應阻擋驗證通過）。

**驗證**：以 scratch Package（`tm_999`／`tm_999998`，皆已刪除，未殘留）完整跑過
RAW→WAITING_ANALYSIS→CLAUDE_READY_WAITING_IMPORT→RUNTIME_READY 全流程，`knowledge.json`／
`report.md`／`index.json.lifecycleStage` 皆正確產出，新增 `tests/regression/
RepositoryFoundation.js` 第 [11] 組（9 項檢查）永久化此驗證。

## AI-808：PASS

`AHS.TutorMessage.build(context, pageContext)` 新增選填第二參數（向下相容，既有呼叫端行為
不變）：當真實 `materialId` 存在且能解析到真實 `AHS.MaterialRuntime` 記錄時，訊息優先提及
該教材的標題／章節／閱讀進度／該教材專屬的錯題精熟狀態（透過 AI-803 新增的
`AHS.LearningStateRuntime`，非第二次計算）。「目前頁面」（`page`）／「目前測驗」
（`examId`）同步傳遞。教材中心／學習總結／測驗中心／錯題本／複習中心／首頁／AI Tutor 全部
7 個掛載點皆已傳入真實 pageContext（`AppMaterials.js`／`AppSummary.js`／`AppQuiz.js`／
`AppWrongBook.js`／`AppReview.js`／`AppHome.js`／`AppTutor.js`）。`AppTutor.js` 額外真實讀取
`?materialId=`/`?examId=`（目前無既有頁面連結帶入，誠實揭露非隱藏 — 比照 Sprint AI-103
ImportRuntime.js「先建能力，UI 入口後續補上」的既有先例）。不得固定文字／不得與問題無關 —
每句訊息皆由真實資料組成，無真實資料時該句子不出現（既有 AI-111 的誠實原則延續）。

## AI-809：PASS

`docs/Architecture/Architecture_Module_Responsibility_Matrix_v1.0.md`：逐一核對 8 個模組後
確認彼此皆有唯一、不重疊的核心職責（見文件內對照表），因此**未執行任何模組整併**——這是
檢查後的結論，不是省略檢查。文件同時記錄本 Sprint 已收斂的「重複邏輯」（非模組本身）：
正確率/Progress/Mastery 定義、AI 建議文字生成、科目完成狀態判定，皆已統一到單一來源。

## AI-810：PASS

重新檢視 `js/data/AppConfig.js` 的 `nav.items`／`nav.bottomItems`：Sidebar 8 個項目排序
（首頁→教材中心→測驗中心→錯題本→學習總結→複習中心→我的學習→AI Tutor）符合學習流程
（先學習教材、測驗、處理錯題，再看總結／複習／個人統計，最後 AI Tutor 作為橫向支援入口），
評估後判定目前資訊架構已屬合理，未見需要調整排序／名稱的具體證據，因此未變更（避免無實證
的改動）。Bottom Navigation「我的」的既有真實缺陷已於 Platform Refactor Master 修正（指向
`learning.html` 而非已淘汰的 `dashboard.html`），本 Sprint 重新確認該修正仍然有效。

## AI-811：PASS（無重複，但揭露「雙軌」的真實定義）

`js/runtime/TeachingMaterialLoader.js` 為唯一 Loader，`docs/TeachingMaterials/scripts/
TeachingMaterialAdapter.js` 為唯一（離線）Adapter，`AHS.MaterialRuntime`／`SummaryRuntime`／
`QuestionRuntime` 為唯一 Runtime 鏈 — 逐一確認 `js/runtime/` 全庫無重複命名空間（grep 全庫
`AHS.*Runtime =` 定義，0 筆重複）。字面上唯一符合「Dual」描述的是**兩個內容authoring
來源格式**（`docs/TeachingMaterials/` Package track 與 `data/materials/` Repository track），
但這是 Sprint AI-112（已 PO 核准 LOCK）明確記載、刻意保留的雙軌架構，兩者橋接進同一個
Runtime 鏈，非重複的 Runtime／Loader／Adapter。本 Sprint 未合併或刪除任一軌 — 這類架構層級
的變動需要明確的 PO 指示，而非在 Hardening Sprint 中片面決定刪除一整批已存在、已驗證的
真實教材資料通道。

## AI-812：PASS

重新確認首頁／測驗中心／我的學習／學習總結／複習中心／錯題本／AI Tutor 全部數值一致：
正確率統一來自 `StatisticsRuntime.overview().avgAccuracy`（`MyLearning.js`、`QuizCenter.js`
皆同源）；精熟度統一來自 `WrongBookRuntime.correctStreak >= 3`（`WrongBook.js`、
`StatisticsRuntime.masteredReviewItems()`、複習中心皆同源）。`tests/jsdom/BehaviorSuite.js`
群組 [35] 專門驗證此點（非退化案例：兩公式在特定資料下真的會分歧，證明測試本身有效），
本次重跑仍 PASS。

## AI-813：PASS

完整重新驗證教材→Summary→Quiz→WrongBook→Review→Tutor→我的學習→首頁：`tests/regression/
RepositoryFoundation.js`（29/29，含新增第 [11] 組）+ `tests/jsdom/BehaviorSuite.js` 群組
[33]-[39]（涵蓋 AI-109／AI-111／Platform Sync Check／Platform Refactor Master／本 Sprint
新增項目）全數 PASS，無新發現的跨頁資料不一致。

## AI-814：PASS

刪除 3 個確認零真實引用的檔案：`js/data/MockData.js`（853 行，Platform Sync Check 已確認
inert，本 Sprint 無保護條款，正式刪除）、`js/data/ExamData.js`、`js/data/TasksData.js`
（皆為 Sprint 7.0 Production Cleanup 遺留、已從所有 HTML 移除 `<script>` 標籤但檔案本身
未刪除；對應的 `Countdown.js`／`TaskUtils.js` 已有既有的 null-safe 降級邏輯，刪除後行為
不變，僅移除死檔案）。稽核全庫 `AHS.*Runtime =`／`AHS.*=` 命名空間定義，確認零重複。稽核
「未被任何 HTML `<script>` 引用」的 JS 檔案清單（46 筆），逐一核對後確認其餘全部屬於
Node 測試／工具腳本（`tests/`／`scripts/`／`docs/TeachingMaterials/scripts/`，本就不透過
`<script>` 載入）或「刻意先建能力、UI 入口尚未接上」的既有 LOCKed 基礎設施（`ImportRuntime.js`
等 7 個 Sprint AI-100～AI-103／Sprint 8.0 檔案，皆有專屬 Regression Test 證明仍可運作 —
實測 `ImportRuntimeV1.js`／`KnowledgeFoundationV1.js` 皆 PASS），非死碼，未刪除。
`npm run verify` 確認零 Broken Import / 零 Legacy Reference。

## Verify：PASS

`npm run verify` — VerifyPaths 0 broken / 0 legacy references；VerifyForbiddenPatterns
PASS（1 個既有、已追蹤的 `window.location.href` 例外，`HomeRecentMaterials.js`，本 Sprint
未觸碰）。

## Test：PASS

`npm test` 全數通過：
- BehaviorSuite **306/306 PASS**（新增群組 [38] Settings/User Menu 11 項、[39] AI Tutor
  Context 材料客製化 4 項）
- PipelineRegression **6/6 PASS**
- RepositoryFoundation **29/29 PASS**（新增第 [11] 組 Material Lifecycle + Package
  Standard 9 項）

## Merge Commit：

填於合併後。

## GitHub Pages：

填於合併後。

## Root Cause

Platform Hardening 的根因與 Platform Refactor Master 相同：底層資料管線（Material →
Summary → Question → Quiz → WrongBook → Review → History → Statistics → Tutor）本身沒有
Bug；本次真正新增/修正的是三類真實缺口：(1) 設定與登出功能完全沒有實作（Sidebar/Profile
Menu 按鈕存在但零行為，是真正的 Stub），(2) AI Tutor 的建議文字雖已真實化（Sprint AI-111）
但仍是「與頁面無關」的通用文字，未真正依「目前教材」客製化，(3) 教材生命週期與正式 Package
標準此前只存在於文件層級的描述，沒有任何工具能實際「辨識」一筆教材目前處於哪個階段。三者
皆已修正為真實、可測試、可重現的功能。

## 修改檔案

**新增（Runtime/UI/工具）**
- `js/runtime/LearningStateRuntime.js`（AI-803）
- `js/runtime/SettingsRuntime.js`、`js/ui/SettingsPanel.js`、`css/components/settings-panel.css`（AI-804/805）
- `docs/TeachingMaterials/scripts/MaterialLifecycle.js`（AI-806）
- `docs/TeachingMaterials/schema/Knowledge.schema.json`（AI-807）
- `docs/Architecture/Architecture_Module_Responsibility_Matrix_v1.0.md`（AI-809）

**修改**
- `js/core/PersistenceAdapter.js` — `exportAll()`/`importAll()`（AI-804）
- `js/runtime/WrongBookRuntime.js`、`js/runtime/HistoryRuntime.js` — `importRecords()`（AI-804）
- `js/ui/AppShell.js` — 真實 Settings Panel 掛載、Sidebar/Profile Menu 真實 wiring、真實 Logout（AI-804/805）
- `js/components/MyLearning.js` — 科目進度狀態改用 `LearningStateRuntime`（AI-803）
- `js/utils/TutorMessage.js` — `pageContext` 客製化訊息（AI-808）
- `js/ui/TutorContextTip.js`、`js/pages/AppHome.js`、`js/pages/AppTutor.js`、
  `js/pages/AppMaterials.js`、`js/pages/AppSummary.js`、`js/pages/AppQuiz.js`、
  `js/pages/AppWrongBook.js`、`js/pages/AppReview.js` — 真實 pageContext 傳遞 + Settings
  showTutorSuggestions 開關（AI-804/808）
- `docs/TeachingMaterials/scripts/GenerateTeachingMaterialData.js`、
  `docs/TeachingMaterials/scripts/ValidateMaterial.js` — Lifecycle/knowledge.json/report.md（AI-806/807）
- `docs/TeachingMaterials/README.md` — Package 結構與 Lifecycle 說明更新（AI-806/807）
- `index.html`／`materials.html`／`summary.html`／`quiz.html`／`wrongbook.html`／
  `review.html`／`learning.html`／`tutor.html`／`dashboard.html` — 新增 `<script>`/`<link>`
  （SettingsRuntime/SettingsPanel/LearningStateRuntime/DocumentExport，僅缺少處補上）
- `tests/jsdom/BehaviorSuite.js` — 新增群組 [38]/[39]
- `tests/regression/RepositoryFoundation.js` — 新增第 [11] 組
- `docs/PMO/PROJECT_STATUS.json`、`docs/PMO/SPRINT.json`

**刪除**
- `js/data/MockData.js`、`js/data/ExamData.js`、`js/data/TasksData.js`（AI-814，確認零真實引用）

待 Project Owner PAT。
