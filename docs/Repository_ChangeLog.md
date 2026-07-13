# Repository_ChangeLog.md

Repository Refactor v2.0

Status: EXECUTED

Engineer: Claude

---

## QA Fix Sprint（本次追加）

- **BLOCKER 001**：移除 `quiz.html` 內指向不存在檔案的 5 個 `<script src>`
  （`QuestionRuntime.js` `QuestionBank.js` `ExamRuntime.js` `QuestionCard.js` `QuestionNavigator.js`）。
  確認 `QuizCenter.js` 無任何依賴後移除，不影響功能。
- **修正 Repository Refactor v2.0 遺留 Bug**：`js/core/Qiaoqiao.js` 硬編碼的圖片路徑常數
  `BASE = "assets/qiaoqiao/"` 未隨資產搬移同步更新，導致 16 張巧巧老師圖片實際 404
  （HTML 靜態掃描未能發現，因為路徑是 JS 執行期字串組合產生）。
  已修正為 `EXPR_BASE = "assets/expressions/"` 與 `POSE_BASE = "assets/avatars/"` 兩個常數。
- 新增 `docs/Dependency_Audit.md`、`docs/QA_FIX_Report.md`
- 詳細修正內容與逐項驗證結果見 `QA_FIX_Report.md`

---

## 1. Root

清空 Root 下所有鬆散 `.js` / `.css` / `.png`，僅保留：

```
index.html / materials.html / quiz.html / learning.html /
summary.html / dashboard.html / tutor.html / wrongbook.html /
qiaoqiao-gallery.html
README.md / LICENSE / .gitignore
```

> 註：`developer.html` 依規範應存在於 Root，但目前 repository 中從未建立過此檔案。
> 依「No Feature Change」原則，本次不新建此頁面，已記錄於 `docs/MISSING_FILES.md`。
>
> 註：`qiaoqiao-gallery.html` 為既有真實頁面，Repository Structure 規範的 Root 清單未列出此檔，
> 判斷為規範遺漏而非要求刪除，故保留於 Root。

## 2. assets/

- `assets/favicon.svg` → `assets/icons/favicon.svg`
- `assets/qiaoqiao/expr_*.png`（10 個）→ `assets/expressions/`
- `assets/qiaoqiao/pose_*.png`（6 個）→ `assets/avatars/`
- Root 重複圖片 `expr_*.png` / `pose_*.png`（16 個，未被任何頁面引用）→ `archive/legacy-images/`
- 移除舊版空殼分類（`avatar/ icon/ illustration/ image/ logo/ mascot/`，內容僅 `.gitkeep`，無實體檔案）
- 新增標準分類：`assets/images/` `assets/expressions/` `assets/icons/` `assets/avatars/` `assets/logos/`

## 3. css/

- `css/tokens.css` → `css/base/tokens.css`
- `css/shell.css` → `css/layout/shell.css`
- `css/qiaoqiao.css` → `css/components/qiaoqiao.css`
- `css/home.css css/material.css css/quiz.css css/wrongbook.css css/learning.css css/summary.css css/tutor.css css/dashboard.css css/qiaoqiao-gallery.css` → `css/pages/`
- 新增空分類：`css/themes/`
- 孤兒 CSS（存在於 `css/` 但未被任何 html 引用）→ `archive/legacy-css/`：
  `bottom-nav.css`（樣式已內含於 `shell.css`，此檔為舊版殘留）、`recent-materials.css`、`resume.css`、`hero.css`、`today.css`
- Root 重複 CSS（15 個，皆未被引用）→ `archive/legacy-css/`

## 4. js/

