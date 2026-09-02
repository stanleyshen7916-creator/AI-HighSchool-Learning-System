/* js/ui/MaterialDetailRepositorySource.js — HOTFIX-003 Material Detail
   Content Integration.

   Read-only resolver: given a real AHS.MaterialRuntime id, finds the
   original Teaching Material Repository record it came from (either this
   branch's own docs/TeachingMaterials/ Package track, exposed as
   AHS.TeachingMaterialData, or the other, already-merged data/materials/
   AHS.MaterialRepository track — see HOTFIX-002) and normalizes it into
   three shapes the Material Detail Modal's existing section components
   already know how to render:
     - sections: string[] — a readable outline for 教材內容
       (js/ui/MaterialContentView.js's content/body/markdown/html/sections
       fallback chain)
     - summary: { title, summary: { coreConcepts, definitions, keywords,
       formulas, importantPoints } } (each an array of {text}) — the EXACT
       shape js/ui/MaterialSummaryCard.js already renders, matching
       AHS.AITutorService.getLearningSummary()'s own output shape
     - quiz: { questions: [{question, options, answer, explanation,
       difficulty, knowledgePoint}] } — the EXACT shape
       js/ui/MaterialQuestionCard.js already renders

   Never modifies js/runtime/TeachingMaterialLoader.js (this Hotfix's own
   constraint: 不得修改 TeachingMaterialLoader API / Repository Loader) —
   only READS the same PersistenceAdapter-backed id map that file already
   writes, plus the same two Repository globals both already expose.
   Holds no store of its own; every call re-derives from current state.

   Judgment calls (flagged, not hidden — neither Repository ever captured
   raw markdown/HTML source text, only structured analysis):
   - "sections" for 教材內容 is synthesized from each Repository's real
     coreConcepts/definitions/keyPoints — a readable restructuring of real
     facts, not invented content. Kept visually distinct from "AI 重點
     整理" (plain outline paragraphs here vs a bullet/chip card there)
     even though both draw on the same underlying real material facts,
     since no Repository ever captured genuinely separate "raw content"
     text — that data honestly doesn't exist.
   - AHS.MaterialRepository (data/materials/) track: coreConcepts'
     {term,definition} pairs flattened to "term：definition" strings,
     matching the same flattening TeachingMaterialLoader.js already uses
     for SummaryRuntime.coreConcepts.
   - quiz.answer is resolved from a question's correctAnswer KEY back to
     its option TEXT (MaterialQuestionCard.js displays answer as plain
     text, not a key) — only needed for the MaterialRepository track,
     whose questionBank stores {key,text} options + a key answer; the
     Package track's own questions already store answer as plain text
     directly, no resolution needed.
   - difficulty/knowledgePoint are included only when the source record
     actually has them — never fabricated when absent. Both tracks'
     questions.json schemas carry an optional per-question `difficulty`
     field (QuestionBank.schema.json); Package-track materials tm_2
     onward populate it. */
