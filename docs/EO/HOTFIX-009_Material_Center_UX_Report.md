# HOTFIX-009 — Material Center UX Report

Self-initiated from a Project Owner screenshot report of `materials.html`'s Material Card
during real usage testing (not a formal Sprint spec). Three issues reported, plus a follow-up
mid-turn correction to Issue 4's exact scope (also from a screenshot).

## Result

| Item | Result |
|---|---|
| Issue 1 — 首頁選擇教材未帶入科目篩選 | PASS |
| Issue 2 — 移除重複的「預覽教材」圖示 | PASS |
| Issue 3 — 功能圖示加大、加強辨識度 | PASS |
| Issue 4 — 章節篩選標籤標示不清 | PASS |
| Verify | PASS |
| Test | PASS |
| Playwright | PASS (19/20 — 1 pre-existing, disclosed flake, see below) |
| GitHub Actions | Filled in after merge. |
| Deployment | Filled in after merge. |
| Merge Commit | Filled in after merge. |

## Issue 1 — 首頁選擇教材（如「數學」）未帶入教材中心的科目篩選

**Root cause**: Home's material links (`js/components/HomeRecentMaterials.js`,
`js/components/ContinueLearning.js`) already pass `materials.html?id=<materialId>`, but
`js/pages/AppMaterials.js` never read `window.location.search` at all — `AHS.MaterialCenter.
create()` took no arguments and always initialized `currentSubject = "all"`. The query string
was silently ignored; the sidebar always opened unfiltered even though a specific material had
just been clicked.

**Fix**: `AppMaterials.js` now reads the `id` query param, looks up the real record via
`AHS.MaterialRuntime.getById(id)`, and passes its own `subject` field into `AHS.MaterialCenter.
create({ initialSubject })` — no second, separate subject param to keep in sync with the link,
just derived from the same Runtime record the click already targets. `MaterialCenter.js`'s
`create()` accepts `opts.initialSubject` (validated against `AHS.Subjects`, falls back to
`"all"` for anything unknown — same default as before this option existed), seeds
`currentSubject` with it, and `subjectPanel()` now takes a third `initialSubject` argument so
the sidebar's own `is-active` highlight reflects it (previously hardcoded to always highlight
「全部科目」regardless of the actual starting filter).

## Issue 2 — 移除重複的「預覽教材」圖示

**Root cause confirmed by reading the code**: `js/ui/MaterialCard.js`'s `previewBtn` (「預覽
教材」icon) called `onPreview(item.id)`, wired to `AHS.MaterialPreview.open()`. The card body's
own click handler already calls the same `previewMaterial()` function, and 「開始學習／繼續學
習」(`learnMaterial()`) also opens the identical `MaterialPreview.open()` dialog before
additionally starting a Learning Session. The icon button added no distinct behavior — it was a
pure duplicate of an action already reachable two other ways.

**Fix**: removed the `previewBtn` element and its click handler from `MaterialCard.js`; `acts`
is now `[favBtn, dlBtn, summaryLink, practiceLink]` (+ `deleteBtn` when `onDelete` exists).
`previewMaterial()` itself is untouched — the card-body click still uses it, so 预覽 is still
fully reachable, just via one path instead of two. Updated the two tests that clicked
`.mat-card__preview` (`tests/jsdom/BehaviorSuite.js`, `tests/regression/
MaterialBatchPersistence.js`) to click the card body instead, the sole remaining trigger.

## Issue 3 — 功能圖示加大、加強辨識度

`css/pages/material.css`'s `.mat-card__act`: height `34px → 44px`, icon `svg` `16px → 20px`,
border `1px → 1.5px`, gap `8px → 10px`, border-radius `10px → 12px`; hover state now also
changes `border-color` (previously only background/text color, low contrast against the
existing 1px border). Added `:focus-visible` (previously **absent entirely** — keyboard
navigation had no visible indication of which action button was focused). Same enlargement
applied to `.mat-card__delete-btn` (font-size `13px → 14px`, icon `16px → 20px`, border
`1px → 1.5px`, `:focus-visible` added) and the List-view width override (`40px → 48px`) so
Grid/List views stay consistent.

## Issue 4 — 章節篩選標籤標示不清（mid-turn correction from a second screenshot）

