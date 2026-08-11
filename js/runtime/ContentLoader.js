/* js/runtime/ContentLoader.js — Sprint AI-103 · Content Import Runtime
   Loads the six fixed import files' content into a normalized shape.
   Pure loading/parsing — "不得直接修改 Runtime": this file never calls
   any existing Runtime's write API; that is ImportRuntime.js's job.

   Accepts either:
   - a plain object map { "Material.md": "<raw text>", ... } (the
     synchronous path — used directly by tests and by any future caller
     that has already read the files itself), or
   - an array/FileList of real browser File objects (the async path,
     read via File.text() — local disk reads only, never a network
     request; matches this project's "no fetch/XHR" rule since File
     reads never touch the network).
   Both paths converge on the same normalized result shape. */
window.AHS = window.AHS || {};
AHS.ContentLoader = (function () {
  "use strict";

  var HEADER_LINE = /^([A-Za-z]+)\s*:\s*(.*)$/;

  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  /* parseMaterialMarkdown(raw) -> { header: {subject,grade,chapter,unit},
     body: "<content after the header block>" }. Header format: leading
     "Key: Value" lines (case-insensitive key), terminated by the first
     blank line or the first line that isn't "Key: Value" shaped. */
  function parseMaterialMarkdown(raw) {
    var header = { subject: null, grade: null, chapter: null, unit: null };
    if (typeof raw !== "string") { return { header: header, body: "" }; }

    var lines = raw.split(/\r?\n/);
    var bodyStart = 0;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.trim() === "") { bodyStart = i + 1; break; }
      var match = HEADER_LINE.exec(line);
      if (!match) { bodyStart = i; break; }
      var key = match[1].toLowerCase();
      if (Object.prototype.hasOwnProperty.call(header, key)) { header[key] = match[2].trim(); }
      bodyStart = i + 1;
    }
    return { header: header, body: lines.slice(bodyStart).join("\n").trim() };
  }

  function parseJsonOrNull(raw) {
    if (typeof raw !== "string" || raw.trim() === "") { return null; }
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  /* loadFromMap(rawFiles) -> normalized result (synchronous). */
  function loadFromMap(rawFiles) {
    rawFiles = rawFiles || {};
    var materialParsed = parseMaterialMarkdown(rawFiles["Material.md"]);
    return {
      raw: rawFiles,
      material: materialParsed,
      summary: parseJsonOrNull(rawFiles["Summary.json"]),
      quiz: parseJsonOrNull(rawFiles["Quiz.json"]),
      answer: parseJsonOrNull(rawFiles["Answer.json"]),
      metadata: parseJsonOrNull(rawFiles["Metadata.json"]),
      errorBook: parseJsonOrNull(rawFiles["ErrorBook.json"])
    };
  }

  /* load(input) -> Promise<normalized result>. Accepts a plain
     {filename: text} map (resolves immediately) or an array/FileList of
     File objects (reads each via File.text(), local disk only). */
  function load(input) {
    if (isPlainObject(input)) {
      return Promise.resolve(loadFromMap(input));
    }
    var files = input ? Array.prototype.slice.call(input) : [];
    var reads = files.map(function (file) {
      var name = file && file.name;
      return Promise.resolve(typeof file.text === "function" ? file.text() : "")
        .then(function (text) { return { name: name, text: text }; });
    });
    return Promise.all(reads).then(function (entries) {
      var rawFiles = {};
      entries.forEach(function (entry) {
        if (AHS.ImportValidator && AHS.ImportValidator.FIXED_FILENAMES.indexOf(entry.name) !== -1) {
          rawFiles[entry.name] = entry.text;
        }
      });
      return loadFromMap(rawFiles);
    });
  }

  return { load: load, loadFromMap: loadFromMap, parseMaterialMarkdown: parseMaterialMarkdown };
})();