window.AHS = window.AHS || {};
AHS.MaterialDetailRepositorySource = (function () {
  "use strict";

  var STORAGE_KEY = "teachingMaterialLoaderIdMap";

  function loadIdMap() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && typeof loaded === "object") { return loaded; }
    }
    return {};
  }

  function findSourceId(runtimeMaterialId) {
    var idMap = loadIdMap();
    var found = null;
    Object.keys(idMap).forEach(function (sourceId) {
      if (idMap[sourceId] === runtimeMaterialId) { found = sourceId; }
    });
    return found;
  }

  function textOf(list) {
    return (Array.isArray(list) ? list : []).map(function (t) { return { text: String(t || "") }; });
  }

  /* ---- data/materials/ AHS.MaterialRepository record ---- */
  function fromRepositoryRecord(record) {
    var meta = record.metadata || {};
    var summary = record.summary || {};
    var coreConcepts = Array.isArray(record.coreConcepts) ? record.coreConcepts : [];
    var flatConcepts = coreConcepts.map(function (c) {
      return (c && c.term ? c.term + "：" : "") + ((c && c.definition) || "");
    });

    var sections = [];
    if (summary.title) { sections.push(summary.title); }
    sections = sections.concat(flatConcepts, Array.isArray(summary.definitions) ? summary.definitions : []);

    var summaryData = {
      title: summary.title || "",
      summary: {
        coreConcepts: textOf(flatConcepts),
        definitions: textOf(summary.definitions),
        keywords: textOf(summary.keywords),
        importantPoints: textOf(summary.keyPoints),
        formulas: []
      }
    };

    var bank = record.questionBank || {};
    var singleChoice = Array.isArray(bank.singleChoice) ? bank.singleChoice : [];
    var questions = singleChoice.map(function (q) {
      var options = Array.isArray(q.options) ? q.options : [];
      var matched = options.filter(function (o) { return o && o.key === q.correctAnswer; })[0];
      return {
        id: q.id, /* HOTFIX-004: exposed so other real pages (e.g. quiz.html's
          Exam Mode QuestionCard) can match a stored QuestionRuntime question
          back to its own difficulty/knowledgePoint without duplicating this
          Repository-record lookup — purely additive, doesn't change anything
          Material Detail's own components already read from this object. */
        question: q.text || "",
        options: options.map(function (o) { return o && o.text; }),
        answer: matched ? matched.text : "",
        explanation: q.explanation || "",
        difficulty: q.difficulty || "",
        knowledgePoint: q.knowledgePoint || meta.chapter || ""
      };
    });

    return { sections: sections, summary: summaryData, quiz: { questions: questions } };
  }

  /* ---- docs/TeachingMaterials/ Package track (AHS.TeachingMaterialData) ---- */
  function fromPackageEntry(entry) {
    var material = entry.material || {};
    var summary = entry.summary || {};

    var sections = [];
    if (material.title) { sections.push(material.title); }
    sections = sections.concat(
      Array.isArray(summary.coreConcepts) ? summary.coreConcepts : [],
      Array.isArray(summary.definitions) ? summary.definitions : []
    );

    var summaryData = {
      title: material.title || "",
      summary: {
        coreConcepts: textOf(summary.coreConcepts),
        definitions: textOf(summary.definitions),
        keywords: [],
        importantPoints: textOf(summary.pitfalls),
        formulas: []
      }
    };

    var questions = (Array.isArray(entry.questions) ? entry.questions : []).map(function (q) {
      return {
        id: q.id, /* HOTFIX-004: see fromRepositoryRecord()'s own note above */
        question: q.question || "",
        options: Array.isArray(q.options) ? q.options.slice() : [],
        answer: q.answer || "",
        explanation: q.explanation || "",
        difficulty: q.difficulty || "",
        knowledgePoint: q.knowledgePoint || material.chapter || ""
      };
    });

    return { sections: sections, summary: summaryData, quiz: { questions: questions } };
  }

  /* resolve(runtimeMaterialId) -> { sections, summary, quiz } | null.
     null when this material didn't come from either Repository (e.g. a
     regular upload) — callers must keep their existing behavior in that
     case, never fabricate.

     HOTFIX-004 (Material Detail 資料未顯示，第二階段): before this fix,
     resolve() silently trusted that AHS.TeachingMaterialLoader had
     already finished initialize()/load() on whatever page opened
     Material Detail — true on materials.html's own bootstrap order
     (js/pages/AppMaterials.js calls it before AHS.MaterialCenter.create()),
     but resolve() had no way to self-correct if that assumption ever
     didn't hold, and would return null (indistinguishable from "not a
     Repository material") instead of surfacing real data. load() is
     idempotent (js/runtime/TeachingMaterialLoader.js's own `initialized`
     guard) and side-effect-free to call again, so resolve() now always
     ensures it has run immediately before looking up the id map —
     closing that gap unconditionally rather than assuming it's already
     closed. */
  function resolve(runtimeMaterialId) {
    if (AHS.TeachingMaterialLoader && typeof AHS.TeachingMaterialLoader.load === "function") {
      AHS.TeachingMaterialLoader.load();
    }
    var sourceId = findSourceId(runtimeMaterialId);
    if (!sourceId) { return null; }

    if (AHS.MaterialRepository && typeof AHS.MaterialRepository.getById === "function") {
      var record = AHS.MaterialRepository.getById(sourceId);
      if (record) { return fromRepositoryRecord(record); }
    }

    var entries = Array.isArray(AHS.TeachingMaterialData) ? AHS.TeachingMaterialData : [];
    var entry = null;
    entries.forEach(function (e) { if (e && e.materialId === sourceId) { entry = e; } });
    if (entry) { return fromPackageEntry(entry); }

    return null;
  }

  return { resolve: resolve };
})();
