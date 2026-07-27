/* js/runtime/QuestionProviderBridge.js — Sprint AI-015C
   Question Provider Bridge — Shape Mapping only.

   Purpose: connect the two existing, unmodified pieces the Sprint
   AI-015C Baseline named — AHS.QuestionGenerationRuntime (Sprint 8.2,
   real Knowledge Graph-derived questions, materials.html only) and
   AHS.LearningQuestionSession / AHS.LearningQuestionRuntime (Sprint 6.9
   / Sprint 6, both already wired to quiz.html's Practice Mode reads).
   There was no Bridge between them; this file is only that Bridge.

   Architecture Rule (LOCK, per Sprint AI-015C spec): this module may
   ONLY perform Data Shape conversion. It generates no question content
   of its own (never calls QuestionGenerationRuntime.generateQuestions()
   — only ever reads an already-generated record via
   getQuestionsByMaterial()), contains no AI logic, and contains no
   Session/store logic of its own (every write goes through the
   target Runtime/Session's own existing, unmodified Public API:
   AHS.LearningQuestionGenerator.generate() + AHS.LearningQuestionSession.add()
   for one target, AHS.LearningQuestionRuntime.sync() for the other).
   Never writes to Quiz, WrongBook, Review, Summary, AI Engine, Exam
   Runtime or QuestionBank directly — those continue to read the two
   target stores on their own, exactly as before this file existed.

   Field mapping is fully documented in
   docs/Architecture/QuestionProviderBridgeMapping.md (Sprint AI-015C
   Part A) — this file is the direct implementation of that table, no
   field here is invented independently of it.

   Read-only lookups this Bridge performs (none mutate their source):
     - AHS.QuestionGenerationRuntime.getQuestionsByMaterial(materialId)
     - AHS.MaterialRuntime.getById(materialId)   — subject/grade/chapter
       (materials carry no `section` field; section is honestly "").
     - AHS.KnowledgeGraphRuntime.getNode(knowledgeNodeId) — real node
       text (content || label), never invented, used as the concept/
       knowledgePoint anchor for both targets.

   Target A — LearningQuestionSession: builds a Schema v1.0 input via
   AHS.LearningQuestionGenerator.generate(), then AHS.LearningQuestionSession.add()
   (which itself validate-gates through the same Generator — this
   Bridge never bypasses that gate).

   Target B — LearningQuestionRuntime: calls AHS.LearningQuestionRuntime.sync()
   with mode: "original" (Mode A of the pre-existing AHS.QuestionGenerator,
   js/parser/QuestionGenerator.js) — never mode: "ai", because
   QuestionGenerationRuntime's content is real, not Stub; using Mode B
   here would incorrectly relabel real content through the Stub path.

   Script Wiring note (Sprint AI-015C Part A finding): materials.html —
   the only page that loads QuestionGenerationRuntime — did not
   previously load js/parser/LearningQuestionGenerator.js or
   js/runtime/LearningQuestionSession.js, so Target A was unreachable
   from where this Bridge runs. Those two <script> tags were added to
   materials.html alongside this file (authorized fix, same shape as
   EO-AI-012A's Script Wiring in the AI Summary track). Target B needed
   no wiring change — QuestionGenerator.js was already loaded there. */
