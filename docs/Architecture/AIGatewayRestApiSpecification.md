# AI Gateway REST API Specification — Sprint AI-100.5

**Type**: Specification (documentation only) ｜ Companion to `AIGatewayServiceSpecification.md`

## 1. Base URL and Versioning

```
https://<gateway-host>/v1/
```

`v1` is a literal path segment, not a header — allows an incompatible future contract to be
introduced at `/v2/` without breaking a frontend still pinned to `/v1/`. The frontend's
`GatewayConfig.endpoint` would hold the full base URL including `/v1`.

## 2. Endpoints

| Method | Path | Operation | Maps to |
|---|---|---|---|
| `POST` | `/v1/summary` | Generate a Summary for one material | `AIGateway.summarize(payload)` |
| `POST` | `/v1/question` | Generate a Question Set for one material | `AIGateway.generateQuestions(payload)` |
| `GET` | `/v1/health` | Liveness/readiness probe (no OpenAI call) | Operational only, not called by the frontend |

No other endpoints exist. No endpoint accepts a database write, a file upload, or any operation
beyond "take structured material text in, return structured AI content out."

## 3. Request Shape

Both `POST` endpoints share one envelope:

```json
{
  "requestId": "string, client-generated UUID, echoed back for tracing",
  "material": {
    "materialId": "string",
    "title": "string | null",
    "subject": "string | null",
    "grade": "string | null",
    "chapter": "string | null",
    "section": "string | null",
    "content": "string — the material's real, verbatim text"
  },
  "options": {
    "difficulty": "string | null (question generation only — easy | medium | hard)"
  }
}
```

`material` intentionally mirrors the shape `AHS.AIEngine.KnowledgeLoader.loadFromMaterial()` already
produces client-side (Sprint AI-003/004) — a future `ApiClient` subclass's `send()` can map a
`Knowledge Object` onto this request body with a pure reshape, no new extraction logic.

**Size limit**: `material.content` capped at 50,000 characters per request (§ `AIGatewaySecuritySpecification.md`
§3 — abuse/cost control). Requests exceeding the cap return `413` with `ErrorSchema` code
`PAYLOAD_TOO_LARGE`.

## 4. Response Shape — Success

`200 OK`. Body is **exactly** the existing, already-implemented, already-tested schema:

- `POST /v1/summary` → a payload validated by `AHS.AIEngine.SummarySchema` (`ai-engine/src/schema/SummarySchema.js`, Sprint AI-100) — the same 9 fields `SummaryBuilder.FIELDS` already declares, with `concepts`/`definitions`/`formulas`/`examples`/`keywords` now containing real, model-generated content instead of the honest empty-array stub the client-side Foundation produces today.
- `POST /v1/question` → a payload validated by `AHS.AIEngine.QuestionSchema` (Sprint AI-100), including the `questions[]` item shape already aligned with the real, LOCK `AHS.QuestionGenerationRuntime` production model (`id`/`knowledgeNodeId`/`knowledgeType`/`type`/`difficulty`/`question`/`options` [exactly 4]/`answer`/`explanation`/`traceability`) — a real backend-generated question is required to be downstream-compatible with the existing Quiz/WrongBook/Review chain, not a new, incompatible shape.

No new schema is defined by this document — reusing the existing, tested one is the point (§4,
`AIGatewayServiceSpecification.md`).

Response envelope adds one field alongside the schema-validated body:

```json
{
  "requestId": "string — echoes the request's requestId",
  "data": { "...": "SummarySchema- or QuestionSchema-shaped body" }
}
```

## 5. Response Shape — Error

Every non-2xx response body is `ErrorSchema`-shaped (`ai-engine/src/schema/ErrorSchema.js`):

```json
{ "code": "string", "message": "string", "details": { "...": "optional, structured" } }
```

| HTTP Status | `code` | Meaning |
|---|---|---|
| 400 | `INVALID_REQUEST` | Request body fails structural validation (missing `material.content`, wrong types) |
| 401 | `UNAUTHORIZED` | Missing/invalid authorization (see `AIGatewayAuthenticationSpecification.md`) |
| 413 | `PAYLOAD_TOO_LARGE` | `material.content` exceeds the size cap |
| 422 | `SCHEMA_VALIDATION_FAILED` | The upstream model's output failed the Gateway's own `SummarySchema`/`QuestionSchema` validation before being returned — the Gateway must never forward a response it cannot itself validate (§ `AIGatewayOpenAIIntegrationSpecification.md` §4) |
| 429 | `RATE_LIMITED` | Caller exceeded the configured rate limit (`AIGatewaySecuritySpecification.md` §3) |
| 502 | `UPSTREAM_ERROR` | OpenAI returned an error or an unusable response |
| 504 | `UPSTREAM_TIMEOUT` | OpenAI did not respond within the configured timeout (`AIGatewayOperationsSpecification.md` §2) |
| 500 | `INTERNAL_ERROR` | Any other unhandled failure |

The Gateway never returns `200` with a body that fails its own schema validation — a `422` with
`SCHEMA_VALIDATION_FAILED` is preferred over forwarding malformed or partially-fabricated content,
matching this project's standing "honest failure over fabricated content" principle (Sprint AI-100
`AIGateway.request()`'s own "never fabricate a response" design, carried through to the real service).

## 6. Headers

| Header | Direction | Purpose |
|---|---|---|
| `Content-Type: application/json` | Both | Fixed; no other content type accepted or produced |
| `Authorization` | Request | Per `AIGatewayAuthenticationSpecification.md` |
| `X-Request-Id` | Both | Optional duplicate of body `requestId` for infrastructure-level log correlation (e.g. Cloudflare logs) that don't parse JSON bodies |
| `Access-Control-Allow-Origin` | Response | Restricted to the known frontend origin(s) — see `AIGatewaySecuritySpecification.md` §4; never `*` |
| `Retry-After` | Response (429/503) | Seconds until the caller should retry, consumed by the frontend's retry policy (`AIGatewayServiceSpecification.md` §7.7, and the client-side retry behavior specified for a future `ApiClient` implementation) |

## 7. Idempotency

`requestId` is accepted but the Gateway is not required to deduplicate — Summary/Question generation
is deterministic-enough-effort but not guaranteed byte-identical across two calls with the same
`requestId` (the upstream model is not seeded/pinned for reproducibility). `requestId` exists for
tracing and client-side retry correlation, not for server-side dedup. A future revision may add
dedup if real usage shows it's needed — not speculated further here.

## 8. `/v1/health`

```
GET /v1/health → 200 { "status": "ok" }
```

Never calls OpenAI; checks only that the Worker itself is running. Used by uptime monitoring
(`AIGatewayOperationsSpecification.md` §2), never called by the frontend at runtime.
