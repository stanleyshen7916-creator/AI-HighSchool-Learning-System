# EO-R001 — Review Center Review Home Prototype v1.0 — QA Report

## Scope Delivered
- `review.html`
- `js/pages/ReviewHome.js` (page bootstrap)
- `js/components/ReviewHomeCard.js` (Hero + Statistics)
- `js/components/ReviewQuickAction.js` (Quick Actions)
- `js/components/ReviewRecentSession.js` (Recent Review)
- `css/pages/review.css` (page-specific styles; see Flag 2 below)

No Review Session was implemented. No Runtime was created or modified.
No Storage was used. No existing file was modified (verified via
`diff -rq` against the baseline ZIP — zero modified files, additions only).

## Flags for PMO

1. **File path convention.** EO-R001 specified `components/ReviewHomeCard.js`
   etc. (no `js/` prefix) and `js/pages/ReviewHome.js` as the content
   builder. The repository's actual convention is page components under
   `js/components/` with a thin bootstrap under `js/pages/app-*.js`. Per
   "Repository First / Repository wins," the three sub-components were
   placed in `js/components/`, and `ReviewHome.js` takes the bootstrap
   role (same role as `app-wrongbook.js`). No folder was added or renamed.

2. **`css/pages/review.css` was not in the Scope's file list.** Every other
   page in the repository ships one page-specific CSS file, and inline
   styles / new global tokens are forbidden. This file was added to follow
   that existing, repo-wide convention. It defines no new custom
   properties — only new BEM classes (`rv-*`) built from the existing
   tokens in `css/base/tokens.css` and the shared `.card` / `.card__head` /
   `.card__title` primitives in `css/layout/shell.css`.

3. **No data source exists for Statistics or Recent Review.** No Runtime
   or Mock data anywhere in the repository models 今日待複習 / 今日已完成 /
   本週完成 / a past review session (the same gap already ruled on for
   Wrong Book's 今日待複習, R2). Since Review Session isn't implemented
   this sprint, all four numbers/fields are static Prototype Mock Data
   scoped locally inside `ReviewHomeCard.js` / `ReviewRecentSession.js`
   (no shared Mock file touched). Expected to be wired to real data once
   Review Session (EO-R002) exists — requesting PMO confirmation this is
   acceptable for v1.0.

4. **開始今日複習 / 錯題複習 route to `wrongbook.html`.** This is the only
   real review mechanism already in the repository (全部重新複習). Routing
   to it is Reuse, not new Session logic, and avoids a Dead Button.
   繼續上次 Session and Recent Review's 繼續 have no real session to
   resume (session-scoped state, no Storage permitted), so both use the
   Mock-feedback convention already established in `AppShell.js`
   (`profilePanel` → `console.log("（Mock）...")` pattern), surfaced here
   as a small inline status line instead of a console log for visibility.

5. **No Bottom Navigation / Sidebar entry point exists for Review Center**
   (Product Baseline fixes both nav sets; EO-R001 did not add one). `review.html`
   mounts the shared `AppShell` with a non-matching `active: "review"` id —
   every nav item still renders and works as a link, none is highlighted,
   and `AppShell.js` itself was not modified.

## Developer QA
- [x] `node --check` — all 4 new JS files pass
- [x] Forbidden-pattern grep — no `fetch`, `XMLHttpRequest`, `localStorage`,
      `import`, `export`, inline event handlers (JS or HTML), or forbidden
      CSS patterns (`var()` in gradient, `calc(var()+var())`,
      `env(safe-area-inset-*)`, `inset:` shorthand, `dvh`)
- [x] `html5validator` — `review.html` exits 0
- [x] jsdom behavioral test (served via local HTTP server):
  - Hero renders (title "複習中心", subtitle "開始今日複習")
  - Statistics renders 3 items (今日待複習 / 今日已完成 / 本週完成)
  - Quick Actions renders 3 buttons; clicking 繼續上次 Session shows Mock
    feedback, no throw
  - Recent Review renders date/completion rate/time spent; clicking 繼續
    shows Mock feedback, no throw
  - Bottom Navigation renders all 5 fixed items; none incorrectly
    highlighted
  - Console Error = 0, Console Warning = 0
- [x] Regression check — `index.html`, `wrongbook.html`, `dashboard.html`
      still load with 0 console errors
- [x] Responsive — CSS media queries verified for Desktop / Tablet
      (≤1024px: two-column row collapses to one column) / Mobile
      (≤720px: Hero stacks, Statistics collapses to 1 column; ≤480px:
      Recent Review meta collapses to 1 column)
- [x] No Dead Button — every button has a real navigation or Mock-feedback
      handler

## Acceptance Checklist (per EO-R001)
- [x] `review.html` opens normally
- [x] Hero displays correctly
- [x] Statistics displays correctly
- [x] Quick Actions display correctly
- [x] Recent Review displays correctly
- [x] Desktop / Tablet / Mobile all correct
- [x] Console Error = 0

## Known Issues / Open Items
- Statistics and Recent Review are static Prototype Mock Data, not wired
  to any Runtime (see Flag 3).
- No nav entry point currently links into `review.html`; it is reachable
  only by direct URL until PMO decides where it should be surfaced.
