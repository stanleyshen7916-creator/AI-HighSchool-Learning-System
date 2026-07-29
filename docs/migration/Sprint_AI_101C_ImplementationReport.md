# ImplementationReport.md — Sprint AI-101C｜Frontend AI Integration

Priority：P0 ｜ Type：Implementation Sprint（Execution only）｜ 完成後停止。

## Background — Why This Sprint Is Different From The Paused AI-101B

The original Sprint AI-101B ("Backend Integration") was paused twice: once for lacking any real,
reachable endpoint, and once for an internal contradiction ("No Mock, Stub, or Empty Array" required
real generated content while "Do not modify MVP architecture" forbade the real backend needed to
produce it). Neither blocker applies here. This Sprint arrives at the end of a deliberate, staged
sequence — **AI-100** (inert Gateway Foundation) → **AI-100.5** (specification for an external
service) → **AI-101B, re-scoped to a separate repository** (a real, tested, deployed-from-source
Cloudflare Worker implementing that specification) → **AI-101C** (this Sprint: wiring this
repository's frontend to actually call it). Each step narrowed what remained undecided; by this
point a real backend genuinely exists in `AI-HighSchool-AI-Gateway`, so "connect to it" is a real,
buildable instruction rather than a request to fabricate content or guess an endpoint.

This Sprint still does not fabricate anything and still does not know a real, deployed URL — see
"Configurable Gateway Endpoint" below for how that's handled honestly.

## Scope Verification (against this Sprint's own 10 items)

| # | Scope 項目 | 對應交付物 |
|---|---|---|
| 1 | Connect SummaryAdapter to AIGateway | `js/ai/SummaryAdapter.js` — new `generateViaGateway()` |
| 2 | Connect QuestionAdapter to AIGateway | `js/ai/QuestionAdapter.js` — new `generateViaGateway()` |
| 3 | Add configurable Gateway endpoint | `js/data/AppConfig.js` — new `aiGateway` block (`endpoint` empty by default) |
| 4 | Integrate AI Summary flow | `js/ui/AIGatewayPanel.js` (`createSummaryPanel`) mounted in `MaterialPreview.js` |
| 5 | Integrate AI Question flow | `js/ui/AIGatewayPanel.js` (`createQuestionPanel`) mounted in `MaterialPreview.js` |
| 6 | Loading, retry, timeout, friendly error UI | `AIGatewayPanel.js`'s state machine + `HttpApiClient.js`'s `AbortController` timeout + `GatewayIntegration.js`'s `friendlyMessage()` |
| 7 | Preserve all existing Runtime APIs | Zero modifications to any existing Runtime file — see Changed Files |
| 8 | Do not modify AI-HighSchool-AI-Gateway | Not touched — this Sprint's entire diff is inside `AI-HighSchool-Learning-System` |
| 9 | Add permanent regression tests | `tests/regression/AIGatewayFrontendV1.js`, 28 assertions |
| 10 | Complete implementation, QA, and prepare release | This report + `docs/QA/Sprint_AI_101C_QAReport.md` |

## Changed Files

**新增（4 個檔案）**
```
ai-engine/src/gateway/HttpApiClient.js   — real ApiClient subclass, real fetch()
js/ai/GatewayIntegration.js               — Platform-side orchestration (configure/build/call/validate/normalize)
js/ui/AIGatewayPanel.js                    — additive UI: loading/ready/error states, Retry
tests/regression/AIGatewayFrontendV1.js     — 28 permanent regression assertions
```

**修改（4 個檔案，全部為 Extension Only）**
```
js/data/AppConfig.js         + aiGateway block (endpoint/provider/model/timeoutMs). Every existing
                              field unchanged.
js/ai/SummaryAdapter.js       + generateViaGateway(). Every existing method (generate/
                              generateFromMaterial/get/getWithFallback/setMode/getMode/getSummary/
                              generateSummary) unchanged.
js/ai/QuestionAdapter.js       + generateViaGateway(). Every existing method unchanged (same list,
                              question-flavored).
js/ui/MaterialPreview.js        + 3 lines: append AIGatewayPanel's two panels after the existing
                              (untouched) 重點整理/練習題 cards — same "append, never replace"
                              pattern already used twice in this file for those two cards.
```

**修改（1 個檔案，接線）**
```
materials.html   + 19 new <script> tags: Sprint AI-101's Question ai-engine subset (never wired to
                  any page before this Sprint) + Sprint AI-100's Gateway/Schema Foundation (also
                  never wired before) + this Sprint's HttpApiClient/GatewayIntegration/
                  SummaryAdapter/QuestionAdapter/AIGatewayPanel. Every existing <script> tag and
                  its order is unchanged; new tags are inserted, not substituted.
```

**修改（1 個檔案，測試維護）**
```
tests/regression/AIEngineQuestionV1.js   — one pre-existing assertion asserted QuestionAdapter's
                                          exact public-member list; updated to include the new,
                                          intentionally-added generateViaGateway (not a behavior
                                          change, a stale test-expectation fix)
```

**未修改（依 Constraints 明確要求，逐一確認 `git diff` 為空）**
```
AI-HighSchool-AI-Gateway repository            — not touched at all (Constraint 8)
Any existing Runtime file (js/runtime/*.js)     — Scope item 7
ai-engine/src/services/summary/*.js             — Summary Production Pipeline
ai-engine/src/services/question/*.js            — Question Production Pipeline (Sprint AI-101)
ai-engine/src/providers/*.js                    — Provider Layer
ai-engine/src/gateway/{AIGateway,GatewayConfig,GatewayConfigValidator,ApiClient}.js  — Sprint AI-100
                                                   Foundation classes, reused unmodified
ai-engine/src/schema/*.js                       — Sprint AI-100 schemas, reused unmodified
js/ui/MaterialSummaryCard.js / MaterialQuestionCard.js   — Baseline UI, untouched
```

## Architecture Impact

```
AIGatewayPanel (new, additive UI)
  .generate() [on button click]
    → AHS.SummaryAdapter.generateViaGateway(materialId)   /  AHS.QuestionAdapter.generateViaGateway(materialId, options)
      → AHS.GatewayIntegration.call(operation, materialId, options)
        1. ensureConfigured() — reads AHS.AppConfig.aiGateway once per page
           (endpoint empty by default → AIGateway.isConfigured() stays false)
        2. if not configured → resolve {ok:false, code:"NOT_CONFIGURED", message}  (zero fetch attempted)
        3. else: build real payload via the EXISTING AHS.AIEngine.KnowledgeLoader
        4. AHS.AIEngine.AIGateway.summarize()/generateQuestions()
             → HttpApiClient.send()   — the real fetch(), POST <endpoint>/v1/summary|question
        5. on success: AHS.AIEngine.AIGateway.validateResponse() — reuses the EXISTING
           SchemaValidator + SummarySchema/QuestionSchema from Sprint AI-100, zero new validation logic
        6. normalize materialId into the (already schema-valid) response's metadata — a known,
           structural value, never AI-generated content
        7. every failure path (unconfigured / network / timeout / non-2xx / schema mismatch)
           resolves to one typed {ok:false, code, message} shape — never rejects
    → AIGatewayPanel renders "ready" (real content) or "error" (friendly message + Retry button)
```

### Configurable Gateway Endpoint (Scope item 3) — why it's empty by default

`AppConfig.aiGateway.endpoint` is `""` by default. This project's standing rule is "never guess or
fabricate a URL" — no `*.workers.dev` placeholder is written here, real or invented. With an empty
endpoint, `AIGateway.isConfigured()` is false, so `GatewayIntegration.call()` never calls `fetch()`
at all — verified by a dedicated regression assertion
(`tests/regression/AIGatewayFrontendV1.js`: "未設定 endpoint 時從未真正呼叫 fetch"). This is what
keeps every page working over `file://`/GitHub Pages exactly as before this Sprint (CLAUDE.md's
Project Overview constraint) without needing an exception for the common case — only once a
deployer explicitly sets a real, deployed endpoint does any network attempt happen at all, and even
then, failure degrades to a friendly error state, never a crash.

### The one deliberate architecture exception, and its scope

`ai-engine/src/gateway/HttpApiClient.js` contains this repository's first-ever real `fetch()` call.
Its own header comment documents the reasoning in full; in summary: this is a narrow, traced
exception (one file, two possible request paths, both to one configurable endpoint) authorized by
the explicit AI-100 → AI-100.5 → AI-101B → AI-101C sequence, not a general license for network I/O
elsewhere. A regression assertion (`AIGatewayFrontendV1.js`: "真實 fetch()/XMLHttpRequest 僅存在於
HttpApiClient.js") enforces that no other file gained one.

### Why generateViaGateway() does not write to any Runtime

`SummaryService`/`QuestionService` (Sprint AI-100/AI-101) each privately own one `SummaryRuntime`/
`QuestionRuntime` instance inside their own file's closure, with no public accessor. Writing
Gateway-produced content into "the same Runtime" would require modifying those already-shipped
Foundation files to expose that instance — a change to existing, tested Runtime API surface, which
Scope item 7 ("Preserve all existing Runtime APIs") and the Constraint "Do not modify MVP
architecture" both rule out. `generateViaGateway()` is therefore presentation-only: its result is
held in `AIGatewayPanel`'s own local render state, not persisted anywhere. This keeps the new
feature fully additive and zero-coupled to any existing store.

## Root Cause

無（Feature Sprint，非 Bug Fix）。

## Impact Analysis

新增/修改內容全部具體、可追蹤地對應到本 Sprint 的十個 Scope 項目。`git diff` 確認：零 Runtime 檔案
被修改、零 Baseline UI 元件（MaterialSummaryCard.js/MaterialQuestionCard.js）被修改、
`MaterialPreview.js` 僅新增 3 行（附加，非取代）、`AI-HighSchool-AI-Gateway` repository 完全未被
觸碰。原始碼靜態掃描（`AIGatewayFrontendV1.js` 內建）確認真實 `fetch()` 僅存在於
`HttpApiClient.js` 一個檔案，五個新增/修改的 Platform 檔案（`GatewayIntegration.js`/
`SummaryAdapter.js`/`QuestionAdapter.js`/`AIGatewayPanel.js`/`AppConfig.js`）零 `fetch`/
`XMLHttpRequest`/硬編碼金鑰字樣。`AppConfig.aiGateway` 無 `apiKey` 欄位——已用測試驗證。

## Unit Test（`tests/regression/AIGatewayFrontendV1.js`，node vm 沙箱＋mocked fetch，28 條全數 PASS）

涵蓋：`HttpApiClient`（真實 fetch 呼叫的 URL/headers/body 正確性、成功/非 2xx/逾時三種真實路徑、
timeoutMs 建構子設定生效）、`GatewayIntegration`（未設定 endpoint 時零網路呼叫的具體驗證、設定完成
後成功/Schema 驗證失敗/錯誤碼映射三種真實路徑、`materialId` 正規化、`call()` 對任何失敗路徑皆
resolve 而非 reject）、`SummaryAdapter.generateViaGateway`/`QuestionAdapter.generateViaGateway` 正確
委派、既有兩個 Adapter 全部既有方法完全不變（含端對端真實資料驗證）、原始碼靜態掃描（真實
`fetch()` 僅限一個檔案、零硬編碼金鑰）。

```
PASS: 28   FAIL: 0
```

## Regression

| 項目 | 結果 |
|---|---|
| `npm test`（BehaviorSuite + PipelineRegression） | 181/181 PASS（含 materials.html 既有 3 個 AI UI 測試區塊 [21][22][23]，於新腳本清單下零 Console error） |
| `npm run verify`（VerifyPaths + VerifyForbiddenPatterns） | PASS（1 pre-existing KNOWN-ISSUE，無關；19 個新 `<script>` 路徑全數解析成功） |
| 全部 24 個 permanent regression 檔案 | 944/944 PASS（含新增的 AIGatewayFrontendV1.js 28 條，以及 AIEngineQuestionV1.js 1 條過期斷言的修正） |
| **Grand Total** | **1125/1125 real assertions PASS**（175 BehaviorSuite + 6 PipelineRegression + 944 regression 檔案，PipelineRegression 不重複計算） |
| Console Error | 0 |

## Smoke Test

`materials.html` 真實 jsdom 載入，既有 175 條 BehaviorSuite 斷言（含教材預覽、既有 AI 重點整理/AI
練習題全流程）全數維持 PASS，證明新增的 19 個 `<script>` 標籤與 `MaterialPreview.js` 的 3 行新增
未對既有任何行為造成 regression。

## QA Summary

Unit Test 28/28、Regression 1125/1125、npm run verify PASS，Console Error = 0。真實 `fetch()`
僅存在於一個檔案且經測試鎖定；預設狀態（endpoint 未設定）下零網路呼叫，`file://`/GitHub Pages
相容性完全保留；`AI-HighSchool-AI-Gateway` repository 零修改；既有 Runtime API 與 Baseline UI
元件零修改；`AppConfig.aiGateway` 無 API 金鑰欄位。

## 停止聲明

依 Sprint 指示，Execution only。完成後停止，等待 PMO 確認並授權後續 Commit/Push（本 Sprint 本身
未執行任何 git 操作）。
