# AI Gateway OpenAI Responses API Integration Specification — Sprint AI-100.5

**Type**: Specification (documentation only) ｜ Companion to `AIGatewayServiceSpecification.md`

## 1. Why the Responses API

OpenAI's Responses API is the integration target (per this Sprint's explicit scope) rather than the
older Chat Completions API because it natively supports structured, schema-constrained output — the
Gateway needs the model's output to already conform to `SummarySchema`/`QuestionSchema` shapes rather
than free-form text the Gateway would have to parse and coerce after the fact. This lines up directly
with this project's standing "no fabrication, validate before returning" principle (§4 below).

## 2. Request Construction

For each Gateway operation, the Worker builds one Responses API call:

```
POST https://api.openai.com/v1/responses
Authorization: Bearer <OPENAI_API_KEY>   (server-side only, see AIGatewayAuthenticationSpecification.md §2)
Content-Type: application/json

{
  "model": "<configured model, see §3>",
  "input": [
    { "role": "system", "content": "<operation-specific instructions, see §4>" },
    { "role": "user", "content": "<material text + structural metadata, see §5>" }
  ],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "summary_response" | "question_response",
      "schema": "<a JSON-Schema-draft-2020-12-shaped object derived from SummarySchema/QuestionSchema>",
      "strict": true
    }
  }
}
```

`strict: true` is required, not optional — it is what makes the Responses API itself refuse to
return output violating the schema, giving the Gateway a first line of defense before its own
`AHS.AIEngine.SchemaValidator`-equivalent server-side check (§4) runs a second time.

### Schema translation note

`SummarySchema`/`QuestionSchema` (Sprint AI-100, `ai-engine/src/schema/`) already use a JSON-Schema
vocabulary subset (`type`/`properties`/`required`/`items`/`enum`/`minItems`/`maxItems`) chosen
specifically because it maps cleanly onto standard JSON Schema — the Gateway's implementation would
translate these client-side schema objects into the OpenAI `strict` structured-output dialect (which
requires every object to set `additionalProperties: false` and list every property as `required`,
using nullable unions like `["string","null"]` for optional fields — already the exact style these
two schemas use). No new schema is authored for OpenAI; the existing ones are the source of truth,
translated mechanically.

## 3. Model Selection

The Gateway's `GatewayConfig.model` field (frontend, Sprint AI-100) is advisory only — the Gateway
Service pins its own server-side default (not client-selectable, to keep cost/behavior predictable
and prevent a compromised or malicious frontend request from selecting an expensive model). Model
choice is an operational decision revisited per `AIGatewayOperationsSpecification.md` §4 based on
real cost/quality data once deployed — this document does not hardcode a specific model name, since
that choice belongs to whoever operates the deployed service and will change over the service's
lifetime as OpenAI's model lineup evolves.

## 4. Post-Response Validation (mandatory, not optional)

Even with `strict: true` structured output, the Gateway **must** re-validate the model's output
against the authoritative schema before returning it to the frontend — the same
`SummarySchema`/`QuestionSchema` objects already implemented and tested client-side
(`ai-engine/src/schema/`, validated by `tests/regression/AIGatewayFoundationV1.js`). A server-side
port of `SchemaValidator`'s logic (or an equivalent JSON Schema library, since server-side code is
not bound by this repository's "no external套件" convention) runs against the parsed response.
Failure → `422 SCHEMA_VALIDATION_FAILED` (`AIGatewayRestApiSpecification.md` §5), never a forwarded,
unvalidated 200. This is the Gateway-side enforcement of the same principle Sprint AI-100 built
client-side: never return a response the receiving code can't trust.

## 5. Prompt Construction

System instructions are operation-specific and reference the existing Prompt Engine's reserved slot
concept (`ai-engine/src/prompt/PromptRegistry.js`, EO-AI-001, Foundation-only, five reserved slots
including `summary` and `question`) as their natural long-term home — a future implementation Sprint
may populate those reserved-but-empty prompt slots with the real templates this service uses, rather
than hardcoding prompt text only inside the external Gateway repository. This keeps the prompt
content auditable from *this* repository even though the Gateway executes elsewhere. Not implemented
by this Sprint (Constraint: documentation only) — noted here as the intended integration point for
whoever builds the Gateway.

The user-role content is the `material` object from the REST API request (`AIGatewayRestApiSpecification.md`
§3) — real, verbatim material text plus its structural metadata (subject/grade/chapter/section),
never anything invented server-side.

## 6. Streaming

Not used. Both `/v1/summary` and `/v1/question` are single-shot, non-streaming requests — the
Gateway must have the complete, schema-validated response in hand before it can validate (§4) and
return it; a partially-streamed response cannot be schema-validated until it's complete anyway, so
streaming would add complexity (SSE relay, partial-failure handling) without a real benefit for this
use case. Revisit only if a future UX requirement (e.g. a visibly-typing AI Tutor chat, distinct from
Summary/Question generation) needs it — out of scope here.

## 7. Token / Cost Controls

- `material.content` capped at 50,000 characters at the REST API layer (`AIGatewayRestApiSpecification.md`
  §3) before it ever reaches OpenAI — bounds input token cost per request.
- `max_output_tokens` set conservatively per operation (Summary vs. Question have different realistic
  output sizes) — exact values are an operational tuning parameter (`AIGatewayOperationsSpecification.md`
  §4), not fixed here.
- No retry-with-larger-context escalation — a truncated or refused response is a normal
  `502 UPSTREAM_ERROR`/`422 SCHEMA_VALIDATION_FAILED`, not automatically retried with a more
  expensive configuration.

## 8. Failure Modes From OpenAI

| OpenAI-side condition | Gateway response |
|---|---|
| Non-2xx from OpenAI | `502 UPSTREAM_ERROR` |
| Timeout (§ `AIGatewayOperationsSpecification.md` §2) | `504 UPSTREAM_TIMEOUT` |
| 200 but output fails schema validation (§4) | `422 SCHEMA_VALIDATION_FAILED` |
| Refusal (model declines to answer) | `502 UPSTREAM_ERROR` with `details.reason: "refusal"` — never silently substituted with placeholder content |

Every path reaches a real `ErrorSchema`-shaped response — the Gateway never fabricates Summary/
Question content to paper over an upstream failure.
