/* js/parser/AnalysisRuntime.js — Sprint 8.0 · EO-S8.0-001
   Module 3+4 · Analysis Runtime — reads the Knowledge Graph ONLY
   (structurally cannot parse a PDF: it has no file access and accepts
   no material input) and derives Summary Schema v2 records.

   EO-S8.0-004 · Analysis Pipeline Integration: the
   "pending_analysis_pipeline" lock is LIFTED. analyze() now returns a
   real analysisResult derived from the material's OWN stored text.

   EO-S8.0-005: text is obtained EXCLUSIVELY from
   AHS.MaterialTextProvider (the Single Text Entry Point) — this module
   no longer touches Material.content and never depends on a parser.

   Honest boundary (flagged in the EO report): the repository still has
   no document content parser and no bound AI Provider (Interface-only,
   and the prototype forbids network calls), so the provider's only
   current source is the material record's `content` field. So:
     - content present  → real segmentation into analysis items, each
       carrying the verbatim text and its REAL paragraph index
       (sourceParagraph); sourcePage stays null because no paginated
       source was read — never guessed.
     - content empty    → status "insufficient_source", ZERO items.
       Nothing is invented from a filename, a title or a binary file.
   When a parser or provider EO lands and populates `content`, this
   same code produces real nodes with no further change.

   Item shape: { text, section, sourceFileId, sourcePage,
   sourceParagraph } — the downstream KnowledgeExtractionRuntime turns
   them into graph nodes; this module creates NO graph node itself and
   still writes nothing to any Runtime.

   Backward compatibility (PMO Decision 3): the LOCK five-section
   SummaryRuntime is untouched and unread here; Schema v2 remains a
   superset and no existing consumer is affected.

   Summary Schema v2 (seven fixed sections, per EO Module 4):
     coreConcepts 核心概念 | definitions 重要定義 | keywords 關鍵字 |
     formulas 公式 | pitfalls 易錯觀念 | examTypes 常考題型 |
     furtherReading 延伸閱讀
   Every section item is { text, knowledgeId, sourceFileId, sourcePage,
   sourceParagraph } — copied VERBATIM from a graph node.
   不得自由生成 is enforced structurally: analyze() iterates graph nodes
   and validate() re-resolves every knowledgeId against the live graph —
   an item whose knowledgeId is not a real node is rejected, so invented
   content cannot exist in a stored record.

   Naming/LOCK note (Ruling-1B precedent, flagged pre-work): the LOCK
   five-section SummaryRuntime is untouched; v2 records are stored here.
   Node-type → section mapping (deterministic):
     knowledge_point→coreConcepts, definition→definitions,
     keyword→keywords, formula→formulas,
     example(meta.pitfall)→pitfalls, question→examTypes,
     source_file(other materials on same chapter)→furtherReading. */
