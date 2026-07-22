/* js/parser/ParserAdapterRegistry.js — Sprint 8.1 · EO-S8.1.001
   Parser Adapter Foundation（Parser Adapter Baseline v1.0）.

   Fixed lineage — a Parser NEVER touches the AI runtimes:

     TXT / PDF / DOCX / PPTX / Image
       → Parser Adapter → MaterialTextProvider → AnalysisRuntime
       → KnowledgeExtractionRuntime → KnowledgeGraphRuntime

   Zero-modification integration: AHS.MaterialTextProvider (LOCK)
   already consults registered adapters BEFORE falling back to
   Material.content, and exposes registerAdapter() publicly. This
   registry therefore plugs in through that PUBLIC API — the Provider,
   AnalysisRuntime, KnowledgeExtractionRuntime, KnowledgeGraphRuntime
   and SummaryRuntime are all byte-identical after this EO.

   Two adapter contracts exist and are bridged here, deliberately:
     · EO-S8.1.001 Parser Adapter (this file's public contract)
         { id, version, supports(fileType) -> boolean,
           extract(file) -> { status, content, metadata } }
     · MaterialTextProvider's existing plug contract
         { id, supports(material) -> boolean, extract(material) -> string }
   installBridge() registers ONE bridge adapter with the Provider that
   translates between them. The bridge claims a material ONLY when a
   registered parser genuinely yields text (status "ready" and non-empty
   content); otherwise it stands aside so the Provider's
   Material.content fallback — and its honest insufficient_source —
   behave exactly as before (zero regression, verified).

   Default adapters are STUBS (this EO implements no real parsing):
     txt   → supports() true for TXT / MD / JSON / TEXT; extract()
             returns the material record's OWN stored text verbatim
             (no parsing is involved — plain text needs none) or an
             honest "empty" when there is none.
     pdf / docx / pptx / ocr → supports() false, extract() always
             { status: "not_supported" }. No binary is read, no OCR is
             performed, no third-party parser is used.

   Runtime Rules: this module creates no Summary / Question / Answer /
   WrongBook / Review, calls no AI Provider, and contains no network
   access (no fetch / XHR) — asserted by source scan in
   tests/regression/ParserAdapterV1.js. */
