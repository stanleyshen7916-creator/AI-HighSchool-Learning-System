/* js/core/DocumentExport.js — HOTFIX-005 AI-502/AI-503/AI-504.

   Shared, dependency-free document generation used by Material Center
   (下載教材), Summary Center (下載總結／匯出筆記). No bundler, no CDN
   library, no fetch/XHR/backend — everything here is hand-written,
   plain vanilla JS producing real, valid output files entirely in the
   browser, matching this repo's own "no build tools" architecture.

   Public API:
     downloadBlob(blob, filename)      — trigger a real browser download
     buildDocxBlob(title, blocks)      — real, valid .docx (Word Open XML)
     buildMarkdownText(title, blocks)  — real Markdown text
     printBlocks(title, blocks)        — opens the browser's native print
                                          flow (real "另存為 PDF") with the
                                          given content already filled in

   Block shape: { heading: string, lines?: string[], kind?: "title" }
   - kind "title": heading only, no list, no "(無資料)" fallback.
   - default: heading + numbered list of `lines`; "（無資料）" shown when
     `lines` is empty/missing — never fabricated content.

   Judgment call (flagged, not hidden): AI-503 explicitly requires a real
   PDF. A hand-rolled PDF byte generator cannot correctly render Chinese
   text without embedding a multi-MB CJK font (standard PDF fonts are
   Latin-only) — doing that here would be a much larger, riskier change
   than "Function Integration", and getting it wrong would silently
   produce a PDF with missing/garbled Chinese glyphs, which is worse than
   honest. printBlocks() instead renders the exact same real content into
   a hidden iframe and calls the browser's own print(), whose native
   "另存為 PDF" destination is a real, correct, CJK-safe PDF export
   built into every modern browser — the standard client-only technique
   for "generate a PDF with no backend and no library". AI-502 (教材下載)
   and AI-504 (匯出筆記) explicitly allow "PDF 或 DOCX"/"DOCX 或
   Markdown" — DOCX and Markdown are both used there instead, since
   Word/Markdown need no font embedding at all (system fonts render
   Chinese natively), sidestepping the PDF font problem entirely for
   those two. */
