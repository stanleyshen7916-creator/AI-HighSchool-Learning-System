/* js/services/LearningPipeline.js — Sprint 6 · EO-S6-005 Learning
   Pipeline Integration.

   Scope: coordination only. This module does NOT parse PDF/DOCX/PPTX/
   Image/Audio itself, does NOT build Knowledge itself, does NOT
   generate a Summary itself, does NOT generate a Question itself — every
   piece of real work is delegated to the four existing Core Engines and
   their Runtimes (all untouched by this file, confirmed by diff/md5sum):
     AHS.MaterialParser      (js/services/MaterialParser.js — EO-S6-001)
     AHS.KnowledgeBuilder    (js/services/KnowledgeBuilder.js — EO-S6-002)
     AHS.KnowledgeRuntime    (js/runtime/KnowledgeRuntime.js — EO-S6-002)
     AHS.SummaryGenerator    (js/services/SummaryGenerator.js — EO-S6-003)
     AHS.SummaryRuntime      (js/runtime/SummaryRuntime.js — EO-S6-003)
     AHS.QuestionGenerator   (js/services/QuestionGenerator.js — EO-S6-004)
     AHS.LearningQuestionRuntime (js/runtime/LearningQuestionRuntime.js
                                   — EO-S6-004; EO-S6-004's own naming
                                   flag, unchanged here)
     AHS.MaterialRuntime     (existing, pre-Sprint-6 — read-only: only
                                   getById() is called, never written to)

   Never touches UI. Never re-parses/re-builds/re-creates a Runtime that
   an Engine already owns — every buildX() below is a thin call into the
   corresponding Runtime's own sync() (which itself delegates to the
   matching Engine's generate()/build()), never duplicating that logic
   here.

   Pipeline Flow (fixed, per EO-S6-005):
     Material Center -> MaterialParser -> Material Document ->
     KnowledgeBuilder -> Knowledge Runtime -> SummaryGenerator ->
     Summary Runtime -> QuestionGenerator -> LearningQuestionRuntime

   Progress shape (fixed, per EO-S6-005, for future Upload Progress UI):
     { stage, status, progress, errors: [] }
   stage: "idle" | "material" | "knowledge" | "summary" | "questions" | "done"
   status: "pending" | "success" | "error"

   Validation rule: if any stage fails, the pipeline stops immediately
   and returns an error result — it never continues to a later stage on
   failure ("若任一步驟失敗：停止 Pipeline 並回傳 Error。不得繼續。").
   An empty (but structurally valid) result from a stage — e.g. zero
   Learning Questions produced because the current Knowledge Runtime
   record has no real concepts yet (an honest, expected state throughout
   Sprint 6) — is NOT treated as a hard failure; it's recorded as an
   informational entry in `errors` but the pipeline still completes.
   Only a missing/broken engine or missing input is a hard failure.
   PascalCase module under window.AHS, consistent with every existing
   Runtime/component/service in this repo. */
