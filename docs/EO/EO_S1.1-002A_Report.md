# EO_S1.1-002A_Report.md — Question Source Rule (v1.0)

## Summary

This EO has two distinct parts, handled differently:

1. **Repository schema refinement** (Question Source metadata on `questions.json`) —
   **implemented**, consistent with the EO-S1.1-00x track's established "capability, not
   content, Repository stays inert to the live app" pattern.
2. **Live-app display/behavior requirements** (Quiz Center source display + filter,
   Dashboard split statistics, Wrong Book retention, AI Tutor source-aware prompts) —
   **not implemented, flagged for Project Owner confirmation** before any Runtime/UI work
   begins. This is a real, substantive scope question, not a detail to quietly skip.

## Part 1 — What was built

- **`schema/QuestionBank.schema.json`**: added `questionSource` (`"ORIGINAL"` |
  `"AI_GENERATED"`), redefined `origin` to this EO's exact two values (`"Uploaded Material"`
  | `"AI"`, superseding EO-S1.1-002's earlier `"AI"`/`"Original"` values for the same field
  name), added `needsManualReview` (ORIGINAL-only, required explicit `true`/`false`, never
  omitted — implements "若 OCR 信心不足：不得猜測。必須：標記需人工確認。"), renamed `id` →
  `questionId`, added a top-level per-question `materialId` field alongside the existing
  `source.materialId` trace object.
- **`scripts/ValidateMaterial.js`** extended with a `validateQuestionSourceRule()` check —
  plain JSON Schema draft-07 (as hand-rolled here) can't express "these two fields must pair
  consistently," so this is real, additional validation logic, not just documentation.
  Checks: `questionSource`/`origin` pairing, `needsManualReview` presence exactly where
  required (ORIGINAL: required; AI_GENERATED: must be absent), question-level `materialId`
  matches the record's own `materialId`, `questionId` uniqueness within the material.
- **Self-tested against scratch data** before being relied on (never committed): confirmed
  the pairing check genuinely fails a deliberately-mismatched `AI_GENERATED`/`"Uploaded
  Material"` pair, then confirmed it passes once corrected — 11/11 PASS on the corrected
  scratch data. Deleted immediately after.
- **README.md** updated: Question Bank section rewritten for the new fields, QA checklist
  updated, and a new section added documenting Part 2's flagged status explicitly.

## Part 2 — Flagged, not implemented

EO-S1.1-002A's Quiz Center Display Rule, Filter, Statistics, Wrong Book, and AI Tutor
sections describe real behavior in the live, already-shipped, already-PAT-tested
application — not this Repository's own schema. Implementing them would mean:

- Building, for the first time, real Runtime wiring from this Repository into
  `QuestionRuntime`/`QuestionGenerationRuntime` (explicitly deferred as "future scope" by
  both EO-S1.1-001 and EO-S1.1-002's own reports — an unstated prerequisite this EO doesn't
  mention).
- Modifying `js/components/QuizCenter.js` (source badge + filter UI), `js/components/
  Dashboard.js` (split Original/AI-Generated statistics), `js/components/WrongBook.js`
  (retain `questionSource` per entry), and `js/runtime/AITutorService.js` or equivalent
  (source-aware explanation text) — real Runtime and UI surgery on pages this session has
  extensively PAT-tested (Sprint AI-106/107), not schema-only work.
- Doing so while Sprint AI-108's own closing gate ("no new feature planning until v1.0.0
  Release Approval is granted") remains unresolved for anything beyond the EO-S1.1-00x
  Repository track specifically — this would be a materially larger claim on that
  exception than a docs/-only schema refinement.
- With **zero real questions anywhere in the Repository** (`materialsAnalyzed: 0`), there is
  nothing genuine yet for a Quiz Center filter or a Dashboard split-count to operate on.

None of `MaterialRuntime`/`SummaryRuntime`/`QuestionRuntime`/`WrongBookRuntime`/
`QuizCenter.js`/`Dashboard.js`/`WrongBook.js`/`AITutorService.js` were touched. Flagged in
the Repository's own README for visibility, and here, rather than silently implementing a
partial/cosmetic version or silently skipping it without explanation.

## QA

`npm run verify` PASS, `npm test` 181/181 PASS (Repository remains inert to the running
app, so this confirms no regression — same caveat as prior EO reports in this track).

## Ready state

Same as before: waiting for Project Owner to (a) confirm or redirect the Part 2 scope
question, and (b) provide real teaching material. Both can happen independently — Part 2's
question doesn't block continuing to receive and analyze real material under the schema
this EO (Part 1) and its predecessors already established.
