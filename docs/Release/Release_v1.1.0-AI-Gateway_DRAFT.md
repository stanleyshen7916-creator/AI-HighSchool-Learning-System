# Release v1.1.0-AI-Gateway — DRAFT, NOT READY TO SHIP

**Status**: **DRAFT / PENDING** — this is Sprint AI-102's Scope item 9 deliverable ("prepare v1.1
release documentation"). It is deliberately not written as a finished Release Note, because v1.1 is
not deployed, not pushed, and not production-validated — see
`docs/QA/Sprint_AI_102_ProductionValidationReport.md` for the full evidence. This document describes
what v1.1 **will** contain once the blockers listed there are resolved; publishing it as a real
Release Note before then would misrepresent the system's actual state.

## What v1.1 Adds Over v1.0.0-MVP

A real, working (once deployed) AI Gateway integration layer, built across five Sprints:

| Sprint | Delivered |
|---|---|
| AI-100 | AI Gateway Foundation — provider-independent `AIGateway`, `GatewayConfig` (no API key field, structurally), `ApiClient` interface, JSON Schemas (`SummarySchema`/`QuestionSchema`/`ErrorSchema`) aligned with real production models |
| AI-100.5 | Full specification for an external AI Gateway Service (REST API, auth, OpenAI Responses API integration, Cloudflare deployment, security, operations) |
| AI-101 | Question Production Pipeline — mirrors the Summary pipeline's Foundation shape, previously-empty `services/question/` slot now implemented |
| AI-101B | The specified Gateway Service, implemented for real in a separate repository (`AI-HighSchool-AI-Gateway`, Cloudflare Workers, TypeScript, OpenAI Responses API integration) — **code complete, not yet deployed** |
| AI-101C | Frontend wiring — real `fetch()`-based `HttpApiClient`, `SummaryAdapter`/`QuestionAdapter.generateViaGateway()`, an additive UI panel with loading/retry/timeout/error states |

## What v1.1 Does NOT Change

Per every Sprint's own constraints: no existing Runtime API, no existing Baseline UI component
(`MaterialSummaryCard.js`/`MaterialQuestionCard.js`), no existing Production Pipeline (Material →
Summary → Question → Quiz → WrongBook → Review → History → Dashboard, LOCKED since v1.0.0-MVP). The
AI Gateway is fully additive: with no endpoint configured (the shipped default), the app behaves
identically to v1.0.0-MVP.

## Known Limitations (carried forward, to be honestly disclosed same as v1.0.0-MVP's own Release Note)

- Gateway responses' `questions[]` items are schema-validated but the underlying model call has no
  production traffic yet to validate real-world quality against.
- Rate limiting on the Gateway is in-memory/per-isolate — a real but partial control, not a
  globally-consistent limit (disclosed in `AIGatewaySecuritySpecification.md` and the Gateway's own
  `QA_REPORT.md`).
- No per-student authentication — Option A (origin + rate limit only) per
  `AIGatewayAuthenticationSpecification.md`.
- `npm audit` on the Gateway repository flags 9 vulnerabilities, all in `wrangler`'s dev-tooling
  transitive dependencies, not the shipped Worker.

## Release Blockers (must clear before this becomes a real Release Note)

See `docs/QA/Sprint_AI_102_ProductionValidationReport.md`'s Punch List in full. Summary:
1. Cloudflare deployment credentials (`CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`) never
   configured — the Worker has never successfully deployed.
2. A real `OPENAI_API_KEY` has never been set as a Cloudflare Secret.
3. The frontend AI Gateway work (AI-100 through AI-101C) has never been committed or pushed to
   `AI-HighSchool-Learning-System`'s `main` — no Sprint has been authorized to do so.
4. Once 1-3 are resolved, real end-to-end validation (Scope items 1/2/3/6 of Sprint AI-102) against
   the actual live system is still required before this draft can be finalized into a real Release
   Note with a genuine version tag.

## QA Summary (code-level only — see caveat above)

Frontend: 1125/1125 regression assertions PASS, 0 console errors, `npm run verify` PASS. Gateway:
50/50 tests PASS, typecheck clean, `wrangler deploy --dry-run` confirms deployability. Zero
regressions across five Sprints. This is necessary but not sufficient for a production release —
see Release Blockers above.
