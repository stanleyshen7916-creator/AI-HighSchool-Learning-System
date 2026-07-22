/* js/runtime/KnowledgeGraphRuntime.js — Sprint 8.0 · EO-S8.0-001
   Module 2 · Knowledge Graph Builder — the Single Source of Truth for
   every AI feature (Core Principle: no AI module ever analyzes the
   material directly; they read THIS graph).

   ONE shared graph. Multiple File Rule: every uploaded file (教材/講義/
   筆記/考卷/解答) builds INTO the same graph — structural nodes
   (subject/chapter/section) merge by natural key so files about the
   same chapter interlink automatically; nothing is analyzed in
   isolation.

   Node types (fixed enum): subject | chapter | section |
   knowledge_point | definition | formula | keyword | example |
   question | answer | explanation | source_file.

   Every node carries the mandated trace fields — sourceFileId is
   REQUIRED (validation-rejected otherwise); sourcePage /
   sourceParagraph are always present, honestly null until a real
   parser exists (never invented). materialIds[] records every file
   that contributed the node (multi-file merge trail).

   EO-S8.0-004: content nodes (knowledge_point / definition / formula /
   keyword / concept) are now accepted, but ONLY with a complete trace —
   folderId + sourceFileId + documentType required, sourcePage /
   sourceParagraph present (null allowed, never guessed).

   Honesty (hard): buildFromMaterial() creates ONLY what is truly known
   from real metadata — source_file, document_type, subject, chapter.
   sourcePage / sourceParagraph are ALWAYS null here (no parser exists;
   never invented). Content nodes are refused outright (Decision 2), so
   Mock/Fake knowledge has no entry path whatsoever. */
