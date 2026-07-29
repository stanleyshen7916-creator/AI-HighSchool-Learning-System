# AI Gateway Cloudflare Workers Deployment Guide — Sprint AI-100.5

**Type**: Deployment Guide (documentation only) ｜ Companion to `AIGatewayServiceSpecification.md`

This guide describes how a future engineer would deploy the AI Gateway Service (specified in the
companion documents) to Cloudflare Workers. It describes work that happens **entirely outside this
repository** — in a separate repository/project for the Gateway Service itself. Nothing here is
executed, scaffolded, or committed as part of this Sprint.

## 1. Why Cloudflare Workers

- Zero cold-start-sensitive server to manage; billed per-request, well suited to a low/bursty-traffic
  MVP.
- Native `fetch`-based runtime — the Gateway's own outbound call to OpenAI is just a `fetch()` inside
  the Worker, no extra HTTP client dependency.
- Built-in Secrets storage (§3) keeps the OpenAI key out of source control entirely.
- Built-in rate limiting and a generous free tier suit an MVP-stage budget.

## 2. Project Layout (in the separate Gateway repository, not here)

```
ai-gateway-service/
  wrangler.toml
  src/
    index.ts              — router: /v1/summary, /v1/question, /v1/health
    handlers/
      summaryHandler.ts     — implements AIGatewayRestApiSpecification.md §2 POST /v1/summary
      questionHandler.ts     — implements §2 POST /v1/question
      healthHandler.ts        — implements §8 GET /v1/health
    openai/
      responsesClient.ts       — implements AIGatewayOpenAIIntegrationSpecification.md §2-§4
    schema/
      summarySchema.ts           — server-side port of ai-engine/src/schema/SummarySchema.js
      questionSchema.ts           — server-side port of ai-engine/src/schema/QuestionSchema.js
      errorSchema.ts                — server-side port of ai-engine/src/schema/ErrorSchema.js
      validator.ts                   — server-side JSON Schema validation (AIGatewayOpenAIIntegrationSpecification.md §4)
    middleware/
      cors.ts                          — origin allow-list (AIGatewaySecuritySpecification.md §4)
      rateLimit.ts                      — AIGatewaySecuritySpecification.md §3
```

The three `schema/*Schema.ts` files are intentionally described as **ports**, not reinventions — the
source of truth is this repository's `ai-engine/src/schema/*.js` (Sprint AI-100); keeping them in
sync (manually, or via a small sync script in the Gateway repository) is an explicit operational
responsibility (`AIGatewayOperationsSpecification.md` §5), so a future frontend schema change and the
Gateway's validation never silently drift apart.

## 3. `wrangler.toml` (illustrative, not literal)

```toml
name = "ai-highschool-gateway"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[vars]
ALLOWED_ORIGIN = "https://<org>.github.io"
DEFAULT_MODEL = "<pinned per AIGatewayOpenAIIntegrationSpecification.md §3>"

# Secrets are NOT declared here — see §4.
```

`ALLOWED_ORIGIN`/`DEFAULT_MODEL` are non-secret configuration and may live in `wrangler.toml` (or
Cloudflare's dashboard-managed environment variables); nothing here can call OpenAI on its own.

## 4. Secrets

```bash
wrangler secret put OPENAI_API_KEY
```

Prompted interactively; never written to `wrangler.toml`, never committed, never printed in CI logs.
Rotate by re-running the same command with a new value — no code change required
(`AIGatewaySecuritySpecification.md` §2, key rotation).

## 5. Routing / Custom Domain

```
Workers Route: gateway.<project-domain>/*  →  ai-highschool-gateway Worker
```

A custom domain (rather than the default `*.workers.dev`) is recommended so `GatewayConfig.endpoint`
(frontend, Sprint AI-100) can be set to a stable, project-branded URL independent of Cloudflare's own
naming.

## 6. CORS

Configured in `middleware/cors.ts`, driven by the `ALLOWED_ORIGIN` var (§3) — reflects
`Access-Control-Allow-Origin` only for the exact configured origin(s) (the deployed GitHub Pages
domain, plus a `localhost` entry for local frontend development), never `*`. Full policy in
`AIGatewaySecuritySpecification.md` §4.

## 7. Rate Limiting

Cloudflare's native Rate Limiting rules (dashboard or `wrangler.toml` `[[unsafe.bindings]]` /
Cloudflare Rate Limiting API depending on plan) applied at the route level, per the thresholds in
`AIGatewaySecuritySpecification.md` §3. This is infrastructure configuration, not application code.

## 8. Observability

- Cloudflare's built-in Workers Logs / Logpush for request-level logs (status code, latency,
  `requestId` — never request/response bodies, per `AIGatewaySecuritySpecification.md` §5).
- `GET /v1/health` wired to an external uptime monitor (e.g. a simple cron-based check) —
  `AIGatewayOperationsSpecification.md` §2.

## 9. CI/CD (illustrative)

```
on: push to main (ai-gateway-service repo, NOT this repo)
  1. npm ci
  2. npm test          — server-side unit tests for handlers/schema validation
  3. wrangler deploy    — requires CLOUDFLARE_API_TOKEN as a CI secret, scoped to this Worker only
```

Deploys are entirely decoupled from this repository's own `main` branch and GitHub Pages deployment
— the two systems have no build/deploy coupling, only a runtime HTTP relationship once a future
Sprint wires the frontend to a real, deployed Gateway URL.

## 10. Rollback

Cloudflare Workers retains prior deployments; `wrangler rollback` reverts to the previous version
immediately (seconds, not minutes) if a bad deploy is detected — detailed in
`AIGatewayOperationsSpecification.md` §3.
