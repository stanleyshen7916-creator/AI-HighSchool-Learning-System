# HOTFIX-006 — Settings Panel Blocking Overlay

## Summary

PAT report: on the live site, every page loaded directly into the Settings modal, fully
blocking the app — "一登入便停留在此畫面，無法進入學習系統". Introduced by Sprint AI-113
(PR #25); root cause found and fixed same-day.

## Root Cause

`css/components/settings-panel.css`'s `.settings-panel__overlay` rule declares
`display: flex` (needed to center the dialog). The browser's own UA stylesheet has
`[hidden] { display: none }` — an attribute selector, CSS specificity (0,1,0), identical to
a single class selector. `js/ui/SettingsPanel.js` correctly sets `hidden="hidden"` on the
overlay by default, but at equal specificity **author styles win over the UA stylesheet**,
so `.settings-panel__overlay { display: flex }` silently overrode the hidden state on every
page — the modal was never actually hidden, it just happened to render on top of everything
since it's `position: fixed` with `z-index: 200`.

This exact failure mode was already avoided elsewhere in this codebase —
`css/pages/material.css`'s `.mat-filter__panel` (a pre-existing dropdown panel) has both
`.mat-filter__panel { ... }` and a dedicated `.mat-filter__panel[hidden] { display: none; }`
override. `settings-panel.css` (new this Sprint) simply didn't follow that established
pattern. `.notif-menu`/`.profile-menu` (also pre-existing) never hit this bug because neither
declares its own `display` at all (block-level by default), so nothing competes with the UA
rule.

**Why this wasn't caught by `npm test`**: `tests/jsdom/BehaviorSuite.js`'s `loadPage()`
parses the raw HTML/JS but never fetches the linked `<link rel="stylesheet">` CSS files (its
own virtualConsole handler explicitly ignores "Could not load link" as expected/benign) —
every assertion in Sprint AI-113's group [38] checked the `hidden` DOM attribute directly
(`overlay.hasAttribute("hidden")`), which was and still is correctly set; the bug was purely
in what the browser's CSS cascade does with that attribute, which this test harness has no
way to observe. Disclosed, not silently left as a gap: this class of bug (a component's own
CSS overriding the `[hidden]` UA default) is not something the current jsdom-based suite can
catch — real-browser verification remains the only way to catch it, same limitation already
disclosed for other real-browser-only findings in this repository (e.g. Sprint AI-106's PAT-1
report).

## Fix

Added `.settings-panel__overlay[hidden] { display: none; }` to `css/components/
settings-panel.css` — same fix pattern `.mat-filter__panel` already established. One file,
one rule, no JS/HTML changes.

## Verify / Test

`npm run verify` PASS. `npm test` — BehaviorSuite 306/306 / PipelineRegression 6/6 /
RepositoryFoundation 29/29, unchanged (as expected — this test suite cannot observe the fix
either, per the Root Cause section above; the fix is verified by the PAT report itself once
GitHub Pages redeploys).

## Merge Commit / GitHub Pages Deploy Status

Filled in after merge.

## 修改檔案

- `css/components/settings-panel.css` — one added rule
