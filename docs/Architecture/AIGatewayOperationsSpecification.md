# AI Gateway Operations Specification — Sprint AI-100.5

**Type**: Specification (documentation only) ｜ Companion to `AIGatewayServiceSpecification.md`

## 1. Service Level Objective (SLO) — Targets, Not Guarantees, for an MVP-Stage Service

| Metric | Target | Rationale |
|---|---|---|
| Availability | Best-effort, no formal SLA at MVP stage | A single-region-agnostic Cloudflare Worker with no database has few moving parts to fail, but "best-effort" is honest for a first deployment with no on-call rotation |
| `/v1/summary`, `/v1/question` P95 latency | Dominated by the OpenAI round trip (typically several seconds) | Not meaningfully improvable by the Gateway itself; tracked (§2) to catch regressions, not to chase an aggressive number |
| `/v1/health` P95 latency | < 100ms | No OpenAI call in this path (`AIGatewayRestApiSpecification.md` §8) |

Formal SLAs are deferred until real usage data exists — committing to a number before any traffic
has been served would be a guess, not an operational target.

## 2. Monitoring and Alerting

- **Uptime**: external monitor polling `GET /v1/health` on a short interval (e.g. every 1-5 minutes);
  alert on N consecutive failures.
- **Error rate**: alert if the 5xx rate over a rolling window exceeds a threshold (tuned after
  observing real baseline traffic — not fixed here).
- **Upstream timeout**: the Worker enforces a hard timeout on its OpenAI call (recommended starting
  point: 30 seconds, revisited once real P50/P95 OpenAI latency is observed) and returns
  `504 UPSTREAM_TIMEOUT` (`AIGatewayRestApiSpecification.md` §5) rather than hanging — Cloudflare
  Workers also has its own platform-level execution time limit that this must stay under.
- **Cost**: OpenAI usage dashboard alerts (configured on the OpenAI account itself, outside the
  Gateway) as the ultimate circuit breaker independent of anything the Gateway code does — see §6.

## 3. Incident Response

| Symptom | First action |
|---|---|
| Spike in `5xx` from `/v1/*` | Check Cloudflare Workers Logs for the error `code` distribution (`UPSTREAM_ERROR` vs `UPSTREAM_TIMEOUT` vs `INTERNAL_ERROR`) to localize to OpenAI vs. the Worker itself |
| Suspected key leakage | Rotate `OPENAI_API_KEY` immediately (`AIGatewayCloudflareDeploymentGuide.md` §4, `AIGatewaySecuritySpecification.md` §2) — rotation requires no code deploy |
| Cost spike / suspected abuse | Tighten rate limits (`AIGatewaySecuritySpecification.md` §3) via Cloudflare dashboard (no deploy needed); if severe, temporarily disable the route entirely |
| Bad deploy (regressed schema validation, broken handler) | `wrangler rollback` to the immediately prior deployment (`AIGatewayCloudflareDeploymentGuide.md` §10) — seconds, not minutes |

No formal on-call rotation is specified for an MVP-stage service with no SLA (§1) — incident response
here means "documented first steps," not a paging policy.

## 4. Capacity Planning and Cost Control

- Request volume is expected to correlate with active-user counts on the frontend, which this
  repository can already observe indirectly (no real telemetry exists in this static prototype
  today) — initial capacity assumptions should be conservative and revised after real traffic.
- OpenAI cost per request ≈ `f(input tokens from material.content, output tokens from max_output_tokens)`
  — both bounded (`AIGatewayOpenAIIntegrationSpecification.md` §7); actual per-request cost should be
  measured post-launch and used to set a realistic monthly budget ceiling, not estimated in the
  abstract here.
- Model selection (`AIGatewayOpenAIIntegrationSpecification.md` §3) is the single biggest cost lever
  — revisit periodically as OpenAI's pricing/model lineup changes, not a one-time decision.

## 5. Change Management

- **REST API contract** (`AIGatewayRestApiSpecification.md`): additive changes (new optional field)
  may ship without a version bump; breaking changes require a new `/v2/` path (§1 of that document) —
  the existing `/v1/` contract must keep working for any frontend still pointed at it.
- **Schema drift**: the Gateway's server-side schema definitions are described as ports of this
  repository's `ai-engine/src/schema/*.js` files (`AIGatewayCloudflareDeploymentGuide.md` §2). Any
  change to the client-side schemas (a future Sprint in *this* repository) must be manually
  propagated to the Gateway's server-side copies before the Gateway can correctly validate/return
  data using the new shape — flagged here as a manual, easy-to-forget step until/unless a shared
  schema-sync mechanism is built (not designed in this Sprint).
- **Deploys**: via the Gateway's own CI/CD (`AIGatewayCloudflareDeploymentGuide.md` §9), entirely
  decoupled from this repository's deploy cadence.

## 6. Cost Circuit Breaker

Independent of any Gateway-level rate limiting (`AIGatewaySecuritySpecification.md` §3), the OpenAI
account itself should have a hard monthly spending cap configured directly in OpenAI's billing
settings — a backstop that works even if a bug in the Gateway's own rate-limiting logic fails. This
is an account-level control, not something the Gateway's code enforces.

## 7. Runbook Summary (quick reference)

```
Service down?           → check /v1/health, check Cloudflare status page, check recent deploys
5xx spike?               → check error `code` distribution in Workers Logs
Suspected key leak?       → rotate OPENAI_API_KEY (no deploy needed)
Cost spike?                 → tighten rate limits (no deploy needed), check OpenAI usage dashboard
Bad deploy?                   → wrangler rollback
Schema mismatch reported?      → verify Gateway's server-side schema copy against this repo's
                                  ai-engine/src/schema/*.js — resync if drifted
```

## 8. Explicitly Out of Scope

- Multi-region failover — a single Cloudflare Worker deployment is global-edge by default
  (Cloudflare's own network), so this is largely handled by the platform; no additional design is
  specified here.
- Formal disaster recovery / backup plan — the Gateway is stateless with no database (§ `AIGatewayServiceSpecification.md`
  §4, design principle 5), so there is no data to back up.
- A dedicated on-call rotation or paging tool integration — deferred until the service has real
  production traffic and an owning team large enough to staff one.
