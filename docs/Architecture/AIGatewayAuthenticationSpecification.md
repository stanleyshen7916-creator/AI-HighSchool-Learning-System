# AI Gateway Authentication Specification — Sprint AI-100.5

**Type**: Specification (documentation only) ｜ Companion to `AIGatewayServiceSpecification.md`

## 1. Two Separate Trust Boundaries

This specification covers two distinct authentication relationships that must never be conflated:

1. **Frontend → Gateway** — the static site (untrusted, public, source-visible) calling the Gateway.
2. **Gateway → OpenAI** — the Gateway (trusted, server-side, secret-holding) calling OpenAI.

The frontend must never hold, transmit-as-its-own, or be capable of reconstructing the credential
used in relationship 2. This is the concrete mechanism behind Sprint AI-100's "No frontend API keys"
constraint and this Sprint's Constraint 8 ("Do not store API keys in the frontend").

## 2. Gateway → OpenAI

- The OpenAI API key is stored exclusively as a Cloudflare Workers **Secret** (`wrangler secret put
  OPENAI_API_KEY`), never in source code, never in `wrangler.toml`, never in an environment variable
  visible to any client. See `AIGatewayCloudflareDeploymentGuide.md` §3.
- The key is read once per request inside the Worker's request handler and used only for the
  server-to-server call to OpenAI's Responses API (`AIGatewayOpenAIIntegrationSpecification.md`).
- The key is never included in any response body, error `details`, or log line (`AIGatewaySecuritySpecification.md`
  §5 — logging policy).

## 3. Frontend → Gateway

The frontend is a public static site with fully readable source — **any credential embedded in it is
public**, full stop. This rules out a shared long-lived secret entirely. Two viable patterns:

### Option A — Origin + Rate Limit Only (recommended for MVP launch)

No per-request credential at all. Authorization is enforced by:
- **CORS origin allow-list** (`AIGatewaySecuritySpecification.md` §4) — only requests whose `Origin`
  header matches the deployed GitHub Pages domain (and `localhost` for development) receive a
  CORS-permitting response; browsers refuse to expose the response to script for any other origin.
- **Per-IP / per-origin rate limiting** at the Cloudflare edge (`AIGatewaySecuritySpecification.md`
  §3) bounds abuse from anyone who bypasses CORS via a non-browser client (CORS is not a security
  boundary against direct `curl`/server-to-server calls — rate limiting and cost caps are the real
  backstop, see §5 below).

This is honest about its limits: it does not identify *which student* is calling, only that a call
came from the expected origin, within budget. For an MVP whose content (rule-based/AI-assisted study
material summaries and questions) is not sensitive and not something worth attacking for its own
sake, this is judged sufficient — cost/abuse control (§5) is the actual concern, not per-user access
control.

### Option B — Short-Lived Session Token (future hardening, not MVP-required)

If per-student attribution or stricter quota-per-user becomes a requirement, the Gateway can issue a
short-lived (e.g. 5-minute) signed token from a lightweight `/v1/session` endpoint that itself
requires no credential (e.g. tied to a school-issued SSO assertion, out of scope for this Sprint
since this repository has no authentication system of its own — `AI High School Learning System` is
currently a fully anonymous, client-side prototype with no login). This option is documented for
completeness but is **not recommended for the initial deployment** — it adds real complexity for a
threat (impersonation of an individual student) that doesn't yet map to any actual harm in an MVP
with no student accounts, no PII storage, and no persistent grading tied to identity.

**Decision for MVP**: Option A. Revisit only if usage patterns show it's insufficient
(`AIGatewayOperationsSpecification.md` §5, capacity/abuse review).

## 4. What the Frontend Sends

Per Option A, requests carry no `Authorization` header at all for the MVP deployment. The REST API
Specification's `Authorization` header row (`AIGatewayRestApiSpecification.md` §6) is reserved for a
future Option B rollout and returns `401 UNAUTHORIZED` today only if a caller sends a malformed
`Authorization` header the Gateway doesn't understand — an absent header is not an error under
Option A.

## 5. Cost/Abuse as the Real Boundary

Because there is no per-user credential, the actual defense against abuse is:
- CORS origin restriction (blocks casual browser-based abuse from other sites)
- Cloudflare-edge rate limiting, per-IP and in aggregate (`AIGatewaySecuritySpecification.md` §3)
- A hard monthly cost ceiling on the OpenAI account itself, configured outside this Gateway entirely,
  as a last-resort circuit breaker (`AIGatewayOperationsSpecification.md` §6)

## 6. Explicitly Out of Scope

- Student login/accounts — this repository has none today; adding one is a product decision far
  outside a Backend Integration Sprint's scope.
- OAuth/SSO integration with any school identity provider — noted as a possible Option B input, not
  designed here.
- Per-student content history tied to a real identity — the existing frontend Runtimes (`WrongBookSession`,
  `ReviewQueue`, etc.) are already anonymous/session-scoped; nothing in this specification changes
  that.
