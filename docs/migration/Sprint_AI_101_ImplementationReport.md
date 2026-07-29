# ImplementationReport.md — Sprint AI-101｜Question Production Pipeline

Priority：P0 ｜ Type：Implementation Sprint（Final Scope, PMO Decision after Repository Truth Audit）｜ 完成後停止。

## Background — Scope Revision

Sprint AI-101 was originally issued as "AI Core Foundation" (AIProvider abstraction, Prompt Engine,
SummaryRuntime integration, AI Question Generator, configurable backend endpoint routing). Before
writing any code, a repository audit found this scope conflicted with real, verified repository
state:

- `ai-engine/` already contains a mature, real AI Engine layer (~60 files, built across
  EO-AI-001 → EO-AI-012E and Sprint AI-013 Parts A/B), including a complete Provider abstraction,
  Prompt Engine (Foundation, unwired), and a Summary Production Pipeline already wired into
  `materials.html` and live in production since Sprint AI-013 Part A — none of this matched
  CLAUDE.md's description of `ai-engine/` as empty `.gitkeep` scaffolding.
- "Route AI requests through a configurable backend endpoint" would introduce the project's first
  real network I/O, contradicting both CLAUDE.md's Project Overview ("no real backend/database/AI
  API... must keep working over `file://` and on GitHub Pages") and `ai-engine/README.md`'s own
  stated Provider design ("no LLM connection", "still no LLM anywhere").

PMO accepted this audit and issued a **Final Scope decision**: the existing AI infrastructure
(AIProvider, ProviderFactory/ProviderManager, Prompt Engine, Summary Engine/Pipeline/Runtime/
Provider/UI Integration) is COMPLETE and must be reused, not rebuilt. Sprint AI-101's actual scope
is narrowed to **one deliverable**: implement the Question Production Pipeline by mirroring the
existing Summary Production Pipeline's Foundation shape (EO-AI-005/EO-AI-006/EO-AI-007/EO-AI-011),
with no real LLM integration and no network I/O of any kind.

## Objective

Populate the previously-empty `ai-engine/src/services/question/` slot (reserved since EO-MIG-002)
with a Question Engine, Runtime integration, Service, and Provider — structurally mirroring the
Summary Production Pipeline file-for-file — plus a Platform-side Adapter, unit tests, and QA.

## Changed Files

**新增（13 個檔案）**
```
ai-engine/src/services/question/QuestionExtractor.js   — mirrors SummaryExtractor.js
ai-engine/src/services/question/QuestionBuilder.js       — mirrors SummaryBuilder.js
ai-engine/src/services/question/QuestionFormatter.js     — mirrors SummaryFormatter.js
ai-engine/src/services/question/QuestionValidator.js     — mirrors SummaryValidator.js
ai-engine/src/services/question/QuestionEngine.js         — mirrors SummaryEngine.js
ai-engine/src/runtime/QuestionRuntime.js                    — mirrors SummaryRuntime.js
ai-engine/src/runtime/QuestionHistory.js                     — mirrors SummaryHistory.js
ai-engine/src/runtime/QuestionSession.js                      — mirrors SummarySession.js
ai-engine/src/runtime/QuestionPipeline.js                      — mirrors SummaryPipeline.js (pre-EO-AI-009 shape)
ai-engine/src/service/QuestionService.js                        — mirrors SummaryService.js
ai-engine/src/service/QuestionProvider.js                        — mirrors SummaryProvider.js (legacy/new modes only)
js/ai/QuestionAdapter.js                                          — mirrors js/ai/SummaryAdapter.js (not wired into any page)
tests/regression/AIEngineQuestionV1.js                             — permanent regression suite, 77 assertions
```

**修改（3 個檔案，文件與 QA 交付物）**
```
ai-engine/README.md                              — documents the new Question modules (Status/Folder
                                                     Structure/Public API/Question Set Model sections)
docs/migration/Sprint_AI_101_ImplementationReport.md  — this file
docs/QA/Sprint_AI_101_QAReport.md                       — QA summary
```

**未修改（依 Constraints 明確要求，逐一確認 `git diff` 為空）**
```
ai-engine/src/services/summary/*.js          (Summary Production Pipeline)
ai-engine/src/runtime/Summary*.js
ai-engine/src/service/Summary*.js
ai-engine/src/providers/*.js                 (Provider Layer)
ai-engine/src/prompt/*.js                    (Prompt Engine)
ai-engine/src/core/AIEngine.js               (zero lines changed — see AIEngine Integration below)
ai-engine/src/knowledge/*.js                 (KnowledgeLoader/MetadataBuilder/MetadataValidator/KnowledgeCache — reused, not modified)
js/runtime/QuestionGenerationRuntime.js      (LOCK, production question generator — untouched)
js/runtime/QuestionRuntime.js                (Sprint 4, Exam Mode — untouched)
js/runtime/QuestionProviderBridge.js         (untouched)
Any HTML page's <script> order (zero pages touched — see Wiring below)
```

