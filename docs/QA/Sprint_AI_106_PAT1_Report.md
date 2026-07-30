# Sprint AI-106｜Platform Acceptance Test（PAT-1）— Report

Governing principle: verification only, per this Sprint's own explicit constraints
("本 Sprint 不新增功能。本 Sprint 不重構架構。") — every check below was **actually
executed** in a real Chromium browser (Playwright, `/opt/pw-browsers`) against the
repository's real static files served over HTTP, plus a full re-run of the existing
automated regression suite. No result in this report is asserted from memory or
inferred from source reading alone.

## Method

- Real Chromium, one continuous browser session/page per major flow, so
  sessionStorage carries across real page navigations exactly as it would for a
  real student (closes jsdom BehaviorSuite's own disclosed gap: "no real browser
  rendering... no cross-page navigation — flagged for real-browser PAT").
  jsdom's synthetic seeding (`seedProductionQuestions()`) was NOT used as
  supporting evidence here — this PAT drives the real `<input type=file>` upload
  dialog, real button clicks, real `FileReader`, and real cross-page `location`
  navigation throughout.
- Three real materials uploaded through the actual Upload dialog: a Markdown
  file (headings/bold/italic/list), a `.txt` file whose content is a full HTML
  document with an inline `<script>` (XSS probe), and a real PNG image.
- Full walkthrough: Home → Material Center (search/filter/sort) → Material
  Detail (Markdown/HTML/image render) → Summary → Practice → Exam (isolation) →
  Wrong Book → Review → Dashboard → Responsive (tablet/mobile) → Performance.
- 122 real assertions executed for PAT-01 through PAT-12; PAT-13 executed
  separately via the existing CLI test/verify/regression commands.

## PAT Checklist / PASS-FAIL Matrix

| PAT | Area | PASS | FAIL | Result |
|---|---|---:|---:|---|
| PAT-01 | Home | 7 | 0 | PASS |
| PAT-02 | Material Center | 16 | 0 | PASS |
| PAT-03 | Material Detail | 20 | 1 | PASS* (1 benign, see below) |
| PAT-04 | Summary | 5 | 0 | PASS |
| PAT-05 | Practice | 4 | 0 | PASS |
| PAT-06 | Exam | 5 | 0 | PASS |
| PAT-07 | Wrong Book | 5 | 1 | PASS* (downstream of Issue #1) |
| PAT-08 | Review | 4 | 0 | PASS |
| PAT-09 | Dashboard | 2 | 3 | FAIL (downstream of Issue #1) |
| PAT-10 | Cross Flow | 4 | 0 | PASS |
| PAT-11 | Responsive | 15 | 3 | FAIL (Issue #2) |
| PAT-12 | Performance | 27 | 0 | PASS |
| **Total (PAT-01~12)** | | **114** | **8** | |
| PAT-13 | Regression | 1170 | 0 | PASS (see Regression Report below) |

All 8 real-browser failures trace back to exactly **two** independent root
causes plus **one** non-defect (a security control working as intended) —
verified by direct root-cause debugging, not left as unexplained red marks.

## Issue List

### Issue #1 — Major — Materials uploaded without a Folder never get AI Summary/Questions, silently

**Severity: Major.**

**Where:** `js/parser/KnowledgePipeline.js` (Folder-scope validation gate) ×
`js/ui/MaterialUploadDialog.js` (optional, unmarked-required 資料夾 field).

**Evidence (real browser, root-cause isolated via controlled A/B test):**
Uploading a material through the real Upload dialog **without** selecting a
folder (資料夾 defaults to 未分類/`folderId: null`, and is the only field in
that dialog with no `*` required-marker) causes `KnowledgePipeline.process()`
to fail at its own "2 · Folder 存在" gate and return **zero** Knowledge Graph
nodes — silently, with no error surfaced to the UI. Every downstream AI
feature that depends on that graph (`AITutorService.ensureQuestionSet()` →
`QuestionGenerationRuntime.generateQuestions()`) then permanently returns
`null` for that material, and the user only ever sees the generic honest
empty state ("此教材目前尚無可出題的內容"), with **no indication that the
real, fixable cause is a missing Folder assignment**.

Confirmed via a controlled A/B test with byte-identical content:
- Material without a folder → `KnowledgeGraphRuntime.queryByMaterial()` = 0
  nodes, `ensureQuestionSet()` → `{status:"no_readable_content"}`.
- The exact same content, same material, **with** a folder assigned →
  11 real graph nodes, real generated questions (multiple choice, with
  traceable `knowledgeNodeId`/paragraph references).

**Failure scenario:** A first-time user uploads a single material (the most
common real path — no folder exists yet, and nothing in the UI marks 資料夾
as required or explains its consequence), then clicks 開始 AI 分析 /
產生 AI 題目 and gets a permanent, unexplained "no content" dead end. This
also explains PAT-09's 3 Dashboard failures (`buildModel()` requires
`HistoryRuntime.count()>0 or WrongBookSession.count()>0`, neither of which
can ever become true if no question was ever answerable) and PAT-07's
`.wb-fav-filter` failure (renders only once real Wrong Book rows exist,
which requires an answered question).

**Recommendation:** either make Folder assignment genuinely required at
upload time (matching 科目/年級/教材分類's own `*` treatment), or have
`KnowledgePipeline.process()` auto-assign/tolerate an implicit "未分類"
scope, or surface an explicit, honest message distinguishing "no folder
assigned" from the generic "no content" empty state. Handing to Sprint
AI-107 (Release Stabilization / Bug Fix) per this Sprint's own Acceptance
clause — no fix was attempted here, per AI-106's explicit
"不新增功能／不重構架構" constraint.

### Issue #2 — Minor — Topbar overflows horizontally at narrow mobile widths (≤~400px)

**Severity: Minor.**

**Where:** `css/base/layout.css` (`.topbar`, `.topbar__search`,
`.topbar__tools`) — affects every page using the shared `AppShell` (confirmed
reproduced independently on `index.html`, `materials.html`, `dashboard.html`).

**Evidence:** At a 375×667 viewport (iPhone SE class, a standard PAT-11
breakpoint), `document.documentElement.scrollWidth` (443px) exceeds
`clientWidth` (375px) by exactly 68px. Root-cause isolated via DOM geometry
inspection: `.topbar__tools` (three fixed 40px icon buttons + 12px gaps =
144px, `flex: 0 0 auto`, does not shrink) plus `.topbar__search` (also does
not collapse) do not fit alongside the brand logo within 375px. The only
mobile breakpoint in this file (`@media (max-width: 640px)`) hides
`.topbar__brand-text`/`.topbar__search-kbd`/`.topbar__user-meta` but does not
address `.topbar__tools`' fixed width or give `.topbar__search` a
`min-width: 0`. This directly contradicts the file's own header comment:
"RWD: ... No horizontal scroll at any width."

**Failure scenario:** any user on a phone ≤~400px wide (a common, real device
class) sees the whole page able to scroll sideways by ~68px — not blocking
any functionality (all content and tap targets remain reachable), but a real,
reproducible violation of the codebase's own stated responsive contract.

**Recommendation:** add a narrower breakpoint (or extend the existing 640px
one) that either lets `.topbar__search` shrink (`min-width: 0`) below its
intrinsic content width, or collapses the search bar to an icon-only toggle
at ≤400px, matching the icon-button treatment already used for
`.topbar__tools`. Handing to Sprint AI-107 alongside Issue #1.

### Non-defect — benign Chromium security log during XSS probe (documented, not an Issue)

Previewing the XSS-probe material (a `.txt` file whose content is a full
HTML document with an inline `<script>`) produces exactly one Chromium
console message: `"Blocked script execution in 'about:srcdoc' because the
document's frame is sandboxed and the 'allow-scripts' permission is not
set."` This is Chromium's own confirmation that `MaterialContentView.js`'s
sandboxed `<iframe sandbox="">` correctly blocked the injected script from
executing — the security control working exactly as designed (AI105-06).
Not counted as an Issue; disclosed here so a strict "zero console message"
policy elsewhere doesn't misread it as a defect. All other XSS assertions
(no `window.__PAT_XSS_FIRED__`, no parent/top escape, no `alert()` dialog)
passed cleanly.

## Cross Flow (PAT-10)

Verified via real `sessionStorage` inspection after the full real-browser
walkthrough (Home → Material → Summary → Practice → Exam → Wrong Book →
Review → Dashboard, one continuous session): `ahs:materialRuntime` carries
all 3 real uploaded materials, `ahs:summaryRuntime` and
`ahs:learningQuestionRuntime` are present and populated from the real
upload's automatic `LearningPipeline` run. Data genuinely flows through real
page navigations, not simulated `seedSession`.

## Regression Report (PAT-13)

Executed directly via CLI, same commands as Sprint AI-105's baseline:

| Suite | Result |
|---|---|
| `npm run verify` (VerifyPaths + VerifyForbiddenPatterns) | PASS (1 pre-existing KNOWN-ISSUE, unrelated) |
| `npm test` (BehaviorSuite + PipelineRegression) | 181/181 PASS |
| All 26 `tests/regression/*.js` suites | 995/995 PASS (includes PipelineRegression's 6, not double-counted against the 181 above) |
| **Grand total** | **1170/1170 PASS**, 0 regressions since Sprint AI-105 |

No code was changed this Sprint, so these numbers are expected to be
identical to AI-105's own — confirmed identical, zero drift.

## Screen Captures

18 full-page screenshots captured across every PAT area and both mobile/
tablet breakpoints (Home empty state, Material Center empty/populated,
Material Detail ×3 formats, Summary, Practice, Exam, Wrong Book, Review,
Dashboard, 6 responsive captures). Delivered alongside this report.

## Deliverables Summary

1. **PAT Checklist / PASS-FAIL Matrix** — above.
2. **Issue List** — 1 Major (Issue #1), 1 Minor (Issue #2), both root-caused
   with reproducible evidence; 1 non-defect documented.
3. **Screen Captures** — delivered.
4. **Regression Report** — above, 1170/1170 PASS, 0 drift from AI-105.
5. **Git Diff** — none. Per this Sprint's explicit
   "不新增功能／不重構架構" constraint, no code was modified — this is a
   verification-only Sprint. Only this report is new.
6. **Commit Message** — this report only (documentation, no code).
7. **GitHub Push** — this report only; no code fix was authorized or
   attempted in this Sprint.

## Acceptance

Per this Sprint's own Acceptance clause ("若 Critical=0 且 Major=0 即可進入
Sprint AI-107"): **Critical = 0, Major = 1** — the threshold is **not** met.
Recommend proceeding to **Sprint AI-107｜Release Stabilization (Bug Fix)**
to address Issue #1 (Major) and Issue #2 (Minor) before any "Platform MVP
Complete" declaration. Both issues are narrowly scoped, root-caused, and
reproducible — well-suited to a focused Bug Fix Sprint rather than a further
audit pass.
