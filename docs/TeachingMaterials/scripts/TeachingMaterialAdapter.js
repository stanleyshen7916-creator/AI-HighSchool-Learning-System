/* docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js — EO-S1.2-001
   (Revision) "Teaching Material Adapter Interface" v1.0.

   Architecture (per this EO): Teaching Material Repository -> Adapter ->
   MaterialRuntime -> Material Center. Pure, stateless data-shape
   converter: no save()/update()/delete(), no Runtime creation, no
   Repository writes, no MaterialRuntime modification. Every function
   here takes already-loaded plain JS objects (parsed Package JSON) and
   returns a plain object/array — it never touches the DOM, sessionStorage,
   fetch, or any Runtime directly. Never <script>-tagged; inert to the
   running app, same placement/inertness pattern as ValidateMaterial.js.

   File location (docs/TeachingMaterials/scripts/, alongside
   ValidateMaterial.js) is Claude's own judgment call — this EO does not
   name a path. Flagged in EO_S1.2-001_Report.md, not hidden.

   ---------------------------------------------------------------------
   Judgment calls made while designing the conversion (all because the
   Package schemas and the real, LOCK Runtime schemas were designed by
   different EOs, at different times, for different purposes — none of
   this is guessed content, only structural field-mapping decisions):

   1. convertMaterial() has no Package field for MaterialRuntime's
      `title`. Package metadata.json (EO-S1.1-002/003) has no title/
      heading field at all (unlike Sprint AI-103's ImportRuntime.js,
      which could derive one from Material.md's first Markdown heading —
      Teaching Material Packages carry no such body text). Resolution:
      derive title from `chapter + " " + unit` (both real, non-invented
      fields) when either is present; otherwise fall back to the
      Package's own `materialId` (e.g. "tm_1") rather than a generic
      placeholder like MaterialRuntime's own default "未命名教材" — still
      real data, just terse. Flagged, not silently decided either way.

   2. convertMaterial()'s `category` is mapped from Package metadata's
      `unit` field. This reuses Sprint AI-103's ImportRuntime.js
      precedent exactly (`category: resolveField(metadata, header,
      "unit", "unit")`) rather than inventing a new mapping (e.g. from
      `materialType`) — consistent prior art beats a fresh guess.

   3. convertMaterial() never sets `content`, `fileName`, `fileType`,
      `fileSize`, or `file`. The Package has no single extracted-text
      field (source/ holds original bytes, not parsed text — the Repo's
      own docs are explicit that no real OCR/parsing pipeline exists
      yet), and this Adapter does no file I/O of its own. Left unset so
      MaterialRuntime.add()'s own defaults apply untouched — this is
      exactly what "partial" in `MaterialRuntime.add(partial)` means.

   4. convertMaterial()'s `folderId` is explicitly `null` — a Package has
      no folder concept. Per Sprint AI-107's Folder-Optional fix
      (AI107-01), `folderId: null` is a fully valid, fully-supported
      "unscoped" Study Scope end-to-end, not a degraded state.

   5. convertQuestions() targets `AHS.QuestionRuntime.importQuestions
      (examId, questions)` — Sprint AI-103's own "Runtime Extension"
      (js/runtime/QuestionRuntime.js), not
      `AHS.LearningQuestionRuntime.add()`. Two concrete reasons, not
      preference: (a) ImportRuntime.js already established
      importQuestions() as the sanctioned target for converting an
      externally-sourced question set into an existing Runtime — direct,
      reusable precedent; (b) LearningQuestionRuntime.add() enforces a
      strict 10-field completeness gate that requires
      `traceability.knowledgeId` / `conceptId` / `learningObjective` —
      concepts a Teaching Material Package has no honest source for.
      Targeting it would force either fabricating those fields (forbidden
      by every EO in this track) or the write being silently refused by
      LearningQuestionRuntime's own gate. QuestionRuntime.importQuestions()
      has no such gate — it stores whatever array it is given — so it is
      the only honestly-satisfiable target today.

   6. convertQuestions()'s output preserves `questionSource` / `origin` /
      `ocrConfidence` / `needsReview` / `questionNumber` / `page` /
      `version` / `createdDate` alongside the base
      {id, type, question, options, answer, explanation} shape
      ImportRuntime.js's importQuiz() established. QuestionRuntime.
      importQuestions() places no restriction on a question object's
      shape (it just clones the array), so carrying the extra
      provenance fields through is safe and lossless — and preserving
      them is the entire point of EO-S1.1-002A/003's Question Source
      Rule; a future Quiz Center Runtime/UI (this EO's own "Display
      Contract for a future Runtime") needs them to still be present.

   7. convertSummary() drops Package Summary.json's `keywords` and
      `keyPoints` fields. SummaryRuntime's schema (coreConcepts/
      definitions/pitfalls/memorize/reviewSuggestions) has no keywords
      field — same honest gap Sprint AI-103's ImportRuntime.js already
      flagged for a different import format's Keywords field ("an
      honest gap, not fabricated content"). Unlike that Sprint, this
      Adapter does NOT fold `keyPoints` into `coreConcepts` either,
      because Package Summary.json already has its own explicit
      `coreConcepts` field — folding a second, differently-named list
      into it here would duplicate/mislabel, not just fill a gap.
      `memorize` / `reviewSuggestions` are left unset (Package has no
      equivalent data) so SummaryRuntime.add()'s own `[]` defaults apply.

   8. Both convertSummary() and convertQuestions() accept an optional
      `materialRuntimeId` parameter, used in place of the Package's own
      `tm_N` materialId when set. Reason: MaterialRuntime.add() assigns
      its own `id` ("rt_" + seq) and does NOT read/preserve any id a
      caller supplies — so once a Package is actually imported, the real
      MaterialRuntime record's `id` (not the Package's `tm_N`) is what
      Summary/Question records must reference to stay linked to the
      Material Center entry. This mirrors ImportRuntime.js's own
      `material.id` threading. Falls back to the Package's own
      `materialId` so each function stays independently testable.

   9. convertRelated() has no Runtime to target at all: a repo-wide
      search (`grep -rln "related" js/runtime/*.js`) found no "related
      materials" concept in any existing Runtime — only unrelated
      matches (a per-question `relatedConcepts` array field, and two
      comments literally saying "unrelated"). convertRelated() is
      therefore a pure pass-through/normalization (materialId + reason
      pairs only) with no wiring target today — documented the same way
      EO-S1.1-003 documented its Display Contract: a shape for a future
      Runtime, not something this file connects to anything.

   10. validatePackage() reuses ValidateMaterial.js by running it as a
       child process (`node ValidateMaterial.js <materialId>`) and
       parsing its "<N> PASS / <M> FAIL" summary line and exit code —
       it does not re-implement or duplicate any check ("不得建立第二套
       Adapter"), and it does not require touching or refactoring
       ValidateMaterial.js's already-shipped, already-tested CLI
       behavior at all.
   --------------------------------------------------------------------- */