## Architecture Impact

```
QuestionEngine（extends AIService, id="question" — existing SERVICE_IDS.QUESTION constant, used for the first time）
  .generate(materialId)
    → KnowledgeLoader.loadFromMaterial(materialId)   【EO-AI-004，唯讀，未修改】
    → QuestionExtractor.extract(knowledge)              → 結構性資訊
    → QuestionBuilder.build(extracted)                    → Question Set Model（9 欄位）
    → QuestionValidator.validateOrThrow(model)              → 保證輸出合法

QuestionPipeline.run(materialId)
  → QuestionEngine.generate() → QuestionFormatter.toRuntimeObject()
  → QuestionRuntime.save() → QuestionHistory.record() → return

QuestionService（singleton：一個 QuestionRuntime + 一個 QuestionPipeline）
  .generate / .generateFromMaterial / .get / .getWithFallback
    getWithFallback()：New pipeline 的 questions 目前恆為誠實空陣列，
    因此恆讀取（唯讀，從不寫入）真實 LOCK 的 AHS.QuestionGenerationRuntime

QuestionProvider（legacy/new 兩模式，預設 legacy）
  .getQuestions()   — 恆唯讀，不論模式
  .generateQuestions() — 唯一會真正執行 New pipeline 的方法
  legacy 模式 = 讀取真實 AHS.QuestionGenerationRuntime（唯讀，從未寫入）
```

### Question Set Model（9 欄位，無 AI 生成內容）

`title`／`questions` 為誠實的 `null`／空陣列 stub — 跟 Summary Foundation（EO-AI-005）當初的
`concepts`／`definitions`／`formulas`／`examples` 完全相同的「不捏造內容」原則。`questions` 需要
規則式問題組成邏輯才能產生（如 EO-AI-009 為 Summary 加上的 `SummaryContentExtractor`），這是
Sprint AI-101 明確未要求的未來增量，本 Sprint 誠實留白，不speculative implementation。`keywords`
是 `metadata.tags` 的結構性直接映射，非生成結果。其餘欄位全部來自既有 Knowledge Object 的結構
資料，非文字生成。

### AIEngine Integration

**未修改 `AIEngine.js` 一行程式碼** — `QuestionEngine` 繼承 `AHS.AIEngine.AIService`（EO-AI-002），
`id` 使用既有、先前從未被使用過的 `AHS.AIEngine.SERVICE_IDS.QUESTION` 常數（保留自 EO-MIG-002 /
`Constants.js`），直接相容既有、完全沒改動過的 `AIEngine.registerService()` / `getService()`。
整合方式已用測試驗證：`engine.registerService(new AHS.AIEngine.QuestionEngine())` →
`engine.getService("question")` 取得後可正常呼叫 `generate()`。

### 為何 QuestionProvider 省略 compare 模式

`SummaryProvider`（EO-AI-011）的第三種模式 `compare` 依賴 `SummaryComparator`（EO-AI-010 自己
獨立的交付物，Sprint AI-101 未要求）以及一個 Question 領域對應
`AHS.MaterialSummaryCard.hasSummaryContent()` 的相容性檢查函式——本專案中不存在這樣的 Question
UI 相容性判斷式。與其發明一個沒有真實對應物的比對邏輯（違反「No speculative implementation」），
`QuestionProvider` 誠實地只實作 `legacy`／`new` 兩種模式，並在檔案標頭明確記錄此決定與理由。

### 為何 QuestionProvider 預設模式為 legacy（非 new）

`SummaryProvider` 的預設模式在 Sprint AI-013 Part A 才從 `legacy` 切換為 `new`——當時 New pipeline
已具備真實規則式內容（EO-AI-009 之後）。`QuestionProvider` 的 New pipeline 現階段 `questions`
仍恆為空陣列 stub，若預設 `new` 會讓任何呼叫端（未來若真的接線）讀到空白內容，正是 EO-AI-012C
當初必須修復的同一種回歸。因此本 Sprint 誠實地預設 `legacy`（讀取真實、已產出內容的
`AHS.QuestionGenerationRuntime`），未來若要做「Beta Cutover」需要另一個明確授權的 Sprint。

