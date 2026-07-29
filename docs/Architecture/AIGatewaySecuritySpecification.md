# AI Gateway Security Specification — Sprint AI-100.5

**Type**: Specification (documentation only) ｜ Companion to `AIGatewayServiceSpecification.md`

## 1. Threat Model

| # | Threat | Likelihood/impact for a high-school study-content MVP | Mitigation |
|---|---|---|---|
| 1 | OpenAI API key leakage | High impact (direct cost/abuse exposure) if it occurred | Key never leaves Cloudflare Workers Secrets (§2); never logged (§5); never in any response |
| 2 | Cost-drain abuse (scripted mass requests) | Realistic — the endpoint is public | Rate limiting (§3), request size cap, no expensive client-selectable model (`AIGatewayOpenAIIntegrationSpecification.md` §3) |
| 3 | Prompt injection via material content | Realistic — material text is user-supplied | Structured output (`strict` JSON Schema, `AIGatewayOpenAIIntegrationSpecification.md` §2) constrains what the model can return regardless of injected instructions in the input; mandatory post-response schema validation (§4 of that doc) rejects anything that still doesn't conform |
| 4 | Cross-origin abuse from other websites | Moderate — CORS is the front line, not the only line | CORS origin allow-list (§4); rate limiting (§3) as the real backstop since CORS doesn't stop non-browser callers |
| 5 | Sensitive student data exposure via logs | Low likelihood, meaningful impact if it happened (this is a minors-facing platform) | No request/response body logging (§5); material content never persisted beyond the single request's processing |
| 6 | Dependency/supply-chain compromise in the Gateway's own code | Standard backend risk | Standard practice noted in §6 — not deeply elaborated here since the Gateway's implementation is out of this Sprint's scope |

## 2. Key Management

- OpenAI API key: Cloudflare Workers Secret only (`AIGatewayCloudflareDeploymentGuide.md` §4). Never
  in `wrangler.toml`, never in the Gateway's own source repository, never in this repository.
- Rotation: re-run `wrangler secret put OPENAI_API_KEY` with a new value; no code deploy required.
  Rotate immediately if any leakage is suspected (`AIGatewayOperationsSpecification.md` §3, incident
  response).
- No key of any kind is ever transmitted to, stored by, or reconstructible by the frontend — restated
  from `AIGatewayAuthenticationSpecification.md` §2 because it is this Sprint's Constraint 8 and
  Sprint AI-100's own structural guarantee (`GatewayConfig` has no key field, tested in
  `tests/regression/AIGatewayFoundationV1.js`).

## 3. Rate Limiting and Abuse Control

- Per-IP: a conservative request-per-minute ceiling at the Cloudflare edge, tuned operationally
  (`AIGatewayOperationsSpecification.md` §4) rather than fixed here — real usage data should drive
  the number, not a guess made before any traffic exists.
- Aggregate: a service-wide ceiling as a circuit breaker independent of per-IP limits, so a
  distributed abuse pattern (many IPs, low rate each) still can't exceed the operator's cost budget.
- `material.content` capped at 50,000 characters per request (`AIGatewayRestApiSpecification.md` §3)
  — bounds worst-case cost per individual request regardless of rate.
- `429 RATE_LIMITED` with `Retry-After` (`AIGatewayRestApiSpecification.md` §5-§6) rather than a
  silent drop, so a well-behaved client can back off correctly.

## 4. CORS Policy

`Access-Control-Allow-Origin` reflects only the exact, explicitly-configured origin(s) — the deployed
GitHub Pages domain and a local-development origin — never a wildcard `*`. Preflight (`OPTIONS`)
requests are handled without reaching the OpenAI call path. This is a real but partial control: it
constrains browser-based cross-origin abuse, not direct server-to-server calls, which is why §3's
rate limiting (not CORS) is the primary abuse backstop.

## 5. Logging Policy

- Logged: timestamp, HTTP status, latency, `requestId`, operation (`summary`/`question`), coarse
  outcome (success / which error `code`).
- **Never logged**: `material.content`, the full request body, the full response body, the OpenAI API
  key, any `Authorization` header value.
- Rationale: this is a minors-facing educational platform; student-submitted material text should not
  persist anywhere beyond the single request needed to process it, even in operational logs. This is
  a stricter policy than many backends default to, chosen deliberately given the audience.

## 6. Application-Level Hygiene (standard practice, noted not elaborated)

- Dependency updates tracked and applied in the separate Gateway repository (not this one).
- Input validation happens twice: REST API structural validation (`AIGatewayRestApiSpecification.md`
  §3-§5) before any OpenAI call, and output schema validation (`AIGatewayOpenAIIntegrationSpecification.md`
  §4) before any response leaves the Gateway.
- No secrets or credentials of any kind committed to the Gateway's own source repository — standard
  practice, enforced there the same way this repository enforces `npm run verify`'s forbidden-pattern
  scan for its own concerns.

## 7. Data Handled (for a future privacy/compliance review — not resolved here)

The Gateway processes: material text (subject/grade/chapter/section/content), submitted anonymously
(no student identity attached, per `AIGatewayAuthenticationSpecification.md` §6 — this repository has
no login system). No persistent storage of this data is specified anywhere in this Sprint's
documents — the Gateway is stateless per request. A dedicated privacy/compliance review (age-
appropriate content handling, any applicable regional student-data regulation) is flagged as an open
item for PMO (`AIGatewayServiceSpecification.md` §8), not resolved by this specification.

## 8. Explicitly Out of Scope

- Web Application Firewall (WAF) rule authoring — Cloudflare's default protections apply; custom WAF
  rules are an operational tuning task, not specified here.
- Formal penetration testing / third-party security audit — recommended before a production launch
  with real traffic, not part of this documentation Sprint.
- Content moderation of generated Summary/Question output beyond schema conformance — a product
  decision, not addressed here.