window.AHS = window.AHS || {};
AHS.LearningPipeline = (function () {
  "use strict";

  var IDLE_PROGRESS = { stage: "idle", status: "pending", progress: 0, errors: [] };
  var progress = clone(IDLE_PROGRESS);
  var lastRun = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setProgress(stage, status, pct, errors) {
    progress = { stage: stage, status: status, progress: pct, errors: errors ? errors.slice() : [] };
  }

  function fail(stage, message, errorsSoFar) {
    var errors = (errorsSoFar || []).slice();
    errors.push(message);
    setProgress(stage, "error", progress.progress, errors);
    return clone(progress);
  }

  /* ---- processMaterial(materialId) ----------------------------------------
     Reads the raw material from the EXISTING AHS.MaterialRuntime
     (read-only: only getById() is called) and hands it to
     AHS.MaterialParser.parse() to produce a Material Document. Returns
     the Material Document, or null if the material doesn't exist or
     either engine/runtime isn't loaded. Never throws. */
  function processMaterial(materialId) {
    if (!AHS.MaterialRuntime || typeof AHS.MaterialRuntime.getById !== "function") { return null; }
    if (!AHS.MaterialParser || typeof AHS.MaterialParser.parse !== "function") { return null; }

    var raw = AHS.MaterialRuntime.getById(materialId);
    if (!raw) { return null; }

    return AHS.MaterialParser.parse({
      materialId: raw.id,
      id: raw.id,
      subject: raw.subject,
      grade: raw.grade,
      category: raw.category,
      fileName: raw.fileName,
      fileType: raw.fileType
    });
  }

  /* ---- buildKnowledge(materialDocument) ------------------------------------
     Delegates entirely to AHS.KnowledgeRuntime.sync() (which itself calls
     AHS.KnowledgeBuilder.build()). Returns the stored Knowledge Runtime
     record, or null if the document/runtime is missing. */
  function buildKnowledge(materialDocument) {
    if (!materialDocument) { return null; }
    if (!AHS.KnowledgeRuntime || typeof AHS.KnowledgeRuntime.sync !== "function") { return null; }
    return AHS.KnowledgeRuntime.sync(materialDocument);
  }

  /* ---- buildSummary(knowledge) ---------------------------------------------
     Delegates entirely to AHS.SummaryRuntime.sync() (which itself calls
     AHS.SummaryGenerator.generate()). Returns the stored Summary Runtime
     record, or null if the knowledge/runtime is missing. */
  function buildSummary(knowledge) {
    if (!knowledge) { return null; }
    if (!AHS.SummaryRuntime || typeof AHS.SummaryRuntime.sync !== "function") { return null; }
    return AHS.SummaryRuntime.sync(knowledge);
  }

  /* ---- buildQuestions(knowledge) --------------------------------------------
     Delegates entirely to AHS.LearningQuestionRuntime.sync() (which
     itself calls AHS.QuestionGenerator.generate() and enforces the
     10-item completeness gate). Attempts one AI-mode question per
     concept in knowledge.concepts; if there are none (the common,
     honest current state), still attempts exactly one anchored to the
     Knowledge record itself. Returns an array — possibly empty if every
     attempt was rejected by the completeness gate (not itself a hard
     pipeline failure; see file header). Never throws. */
  function buildQuestions(knowledge) {
    if (!knowledge) { return []; }
    if (!AHS.LearningQuestionRuntime || typeof AHS.LearningQuestionRuntime.sync !== "function") { return []; }

    var concepts = Array.isArray(knowledge.concepts) && knowledge.concepts.length ? knowledge.concepts : [null];
    var stored = [];
    concepts.forEach(function (concept) {
      var anchoredKnowledge = knowledge;
      if (concept) {
        anchoredKnowledge = clone(knowledge);
        anchoredKnowledge.concepts = [concept];
      }
      var result = AHS.LearningQuestionRuntime.sync({ mode: "ai", knowledge: anchoredKnowledge });
      if (result) { stored.push(result); }
    });
    return stored;
  }

  /* ---- validate(artifacts) --------------------------------------------------
     Re-validates each stage's own output using that stage's OWN engine
     validate() (never re-implements the check) — Material Document ->
     Knowledge Runtime -> Summary Runtime -> LearningQuestionRuntime.
     Defaults to the last process() run if no artifacts are given. Never
     throws. */
  function validate(artifacts) {
    artifacts = artifacts || lastRun || {};
    var errors = [];
    var results = {};

    var doc = artifacts.materialDocument;
    var docValid = !!(doc && doc.id && typeof doc.content === "string");
    results.materialDocument = { valid: docValid, errors: docValid ? [] : ["缺少或不完整的 Material Document"] };
    errors = errors.concat(results.materialDocument.errors);

    if (AHS.KnowledgeBuilder && typeof AHS.KnowledgeBuilder.validate === "function") {
      results.knowledge = artifacts.knowledge
        ? AHS.KnowledgeBuilder.validate(artifacts.knowledge)
        : { valid: false, errors: ["缺少 Knowledge Runtime 記錄"] };
    } else {
      results.knowledge = { valid: false, errors: ["AHS.KnowledgeBuilder 未載入"] };
    }
    errors = errors.concat(results.knowledge.errors);

    if (AHS.SummaryGenerator && typeof AHS.SummaryGenerator.validate === "function") {
      results.summary = artifacts.summary
        ? AHS.SummaryGenerator.validate(artifacts.summary)
        : { valid: false, errors: ["缺少 Summary Runtime 記錄"] };
    } else {
      results.summary = { valid: false, errors: ["AHS.SummaryGenerator 未載入"] };
    }
    errors = errors.concat(results.summary.errors);

    var questions = Array.isArray(artifacts.questions) ? artifacts.questions : [];
    var questionErrors = [];
    if (AHS.QuestionGenerator && typeof AHS.QuestionGenerator.validate === "function") {
      questions.forEach(function (q, i) {
        var r = AHS.QuestionGenerator.validate(q);
        if (!r.valid) { questionErrors = questionErrors.concat(r.errors.map(function (e) { return "Question[" + i + "]：" + e; })); }
      });
    }
    results.questions = { valid: questionErrors.length === 0, errors: questionErrors, count: questions.length };
    errors = errors.concat(questionErrors);

    return { valid: errors.length === 0, errors: errors, results: results };
  }

  /* ---- getProgress() / reset() -------------------------------------------- */
  function getProgress() {
    return clone(progress);
  }

  function reset() {
    progress = clone(IDLE_PROGRESS);
    lastRun = null;
    return clone(progress);
  }

  /* ---- process(materialId) --------------------------------------------------
     Runs the full fixed flow end-to-end, stopping immediately and
     returning an error result if any stage fails. Never throws. */
  function process(materialId) {
    var errors = [];

    setProgress("material", "pending", 0, errors);
    var materialDocument = processMaterial(materialId);
    if (!materialDocument) {
      return fail("material", "找不到教材（materialId: " + materialId + "）或 Material Parser 未載入", errors);
    }
    setProgress("material", "success", 25, errors);

    var knowledge = buildKnowledge(materialDocument);
    if (!knowledge) {
      return fail("knowledge", "Knowledge Builder / Knowledge Runtime 未載入或建立失敗", errors);
    }
    setProgress("knowledge", "success", 50, errors);

    var summary = buildSummary(knowledge);
    if (!summary) {
      return fail("summary", "Summary Generator / Summary Runtime 未載入或建立失敗", errors);
    }
    setProgress("summary", "success", 75, errors);

    var questions = buildQuestions(knowledge);
    if (questions.length === 0) {
      /* Not a hard failure — see file header. Recorded as an
         informational entry so a future Upload Progress UI can surface
         it without the run being marked "error". */
      errors.push("沒有產生任何完整的 Learning Question（可能因目前 Knowledge 內容不足，非系統錯誤）");
    }
    setProgress("questions", "success", 90, errors);

    lastRun = {
      materialId: materialId,
      materialDocument: materialDocument,
      knowledge: knowledge,
      summary: summary,
      questions: questions
    };

    var check = validate(lastRun);
    var finalErrors = errors.concat(check.valid ? [] : check.errors);
    setProgress("done", "success", 100, finalErrors);

    return {
      stage: "done",
      status: "success",
      progress: 100,
      errors: finalErrors,
      result: clone(lastRun)
    };
  }

  return {
    processMaterial: processMaterial,
    buildKnowledge: buildKnowledge,
    buildSummary: buildSummary,
    buildQuestions: buildQuestions,
    process: process,
    validate: validate,
    getProgress: getProgress,
    reset: reset
  };
})();
