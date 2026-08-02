/* js/runtime/TeachingMaterialAdapter.js
   Teaching Material Repository — Adapter.
   PMO Decision (Teaching Material Upload v1.0, LOCK): allowed as one of
   exactly three new pieces (Adapter / Loader / Bridge) whose sole
   purpose is letting the EXISTING, UNMODIFIED MaterialRuntime (and the
   existing, unmodified FolderRuntime / KnowledgeGraphRuntime) read
   Repository content. This file does Shape Mapping ONLY — same rule
   already established by js/runtime/QuestionProviderBridge.js: it never
   calls another Runtime's write API itself, never stores anything, and
   never invents content. It only converts one Teaching Material
   Repository Package (js/data/TeachingMaterialPackage*.js) into the
   plain-object shapes those existing Runtimes' own public add()/
   addNode()/createFolder() functions already accept. No Runtime file is
   modified and no Runtime's public API/signature changes. */
window.AHS = window.AHS || {};
AHS.TeachingMaterialAdapter = (function () {
  "use strict";

  /* toFolderInput(pkg) — shape for the EXISTING AHS.FolderRuntime.createFolder(). */
  function toFolderInput(pkg) {
    return {
      folderName: pkg.chapter || pkg.title || pkg.packageId,
      subject: pkg.subject || null,
      scopeType: "exam",
      description: pkg.metadata && pkg.metadata.sourceExam ? pkg.metadata.sourceExam : ""
    };
  }

  /* toMaterialInput(pkg) — shape for the EXISTING AHS.MaterialRuntime.add().
     folderId must be resolved by the caller (Bridge) and passed in. */
  function toMaterialInput(pkg, folderId) {
    return {
      subject: pkg.subject || "other",
      title: pkg.metadata && pkg.metadata.sourceExam
        ? (pkg.chapter || pkg.packageId)
        : (pkg.chapter || pkg.packageId),
      chapter: pkg.chapter || "未分類",
      grade: pkg.grade || "高一",
      category: "考卷",
      date: (pkg.metadata && pkg.metadata.analyzedAt) || "",
      views: "0",
      content: pkg.summary || "",
      progress: 0,
      fileName: (pkg.packageId || "teaching-material") + ".pdf",
      fileType: "PDF",
      folderId: folderId || null
    };
  }

  /* toDocumentType(pkg) — the Repository already knows this is exam
     analysis content; matches AHS.DocumentClassifierRuntime.TYPES
     enum's "exam" value without needing to re-run classification. */
  function toDocumentType() {
    return "exam";
  }

  /* toGraphNodeInputs(pkg, materialId, folderId, documentType) — shape
     for the EXISTING AHS.KnowledgeGraphRuntime.addNode(), one call per
     pkg.questions[] entry (the hand-verified key points this Package
     carries). Every field required by KnowledgeGraphRuntime.validateNode
     is supplied — sourcePage/sourceParagraph are honestly present
     (index-based, not invented positions in a real document). */
  function toGraphNodeInputs(pkg, materialId, folderId, documentType) {
    var items = Array.isArray(pkg.questions) ? pkg.questions : [];
    return items.map(function (q, i) {
      return {
        type: q.type || "knowledge_point",
        folderId: folderId,
        documentType: documentType,
        label: q.label || String(q.content || "").slice(0, 24),
        content: q.content || "",
        sourceFileId: materialId,
        sourcePage: null,
        sourceParagraph: i
      };
    });
  }

  return {
    toFolderInput: toFolderInput,
    toMaterialInput: toMaterialInput,
    toDocumentType: toDocumentType,
    toGraphNodeInputs: toGraphNodeInputs
  };
})();
