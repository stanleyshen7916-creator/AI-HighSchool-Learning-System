/* js/runtime/KnowledgeSummaryRuntime.js — Sprint 8.2 · EO-S8.2.002
   Summary Runtime — the first AI learning-output module.

   Pipeline position (unchanged, nothing re-implemented here):
     Material → AnalysisRuntime → KnowledgeExtractionRuntime
             → KnowledgeGraphRuntime → THIS module

   NAMING (flagged in REPORT.md · Repository Search): the EO asks for
   js/runtime/SummaryRuntime.js, but that file already exists — the
   Sprint-5 five-section store (coreConcepts / definitions / pitfalls /
   memorize / reviewSuggestions; add/sync/list/getById/…) which
   EO-S8.0-001's PMO Final Decision 3 fixed as LOCK and which
   SummaryCenter and SummaryGenerator consume live. Creating the EO's
   different model + different API at that path would overwrite a
   Foundation Runtime and change a Public API — both forbidden by this
   EO's own Execution Rules 4 and 5. This module therefore uses the
   established parallel-naming precedent (Ruling 1B, as used for
   LearningQuestionSession, WrongBookSession and ReviewModel):
   AHS.KnowledgeSummaryRuntime. The LOCK SummaryRuntime is untouched
   (byte-identical) and this is NOT a second copy of it — it is the
   Knowledge-Graph-derived output the EO specifies, which the LOCK store
   structurally cannot represent.

   Summary Source (LOCK): content comes ONLY from the Knowledge Graph,
   read through AHS.KnowledgeGraphRuntime's public query API. This module
   never re-parses a material, never builds an Analysis pipeline, and
   never duplicates analysis logic — it has no access to file content,
   no text segmentation and no MaterialRuntime reference at all.

   Section mapping — a deterministic 1:1 of the graph's five content
   node types onto the EO's five fixed sections (no inference):
     concept          → coreConcepts
     keyword          → keywords
     definition       → definitions
     formula          → formulas
     knowledge_point  → importantPoints

   Summary Model (LOCK, no extra fields):
     { materialId, title, generatedAt,
       summary: { coreConcepts, keywords, definitions, formulas,
                  importantPoints },
       traceability: {} }

   Traceability (LOCK): every summary item carries materialId,
   knowledgeNodeId, paragraph, lineStart and lineEnd, and the
   traceability object indexes them by knowledgeNodeId. The Knowledge
   Graph stores sourceParagraph but has no line span, so lineStart /
   lineEnd are honestly null until a parser supplies them — never
   guessed, never fabricated.

   Runtime: MEMORY ONLY. No localStorage, no sessionStorage, no
   IndexedDB, and deliberately no PersistenceAdapter (which is backed by
   sessionStorage) — summaries live for the page session only, exactly as
   the EO requires. */