## Root Cause

無（Feature Sprint，非 Bug Fix）。

## Impact Analysis

新增內容全部落在既有保留的空資料夾 `ai-engine/src/services/question/`，以及與 Summary 完全平行
的 `ai-engine/src/runtime/Question*.js`／`ai-engine/src/service/Question*.js`／
`js/ai/QuestionAdapter.js`。未修改任何既有檔案的邏輯（唯一修改是 `ai-engine/README.md` 文件）。
Question Pipeline 對 `AHS.MaterialRuntime` 的存取完全透過既有、唯讀的
`KnowledgeLoader.loadFromMaterial()`，對 `AHS.QuestionGenerationRuntime` 的存取（`QuestionService.
getWithFallback()`／`QuestionProvider` legacy 模式）完全透過其既有、唯讀的
`getQuestionsByMaterial()`，沒有新增任何寫入路徑。已用原始碼掃描（`tests/regression/
AIEngineQuestionV1.js` 內建）確認新增 9 個檔案內沒有 `fetch`／`XMLHttpRequest`／`localStorage`／
`indexedDB`／`OpenAI`／`Anthropic`／WebSocket 字樣。零 HTML 頁面被修改——`js/ai/QuestionAdapter.js`
與 Summary 自己的 `js/ai/SummaryAdapter.js` 一樣，「built, not wired」。

## Unit Test（`tests/regression/AIEngineQuestionV1.js`，node vm 沙箱，77 條全數 PASS）

涵蓋：`QuestionExtractor`（含非物件輸入錯誤路徑、`frozen` 結果、真實教材資料抽取正確）、
`QuestionBuilder`（9 欄位齊全、誠實 stub 驗證、`frozen` 結果）、`QuestionFormatter`
（`toRuntimeObject`／`toJSON`、確認輸出不含 HTML 標籤）、`QuestionValidator`（必填／型別／委派
metadata 驗證）、`QuestionEngine`（三個 API 端對端跑通、含批次處理、找不到教材時正確拋錯）、
`QuestionRuntime`（save/get/list/remove/clear、與既有 AHS Runtime 命名空間不重複驗證）、
`QuestionHistory`／`QuestionSession`、`QuestionPipeline`（含 try/finally 錯誤路徑下 session 正確
stop）、`QuestionService`（單例快取、真實 Legacy Fallback 驗證）、`QuestionProvider`（legacy/new
模式、getQuestions 恆唯讀驗證、generateQuestions 才真正執行）、`QuestionAdapter`（passthrough
驗證）、原始碼靜態掃描（零 LLM／網路／持久化呼叫）、**AIEngine 整合驗證**（透過既有
`registerService`/`getService`，未修改 `AIEngine.js`），並回歸既有 `AHS.QuestionGenerationRuntime`
真實資料行為與 `AHS.AIEngine.SERVICE_IDS` 常數不變。

```
PASS: 77   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| `npm test`（BehaviorSuite + PipelineRegression） | 181/181 PASS |
| `npm run verify`（VerifyPaths + VerifyForbiddenPatterns） | PASS（1 pre-existing KNOWN-ISSUE，無關） |
| 全部 22 個 permanent regression 檔案 | 866/866 PASS（含新增的 AIEngineQuestionV1.js 77 條） |
| **Grand Total** | **1047/1047 real assertions PASS**（175 BehaviorSuite + 6 PipelineRegression + 866 regression 檔案，PipelineRegression 不重複計算） |
| Console Error | 0 |

## Smoke Test

零 HTML 頁面被修改，零既有頁面行為變化——本 Sprint 純後端骨架，與既有 Summary Foundation
（EO-AI-005/006/007）當初的性質相同。既有 9 個產品頁 Console Error = 0（jsdom BehaviorSuite 已
驗證）。

## QA Summary

Unit Test 77/77、Regression 1047/1047、npm run verify PASS，Console Error = 0。無 OpenAI/Claude/
Gemini API、無真實 LLM 整合、無 fetch/XHR/localStorage/indexedDB/WebSocket、無新增網路 I/O。
`AIEngine.js`／既有 Summary Production Pipeline／既有 Provider Layer／既有 Runtime Architecture／
任何 HTML 頁面：零修改。既有 `AHS.QuestionGenerationRuntime`（LOCK）與 `AHS.QuestionRuntime`
（Sprint 4）皆保持完全不變。

## 停止聲明

依 Sprint 指示，Execution mode only。完成後停止，等待 PMO 確認並授權後續 Commit/Push（本 Sprint
本身未執行任何 git 操作）。
