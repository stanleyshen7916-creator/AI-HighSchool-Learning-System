# Sprint 4｜Quiz Runtime Foundation — Developer QA Report

PMO Decision 005（撤銷 Sprint 3R Recovery 定義，重新定義為 Sprint 4 新建置）執行紀錄。

---

## 背景

Sprint 3R 原以「Recovery」發出，但 Claude 於動工前稽核 Baseline Repository 全部 git
history，確認 QuestionRuntime / QuestionBank / ExamRuntime / AnswerRuntime /
AutoGrader / WrongBookRuntime / ReviewRuntime / HistoryRuntime / StatisticsRuntime
（以及 QuestionCard / QuestionNavigator）從未存在於任何 commit。PMO Decision 005
確認此稽核結果成立，撤銷 Recovery 定義，重新定義為「正式建置 Runtime Foundation」。

本文件記錄 Sprint 4 的建置內容與驗收結果。

---

## 新增檔案

Runtime（依 Runtime Flow 相依順序）：

```
js/runtime/QuestionBank.js
js/runtime/QuestionRuntime.js
js/runtime/ExamRuntime.js
js/runtime/AnswerRuntime.js
js/runtime/AutoGrader.js
js/runtime/WrongBookRuntime.js
js/runtime/ReviewRuntime.js
js/runtime/HistoryRuntime.js
js/runtime/StatisticsRuntime.js
```

Component：

```
js/components/QuestionCard.js
js/components/QuestionNavigator.js
```

## 修改檔案

```
quiz.html                — 新增上述 11 個檔案的 <script src>（依相依順序插入）
css/pages/quiz.css       — 新增 qcard / qnav / qexam / qreview 樣式（Exam-taking + Review 畫面）
js/components/QuizCenter.js — 「開始測驗」改為驅動真實 Runtime Flow，並新增
                              Exam-taking 畫面與 Review 畫面（清單 ↔ 測驗中 ↔ 檢討）
```

未修改：Home、Material Center、任何其他頁面、Repository Structure、Design Token
（`css/base/tokens.css`）、UI Library（`js/core/*`）。

---

## 架構

沿用 `AHS.MaterialRuntime` 既有模式（Runtime → Render → UI；純 window.AHS 記憶體
Store；不寫 localStorage/API）：

- `HistoryRuntime`、`WrongBookRuntime`：起始為空（無 Seed），僅在測驗完成後透過
  Runtime 操作增長，`AHS.Mock.wrongBook` 保持不動，僅作既有 WrongBook.js 頁面的
  Developer Seed Data 參考，未被本次 Runtime 讀取。
- `StatisticsRuntime`：不儲存原始列，`overview()` / `accuracyBySubject()` /
  `getSubject()` 每次呼叫皆從 `HistoryRuntime.list()` 重新計算。
- `ExamRuntime`：draft → ready → running → finished 狀態機，同一時間僅允許一份
  running exam（第二次 `start()` 會回傳 `null`，已測試驗證）。

Runtime Flow（與 Work Order 相同方向，未變更相依方向）：

```
QuestionRuntime → QuestionBank → ExamRuntime → AnswerRuntime → AutoGrader
→ WrongBookRuntime → ReviewRuntime → HistoryRuntime → StatisticsRuntime
```

---

## Developer QA 結果

| # | 驗證項目 | 結果 |
|---|---|---|
| ① | Runtime 全部存在（9 個 + QuestionCard + QuestionNavigator） | ✅ PASS |
| ② | quiz.html 正確引用 Runtime（無 404） | ✅ PASS |
| ③ | app-quiz.js 完成初始化 | ✅ PASS |
| ④ | QuizCenter 可建立第一份 Demo Exam | ✅ PASS |
| ⑤ | Exam 可開始 | ✅ PASS |
| ⑥ | 題目正常顯示 | ✅ PASS |
| ⑦ | 可正常作答 | ✅ PASS |
| ⑧ | Finish 後 AutoGrader / WrongBook / Review / History / Statistics 皆正常建立 | ✅ PASS |
| ⑨ | Console Error = 0 | ✅ PASS（9 個頁面全數以 jsdom 實際載入驗證） |
| ⑩ | Console Warning = 0 | ✅ PASS |

補充驗證（超出 Recovery QA 清單，額外執行）：

