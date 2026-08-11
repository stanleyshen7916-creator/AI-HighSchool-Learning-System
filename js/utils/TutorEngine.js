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
   caller to set it).

   Off-topic menu: when a student's input isn't one of the two Phase-1
   intents (or a real question isn't known yet), reply() never hands
   back a dead-end sentence — it returns a real, always-answerable menu
   instead: the two Phase-1 intents when a question is already known
   (guaranteed to have a real answer — resolveQuestion() already
   succeeded), or a real navigation action into 知識弱點 when it isn't
   (the one place a real question can be picked from). Never a menu item
   that leads to another dead end. This is also why js/data/AppConfig.js's
   aiTutorPage.suggestions only lists these same two intents now — every
   other quick-suggestion tile used to be a fixed canned-reply stub with
   no real answer behind it and has been removed, not hidden. */
window.AHS = window.AHS || {};
AHS.TutorEngine = (function () {
  "use strict";

  var STEPS_KEYWORDS = ["解題", "詳解", "怎麼解", "怎麼算", "如何解", "步驟"];
  var CONCEPT_KEYWORDS = ["概念", "解釋", "是什麼", "為什麼", "意思"];
  var STEPS_LABEL = "解題步驟詳解";
  var CONCEPT_LABEL = "概念解釋";

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

  /* offTopicMenu(question) — the real, always-answerable menu shown
     whenever this engine has nothing direct to say. Every item leads to
     a guaranteed real answer: the two Phase-1 intents when `question`
     already resolved (resolveQuestion() succeeded, so explainSteps()/
     explainConcept() are real for this exact record), or a real link to
     知識弱點 — the one place a student can pick a question this engine
     can then answer for — when it didn't. */
  function offTopicMenu(question) {
    if (question) {
      return {
        message: "這個問題我目前還沒辦法直接回答，不過針對你正在看的這一題，我可以提供：",
        actions: [{ label: STEPS_LABEL }, { label: CONCEPT_LABEL }]
      };
    }
    return {
      message: "目前我還沒有你正在問的這方面資料。你可以先到「知識弱點」挑一題，我就能針對那一題提供真實的詳解或知識點說明。",
      actions: [{ label: "前往知識弱點", href: "wrongbook.html" }]
    };
  }

  /* reply(text, pageContext) -> string | { message, actions }.
     null only when text is falsy — every non-empty input always gets
     either a real, grounded answer (string) or the real answerable menu
     above (object), never a dead-end sentence with nothing the student
     can do next. */
  function reply(text, pageContext) {
    if (!text) { return null; }

    var question = resolveQuestion(pageContext);
    var isSteps = matchesAny(text, STEPS_KEYWORDS);
    var isConcept = !isSteps && matchesAny(text, CONCEPT_KEYWORDS);

    if (isSteps) {
      var steps = explainSteps(question);
      if (steps) { return steps; }
    } else if (isConcept) {
      var concept = explainConcept(question);
      if (concept) { return concept; }
    }

    return offTopicMenu(question);
  }

  return { reply: reply, resolveQuestion: resolveQuestion };
})();
