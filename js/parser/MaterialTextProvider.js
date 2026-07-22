/* js/parser/MaterialTextProvider.js — Sprint 8.0 · EO-S8.0-005
   Material Text Provider（Single Text Entry Point）.

   PMO Material Text Provider Baseline v1.0 — the Analysis Pipeline is
   fixed as:

     Folder → Material → Material Text Provider → AnalysisRuntime
            → KnowledgeExtractionRuntime → KnowledgeGraphRuntime

   This is an ADAPTER / HELPER layer, not a new Foundation Runtime and
   not a second content store: it holds no text of its own, persists
   nothing, and reuses AHS.MaterialRuntime's public getById() as the
   only content source. AnalysisRuntime no longer reads
   Material.content directly — every character it analyses now arrives
   through getText() below (enforced by a source-scan assertion in
   tests/regression/MaterialTextProviderV1.js).

   Sole responsibility: Material → Text. It performs no Analysis, no
   Knowledge, no Summary, no Question, no WrongBook, no Review, and no
   AI behaviour of any kind. There is no OCR, no AI Provider call, no
   network access (no fetch / XHR anywhere in this file) and no PDF
   binary parsing.

   Current legal source (this EO): Material.content only.
     content missing / empty  → status "insufficient_source"
     material missing, content field absent, or content of an illegal
     type (non-string)        → status "failed"
     real text present        → status "ready", text returned VERBATIM
   Text is never modified, corrected, reordered or embellished — the
   provider returns exactly what the material record stores.

   Future extension (reserved, nothing implemented): registerAdapter()
   accepts a future PDF / DOCX / OCR adapter that must implement
     { id, supports(material) -> boolean, extract(material) -> string }
   Registered adapters are consulted BEFORE the content fallback, so a
   future parser EO plugs in here with zero changes to AnalysisRuntime.
   No adapter ships with this EO — RESERVED_ADAPTERS are advertised as
   "not_supported" until their own EO lands. */
window.AHS = window.AHS || {};
AHS.MaterialTextProvider = (function () {
  "use strict";

  var STATUSES = ["ready", "insufficient_source", "failed"];
  var RESERVED_ADAPTERS = ["pdf", "docx", "pptx", "ocr"];
  var CONTRACT = ["supports", "extract"];

  var adapters = [];   /* in-memory only; no persistence, no content store */

  function nowIso() { return new Date().toISOString(); }

  function result(materialId, status, text, source, reason) {
    return {
      materialId: materialId || null,
      status: status,
      text: text || "",
      source: source || null,
      characterCount: (text || "").length,
      reason: reason || null,
      retrievedAt: nowIso()
    };
  }

  /* ---- registerAdapter(adapter) — reserved plug point ------------------- */
  function validateAdapter(adapter) {
    var errors = [];
    adapter = adapter || {};
    if (!adapter.id) { errors.push("缺少 adapter id"); }
    CONTRACT.forEach(function (fn) {
      if (typeof adapter[fn] !== "function") { errors.push("缺少介面方法：" + fn); }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function registerAdapter(adapter) {
    var check = validateAdapter(adapter);
    if (!check.valid) { return null; }
    adapters = adapters.filter(function (a) { return a.id !== adapter.id; });
    adapters.push(adapter);
    return adapter.id;
  }

  function listAdapters() {
    return adapters.map(function (a) { return a.id; });
  }

  /* adapterStatus(kind) — reserved parser kinds report not_supported
     until their own EO registers a real adapter. */
  function adapterStatus(kind) {
    if (listAdapters().indexOf(kind) !== -1) { return "available"; }
    if (RESERVED_ADAPTERS.indexOf(kind) !== -1) { return "not_supported"; }
    return "unknown";
  }

  /* ---- getText(materialId) — the single legal text entry point --------- */
  function getText(materialId) {
    if (!materialId) {
      return result(null, "failed", "", null, "缺少 materialId");
    }
    var mr = AHS.MaterialRuntime;
    if (!mr || typeof mr.getById !== "function") {
      return result(materialId, "failed", "", null, "MaterialRuntime 不可用");
    }

    /* Validation · Material 存在 */
    var material = mr.getById(materialId);
    if (!material) {
      return result(materialId, "failed", "", null, "Material 不存在");
    }

    /* Reserved adapters first (none registered this EO). A future
       PDF/DOCX/OCR adapter supplies text here without AnalysisRuntime
       ever knowing a parser exists. */
    for (var i = 0; i < adapters.length; i += 1) {
      var a = adapters[i];
      var applies = false;
      try { applies = !!a.supports(material); } catch (e) { applies = false; }
      if (!applies) { continue; }
      var extracted;
      try { extracted = a.extract(material); } catch (e2) { extracted = null; }
      if (typeof extracted !== "string") {
        return result(materialId, "failed", "", "adapter:" + a.id, "Adapter 回傳型別不合法（需為字串）");
      }
      if (!extracted.trim()) {
        return result(materialId, "insufficient_source", "", "adapter:" + a.id,
          "Adapter 未取得可讀文字 —— 不得推測內容。");
      }
      return result(materialId, "ready", extracted, "adapter:" + a.id, null);
    }

    /* Validation · content 欄位存在 */
    if (!("content" in material)) {
      return result(materialId, "failed", "", "material.content", "Material 缺少 content 欄位");
    }
    /* Validation · content 型別合法 */
    var content = material.content;
    if (content === null || content === undefined) {
      return result(materialId, "insufficient_source", "", "material.content",
        "教材尚無文字內容（content 為空）—— 不得 Mock／推測／OCR／解析 PDF 二進位。");
    }
    if (typeof content !== "string") {
      return result(materialId, "failed", "", "material.content", "content 型別不合法（需為字串）");
    }
    if (!content.trim()) {
      return result(materialId, "insufficient_source", "", "material.content",
        "教材尚無文字內容（content 為空）—— 不得 Mock／推測／OCR／解析 PDF 二進位。");
    }

    /* Verbatim — never modified, corrected, reordered or embellished. */
    return result(materialId, "ready", content, "material.content", null);
  }

  function status(materialId) {
    return getText(materialId).status;
  }

  return {
    getText: getText,
    status: status,
    registerAdapter: registerAdapter,
    validateAdapter: validateAdapter,
    listAdapters: listAdapters,
    adapterStatus: adapterStatus,
    STATUSES: STATUSES.slice(),
    RESERVED_ADAPTERS: RESERVED_ADAPTERS.slice()
  };
})();
