# ImplementationReport.md — Sprint AI-103｜Content Import Runtime

Priority：P0 ｜ Type：Feature Sprint（新增功能，Execution only）｜ 完成後停止，等待 PMO 驗收。

## Background — PMO Decision AI-103-001

本 Sprint 為前一版本（Sprint 7｜Content Import Runtime）依 Repository Truth 修正後的重新發布版本。
前一版本要求「建立 Material Runtime／Summary Runtime／WrongBook Runtime」與新增頂層 `/import`
資料夾，經回報與既有 Repository 狀態衝突（`AHS.MaterialRuntime`／`AHS.SummaryRuntime`／
`AHS.WrongBookRuntime` 皆已存在且為 LOCK production 程式碼；`docs/Architecture/
Architecture_Repository_Structure_v2.1.md` 未授權任何新頂層資料夾）後，PMO Decision AI-103-001
明確修正：不新增頂層資料夾、不重建既有三個 Runtime、Import Runtime 僅作為 Coordinator。本 Sprint
完全依照修正後版本執行。

## Second Repository Truth Finding（本 Sprint 執行前發現，已依規則處理）

依修正後 Sprint 文字之「若 API 不足：請提出 Runtime Extension，不得自行建立 Parallel Runtime」規則，
實作前逐一核對 5 個既有 Runtime 的真實公開 API，發現：

- `AHS.MaterialRuntime.add()`／`AHS.SummaryRuntime.add()` — 皆已提供「寫入一筆已組好的記錄」的
  泛用 API，Material／Summary Import 可直接呼叫，無需任何修改或擴充。
- `AHS.WrongBookRuntime.sync(gradedResult)` — 雖非泛用「新增一筆」API，但只需將 ErrorBook.json
  的欄位重新組成其既有、未修改的 `gradedResult` 形狀（`{subject, title, chapter, wrong: [...]}`）
  即可直接呼叫，無需擴充。
- `AHS.QuestionRuntime` — **真實 API 缺口**：`loadForExam(examMeta)` 僅能透過
  `AHS.QuestionBank.generate(examMeta)` 產生題目，沒有任何「直接寫入外部提供的題目內容」的
  API。依 Sprint 規則提出並套用一個純新增的 Runtime Extension：`importQuestions(examId,
  questions)`（詳見 Runtime Integration Report）。
- `AHS.ReviewRuntime`／`AHS.DashboardRuntime` — `ReviewRuntime` 純粹是既有 `AutoGrader` 結果的
  唯讀 View-Model 建構器，本 Import Standard 六個固定檔案中沒有對應項目，故無需呼叫。
  `AHS.DashboardRuntime` **經確認完全不存在**於本 Repository（`js/components/Dashboard.js`／
  `js/pages/AppDashboard.js` 皆為既有 UI／頁面檔案，非 Runtime）——不新增亦不需要，詳見 Runtime
  Integration Report 對「Dashboard Refresh」的誠實說明。

## Changed Files

**新增（5 個檔案）**
```
js/runtime/ImportValidator.js   — Required Field／JSON Parse／Markdown／Version／Duplicate 檢查
js/runtime/MetadataParser.js     — Metadata.json 11 個固定欄位解析
js/runtime/ContentLoader.js       — 六個固定檔案讀取與正規化（含 Material.md header/body 分離）
js/runtime/ImportRuntime.js        — Coordinator（無內部 store），呼叫既有 Runtime API
tests/regression/ImportRuntimeV1.js — 35 條 permanent regression 斷言
```

**修改（1 個檔案，純新增，Runtime Extension）**
```
js/runtime/QuestionRuntime.js   + importQuestions(examId, questions)。既有 8 個方法
                                （loadForExam/hasExam/getSet/count/getQuestion/getQuestionById/
                                clear/reset）與其行為完全未變動——已用回歸測試逐一確認。
```

**未修改（依 PMO Decision AI-103-001 明確要求，`git diff` 逐一確認為空）**
```
js/runtime/MaterialRuntime.js
js/runtime/SummaryRuntime.js
js/runtime/WrongBookRuntime.js
js/runtime/ReviewRuntime.js
任何 HTML 頁面
任何既有 UI Component（js/ui/*、js/components/*）
任何 Design System／UI Library CSS
```

**新增頂層資料夾：無**（`/import` 未建立，符合 PMO Decision AI-103-001 第 1 項）。

## Architecture Impact

```
Import Files（Material.md／Summary.json／Quiz.json／Answer.json／Metadata.json／ErrorBook.json）
  → ImportValidator（結構性驗證，唯讀，零 Runtime 寫入）
  → MetadataParser／ContentLoader（純解析，零 Runtime 寫入）
  → ImportRuntime（Coordinator，無內部 store）
      → AHS.MaterialRuntime.add()          【既有 API，未修改】
      → AHS.SummaryRuntime.add()            【既有 API，未修改】
      → AHS.QuestionRuntime.importQuestions() 【既有檔案的純新增方法】
      → AHS.WrongBookRuntime.sync()           【既有 API，未修改】
  → UI（本 Sprint 未接線任何頁面，見下方「UI 範圍」）
```

無違反 Architecture 規則之處：Import 從未直接修改任何 Component（`ImportRuntime` 只呼叫既有
Runtime 的既有公開 API），無平行 Runtime 被建立，無頂層資料夾異動。

### UI 範圍（依「若需要 UI：請放入既有 UI Component 目錄」）

本 Sprint 的五個 Task（AI103-01～05）明確列出 Validator／Parser／Loader／Runtime／Runtime
Integration，並未列出「Import Wizard UI」為必要交付物（與前一版本 Sprint 7 的 T708 不同）。依「若
需要 UI」的條件式措辭，本 Sprint 判斷為：Runtime 層優先完成、UI 接線留待未來 Sprint（與 Sprint
AI-100「built, not wired」→ Sprint AI-101C 才接線 UI 的既有前例一致，避免在同一 Sprint 內同時擴大
Runtime 與 UI 兩個風險面）。`ImportRuntime.importFolder()` 已可直接由未來的 UI 呼叫，無需修改本
Sprint 交付的任何檔案。

## Root Cause

無（Feature Sprint，非 Bug Fix）。

## Regression

見 QAReport.md。摘要：1160/1160 real assertions PASS（175 BehaviorSuite + 6 PipelineRegression +
979 across 25 regression 檔案，PipelineRegression 不重複計算），`npm run verify` PASS，零既有
Runtime／UI 行為變化。

## 停止聲明

依 Sprint 指示，完成後停止。**禁止 Push**，等待 PMO 驗收。
