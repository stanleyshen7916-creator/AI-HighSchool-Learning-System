/* js/runtime/AnswerBuilderRuntime.js — Sprint 8.0 · EO-S8.0-001
   Module 6 · Answer Builder — every question's explanation is built by
   WALKING THE REAL CHAIN, never invented (不得憑空產生詳解):

     Question ─▶ Knowledge Point (Knowledge Graph node)
              ─▶ Summary (AnalysisRuntime v2 record containing that node)
              ─▶ Source Material (source_file node / Material Runtime)
              ─▶ Explanation

   PMO Final Decision 5 (LOCK): Foundation scope — this module is the
   INTERFACE and its lookup chain only. It contains no generation code
   whatsoever, so with the skeleton-only Knowledge Graph every call
   currently reports 「缺少完整解答」with the precise missing links.
   That is the correct, honest Foundation behavior; real explanations
   arrive when the Analysis Pipeline EO populates content nodes.

   build(questionRecord) returns the six-part Explanation Rule object:
     ① answer ② steps ③ knowledgePoint ④ chapter ⑤ formula ⑥ source
   Each part is resolved from the graph/summary; any link the graph
   cannot supply is reported honestly — the record is marked
     { complete: false, marker: "缺少完整解答", missing: [...] }
   and NO AI guess ever fills a gap (there is no generation code here at
   all — only lookups). validate() re-checks the六-part shape. */
window.AHS = window.AHS || {};
AHS.AnswerBuilderRuntime = (function () {
  "use strict";

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function graph() { return AHS.KnowledgeGraphRuntime || null; }

  function chapterOf(node) {
    /* chapter node covering this node's material, via graph query. */
    var kg = graph();
    if (!kg || !node) { return null; }
    var chapters = kg.queryByMaterial(node.sourceFileId).filter(function (n) { return n.type === "chapter"; });
    return chapters.length ? chapters[0] : null;
  }

  function formulaFor(materialId) {
    var kg = graph();
    if (!kg) { return null; }
    var f = kg.queryByMaterial(materialId).filter(function (n) { return n.type === "formula"; });
    return f.length ? f[0] : null;
  }

  /* build(question) — question needs { id?, question, answer,
     explanation?, knowledgeId (KG node id), materialId }. */
  function build(question) {
    question = question || {};
    var kg = graph();
    var missing = [];

    var answer = (question.answer !== undefined && question.answer !== null && String(question.answer).trim() !== "")
      ? question.answer : null;
    if (answer === null) { missing.push("正確答案"); }

    var kpNode = (kg && question.knowledgeId) ? kg.getNode(question.knowledgeId) : null;
    if (!kpNode) { missing.push("對應知識點"); }

    var summary = (AHS.AnalysisRuntime && question.materialId)
      ? AHS.AnalysisRuntime.getByMaterialId(question.materialId) : null;
    var summaryHasKp = false;
    if (summary && kpNode) {
      AHS.AnalysisRuntime.SECTIONS.forEach(function (sec) {
        (summary[sec] || []).forEach(function (it) { if (it.knowledgeId === kpNode.id) { summaryHasKp = true; } });
      });
    }
    if (!summaryHasKp) { missing.push("對應 Summary"); }

    var chapterNode = kpNode ? chapterOf(kpNode) : null;
    if (!chapterNode) { missing.push("對應教材章節"); }

    var formulaNode = question.materialId ? formulaFor(question.materialId) : null;
    if (!formulaNode) { missing.push("對應公式"); }

    var sourceNode = null;
    if (kg && kpNode) {
      var sources = kg.queryByType("source_file").filter(function (s) { return s.sourceFileId === kpNode.sourceFileId; });
      sourceNode = sources.length ? sources[0] : null;
    }
    if (!sourceNode) { missing.push("原始資料來源"); }

    var steps = String(question.explanation || "").trim()
      ? [String(question.explanation).trim()] : [];
    if (!steps.length && kpNode) {
      /* Deterministic derivation from the REAL knowledge node — a
         reference step, not an invented solution. */
      steps = ["依據知識點「" + (kpNode.content || kpNode.label) + "」作答。"];
    }
    if (!steps.length) { missing.push("解題步驟"); }

    var complete = missing.length === 0;
    return {
      questionId: question.id || null,
      complete: complete,
      marker: complete ? null : "缺少完整解答",
      missing: missing,
      answer: answer,
      steps: steps,
      knowledgePoint: kpNode ? { knowledgeId: kpNode.id, text: kpNode.content || kpNode.label } : null,
      chapter: chapterNode ? { knowledgeId: chapterNode.id, text: chapterNode.label } : null,
      formula: formulaNode ? { knowledgeId: formulaNode.id, text: formulaNode.content || formulaNode.label } : null,
      source: sourceNode ? {
        knowledgeId: sourceNode.id, sourceFileId: sourceNode.sourceFileId,
        fileName: sourceNode.label, sourcePage: sourceNode.sourcePage, sourceParagraph: sourceNode.sourceParagraph
      } : null,
      builtAt: new Date().toISOString()
    };
  }

  function validate(explanation) {
    var errors = [];
    explanation = explanation || {};
    ["answer", "steps", "knowledgePoint", "chapter", "formula", "source"].forEach(function (k) {
      if (!(k in explanation)) { errors.push("缺少欄位：" + k); }
    });
    if (explanation.complete !== true && explanation.marker !== "缺少完整解答") {
      errors.push("不完整詳解必須標示「缺少完整解答」");
    }
    if (explanation.complete === true && (!explanation.answer || !explanation.steps.length ||
        !explanation.knowledgePoint || !explanation.chapter || !explanation.formula || !explanation.source)) {
      errors.push("complete=true 但六項不齊（不得憑空補齊）");
    }
    return { valid: errors.length === 0, errors: errors };
  }

  return { build: build, validate: validate };
})();
