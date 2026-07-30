# Sprint AI-107｜Release Stabilization（Release Blocker Fix）— Report

Governing principle: fixes only, per AI-104A Baseline and the AI-106 PAT Report.
No refactor, no architecture change, no new Runtime, no new UI — every change
below is a narrow, additive truthy-check relaxation (or, for AI107-02, a
single CSS property) at the exact points AI-106 root-caused.

## Root Cause Fix Report

### Bug AI107-01（P0）— Folder Optional

**Root cause (confirmed in AI-106):** `KnowledgePipeline.process()` hard-required
`mat.folderId` to resolve to a real `AHS.FolderRuntime` Folder object; a
material with no Folder failed at the pipeline's own gate before any Graph
node was ever built. Two further, independent gates enforced the same
truthy-`folderId` requirement deeper in the chain: `KnowledgeExtractionRuntime
.extract()` (its own Folder-Scope check) and both `KnowledgeExtractionRuntime
.validate()` / `KnowledgeGraphRuntime.validateNode()` (which rejected any
content node whose `folderId` was falsy). All three had to change together —
relaxing only the pipeline's own gate would still have left nodes rejected
downstream.

**Fix:** `folderId: null` is now treated as a valid, deliberate "unscoped"
Study Scope — distinct from a truly *missing* trace field, and distinct from
a `folderId` that references a Folder which no longer exists (still a real
error). This mirrors the exact pattern this codebase already uses for
`sourcePage`/`sourceParagraph` elsewhere in the same files: the field must
always be *present*, its value may honestly be `null`.

1. `js/parser/KnowledgePipeline.js` — the Folder-existence check now only
   runs (and can only fail) when `mat.folderId` is truthy; a material with no
   folderId proceeds unchanged.
2. `js/runtime/KnowledgeExtractionRuntime.js` — removed the `!folderId` hard
   `return` in `extract()`; `folderIdFor()` already returned `null` safely,
   so every node below it already correctly carried `folderId: null`.
3. `js/runtime/KnowledgeExtractionRuntime.js` `validate()` and
   `js/runtime/KnowledgeGraphRuntime.js` `validateNode()` — both changed from
   `if (!node.folderId)` to `if (!("folderId" in node))`, so a present-but-null
   value passes while a genuinely omitted field still correctly fails.

**Not touched:** `js/ui/MaterialUploadDialog.js` (per "不得新增 UI" / "不得要求
使用者一定要建立 Folder" — the 資料夾 field stays exactly as optional as it
already was; no new required-marker, no new UI). `queryByFolder()` was not
touched — querying `folderId: null` now simply returns the shared "unscoped"
bucket, which by construction can never overlap a real Folder's own nodes
(verified explicitly in the new regression suite below).

### Bug AI107-02（P3）— Mobile TopBar Overflow

**Root cause (confirmed in AI-106):** `.topbar__search` had no `min-width`,
so at narrow viewports its flex item refused to shrink below its own
intrinsic content width, forcing `.topbar__tools`' three fixed 40px icon
buttons out past the viewport edge (measured 68px overflow at 375px).

**Fix:** one line — `min-width: 0;` added to `.topbar__search` in
`css/base/layout.css`. `.topbar__search-input` already had `min-width: 0`
(confirmed pre-existing), so the search bar's true minimum content is just
its icon + padding + gap; adding `min-width: 0` to the container itself lets
the browser honor that instead of defaulting to `min-width: auto`. No new
breakpoint added, no existing breakpoint modified — this is a single,
universal property that only changes behavior when space is genuinely tight
(mobile), leaving Desktop/Tablet's rendered layout byte-for-byte the same
(there, the flex item never needs to shrink below its content width in the
first place).

## Acceptance — A/B Test (as mandated)

New dedicated regression suite `tests/regression/FolderOptionalV1.js` (20/20
PASS) runs the exact acceptance test this Sprint specifies: the same real
text content processed once with a Folder and once without.

| | No Folder | With Folder |
|---|---|---|
| `KnowledgePipeline.process()` | success/done, `folderId: null` | success/done, `folderId: <real>` |
| Graph nodes created | 11 (same content → same count as With-Folder) | 11 |
| `ensureQuestionSet()` real questions | ✓ (16 in the full PAT re-run) | ✓ |
| Node content (verbatim) | identical set to With-Folder | identical set to No-Folder |
| Folder-having materials affected by the fix | — | confirmed byte-identical to pre-fix behavior |

