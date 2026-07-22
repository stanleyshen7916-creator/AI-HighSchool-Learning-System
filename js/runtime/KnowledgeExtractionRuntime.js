/* js/runtime/KnowledgeExtractionRuntime.js — Sprint 8.0 · EO-S8.0-002
   Knowledge Extraction Foundation（Knowledge Foundation 第二階段）.

   Fixed position in the LOCKed flow (PMO Decision 019):
     Document → Metadata → AnalysisRuntime → KnowledgeExtractionRuntime
              → KnowledgeGraphRuntime
   Nothing downstream exists here. This module NEVER produces Summary,
   Question, Answer, Explanation, WrongBook, Review, Dashboard or any
   Study Progress, and it never calls LearningQuestionGenerator,
   LearningQuestionSession or AnswerBuilderRuntime — verified by a
   source-scan assertion in tests/regression/KnowledgeExtractionV1.js,
   so the prohibition is structural rather than conventional.

   Public API — exactly four (不得新增其他公開 API):
     extract(materialId)   gather candidate Knowledge Nodes
     validate(node)        Knowledge Node schema validation
     store(nodes)          persist — KnowledgeGraphRuntime ONLY
     status(materialId)    "pending" | "ready" | "stored" | "unknown"

   Allowed node types (fixed): knowledge_point | definition | formula |
   keyword | concept.
   Forbidden types (rejected by validate): summary | question | answer |
   explanation | wrongbook | review | dashboard | progress | study_progress.

   AnalysisRuntime integration (EO-S8.0-004): the pending lock is
   lifted. extract() now builds Knowledge Nodes when — and only when —
   AnalysisRuntime reports status "ready". Any other status
   ("insufficient_source", "pending_analysis_pipeline", missing result)
   produces ZERO nodes and an honest status; 不得 Fake Extraction still
   holds absolutely. There is no code path in this module that invents
   node content: candidates are only ever read from a real
   AnalysisRuntime result, each item carrying its own text,
   sourceFileId, sourcePage and sourceParagraph verbatim.

   Traceability (EO-S8.0-004, six fields): knowledgeId (assigned by the
   graph on store), folderId (the material's Study Scope — read from
   the real material record; a material outside any Folder is REFUSED,
   so no cross-folder node can exist), sourceFileId, sourcePage,
   sourceParagraph, documentType (from DocumentClassifierRuntime —
   never guessed). Any missing field ⇒ validate() rejects.

   Storage boundary: store() writes through AHS.KnowledgeGraphRuntime
   .addNode() and nothing else. The graph's content-node whitelist was
   unlocked by EO-S8.0-004, so validated nodes now persist; a refusal
   is still reported honestly (blocked_by_graph_whitelist) rather than
   bypassed. */
