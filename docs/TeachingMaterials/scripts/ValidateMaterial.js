/* docs/TeachingMaterials/scripts/ValidateMaterial.js — EO-S1.1-002 QA checklist's
   "JSON Schema 合法" item, made concrete and runnable.

   Hand-rolled, dependency-free structural validator (matching this repository's
   existing pattern — e.g. js/runtime/ImportValidator.js — rather than adding a
   JSON-Schema library dependency for four small, fixed record shapes). Not part
   of the running app: this script is never <script>-tagged, never touches
   Runtime/UI, and has zero effect unless run manually.

   Usage: node docs/TeachingMaterials/scripts/ValidateMaterial.js <materialId>
   Validates materials/<materialId>/{metadata,summary,questions,related}.json
   against schema/{Metadata,Summary,QuestionBank,RelatedMaterials}.schema.json. */
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
  if (schemaResult.error) { check(recordName + " schema loads", false, schemaResult.error); return; }
  const dataResult = loadJson(path.join(ROOT, "materials", materialId, jsonFile));
  if (dataResult.error) { check(recordName + " (" + jsonFile + ") present and valid JSON", false, dataResult.error); return; }
  const errors = validateAgainstSchema(dataResult.value, schemaResult.value, recordName);
  if (errors.length === 0) {
    check(recordName + " conforms to " + schemaFile, true);
  } else {
    errors.forEach((e) => check(recordName + " conforms to " + schemaFile, false, e));
  }
}

console.log("Validating " + materialId + " against docs/TeachingMaterials/schema/*.schema.json");
validateFile("Metadata", "metadata.json", "Metadata.schema.json");
validateFile("Summary", "summary.json", "Summary.schema.json");
validateFile("QuestionBank", "questions.json", "QuestionBank.schema.json");
validateFile("RelatedMaterials", "related.json", "RelatedMaterials.schema.json");

console.log("\n" + pass + " PASS / " + fail + " FAIL");
process.exit(fail === 0 ? 0 : 1);