"use strict";
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/* deriveTitle() — see judgment call (1) above. Real fields only, never
   invented text. */
function deriveTitle(metadata) {
  metadata = metadata || {};
  var parts = [metadata.chapter, metadata.unit].filter(function (v) { return !!v; });
  if (parts.length) { return parts.join(" "); }
  return metadata.materialId || null;
}

/* convertMaterial(metadata) -> partial object accepted by
   AHS.MaterialRuntime.add(partial). Only sets fields the Package
   genuinely carries; everything else is left for MaterialRuntime's own
   defaults (see judgment call (3)). */
function convertMaterial(metadata) {
  if (!isPlainObject(metadata)) { return null; }
  var partial = { folderId: null };
  if (metadata.subject) { partial.subject = metadata.subject; }
  if (metadata.grade) { partial.grade = metadata.grade; }
  if (metadata.chapter) { partial.chapter = metadata.chapter; }
  if (metadata.unit) { partial.category = metadata.unit; }
  if (metadata.uploadDate) { partial.date = metadata.uploadDate; }
  var title = deriveTitle(metadata);
  if (title) { partial.title = title; }
  return partial;
}

/* convertSummary(summary, metadata, materialRuntimeId) -> record
   accepted by AHS.SummaryRuntime.add(record). metadata is optional
   (fills subject/grade/chapter/section/title when supplied — Package
   Summary.json alone has none of those). */
function convertSummary(summary, metadata, materialRuntimeId) {
  if (!isPlainObject(summary)) { return null; }
  metadata = metadata || {};
  var record = {
    materialId: materialRuntimeId || summary.materialId,
    coreConcepts: Array.isArray(summary.coreConcepts) ? summary.coreConcepts.slice() : [],
    definitions: Array.isArray(summary.definitions) ? summary.definitions.slice() : [],
    pitfalls: Array.isArray(summary.pitfalls) ? summary.pitfalls.slice() : []
  };
  /* AI-112 AI-702/AI-706: real passthrough only — reviewSuggestions is
     omitted entirely (not an empty array) when the Package genuinely has
     none, so js/components/SummaryCenter.js's own existing
     deriveReviewSuggestions() render-time fallback (HOTFIX-004) still
     honestly kicks in exactly as before; a real Package-provided value
     always wins, never overwritten. */
  if (Array.isArray(summary.reviewSuggestions) && summary.reviewSuggestions.length) {
    record.reviewSuggestions = summary.reviewSuggestions.slice();
  }
  if (metadata.subject) { record.subject = metadata.subject; }
  if (metadata.grade) { record.grade = metadata.grade; }
  if (metadata.chapter) { record.chapter = metadata.chapter; }
  if (metadata.unit) { record.section = metadata.unit; }
  var title = deriveTitle(metadata);
  if (title) { record.title = title; }
  return record;
}

