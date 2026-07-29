/* ai-engine/src/schema/SummarySchema.js — Sprint AI-100 · AI Platform Foundation
   JSON Schema (draft-07 vocabulary subset — see SchemaValidator.js)
   describing the contract a future real backend's Summary response
   must satisfy. Deliberately field-for-field aligned with the
   existing, real Summary Model (ai-engine/src/services/summary/
   SummaryBuilder.js's 12 FIELDS) rather than inventing a new shape —
   a future backend response can be mapped directly onto that model
   with no redesign. Declarative only: no code here reads or writes a
   Summary, and nothing calls this schema outside of
   AIGateway.validateResponse()/SchemaValidator.validate(). */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.SummarySchema = Object.freeze({
  type: "object",
  required: ["subject", "metadata"],
  properties: {
    title: { type: ["string", "null"] },
    subject: { type: ["string", "null"] },
    grade: { type: ["string", "null"] },
    chapter: { type: ["string", "null"] },
    section: { type: ["string", "null"] },
    keywords: { type: "array", items: { type: "string" } },
    concepts: { type: "array" },
    definitions: { type: "array" },
    formulas: { type: "array" },
    examples: { type: "array" },
    difficulty: { type: ["string", "null"] },
    metadata: { type: ["object", "null"] }
  }
});