window.AHS = window.AHS || {};
AHS.KnowledgeSummaryRuntime = (function () {
  "use strict";

  var SECTIONS = ["coreConcepts", "keywords", "definitions", "formulas", "importantPoints"];
  var TYPE_TO_SECTION = {
    concept: "coreConcepts",
    keyword: "keywords",
    definition: "definitions",
    formula: "formulas",
    knowledge_point: "importantPoints"
  };

  /* Memory Runtime Only — one in-process store, no persistence layer. */
  var store = [];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function graph() {
    return (AHS.KnowledgeGraphRuntime && typeof AHS.KnowledgeGraphRuntime.queryByMaterial === "function")
      ? AHS.KnowledgeGraphRuntime : null;
  }

  /* Title from the graph's own source_file node (its real metadata) —
     never read from MaterialRuntime, keeping the Knowledge Graph the
     single source (Summary Source LOCK). */
  function titleFromGraph(nodes, materialId) {
    var title = "";
    nodes.forEach(function (node) {
      if (node.type === "source_file" && node.sourceFileId === materialId) {
        if (node.meta && node.meta.title) { title = String(node.meta.title); }
        else if (node.label) { title = String(node.label); }
      }
    });
    return title;
  }

  function itemFor(node, materialId) {
    return {
      text: String(node.content || node.label || ""),
      materialId: materialId,
      knowledgeNodeId: node.id,
      paragraph: (node.sourceParagraph === undefined) ? null : node.sourceParagraph,
      /* The graph carries no line span yet — honestly null, not guessed. */
      lineStart: (node.lineStart === undefined) ? null : node.lineStart,
      lineEnd: (node.lineEnd === undefined) ? null : node.lineEnd
    };
  }

  function findIndexByMaterial(materialId) {
    for (var i = 0; i < store.length; i += 1) {
      if (store[i].materialId === materialId) { return i; }
    }
    return -1;
  }

  /* ---- createSummary(materialId) ----------------------------------------
     Builds the LOCK model from the Knowledge Graph's content nodes for
     this material. Returns null when the graph holds no content for it
     (extraction not run, or insufficient source) — an honest nothing,
     never an invented summary. Re-running replaces that material's
     summary rather than accumulating duplicates. */
  function createSummary(materialId) {
    var kg = graph();
    if (!kg || !materialId) { return null; }

    var nodes = kg.queryByMaterial(materialId);
    if (!nodes.length) { return null; }

    var summary = {};
    SECTIONS.forEach(function (section) { summary[section] = []; });
    var traceability = {};
    var contentCount = 0;

    nodes.forEach(function (node) {
      var section = TYPE_TO_SECTION[node.type];
      if (!section) { return; }                 /* skeleton nodes are not summary content */
      var item = itemFor(node, materialId);
      if (!item.text) { return; }               /* never emit an empty entry */
      summary[section].push(item);
      traceability[item.knowledgeNodeId] = {
        materialId: item.materialId,
        knowledgeNodeId: item.knowledgeNodeId,
        paragraph: item.paragraph,
        lineStart: item.lineStart,
        lineEnd: item.lineEnd,
        section: section
      };
      contentCount += 1;
    });

    if (contentCount === 0) { return null; }    /* graph skeleton only — nothing to summarise */

    var record = {
      materialId: materialId,
      title: titleFromGraph(nodes, materialId),
      generatedAt: new Date().toISOString(),
      summary: summary,
      traceability: traceability
    };

    var existing = findIndexByMaterial(materialId);
    if (existing === -1) { store.push(record); } else { store[existing] = record; }
    return clone(record);
  }

  /* ---- getSummary(materialId?) -------------------------------------------
     With a materialId, that material's summary; without one, the most
     recently created summary. (The LOCK model has no id field — adding
     one would violate 不得增加欄位 — so materialId is the identifier;
     flagged in REPORT.md.) */
  function getSummary(materialId) {
    if (materialId) { return getSummaryByMaterial(materialId); }
    if (!store.length) { return null; }
    return clone(store[store.length - 1]);
  }

  function getSummaryByMaterial(materialId) {
    var index = findIndexByMaterial(materialId);
    return index === -1 ? null : clone(store[index]);
  }

  /* ---- clearSummary(materialId?) -----------------------------------------
     One material's summary, or all of them when called with no argument.
     Returns the number of summaries removed. */
  function clearSummary(materialId) {
    if (!materialId) {
      var removedAll = store.length;
      store = [];
      return removedAll;
    }
    var index = findIndexByMaterial(materialId);
    if (index === -1) { return 0; }
    store.splice(index, 1);
    return 1;
  }

  /* ---- serialize(materialId?) -------------------------------------------
     JSON text of one summary or of every summary held in memory. Pure
     read — serialising never mutates or persists anything. */
  function serialize(materialId) {
    if (materialId) {
      var one = getSummaryByMaterial(materialId);
      return one ? JSON.stringify(one) : null;
    }
    return JSON.stringify(store.map(function (record) { return clone(record); }));
  }

  return {
    createSummary: createSummary,
    getSummary: getSummary,
    getSummaryByMaterial: getSummaryByMaterial,
    clearSummary: clearSummary,
    serialize: serialize,
    SECTIONS: SECTIONS.slice()
  };
})();