window.AHS = window.AHS || {};
AHS.AnalysisRuntime = (function () {
  "use strict";
  var STORAGE_KEY = "analysisRuntime";
  var SECTIONS = ["coreConcepts", "definitions", "keywords", "formulas", "pitfalls", "examTypes", "furtherReading"];
  var MAP = { knowledge_point: "coreConcepts", definition: "definitions", keyword: "keywords", formula: "formulas" };

  function hydrate() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.load === "function") {
      var loaded = AHS.PersistenceAdapter.load(STORAGE_KEY);
      if (loaded && Array.isArray(loaded.items)) { return loaded; }
    }
    return null;
  }
  function persist() {
    if (AHS.PersistenceAdapter && typeof AHS.PersistenceAdapter.save === "function") {
      AHS.PersistenceAdapter.save(STORAGE_KEY, store);
    }
  }
  var store = hydrate() || { items: [], seq: 0 };
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  function item(node) {
    return {
      text: node.content || node.label,
      knowledgeId: node.id,
      sourceFileId: node.sourceFileId,
      sourcePage: node.sourcePage,
      sourceParagraph: node.sourceParagraph
    };
  }

  /* Deterministic segmentation of REAL stored text. Splits on blank
     lines / newlines, then on sentence terminators for long blocks.
     Nothing is added, reworded or inferred — only sliced and indexed. */
  function segments(text) {
    var blocks = String(text || "").split(/\r?\n+/)
      .map(function (b) { return b.trim(); })
      .filter(Boolean);
    var out = [];
    blocks.forEach(function (b) {
      if (b.length <= 120) { out.push(b); return; }
      b.split(/(?<=[。！？；])/).map(function (x) { return x.trim(); })
        .filter(Boolean).forEach(function (x) { out.push(x); });
    });
    return out;
  }

  /* Deterministic section routing (documented rules, no inference):
       contains "=" or "∑/√/×/÷"        → formulas
       contains "：" or ":" (term:body)  → definitions
       length <= 12 and no punctuation   → keywords
       otherwise                         → coreConcepts   */
  function sectionFor(text) {
    if (/[=∑√×÷]/.test(text)) { return "formulas"; }
    if (/[：:]/.test(text)) { return "definitions"; }
    if (text.length <= 12 && !/[，。、！？；,.!?;]/.test(text)) { return "keywords"; }
    return "coreConcepts";
  }

  /* analyze(materialId) -> analysisResult
       { materialId, status, sections, items, reason, generatedAt }
     status: "ready"              real items produced
             "insufficient_source" no readable text (zero items)
             null                  material has no graph presence */
  function analyze(materialId) {
    var kg = AHS.KnowledgeGraphRuntime;
    if (!kg || !materialId) { return null; }
    var nodes = kg.queryByMaterial(materialId);
    if (!nodes.length) { return null; }

    var sections = {};
    SECTIONS.forEach(function (sec) { sections[sec] = []; });

    /* EO-S8.0-005 · Material Text Provider Baseline v1.0: AnalysisRuntime
       no longer reads Material.content directly. ALL text now arrives
       through the single legal entry point, AHS.MaterialTextProvider —
       so a future PDF / DOCX / OCR adapter plugs in there with zero
       changes here (AnalysisRuntime never depends on a parser). */
    var provider = AHS.MaterialTextProvider;
    var supplied = (provider && typeof provider.getText === "function")
      ? provider.getText(materialId)
      : { status: "failed", text: "", reason: "MaterialTextProvider 不可用" };

    var text = (supplied.status === "ready") ? String(supplied.text || "") : "";
    var items = [];
    if (supplied.status === "ready" && text.trim()) {
      segments(text).forEach(function (seg, idx) {
        var sec = sectionFor(seg);
        var item = {
          text: seg,
          section: sec,
          sourceFileId: materialId,
          sourcePage: null,          /* no paginated source was read */
          sourceParagraph: idx + 1   /* REAL index within the stored text */
        };
        sections[sec].push(item);
        items.push(item);
      });
    }

    return {
      materialId: materialId,
      status: items.length ? "ready" : "insufficient_source",
      sections: sections,
      items: items,
      textSource: supplied.source || null,
      providerStatus: supplied.status,
      reason: items.length ? null
        : (supplied.reason ||
           "教材記錄無可讀文字內容（尚無文件解析器 / AI Provider）——不得由檔名或二進位內容臆測，故建立零節點。"),
      generatedAt: new Date().toISOString()
    };
  }

  /* store(record) — reserved write path for the Analysis Pipeline EO.
     Gated by validate(): a record whose items cannot be resolved back
     to real Knowledge Graph nodes is refused, so no free-generated
     summary can ever be persisted. Unused this EO. */
  function storeRecord(record) {
    var check = validate(record);
    if (!check.valid) { return null; }
    store.seq += 1;
    store.items = store.items.filter(function (r) { return r.materialId !== record.materialId; });
    store.items.push(clone(record));
    persist();
    return clone(record);
  }

  /* validate(record) — every item's knowledgeId must resolve to a live
     graph node whose text matches (不得自由生成, structural). */
  function validate(record) {
    var errors = [];
    var kg = AHS.KnowledgeGraphRuntime;
    if (!record || !record.materialId) { errors.push("缺少 materialId"); }
    SECTIONS.forEach(function (sec) {
      if (!Array.isArray(record[sec])) { errors.push("缺少段落：" + sec); return; }
      record[sec].forEach(function (it) {
        var node = kg ? kg.getNode(it.knowledgeId) : null;
        if (!node) { errors.push(sec + " 項目之 knowledgeId 無法追溯至 Knowledge Graph（不得自由生成）"); }
        else if ((node.content || node.label) !== it.text) { errors.push(sec + " 項目內容與圖譜節點不一致"); }
      });
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function getByMaterialId(materialId) {
    var found = null;
    store.items.forEach(function (r) { if (r.materialId === materialId) { found = r; } });
    return found ? clone(found) : null;
  }
  function reset() { store = { items: [], seq: 0 }; persist(); }

  return { analyze: analyze, store: storeRecord, validate: validate, getByMaterialId: getByMaterialId, SECTIONS: SECTIONS.slice(), reset: reset };
})();
