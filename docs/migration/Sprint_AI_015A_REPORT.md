# REPORT.md — Sprint AI-015A｜Architecture Audit

Priority：P0 ｜ Type：Architecture Audit ｜ Baseline：LOCKED（no code touched）｜ 完成後停止。

## Objective

建立 AI Question Architecture Map，不修改任何程式。

## Development

### Part A — Question Runtime 盤點

盤點出 4 個獨立世代的 Question 系統（Sprint 4／Sprint 6／Sprint 6.9／Sprint 8.2），每一代都刻意以不同名稱命名以避免修改前一代（原始碼註解中反覆出現的「naming flag」模式）：`QuestionRuntime`+`QuestionBank`（Exam Mode，Mock Data）、`LearningQuestionRuntime`+`QuestionGenerator`（Sprint 6，Stub-only 內容）、`LearningQuestionSession`+`LearningQuestionGenerator`+`QuestionGenerationFlow`（Sprint 6.9，源自頂層 SummaryRuntime）、`QuestionGenerationRuntime`（Sprint 8.2，唯一真正源自 KnowledgeGraphRuntime 真實教材內容）。詳見 `docs/Architecture/QuestionArchitecture.md`。

### Part B — Question Flow

三條互不相交的 Generate/Store/Read/Display 鏈路，詳見 `docs/Architecture/QuestionArchitecture.md` Part B 與 `docs/Architecture/DependencyGraph.md`。

### Part C — WrongBook 盤點

兩套獨立實作：`WrongBookRuntime`（Sprint 4，Exam Mode，`AutoGrader.grade()` 後 `sync()`）與 `WrongBookSession`+`WrongBookGenerator`（Sprint 7.0，Practice Mode，僅答錯時 `add()`，兩者皆正確遵守「答錯才寫入」原則）。

### Part D — Review 盤點

四個獨立 Review 消費端：`ReviewRuntime`（Sprint 4，`review.html` 載入但 `AppReview.js` 明確聲明不使用）、`AppReview.js` 本身（直接讀 `HistoryRuntime`+`WrongBookRuntime`）、`ReviewGeneratorRuntime`（Sprint 8.2，讀 `WrongBookSession`+Quiz/Exam Result，餵給 materials.html 的 AI Tutor 面板）、`ReviewQueue`→`ReviewModel`→`ReviewWidget`（Sprint 7.0，餵給首頁 Widget，非 `review.html`）。

### Part E — Dependency Graph

見 `docs/Architecture/DependencyGraph.md`：完整 ASCII 圖含三條 Loop 的 Generate→Store→Read→Display 邊，以及交叉引用驗證（grep 確認零交叉引用）。

### Part F — 真正的 Learning Loop

**沒有單一統一的 Learning Loop**——真實存在三條互不相交的路徑（Exam Mode／Practice Mode／materials.html 內部 AI 練習題），且 Review 有四個獨立消費端。詳見 `docs/Architecture/QuestionArchitecture.md` Part F 的完整分析與證據。此為 Repository 真實內容分析結果，非 PMO 推測。

## Changed Files

**新增（2 檔案，Deliverables）**
```
docs/Architecture/QuestionArchitecture.md
docs/Architecture/DependencyGraph.md
```

**新增（1 檔案，本 REPORT）**
```
docs/migration/Sprint_AI_015A_REPORT.md
```

**零修改（本階段禁止任何程式碼／HTML／Runtime／API／README 變更，已確認）**
```
git status 確認僅新增上述 3 個 Markdown 檔案，無任何 .js／.html／既有文件被修改。
```

## Methodology（Part E 要求：100% 來自真實引用，不得人工推測）

- 逐一 `Read` 每個候選檔案的完整標頭註解與核心 API。
- 對每個 HTML 頁面（`materials.html`／`quiz.html`／`wrongbook.html`／`review.html`／`index.html`）逐一 `grep` 其 `<script src>` 清單，確認真實載入順序與範圍。
- 對每個 Runtime 元件用 `grep` 交叉檢查是否被其他 Loop 的檔案引用，確認三條 Loop 互不相交（零交叉引用）。
- 確認 `ai-engine/question`／`ai-engine/review` 等資料夾為空 `.gitkeep` 佔位（依 CLAUDE.md 既有規則，非本次新增發現）。

## QA

- ☑ 全 Repository 掃描（ai-engine／runtime／service／adapter／parser／summary／compare／rollback／全部 Question／WrongBook／Review 相關檔案）
- ☑ Question Flow 建立（三條 Loop 皆已畫出 Generate/Store/Read/Display）
- ☑ WrongBook 盤點完成（兩套實作，用途與觸發條件皆已說明）
- ☑ Review 盤點完成（四個消費端皆已列出）
- ☑ Dependency Graph 建立
- ☑ Part F 已回答（非推測，附真實證據）

## Root Cause

無（Audit EO，非 Bug Fix）。

## Impact Analysis

本階段僅新增 3 個 Markdown 文件，未修改任何 `.js`／`.html` 檔案，未修改 README、Runtime、API。

## Regression

不適用——本階段未修改任何可執行程式碼。

## QA Summary

Question／WrongBook／Review 完整架構盤點已完成，100% 基於真實檔案內容與 `<script>` 引用驗證（非人工推測），誠實揭露「沒有單一 Learning Loop」與「命名混淆的真實風險」兩項關鍵發現，供 PMO 決定 Sprint AI-015 的正式整合範圍。未觸碰任何程式碼。

## 完成後

依 EO 指示，**完成後停止**，等待 PMO 依本次 Architecture Map 決定 Sprint AI-015 的後續範圍。