- `js/ui.js js/Icons.js js/Qiaoqiao.js` → `js/core/`
- `js/app.js js/app-*.js`（8 個頁面啟動腳本）→ `js/pages/`
- `js/mock-data.js` → `js/data/`（`js/data/exam.js quotes.js tasks.js` 原本位置正確，不動）
- `js/utils/*.js`（5 個）原本位置正確，不動
- `js/HeroCard.js` → `js/components/HeroCard.js`
- `components/*.js`（32 個，原 Root 層獨立資料夾）→ 全數併入 `js/components/`
- `components/MaterialRuntime.js` → `js/runtime/MaterialRuntime.js`（唯一符合 `*Runtime.js` 命名的既有檔案）
- 新增空分類：`js/services/`（目前無對應檔案）
- Root 重複 JS（App/Component 重複檔，共 30 個）→ `archive/legacy-js/`

### PMO Locked Decisions 003 / 004 執行

- `ResumeLearning.js`（Root 版 + `components/` 版，皆無任何頁面引用）→ `archive/legacy-js/`
- `HomeBottomNavigation.js`（Root 版 + `components/` 版，皆無任何頁面引用）→ `archive/legacy-js/`

## 5. docs/

Decision 008：保留全部內容，僅重新分類：

- `Claude_Workspace_Workflow_v1.0.md Git_Workflow_v1.0.md Repository_Workflow_v1.0.md` → `docs/workflow/`
- `GPT_QA_Workflow_v1.0.md` → `docs/qa/`
- `Release_Workflow_v1.0.md` → `docs/release/`
- `Branch_Strategy_v1.0.md Capability_Matrix_v1.0.md Commit_Message_Rule_v1.0.md Developer_Platform_Repository_Structure_v1.0.md Developer_Platform_v1.0_Index.md Version_Rule_v1.0.md` 保留於 `docs/developer-platform/`
- `docs/tasks/DEV-006_Home_Prototype_v0.2.md` 位置正確，不動
- 新增 `docs/MISSING_FILES.md`、`docs/Repository_ChangeLog.md`、`docs/Repository_Tree.md`

## 6. prototype/ / developer/

Decision 005 / 006：兩者皆保留，內容為既有空殼子資料夾，不做任何搬動。

## 7. src/

Decision 007：`src/`（僅含 `.gitkeep`，無任何引用）→ `archive/src/`

## 8. Route / Import Update

同步修正下列 9 個 HTML 檔案內所有 `<script src>` / `<link href>` 路徑，
使其對應新資料夾結構（`css/base|layout|components|pages`、`js/core|pages|components|runtime|data|utils`、`assets/icons`）：

```
index.html materials.html quiz.html learning.html
summary.html dashboard.html tutor.html wrongbook.html
qiaoqiao-gallery.html
```

CSS 內 `background-image` 全數為 `linear-gradient(...)`，無實體圖片路徑，
故 CSS 檔案內容本身不需要修改任何 `url(...)`。

## 9. QA 過程中發現但本次未修改的既有問題（Baseline Lock 原則，僅紀錄）

- `css/pages/material.css` 存在 2 處 `inset:` shorthand，違反 `05_Code_Quality` 既有 CSS 慣例（不得使用 `inset:` shorthand）。此為搬移前既有內容，本次僅搬移檔案位置未動內容，故不修改，留待 GPT 另行開立 Work Order 處理。
- `css/pages/learning.css` / `css/pages/material.css` 使用 `aspect-ratio` / `scrollbar-width`，為 html5validator 尚未支援辨識的現代 CSS 屬性，經比對為既有內容，非本次造成。
- `archive/legacy-css/*` 內多個檔案觸發 html5validator Parse Error；這些檔案已無任何頁面引用（純封存），不影響線上頁面運作。

## 10. 未變更事項（No Feature Change 原則遵守）

- 未新增、未刪除、未修改任何 `.js` 業務邏輯內容（僅搬移檔案位置）
- 未修改任何 `.css` 樣式規則內容
- 未修改任何 `window.AHS` Namespace 結構
- 未新增、未重建 `docs/MISSING_FILES.md` 所列缺失檔案
- `js/mock-data.js` `js/data/*.js` 維持現狀，未轉換為 `.json`（Decision 002）