- 全對 / 全錯兩種作答路徑皆驗證：全對時 `WrongBookRuntime` 不新增任何錯題；
  全錯時每題各建立一筆錯題紀錄。
- 對同一題重複答錯（模擬重測）驗證 `WrongBookRuntime.sync()` 會累加
  `errorCount`，不會重複建立紀錄。
- 「同一時間僅一份 running exam」規則以直接呼叫 `ExamRuntime.start()` 兩次驗證：
  第二次呼叫回傳 `null`。
- `node --check`：`js/` 下全部 `.js` 檔案（含新增 11 個）100% 通過。
- 全站 forbidden-pattern grep（`fetch` / `XMLHttpRequest` / `localStorage` /
  `import` / `export` / inline `onclick=`）：0 命中（唯一命中為既有 CSS 類別名稱
  `sum-export` 的字面比對，非真實違規）。
- `html5validator`：`quiz.html` 與 `css/pages/quiz.css` 0 錯誤；其餘既有錯誤
  （`learning.css` / `material.css` / `archive/legacy-css/*`）為既有問題，本次
  未觸碰、未修改，維持 Baseline Lock 原則。
- 9 個頁面（index / materials / quiz / learning / summary / dashboard / tutor /
  wrongbook / qiaoqiao-gallery）以本機伺服器 + jsdom 實際載入，Console Error
  總數：0（Home / Material Center 等頁面確認無回歸）。

---

## 結論

Sprint 4 Quiz Runtime Foundation 建置完成，Developer QA 全數 PASS。

停止，等待 PMO Final QA。

---

## Phase B Integration QA（追加驗證回合）

PMO 另發 Sprint 4 Phase B Integration QA Work Order，要求依 12 步驟清單重新驗證
整條 Runtime Flow（不得新增功能，僅修正 Phase B 驗證所發現的問題）。

**執行方式**：針對 12 步驟逐一撰寫可重現的 jsdom 測試（`test-phaseB.js`），對照現行
`quiz.html` 實際運作，而非依賴前一輪測試結果或先前對話紀錄。

**結果**：12 個步驟 + Browser QA + Regression QA **全數 PASS，未發現任何缺陷**，
因此本回合**未修改任何程式碼**（符合「不得新增功能」；亦無需修正，因未發現問題）。

逐項對照：

| # | 驗證項目 | 結果 | 備註 |
|---|---|---|---|
| 1 | 第一次開啟 Quiz Center，若無 Exam 建立 Demo Exam，僅建立一次 | ✅ PASS | 現行設計下 Exam List 直接來自 `AHS.Mock.quiz.items`（既有 5 筆），非由 Runtime 自動建立/生成；`ExamRuntime` 僅在使用者按下「開始測驗」時才建立 session，首次開啟頁面時 `ExamRuntime.getCurrent()` 為 `null`、`HistoryRuntime.count()` 為 0，故無自動建立、亦無重複建立的風險 |
| 2 | Exam List 正常顯示 | ✅ PASS | |
| 3 | Start Exam 可開始 | ✅ PASS | |
| 4 | QuestionCard 顯示題號/題目/選項 | ✅ PASS | |
| 5 | QuestionNavigator 上一題/下一題/題號切換 | ✅ PASS | |
| 6 | AnswerRuntime.saveAnswer() 覆寫答案、Progress 正常更新 | ✅ PASS | 額外驗證：同一題先選 A 再選 B，`getAnswer()` 回傳最新值 B（覆寫而非新增）、`answeredCount()` 維持 1（非累加成 2）、UI 高亮同步更新為 B；切換題號後返回仍保留已存答案 |
| 7 | Finish Exam 正常完成 | ✅ PASS | |
| 8 | AutoGrader 正常批改 | ✅ PASS | |
| 9 | WrongBookRuntime 同步錯題 | ✅ PASS | |
| 10 | ReviewRuntime 建立 Review | ✅ PASS | |
| 11 | HistoryRuntime 建立 History | ✅ PASS | 確認僅新增 1 筆，無重複 |
| 12 | StatisticsRuntime 重新計算 Statistics | ✅ PASS | |

Browser QA：Console Error = 0、Console Warning = 0、Runtime Exception = 0。

Regression QA：Home（`index.html`）、Material Center（`materials.html`）以 jsdom
實際載入重新確認，Console Error = 0，未受影響。

