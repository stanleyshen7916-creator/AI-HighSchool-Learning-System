/* ai-engine/src/common/Constants.js — EO-MIG-002 · AI Engine Foundation
   Reserved identifiers for the seven AI Engine service slots (empty
   until their own EOs implement them) and the provider registry key
   space. No values here connect to any LLM. */
window.AHS = window.AHS || {};
AHS.AIEngine = AHS.AIEngine || {};

AHS.AIEngine.SERVICE_IDS = Object.freeze({
  SUMMARY: "summary",
  QUESTION: "question",
  REVIEW: "review",
  EXPLANATION: "explanation",
  TUTOR: "tutor",
  KNOWLEDGE: "knowledge",
  PROMPT: "prompt"
});

AHS.AIEngine.PROVIDER_IDS = Object.freeze({});