window.AHS = window.AHS || {};
AHS.QuestionProviderBridge = (function () {
  "use strict";

  function str(v) { return (typeof v === "string") ? v : ""; }

  function materialContext(materialId) {
    var material = (AHS.MaterialRuntime && typeof AHS.MaterialRuntime.getById === "function")
      ? AHS.MaterialRuntime.getById(materialId) : null;
    return {
      subject: material ? (material.subject || null) : null,
      grade: material ? (material.grade || null) : null,
      chapter: material ? str(material.chapter) : "",
      /* Material records carry no `section` field (confirmed by reading
         MaterialRuntime.add()) — honestly empty, never guessed. */
      section: ""
    };
  }

  function nodeText(knowledgeNodeId) {
    var node = (AHS.KnowledgeGraphRuntime && typeof AHS.KnowledgeGraphRuntime.getNode === "function")
      ? AHS.KnowledgeGraphRuntime.getNode(knowledgeNodeId) : null;
    return node ? str(node.content || node.label) : "";
  }

  function referenceFor(knowledgeNodeId) {
    return "Knowledge Graph node " + knowledgeNodeId;
  }

  /* ---- buildSessionInput(question, materialId, ctx, text) ---------------
     Shape-maps one QuestionGenerationRuntime question into Schema v1.0
     input for AHS.LearningQuestionGenerator.generate(). */
  function buildSessionInput(q, materialId, ctx, text) {
    return {
      materialId: materialId,
      subject: ctx.subject,
      grade: ctx.grade,
      chapter: ctx.chapter,
      section: ctx.section,
      knowledgePoint: text,
      difficulty: q.difficulty,
      questionType: q.type,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      reference: referenceFor(q.knowledgeNodeId),
      learningObjective: text ? ("能理解並應用「" + text + "」的相關內容") : "",
      relatedConcepts: [],
      source: { type: "knowledge_graph", knowledgeNodeId: q.knowledgeNodeId },
      traceability: { materialId: materialId, knowledgeId: q.knowledgeNodeId, summaryId: null },
      metadata: { sourceQuestionId: q.id }
    };
  }

  /* ---- buildRuntimeInput(question, materialId, ctx, text) ----------------
     Shape-maps one QuestionGenerationRuntime question into Mode A input
     for AHS.LearningQuestionRuntime.sync() -> AHS.QuestionGenerator.generate(). */
  function buildRuntimeInput(q, materialId, ctx, text) {
    return {
      mode: "original",
      questionType: q.type,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: { whyCorrect: q.explanation },
      chapter: ctx.chapter,
      section: ctx.section,
      materials: [materialId],
      reference: referenceFor(q.knowledgeNodeId),
      knowledge: {
        id: q.knowledgeNodeId,
        materialId: materialId,
        subject: ctx.subject,
        grade: ctx.grade,
        chapter: ctx.chapter,
        section: ctx.section,
        concepts: text ? [text] : []
      }
    };
  }

  /* ---- bridge(materialId) -------------------------------------------
     Reads the already-generated QuestionGenerationRuntime record for
     materialId (never generates one) and writes each question into both
     targets via their own existing, unmodified write APIs. Returns an
     honest per-question outcome — no question is assumed written unless
     its target's own validate-gate accepted it. Returns null when there
     is nothing real to bridge (no generated record for materialId). */
  function bridge(materialId) {
    if (!materialId) { return null; }
    if (!AHS.QuestionGenerationRuntime || typeof AHS.QuestionGenerationRuntime.getQuestionsByMaterial !== "function") {
      return null;
    }
    var record = AHS.QuestionGenerationRuntime.getQuestionsByMaterial(materialId);
    if (!record || !record.questions || !record.questions.length) { return null; }

    var ctx = materialContext(materialId);
    var results = [];
    var sessionAdded = 0;
    var runtimeAdded = 0;

    record.questions.forEach(function (q) {
      var text = nodeText(q.knowledgeNodeId);
      var outcome = { sourceQuestionId: q.id, session: null, runtime: null };

      if (AHS.LearningQuestionGenerator && typeof AHS.LearningQuestionGenerator.generate === "function" &&
          AHS.LearningQuestionSession && typeof AHS.LearningQuestionSession.add === "function") {
        var sessionInput = buildSessionInput(q, materialId, ctx, text);
        var sessionRecord = AHS.LearningQuestionGenerator.generate(sessionInput);
        var storedSession = sessionRecord ? AHS.LearningQuestionSession.add(sessionRecord) : null;
        outcome.session = storedSession;
        if (storedSession) { sessionAdded += 1; }
      }

      if (AHS.LearningQuestionRuntime && typeof AHS.LearningQuestionRuntime.sync === "function") {
        var runtimeInput = buildRuntimeInput(q, materialId, ctx, text);
        var storedRuntime = AHS.LearningQuestionRuntime.sync(runtimeInput);
        outcome.runtime = storedRuntime;
        if (storedRuntime) { runtimeAdded += 1; }
      }

      results.push(outcome);
    });

    return {
      materialId: materialId,
      total: record.questions.length,
      sessionAdded: sessionAdded,
      runtimeAdded: runtimeAdded,
      results: results
    };
  }

  return {
    bridge: bridge,
    buildSessionInput: buildSessionInput,
    buildRuntimeInput: buildRuntimeInput
  };
})();
