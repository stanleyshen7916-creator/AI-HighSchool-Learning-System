/* ai-engine/src/schema/ErrorSchema.js — Sprint AI-100 · AI Platform Foundation
   JSON Schema (draft-07 vocabulary subset — see SchemaValidator.js)
   describing the generic error envelope a future real backend must
   use for any failed Summary/Question request — one shared shape for
   both operations rather than two divergent ones. Declarative only —
   see SummarySchema.js's header for the same "no code reads/writes
   this" note. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.ErrorSchema = Object.freeze({
  type: "object",
  required: ["code", "message"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
    details: { type: ["object", "null"] }
  }
});
