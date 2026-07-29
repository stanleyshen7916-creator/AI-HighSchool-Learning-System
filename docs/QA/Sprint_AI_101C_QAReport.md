# QAReport.md — Sprint AI-101C｜Frontend AI Integration

## Scope Verified

Frontend wiring of `SummaryAdapter`/`QuestionAdapter` to the real, external AI Gateway Service
(`AI-HighSchool-AI-Gateway`), a real `ApiClient` implementation (`HttpApiClient.js`), a configurable
(empty-by-default) endpoint, and an additive UI panel with loading/retry/timeout/friendly-error
states. Reused, unmodified: `AHS.AIEngine.AIGateway`/`GatewayConfig`/`GatewayConfigValidator`/
`ApiClient`/`SchemaValidator`/`SummarySchema`/`QuestionSchema`/`ErrorSchema`/`KnowledgeLoader`
(Sprint AI-100), `AHS.QuestionGenerationRuntime` (LOCK).

## Test Results

| Suite | Result |
|---|---|
| `tests/regression/AIGatewayFrontendV1.js` (new) | 28/28 PASS |
| `tests/regression/AIEngineQuestionV1.js` (1 assertion updated) | 77/77 PASS |
| `npm test` (BehaviorSuite + PipelineRegression) | 181/181 PASS |
| `npm run verify` (VerifyPaths + VerifyForbiddenPatterns) | PASS (1 pre-existing KNOWN-ISSUE, unrelated) |
| All 24 permanent regression suites | 944/944 PASS |
| **Grand Total** | **1125/1125 real assertions PASS** (175 + 6 + 944, PipelineRegression not double-counted) |
| Console errors on `materials.html` (jsdom, full script list incl. 19 new tags) | 0 |

## Constraint Verification

- ☑ **Do not modify MVP architecture** — no existing Runtime, no existing Baseline UI component
  (`MaterialSummaryCard.js`, `MaterialQuestionCard.js`) modified. `MaterialPreview.js`'s only change
  is 3 additive lines appending two new panel nodes, the same pattern already used twice in that
  file. Default behavior (endpoint unset) is byte-identical to pre-Sprint behavior on every existing
  page flow — verified by the unchanged 175/175 BehaviorSuite result, including the three existing
  test blocks that specifically exercise `materials.html`'s AI UI flows.
- ☑ **Do not modify AI Gateway repository** — `git diff` for this Sprint is entirely contained within
  `AI-HighSchool-Learning-System`; `AI-HighSchool-AI-Gateway` was not cloned, read, or written to
  during this Sprint's work.
- ☑ **No Mock or Stub** — `HttpApiClient.js` performs a genuine `fetch()` call; there is no
  hardcoded/fabricated response anywhere in the delivered code. The one stub-shaped object in the
  codebase (the mocked `global.fetch` in `AIGatewayFrontendV1.js`) is test-only scaffolding proving
  real request/response handling, not a production code path — no page ships with a mocked network
  layer. When no real endpoint is configured (the shipped default), the app honestly reports
  "AI Gateway 尚未設定" rather than fabricating content — this is configuration-driven inertness, not
  a code-level mock, and is verified by a dedicated regression assertion confirming `fetch` is never
  even called in that state.
- ☑ **All AI requests must go through AIGateway** — `generateViaGateway()` on both adapters is the
  only new code path introduced by this Sprint that reaches an external service, and it goes
  exclusively through `AHS.AIEngine.AIGateway.summarize()`/`generateQuestions()` → `HttpApiClient`.
  No other new file calls `fetch`/`XMLHttpRequest` — enforced by source-scan
  (`AIGatewayFrontendV1.js`: "真實 fetch()/XMLHttpRequest 僅存在於 HttpApiClient.js").
- ☑ **Execution only** — implementation follows the AI-100/AI-100.5/AI-101B specifications and
  existing code shapes as written; no new design decision beyond what those already determined
  (e.g. Option A auth is unaffected — no credential is added anywhere on the frontend side either).

## Architecture Verification

- ☑ **Preserve all existing Runtime APIs** — zero `js/runtime/*.js` files touched. `SummaryAdapter`/
  `QuestionAdapter`'s pre-existing 8 methods each are unchanged (verified: exact method-presence
  assertions plus one real end-to-end call to a pre-existing method,
  `SummaryAdapter.generate(mat.id)`, in the new regression file).
- ☑ **No API keys in frontend** — `AppConfig.aiGateway` has no `apiKey` field (verified by
  assertion); `HttpApiClient.js` never reads, stores, or transmits any credential — it only ever
  sends `material`/`options` data to the configured endpoint.
- ☑ **file:///GitHub Pages compatibility preserved** — `AppConfig.aiGateway.endpoint` defaults to
  `""` (never a guessed URL); with it empty, `AIGateway.isConfigured()` is false and
  `GatewayIntegration.call()` never invokes `fetch()` — verified directly, not just inferred.
- ☑ **No duplication** — `GatewayIntegration.js` reuses the exact existing `AIGateway`/
  `KnowledgeLoader`/`SchemaValidator`/schema instances from Sprint AI-100, composing rather than
  reimplementing; `AIGatewayPanel.js` reuses existing `mat-summary__`/`mat-question__` CSS classes,
  zero new CSS.

## Critical Defects

**None found.** (One pre-existing test's exact-membership assertion was legitimately stale after
this Sprint's intentional, additive API expansion — corrected, not a defect in shipped behavior.)

## Recommendation

Implementation complete, fully tested, zero regressions, zero constraint violations. The one
architecture exception (real `fetch()` in `HttpApiClient.js`) is narrowly scoped, explicitly
documented, defaults to fully inert, and is enforced by a dedicated regression test to stay confined
to that single file. Per "Execution only," no commit/push was performed — awaiting PMO review and
explicit commit/push authorization, consistent with every prior Implementation Sprint in this
repository's history.
