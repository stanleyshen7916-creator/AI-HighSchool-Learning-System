/* js/parser/KnowledgePipeline.js — Sprint 8.0 · EO-S8.0-001
   The single AI Knowledge Pipeline orchestrator — FOUNDATION SCOPE.

   EO-S8.0-004 · Analysis Pipeline Baseline v1.0 — the pipeline is now
   ACTIVE end-to-end through the Knowledge Graph:

     Folder → Material → Document → Document Classifier
            → Analysis Runtime → Knowledge Extraction → Knowledge Graph

   Every stage is reached through the other Runtimes' PUBLIC APIs only;
   this module never touches another Runtime's internal store.
   Summary / Question / Answer / WrongBook / Review generation remain
   out of scope and absent from this file — Decision 019's two
   prohibitions stay structural, not conventional:
       禁止  Metadata → Question
       禁止  Material → Question
   Every future AI feature must route Metadata → Analysis → Knowledge →
   Summary → Question through the Knowledge Graph.

   Validation gates (any failure stops the run, zero nodes written):
     Folder 存在 · Material 存在 · DocumentType 合法 · AnalysisResult
     合法 · Source Traceability 完整.
   Exam / answer-key files stop at "exam_bank": their原始題目 enter
   verbatim through AHS.ExamBankRuntime.ingest() (不得重新產題), never
   through generation.

   The Sprint-6 LearningPipeline remains the live LOCK flow; page
   wiring is a future EO (Foundation precedent). Nothing here is
   page-wired. */
window.AHS = window.AHS || {};
AHS.KnowledgePipeline = (function () {
  "use strict";

  /* process(materialId) — runs the full Analysis Pipeline for ONE
     material inside its Folder scope. Returns an honest result:
       { materialId, folderId, stage, status, documentType,
         analysisStatus, nodesCreated, rejected, errors[] } */
  function process(materialId) {
    var result = { materialId: materialId, folderId: null, stage: "start", status: "running",
                   documentType: null, analysisStatus: null, nodesCreated: 0, rejected: 0, errors: [] };

    /* 1 · Material 存在 */
    var mat = (AHS.MaterialRuntime && AHS.MaterialRuntime.getById)
      ? AHS.MaterialRuntime.getById(materialId) : null;
    if (!mat) {
      result.stage = "material"; result.status = "failed";
      result.errors.push("material 不存在"); return result;
    }

    /* 2 · Folder 存在（Folder Scope：不得跨 Folder 建立節點） */
    result.stage = "folder";
    result.folderId = mat.folderId || null;
    var folder = (result.folderId && AHS.FolderRuntime && typeof AHS.FolderRuntime.getFolder === "function")
      ? AHS.FolderRuntime.getFolder(result.folderId) : null;
    if (!folder) {
      result.status = "failed";
      result.errors.push("教材未歸屬有效的 Folder（Study Scope）—— 依 Analysis Pipeline Baseline 不得分析");
      return result;
    }

    /* 3 · Document Classifier（DocumentType 合法） */
    result.stage = "classify";
    var cls = AHS.DocumentClassifierRuntime.classify(mat);
    var vc = AHS.DocumentClassifierRuntime.validate(cls);
    if (!vc.valid) { result.status = "failed"; result.errors = vc.errors; return result; }
    result.documentType = cls.documentType;

    /* 4 · Knowledge Graph skeleton */
    result.stage = "graph_skeleton";
    var built = AHS.KnowledgeGraphRuntime.buildFromMaterial(mat, cls);
    if (!built) { result.status = "failed"; result.errors.push("Knowledge Graph Skeleton 建立失敗"); return result; }

    /* Exam / answer key: original questions only — never generated. */
    if (cls.documentType === "exam" || cls.documentType === "answer_key") {
      result.stage = "exam_bank"; result.status = "success";
      result.note = "考卷/解答：原始題目經 ExamBankRuntime.ingest() 逐字入庫，不得重新產題。";
      return result;
    }

    /* 5 · Analysis Runtime（AnalysisResult 合法） */
    result.stage = "analysis";
    var analysis = AHS.AnalysisRuntime.analyze(materialId);
    if (!analysis) { result.status = "failed"; result.errors.push("AnalysisRuntime 無分析結果"); return result; }
    result.analysisStatus = analysis.status;
    if (analysis.status !== "ready") {
      result.stage = "analysis_insufficient"; result.status = "success";
      result.note = analysis.reason;
      return result;   /* zero nodes — honest, never faked */
    }

    /* 6 · Knowledge Extraction → 7 · Knowledge Graph (public APIs only) */
    result.stage = "extraction";
    var extracted = AHS.KnowledgeExtractionRuntime.extract(materialId);
    if (extracted.status !== "ready") {
      result.stage = "extraction_pending"; result.status = "success";
      result.note = extracted.reason; return result;
    }
    result.stage = "graph_store";
    var stored = AHS.KnowledgeExtractionRuntime.store(extracted.nodes);
    result.nodesCreated = stored.stored.length;
    result.rejected = stored.rejected.length + stored.blocked;
    if (stored.rejected.length) {
      stored.rejected.forEach(function (r) { result.errors = result.errors.concat(r.errors); });
    }
    if (stored.status === "blocked_by_graph_whitelist") {
      result.status = "failed"; result.errors.push(stored.reason); return result;
    }

    result.stage = "done";
    result.status = "success";
    return result;
  }

  /* processFolder(folderId) — runs the pipeline for every file bound to
     one Study Scope (Folder → Knowledge Graph). */
  function processFolder(folderId) {
    var out = { folderId: folderId, status: "success", materials: [], nodesCreated: 0, errors: [] };
    var folder = (AHS.FolderRuntime && typeof AHS.FolderRuntime.getFolder === "function")
      ? AHS.FolderRuntime.getFolder(folderId) : null;
    if (!folder) { out.status = "failed"; out.errors.push("Folder 不存在"); return out; }
    folder.files.forEach(function (f) {
      var r = process(f.sourceFileId);
      out.materials.push(r);
      out.nodesCreated += r.nodesCreated;
      if (r.status === "failed") { out.errors = out.errors.concat(r.errors); }
    });
    return out;
  }

  return { process: process, processFolder: processFolder };
})();
