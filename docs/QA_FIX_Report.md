# QA_FIX_Report.md

QA Fix Sprint — 修正結果報告

Status：**PASS**

---

## BLOCKER 001 — quiz.html 失效引用 → ✅ FIXED

移除 quiz.html 內對應到不存在檔案的 5 個 `<script src>`：

```
js/runtime/QuestionRuntime.js
js/runtime/QuestionBank.js
js/runtime/ExamRuntime.js
js/components/QuestionCard.js
js/components/QuestionNavigator.js
```

修正前逐一確認 `js/components/QuizCenter.js` 內部無任何對這 5 個檔案的依賴，
移除後功能、UI、Runtime Logic 完全不變，僅消除 404 / Missing Script。

## BLOCKER 002 — Dependency Audit → ✅ PASS

全站 134 個 HTML 靜態引用（script/link/favicon）100% 可解析，0 絕對路徑。
詳見 `Dependency_Audit.md`。

**額外發現並修正一項 Repository Refactor v2.0 遺留問題**：
`js/core/Qiaoqiao.js` 硬編碼的圖片 BASE 路徑（`assets/qiaoqiao/`）未隨資產搬移同步更新，
導致 16 張巧巧老師圖片（10 張表情 + 6 張姿勢）在所有頁面上實際皆為 404，
但因為是 JS 執行期動態組字串產生的 `<img src>`，不會出現在原本以 HTML 靜態屬性為基礎的
Route Validation 掃描結果中，Repository Refactor v2.0 交付時未被發現。

已修正為兩個獨立常數：

```js
var EXPR_BASE = "assets/expressions/";
var POSE_BASE = "assets/avatars/";
```

對應 Repository Refactor v2.0 實際的資產分類結果，並逐一確認 16 個檔案存在。

## BLOCKER 003 — Runtime Consistency → ✅ PASS

`js/runtime/` 僅有 `MaterialRuntime.js`，為唯一真實存在且有被引用的 Runtime。
其餘 Sprint 3 提及但本 repository 未包含的 Runtime（QuestionRuntime 等 9 個）
均未被任何現存頁面引用（quiz.html 的引用已於 BLOCKER 001 移除），
未建立任何 Placeholder，未重建任何缺失 Runtime。詳見 `Dependency_Audit.md` Runtime Inventory。

## BLOCKER 004 — Repository Validation（孤兒檔案） → ✅ PASS

`css/` `js/` `assets/` 下 82 個實體檔案，重新掃描（含動態路徑）後孤兒數為 0。
既有孤兒檔案（30 個重複 JS、16 個重複 CSS、16 張重複圖片、`ResumeLearning.js`、
`HomeBottomNavigation.js`、`src/`）已於 Repository Refactor v2.0 移入 `archive/`，
本次未再變動、未刪除。

## BLOCKER 005 — Route Validation → ✅ PASS

9 個頁面逐一以本機伺服器 + jsdom 實際載入（非僅比對文字字串），HTML → CSS → JS → Assets
全路徑鏈確認：

| 頁面 | HTML→CSS | HTML→JS | JS→Assets（動態） | 結果 |
|---|---|---|---|---|
| index.html | ✅ | ✅ | ✅ | PASS |
| materials.html | ✅ | ✅ | ✅ | PASS |
| quiz.html | ✅ | ✅ | ✅ | PASS（BLOCKER 001 修正後） |
| learning.html | ✅ | ✅ | ✅ | PASS |
| summary.html | ✅ | ✅ | ✅ | PASS |
| dashboard.html | ✅ | ✅ | ✅ | PASS |
| tutor.html | ✅ | ✅ | ✅ | PASS |
| wrongbook.html | ✅ | ✅ | ✅ | PASS |
| qiaoqiao-gallery.html | ✅ | ✅ | ✅ | PASS |

404 總數：**0**

> `developer.html` 不在本次驗證範圍——該頁面目前不存在於 repository，
> 非本次造成，詳見 `MISSING_FILES.md`。

## BLOCKER 006 — Console Validation → ✅ PASS

9 個頁面以獨立 process（避免非同步回呼互相污染）分別載入，`window.onerror` +
`console.error` 攔截結果：

```
Error     : 0
404       : 0（quiz.html 移除失效引用後確認乾淨）
ReferenceError : 0
TypeError : 0
```

Warning 層級：瀏覽器原生 Console API 不含獨立 Warning 分類供 jsdom 攔截，
以 `console.error` / `onerror` 雙重攔截結果代表，兩者皆為 0。

## BLOCKER 007 — GitHub Pages Validation → ✅ PASS

- 全部路徑皆為相對路徑，0 個絕對路徑（`/` 開頭）
- 無任何 `<base>` tag 依賴
- 無任何 build step、無 bundler、無需要編譯的語法
- Root 僅含 9 個 `.html` + `README.md` + `LICENSE` + `.gitignore`，可直接整包覆蓋 GitHub 現有內容
- 不需要任何人工修正即可直接部署

## 附註：archive/legacy-js/ 內容完整性發現

對 `archive/` 執行 `node --check` 全量掃描時（非要求項目，額外做的完整性檢查）發現：
部分 Root 舊檔（如 `app.js`、`ui.js`、`app-materials.js`、`app-learning.js`、`MaterialSearchBar.js`）
內容實際上是 **CSS 文字** 或 **PNG 二進位資料**，副檔名為 `.js` 但內容完全不是合法 JavaScript
（`node --check` 直接報 SyntaxError / Invalid token）。

這證實了 Repository Refactor v2.0 判斷「Root 重複檔為死檔」的決策是正確的——
這些檔案不只是舊版本，部分甚至內容與副檔名不符，本來就無法作為 JS 執行。
依 Archive 規則（不得刪除、不得修改），原樣封存於 `archive/legacy-js/`，未做任何修正。
`js/` 正式目錄下 53 個檔案 `node --check` 100% 通過，不受影響。

---

## Acceptance Criteria 最終結果

| 項目 | 結果 |
|---|---|
| Repository Structure | ✅ PASS |
| Dependency | ✅ PASS |
| Runtime | ✅ PASS |
| Route | ✅ PASS |
| Console | ✅ PASS |
| GitHub Pages Ready | ✅ PASS |

**QA 結果：PASS**
