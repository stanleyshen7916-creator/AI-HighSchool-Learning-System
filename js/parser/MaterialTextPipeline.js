/* js/parser/MaterialTextPipeline.js — Sprint 8.3 · EO-S8.3.005
   Unified Material Text Pipeline.

   Purpose: give every consumer ONE way to obtain a material's text as

     { text, title, metadata }

   and, at UPLOAD time, actually capture the readable text of text-type
   files so the downstream chain (Analysis → Extraction → Knowledge
   Graph → Summary / Question) has real content to work with. Until now
   the upload flow never collected any text, so materials reached the
   pipeline empty and every capability returned nothing — this module
   closes that gap without letting any Runtime parse files itself.

   Division of responsibility (per EO):
     · MaterialRuntime only stores/serves material info and (via the
       upload flow) hands a file to this pipeline; it never parses
       content itself.
     · This pipeline is the single place that turns a file into text,
       reusing the EXISTING extractors rather than adding new ones:
         - readFile(file): reads a real text-type File with FileReader
           (TXT / MD / MARKDOWN / JSON / TEXT — the same set the
           ParserAdapterRegistry txt adapter already supports). Binary
           types (PDF / DOCX / images) have no parser yet and yield
           "No readable content" honestly.
         - getText(materialId): reads already-stored text through the
           existing AHS.MaterialTextProvider (itself backed by the
           ParserAdapterRegistry), so retrieval stays on one path.

   Unified empty result (LOCK): when a material has no readable text the
   pipeline returns { text: "", title, metadata, status:
   "no_readable_content", message: "No readable content" }. It NEVER
   throws — callers branch on status, never catch.

   No new Runtime, no Public API change, no architecture change: this is
   a parser-side helper that upload calls to fill `content`, and that
   AITutorService reads through instead of touching any upload object. */
window.AHS = window.AHS || {};
AHS.MaterialTextPipeline = (function () {
  "use strict";

  var TEXT_TYPES = ["TXT", "MD", "MARKDOWN", "JSON", "TEXT"];
  var NO_CONTENT = "No readable content";

  function metaFor(material, extra) {
    material = material || {};
    var metadata = {
      materialId: material.id || null,
      fileName: material.fileName || (extra && extra.fileName) || "",
      fileType: material.fileType || (extra && extra.fileType) || "",
      subject: material.subject || "",
      grade: material.grade || "",
      chapter: material.chapter || ""
    };
    return metadata;
  }

  function result(text, title, metadata, status, message) {
    return {
      text: text || "",
      title: title || "",
      metadata: metadata || {},
      status: status,                       /* "ready" | "no_readable_content" */
      message: (status === "ready") ? null : (message || NO_CONTENT)
    };
  }

  function isTextType(fileType) {
    return TEXT_TYPES.indexOf(String(fileType || "").toUpperCase()) !== -1;
  }

  /* ---- readFile(file, done) — upload-time text capture -------------------
     Reads a real text-type File's content VERBATIM via FileReader (no
     network, no modification). done(text|null): null when the file is a
     binary/unsupported type or cannot be read — the caller then stores
     no content and the material honestly has none. Never throws. */
  function readFile(file, done) {
    function finish(value) { if (typeof done === "function") { done(value); } }
    if (!file || !file.name) { finish(null); return; }
    var ext = String(file.name.split(".").pop() || "").toUpperCase();
    if (!isTextType(ext)) { finish(null); return; }     /* binary → no parser yet */
    if (typeof window.FileReader === "undefined") { finish(null); return; }

    var reader = new window.FileReader();
    reader.onload = function () {
      var text = String(reader.result || "");
      finish(text.trim() ? text : null);
    };
    reader.onerror = function () { finish(null); };
    try { reader.readAsText(file); } catch (e) { finish(null); }
  }

  /* ---- getText(materialId) — unified retrieval ---------------------------
     Returns { text, title, metadata, status, message } for a stored
     material, reading through the existing MaterialTextProvider (single
     text entry point). Never throws; a material with no readable text
     yields the unified "No readable content" result. */
  function getText(materialId) {
    var mr = AHS.MaterialRuntime;
    var material = (mr && typeof mr.getById === "function" && materialId)
      ? mr.getById(materialId) : null;
    if (!material) {
      return result("", "", metaFor(null, null), "no_readable_content",
        "No readable content");
    }

    var title = material.title || material.fileName || "";
    var metadata = metaFor(material, null);

    var provider = AHS.MaterialTextProvider;
    var supplied = (provider && typeof provider.getText === "function")
      ? provider.getText(materialId)
      : { status: "failed", text: "" };

    if (supplied && supplied.status === "ready" && String(supplied.text || "").trim()) {
      return result(String(supplied.text), title, metadata, "ready", null);
    }
    return result("", title, metadata, "no_readable_content", NO_CONTENT);
  }

  return {
    readFile: readFile,
    getText: getText,
    isTextType: isTextType,
    TEXT_TYPES: TEXT_TYPES.slice(),
    NO_CONTENT: NO_CONTENT
  };
})();