window.AHS = window.AHS || {};
AHS.KnowledgeExtractionRuntime = (function () {
  "use strict";

  var STORAGE_KEY = "knowledgeExtraction";
  var ALLOWED_TYPES = ["knowledge_point", "definition", "formula", "keyword", "concept"];
  var FORBIDDEN_TYPES = ["summary", "question", "answer", "explanation",
    "wrongbook", "review", "dashboard", "progress", "study_progress"];

  /* AnalysisRuntime section → Knowledge Node type (deterministic). */
  var SECTION_TYPE = {
    coreConcepts: "concept",
    definitions: "definition",
    keywords: "keyword",
    formulas: "formula"
  };

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.runs)) { return loaded; }
    }
    return null;
  }
  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store_);
    }
  }
  var store_ = hydrate() || { runs: [] };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function folderIdFor(materialId) {
    var mr = AHS.MaterialRuntime;
    if (!mr || typeof mr.getById !== "function") { return null; }
    var m = mr.getById(materialId);
    return (m && m.folderId) ? m.folderId : null;
  }

  function documentTypeFor(materialId) {
    var dc = AHS.DocumentClassifierRuntime;
    if (!dc || typeof dc.getByMaterialId !== "function") { return null; }
    var rec = dc.getByMaterialId(materialId);
    return rec ? rec.documentType : null;
  }

  function recordRun(materialId, state, detail) {
    store_.runs = store_.runs.filter(function (r) { return r.materialId !== materialId; });
    store_.runs.push({
      materialId: materialId, state: state,
      nodeCount: (detail && detail.nodeCount) || 0,
      reason: (detail && detail.reason) || null,
      at: new Date().toISOString()
    });
    persist();
  }

  /* ---- extract(materialId) --------------------------------------------
     Reads AnalysisRuntime only. Returns:
       { materialId, status, nodes: [...], reason }
     status "pending" whenever AnalysisRuntime is not yet producing real
     content — with an empty nodes array and nothing stored. */
  function extract(materialId) {
    var result = { materialId: materialId || null, status: "unknown", nodes: [], reason: null };
    if (!materialId) { result.reason = "缺少 materialId"; return result; }

    var an = AHS.AnalysisRuntime;
    if (!an || typeof an.analyze !== "function") {
      result.status = "pending";
      result.reason = "AnalysisRuntime 未載入";
      recordRun(materialId, result.status, { reason: result.reason });
      return result;
    }

    var analysis = an.analyze(materialId);
    if (!analysis) {
      result.status = "pending";
      result.reason = "AnalysisRuntime 無此教材之分析結果（Knowledge Graph 尚無節點）";
      recordRun(materialId, result.status, { reason: result.reason });
      return result;
    }

    /* Hard gate — nodes only when the analysis is genuinely ready.
       不得 Fake Extraction. */
    if (analysis.status !== "ready") {
      result.status = "pending";
      result.reason = analysis.reason ||
        ("AnalysisRuntime 狀態為 " + analysis.status + " —— 不得建立 Knowledge Node。");
      recordRun(materialId, result.status, { reason: result.reason });
      return result;
    }

    /* Folder Scope (EO-S8.0-004): every node belongs to exactly one
       Study Scope. A material outside any Folder cannot be analyzed —
       不得跨 Folder 建立節點。 */
    var folderId = folderIdFor(materialId);
    if (!folderId) {
      result.status = "pending";
      result.reason = "教材未歸屬任何 Folder（Study Scope）—— 依 Folder Scope 規則不得建立 Knowledge Node。";
      recordRun(materialId, result.status, { reason: result.reason });
      return result;
    }

    /* Real content path (reachable once the Analysis Pipeline EO ships):
       every candidate is copied verbatim from an analysis item, with
       its own trace fields — nothing is composed here. */
    var docType = documentTypeFor(materialId);
    var sections = analysis.sections || analysis;
    Object.keys(SECTION_TYPE).forEach(function (sec) {
      var items = Array.isArray(sections[sec]) ? sections[sec] : [];
      items.forEach(function (it) {
        result.nodes.push({
          type: SECTION_TYPE[sec],
          label: String(it.text || ""),
          content: String(it.text || ""),
          knowledgeId: it.knowledgeId || null,
          folderId: folderId,
          sourceFileId: it.sourceFileId || materialId,
          sourcePage: (it.sourcePage === undefined) ? null : it.sourcePage,
          sourceParagraph: (it.sourceParagraph === undefined) ? null : it.sourceParagraph,
          documentType: docType
        });
      });
    });
    result.status = result.nodes.length ? "ready" : "pending";
    if (!result.nodes.length) { result.reason = "分析結果不含可建立之知識內容"; }
    recordRun(materialId, result.status, { nodeCount: result.nodes.length, reason: result.reason });
    return result;
  }

  /* ---- validate(node) --------------------------------------------------- */
  function validate(node) {
    var errors = [];
    node = node || {};

    if (FORBIDDEN_TYPES.indexOf(node.type) !== -1) {
      errors.push("型別「" + node.type + "」為禁止建立之下游資料（EO-S8.0-002 Forbidden Types）");
    } else if (ALLOWED_TYPES.indexOf(node.type) === -1) {
      errors.push("type 不合法（僅允許：" + ALLOWED_TYPES.join(" / ") + "）");
    }
    if (!String(node.label || "").trim() && !String(node.content || "").trim()) {
      errors.push("label／content 不得同時為空");
    }
    if (!node.folderId) { errors.push("缺少 folderId（Folder Scope 必要，不得跨 Folder 建立）"); }
    if (!node.sourceFileId) { errors.push("缺少 sourceFileId（來源追溯必要）"); }
    if (!("sourcePage" in node)) { errors.push("缺少 sourcePage 欄位（無資料時須為 null，不得省略）"); }
    if (!("sourceParagraph" in node)) { errors.push("缺少 sourceParagraph 欄位（無資料時須為 null，不得省略）"); }
    if (!("documentType" in node)) { errors.push("缺少 documentType 欄位"); }
    if (!("knowledgeId" in node)) { errors.push("缺少 knowledgeId 欄位（store 後由 Knowledge Graph 指派）"); }

    return { valid: errors.length === 0, errors: errors };
  }

  /* ---- store(nodes) -----------------------------------------------------
     Writes to AHS.KnowledgeGraphRuntime ONLY. Never touches Summary,
     Question Bank, WrongBook, Review or Dashboard (no reference to any
     of them exists in this file). Every node must pass validate()
     first; a rejected node is skipped with its reason. */
  function store(nodes) {
    var list = Array.isArray(nodes) ? nodes : (nodes ? [nodes] : []);
    var out = { status: "ok", stored: [], rejected: [], blocked: 0 };
    var kg = AHS.KnowledgeGraphRuntime;
    if (!kg || typeof kg.addNode !== "function") {
      out.status = "unavailable";
      return out;
    }

    list.forEach(function (node) {
      var check = validate(node);
      if (!check.valid) {
        out.rejected.push({ node: node, errors: check.errors });
        return;
      }
      var stored = kg.addNode({
        type: node.type, label: node.label, content: node.content,
        folderId: node.folderId, documentType: node.documentType,
        sourceFileId: node.sourceFileId,
        sourcePage: node.sourcePage, sourceParagraph: node.sourceParagraph,
        meta: { documentType: node.documentType, origin: "EO-S8.0-004" }
      });
      if (!stored) {
        /* PMO Decision 2 whitelist refuses content nodes today. The
           guard is LOCK — reported, never bypassed. */
        out.blocked += 1;
        return;
      }
      out.stored.push(Object.assign({}, node, { knowledgeId: stored.id }));
    });

    if (out.blocked > 0 && !out.stored.length) {
      out.status = "blocked_by_graph_whitelist";
      out.reason = "KnowledgeGraphRuntime 目前僅接受 Skeleton 節點（PMO Decision 2）；內容節點待 Analysis Pipeline EO 由 PMO 解除白名單。";
    } else if (out.rejected.length && !out.stored.length) {
      out.status = "rejected";
    }
    return out;
  }

  /* ---- status(materialId) ----------------------------------------------- */
  function status(materialId) {
    if (!materialId) { return "unknown"; }
    var kg = AHS.KnowledgeGraphRuntime;
    if (kg && typeof kg.queryByMaterial === "function") {
      var hasContent = kg.queryByMaterial(materialId).some(function (n) {
        return ALLOWED_TYPES.indexOf(n.type) !== -1;
      });
      if (hasContent) { return "stored"; }
    }
    var run = null;
    store_.runs.forEach(function (r) { if (r.materialId === materialId) { run = r; } });
    return run ? run.state : "unknown";
  }

  return { extract: extract, validate: validate, store: store, status: status };
})();
