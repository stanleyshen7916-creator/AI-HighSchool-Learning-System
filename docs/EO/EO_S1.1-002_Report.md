# EO_S1.1-002_Report.md — Manual Teaching Material Import Workflow (v1.0)

## Summary

Refines EO-S1.1-001 v1.1's Teaching Material Repository with the exact rules this EO LOCKs:
a concrete 11-field Metadata schema, AI/Original provenance tagging on every question, the
New/Existing/Related material classification rule, and the exact per-material Git commit
message format. Still zero real material analyzed — no material was attached to this EO
either; this is again capability/workflow refinement, not content.

## What changed

- **`schema/Metadata.schema.json`** rewritten to EO-S1.1-002's exact 11 fields
  (`materialId`/`subject`/`grade`/`publisher`/`chapter`/`unit`/`keywords`/`difficulty`/
  `source`/`uploadDate`/`version`, camelCase) — supersedes EO-S1.1-001's initial reuse of
  `MetadataParser.js`'s PascalCase field names, which described a different context (the
  raw `Metadata.json` import file, not this Repository's own schema).
- **`schema/QuestionBank.schema.json`** — added required `origin` field
  (`"AI"` | `"Original"`) per question, per this EO's explicit requirement ("所有 AI 衍生題
  必須標示 origin = AI；原考題 origin = Original").
- **`scripts/ValidateMaterial.js`** (new) — a hand-rolled, dependency-free structural
  validator (matching this repository's existing pattern, e.g. `ImportValidator.js`, rather
  than adding a JSON-Schema library dependency) that checks a material folder's four JSON
  files against the four schemas. Makes the QA checklist's "JSON Schema 合法" item concrete
  and runnable rather than a manual eyeball check. **Tested against scratch, never-committed
  data** before being relied on: confirmed it rejects a malformed `materialId` (wrong
  pattern), confirmed it accepts well-formed data, confirmed it catches a missing required
  field (`origin`) — all three test runs' scratch files were deleted immediately after,
  never staged or committed.
- **`README.md`** — added the Import Rule (New/Existing/Related classification) and Git
  Rule (`feat(material): import {materialId}`) sections; updated the Metadata table,
  Question Bank section, directory layout, workflow diagram, and QA checklist to match.

## Decision made without an explicit answer from Project Owner (flagged, not hidden)

This EO's Import Rule says to distinguish New/Existing/Related Material but doesn't specify
*how* to detect "the same material" on a second upload. Documented in the README's Import
Rule section: match on `subject` + `chapter` + `unit` **and** the same original filename (or
a confirmed title/heading match for a rescanned paper document with no stable filename) —
deliberately conservative, so two different materials that merely share a chapter are never
wrongly merged into one `materialId`. Reversible/refinable once Project Owner gives explicit
guidance or the first real duplicate-upload case arises.

## What was deliberately NOT done

- No real material analyzed (none was attached to this EO).
- No Runtime modified — `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/
  `WrongBookRuntime` byte-identical to before this EO.
- No UI modified.
- No Repository redesign — this EO's own Acceptance clause explicitly forbids "要求修改
  Runtime／要求修改 UI／要求重新設計 Repository"; every change here is additive refinement
  to the schema/workflow EO-S1.1-001 v1.1 already established, not a redesign.

## Git Rule note

This report and the underlying schema/workflow changes are infrastructure to the Repository
itself, not a material import — committed under this repository's normal Sprint/EO-label
convention, not the `feat(material): import {materialId}` format this EO LOCKs specifically
for future per-material import commits (documented explicitly in the README so the
distinction isn't lost).

## QA

`npm run verify` PASS, `npm test` 181/181 PASS (unaffected — this Repository remains inert
to the running app). `ValidateMaterial.js` self-tested against scratch data (see above),
confirmed working before being documented as the QA checklist's validation step.

## Ready state

Same as EO-S1.1-001 v1.1: waiting for Project Owner to provide real teaching material. On
receipt, the workflow this EO refines applies exactly as documented in
`docs/TeachingMaterials/README.md`.
