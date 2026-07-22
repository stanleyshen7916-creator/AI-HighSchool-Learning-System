/* js/parser/LearningQuestionGenerator.js — Sprint 6.9 · EO-S6.9-001
   AI Question Generator Foundation — Interface v1.0.

   PMO Rulings applied (EO-S6.9-001 pre-work flags):
     1B — this is a NEW module (AHS.LearningQuestionGenerator); the
          existing js/parser/QuestionGenerator.js (EO-S6-004, LOCK) is
          completely untouched — same naming-collision precedent as
          LearningQuestionRuntime vs QuestionRuntime in EO-S6-004.
     2B — difficulty is ALWAYS supplied explicitly by the caller as an
          Interface parameter and validated against the fixed enum. This
          module never infers difficulty from anything, never defaults
          it, and never reads Summary Runtime (whose LOCK schema has no
          difficulty field).
     3A — Question Schema v1.0 is a SUPERSET: the 13 EO fields PLUS the
          EO-S6-004 LOCK-required fields (grade, section, traceability,
          source, learningObjective, relatedConcepts, metadata), so the
          ten-item completeness principle is never weakened.
     4  — questionType stored values are snake_case, consistent with the
          existing repo convention.

   Scope: pure, stateless Interface only — generate() / validate() /
   normalize(). Never touches any Runtime, any UI, AHS.Mock, or any
   parser-chain module (MaterialParser / KnowledgeBuilder /
   SummaryGenerator / QuestionGenerator / LearningPipeline — none read,
   none modified). No AI model is implemented (explicitly out of scope);
   generate() PACKAGES real, caller-supplied question content into
   Schema v1.0 — it never invents a question, never emits a
   Stub/Mock/Placeholder question of any kind (EO Empty State rule).
   If there is no real question content to package, generate() returns
   null — honestly nothing, never a fake something.

   Question Schema v1.0 (fixed):
     { id, materialId, subject, grade, chapter, section, knowledgePoint,
       difficulty, questionType, question, options:[], answer,
       explanation, reference, learningObjective, relatedConcepts:[],
       source:{}, traceability:{materialId, knowledgeId, summaryId},
       metadata:{}, createdAt }

   Fixed enums (LOCK, no other values accepted):
     questionType: single_choice | multiple_choice | true_false |
                   fill_blank | short_answer
     difficulty:   easy | medium | hard
   PascalCase module under window.AHS, consistent with every existing
   parser-chain module in this repo. */