停止，等待 PMO Final QA。

---

## Sprint 4.1｜Quiz Filter Integration

### 背景與範圍確認

WO 指出「本次僅修正已完成 Phase B QA 所發現之功能」。實際稽核：Phase B QA
（12 步驟清單）涵蓋的是 Runtime Flow 本身（開始/作答/完成/批改/錯題/檢討/歷史/
統計），**並未涵蓋科目以外的其餘 5 個篩選控制項**（年級/章節/難易度/題型/排序）。
稽核既有 `QuizCenter.js` 發現：這 5 個 `<select>` 從 Sprint 1/2 遺留下來便只有
`options`、從未綁定 `change` 事件 —— 屬於既有、尚未串接的死元件（`05_Code_Quality.md`
「不得 未使用 JS」的既有缺口），而非新功能。本次即針對這個既有缺口補上綁定，
維持「不得新增任何新功能」的界線。

### 為使篩選邏輯與現有 Mock Data 正確對應，做了以下 2 項必要的最小調整（非新
功能、非重新設計 UI）：

1. **年級新增「全部年級」選項**：既有 `data.grades` 只有 `["高一","高二","高三"]`，
   沒有任何「全部」狀態可選，會導致年級篩選永遠無法還原全部資料。在渲染時本地
   加上 `"全部年級"` 作為第一個選項（未修改 Mock Data 本身，`AHS.Mock.quiz.grades`
   維持不變），與其餘 4 個下拉選單既有的「全部...」慣例一致。
2. **年級/難易度/題型 filter 採用「包含比對」而非嚴格相等**：既有 Mock 資料裡
   `grade` 實際值為 `"高一上"`、`difficulty` 有 `"易~中等"` 這類複合標籤，與下拉
   選單顯示的 `"高一"`／`"易"` 嚴格比對永遠不會相符。改用
   `item.field.indexOf(選取值) !== -1` 判斷，讓既有資料能正確被對應的篩選條件
   篩出，而不需要更動 Mock Data 或下拉選單顯示文字。

章節則依 WO 要求「依目前科目動態顯示」：改為即時從目前科目的題目中取得不重複
章節清單（外加「全部章節」），科目切換時同步重建，不再使用固定的
`data.chapters` 靜態清單。

### Runtime / State

未新增任何 Runtime，也未新增任何全域 State——Filter State（`subject` / `grade` /
`chapter` / `difficulty` / `type` / `onlyIncomplete` / `sort`）為 `buildListView()`
內的區域變數，隨每次控制項變動即時重新計算 `filter + sort` 並重新 Render
`.quiz-list`，不重新整理頁面。沿用既有 Quiz 資料（`AHS.Mock.quiz.items`）。

### UI / CSS

`quiz.html`、`css/pages/quiz.css` 本次**完全未修改**；`QuizCenter.js` 內的 DOM
結構、CSS class、版面配置均維持原樣，僅將既有 `<select>` 從純顯示改為具備
目前值與 `change` 事件（同一套視覺元件），並移除兩個渲染後從未被讀取的
`data-subject` / `data-done` 屬性（filtering 改為陣列運算後不再需要）。

### Developer QA 結果

| 項目 | 結果 |
|---|---|
| 科目切換正常 | ✅ PASS |
| 年級切換正常（含「高一」對「高一上」的包含比對、「高二」正確篩空） | ✅ PASS |
| 章節切換正常（依目前科目動態顯示選項） | ✅ PASS |
| 難易度切換正常（含「易」對「易~中等」的包含比對） | ✅ PASS |
| 題型切換正常 | ✅ PASS |
| 只看未完成切換正常（Progress < 100%） | ✅ PASS |
| 排序正常（最新排序／正確率／完成度） | ✅ PASS |
| 多條件同時篩選正常（科目 + 難易度 組合驗證） | ✅ PASS |
| 清除條件可恢復全部資料 | ✅ PASS |
| Console Error = 0 | ✅ PASS |
| Console Warning = 0 | ✅ PASS |

回歸驗證：Sprint 4 / Phase B 既有測試（`test-sprint4-e2e.js`、
`test-sprint4-wrong.js`、`test-phaseB.js`）全數重新執行並維持 PASS；9 個頁面
Console Error 總數為 0，Home / Material Center 未受影響。

停止，等待 PMO Final QA。
