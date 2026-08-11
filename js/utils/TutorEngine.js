/* js/utils/TutorEngine.js — AI Tutor Rule-Based Q&A Engine (Phase 1).

   No LLM/AI API — same "完全不需 LLM API" discipline as
   js/utils/TutorMessage.js (the existing Rule-Based Tutor precedent this
   file follows). TutorMessage.js proactively SUGGESTS what to do next
   from real Analytics; this file ANSWERS a student's question, but only
   when it can ground the answer in a specific, already-real record this
   platform already has — it never attempts to solve/reason about a
   brand-new question it has no data for (that would require real NLP/
   LLM reasoning this Sprint deliberately does not have). Honest capability
   boundary: reply() returns null whenever it has nothing real to say,
   letting the caller fall back to its own existing behavior.

   Grounding source: AHS.WrongBookRuntime — the one Runtime where a
   specific question already carries real, persisted explanation/
   knowledgePoint fields (js/runtime/WrongBookRuntime.js's own real
   sync() output, never fabricated here). Reached via pageContext.
   questionId, which is that record's own local id (AHS.PlatformContext's
   existing, previously-unused questionId field — see
   js/components/WrongBook.js's new "問 AI 巧巧老師" link, the first real
   caller to set it). */
window.AHS = window.AHS || {};
AHS.TutorEngine = (function () {
  "use strict";

  var STEPS_KEYWORDS = ["解題", "詳解", "怎麼解", "怎麼算", "如何解", "步驟"];
  var CONCEPT_KEYWORDS = ["概念", "解釋", "是什麼", "為什麼", "意思"];

  var HONEST_FALLBACK = "目前我只能針對你正在查看的題目，提供這一題已有的詳解或知識點說明。這個問題我還沒有相關資料，建議直接查看題目的「詳解」欄位，或返回教材摘要複習。";

  function matchesAny(text, keywords) {
    return keywords.some(function (k) { return text.indexOf(k) !== -1; });
  }

  /* resolveQuestion(pageContext) — the one real, grounded data source:
     a WrongBookRuntime record reached by its own local id. Returns null
     when there is no real questionId in context, or it doesn't resolve
     to a real record (never fabricates a stand-in). */
  function resolveQuestion(pageContext) {
    if (!pageContext || !pageContext.questionId) { return null; }
    if (!AHS.WrongBookRuntime || typeof AHS.WrongBookRuntime.getById !== "function") { return null; }
    return AHS.WrongBookRuntime.getById(pageContext.questionId);
  }

  /* explainSteps(question) — the question's own real, already-persisted
     explanation field, formatted as a solution readout. Never invents
     steps that aren't in the real record. */
  function explainSteps(question) {
    if (!question || !question.explanation) { return null; }
    return "「" + question.question + "」的詳解：\n" + question.explanation;
  }

  /* explainConcept(question) — the question's own real knowledgePoint,
     enriched with this specific knowledge point's real, current Mastery%
     when AHS.KnowledgeMasteryRuntime already tracks it (same real signal
     js/utils/TutorMessage.js's own weakestKnowledgePoint sentence uses —
     no second definition of Mastery). Never a generic textbook-style
     definition this platform has no real source for. */
  function explainConcept(question) {
    if (!question || !question.knowledgePoint) { return null; }
    var lines = ["這一題屬於「" + question.knowledgePoint + "」這個知識點。"];
    if (AHS.KnowledgeMasteryRuntime && typeof AHS.KnowledgeMasteryRuntime.list === "function") {
      var match = AHS.KnowledgeMasteryRuntime.list().filter(function (p) {
        return p.knowledgePoint === question.knowledgePoint;
      })[0];
      if (match && typeof match.mastery === "number") {
        lines.push("目前這個知識點的 Mastery 是 " + match.mastery + "%。");
      }
    }
    lines.push("建議搭配「詳解」一起複習，或回到教材摘要重新閱讀「" + question.knowledgePoint + "」相關的段落。");
    return lines.join("");
  }

  /* reply(text, pageContext) -> string | null.
     null means "this engine has nothing real to say about this input" —
     the caller (AiTutor.js) keeps its own existing fallback behavior for
     every intent this Phase doesn't cover, unchanged. Only the two
     Phase-1 intents (解題步驟詳解／概念解釋) are handled here; anything
     else — including the other quick-suggestion tiles — is intentionally
     left alone. */
  function reply(text, pageContext) {
    if (!text) { return null; }
    var isSteps = matchesAny(text, STEPS_KEYWORDS);
    var isConcept = !isSteps && matchesAny(text, CONCEPT_KEYWORDS);
    if (!isSteps && !isConcept) { return null; }

    var question = resolveQuestion(pageContext);
    var answer = isSteps ? explainSteps(question) : explainConcept(question);
    return answer || HONEST_FALLBACK;
  }

  return { reply: reply, resolveQuestion: resolveQuestion };
})();
