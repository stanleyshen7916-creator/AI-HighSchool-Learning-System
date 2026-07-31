# EO_S1.2-001_Report.md — Teaching Material Adapter Interface (Revision v1.0)

## Summary

This EO was originally issued as "Material Runtime Repository Reader" v1.0, which was
**paused before any implementation** because it conflicted with real repository state on two
points, both reported in plain prose (not implemented):

1. It proposed a new `MaterialRuntime` with a different API than the real, existing, LOCK
   `AHS.MaterialRuntime` (referenced by 29 files) — a direct naming collision.
2. It proposed live, on-every-refresh Repository reads, which is architecturally impossible
   given `scripts/verify/VerifyForbiddenPatterns.js`'s scanner-enforced ban on `fetch(`/
   `XMLHttpRequest`, the `file://` compatibility requirement (local-file `fetch` fails under
   `file://` due to CORS), and the absence of any build tool to inline JSON at build time.

Project Owner re-issued the EO as "Teaching Material Adapter Interface" v1.0, which resolves
both conflicts directly: no new Runtime, `MaterialRuntime` explicitly confirmed LOCK and
untouched, and the "read live from disk on every refresh" requirement dropped. The revised
scope — a pure, stateless data-shape converter — is fully buildable under existing
constraints, and is what this report documents.

## What was built

**`docs/TeachingMaterials/scripts/TeachingMaterialAdapter.js`** (new) — five functions, per
this EO's own named API:

- `convertMaterial(metadata)` → partial object accepted by `AHS.MaterialRuntime.add(partial)`.
- `convertSummary(summary, metadata, materialRuntimeId)` → record accepted by
  `AHS.SummaryRuntime.add(record)`.
- `convertQuestions(questionBank, materialRuntimeId)` → array accepted as the `questions`
  argument of `AHS.QuestionRuntime.importQuestions(examId, questions)`.
- `convertRelated(related)` → normalized `{materialId, reason}` pairs (no Runtime target
  exists yet — see judgment calls below).
- `validatePackage(materialId)` → reuses `ValidateMaterial.js` via a child process rather than
  re-implementing any check ("不得建立第二套 Adapter").

Plus `loadPackage(materialId)` (a convenience file-loading helper, not one of the five named
functions) and a read-only CLI preview (`node TeachingMaterialAdapter.js <materialId>`), for
manual inspection — writes nothing.

File location (`docs/TeachingMaterials/scripts/`, alongside `ValidateMaterial.js`) is Claude's
own judgment call — this EO does not name a path.

