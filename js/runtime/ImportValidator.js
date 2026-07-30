/* js/runtime/ImportValidator.js — Sprint AI-103 · Content Import Runtime
   Structural validation of a raw import folder's six fixed files before
   any parsing/loading happens. Read-only: never mutates a Runtime,
   never touches the DOM. Returns a Validation Result
   { valid, errors, warnings } — the same {valid, errors} contract every
   other validator in this codebase already uses (e.g. ai-engine's
   MetadataValidator/SchemaValidator), plus a non-fatal `warnings` array
   for Duplicate Check (a possible duplicate is worth surfacing to the
   user but must not by itself block an import the user explicitly
   asked for).

   Supported filenames are fixed per Sprint AI-103's "Import Files"
   list; filenames must not be renamed, so this file checks for exactly
   these keys: Material.md, Summary.json, Quiz.json, Answer.json,
   Metadata.json, ErrorBook.json. */
window.AHS = window.AHS || {};
AHS.ImportValidator = (function () {
  "use strict";

  var FIXED_FILENAMES = [
    "Material.md", "Summary.json", "Quiz.json",
    "Answer.json", "Metadata.json", "ErrorBook.json"
  ];

  var SUPPORTED_VERSIONS = ["1.0", "1.1"];

  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  /* JSON Parse check — attempts JSON.parse on every *.json file's raw
     text. Material.md is exempt (it is not JSON). */
  function checkJsonParse(rawFiles, errors) {
    Object.keys(rawFiles).forEach(function (filename) {
      if (!/\.json$/.test(filename)) { return; }
      try {
        JSON.parse(rawFiles[filename]);
      } catch (e) {
        errors.push(filename + ": invalid JSON (" + e.message + ")");
      }
    });
  }

  /* Markdown Check — Material.md must exist, be a non-empty string, and
     contain at least one line of real content after any frontmatter
     header block (see MetadataParser.js for the frontmatter format). */
  function checkMarkdown(rawFiles, errors) {
    var raw = rawFiles["Material.md"];
    if (typeof raw !== "string" || raw.trim().length === 0) {
      errors.push("Material.md: missing or empty");
      return;
    }
    var lines = raw.split(/\r?\n/);
    var pastHeader = false, hasBody = false;
    lines.forEach(function (line) {
      if (!pastHeader) {
        if (line.trim() === "") { pastHeader = true; }
        else if (!/^[A-Za-z]+\s*:/.test(line)) { pastHeader = true; hasBody = hasBody || line.trim().length > 0; }
        return;
      }
      if (line.trim().length > 0) { hasBody = true; }
    });
    if (!hasBody) { errors.push("Material.md: no content body found after header block"); }
  }

  /* Required Field check — Metadata.json must supply the 11 fields
     MetadataParser.js parses; missing ones are still reported here
     (parsing itself is defensive and never throws — see that file). */
  var REQUIRED_METADATA_FIELDS = [
    "subject", "grade", "publisher", "version", "chapter", "unit",
    "difficulty", "tags", "author", "createdTime", "updatedTime"
  ];

  function checkRequiredFields(rawFiles, errors) {
    var metaRaw = rawFiles["Metadata.json"];
    if (typeof metaRaw !== "string") { errors.push("Metadata.json: missing"); return; }
    var parsed;
    try { parsed = JSON.parse(metaRaw); } catch (e) { return; } /* already reported by checkJsonParse */
    if (!isPlainObject(parsed)) { errors.push("Metadata.json: must be a JSON object"); return; }
    REQUIRED_METADATA_FIELDS.forEach(function (field) {
      if (parsed[field] === undefined || parsed[field] === null || parsed[field] === "") {
        errors.push("Metadata.json: missing required field \"" + field + "\"");
      }
    });
  }

  /* Version Check — Metadata.json's version must be one this Runtime
     recognizes. Unknown versions are a hard error, not a warning: this
     Import Runtime has no schema-compatibility logic for a version it
     has never seen. */
  function checkVersion(rawFiles, errors) {
    var metaRaw = rawFiles["Metadata.json"];
    if (typeof metaRaw !== "string") { return; } /* already reported */
    var parsed;
    try { parsed = JSON.parse(metaRaw); } catch (e) { return; }
    if (!isPlainObject(parsed) || !parsed.version) { return; } /* already reported */
    if (SUPPORTED_VERSIONS.indexOf(String(parsed.version)) === -1) {
      errors.push("Metadata.json: unsupported version \"" + parsed.version +
        "\" (supported: " + SUPPORTED_VERSIONS.join(", ") + ")");
    }
  }

  /* Duplicate Check — a real, non-fatal warning only: does a material
     with the same subject/grade/chapter/title already exist in the
     existing, LOCK AHS.MaterialRuntime? Read-only query against the
     existing Runtime's own public list()/getById() — this file never
     writes to any Runtime. */
  function checkDuplicate(rawFiles, warnings) {
    var metaRaw = rawFiles["Metadata.json"];
    if (typeof metaRaw !== "string") { return; }
    var meta;
    try { meta = JSON.parse(metaRaw); } catch (e) { return; }
    if (!isPlainObject(meta)) { return; }
    if (typeof window === "undefined" || !window.AHS || !AHS.MaterialRuntime ||
        typeof AHS.MaterialRuntime.list !== "function") { return; }
    var existing = AHS.MaterialRuntime.list().some(function (m) {
      return m.subject === meta.subject && m.grade === meta.grade && m.chapter === meta.chapter;
    });
    if (existing) {
      warnings.push("Possible duplicate: a material with the same subject/grade/chapter already exists");
    }
  }

  /* validate(rawFiles) — rawFiles: { "Material.md": "<raw text>",
     "Summary.json": "<raw text>", ... } — every value is the raw file
     content as a string (ContentLoader.js is what reads real files;
     this function only ever sees already-read text, keeping it
     synchronous and trivially testable). Missing keys are treated as
     "file not present" (Material.md and Metadata.json are required;
     Summary/Quiz/Answer/ErrorBook.json are each optional — an import
     may supply any subset of them). */
  function validate(rawFiles) {
    var errors = [], warnings = [];
    rawFiles = rawFiles || {};

    Object.keys(rawFiles).forEach(function (filename) {
      if (FIXED_FILENAMES.indexOf(filename) === -1) {
        errors.push("Unrecognized filename: " + filename + " (filenames must not be renamed)");
      }
    });

    if (!rawFiles["Material.md"]) { errors.push("Material.md: missing (required)"); }
    else { checkMarkdown(rawFiles, errors); }

    if (!rawFiles["Metadata.json"]) { errors.push("Metadata.json: missing (required)"); }

    checkJsonParse(rawFiles, errors);
    checkRequiredFields(rawFiles, errors);
    checkVersion(rawFiles, errors);
    checkDuplicate(rawFiles, warnings);

    return { valid: errors.length === 0, errors: errors, warnings: warnings };
  }

  return { validate: validate, FIXED_FILENAMES: FIXED_FILENAMES.slice(), SUPPORTED_VERSIONS: SUPPORTED_VERSIONS.slice() };
})();
