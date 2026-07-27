# REPORT.md — Sprint AI-015B｜Learning Loop Unification Design

Priority：P0 ｜ Type：Architecture Design ｜ Baseline：LOCKED（no code touched）｜ 完成後停止，等待 PMO 核准，不得開始 Sprint AI-015C。

## Objective

根據 Sprint AI-015A 的 Repository Audit，設計未來唯一的 Learning Loop Architecture。本 Sprint 不修改任何程式、Runtime、HTML。

## Development

### Part A/B/C — 三條 Loop 分析

逐一分析 Loop A（Exam Mode）／Loop B（Practice Mode）／Loop C（Material AI）的優點／缺點／可保留部分／不可保留部分，完全依據 Sprint AI-015A 的真實盤點結果（`docs/Architecture/QuestionArchitecture.md`／`DependencyGraph.md`），詳見 `docs/Architecture/LearningLoopProposal.md` Part A-C。

### Part D — 三個 Architecture Proposal

- **Proposal A（Exam 為主，AI 擴充）**：需重新設計 `QuestionRuntime`/`QuestionBank` 的 examId 定址模型以容納教材為中心的 AI 內容，Migration Cost／Regression Risk 皆為高，且牴觸這兩個檔案自身標頭註解明確聲明的架構邊界。
- **Proposal B（Practice 為主，Merge AI）**：僅替換 `QuestionGenerationFlow` 的內容來源（從頂層 `SummaryRuntime` 改為 `QuestionGenerationRuntime`），Loop B 下游（Session/WrongBook/ReviewQueue/ReviewModel/ReviewWidget）完全沿用，Migration Cost／Regression Risk 皆為三者最低。
- **Proposal C（Material AI 為唯一入口，全部重新統一）**：需新建 Session/Grading/WrongBook/Review 對應機制並統一三個 Review 消費端，Migration Cost／Regression Risk 皆為三者最高，且牴觸「不得新增 Runtime」的明文禁止。

三個 Proposal 皆包含 Architecture Diagram／Runtime Flow／Runtime Reuse／Migration Cost／Regression Risk／預估 EO 數量／是否符合目前 Repository，詳見 `docs/Architecture/LearningLoopProposal.md` Part D。

### Part E — Recommendation

推薦 **Proposal B**。理由完全依據 Part D 的客觀對照（Runtime Reuse 比例、是否牴觸「不得新增 Runtime」原則、Repository 自身已驗證成功的 AI Summary Migration 方法論可直接套用），非個人偏好。詳見 `docs/Architecture/LearningLoopProposal.md` Part E 的四點理由。

### Part F — Roadmap

若採用 Proposal B，拆分為 Phase 1（Foundation Bridge，Provider 分流＋Script Wiring）→ Phase 2（Equivalence Validation，預期會發現真實缺口，比照 EO-AI-012E／EO-AI-010B 先例）→ Phase 3（Production Cutover，比照 Sprint AI-013／AI-014 Phase 1 的 Default Mode Migration＋Legacy Manifest Audit 紀律）→ Phase 4（Legacy Cleanup 考量，延後、獨立範疇）。詳見 `docs/Architecture/LearningLoopRoadmap.md`。

## Changed Files

**新增（2 檔案，Deliverables）**
```
docs/Architecture/LearningLoopProposal.md
docs/Architecture/LearningLoopRoadmap.md
```

**新增（1 檔案，本 REPORT）**
```
docs/migration/Sprint_AI_015B_REPORT.md
```

**零修改（本階段禁止任何程式碼／HTML／Runtime／API／README／測試／BehaviorSuite／Pipeline 變更，已確認）**
```
git status 確認僅新增上述 3 個 Markdown 檔案，無任何既有檔案被修改。
```

## QA

- ☑ Repository Analysis 完成（Part A/B/C，依 Sprint AI-015A 真實盤點）
- ☑ Proposal A 完成
- ☑ Proposal B 完成
- ☑ Proposal C 完成
- ☑ Recommendation 完成（依真實架構比較，非個人偏好）
- ☑ Roadmap 完成（Phase 1-3 + 延後 Phase 4）

## Root Cause

無（Design EO，非 Bug Fix）。

## Impact Analysis

本階段僅新增 3 個 Markdown 文件，未修改任何 `.js`／`.html` 檔案，未修改 README、Runtime、API、測試、BehaviorSuite、Pipeline。未開始任何實作。

## Regression

不適用——本階段未修改任何可執行程式碼。

## QA Summary

三個 Architecture Proposal 皆已完成並附客觀比較（Migration Cost／Regression Risk／Runtime Reuse／是否符合 Repository 現況），Recommendation（Proposal B）完全依據 Sprint AI-015A 的真實盤點結果與本 Repository 已驗證成功的 AI Summary Migration 方法論推導，Roadmap 提供 Phase 1-4 的依賴順序與理由。未觸碰任何程式碼。

## 完成後

依 Sprint 指示，**完成後停止，等待 PMO 核准，不得開始 Sprint AI-015C**。