window.AHS = window.AHS || {};
AHS.KnowledgeGraphRuntime = (function () {
  "use strict";
  var STORAGE_KEY = "knowledgeGraph";
  /* EO-S8.0-004 · Analysis Pipeline Integration — the content-node
     whitelist is now UNLOCKED for exactly the five Knowledge types the
     Analysis Pipeline produces. Downstream artefact types stay
     permanently forbidden: Summary / Question / Answer / Review /
     WrongBook must be built ON TOP of this graph by their own
     Runtimes, never stored as graph nodes (PMO Decision 019).
     (The EO text cites "Decision 021"; the whitelist established in
     EO-S8.0-001's PMO Final Decision was numbered Decision 2 — same
     rule, noted in the EO report.) */
  var SKELETON_TYPES = ["subject", "chapter", "section", "source_file", "document_type", "metadata"];
  var CONTENT_TYPES = ["knowledge_point", "definition", "formula", "keyword", "concept"];
  var NODE_TYPES = SKELETON_TYPES.concat(CONTENT_TYPES);
  var FORBIDDEN_TYPES = ["summary", "question", "answer", "review", "wrongbook",
    "explanation", "exam_point", "dashboard", "progress", "study_progress"];

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.nodes) && Array.isArray(loaded.edges)) { return loaded; }
    }
    return null;
  }
  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }
  var store = hydrate() || { nodes: [], edges: [], seq: 0 };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function nextId() { store.seq += 1; return "kg_" + store.seq; }

  function findNode(id) {
    var found = null;
    store.nodes.forEach(function (n) { if (n.id === id) { found = n; } });
    return found;
  }

  /* Structural nodes merge by natural key — the multi-file join. */
  function naturalKey(type, label, parentId) {
    return type + "::" + String(label || "").trim() + "::" + (parentId || "");
  }
  function findByNaturalKey(key) {
    var found = null;
    store.nodes.forEach(function (n) { if (n.naturalKey === key) { found = n; } });
    return found;
  }

  function validateNode(node) {
    var errors = [];
    node = node || {};
    if (FORBIDDEN_TYPES.indexOf(node.type) !== -1) {
      errors.push("節點型別「" + node.type + "」為下游產物，不得存入 Knowledge Graph（PMO Decision 019）");
    } else if (NODE_TYPES.indexOf(node.type) === -1) { errors.push("node type 不合法"); }
    /* EO-S8.0-004 Source Traceability: a CONTENT node must carry its
       Study Scope (folderId) as well as its file trace — 任一缺漏拒絕寫入，
       不得猜測。Skeleton nodes keep their original contract. */
    if (CONTENT_TYPES.indexOf(node.type) !== -1) {
      if (!node.folderId) { errors.push("內容節點缺少 folderId（Folder Scope 必要，不得跨 Folder 建立）"); }
      if (!node.documentType) { errors.push("內容節點缺少 documentType"); }
    }
    if (!String(node.label || "").trim()) { errors.push("label 不得為空"); }
    if (!node.sourceFileId) { errors.push("缺少 sourceFileId（所有節點必須可追溯）"); }
    if (!("sourcePage" in (node || {}))) { errors.push("缺少 sourcePage 欄位（可為 null，不得省略）"); }
    if (!("sourceParagraph" in (node || {}))) { errors.push("缺少 sourceParagraph 欄位（可為 null，不得省略）"); }
    return { valid: errors.length === 0, errors: errors };
  }

  /* addNode(input) — validated; structural types merge by natural key
     (adds the new sourceFileId/materialId to the existing node instead
     of duplicating). Returns the stored node or null. */
  function addNode(input) {
    input = input || {};
    var node = {
      id: input.id || null,
      type: input.type,
      folderId: input.folderId || null,
      documentType: input.documentType || null,
      label: String(input.label || "").trim(),
      content: String(input.content || ""),
      sourceFileId: input.sourceFileId || null,
      sourcePage: (input.sourcePage === undefined) ? null : input.sourcePage,
      sourceParagraph: (input.sourceParagraph === undefined) ? null : input.sourceParagraph,
      materialIds: Array.isArray(input.materialIds) ? input.materialIds.slice()
        : (input.sourceFileId ? [input.sourceFileId] : []),
      meta: (input.meta && typeof input.meta === "object") ? input.meta : {}
    };
    var check = validateNode(node);
    if (!check.valid) { return null; }

    /* Merge-by-natural-key. Structural nodes merge across files (the
       Multiple File Rule). EO-S8.0-004: CONTENT nodes also carry a
       natural key — type + text + source file + paragraph — so
       re-running the Analysis Pipeline on the same material updates
       rather than duplicates the graph (idempotent re-analysis). */
    var structural = (node.type === "subject" || node.type === "chapter" || node.type === "section");
    var contentNode = CONTENT_TYPES.indexOf(node.type) !== -1;
    if (structural || contentNode) {
      node.naturalKey = structural
        ? naturalKey(node.type, node.label, input.parentId || "")
        : naturalKey(node.type, node.label + "@" + node.sourceFileId, String(node.sourceParagraph));
      var existing = findByNaturalKey(node.naturalKey);
      if (existing) {
        node.materialIds.forEach(function (m) {
          if (existing.materialIds.indexOf(m) === -1) { existing.materialIds.push(m); }
        });
        persist();
        return clone(existing);
      }
    }
    node.id = node.id || nextId();
    store.nodes.push(node);
    persist();
    return clone(node);
  }

  function addEdge(fromId, toId, relation) {
    if (!findNode(fromId) || !findNode(toId) || !String(relation || "").trim()) { return null; }
    var edge = { from: fromId, to: toId, relation: String(relation) };
    var dup = store.edges.some(function (e) {
      return e.from === edge.from && e.to === edge.to && e.relation === edge.relation;
    });
    if (!dup) { store.edges.push(edge); persist(); }
    return clone(edge);
  }

  /* buildFromMaterial(material, classification) — the honest structural
     build: source_file node + subject/chapter/section from REAL
     metadata, all edges linked. No content is invented. */
  function buildFromMaterial(material, classification) {
    if (!material || !material.id) { return null; }
    var src = addNode({
      type: "source_file", label: material.fileName || material.title || material.id,
      sourceFileId: material.id, sourcePage: null, sourceParagraph: null,
      meta: {
        documentType: (classification && classification.documentType) || "other",
        fileType: material.fileType || "", title: material.title || ""
      }
    });
    var dt = addNode({
      type: "document_type", label: (classification && classification.documentType) || "other",
      sourceFileId: material.id, sourcePage: null, sourceParagraph: null,
      meta: { signal: (classification && classification.signal) || "none" }
    });
    addEdge(src.id, dt.id, "classified_as");
    var subj = addNode({
      type: "subject", label: material.subject || "unknown",
      sourceFileId: material.id, sourcePage: null, sourceParagraph: null
    });
    addEdge(src.id, subj.id, "belongs_to");
    var chapterId = null;
    if (material.chapter && material.chapter !== "未分類") {
      var ch = addNode({
        type: "chapter", label: material.chapter, parentId: subj.id,
        sourceFileId: material.id, sourcePage: null, sourceParagraph: null
      });
      addEdge(subj.id, ch.id, "has_chapter");
      addEdge(src.id, ch.id, "covers");
      chapterId = ch.id;
    }
    return { sourceFileNode: src, documentTypeNode: dt, subjectNode: subj, chapterNodeId: chapterId };
  }

  function getNode(id) { var n = findNode(id); return n ? clone(n) : null; }
  function queryByType(type) { return clone(store.nodes.filter(function (n) { return n.type === type; })); }
  /* Folder Scope query — every content node belongs to exactly one
     Study Scope (EO-S8.0-004). */
  function queryByFolder(folderId) {
    return clone(store.nodes.filter(function (n) { return n.folderId === folderId; }));
  }
  function queryByMaterial(materialId) {
    return clone(store.nodes.filter(function (n) { return n.materialIds.indexOf(materialId) !== -1; }));
  }
  function neighbors(id, relation) {
    var out = [];
    store.edges.forEach(function (e) {
      if (e.from === id && (!relation || e.relation === relation)) {
        var n = findNode(e.to); if (n) { out.push(clone(n)); }
      }
    });
    return out;
  }
  function stats() {
    var byType = {};
    store.nodes.forEach(function (n) { byType[n.type] = (byType[n.type] || 0) + 1; });
    return { nodes: store.nodes.length, edges: store.edges.length, byType: byType };
  }
  function reset() { store = { nodes: [], edges: [], seq: 0 }; persist(); }

  return {
    addNode: addNode, addEdge: addEdge, buildFromMaterial: buildFromMaterial,
    getNode: getNode, queryByType: queryByType, queryByMaterial: queryByMaterial,
    neighbors: neighbors, stats: stats, validateNode: validateNode,
    NODE_TYPES: NODE_TYPES.slice(), SKELETON_TYPES: SKELETON_TYPES.slice(),
    CONTENT_TYPES: CONTENT_TYPES.slice(), FORBIDDEN_TYPES: FORBIDDEN_TYPES.slice(),
    queryByFolder: queryByFolder, reset: reset
  };
})();
