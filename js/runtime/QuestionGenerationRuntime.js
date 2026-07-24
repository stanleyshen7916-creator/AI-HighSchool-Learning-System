/* js/runtime/QuestionGenerationRuntime.js — Sprint 8.2 · EO-S8.2.003
   AI Question Generation Runtime — a Knowledge Graph CONSUMER.

   Fixed architecture (LOCK): SummaryRuntime and this Runtime are
   PARALLEL consumers of the same graph. There is no upstream or
   downstream relationship between them:

     Material → AnalysisRuntime → KnowledgeExtractionRuntime
             → KnowledgeGraphRuntime
                  ├── Summary capability
                  └── QuestionGenerationRuntime   (this file)

   The forbidden chain KnowledgeGraph → Summary → Question is not merely
   avoided by convention: this module contains no reference to any
   summary module at all (source-scan asserted in
   tests/regression/QuestionGenerationRuntimeV1.js). Note that the
   pre-existing js/parser/QuestionGenerationFlow.js DOES derive questions
   from SummaryRuntime; it is LOCK, untouched, and deliberately NOT
   reused here because that path is exactly what this EO forbids.

   Question Source (LOCK): questions are built only from real Knowledge
   Graph data — node content, node metadata and the node's material
   relationship — read through AHS.KnowledgeGraphRuntime's public query
   API. This module never re-parses a material, never builds an analysis
   pipeline and never re-extracts knowledge (no MaterialRuntime,
   MaterialTextProvider, AnalysisRuntime or KnowledgeExtractionRuntime
   reference exists in it).

   Knowledge Type (LOCK): definition | formula | keyword | concept.
   The graph also stores knowledge_point nodes; since that value is not
   in this EO's fixed enum, such nodes are SKIPPED rather than relabelled
   into an allowed type — relabelling would misreport the source
   (flagged in REPORT.md).

   Question Rules (LOCK): every question carries four options, a correct
   answer, an explanation, its knowledge node, its knowledge type and a
   difficulty of easy | medium | hard.

   Every option is REAL: either one of the four fixed knowledge-type
   labels, or the verbatim text of another real node from the same
   material. No distractor is ever invented, and no filler option
   ("以上皆非" and the like) is ever added — when the graph cannot supply
   three real distractors, that question form is simply not produced.

   Deterministic question forms (no AI, no randomness — same graph in,
   same questions out; nodes are processed in graph id order):

     A · Classification — "「<text>」屬於下列哪一類知識？"
         options = the four knowledge-type labels (all real, fixed enum)
         answer  = the node's actual type
         difficulty = easy          (choosing among 4 distinct categories)

     B · Recall — "下列哪一項是本教材記錄的〈type〉？"
         options = the node's text + three other real node texts
         answer  = the node's text
         difficulty = hard          when all three distractors share the
                                    node's own type (hardest to tell apart)
                      medium        when distractors come from other types

   Runtime: MEMORY ONLY. No localStorage, no sessionStorage, no
   IndexedDB, and no PersistenceAdapter (which is sessionStorage-backed);
   generated questions live for the page session only. */
