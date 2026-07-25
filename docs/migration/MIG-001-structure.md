# MIG-001 — Repository Migration Foundation

This document records the directory scaffold created by EO-MIG-001. It is
a **structure-only** delta: no existing code, UI, CSS, HTML, runtime, or
prompt was moved, renamed, or modified, and no framework or npm
dependency was added.

## New top-level structure

```
platform/
  high-school/          # future home for the high-school app shell
ai-engine/
  provider/  prompt/  parser/  knowledge/  summary/
  question/  review/  explanation/  chat/  utils/
shared/
  constants/  config/  types/  helpers/  api/  logger/  events/
docs/
  architecture/  baseline/  migration/  eo/
  qa/  release/  api/  design/
```

All leaf directories currently hold only a `.gitkeep` placeholder so
that git preserves the (otherwise empty) structure. They are inert:
nothing in the running application references them.

## Compatibility (TASK-005)

The migration foundation is purely additive, so backward compatibility
is guaranteed by construction:

- **GitHub Pages** keeps working — the entry pages (`index.html`,
  `materials.html`, and the other existing HTML files) are untouched and
  continue to load exactly the same scripts from the same paths.
- **All existing pages** keep working — no HTML/CSS/JS was edited, so
  every page behaves byte-for-byte as before.
- **No Runtime API change** — every runtime under `js/runtime/` and
  `js/parser/` is byte-identical to the pre-migration snapshot.
- **No business-logic change** — no `.js` under `js/` was modified.

The empty `platform/`, `ai-engine/`, and `shared/` trees are the
*targets* of a later migration; this EO only lays them down. Actual code
relocation is explicitly out of scope here and must be performed by a
subsequent EO.

## Note on existing `docs/` subfolders

`docs/` already contained mixed-case folders (`Architecture`, `Decision`,
`EO`, `PAT`, `PMO`, `QA`, `Release`, `Specifications`) from earlier EO
reports. The new lowercase folders (`architecture`, `baseline`,
`migration`, `eo`, `qa`, `release`, `api`, `design`) are created
alongside them without touching the existing ones. Consolidating the two
naming conventions is a documentation task for a later EO, not part of
this structure-only delta.
