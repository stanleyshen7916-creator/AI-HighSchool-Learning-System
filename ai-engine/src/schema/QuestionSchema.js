/* ai-engine/src/schema/QuestionSchema.js — Sprint AI-100 · AI Platform Foundation
   JSON Schema (draft-07 vocabulary subset — see SchemaValidator.js)
   describing the contract a future real backend's Question response
   must satisfy. The envelope is field-for-field aligned with the
   existing, real Question Set Model (ai-engine/src/services/question/
   QuestionBuilder.js's 9 FIELDS, Sprint AI-101). Each item inside
   `questions` is aligned with the existing, real, LOCK production
   Question Model already enforced by js/runtime/
   QuestionGenerationRuntime.js (baseQuestion()/traceabilityFor()) —
   four options, one answer, one explanation, full traceability — so a
   future backend-generated question is shaped for direct downstream
   compatibility with the existing Quiz/WrongBook/Review chain, not a
   new, incompatible shape. Declarative only — see SummarySchema.js's
   header for the same "no code reads/writes this" note. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

(function () {
  "use strict";

  var QUESTION_ITEM_SCHEMA = {
    type: "object",
    required: ["id", "knowledgeNodeId", "knowledgeType", "type", "difficulty",
      "question", "options", "answer", "explanation", "traceability"],
    properties: {
      id: { type: "string" },
      knowledgeNodeId: { type: "string" },
      knowledgeType: { type: "string", enum: ["definition", "formula", "keyword", "concept"] },
      type: { type: "string", enum: ["single_choice"] },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      question: { type: "string" },
      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
      answer: { type: "string" },
      explanation: { type: "string" },
      traceability: {
        type: "object",
        required: ["materialId", "knowledgeNodeId"],
        properties: {
          materialId: { type: "string" },
          knowledgeNodeId: { type: "string" },
          paragraph: { type: ["number", "null"] },
          lineStart: { type: ["number", "null"] },
          lineEnd: { type: ["number", "null"] }
        }
      }
    }
  };

  AHS.AIEngine.QuestionSchema = Object.freeze({
    type: "object",
    required: ["subject", "metadata"],
    properties: {
      title: { type: ["string", "null"] },
      subject: { type: ["string", "null"] },
      grade: { type: ["string", "null"] },
      chapter: { type: ["string", "null"] },
      section: { type: ["string", "null"] },
      keywords: { type: "array", items: { type: "string" } },
      questions: { type: "array", items: QUESTION_ITEM_SCHEMA },
      difficulty: { type: ["string", "null"] },
      metadata: { type: ["object", "null"] }
    }
  });
})();