**Root cause**: `js/components/MaterialCenter.js`'s chapter sidebar rendered each material's
raw `chapter` field verbatim as its own filter button label — e.g. `"第二冊 第4章 4-1~4-3
（三角函數的性質：正弦定理、餘弦定理、三角形面積公式）"`. Two problems: (a) these are full
descriptive sentences, unreadable as a compact sidebar list; (b) when 「全部科目」is selected,
chapters from every subject are listed together with nothing indicating which subject each one
belongs to.

**Fix**: `chaptersForSubject()` now returns `{chapter, subject}` pairs (previously plain
strings) — same dedup behavior, just carrying the subject along. New `shortenChapterLabel()`
extracts only real substrings already present in the raw text (the head before the first `（`,
plus the first `：`/`、`-delimited phrase inside the parentheses) — it never invents wording,
only omits the rest, and long segments are `…`-truncated. When `subjectId === "all"`, each
label is prefixed with `AHS.Subjects[subject].name + "｜"` (the same `｜` separator convention
`.mat-card__meta` already uses); the prefix is skipped once a single subject is already
selected, since every chapter shown is then already scoped to it — redundant otherwise. The
full raw chapter text remains available via a `title` tooltip attribute, so nothing is actually
lost, only decluttered. Example (real, not fabricated — verified with a scratch Playwright
script, not committed):

```
"第二冊 第4章 4-1~4-3（三角函數的性質：正弦定理、餘弦定理、三角形面積公式）"
  → "數學｜第二冊 第4章 4-1~4-3・三角函數的性質"
"第二冊 第5~6課（所有權與勞動權、勞動三權與勞基法、夫妻財產制與繼承）"
  → "公民｜第二冊 第5~6課・所有權與勞動權"
```

## Verify / Test / Playwright

`npm run verify` PASS (0 broken paths / 0 legacy references / 0 forbidden patterns). `npm test`
PASS: BehaviorSuite 329/329 (2 tests updated to click the card body instead of the removed
`.mat-card__preview` button — same real preview behavior, different trigger), PipelineRegression
6/6, RepositoryFoundation 29/29, MaterialPipelineRegression 37/37, AnalyticsRegression 35/35,
MaterialBatchPersistence (1 test updated the same way) unaffected otherwise.

`npm run test:e2e`: **19/20 PASS**. The one failure (`Snapshot：首頁`, expected 1280×1762px,
received 1280×1794px) was verified via `git stash` to reproduce **identically on the base
commit before any of this HOTFIX's changes** — a pre-existing flake already disclosed in the
Sprint AI-116/117 reports (the daily quote's variable text length changes `.hero-card`'s real
rendered height even though its own pixels are masked, shifting the full-page screenshot
dimensions). Re-ran the Analytics Scenario test that failed once under 2-worker parallelism in
isolation (passed in 3s) and the full suite again at `--workers=1` (19/20, same single
pre-existing flake) — confirming that failure was resource-contention timeout in this sandboxed
environment, not a real regression.

## Judgment calls (flagged, not silently decided)

1. **Issue 4's exact label format** was refined mid-turn from a second screenshot after the
   first three issues were already scoped — the chosen `科目｜章節頭・關鍵詞` format only uses
   real substrings from the existing `chapter` field (never fabricates a shorter paraphrase),
   trading a small amount of precision (mid-token truncation is possible, e.g. `"4-1~4-…"`) for
   guaranteed non-fabrication; the full text stays available via a tooltip.
2. **Issue 1's subject derivation** reads the already-existing `?id=` param and looks up the
   real Runtime record rather than adding a second `?subject=` query param — avoids two
   independent sources of truth for the same navigation drifting out of sync.

## 修改檔案

- `js/pages/AppMaterials.js` — reads `?id=`, derives `initialSubject` from `MaterialRuntime`
- `js/components/MaterialCenter.js` — `create(opts)` accepts `initialSubject`; `subjectPanel()`
  highlights it; `chaptersForSubject()`/`chapterPanel()` produce subject-prefixed, shortened
  chapter labels with a full-text tooltip
- `js/ui/MaterialCard.js` — removed the duplicate 預覽教材 icon button
- `css/pages/material.css` — `.mat-card__act`/`.mat-card__delete-btn` enlarged, `:focus-visible`
  added
- `tests/jsdom/BehaviorSuite.js`, `tests/regression/MaterialBatchPersistence.js` — updated to
  trigger preview via the card body instead of the removed icon button
