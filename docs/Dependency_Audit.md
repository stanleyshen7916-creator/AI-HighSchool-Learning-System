# Dependency_Audit.md

QA Fix Sprint — BLOCKER 002 / BLOCKER 003 稽核紀錄

---

## 1. 全站引用掃描（BLOCKER 002）

掃描對象：全部 9 個 `.html` 內的 `<script src>` `<link href>` `favicon href`。

| 項目 | 結果 |
|---|---|
| 總引用數 | 134 |
| 存在／可解析 | 134 |
| 404／失效引用 | 0 |
| 絕對路徑（`/` 開頭，會破壞 GitHub Pages 子路徑部署） | 0 |

CSS 內 `background-image` 全數為 `linear-gradient(...)`，無 `url(...)` 圖片路徑，
故 CSS 不含任何可能失效的資源引用。

## 2. 動態（JS 組字串）路徑掃描

除了 HTML 靜態屬性引用外，額外掃描 JS 內以字串組合方式動態產生的資源路徑：

- `js/core/Qiaoqiao.js`：`EXPR_BASE = "assets/expressions/"`、`POSE_BASE = "assets/avatars/"`，
  組合出 16 張巧巧老師圖片路徑。此為 **本次 QA Fix Sprint 修正項目**——
  Repository Refactor v2.0 搬移圖片資產時，此檔案原本硬編碼的 `BASE = "assets/qiaoqiao/"`
  未同步更新，導致 16 張圖片實際上全部 404（靜態 HTML 掃描無法偵測，因為路徑是執行期字串組合產生，
  不是 HTML attribute）。現已修正為兩個獨立常數對應搬移後的實際資料夾，
  並確認 16 個檔案皆存在於對應路徑。
- 其餘 `js/` 內檔案未發現其他硬編碼路徑字串。

## 3. Runtime Inventory（BLOCKER 003）

| Runtime 名稱 | 檔案路徑 | 狀態 | 被引用於 |
|---|---|---|---|
| MaterialRuntime | `js/runtime/MaterialRuntime.js` | ✅ 存在 | materials.html |
| QuestionRuntime | — | ❌ 不存在（PMO Decision 001：禁止重建） | 已從 quiz.html 移除引用 |
| QuestionBank | — | ❌ 不存在（PMO Decision 001：禁止重建） | 已從 quiz.html 移除引用 |
| ExamRuntime | — | ❌ 不存在（PMO Decision 001：禁止重建） | 已從 quiz.html 移除引用 |
| AnswerRuntime | — | ❌ 不存在（Memory 提及但 zip 內無此檔） | 無任何頁面引用，不受影響 |
| AutoGrader | — | ❌ 不存在 | 無任何頁面引用，不受影響 |
| WrongBookRuntime | — | ❌ 不存在 | 無任何頁面引用，不受影響 |
| ReviewRuntime | — | ❌ 不存在 | 無任何頁面引用，不受影響 |
| HistoryRuntime | — | ❌ 不存在 | 無任何頁面引用，不受影響 |
| StatisticsRuntime | — | ❌ 不存在 | 無任何頁面引用，不受影響 |

**HTML → JS → Runtime 一致性結論：**

- `js/components/QuizCenter.js` 內部**未引用**任何 QuestionRuntime / QuestionBank / ExamRuntime /
  QuestionCard / QuestionNavigator（已逐行 grep 確認零匹配），因此移除 quiz.html 內對應的
  5 個 `<script src>` 標籤**不影響任何現有邏輯**，純粹是移除從未真正被使用過的失效引用。
- 移除後 quiz.html 100% 一致：所有被引用的 JS 皆存在，所有存在的 JS 皆有被引用（`AppShell.js`、`QuizCenter.js`、
  加上共用的 `ui.js / Icons.js / mock-data.js / Qiaoqiao.js / app-quiz.js`）。
- 未建立任何 Placeholder 檔案，未重建任何缺失 Runtime。

## 4. 孤兒檔案重新掃描（BLOCKER 004）

比對 `css/` `js/` `assets/` 下所有實體檔案 vs. 全站引用（含動態路徑）：

- 候選檔案總數：82
- 孤兒數：**0**

（16 張巧巧老師圖片原被誤判為孤兒，經確認為 `Qiaoqiao.js` 動態組字串載入，非孤兒，
且經本次修正後路徑已正確對應。）

`archive/` 內容維持 Repository Refactor v2.0 時的搬移結果，未再變動。

## 5. Route Validation（BLOCKER 005）

9 個頁面（Home / Material / Quiz / WrongBook / Learning / Summary / Tutor / Dashboard /
Qiaoqiao Gallery）之 HTML → CSS → JS → Assets 全路徑鏈已逐一走訪，
結果詳見 `QA_FIX_Report.md`。

> 註：`Developer` 頁面（`developer.html`）目前 repository 中不存在，非本次新增範圍，
> 詳見 `MISSING_FILES.md`。
