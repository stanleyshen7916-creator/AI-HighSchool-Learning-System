# REPORT.md — EO-AI-015E-002｜Question Pipeline Architecture Resolution

Priority：P0 ｜ Type：Architecture Resolution ｜ Baseline：LOCKED（no implementation）｜ 完成分析後停止，等待 PMO 核准，不得開始實作。

## Objective

確認 Repository 是否需要新增 QuestionPipelineService，將 Question Generation Trigger 自 Quiz 抽離，形成唯一 Production Pipeline。純分析，未修改任何程式碼。

## Development

### Investigation — `QuestionGenerationFlow.run()` 逐項盤點

完整讀取 `js/parser/QuestionGenerationFlow.js` 原始碼，逐項確認（不推測）：Question Generation（源自 SummaryRuntime，4 種題型）、Session 建立（三層驗證閘門）、Runtime 寫入（無，檔案標頭明確聲明）、Metadata（`source.type: "summary_derived"`）、WrongBook Dependency（無直接耦合，下游透過 Session 間接關聯）、Navigation Dependency（無，純函式，唯一真實呼叫者為 QuizCenter.js 的 Question Guide「開始練習」）。詳見 `docs/Architecture/QuestionPipelineAnalysis.md` §1。

### Reuse Analysis — `AITutorService.ensureQuestionSet()` + `QuestionProviderBridge` 是否足以形成 Production Pipeline

結論：結構上兩者連接後可涵蓋 Generate→Session→Runtime 全鏈（甚至比 QuestionGenerationFlow 多出 Runtime 寫入），但**目前完全未被任何生產程式碼串接**（`grep` 全庫確認 `QuestionProviderBridge.bridge()` 零真實呼叫端，即使 materials.html 的「產生 AI 題目」按鈕也只呼叫 `ensureQuestionSet()`，未呼叫 `bridge()`）。另有兩項真實產品行為差異：內容來源不同導致題型從 4 種收斂為僅 `single_choice`；新管線不支援呼叫端指定難度（Ruling 2B 的難度選擇器在新管線無對應掛載點）。若 Trigger 改放 quiz.html，需要的 Script Wiring 遠大於 Sprint AI-015C 的 3 行新增。完整逐項證據見 `docs/Architecture/QuestionPipelineAnalysis.md` §2。

### 與 Sprint AI-015E Part B 的關聯

`docs/migration/Sprint_AI_015E_ArchitectureResolution.md` 說明 Part B 卡關的真實原因（移除 Quiz 的生成觸發會讓 Summary→Guide→Practice 深連結永久失效，命中 BehaviorSuite 7 個測試區塊），並列出三個可能方案（A：materials.html 端 Compose、Quiz 純 Read；B：保留現況、重新定義驗收標準；C：其他，如授權修改 Runtime API 支援難度參數）供 PMO 決策。

## Changed Files

**新增（3 檔案，Deliverables）**
```
docs/Architecture/QuestionPipelineAnalysis.md
docs/migration/Sprint_AI_015E_ArchitectureResolution.md
docs/migration/EO_AI_015E_002_REPORT.md
```

**未變更（Sprint AI-015E Part B 未完成修改，依指示保留不 Commit）**
```
js/components/QuizCenter.js   — 工作目錄中仍有未提交修改
                                 （Identity Mapping Helper + Runtime-only
                                 Read + 移除 QuestionGenerationFlow 觸發），
                                 未進一步修改，未 Commit，未 Push。
```

**零修改**
```
Quiz / WrongBook / Review / 任何 LOCK Runtime API — 全數未觸碰。
```

## QA

- ☑ Investigation 完成（六項逐一列出，100% 依 Repository 真實原始碼，非推測）
- ☑ Reuse Analysis 完成（結構可行性 + 4 項具體缺口，附真實 grep 證據）
- ☑ 未新增 Runtime
- ☑ 未新增第二套 Pipeline
- ☑ 未修改 Quiz / WrongBook / Review / 任何 LOCK Runtime API
- ☑ 未 Commit Sprint AI-015E Part B 修改
- ☑ 未開始任何實作

## Root Cause

Sprint AI-015E Part B 的真實架構衝突（Summary→Guide→Practice 深連結依賴 Quiz 自身觸發生成），追溯至：Production Pipeline（`ensureQuestionSet` + `QuestionProviderBridge`）雖已完整建置並驗證（Sprint AI-015C），但從未被任何生產程式碼串接觸發——問題不在 Quiz 本身的讀取邏輯，而在於「唯一生產管線」目前沒有任何真實入口點。

## Impact Analysis

僅新增 3 份文件，零程式碼變更。Sprint AI-015E Part B 的工作目錄修改維持不變、未提交。

## Regression

不適用——本 EO 未修改任何可執行程式碼。

## QA Summary

已依 Repository 真實內容（原始碼讀取 + 全庫 grep）完成 Investigation 與 Reuse Analysis，誠實揭露「Production Pipeline 已建置但零觸發點」與兩項真實產品行為差異（題型收斂、難度參數缺失），並列出三個決策方案供 PMO 選擇，未預設答案、未開始實作。

## 完成後

依 EO 指示，**完成分析後停止**，等待 PMO 依 `docs/migration/Sprint_AI_015E_ArchitectureResolution.md` 的方案 A/B/C 做出決策，**不得開始實作**。
