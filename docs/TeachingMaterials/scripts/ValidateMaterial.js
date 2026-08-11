/* docs/TeachingMaterials/scripts/ValidateMaterial.js — EO-S1.1-002 QA checklist's
   "JSON Schema 合法" item, made concrete and runnable. Extended by EO-S1.1-002A
   (Question Source pairing) and EO-S1.1-003 (Package Standard: manifest.json,
   source/ folder, OCR threshold, materialType=EXAM cross-check).

   Hand-rolled, dependency-free structural validator (matching this repository's
   existing pattern — e.g. js/runtime/ImportValidator.js — rather than adding a
   JSON-Schema library dependency for five small, fixed record shapes). Not part
   of the running app: this script is never <script>-tagged, never touches
   Runtime/UI, and has zero effect unless run manually.

   Usage: node docs/TeachingMaterials/scripts/ValidateMaterial.js <materialId>
   Validates materials/<materialId>/{metadata,manifest,summary,questions,related}.json
   and materials/<materialId>/source/ against schema/*.schema.json. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const materialId = process.argv[2];

if (!materialId) {
  console.error("Usage: node ValidateMaterial.js <materialId>  (e.g. tm_1)");
  process.exit(1);
}

let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log("  PASS  " + label); }
  else { fail++; console.log("  FAIL  " + label + (detail ? " -- " + detail : "")); }
}

function loadJson(p) {
  if (!fs.existsSync(p)) return { error: "missing file: " + p };
  try { return { value: JSON.parse(fs.readFileSync(p, "utf8")) }; }
  catch (e) { return { error: "invalid JSON: " + e.message }; }
}

function typeOk(value, expected) {
  const types = Array.isArray(expected) ? expected : [expected];
  return types.some((t) => {
    if (t === "null") return value === null;
    if (t === "array") return Array.isArray(value);
    if (t === "integer") return Number.isInteger(value);
    return typeof value === t;
  });
}

/* Minimal structural check: required fields present, type matches, enum
   matches, no unexpected additional properties (when additionalProperties:
   false) — enough for this Repository's four small, fixed record shapes;
   not a general-purpose JSON Schema engine. */
function validateAgainstSchema(obj, schema, pathLabel) {
  const errors = [];
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    errors.push(pathLabel + ": expected object");
    return errors;
  }
  (schema.required || []).forEach((key) => {
    if (!(key in obj)) errors.push(pathLabel + ": missing required field '" + key + "'");
  });
  Object.keys(obj).forEach((key) => {
    const propSchema = (schema.properties || {})[key];
    if (!propSchema) {
      if (schema.additionalProperties === false) {
        errors.push(pathLabel + ": unexpected field '" + key + "'");
      }
      return;
    }
    const value = obj[key];
    if (propSchema.type && !typeOk(value, propSchema.type)) {
      errors.push(pathLabel + "." + key + ": expected type " + JSON.stringify(propSchema.type) + ", got " + JSON.stringify(value));
    }
    if (propSchema.enum && value !== undefined && propSchema.enum.indexOf(value) === -1) {
      errors.push(pathLabel + "." + key + ": expected one of " + JSON.stringify(propSchema.enum) + ", got " + JSON.stringify(value));
    }
    if (propSchema.pattern && typeof value === "string" && !new RegExp(propSchema.pattern).test(value)) {
      errors.push(pathLabel + "." + key + ": does not match pattern " + propSchema.pattern);
    }
    if (propSchema.type === "array" && Array.isArray(value) && propSchema.items) {
      value.forEach((item, i) => {
        if (propSchema.items.type === "object") {
          errors.push(...validateAgainstSchema(item, propSchema.items, pathLabel + "." + key + "[" + i + "]"));
        } else if (propSchema.items.type && !typeOk(item, propSchema.items.type)) {
          errors.push(pathLabel + "." + key + "[" + i + "]: expected type " + propSchema.items.type);
        }
      });
    }
  });
  return errors;
}

function validateFile(recordName, jsonFile, schemaFile) {
  console.log("\n[" + recordName + "]");
  const schemaResult = loadJson(path.join(ROOT, "schema", schemaFile));
  if (schemaResult.error) { check(recordName + " schema loads", false, schemaResult.error); return null; }
  const dataResult = loadJson(path.join(ROOT, "materials", materialId, jsonFile));
  if (dataResult.error) { check(recordName + " (" + jsonFile + ") present and valid JSON", false, dataResult.error); return null; }
  const errors = validateAgainstSchema(dataResult.value, schemaResult.value, recordName);
  if (errors.length === 0) {
    check(recordName + " conforms to " + schemaFile, true);
  } else {
    errors.forEach((e) => check(recordName + " conforms to " + schemaFile, false, e));
  }
  return dataResult.value;
}

