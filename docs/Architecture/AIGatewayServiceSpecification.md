# AI Gateway Service Specification — Sprint AI-100.5

**Type**: Architecture Specification (documentation only — no code in this repository) ｜
**Status**: DRAFT, pending PMO review ｜ **Depends on**: Sprint AI-100 (AI Gateway Foundation,
`ai-engine/src/gateway/`, `ai-engine/src/schema/`)

## 1. Purpose and Scope

This document — together with the six companion specifications listed in §7 — specifies a real,
externally-hosted **AI Gateway Service**: a small backend that the AI High School Learning System's
static frontend can eventually call to get real, model-generated Summary and Question content, while
this repository itself stays exactly what it is today: a static HTML/CSS/vanilla-JS prototype with
no server, no build step, deployable to GitHub Pages or opened via `file://`.

**This is a specification, not an implementation.** No code in this repository changes as a result
of this Sprint. The service it describes does not exist yet, is not deployed, and this repository
has no dependency on it — `AHS.AIEngine.AIGateway` (Sprint AI-100) remains inert (`isConfigured()`
false, every generation call throws) until a future, separately-authorized Sprint both (a) points a
real, deployed instance of this service at `GatewayConfig` and (b) supplies a concrete `ApiClient`
subclass. That future Sprint is out of scope here.

## 2. Why a Separate Service (and Why Not In This Repository)

CLAUDE.md's Project Overview — the standing, checked-in constraint for this repository — is explicit:
*"no framework, no bundler, no Node server, no Docker, no real backend/database/AI API... Must keep
working over `file://` and on GitHub Pages."* A real LLM integration categorically requires two
things this repository cannot provide: (1) a place to hold a real OpenAI API key outside of anything
a browser can read, and (2) server-side compute to call OpenAI and shape the response. Both live in
the external service this document specifies — never in this repository, never in a frontend
`<script>` file, never in `ai-engine/`.

## 3. System Context

```
┌─────────────────────────────┐      HTTPS, CORS-restricted       ┌──────────────────────────┐      HTTPS       ┌────────────────────┐
│  Static Frontend (GitHub     │ ─────────────────────────────────▶│  AI Gateway Service        │ ────────────────▶│  OpenAI Responses   │
│  Pages / file://)            │                                    │  (Cloudflare Workers,      │                   │  API                 │
│  AHS.AIEngine.AIGateway      │◀───────────────────────────────── │   §5 Deployment Guide)     │◀────────────────  │                      │
│  (Sprint AI-100, unchanged)  │      JSON, schema-validated        │  §2 REST API               │   JSON response   │                      │
└─────────────────────────────┘                                    └──────────────────────────┘                   └────────────────────┘
```

- **Frontend → Gateway**: the only network hop this repository would ever make, once a future Sprint
  authorizes it. Request/response shapes are fixed by §2 (REST API Specification) and validated
  client-side by the existing `AHS.AIEngine.SchemaValidator` against `SummarySchema`/`QuestionSchema`/
  `ErrorSchema` (Sprint AI-100) — no new validation logic needs to be invented later, it already
  exists and is already tested (`tests/regression/AIGatewayFoundationV1.js`).
- **Gateway → OpenAI**: entirely server-side, specified in §4 (OpenAI Responses API Integration
  Specification). The frontend never talks to OpenAI directly and never sees an OpenAI credential.

## 4. Design Principles

1. **Provider independence, preserved.** The frontend's `AIGateway.request(operation, payload)`
   contract (Sprint AI-100) does not change. The Gateway Service is one possible `ApiClient`
   implementation target; the frontend abstraction was already built to not care which backend or
   which upstream model provider sits behind it.
2. **No frontend credentials, structurally.** Reaffirmed from Sprint AI-100: `GatewayConfig` has no
   key field. This service's Authentication Specification (§7.3) defines how the frontend is
   authorized without ever holding a secret capable of calling OpenAI.
3. **Contract-first.** The REST API's request/response bodies are the *same* `SummarySchema`/
   `QuestionSchema`/`ErrorSchema` already defined in `ai-engine/src/schema/` (Sprint AI-100) — the
   Gateway is specified to fill in real values for the fields those schemas already declare
   (`concepts`/`definitions`/`formulas`/`examples`/`questions`), not to define a new, divergent
   contract the frontend would need to be rebuilt around.
4. **Honest failure.** Every failure mode returns the existing `ErrorSchema` shape
   (`{code, message, details}`); the Gateway never returns a 200 with degraded or partially-fabricated
   content silently substituted for a real failure.
5. **Small, single-purpose, cheap to operate.** Two operations only (`summary`, `question`), a
   stateless edge deployment (§6), no database of its own — the Gateway is a thin, auditable relay
   plus one round trip to OpenAI, not a general-purpose backend.

## 5. Relationship to Existing Repository Code (Sprint AI-100 recap)

| Frontend piece (already built, LOCK per its own Sprint's QA) | Role in this specification |
|---|---|
| `AHS.AIEngine.GatewayConfig` (`provider`/`endpoint`/`model`) | `endpoint` would eventually hold this service's base URL (§7.2 §3); `model` maps to §7.4 §3's model selection |
| `AHS.AIEngine.ApiClient` (interface) | A future concrete subclass would implement `send()` to call this service's REST API (§7.2) |
| `AHS.AIEngine.SummarySchema` / `QuestionSchema` / `ErrorSchema` | The exact response contract this service must satisfy (§7.2 §4) |
| `AHS.AIEngine.SchemaValidator` | Already capable of validating this service's real responses today, with zero code change, once real payloads exist |

## 6. Non-Goals

- Does not authorize writing any server code in this repository (Constraint: "No backend
  implementation").
- Does not authorize any frontend wiring change (Constraint: "No frontend integration") — no HTML
  page, no `ai-engine/` file, no `js/` file changes as part of this Sprint.
- Does not select a final hosting decision beyond Cloudflare Workers (explicitly named in this
  Sprint's scope) — alternative hosts are not evaluated here.
- Does not commit to a launch date, budget, or specific OpenAI model version; §7.4 and §7.7 describe
  how those are chosen and revisited operationally, not fixed values.

## 7. Companion Documents

| # | Document | Scope item |
|---|---|---|
| 1 | `docs/Architecture/AIGatewayServiceSpecification.md` (this file) | 1. AI Gateway architecture specification |
| 2 | `docs/Architecture/AIGatewayRestApiSpecification.md` | 2. REST API specification |
| 3 | `docs/Architecture/AIGatewayAuthenticationSpecification.md` | 3. Authentication specification |
| 4 | `docs/Architecture/AIGatewayOpenAIIntegrationSpecification.md` | 4. OpenAI Responses API integration specification |
| 5 | `docs/Architecture/AIGatewayCloudflareDeploymentGuide.md` | 5. Deployment guide for Cloudflare Workers |
| 6 | `docs/Architecture/AIGatewaySecuritySpecification.md` | 6. Security specification |
| 7 | `docs/Architecture/AIGatewayOperationsSpecification.md` | 7. Operations specification |

## 8. Open Questions for PMO (not blocking this Sprint, blocking any future implementation Sprint)

- Who owns and pays for the Cloudflare account and the OpenAI API key/billing?
- What is the acceptable latency/cost ceiling per request (affects model choice, §7.4 §3)?
- Is a per-student or per-session rate limit required, and if so, what identifies a "student" without
  the frontend holding any credential (§7.3 §4, §7.6 §3)?
- Data retention: may student-submitted material text be logged/retained by the Gateway at all, even
  transiently (§7.6 §5)?

These are flagged, not answered, here — resolving them is a PMO/product decision, not an
architecture-specification default.
