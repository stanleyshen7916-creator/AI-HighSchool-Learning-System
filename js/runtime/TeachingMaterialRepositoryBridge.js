/* js/runtime/TeachingMaterialRepositoryBridge.js
   Teaching Material Repository — Bridge.
   PMO Decision (Teaching Material Upload v1.0, LOCK): allowed as one of
   exactly three new pieces (Adapter / Loader / Bridge). Purpose ONLY:
   let the existing, unmodified MaterialRuntime (and the existing,
   unmodified FolderRuntime / KnowledgeGraphRuntime / KnowledgeSummary
   Runtime / QuestionGenerationRuntime / QuestionProviderBridge) read
   Repository content. This file calls ONLY those Runtimes' own already-
   public functions — it never redefines them, never reaches into their
   internal state, and never changes their signatures. Nothing here is a
   second question-generation engine or a second summary engine: every
   real summary/question still comes from KnowledgeSummaryRuntime /
   QuestionGenerationRuntime exactly as it does for any uploaded file —
   this Bridge only supplies the Knowledge Graph content those two
   Runtimes already require, sourced from a hand-verified Repository
   Package instead of the (stub) real-document parser.

   Idempotent by design (this file self-runs on every page load that
   includes it):
     - Material / Folder: found-or-created by matching (title, subject,
       chapter) — never re-added once present, so reloading the page
       never creates duplicate materials or folders.
     - Knowledge Graph nodes: KnowledgeGraphRuntime.addNode() already
       merges structural/content nodes by natural key, so re-running is
       safe on its own.
     - Summary / Question generation: both Runtimes replace-by-materialId
       (never accumulate), and both are documented MEMORY ONLY (reset on
       full page load), so re-deriving them every load is the correct,
       intended behaviour, not a workaround.
     - Quiz Practice Mode (QuestionProviderBridge.bridge): its two
       targets (LearningQuestionSession / LearningQuestionRuntime) DO
       persist across page loads and simply push on every add(), with no
       de-dup of their own — so this Bridge only calls
       QuestionProviderBridge.bridge() the first time a material has no
       bridged questions yet, to avoid piling up duplicate quiz entries
       on repeated visits. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialRepositoryBridge = (function () {
  "use strict";

  function has(obj, fn) { return !!(obj && typeof obj[fn] === "function"); }

  function findFolder(pkg) {
    if (!has(AHS.FolderRuntime, "listFolders")) { return null; }
    var name = (AHS.TeachingMaterialAdapter.toFolderInput(pkg)).folderName;
    var found = null;
    AHS.FolderRuntime.listFolders().forEach(function (f) {
      if (f.folderName === name && f.subject === pkg.subject) { found = f; }
    });
    return found;
  }

  function ensureFolder(pkg) {
    var existing = findFolder(pkg);
    if (existing) { return existing.folderId; }
    if (!has(AHS.FolderRuntime, "createFolder")) { return null; }
    var created = AHS.FolderRuntime.createFolder(AHS.TeachingMaterialAdapter.toFolderInput(pkg));
    return created ? created.folderId : null;
  }

  function findMaterial(pkg) {
    if (!has(AHS.MaterialRuntime, "list")) { return null; }
    var title = AHS.TeachingMaterialAdapter.toMaterialInput(pkg, null).title;
    var found = null;
    AHS.MaterialRuntime.list().forEach(function (m) {
      if (m.title === title && m.subject === pkg.subject && m.chapter === pkg.chapter) { found = m; }
    });
    return found;
  }

  function ensureMaterial(pkg, folderId) {
    var existing = findMaterial(pkg);
    if (existing) { return existing; }
    if (!has(AHS.MaterialRuntime, "add")) { return null; }
    return AHS.MaterialRuntime.add(AHS.TeachingMaterialAdapter.toMaterialInput(pkg, folderId));
  }

  /* isNewMaterial: buildFromMaterial() has no natural-key merge for its
     source_file/document_type nodes (confirmed by reading
     KnowledgeGraphRuntime.js — only subject/chapter/content-type nodes
     merge), so calling it again for an already-known material would
     pile up duplicate skeleton nodes on every page load. Content nodes
     (from pkg.questions[]) DO merge by natural key, so those are always
     safe to re-add. */
  function ensureGraph(pkg, material, folderId, isNewMaterial) {
    if (!has(AHS.KnowledgeGraphRuntime, "addNode") || !material) { return; }
    if (isNewMaterial && has(AHS.KnowledgeGraphRuntime, "buildFromMaterial")) {
      AHS.KnowledgeGraphRuntime.buildFromMaterial(material, { documentType: AHS.TeachingMaterialAdapter.toDocumentType() });
    }
    var documentType = AHS.TeachingMaterialAdapter.toDocumentType();
    AHS.TeachingMaterialAdapter.toGraphNodeInputs(pkg, material.id, folderId, documentType)
      .forEach(function (nodeInput) { AHS.KnowledgeGraphRuntime.addNode(nodeInput); });
  }

  function refreshSummary(materialId) {
    if (has(AHS.KnowledgeSummaryRuntime, "createSummary")) {
      AHS.KnowledgeSummaryRuntime.createSummary(materialId);
    }
  }

  function refreshQuestions(materialId) {
    if (has(AHS.QuestionGenerationRuntime, "generateQuestions")) {
      AHS.QuestionGenerationRuntime.generateQuestions(materialId);
    }
  }

  function bridgeQuizOnce(materialId) {
    if (!has(AHS.QuestionProviderBridge, "bridge")) { return; }
    var already = has(AHS.LearningQuestionRuntime, "findByMaterialId")
      ? AHS.LearningQuestionRuntime.findByMaterialId(materialId) : [];
    if (Array.isArray(already) && already.length) { return; }
    AHS.QuestionProviderBridge.bridge(materialId);
  }

  /* importAll() — the one entry point. Reads every Package the
     Repository Index lists (via the Loader) and, for each, ensures the
     existing Runtimes have real, non-empty Material / Knowledge Graph /
     Summary / Question / Quiz content. Returns a per-package outcome
     report (used by the verification check, never required for normal
     operation). */
  function importAll() {
    if (!has(AHS.TeachingMaterialLoader, "list") || !has(AHS.TeachingMaterialAdapter, "toMaterialInput")) {
      return [];
    }
    var report = [];
    AHS.TeachingMaterialLoader.list().forEach(function (pkg) {
      var folderId = ensureFolder(pkg);
      var preExisting = findMaterial(pkg);
      var material = preExisting || ensureMaterial(pkg, folderId);
      if (!material) { report.push({ packageId: pkg.packageId, materialId: null, imported: false }); return; }

      ensureGraph(pkg, material, folderId, !preExisting);
      refreshSummary(material.id);
      refreshQuestions(material.id);
      bridgeQuizOnce(material.id);

      report.push({ packageId: pkg.packageId, materialId: material.id, imported: true });
    });
    return report;
  }

  /* Self-run at script load — additive-only bootstrap, no change to any
     page's existing bootstrap file (AppMaterials.js etc.) is needed. */
  var lastImportReport = importAll();

  return {
    importAll: importAll,
    getLastImportReport: function () { return lastImportReport.slice(); }
  };
})();
