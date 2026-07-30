# EO_S1.1-003_Report.md — Teaching Material Package Standard (v1.0)

## Summary

Formalizes each material's folder as a self-contained Package (`source/` + `metadata.json` +
`manifest.json` + `summary.json` + `questions.json` + `related.json`), per this EO's own
explicit, in-scope request. Unlike EO-S1.1-002A, this EO's own Runtime Rule explicitly
states it does **not** want Runtime changes ("本 EO：不得修改 Material/Quiz/WrongBook/
Dashboard/AI Tutor Runtime。僅建立 Material Package Standard") and its Acceptance clause
says Runtimes will read the Package "後續" (subsequently) — so, unlike EO-S1.1-002A, there
was no scope conflict to flag here: the Quiz Center/AI Tutor sections are read as a Display
Contract for a *future* Runtime, not a build-now instruction. This also retroactively
resolves the ambiguity flagged in EO-S1.1-002A's own report.

## What was built

- **`schema/Manifest.schema.json`** (new): `packageVersion`/`createdDate`/`updatedDate`/
  `repositoryVersion`/`analysisEngine`/`status`. Two judgment calls — this EO names the
  fields, not their allowed values — flagged in both the schema's own `$comment`/
  `description` and the README: `status` enum (`draft`/`pending_review`/`complete`, tied to
  the OCR Rule's review-gating) and `analysisEngine` as a fixed single value (`"Claude"`).
- **`schema/Metadata.schema.json`**: added required `materialType`
  (`TEXTBOOK`/`HANDOUT`/`EXAM`/`HOMEWORK`/`PPT`/`REFERENCE`).
- **`schema/QuestionBank.schema.json`**: added `questionNumber` (the real, un-renumbered
  question label), replaced the earlier nested `source: {materialId, page, section}` object
  with flat `page` (per this EO's own flat field list — avoids duplicating `materialId`,
  which EO-S1.1-002A already made a top-level field; `section` kept as an optional,
  non-required continuity field), added `ocrConfidence`, renamed `needsManualReview` →
  `needsReview` (this EO's exact field name), and added a third `questionSource` value
  `TEACHER_CREATED` (paired `origin: "Teacher"` — **Claude's own judgment call**, since this
  EO doesn't state the pairing).
- **`scripts/ValidateMaterial.js`** extended: `manifest.json` now validated against its
  schema; `questionSource`/`origin` pairing extended to three-way; `ocrConfidence`/
  `needsReview` presence-where-required / absence-where-not checked; OCR threshold check
  (`ocrConfidence < 0.90` ⟹ `needsReview` must be `true`); new cross-file **Original
  Question Rule** check (`metadata.materialType === "EXAM"` ⟹ every question
  `questionSource === "ORIGINAL"`, reporting exactly which questions violate it); new
  `source/` directory-existence check.
- **`README.md`**: directory layout, Metadata/Manifest/Source Files/Question Bank sections,
  workflow diagram, and QA checklist all updated; the EO-S1.1-002A "flagged, not
  implemented" section rewritten into a "Display Contract for a future Runtime" section that
  also carries this EO's own Quiz Center/AI Tutor spec text verbatim (badges, filter values,
  AI Tutor phrases) so a future Runtime implementation has an unambiguous spec to build
  against.

## Testing before relying on any of this (scratch data, never committed)

Built a realistic scratch material (`tm_999`, `materialType: HANDOUT`, `source/` with one
dummy file, four questions covering all three `questionSource` values plus one deliberately
low-`ocrConfidence` `ORIGINAL` question) and ran the extended validator:

- Clean pass: 29/29 PASS on well-formed data.
- Deliberately broke the OCR threshold rule (`ocrConfidence: 0.80` with `needsReview: false`)
  → correctly caught and failed.
- Fixed it, then flipped `metadata.materialType` to `EXAM` (with the AI_GENERATED/
  TEACHER_CREATED questions still present) → the Original Question Rule check correctly
  failed, naming exactly the two violating `questionId`s.
- Deleted `source/` → the source-folder check correctly failed.

All scratch files deleted immediately after each check; `git status` confirmed clean before
committing any real change.

## Decisions made without an explicit answer from Project Owner (flagged, not hidden)

1. **`origin: "Teacher"`** for `questionSource: "TEACHER_CREATED"` — this EO names the third
   `questionSource` value but not its paired `origin` value; chosen for structural
   consistency with the other two pairs.
2. **`manifest.json`'s `status` enum and `analysisEngine`'s fixed value** — see above.
3. **Dropping the nested `source` object** in favor of flat `page` (keeping `section` as
   optional) rather than carrying both a nested and a flat structure for the same data —
   judged as the reading most consistent with "不得建立其他教材格式" (don't invent
   redundant structure), not explicitly instructed either way.

## What was deliberately NOT done

- No real material analyzed (none was attached to this EO).
- No Runtime or UI modified — explicitly this EO's own instruction, not just this track's
  running pattern. `MaterialRuntime`/`QuizCenter.js`/`Dashboard.js`/`WrongBook.js`/
  `AITutorService.js` byte-identical to before.
- The Quiz Center/AI Tutor "Display Contract" content is documentation only — badges, filter
  options, and explanation strings are written down as a spec, not implemented as code
  anywhere.

## QA

`npm run verify` PASS, `npm test` 181/181 PASS (Repository remains inert to the running
app). Validator self-tested extensively against scratch data (above) before being relied on.

## Ready state

Same as before: waiting for Project Owner to provide real teaching material. The Package
Standard this EO establishes is now the complete, ready target schema — README documents
every field and rule a real analysis must satisfy.