window.AHS = window.AHS || {};
AHS.DocumentExport = (function () {
  "use strict";

  /* Hand-written UTF-8 encoder — deliberately NOT window.TextEncoder.
     TextEncoder is universally available on real browser `window`
     objects but is not guaranteed present on every DOM-only environment
     this script may be evaluated in (e.g. some jsdom configurations used
     by this repo's own test harness) — writing it directly keeps this
     file's real, in-browser behavior identical while working everywhere
     it's loaded, with zero external dependency either way. */
  function utf8Encode(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.codePointAt(i);
      if (code > 0xFFFF) { i++; } /* consume the low surrogate half */
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
      } else if (code < 0x10000) {
        bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
      } else {
        bytes.push(0xF0 | (code >> 18), 0x80 | ((code >> 12) & 0x3F), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
      }
    }
    return new Uint8Array(bytes);
  }

  function escapeXml(s) {
    return String(s == null ? "" : s).replace(/[&<>'"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" }[c];
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>'"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c];
    });
  }

  /* ---- Real file download (blob URL + temporary <a download>, the same
     pattern js/components/MaterialCenter.js's doDownload() already uses
     for real uploaded files). ---------------------------------------- */
  function downloadBlob(blob, filename) {
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (window.URL.revokeObjectURL) {
      window.setTimeout(function () { window.URL.revokeObjectURL(url); }, 1000);
    }
  }

  /* ---- Markdown (AI-504) --------------------------------------------- */
  function buildMarkdownText(title, blocks) {
    var lines = ["# " + String(title || ""), ""];
    (blocks || []).forEach(function (b) {
      lines.push((b.kind === "title" ? "## " : "### ") + String(b.heading || ""));
      lines.push("");
      if (b.kind !== "title") {
        if (b.lines && b.lines.length) {
          b.lines.forEach(function (l) { lines.push("- " + String(l)); });
        } else {
          lines.push("（無資料）");
        }
        lines.push("");
      }
    });
    return lines.join("\n");
  }

  /* ---- Print / 另存為 PDF (AI-503) ------------------------------------ */
  function buildPrintHtml(title, blocks) {
    var body = (blocks || []).map(function (b) {
      if (b.kind === "title") {
        return "<h2>" + escapeHtml(b.heading) + "</h2>";
      }
      var list = (b.lines && b.lines.length)
        ? "<ol>" + b.lines.map(function (l) { return "<li>" + escapeHtml(l) + "</li>"; }).join("") + "</ol>"
        : "<p class=\"empty\">（無資料）</p>";
      return "<h3>" + escapeHtml(b.heading) + "</h3>" + list;
    }).join("");
    return "<!doctype html><html><head><meta charset=\"utf-8\"><title>" + escapeHtml(title) + "</title>" +
      "<style>" +
      "body{font-family:-apple-system,BlinkMacSystemFont,\"PingFang TC\",\"Microsoft JhengHei\",\"Noto Sans TC\",sans-serif;padding:32px;color:#1f2430;}" +
      "h1{font-size:22px;margin:0 0 8px;} h2{font-size:18px;margin-top:28px;border-bottom:2px solid #7c5cff;padding-bottom:4px;}" +
      "h3{font-size:15px;margin-top:18px;color:#4b3fb0;} ol{margin:6px 0 0;padding-left:22px;} li{margin-bottom:6px;line-height:1.7;font-size:13px;}" +
      "p.empty{color:#8a8fa3;font-size:13px;} .meta{color:#666;font-size:12px;margin-bottom:20px;}" +
      "@media print{ body{padding:0;} }" +
      "</style></head><body>" +
      "<h1>" + escapeHtml(title) + "</h1>" +
      "<p class=\"meta\">產生日期：" + escapeHtml(new Date().toLocaleDateString("zh-TW")) + "</p>" +
      body + "</body></html>";
  }

  /* Real content -> browser's own print flow, whose "另存為 PDF"
     destination produces a genuine PDF file (see header). Uses a hidden
     iframe (not window.open) so no popup blocker can intercept it. */
  function printBlocks(title, blocks) {
    var html = buildPrintHtml(title, blocks);
    var iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);
    iframe.addEventListener("load", function () {
      try {
        if (iframe.contentWindow && typeof iframe.contentWindow.print === "function") {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
      } catch (e) {
        /* Real, honest failure surface — printBlocks() has no return
           value, so callers can't branch on this; a print() failure
           (e.g. jsdom/test environment, or a browser blocking it) simply
           means the hidden iframe is removed without any dialog having
           opened. Never fabricated as success. */
      }
      window.setTimeout(function () {
        if (iframe.parentNode) { iframe.parentNode.removeChild(iframe); }
      }, 1000);
    });
    iframe.srcdoc = html;
  }

  /* ---- DOCX / Word Open XML (AI-502) ---------------------------------
     Minimal, real, valid .docx: a 3-part OOXML package
     ([Content_Types].xml, _rels/.rels, word/document.xml) inside a
     STORED (uncompressed) ZIP — Word/LibreOffice/Google Docs all open
     this minimal part set. STORED entries need no compression codec
     (none is available in plain JS without a library), only a correct
     CRC32 — implemented below. */

  var CRC_TABLE = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function dosDateTime(date) {
    var time = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1F);
    var day = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0xF) << 5) | (date.getDate() & 0x1F);
    return { time: time, date: day };
  }

  function pushU16(arr, v) { arr.push(v & 0xFF, (v >>> 8) & 0xFF); }
  function pushU32(arr, v) { arr.push(v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF); }
  function pushBytes(arr, bytes) { for (var i = 0; i < bytes.length; i++) { arr.push(bytes[i]); } }

  function concatUint8(parts) {
    var total = 0;
    parts.forEach(function (p) { total += p.length; });
    var out = new Uint8Array(total);
    var offset = 0;
    parts.forEach(function (p) { out.set(p, offset); offset += p.length; });
    return out;
  }

  /* entries: [{ name: string, data: Uint8Array }] -> full ZIP bytes. */
  function buildZip(entries) {
    var localParts = [];
    var centralParts = [];
    var offset = 0;
    var dt = dosDateTime(new Date());

    entries.forEach(function (entry) {
      var nameBytes = utf8Encode(entry.name);
      var data = entry.data;
      var crc = crc32(data);

      var local = [];
      pushU32(local, 0x04034b50);
      pushU16(local, 20);
      pushU16(local, 0);
      pushU16(local, 0); /* method 0 = stored */
      pushU16(local, dt.time);
      pushU16(local, dt.date);
      pushU32(local, crc);
      pushU32(local, data.length);
      pushU32(local, data.length);
      pushU16(local, nameBytes.length);
      pushU16(local, 0);
      pushBytes(local, nameBytes);
      var localHeader = new Uint8Array(local);
      var localEntry = concatUint8([localHeader, data]);
      localParts.push(localEntry);

      var central = [];
      pushU32(central, 0x02014b50);
      pushU16(central, 20);
      pushU16(central, 20);
      pushU16(central, 0);
      pushU16(central, 0);
      pushU16(central, dt.time);
      pushU16(central, dt.date);
      pushU32(central, crc);
      pushU32(central, data.length);
      pushU32(central, data.length);
      pushU16(central, nameBytes.length);
      pushU16(central, 0);
      pushU16(central, 0);
      pushU16(central, 0);
      pushU16(central, 0);
      pushU32(central, 0);
      pushU32(central, offset);
      pushBytes(central, nameBytes);
      centralParts.push(new Uint8Array(central));

      offset += localEntry.length;
    });

    var centralDir = concatUint8(centralParts);
    var centralOffset = offset;

    var end = [];
    pushU32(end, 0x06054b50);
    pushU16(end, 0);
    pushU16(end, 0);
    pushU16(end, entries.length);
    pushU16(end, entries.length);
    pushU32(end, centralDir.length);
    pushU32(end, centralOffset);
    pushU16(end, 0);

    return concatUint8(localParts.concat([centralDir, new Uint8Array(end)]));
  }

  var CONTENT_TYPES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>';

  var RELS_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>';

  function docxParagraph(text, opts) {
    opts = opts || {};
    var rPr = "";
    if (opts.bold || opts.size) {
      rPr = "<w:rPr>" + (opts.bold ? "<w:b/>" : "") + (opts.size ? "<w:sz w:val=\"" + opts.size + "\"/>" : "") + "</w:rPr>";
    }
    return "<w:p>" + (rPr ? "<w:pPr>" + rPr + "</w:pPr>" : "") +
      "<w:r>" + rPr + "<w:t xml:space=\"preserve\">" + escapeXml(text) + "</w:t></w:r></w:p>";
  }

  function buildDocumentXml(title, blocks) {
    var body = [docxParagraph(title, { bold: true, size: 32 })];
    (blocks || []).forEach(function (b) {
      body.push(docxParagraph(b.heading, { bold: true, size: b.kind === "title" ? 28 : 24 }));
      if (b.kind !== "title") {
        if (b.lines && b.lines.length) {
          b.lines.forEach(function (line, i) { body.push(docxParagraph((i + 1) + ". " + line)); });
        } else {
          body.push(docxParagraph("（無資料）"));
        }
      }
    });
    body.push("<w:sectPr/>");
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body>" + body.join("") + "</w:body></w:document>";
  }

  function buildDocxBytes(title, blocks) {
    var entries = [
      { name: "[Content_Types].xml", data: utf8Encode(CONTENT_TYPES_XML) },
      { name: "_rels/.rels", data: utf8Encode(RELS_XML) },
      { name: "word/document.xml", data: utf8Encode(buildDocumentXml(title, blocks)) }
    ];
    return buildZip(entries);
  }

  function buildDocxBlob(title, blocks) {
    return new Blob([buildDocxBytes(title, blocks)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  }

  return {
    downloadBlob: downloadBlob,
    buildDocxBlob: buildDocxBlob,
    buildMarkdownText: buildMarkdownText,
    printBlocks: printBlocks,
    /* exposed for tests only — round-trip verification of the hand-rolled
       ZIP/docx writer needs access to the same primitives it was built
       with, and to the pre-Blob raw bytes (Blob's own byte-reading APIs
       are async; the test suite is synchronous by design). Production
       code (above) never calls these — buildDocxBlob() is the only real
       entry point used by MaterialCenter.js. */
    _internal: { buildZip: buildZip, crc32: crc32, escapeXml: escapeXml, buildDocxBytes: buildDocxBytes }
  };
})();