**`docs/TeachingMaterials/README.md`** — new "Teaching Material Adapter" section (architecture,
what it does/doesn't do, testing performed); directory-layout diagram and title header updated;
"Explicitly out of scope" section's wording narrowed from "no Runtime loader/adapter... has
been built" to "no Runtime loader/adapter **wired into the running app**... has been built",
since a standalone conversion utility now exists but is still not called by anything.

## Judgment calls made without an explicit answer from Project Owner (flagged, not hidden)

All ten are documented in the Adapter file's own header comment; summarized here:

1. **`title`**: Package `metadata.json` has no title field at all (and, unlike Sprint AI-103's
   `ImportRuntime.js`, no body text to derive a heading from either). Derived from
   `chapter + " " + unit` (both real fields) when present; falls back to the Package's own
   `materialId` (e.g. `"tm_1"`) otherwise — still real data, not a fabricated placeholder.
2. **`category`**: mapped from `metadata.unit`, reusing Sprint AI-103's `ImportRuntime.js`
   precedent (`category: resolveField(metadata, header, "unit", "unit")`) exactly, rather than
   inventing a new mapping from `materialType`.
3. **`content`/`fileName`/`fileType`/`fileSize`/`file`**: left unset in `convertMaterial()`'s
   output — the Package has no single extracted-text field and the Adapter does no file I/O of
   its own — so `MaterialRuntime.add()`'s own defaults apply untouched.
4. **`folderId: null`**: explicit, per Sprint AI-107's Folder-Optional fix — a fully valid
   "unscoped" Study Scope end-to-end, not a degraded state.
5. **Question target Runtime**: `convertQuestions()` targets
   `AHS.QuestionRuntime.importQuestions(examId, questions)`, not
   `AHS.LearningQuestionRuntime.add()`. Two concrete technical reasons, not preference:
   (a) `ImportRuntime.js` already established `importQuestions()` as the sanctioned route for
   converting an externally-sourced question set into an existing Runtime; (b)
   `LearningQuestionRuntime.add()` enforces a strict 10-field completeness gate requiring
   `traceability.knowledgeId`/`conceptId`/`learningObjective` — concepts a Teaching Material
   Package has no honest source for. Targeting it would force fabricating those fields (banned
   by every EO in this track) or have the write silently refused by its own gate.
   `QuestionRuntime.importQuestions()` has no such gate.
6. **Question provenance fields preserved**: `convertQuestions()`'s output keeps
   `questionSource`/`origin`/`ocrConfidence`/`needsReview`/`questionNumber`/`page`/`version`/
   `createdDate` alongside the base shape `ImportRuntime.js`'s `importQuiz()` established.
   `QuestionRuntime.importQuestions()` places no restriction on question-object shape, so this
   is safe, and preserving these fields is the entire point of EO-S1.1-002A/003's Question
   Source Rule — a future Runtime/UI (the Display Contract) needs them present.
7. **Summary `keywords`/`keyPoints` dropped**: `SummaryRuntime`'s schema has no keywords field
   at all — the same honest gap `ImportRuntime.js` already flagged for a different import
   format's Keywords field ("an honest gap, not fabricated content"). Unlike that Sprint, this
   Adapter does **not** fold `keyPoints` into `coreConcepts` either, because Package
   `summary.json` already has its own explicit `coreConcepts` field — folding a second,
   differently-named list into it would duplicate/mislabel, not just fill a gap.
8. **`materialRuntimeId` threading**: `convertSummary()`/`convertQuestions()` accept an
   optional `materialRuntimeId`, used instead of the Package's own `tm_N` when set.
   `MaterialRuntime.add()` assigns its own `id` ("rt_" + seq) and never reads/preserves a
   caller-supplied id — so once a Package is actually imported, Summary/Question records must
   reference the real `MaterialRuntime` record's `id`, not the Package's `tm_N`, to stay
   linked. Mirrors `ImportRuntime.js`'s own `material.id` threading. Falls back to the
   Package's own `materialId` so each function stays independently testable.
9. **`convertRelated()` has no Runtime target**: `grep -rln "related" js/runtime/*.js` found no
   "related materials" concept anywhere in the Runtime layer — only an unrelated per-question
   `relatedConcepts` array field and two comments literally saying "unrelated". Its output is a
   provisional shape for a future Runtime, same treatment as EO-S1.1-003's Display Contract.
10. **`validatePackage()` reuse strategy**: rather than adding `module.exports` to the
    already-shipped, already-tested `ValidateMaterial.js` (a real, if small, behavior-surface
    change to committed code), `validatePackage()` runs it unmodified as a child process and
    parses its `"<N> PASS / <M> FAIL"` summary line and exit code. Zero risk to existing,
    working code; still genuinely reuses rather than duplicates every check.

## Testing before relying on any of this (scratch data, never committed)

Built a realistic scratch Package (`tm_998`, `materialType: HANDOUT`, `source/` with one dummy
file, three questions covering all three `questionSource` values):

1. `node ValidateMaterial.js tm_998` → 23/23 PASS (confirms the scratch Package itself is
   schema-valid before trusting any conversion of it).
2. `node TeachingMaterialAdapter.js tm_998` → inspected the JSON preview of all four
   conversions by eye against the schemas and each target Runtime's field list.
3. **End-to-end acceptance test** (the important one): loaded the real, unmodified
   `MaterialRuntime.js`/`SummaryRuntime.js`/`QuestionRuntime.js`/`QuestionBank.js` into an
   isolated Node `vm` context (stubbed `window` only — no other change) and fed the Adapter's
   output directly through the real `AHS.MaterialRuntime.add()`, `AHS.SummaryRuntime.add()`,
   and `AHS.QuestionRuntime.importQuestions()`. Confirmed every field was genuinely accepted
   (not just shaped correctly on paper): `MaterialRuntime.add()` returned a full, valid record
   (`id: "rt_1"`, correct `title`/`chapter`/`category`/`folderId: null`); the returned `rt_1`
   was then threaded as `materialRuntimeId` into `convertSummary()`/`convertQuestions()`, and
   both `SummaryRuntime.add()`'s and `QuestionRuntime.importQuestions()`'s stored records
   correctly showed `materialId: "rt_1"` (not the Package's `tm_998`) — proving the threading
   design actually works, not just compiles.
4. Edge cases: `convertMaterial(null)`/`convertSummary(null)` → `null`;
   `convertQuestions(null)`/`convertRelated(null)` → `[]`; none throw. A metadata object with
   only `materialId` (no `chapter`/`unit`) → title correctly falls back to the `materialId`
   itself, confirmed.
5. Scratch Package (`materials/tm_998/`) and the temporary Node test script deleted
   immediately after; `git status --short docs/TeachingMaterials/` confirmed clean (only the
   real, intended new file remained) before committing.

## What was deliberately NOT done

- No real material analyzed (none was attached to this EO).
- No new Runtime created; `AHS.MaterialRuntime` untouched (byte-identical) and remains the sole
  LOCK Material Runtime, per this EO's own explicit constraint.
- `js/` and `css/` are completely untouched — the Adapter lives only under `docs/`, is plain
  Node `CommonJS` (uses `require`/`module.exports`, which is fine outside `js/`, where those
  patterns are scanner-forbidden), and is never `<script>`-tagged on any page.
- Material Center (or any other page/component) does **not** call this Adapter — this EO's own
  constraint ("不得修改 Material Center") forbids that wiring here; it remains explicit future
  scope, same as this whole track's running pattern.
- `convertRelated()`'s output is not wired anywhere, since no Runtime exists to receive it.

## QA

`npm run verify` PASS (0 broken paths, 0 legacy references, 0 forbidden-pattern hits — the
Adapter's `require`/`module.exports` usage is outside `js/`, so it is not in scope for that
scanner, consistent with `ValidateMaterial.js` already using the same pattern since
EO-S1.1-002). `npm test` 175/175 PASS + `PipelineRegression` 6/6 PASS (zero regression, as
expected — no `js/`/`css/`/HTML file was touched). Adapter self-tested extensively against
scratch data and the real, unmodified target Runtimes (above) before being documented as
working.

## Ready state

The Adapter is ready to be called once a real Package exists and Project Owner authorizes
actually wiring Material Center (or a future Quiz/Summary import flow) to use it — that wiring
is explicit future scope, not started here. The Repository itself remains genuinely empty,
still awaiting the first real teaching material from Project Owner.