window.AHS = window.AHS || {};
AHS.ParserAdapterRegistry = (function () {
  "use strict";

  var CONTRACT = ["supports", "extract"];
  var EXTRACT_STATUSES = ["ready", "empty", "not_supported", "failed"];
  var TEXT_TYPES = ["TXT", "MD", "MARKDOWN", "JSON", "TEXT"];
  var BRIDGE_ID = "parser_adapter_registry";

  var adapters = [];   /* in-memory only — no persistence, no content store */

  function nowIso() { return new Date().toISOString(); }

  function metaFor(parserId, fileType) {
    return { parserId: parserId, fileType: String(fileType || "").toUpperCase(), createdAt: nowIso() };
  }

  function out(status, content, parserId, fileType, reason) {
    return {
      status: status,
      content: (typeof content === "string") ? content : "",
      metadata: metaFor(parserId, fileType),
      reason: reason || null
    };
  }

  /* ---- Default stub adapters ------------------------------------------- */

  var txtAdapter = {
    id: "txt",
    version: "1.0",
    supports: function (fileType) {
      return TEXT_TYPES.indexOf(String(fileType || "").toUpperCase()) !== -1;
    },
    /* `file` is the real material record. Plain text requires no
       parsing: its stored text is returned VERBATIM — never modified,
       corrected, reordered or AI-polished. */
    extract: function (file) {
      file = file || {};
      var type = file.fileType || "";
      if (!txtAdapter.supports(type)) { return out("not_supported", "", "txt", type); }
      var text = file.content;
      if (typeof text !== "string") {
        return out("failed", "", "txt", type, "content 型別不合法（需為字串）");
      }
      if (!text.trim()) {
        return out("empty", "", "txt", type, "文字檔尚無可讀內容 —— 不得推測。");
      }
      return out("ready", text, "txt", type);
    }
  };

  function reservedAdapter(id) {
    return {
      id: id,
      version: "0.0",
      supports: function () { return false; },
      extract: function (file) {
        return out("not_supported", "", id, (file && file.fileType) || "",
          id.toUpperCase() + " 解析保留至後續 EO —— 本 EO 不得真正解析。");
      }
    };
  }

  /* ---- validate ---------------------------------------------------------- */
  function validateAdapter(adapter) {
    var errors = [];
    adapter = adapter || {};
    if (!adapter.id) { errors.push("缺少 id"); }
    if (!adapter.version) { errors.push("缺少 version"); }
    CONTRACT.forEach(function (fn) {
      if (typeof adapter[fn] !== "function") { errors.push("缺少介面方法：" + fn); }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function validateResult(result) {
    var errors = [];
    result = result || {};
    if (EXTRACT_STATUSES.indexOf(result.status) === -1) {
      errors.push("extract() status 不合法（僅允許：" + EXTRACT_STATUSES.join(" / ") + "）");
    }
    if (typeof result.content !== "string") { errors.push("extract() content 必須為字串"); }
    var m = result.metadata;
    if (!m || typeof m !== "object") { errors.push("extract() 缺少 metadata"); }
    else {
      ["parserId", "fileType", "createdAt"].forEach(function (k) {
        if (!(k in m)) { errors.push("metadata 缺少：" + k); }
      });
    }
    /* A parser must never return downstream artefacts. */
    ["knowledge", "summary", "question", "answer", "review", "wrongbook"].forEach(function (k) {
      if (k in result) { errors.push("Parser 不得回傳下游資料：" + k); }
    });
    return { valid: errors.length === 0, errors: errors };
  }

  /* ---- Public API (exactly five) ---------------------------------------- */

  function register(adapter) {
    var check = validateAdapter(adapter);
    if (!check.valid) { return null; }
    adapters = adapters.filter(function (a) { return a.id !== adapter.id; });
    adapters.push(adapter);
    return adapter.id;
  }

  function unregister(id) {
    var before = adapters.length;
    adapters = adapters.filter(function (a) { return a.id !== id; });
    return adapters.length !== before;
  }

  function getAdapter(id) {
    var found = null;
    adapters.forEach(function (a) { if (a.id === id) { found = a; } });
    return found;
  }

  function listAdapters() {
    return adapters.map(function (a) { return { id: a.id, version: a.version }; });
  }

  /* status()          → registry overview
     status(id)        → "registered" | "unknown"
     status(id, type)  → "supported" | "not_supported" | "unknown" */
  function status(id, fileType) {
    if (!id) {
      return {
        adapters: listAdapters(),
        bridgeInstalled: bridgeInstalled(),
        textTypes: TEXT_TYPES.slice()
      };
    }
    var a = getAdapter(id);
    if (!a) { return "unknown"; }
    if (fileType === undefined) { return "registered"; }
    return a.supports(fileType) ? "supported" : "not_supported";
  }

  /* ---- MaterialTextProvider bridge (uses its PUBLIC API only) ----------- */

  function runFor(material) {
    /* First registered adapter that both supports the fileType and
       returns a valid, ready, non-empty result. */
    for (var i = 0; i < adapters.length; i += 1) {
      var a = adapters[i];
      var supported = false;
      try { supported = !!a.supports(material && material.fileType); } catch (e) { supported = false; }
      if (!supported) { continue; }
      var result;
      try { result = a.extract(material); } catch (e2) { result = null; }
      var vr = validateResult(result);
      if (!vr.valid) { continue; }                       /* invalid → stand aside */
      if (result.status === "ready" && result.content.trim()) { return result; }
    }
    return null;
  }

  function bridgeInstalled() {
    var p = AHS.MaterialTextProvider;
    return !!(p && typeof p.listAdapters === "function" && p.listAdapters().indexOf(BRIDGE_ID) !== -1);
  }

  function installBridge() {
    var p = AHS.MaterialTextProvider;
    if (!p || typeof p.registerAdapter !== "function") { return null; }
    return p.registerAdapter({
      id: BRIDGE_ID,
      /* Claim a material ONLY when a parser genuinely produces text, so
         the Provider's Material.content fallback is untouched. */
      supports: function (material) { return !!runFor(material); },
      extract: function (material) {
        var r = runFor(material);
        return r ? r.content : "";
      }
    });
  }

  /* Default stubs registered at load; bridge installed if the Provider
     is present (script order: MaterialTextProvider.js first). */
  register(txtAdapter);
  ["pdf", "docx", "pptx", "ocr"].forEach(function (id) { register(reservedAdapter(id)); });
  installBridge();

  return {
    register: register,
    unregister: unregister,
    getAdapter: getAdapter,
    listAdapters: listAdapters,
    status: status
  };
})();
