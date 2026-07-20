/* js/services/QuestionGenerator.js — Sprint 6 · EO-S6-004 Learning
   Question Generator Foundation.

   Scope: pure, stateless transformation only. Never touches
   AHS.LearningQuestionRuntime (see file-naming flag below), AHS.Mock,
   any UI, or any upstream Sprint 6 module (MaterialParser/
   KnowledgeBuilder/SummaryGenerator, and their Runtimes) — none are
   read from or modified. Never calls an AI API (none exists in this
   repo; Product Baseline forbids it regardless). Reads Knowledge
   Runtime records only — never parses PDF/DOCX/PPTX/Image/Audio or a
   Material Document directly (that's Material Parser's job only).

   Naming flag: EO-S6-004 asks for js/runtime/QuestionRuntime.js, but
   that file already exists (Sprint 4 — quiz.html loads it, QuizCenter.js
   calls AHS.QuestionRuntime.getSet(session.examId) for real exam-taking).
   It has a different purpose and schema entirely (exam question sets
   keyed by examId). Overwriting it would silently break Quiz Center — a
   Do NOT Modify page. Per "Repository wins," this EO's new Runtime is
   named AHS.LearningQuestionRuntime in js/runtime/LearningQuestionRuntime.js
   instead — which also matches this EO's own repeated terminology
   ("Learning Question Engine" / "Learning Question", never plain
   "Question"). js/services/QuestionGenerator.js / AHS.QuestionGenerator
   (this file) has no existing collision and is unchanged from the EO's
   naming. Flagged for PMO in REPORT.md.

   Two Learning Modes:
     Mode A — generateOriginalQuestion(input): caller supplies REAL
       question/answer/source content (from 教材/講義/考卷/歷屆試題/
       作業) — this function packages and enriches it into the schema
       (traceability, knowledge point, learning objective, structured
       explanation), it never invents the question itself. Returns null
       if input.question is missing (nothing real to preserve).
     Mode B — generateAIQuestion(knowledge): reads ONLY a Knowledge
       Runtime record (never external materials, never a Material
       Document). Since no AI exists in this environment, the question/
       answer text itself is an honestly-labeled Stub — but every
       identity/traceability field is real, taken from the Knowledge
       record, never fabricated. Returns null if knowledge has no usable
       identity at all (no id, no materialId, no subject) — there's
       nothing real to anchor a question to.

   Completeness gate: this module's validate() implements the 10-item
   checklist from EO-S6-004 ("每一題必須包含...缺少任何一項：不得加入
   Question Runtime"). Generation itself never throws and may produce an
   incomplete candidate (e.g. an AI question anchored to a knowledge
   record with no real materialId) — enforcement of "must not be added"
   happens at AHS.LearningQuestionRuntime.add() time, which calls this
   same validate(), keeping "build a candidate" and "decide whether to
   store it" cleanly separated (same pattern as every other Sprint 6
   module).
   PascalCase module under window.AHS, consistent with every existing
   Runtime/component/service in this repo. */
