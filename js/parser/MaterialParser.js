/* js/services/MaterialParser.js — Sprint 6 · EO-S6-001 Material Parser
   Foundation.

   Path/role flag: EO-S6-001 specifies "processors/MaterialParser.js" (a
   new root-level folder). No "processors/" directory exists anywhere in
   the repository. There IS an existing, empty, pre-scaffolded
   js/services/ directory (sibling to js/runtime/, js/components/), which
   is exactly the right conceptual home for a non-UI, non-Runtime
   processing module and requires no change to Repository Structure —
   creating a new top-level "processors/" folder would. Per "Repository
   First / Repository wins" (and this EO's own "不得修改 Repository
   Structure"), this file lives at js/services/MaterialParser.js instead.
   Flagged for PMO in REPORT.md.

   Scope: Parser Framework only. Raw Material -> Material Document.
   Does NOT create a Knowledge/Summary/Question Runtime, does not modify
   MaterialRuntime.js or its schema (untouched, not read from here),
   does not touch any page/UI (not referenced by any <script> tag —
   wiring into Material Center is explicitly out of scope this EO). No
   ES modules, no Router, no new framework. Stateless, session-only
   (id counter resets on reload, same as every other module in this
   repo — no Storage).

   Material Document schema (fixed, per EO-S6-001):
     { id, materialId, subject, grade, category, fileName, fileType,
       content, createdAt }
   content is always coerced to String.

   Stub Implementation: real binary parsing (PDF/DOCX/PPTX/audio/image
   decoding) is out of scope for a build-tool-free, backend-free static
   prototype (no parsing libraries are available in this environment).
   Per EO-S6-001 ("目前若尚未完成解析，可使用 Stub Implementation。但
   Interface 必須完整"), every parseX() below returns a real, fully-
   shaped Material Document with a clearly-labeled placeholder `content`
   string — never throws, never fabricates parsed text. parseTXT() is the
   one exception: if the caller supplies raw.rawText (already plain
   text, nothing to "parse" in a binary sense) it's used as-is; otherwise
   it falls back to the same stub convention as the rest.
   PascalCase module under window.AHS, consistent with every existing
   Runtime/component in this repo. */
window.AHS = window.AHS || {};
AHS.MaterialParser = (function () {
  "use strict";

  var seq = 0;

  /* Mirrors js/runtime/MaterialRuntime.js's own formatDate() exactly
     (same "YYYY/MM/DD" convention) since Material Document is a
     Material-Center-adjacent concept. */
  function formatDate(d) {
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  function nextId() {
    seq += 1;
    return "mdoc_" + seq;
  }

  function stubContent(label, raw) {
    var name = (raw && raw.fileName) || "(未命名檔案)";
    return "[Stub] " + label + " 內容尚未解析：" + name;
  }

  /* buildDocument(raw, fileType, content) — assembles the fixed schema.
     Never throws: raw defaults to {}, every field has a safe fallback. */
  function buildDocument(raw, fileType, content) {
    raw = raw || {};
    return {
      id: nextId(),
      materialId: raw.materialId || raw.id || null,
      subject: raw.subject || null,
      grade: raw.grade || null,
      category: raw.category || null,
      fileName: raw.fileName || "",
      fileType: fileType,
      content: String(content),
      createdAt: formatDate(new Date())
    };
  }

  function parsePDF(raw) { return buildDocument(raw, "PDF", stubContent("PDF", raw)); }
  function parseDOCX(raw) { return buildDocument(raw, "DOCX", stubContent("DOCX", raw)); }
  function parsePPTX(raw) { return buildDocument(raw, "PPTX", stubContent("PPTX", raw)); }
  function parseImage(raw) { return buildDocument(raw, "IMAGE", stubContent("Image", raw)); }
  function parseAudio(raw) { return buildDocument(raw, "AUDIO", stubContent("Audio", raw)); }

  function parseTXT(raw) {
    raw = raw || {};
    var content = (typeof raw.rawText === "string") ? raw.rawText : stubContent("TXT", raw);
    return buildDocument(raw, "TXT", content);
  }

  var PARSERS = {
    PDF: parsePDF,
    DOCX: parseDOCX,
    PPTX: parsePPTX,
    TXT: parseTXT,
    IMAGE: parseImage,
    AUDIO: parseAudio
  };

  /* parse(raw) — dispatches by raw.fileType (case-insensitive). Never
     throws: unrecognized/missing fileType falls back to a generic stub
     Material Document (fileType "UNKNOWN") rather than erroring, so
     parse() is always "可正常呼叫" per Acceptance, even with bad input. */
  function parse(raw) {
    raw = raw || {};
    var type = String(raw.fileType || "").toUpperCase();
    var fn = PARSERS[type];
    if (fn) { return fn(raw); }
    return buildDocument(raw, "UNKNOWN", stubContent("未知格式", raw));
  }

  return {
    parse: parse,
    parsePDF: parsePDF,
    parseDOCX: parseDOCX,
    parsePPTX: parsePPTX,
    parseTXT: parseTXT,
    parseImage: parseImage,
    parseAudio: parseAudio
  };
})();