window.AHS = window.AHS || {};
AHS.LearningQuestionGenerator = (function () {
  "use strict";

  var QUESTION_TYPES = ["single_choice", "multiple_choice", "true_false", "fill_blank", "short_answer"];
  var DIFFICULTIES = ["easy", "medium", "hard"];

  function str(v) { return (typeof v === "string") ? v.trim() : ""; }
  function arr(v) { return Array.isArray(v) ? v.slice() : []; }
  function obj(v) { return (v && typeof v === "object" && !Array.isArray(v)) ? v : {}; }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  var seq = 0;
  function nextId() {
    seq += 1;
    return "lqv1_" + seq;
  }

  /* ---- normalize(draft) ----------------------------------------------
     Type hygiene for every Schema v1.0 field. Pure: never mutates the
     input, never invents content, never fills a "safe" fake value for a
     content field (that's validate()'s job to reject). */
  function normalize(draft) {
    draft = draft || {};
    return {
      id: draft.id || null,
      materialId: draft.materialId || null,
      subject: draft.subject || null,
      grade: draft.grade || null,
      chapter: str(draft.chapter),
      section: str(draft.section),
      knowledgePoint: str(draft.knowledgePoint),
      difficulty: str(draft.difficulty).toLowerCase(),
      questionType: str(draft.questionType).toLowerCase(),
      question: str(draft.question),
      options: arr(draft.options).map(function (o) { return String(o); }),
      answer: (draft.answer === undefined) ? null : draft.answer,
      explanation: str(draft.explanation),
      reference: str(draft.reference),
      learningObjective: str(draft.learningObjective),
      relatedConcepts: arr(draft.relatedConcepts).map(function (c) { return String(c); }),
      source: obj(draft.source),
      traceability: obj(draft.traceability),
      metadata: obj(draft.metadata),
      createdAt: draft.createdAt || null
    };
  }

  /* ---- validate(record) ----------------------------------------------
     Schema Validation v1.0 — deterministic, non-AI. Returns
     { valid, errors }, never throws. Enforces the EO's rules:
       - Required fields present
       - questionType within the five fixed types (不得新增其他格式)
       - difficulty within the three fixed levels (caller-supplied, 2B)
       - answer 不得為空
       - explanation 不得為空
       - knowledgePoint 不得為空
       - choice-type questions must carry real options
       - traceability (materialId + knowledgeId) — LOCK-parity, per 3A
     A record that fails here must never enter any Runtime. */
  function validate(record) {
    var errors = [];
    record = record || {};

    var required = ["id", "materialId", "subject", "createdAt"];
    required.forEach(function (k) {
      if (!record[k]) { errors.push("缺少必要欄位：" + k); }
    });

    if (!str(record.question)) { errors.push("缺少必要欄位：question（題目不得為空）"); }

    if (QUESTION_TYPES.indexOf(str(record.questionType).toLowerCase()) === -1) {
      errors.push("questionType 不合法（僅允許：" + QUESTION_TYPES.join(" / ") + "）");
    }

    if (DIFFICULTIES.indexOf(str(record.difficulty).toLowerCase()) === -1) {
      errors.push("difficulty 不合法（僅允許：" + DIFFICULTIES.join(" / ") + "；由呼叫端明確傳入，不得推論）");
    }

    if (record.answer === undefined || record.answer === null || str(String(record.answer)) === "") {
      errors.push("answer 不得為空");
    }
    if (!str(record.explanation)) { errors.push("explanation 不得為空"); }
    if (!str(record.knowledgePoint)) { errors.push("knowledgePoint 不得為空"); }

    var type = str(record.questionType).toLowerCase();
    if ((type === "single_choice" || type === "multiple_choice") &&
        (!Array.isArray(record.options) || record.options.length < 2)) {
      errors.push("選擇題必須包含至少 2 個 options");
    }

    var trace = record.traceability;
    if (!trace || typeof trace !== "object" || !trace.materialId || !trace.knowledgeId) {
      errors.push("缺少：traceability（需可追溯 materialId 與 knowledgeId，Schema v1.0 超集欄位）");
    }

    return { valid: errors.length === 0, errors: errors };
  }

  /* ---- generate(input) -------------------------------------------------
     Interface v1.0 entry point. PACKAGES caller-supplied REAL content
     into Schema v1.0 — no AI model, no invention, no stub. Returns the
     normalized candidate (storage decision belongs to the Session
     Runtime's validate-gated add()), or null when input carries no real
     question text at all — nothing real to package.

     Per Ruling 2B, input.difficulty is mandatory caller data; it is
     passed through verbatim (lowercased) and judged only by validate().
     traceability/source are taken from the caller's real references —
     never fabricated here. */
  function generate(input) {
    input = input || {};
    if (!str(input.question)) { return null; }

    var draft = {
      id: input.id || nextId(),
      materialId: input.materialId || null,
      subject: input.subject || null,
      grade: input.grade || null,
      chapter: input.chapter,
      section: input.section,
      knowledgePoint: input.knowledgePoint,
      difficulty: input.difficulty,
      questionType: input.questionType,
      question: input.question,
      options: input.options,
      answer: input.answer,
      explanation: input.explanation,
      reference: input.reference,
      learningObjective: input.learningObjective,
      relatedConcepts: input.relatedConcepts,
      source: input.source,
      traceability: {
        materialId: (input.traceability && input.traceability.materialId) || input.materialId || null,
        knowledgeId: (input.traceability && input.traceability.knowledgeId) || input.knowledgeId || null,
        summaryId: (input.traceability && input.traceability.summaryId) || input.summaryId || null
      },
      metadata: obj(input.metadata),
      createdAt: input.createdAt || formatDate(new Date())
    };

    return normalize(draft);
  }

  return {
    generate: generate,
    validate: validate,
    normalize: normalize,
    QUESTION_TYPES: QUESTION_TYPES.slice(),
    DIFFICULTIES: DIFFICULTIES.slice()
  };
})();
