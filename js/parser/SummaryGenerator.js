/* js/services/SummaryGenerator.js — Sprint 6 · EO-S6-003 Summary
   Generator Foundation.

   Scope: pure, stateless transformation only — Knowledge Runtime record
   -> summary structure. Never touches AHS.SummaryRuntime, AHS.Mock, any
   UI, js/services/MaterialParser.js, js/services/KnowledgeBuilder.js, or
   js/runtime/MaterialRuntime.js / js/runtime/KnowledgeRuntime.js
   (neither read from nor modified — confirmed by diff). Never calls an
   AI API (none exists in this repo). Never produces a Question — that's
   explicitly out of scope (EO-S6-004+).

   Input is a Knowledge Runtime record ONLY (the fixed schema from
   EO-S6-002: {id, materialId, subject, grade, chapter, section, title,
   concepts[], keywords[], definitions[], formulas[], examples[],
   exercises[], metadata{}, createdAt}) — this module never reads a
   Material Document or raw PDF/DOCX/PPTX/Image/Audio directly.

   Fixed five-section output (per EO-S6-003 Summary Rules, never
   changed): 核心概念 (coreConcepts) / 重要定義 (definitions) / 易錯重點
   (pitfalls) / 必背內容 (memorize) / 複習建議 (reviewSuggestions).

   Honesty note: today every Knowledge Runtime record's array fields are
   empty (KnowledgeBuilder.js's extractors are honest stubs — see
   EO-S6-002), so most sections below will legitimately be empty right
   now. Rather than fabricate content, each generateX() only derives from
   fields that are actually present on the Knowledge record, using plain
   rule-based mapping (never AI, never invention):
     - generateCoreConcepts  <- knowledge.concepts (passthrough)
     - generateDefinitions   <- knowledge.definitions (passthrough)
     - generateMemorize      <- knowledge.formulas + knowledge.definitions
                                 (things a student would typically memorize)
     - generatePitfalls      <- no non-AI signal exists anywhere in the
                                 Knowledge Runtime schema for "common
                                 mistakes" — always [] (true stub)
     - generateReviewSuggestions <- one deterministic templated string
                                 referencing chapter/section IF they're
                                 non-empty, else [] (no fabricated advice
                                 about a chapter that doesn't exist yet)
   This mirrors the project's established "fixed 0 / 尚無資料 rather than
   fabricate" convention. Once Knowledge Runtime records carry real
   extracted structure (once MaterialParser.js parses real content in a
   future EO), these same functions surface real content without any
   contract change.
   PascalCase module under window.AHS, consistent with every existing
   Runtime/component/service in this repo. */
window.AHS = window.AHS || {};
AHS.SummaryGenerator = (function () {
  "use strict";

  function arr(v) { return Array.isArray(v) ? v.slice() : []; }
  function str(v) { return (typeof v === "string") ? v : ""; }

  /* ---- generate*() — each takes a Knowledge Runtime record. ---- */

  function generateCoreConcepts(knowledge) {
    knowledge = knowledge || {};
    return arr(knowledge.concepts);
  }

  function generateDefinitions(knowledge) {
    knowledge = knowledge || {};
    return arr(knowledge.definitions);
  }

  /* No non-AI signal for "commonly-made mistakes" exists anywhere in the
     Knowledge Runtime schema — honest stub, always []. */
  function generatePitfalls(knowledge) {
    knowledge = knowledge || {};
    return [];
  }

  /* Rule-based, not AI: formulas and definitions are the two Knowledge
     fields a student would typically be asked to memorize verbatim. */
  function generateMemorize(knowledge) {
    knowledge = knowledge || {};
    return arr(knowledge.formulas).concat(arr(knowledge.definitions));
  }

  /* One deterministic templated suggestion referencing chapter/section,
     only if they're actually non-empty — never invents a suggestion
     about a chapter/section that isn't there. */
  function generateReviewSuggestions(knowledge) {
    knowledge = knowledge || {};
    var chapter = str(knowledge.chapter).trim();
    var section = str(knowledge.section).trim();
    var target = chapter || section;
    if (!target) { return []; }
    return ["建議複習：" + target];
  }

  /* normalize(draft) — real (non-stub) data hygiene: guarantees every
     Summary Runtime field is the right *type*, never mutates the input,
     never invents content. Pure. */
  function normalize(draft) {
    draft = draft || {};
    function s(v) { return (typeof v === "string") ? v.trim() : ""; }

    return {
      id: draft.id || null,
      materialId: draft.materialId || null,
      subject: s(draft.subject) || draft.subject || null,
      grade: s(draft.grade) || draft.grade || null,
      chapter: s(draft.chapter),
      section: s(draft.section),
      title: s(draft.title),
      coreConcepts: arr(draft.coreConcepts),
      definitions: arr(draft.definitions),
      pitfalls: arr(draft.pitfalls),
      memorize: arr(draft.memorize),
      reviewSuggestions: arr(draft.reviewSuggestions),
      generatedAt: draft.generatedAt || null
    };
  }

  /* validate(record) — real (non-stub), deterministic, non-AI schema
     check. Returns { valid, errors }, never throws. Fixed five-section
     format is enforced here: all five must be arrays, no more, no
     fewer. */
  function validate(record) {
    var errors = [];
    record = record || {};

    var requiredScalars = ["id", "materialId", "subject", "grade", "generatedAt"];
    requiredScalars.forEach(function (key) {
      if (!record[key]) { errors.push("缺少必要欄位：" + key); }
    });

    var fiveSections = ["coreConcepts", "definitions", "pitfalls", "memorize", "reviewSuggestions"];
    fiveSections.forEach(function (key) {
      if (!Array.isArray(record[key])) { errors.push(key + " 必須為 Array（五段固定格式之一）"); }
    });

    return { valid: errors.length === 0, errors: errors };
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  var seq = 0;
  function nextId() {
    seq += 1;
    return "sum_" + seq;
  }

  /* generate(knowledge) — orchestrates every generateX() into the fixed
     five-section format, normalizes the draft, and returns the finished
     summary structure (Summary Runtime-shaped, but NOT stored — this
     module never touches AHS.SummaryRuntime; storing is the Runtime's
     job, per "Summary Generator 只負責 Knowledge Runtime -> Summary
     Runtime" transformation, not storage). Never throws — a missing/
     malformed knowledge record still returns a valid, mostly-empty
     structure rather than throwing. */
  function generate(knowledge) {
    knowledge = knowledge || {};

    var draft = {
      id: nextId(),
      materialId: knowledge.materialId || null,
      subject: knowledge.subject || null,
      grade: knowledge.grade || null,
      chapter: knowledge.chapter || "",
      section: knowledge.section || "",
      title: knowledge.title || "",
      coreConcepts: generateCoreConcepts(knowledge),
      definitions: generateDefinitions(knowledge),
      pitfalls: generatePitfalls(knowledge),
      memorize: generateMemorize(knowledge),
      reviewSuggestions: generateReviewSuggestions(knowledge),
      generatedAt: formatDate(new Date())
    };

    return normalize(draft);
  }

  return {
    generate: generate,
    generateCoreConcepts: generateCoreConcepts,
    generateDefinitions: generateDefinitions,
    generatePitfalls: generatePitfalls,
    generateMemorize: generateMemorize,
    generateReviewSuggestions: generateReviewSuggestions,
    normalize: normalize,
    validate: validate
  };
})();