A fourth case — a material whose `folderId` points at a **deleted/nonexistent**
Folder — is explicitly asserted to still fail (the one genuine error state
this fix must not paper over).

## Regression Report

| Suite | Result |
|---|---|
| `npm run verify` (VerifyPaths + VerifyForbiddenPatterns) | PASS (1 pre-existing KNOWN-ISSUE, unrelated) |
| `npm test` (BehaviorSuite + PipelineRegression) | 181/181 PASS |
| All 27 `tests/regression/*.js` suites (26 existing + 1 new `FolderOptionalV1.js`) | 1015/1015 PASS |
| **Grand total** | **1190/1190 PASS**, zero regressions |

Three pre-existing regression files asserted the *old*, now-intentionally-
changed hard-fail behavior and were updated to assert the new, PMO-authorized
behavior instead (not weakened — each still asserts the genuinely-invalid
case, e.g. a dangling `folderId`, correctly still fails):
`tests/regression/KnowledgeExtractionV1.js`,
`tests/regression/AnalysisPipelineIntegration.js`,
`tests/regression/KnowledgeFoundationV1.js`.

## PAT Re-run Report

Re-ran the full real-Chromium Playwright PAT-1 suite (the same script used
for Sprint AI-106, unmodified except for one unrelated Playwright selector
fix — a strict-mode ambiguity in my own test script, not a product issue).

| PAT | Before (AI-106) | After (AI-107) |
|---|---|---|
| PAT-04 Summary | 5/5 PASS | 5/5 PASS |
| PAT-05 Practice | 4/4 PASS (empty-state path) | **7/7 PASS — now exercises real questions, real answer, real grading** ("答錯了，已加入錯題本。") |
| PAT-07 Wrong Book | 5/6 (fav-filter FAIL) | **6/6 PASS — real Wrong Book entries, 收藏篩選控制項 now present** |
| PAT-09 Dashboard | 2/5 (3 FAIL) | **5/5 PASS — `.dash-layout`, Statistics, Learning History all render from real data** |
| PAT-10 Cross Flow | 4/4 PASS | 4/4 PASS — sessionStorage now additionally carries real `wrongBookSession`/`reviewQueue` |
| PAT-11 Responsive | 12/15 (3 FAIL, mobile overflow) | **15/15 PASS — 0px overflow at 375px and 320px, confirmed unaffected at 768px/1440px** |
| **Full PAT-01~12** | 114/122 | **124/125** (1 remaining is the pre-documented non-defect below) |

The one remaining non-PASS is the same benign Chromium sandbox-enforcement
console message from AI-106 ("Blocked script execution... sandboxed...")
confirming the XSS-probe iframe correctly blocks injected script — not a
defect, unchanged from AI-106's own disclosure.

## Deliverables Summary

1. **Root Cause Fix Report** — above.
2. **Git Diff** — 7 files changed, 55 insertions / 39 deletions (+1 new test
   file, 190 lines); see `git diff` on this commit for the full patch.
3. **Modified Files** — `js/parser/KnowledgePipeline.js`,
   `js/runtime/KnowledgeExtractionRuntime.js`,
   `js/runtime/KnowledgeGraphRuntime.js`, `css/base/layout.css`,
   `tests/regression/AnalysisPipelineIntegration.js`,
   `tests/regression/KnowledgeExtractionV1.js`,
   `tests/regression/KnowledgeFoundationV1.js` (new:
   `tests/regression/FolderOptionalV1.js`).
4. **Regression Report** — above, 1190/1190 PASS.
5. **PAT Re-run Report** — above, 124/125 PASS (was 114/122), both
   Sprint AI-106 findings fully resolved.
6. **Commit Message** — accompanying this report.
7. **GitHub Push** — this commit.

## Acceptance

**Critical = 0, Major = 0.** Both AI-106 findings resolved and re-verified
in a real browser; zero regressions across 1190 automated assertions and
124/125 real-browser PAT assertions (the sole non-PASS being a pre-documented
non-defect, unchanged from AI-106). Per this Sprint's own Acceptance clause,
proceeding directly to **Sprint AI-108｜Release Candidate (RC)** — no further
features to be added per this Sprint's own closing instruction.
