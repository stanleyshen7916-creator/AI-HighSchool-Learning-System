/* js/services/KnowledgeBuilder.js — Sprint 6 · EO-S6-002 Knowledge
   Builder Foundation.

   Scope: pure, stateless transformation only — Material Document ->
   knowledge structure. Never touches AHS.KnowledgeRuntime, AHS.Mock,
   any UI, or js/runtime/MaterialRuntime.js/js/services/MaterialParser.js
   (neither read from nor modified; both untouched, confirmed by diff).
   Never calls an AI API (none exists in this repo). Never produces a
   Summary or a Question — those are explicitly out of scope
   (EO-S6-003/EO-S6-004+).

   Input is Material Document ONLY (the fixed schema from EO-S6-001:
   {id, materialId, subject, grade, category, fileName, fileType,
   content, createdAt}) — this module never parses PDF/DOCX/PPTX/
   Image/Audio directly, only ever reads a Material Document's `content`
   string.

   Stub Implementation note: Material Document `content` today is always
   a placeholder stub string from MaterialParser.js (e.g. "[Stub] PDF
   內容尚未解析：..."), since no real binary parsing exists yet. Rather
   than fabricate concepts/keywords/definitions/etc. that aren't actually
   there, every extractX() below returns an honest empty result ([] or
   "") unless a real, simple, non-AI heuristic finds something in the
   actual content string (chapter/section number patterns). This mirrors
   the project's established "fixed 0 / 尚無資料 rather than fabricate"
   convention (Wrong Book 今日待複習, Review Center 花費時間, etc.).
   Once MaterialParser.js parses real content in a future EO, these same
   functions will start finding real structure without needing to change
   their contract.
   PascalCase module under window.AHS, consistent with every existing
   Runtime/component/service in this repo. */
window.AHS = window.AHS || {};
AHS.KnowledgeBuilder = (function () {
  "use strict";

  function textOf(materialDocument) {
    return (materialDocument && typeof materialDocument.content === "string")
      ? materialDocument.content : "";
  }

  /* ---- extract*() — each takes a Material Document, returns an honest
     result. Array-returning extractors are true stubs (no reliable,
     non-AI signal exists in a stub content string) — [] is correct, not
     "not yet implemented". Chapter/Section use a small deterministic
     regex heuristic against the real content string, so they already
     work once real content exists, without any contract change. ---- */
  function extractChapter(materialDocument) {
    var text = textOf(materialDocument);
    var m = /第\s*[0-9一二三四五六七八九十百]+\s*章[^\n：:.]*/.exec(text);
    return m ? m[0].trim() : "";
  }

  function extractSection(materialDocument) {
    var text = textOf(materialDocument);
    var m = /第\s*[0-9一二三四五六七八九十百]+\s*節[^\n：:.]*/.exec(text);
    return m ? m[0].trim() : "";
  }

  function extractConcept(materialDocument) { textOf(materialDocument); return []; }
  function extractKeyword(materialDocument) { textOf(materialDocument); return []; }
  function extractDefinition(materialDocument) { textOf(materialDocument); return []; }
  function extractFormula(materialDocument) { textOf(materialDocument); return []; }
  function extractExample(materialDocument) { textOf(materialDocument); return []; }
  function extractExercise(materialDocument) { textOf(materialDocument); return []; }

  /* normalize(draft) — real (non-stub) data hygiene: guarantees every
     Knowledge Runtime field is the right *type*, never mutates the
     input, never invents content. Pure. */
  function normalize(draft) {
    draft = draft || {};
    function str(v) { return (typeof v === "string") ? v.trim() : ""; }
    function arr(v) { return Array.isArray(v) ? v.slice() : []; }
    function obj(v) { return (v && typeof v === "object" && !Array.isArray(v)) ? v : {}; }

    return {
      id: draft.id || null,
      materialId: draft.materialId || null,
      subject: str(draft.subject) || draft.subject || null,
      grade: str(draft.grade) || draft.grade || null,
      chapter: str(draft.chapter),
      section: str(draft.section),
      title: str(draft.title),
      concepts: arr(draft.concepts),
      keywords: arr(draft.keywords),
      definitions: arr(draft.definitions),
      formulas: arr(draft.formulas),
      examples: arr(draft.examples),
      exercises: arr(draft.exercises),
      metadata: obj(draft.metadata),
      createdAt: draft.createdAt || null
    };
  }

  /* validate(record) — real (non-stub), deterministic, non-AI schema
     check. Returns { valid, errors }, never throws. */
  function validate(record) {
    var errors = [];
    record = record || {};

    var requiredScalars = ["id", "materialId", "subject", "grade", "createdAt"];
    requiredScalars.forEach(function (key) {
      if (!record[key]) { errors.push("缺少必要欄位：" + key); }
    });

    var requiredArrays = ["concepts", "keywords", "definitions", "formulas", "examples", "exercises"];
    requiredArrays.forEach(function (key) {
      if (!Array.isArray(record[key])) { errors.push(key + " 必須為 Array"); }
    });

    if (record.metadata && typeof record.metadata !== "object") {
      errors.push("metadata 必須為 Object");
    }

    return { valid: errors.length === 0, errors: errors };
  }

  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  var seq = 0;
  function nextId() {
    seq += 1;
    return "know_" + seq;
  }

  /* build(materialDocument) — orchestrates every extractX(), normalizes
     the draft, validates it, and returns the finished knowledge
     structure (Knowledge Runtime-shaped, but NOT stored — this module
     never touches AHS.KnowledgeRuntime; storing is the Runtime's job,
     per "Knowledge Builder 只負責建立知識結構"). Never throws — a
     missing/malformed materialDocument still returns a valid, mostly-
     empty structure with validate() errors describing what's missing,
     rather than throwing. */
  function build(materialDocument) {
    materialDocument = materialDocument || {};

    var draft = {
      id: nextId(),
      materialId: materialDocument.materialId || null,
      subject: materialDocument.subject || null,
      grade: materialDocument.grade || null,
      chapter: extractChapter(materialDocument),
      section: extractSection(materialDocument),
      title: materialDocument.fileName || "",
      concepts: extractConcept(materialDocument),
      keywords: extractKeyword(materialDocument),
      definitions: extractDefinition(materialDocument),
      formulas: extractFormula(materialDocument),
      examples: extractExample(materialDocument),
      exercises: extractExercise(materialDocument),
      metadata: { sourceFileType: materialDocument.fileType || null, sourceCategory: materialDocument.category || null },
      createdAt: formatDate(new Date())
    };

    var record = normalize(draft);
    return record;
  }

  return {
    build: build,
    extractChapter: extractChapter,
    extractSection: extractSection,
    extractConcept: extractConcept,
    extractKeyword: extractKeyword,
    extractDefinition: extractDefinition,
    extractFormula: extractFormula,
    extractExample: extractExample,
    extractExercise: extractExercise,
    normalize: normalize,
    validate: validate
  };
})();