/* convertQuestions(questionBank, materialRuntimeId) -> array accepted as
   the `questions` argument of AHS.QuestionRuntime.importQuestions(examId,
   questions). See judgment calls (5) and (6). */
function convertQuestions(questionBank, materialRuntimeId) {
  if (!isPlainObject(questionBank) || !Array.isArray(questionBank.questions)) { return []; }
  var materialId = materialRuntimeId || questionBank.materialId;
  return questionBank.questions.map(function (q) {
    var converted = {
      id: q.questionId,
      materialId: materialId,
      questionNumber: q.questionNumber,
      type: q.type,
      question: q.question,
      options: Array.isArray(q.options) ? q.options.slice() : [],
      answer: q.answer,
      explanation: q.explanation || "",
      questionSource: q.questionSource,
      origin: q.origin,
      page: q.page,
      version: q.version,
      createdDate: q.createdDate
    };
    if (q.questionSource === "ORIGINAL") {
      converted.ocrConfidence = q.ocrConfidence;
      converted.needsReview = q.needsReview;
    }
    /* AI-112 AI-702/AI-706: real passthrough only, omitted when absent —
       closes the same gap HOTFIX-004 found and worked around at render
       time (js/ui/QuestionCard.js's resolveDifficulty() had to look
       difficulty up via a separate resolver because this Adapter never
       carried it). knowledgePoint mirrors the field the data/materials/
       track's own real material already has per question. */
    if (q.knowledgePoint) { converted.knowledgePoint = q.knowledgePoint; }
    if (q.difficulty) { converted.difficulty = q.difficulty; }
    return converted;
  });
}

/* convertRelated(related) -> materialId/reason pairs. No Runtime reads
   this today (see judgment call (9)) — provisional shape for a future
   Runtime. */
function convertRelated(related) {
  if (!isPlainObject(related) || !Array.isArray(related.related)) { return []; }
  return related.related.map(function (r) {
    return { materialId: r.materialId, reason: r.reason };
  });
}

/* validatePackage(materialId) -> { valid, pass, fail, output }. Reuses
   ValidateMaterial.js as-is via child process (judgment call (10)) —
   does not re-implement any check. */
function validatePackage(materialId) {
  var scriptPath = path.join(__dirname, "ValidateMaterial.js");
  var result = spawnSync(process.execPath, [scriptPath, materialId], { encoding: "utf8" });
  var output = (result.stdout || "") + (result.stderr || "");
  var summaryMatch = /(\d+)\s+PASS\s*\/\s*(\d+)\s+FAIL/.exec(output);
  return {
    valid: result.status === 0,
    pass: summaryMatch ? Number(summaryMatch[1]) : null,
    fail: summaryMatch ? Number(summaryMatch[2]) : null,
    output: output
  };
}

/* loadPackage(materialId) — convenience only (not one of this EO's 5
   named Adapter functions), mirrors ValidateMaterial.js's own file
   loading so a caller/CLI can get parsed Package objects without
   duplicating that logic. Missing files load as null, never throw. */
function loadPackage(materialId) {
  function loadJson(file) {
    var p = path.join(ROOT, "materials", materialId, file);
    if (!fs.existsSync(p)) { return null; }
    try { return JSON.parse(fs.readFileSync(p, "utf8")); }
    catch (e) { return null; }
  }
  return {
    metadata: loadJson("metadata.json"),
    manifest: loadJson("manifest.json"),
    summary: loadJson("summary.json"),
    questionBank: loadJson("questions.json"),
    related: loadJson("related.json")
  };
}

module.exports = {
  convertMaterial: convertMaterial,
  convertSummary: convertSummary,
  convertQuestions: convertQuestions,
  convertRelated: convertRelated,
  validatePackage: validatePackage,
  loadPackage: loadPackage
};

/* CLI preview (read-only — loads a Package and prints every conversion
   as JSON; writes nothing, matches ValidateMaterial.js's own
   "node <script> <materialId>" convention). */
if (require.main === module) {
  var materialId = process.argv[2];
  if (!materialId) {
    console.error("Usage: node TeachingMaterialAdapter.js <materialId>  (e.g. tm_1)");
    process.exit(1);
  }
  var pkg = loadPackage(materialId);
  var preview = {
    material: convertMaterial(pkg.metadata),
    summary: convertSummary(pkg.summary, pkg.metadata),
    questions: convertQuestions(pkg.questionBank),
    related: convertRelated(pkg.related)
  };
  console.log(JSON.stringify(preview, null, 2));
}
