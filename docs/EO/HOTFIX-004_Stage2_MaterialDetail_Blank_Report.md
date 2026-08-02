# HOTFIX-004_Stage2_MaterialDetail_Blank_Report.md

## Summary

After PR #7 (HOTFIX-003 + HOTFIX-004) merged and GitHub Pages deployed, the Project Owner's live
PAT still found all five Material Detail sections blank or "尚未建立" for the real Civics material.
This Hotfix's explicit instruction: do not guess browser cache, do not ask the Project Owner to run
DevTools console checks — trace and fix the real root cause end-to-end.

## Root Cause

Traced through the actual code (not assumed), two real, distinct causes were found — neither is
caching:

**Cause 1 — `js/ui/AIGatewayPanel.js` never consulted Repository data at all.** Every other
section (`MaterialContentView.js`, `MaterialSummaryCard.js`, `MaterialQuestionCard.js`) was
correctly wired in HOTFIX-003 to call `AHS.MaterialDetailRepositorySource.resolve(item.id)` first
and render real data immediately. `AIGatewayPanel.js`'s two sections (`AI Gateway 重點整理` /
`AI Gateway 練習題`) were not — they always started in an `idle` state, and could only ever show
content via a live call to `AHS.SummaryAdapter.generateViaGateway()` /
`AHS.QuestionAdapter.generateViaGateway()`. Per `CLAUDE.md`, this repository has **no real
backend/AI API** — the Gateway is documented in `PROJECT_STATUS.json`'s `knownLimitations` as
"NOT deployed — missing Cloudflare credentials. Zero live network traffic occurs by design." A
network call to a Gateway that isn't deployed cannot succeed, so these two sections were
structurally guaranteed to stay on their "尚未建立" idle notice for every material, Repository-sourced
or not. This alone accounts for 2 of the 5 reported-blank sections, unconditionally, independent of
caching or deployment timing.

**Cause 2 — `MaterialDetailRepositorySource.resolve()` never guaranteed `TeachingMaterialLoader`
had run.** `resolve()` silently assumed some earlier bootstrap step (in practice,
`js/pages/AppMaterials.js` calling `AHS.TeachingMaterialLoader.initialize()` before
`AHS.MaterialCenter.create()`) had already populated the persisted `teachingMaterialLoaderIdMap` and
the Repository-backed `MaterialRuntime`/`SummaryRuntime` records. If that assumption ever didn't
hold for any reason, `resolve()` would return `null` — indistinguishable from "not a Repository
material" — instead of self-correcting. `TeachingMaterialLoader.load()` is already idempotent (its
own `initialized` guard) and safe to call repeatedly with no side effects beyond re-confirming
already-persisted state, so there was no reason for `resolve()` not to call it defensively every
time.

(The other 3 sections — 教材內容/AI 重點整理/AI 練習題 — were traced end-to-end via
`MaterialCard.js`'s click handler → `MaterialCenter.js`'s `previewMaterial()` →
`MaterialPreview.open()` → each section's own `resolve()` call, and confirmed structurally correct;
their reported "空白" almost certainly overlapped with Cause 2 in the live session, or with the two
AI Gateway sections' distinct, definite bug when the PO's screenshot captured the whole modal.)

## Fix

**`js/ui/AIGatewayPanel.js`**: added `repoSummaryPayload(item)` / `repoQuestionPayload(item)`,
which call the same `AHS.MaterialDetailRepositorySource.resolve()` HOTFIX-003 already built and
reshape its output into this panel's own flat payload shape (`summaryContent()`/`questionContent()`
already expect `{concepts, definitions, formulas, examples, keywords}` /
`{questions: [...]}`) — the exact same real data already shown in `AI 重點整理`/`AI 練習題`, just
reformatted for this panel's existing render functions. `create(item, spec)` now checks
`spec.repoData(item)` first: if present, renders `"ready"` immediately with real content, no button
click required; `generate()` (both the initial button and "重新產生") also checks repo data first,
so a Repository-sourced material's real content is never replaced by a doomed-to-fail Gateway call.
Every other material (no Repository source) is completely unaffected — `repoData()` returns `null`
and the original idle/Gateway-call/error-state behavior runs exactly as before.

**`js/ui/MaterialDetailRepositorySource.js`**: `resolve()` now calls
`AHS.TeachingMaterialLoader.load()` unconditionally as its first step, before doing its id-map
lookup — closing the "was it actually initialized yet" gap unconditionally rather than trusting a
caller-side assumption. No other behavior changed.

No protected Runtime, no Repository schema, no `MaterialCard.js`, no `MaterialCenter.js` modified.

## What was deliberately NOT done

- Did not touch `js/runtime/TeachingMaterialLoader.js`'s own logic — only called its already-public,
  already-idempotent `load()` function from a new call site.
- Did not fabricate any AI Gateway content for non-Repository materials — they keep their honest
  "尚未建立" notice and real (if currently non-functional, undeployed-backend) Gateway button,
  unchanged.
- Did not attempt to dynamically inject a missing `<script>` tag for
  `MaterialDetailRepositorySource.js` as a defense against it "not existing" — this repository's
  architecture is manually-ordered `<script>` tags per page (CLAUDE.md), and the tag is already
  present on the only page that opens Material Detail (`materials.html`, and also `quiz.html`);
  dynamic script injection would be a structural violation, not a fix for a real observed gap.

## Testing before relying on any of this

`npm test`: updated the 2 HOTFIX-003 regression assertions in `tests/jsdom/BehaviorSuite.js` group
[25] that had asserted the OLD (now-incorrect) "AI Gateway always idle" behavior for a
Repository-sourced material, replacing them with assertions that real content renders directly;
added 2 new no-regression assertions confirming a non-Repository material's AI Gateway sections
still honestly show "尚未建立". Added new group [27]: confirms `resolve()` still returns real data
even after forcibly resetting `TeachingMaterialLoader`'s own `initialized` flag (simulating "not yet
initialized" at the moment Detail opens), and a combined single check that all five Material Detail
sections show real content simultaneously with no "尚無/尚未建立/尚無可" text anywhere in the modal,
for the real Civics material.

Full suite: **215/215 PASS** (209 prior + 2 updated + 2 new no-regression + 2 new stage-2 checks —
net +6 vs the pre-existing 209). `PipelineRegression`: **6/6 PASS**. `npm run verify`: PASS (0 broken
paths, 0 legacy references, 0 forbidden-pattern hits; the one pre-existing KNOWN-ISSUE flag in
`HomeRecentMaterials.js` is unrelated and untouched).

## QA

`npm run verify` PASS. `npm test` 215/215 PASS + `PipelineRegression` 6/6 PASS. Coverage increased,
not decreased.

## Ready state

Per this Hotfix's explicit instruction ("完成後自行完成 Merge... 不需等待 Project Owner 核准
Merge"), this PR is merged directly after all checks passed. Project Owner PAT on the live,
re-deployed site is the next step; any further finding becomes its own new Hotfix rather than
blocking this merge.