window.AHS = window.AHS || {};
AHS.QuestionGenerator = (function () {
  "use strict";

  function arr(v) { return Array.isArray(v) ? v.slice() : []; }
  function str(v) { return (typeof v === "string") ? v.trim() : ""; }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  var seq = 0;
  function nextId() {
    seq += 1;
    return "lq_" + seq;
  }

  /* ---- generateFromKnowledge(knowledge) ----------------------------------
     Shared scaffold used by both Modes when a Knowledge Runtime record is
     available: real identity fields passed through as-is, `concept`/
     `conceptId` chosen from the best available real signal (never
     fabricated — falls back through concepts -> chapter -> section ->
     subject -> null). */
  function generateFromKnowledge(knowledge) {
    knowledge = knowledge || {};
    var concepts = arr(knowledge.concepts);
    var concept = concepts.length ? str(concepts[0]) : (str(knowledge.chapter) || str(knowledge.section) || str(knowledge.subject) || "");
    var conceptId = (concept && knowledge.id) ? (knowledge.id + "_c1") : null;

    return {
      materialId: knowledge.materialId || null,
      knowledgeId: knowledge.id || null,
      subject: knowledge.subject || null,
      grade: knowledge.grade || null,
      chapter: str(knowledge.chapter),
      section: str(knowledge.section),
      concept: concept,
      conceptId: conceptId
    };
  }

  /* ---- buildKnowledgePoint / buildLearningObjective ----------------------
     Real (non-AI) templated derivation from whatever real anchor exists;
     honestly empty if there's nothing to anchor to. */
  function buildKnowledgePoint(scaffold) {
    scaffold = scaffold || {};
    var anchor = scaffold.concept || scaffold.chapter || scaffold.section;
    if (!anchor) { return ""; }
    return (scaffold.subject ? (scaffold.subject + " - ") : "") + anchor;
  }

  function buildLearningObjective(scaffold) {
    scaffold = scaffold || {};
    var anchor = scaffold.concept || scaffold.chapter || scaffold.section;
    if (!anchor) { return ""; }
    return "能理解並應用「" + anchor + "」的相關內容";
  }

  /* ---- buildRelatedConcepts(knowledge) ------------------------------------
     Honest passthrough of Knowledge Runtime's own keywords/concepts,
     minus whatever was already chosen as the primary concept. Never
     invents related concepts. */
  function buildRelatedConcepts(knowledge, primaryConcept) {
    knowledge = knowledge || {};
    var pool = arr(knowledge.keywords).concat(arr(knowledge.concepts));
    return pool.filter(function (c) { return str(c) && str(c) !== str(primaryConcept); });
  }

  /* ---- buildSource(mode, input, knowledge) --------------------------------
     Mode A (original): preserves caller-supplied materials/chapter/
     section/page/reference verbatim.
     Mode B (ai): source.type fixed to "ai_generated", materials always
     [] (must never cite external materials per Source Rules), reference
     records which Knowledge Runtime record it came from. */
  function buildSource(mode, input, knowledge) {
    input = input || {};
    knowledge = knowledge || {};
    if (mode === "ai") {
      return {
        type: "ai_generated",
        materials: [],
        chapter: str(knowledge.chapter),
        section: str(knowledge.section),
        page: null,
        reference: knowledge.id ? ("Knowledge Runtime: " + knowledge.id) : ""
      };
    }
    return {
      type: "original",
      materials: arr(input.materials),
      chapter: str(input.chapter),
      section: str(input.section),
      page: (typeof input.page === "number") ? input.page : null,
      reference: str(input.reference)
    };
  }

  /* ---- buildExplanation(input) --------------------------------------------
     Explanation Rules: never just the answer — always structured with
     five dimensions. Mode A uses whatever real explanation content the
     caller supplied (steps/whyCorrect/etc., if given); anything not
     supplied falls back to an honestly-labeled Stub per dimension,
     matching this EO's explicit "目前可採 Stub" allowance. whyOthersWrong
     only applies to multiple-choice questions. */
  function buildExplanation(input) {
    input = input || {};
    var supplied = (input && typeof input.explanation === "object" && input.explanation) ? input.explanation : {};
    var isMultipleChoice = arr(input.options).length > 0 || input.questionType === "multiple_choice";

    return {
      steps: arr(supplied.steps).length ? arr(supplied.steps) : ["[Stub] 解題步驟尚未產生"],
      whyCorrect: str(supplied.whyCorrect) || "[Stub] 正確原因尚未產生",
      whyOthersWrong: isMultipleChoice
        ? (arr(supplied.whyOthersWrong).length ? arr(supplied.whyOthersWrong) : ["[Stub] 其他選項錯誤原因尚未產生"])
        : [],
      commonMistakes: arr(supplied.commonMistakes).length ? arr(supplied.commonMistakes) : ["[Stub] 常見錯誤尚未產生"],
      tips: arr(supplied.tips).length ? arr(supplied.tips) : ["[Stub] 解題技巧尚未產生"]
    };
  }

  /* ---- normalize(draft) ---------------------------------------------------
     Real (non-stub) data hygiene: guarantees every Learning Question
     field is the right *type*; never mutates the input, never invents
     content. Pure. */
  function normalize(draft) {
    draft = draft || {};
    function obj(v) { return (v && typeof v === "object" && !Array.isArray(v)) ? v : {}; }

    return {
      id: draft.id || null,
      materialId: draft.materialId || null,
      subject: draft.subject || null,
      grade: draft.grade || null,
      chapter: str(draft.chapter),
      section: str(draft.section),
      conceptId: draft.conceptId || null,
      concept: str(draft.concept),
      questionType: str(draft.questionType),
      difficulty: str(draft.difficulty),
      question: str(draft.question),
      options: arr(draft.options),
      answer: (draft.answer === undefined) ? null : draft.answer,
      explanation: obj(draft.explanation),
      knowledgePoint: str(draft.knowledgePoint),
      learningObjective: str(draft.learningObjective),
      relatedConcepts: arr(draft.relatedConcepts),
      source: obj(draft.source),
      traceability: obj(draft.traceability),
      metadata: obj(draft.metadata),
      createdAt: draft.createdAt || null
    };
  }

  /* ---- validate(record) ----------------------------------------------
     Real (non-stub), deterministic, non-AI completeness gate — the
     10-item checklist from EO-S6-004. Returns { valid, errors }, never
     throws. This is the SAME function AHS.LearningQuestionRuntime.add()
     calls before storing anything. */
  function validate(record) {
    var errors = [];
    record = record || {};

    if (!str(record.question)) { errors.push("缺少：題目"); }
    if (!str(record.questionType)) { errors.push("缺少：題型"); }
    if (!str(record.difficulty)) { errors.push("缺少：難度"); }
    if (record.answer === undefined || record.answer === null || record.answer === "") {
      errors.push("缺少：標準答案");
    }

    var exp = record.explanation;
    var hasExplanationContent = exp && typeof exp === "object" &&
      ((Array.isArray(exp.steps) && exp.steps.length) || str(exp.whyCorrect));
    if (!hasExplanationContent) { errors.push("缺少：完整詳解（不得只有答案）"); }

    if (!str(record.knowledgePoint)) { errors.push("缺少：考點"); }
    if (!str(record.learningObjective)) { errors.push("缺少：學習目標"); }

    if (!record.source || typeof record.source !== "object" || !str(record.source.type)) {
      errors.push("缺少：出處");
    }

    if (!Array.isArray(record.relatedConcepts)) { errors.push("缺少：延伸概念"); }

    var trace = record.traceability;
    var hasTraceability = trace && typeof trace === "object" && trace.materialId && trace.knowledgeId;
    if (!hasTraceability) { errors.push("缺少：Traceability（需可追溯 materialId 與 knowledgeId）"); }

    return { valid: errors.length === 0, errors: errors };
  }

  /* ---- generateOriginalQuestion(input) ------------------------------------
     Mode A. Returns null if there's no real question to preserve. */
  function generateOriginalQuestion(input) {
    input = input || {};
    if (!str(input.question)) { return null; }

    var scaffold = input.knowledge ? generateFromKnowledge(input.knowledge) : {
      materialId: input.materialId || null, knowledgeId: null,
      subject: input.subject || null, grade: input.grade || null,
      chapter: str(input.chapter), section: str(input.section),
      concept: str(input.concept) || "", conceptId: null
    };

    var draft = {
      id: nextId(),
      materialId: scaffold.materialId,
      subject: scaffold.subject,
      grade: scaffold.grade,
      chapter: scaffold.chapter,
      section: scaffold.section,
      conceptId: scaffold.conceptId,
      concept: scaffold.concept,
      questionType: input.questionType || "",
      difficulty: input.difficulty || "",
      question: input.question,
      options: arr(input.options),
      answer: input.answer,
      explanation: buildExplanation(input),
      knowledgePoint: buildKnowledgePoint(scaffold),
      learningObjective: buildLearningObjective(scaffold),
      relatedConcepts: input.knowledge ? buildRelatedConcepts(input.knowledge, scaffold.concept) : arr(input.relatedConcepts),
      source: buildSource("original", input, null),
      traceability: {
        materialId: scaffold.materialId,
        knowledgeId: scaffold.knowledgeId,
        summaryId: input.summaryId || null
      },
      metadata: { mode: "original" },
      createdAt: formatDate(new Date())
    };

    return normalize(draft);
  }

  /* ---- generateAIQuestion(knowledge) ---------------------------------------
     Mode B. Only reads a Knowledge Runtime record — never external
     materials. Returns null if knowledge has no usable identity at all. */
  function generateAIQuestion(knowledge) {
    if (!knowledge || (!knowledge.id && !knowledge.materialId && !knowledge.subject)) {
      return null;
    }
    var scaffold = generateFromKnowledge(knowledge);

    var draft = {
      id: nextId(),
      materialId: scaffold.materialId,
      subject: scaffold.subject,
      grade: scaffold.grade,
      chapter: scaffold.chapter,
      section: scaffold.section,
      conceptId: scaffold.conceptId,
      concept: scaffold.concept,
      questionType: "short_answer",
      difficulty: "medium",
      question: scaffold.concept
        ? ("[Stub] 依據「" + scaffold.concept + "」尚未產生 AI 題目")
        : "[Stub] AI 題目尚未產生",
      options: [],
      answer: "[Stub] 尚未產生標準答案",
      explanation: buildExplanation({ questionType: "short_answer" }),
      knowledgePoint: buildKnowledgePoint(scaffold),
      learningObjective: buildLearningObjective(scaffold),
      relatedConcepts: buildRelatedConcepts(knowledge, scaffold.concept),
      source: buildSource("ai", null, knowledge),
      traceability: {
        materialId: scaffold.materialId,
        knowledgeId: scaffold.knowledgeId,
        summaryId: null
      },
      metadata: { mode: "ai_generated" },
      createdAt: formatDate(new Date())
    };

    return normalize(draft);
  }

  /* ---- generate(input) -----------------------------------------------
     Top-level dispatcher. input.mode: "original" | "ai". Falls back to
     inferring from shape if mode isn't given. Never throws. */
  function generate(input) {
    input = input || {};
    if (input.mode === "ai") { return generateAIQuestion(input.knowledge); }
    if (input.mode === "original") { return generateOriginalQuestion(input); }
    if (str(input.question)) { return generateOriginalQuestion(input); }
    if (input.knowledge) { return generateAIQuestion(input.knowledge); }
    return null;
  }

  return {
    generate: generate,
    generateFromKnowledge: generateFromKnowledge,
    generateOriginalQuestion: generateOriginalQuestion,
    generateAIQuestion: generateAIQuestion,
    buildExplanation: buildExplanation,
    buildKnowledgePoint: buildKnowledgePoint,
    buildLearningObjective: buildLearningObjective,
    buildSource: buildSource,
    buildRelatedConcepts: buildRelatedConcepts,
    normalize: normalize,
    validate: validate
  };
})();