window.AHS = window.AHS || {};
AHS.QuestionGenerationRuntime = (function () {
  "use strict";

  var KNOWLEDGE_TYPES = ["definition", "formula", "keyword", "concept"];
  var DIFFICULTIES = ["easy", "medium", "hard"];
  var TYPE_LABELS = {
    definition: "定義", formula: "公式", keyword: "關鍵字", concept: "概念"
  };

  /* Memory Runtime Only — one in-process store, no persistence layer. */
  var store = [];
  var seq = 0;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function graph() {
    return (AHS.KnowledgeGraphRuntime && typeof AHS.KnowledgeGraphRuntime.queryByMaterial === "function")
      ? AHS.KnowledgeGraphRuntime : null;
  }

  function nextId() { seq += 1; return "qg_" + seq; }

  /* Stable ordering by the graph's own numeric node id, so generation is
     reproducible rather than dependent on storage iteration order. */
  function byNodeId(a, b) {
    var na = parseInt(String(a.id).replace(/\D+/g, ""), 10) || 0;
    var nb = parseInt(String(b.id).replace(/\D+/g, ""), 10) || 0;
    if (na === nb) { return String(a.id) < String(b.id) ? -1 : 1; }
    return na - nb;
  }

  function textOf(node) { return String(node.content || node.label || ""); }

  function traceabilityFor(node, materialId) {
    return {
      materialId: materialId,
      knowledgeNodeId: node.id,
      paragraph: (node.sourceParagraph === undefined) ? null : node.sourceParagraph,
      /* The graph carries no line span yet — honestly null, never guessed. */
      lineStart: (node.lineStart === undefined) ? null : node.lineStart,
      lineEnd: (node.lineEnd === undefined) ? null : node.lineEnd
    };
  }

  function baseQuestion(node, materialId) {
    return {
      id: nextId(),
      knowledgeNodeId: node.id,
      knowledgeType: node.type,
      type: "single_choice",       /* four options + one answer */
      difficulty: "easy",
      question: "",
      options: [],
      answer: "",
      explanation: "",
      traceability: traceabilityFor(node, materialId)
    };
  }

  /* ---- Form A · classification (always four real, fixed options) ------- */
  function classificationQuestion(node, materialId) {
    var q = baseQuestion(node, materialId);
    var text = textOf(node);
    q.difficulty = "easy";
    q.question = "「" + text + "」在本教材的知識圖譜中屬於下列哪一類知識？";
    q.options = KNOWLEDGE_TYPES.map(function (t) { return TYPE_LABELS[t]; });
    q.answer = TYPE_LABELS[node.type];
    q.explanation = "「" + text + "」於知識圖譜中的節點型別為「" + TYPE_LABELS[node.type] +
      "」（節點 " + node.id + "，段落 " +
      (q.traceability.paragraph === null ? "未知" : q.traceability.paragraph) + "）。";
    return q;
  }

  /* ---- Form B · recall (three REAL distractors, else not produced) ----- */
  function recallQuestion(node, materialId, pool) {
    var text = textOf(node);
    var sameType = [], otherType = [];
    pool.forEach(function (candidate) {
      if (candidate.id === node.id) { return; }
      var candidateText = textOf(candidate);
      if (!candidateText || candidateText === text) { return; }
      if (candidate.type === node.type) { sameType.push(candidateText); }
      else { otherType.push(candidateText); }
    });

    var distractors, difficulty;
    if (sameType.length >= 3) {
      distractors = sameType.slice(0, 3);
      difficulty = "hard";          /* same category — hardest to discriminate */
    } else {
      var mixed = sameType.concat(otherType);
      if (mixed.length < 3) { return null; }   /* no fabricated options, ever */
      distractors = mixed.slice(0, 3);
      difficulty = "medium";
    }

    var q = baseQuestion(node, materialId);
    q.difficulty = difficulty;
    q.question = "下列哪一項是本教材知識圖譜中記錄的「" + TYPE_LABELS[node.type] + "」？";
    /* Deterministic placement: the answer's slot is derived from the
       node's own id so it varies across questions without randomness. */
    var slot = (parseInt(String(node.id).replace(/\D+/g, ""), 10) || 0) % 4;
    var options = distractors.slice();
    options.splice(slot, 0, text);
    q.options = options.slice(0, 4);
    q.answer = text;
    q.explanation = "「" + text + "」為知識圖譜中型別「" + TYPE_LABELS[node.type] +
      "」的節點（節點 " + node.id + "）；其餘選項為本教材的其他知識節點內容。";
    return q;
  }

  /* ---- generateQuestions(materialId) ------------------------------------
     Builds the LOCK model from this material's Knowledge Graph content
     nodes. Returns null when the graph holds no usable content — an
     honest nothing, never an invented question set. Re-running replaces
     that material's set instead of accumulating duplicates. */
  function generateQuestions(materialId) {
    var kg = graph();
    if (!kg || !materialId) { return null; }

    var nodes = kg.queryByMaterial(materialId);
    if (!nodes.length) { return null; }

    var pool = nodes.filter(function (node) {
      return KNOWLEDGE_TYPES.indexOf(node.type) !== -1 && !!textOf(node);
    }).sort(byNodeId);
    if (!pool.length) { return null; }

    var questions = [];
    pool.forEach(function (node) {
      questions.push(classificationQuestion(node, materialId));
      var recall = recallQuestion(node, materialId, pool);
      if (recall) { questions.push(recall); }
    });
    if (!questions.length) { return null; }

    var record = {
      materialId: materialId,
      generatedAt: new Date().toISOString(),
      questions: questions
    };

    var existing = -1;
    for (var i = 0; i < store.length; i += 1) {
      if (store[i].materialId === materialId) { existing = i; }
    }
    if (existing === -1) { store.push(record); } else { store[existing] = record; }
    return clone(record);
  }

  /* ---- getQuestion(id) — one question by its own id -------------------- */
  function getQuestion(id) {
    var found = null;
    store.forEach(function (record) {
      record.questions.forEach(function (q) { if (q.id === id) { found = q; } });
    });
    return found ? clone(found) : null;
  }

  /* ---- getQuestions() — every generated question, flattened ------------ */
  function getQuestions() {
    var all = [];
    store.forEach(function (record) {
      record.questions.forEach(function (q) { all.push(clone(q)); });
    });
    return all;
  }

  /* ---- getQuestionsByMaterial(materialId) — that material's record ----- */
  function getQuestionsByMaterial(materialId) {
    var found = null;
    store.forEach(function (record) { if (record.materialId === materialId) { found = record; } });
    return found ? clone(found) : null;
  }

  /* ---- clearQuestions(materialId?) — one material's set, or all -------- */
  function clearQuestions(materialId) {
    if (!materialId) {
      var removedAll = store.length;
      store = [];
      return removedAll;
    }
    var before = store.length;
    store = store.filter(function (record) { return record.materialId !== materialId; });
    return before - store.length;
  }

  /* ---- serialize(materialId?) — JSON text; pure read ------------------- */
  function serialize(materialId) {
    if (materialId) {
      var one = getQuestionsByMaterial(materialId);
      return one ? JSON.stringify(one) : null;
    }
    return JSON.stringify(store.map(function (record) { return clone(record); }));
  }

  return {
    generateQuestions: generateQuestions,
    getQuestion: getQuestion,
    getQuestions: getQuestions,
    getQuestionsByMaterial: getQuestionsByMaterial,
    clearQuestions: clearQuestions,
    serialize: serialize,
    KNOWLEDGE_TYPES: KNOWLEDGE_TYPES.slice(),
    DIFFICULTIES: DIFFICULTIES.slice()
  };
})();
