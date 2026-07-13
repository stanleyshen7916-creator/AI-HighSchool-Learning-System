# MISSING_FILES.md

Repository Refactor v2.0 — PMO Decision 001 執行紀錄

依據 PMO Decision 001：

> 若 Runtime 檔案不存在，不得重建，建立本檔紀錄即可。

本次整理過程中確認以下檔案在目前 repository（本次上傳的 zip）中**不存在**，
但被對應頁面的 `<script src="...">` 引用。這些屬於既有缺失，
**非本次 Repository Refactor v2.0 造成，本次整理不予新增或重建**。

---

## quiz.html 引用但不存在的檔案

| 缺失路徑 | 引用頁面 |
|---|---|
| `js/runtime/QuestionRuntime.js` | quiz.html |
| `js/runtime/QuestionBank.js` | quiz.html |
| `js/runtime/ExamRuntime.js` | quiz.html |
| `js/components/QuestionCard.js` | quiz.html |
| `js/components/QuestionNavigator.js` | quiz.html |

> 對應 PMO Decision 001 明確列出的三個 Runtime 檔案。

---

## 其他已知缺失（未在 Decision 001 逐一列出，但一併紀錄供 PMO/GPT 參考）

Project Memory 中提及 Sprint 3 已建置完成的下列 Runtime，
在本次 zip 中同樣找不到對應檔案：

- `AnswerRuntime`
- `AutoGrader`
- `WrongBookRuntime`
- `ReviewRuntime`
- `HistoryRuntime`
- `StatisticsRuntime`

這些模組未被任何現存 `.html` 直接以 `<script src>` 引用，
因此**不影響**本次 Console Error / 404 驗證結果，
僅在此併同記錄，供後續確認「這份 zip 是否為 GitHub 最新狀態」時參考。

---

## 驗證結果（Repository Refactor v2.0 時）

quiz.html 在瀏覽器（jsdom 模擬）中因上述 5 個檔案 404 而**無法載入該 5 個 script**，
但頁面本身執行時 **Console Error = 0**（`app-quiz.js` 未因缺檔而拋出例外）。

## QA Fix Sprint 後更新

依 BLOCKER 001 裁定，已將上述 5 個 `<script src>` 從 `quiz.html` 移除
（確認 `QuizCenter.js` 內部無任何依賴，移除不影響功能）。
**這些檔案本身依然不存在，也依然沒有被重建**——本節僅紀錄「檔案缺失」這件事實，
移除的只是 HTML 內指向這些不存在檔案的失效引用，不代表功能已補齊。

本檔案僅作紀錄，不代表 Quiz Center 的 Runtime 分層功能已完整實作。