/* EO-S1.1-002A Question Source Rule, extended by EO-S1.1-003 — pairing/
   consistency/threshold checks plain JSON Schema draft-07 (as hand-rolled
   above) can't express. Not optional: "不得混用。不得省略。" */
function validateQuestionSourceRule(questionBank) {
  console.log("\n[Question Source Rule — EO-S1.1-002A / EO-S1.1-003]");
  if (!questionBank || !Array.isArray(questionBank.questions)) {
    check("Question Source Rule checkable", false, "no questions[] to check");
    return;
  }
  const PAIRING = { ORIGINAL: "Uploaded Material", AI_GENERATED: "AI", TEACHER_CREATED: "Teacher" };
  const seenIds = {};
  questionBank.questions.forEach((q, i) => {
    const label = "questions[" + i + "] (" + (q.questionId || "?") + ")";
    if (q.questionSource && q.origin) {
      check(label + ": questionSource/origin pair consistent",
        PAIRING[q.questionSource] === q.origin,
        "questionSource=" + q.questionSource + " origin=" + q.origin + " (expected " + PAIRING[q.questionSource] + ")");
    }
    const isOriginal = q.questionSource === "ORIGINAL";
    ["ocrConfidence", "needsReview"].forEach((field) => {
      if (isOriginal) {
        check(label + ": ORIGINAL question declares " + field + " explicitly", field in q);
      } else if (q.questionSource) {
        check(label + ": " + q.questionSource + " does not carry " + field + " (ORIGINAL-only concept)",
          !(field in q), "found " + field + " on a " + q.questionSource + " question");
      }
    });
    if (isOriginal && typeof q.ocrConfidence === "number") {
      if (q.ocrConfidence < 0.90) {
        check(label + ": ocrConfidence < 0.90 correctly forces needsReview=true (OCR Rule — 不得猜測)",
          q.needsReview === true, "ocrConfidence=" + q.ocrConfidence + " but needsReview=" + q.needsReview);
      }
    }
    if (q.materialId && questionBank.materialId) {
      check(label + ": question-level materialId matches record materialId",
        q.materialId === questionBank.materialId,
        q.materialId + " != " + questionBank.materialId);
    }
    if (q.questionId) {
      check(label + ": questionId unique within this material", !seenIds[q.questionId], "duplicate questionId " + q.questionId);
      seenIds[q.questionId] = true;
    }
  });
}

/* EO-S1.1-003 Original Question Rule (cross-file: metadata.materialType +
   questions.questionSource): "若 materialType = EXAM，則所有 questionSource
   = ORIGINAL"。 */
function validateOriginalQuestionRule(metadata, questionBank) {
  console.log("\n[Original Question Rule — EO-S1.1-003]");
  if (!metadata || !questionBank || !Array.isArray(questionBank.questions)) {
    check("Original Question Rule checkable", false, "metadata.json or questions.json missing/invalid");
    return;
  }
  if (metadata.materialType !== "EXAM") {
    check("materialType != EXAM, rule not applicable", true);
    return;
  }
  const nonOriginal = questionBank.questions.filter((q) => q.questionSource !== "ORIGINAL");
  check("materialType=EXAM: every question is questionSource=ORIGINAL",
    nonOriginal.length === 0,
    nonOriginal.length + " non-ORIGINAL question(s): " + nonOriginal.map((q) => q.questionId).join(", "));
}

/* EO-S1.1-003 Package Structure: source/ must exist as a real directory
   (original uploaded files, byte-identical — never verified for byte-
   identity here, since that would require the original file to diff
   against, which this script doesn't have; existence is what's checkable). */
function validateSourceFolder() {
  console.log("\n[Package Structure — source/]");
  const sourceDir = path.join(ROOT, "materials", materialId, "source");
  const exists = fs.existsSync(sourceDir) && fs.statSync(sourceDir).isDirectory();
  check("source/ directory exists", exists, sourceDir);
  if (exists) {
    const files = fs.readdirSync(sourceDir).filter((f) => f !== ".gitkeep");
    check("source/ contains at least one original file", files.length > 0);
  }
}

console.log("Validating " + materialId + " against docs/TeachingMaterials/schema/*.schema.json");
const metadata = validateFile("Metadata", "metadata.json", "Metadata.schema.json");
validateFile("Manifest", "manifest.json", "Manifest.schema.json");
validateFile("Summary", "summary.json", "Summary.schema.json");
const questionBank = validateFile("QuestionBank", "questions.json", "QuestionBank.schema.json");
validateQuestionSourceRule(questionBank);
validateOriginalQuestionRule(metadata, questionBank);
validateFile("RelatedMaterials", "related.json", "RelatedMaterials.schema.json");
validateSourceFolder();

console.log("\n" + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
