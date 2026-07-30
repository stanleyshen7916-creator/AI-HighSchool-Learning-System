# Sprint AI-108｜Release Candidate — RC-02 GitHub Pages Verification Report

## Environment limitation (disclosed, not worked around)

This session's outbound network policy explicitly blocks `*.github.io`
(`curl`/Playwright both confirm `host_not_allowed` / tunnel failure — a
deliberate proxy-level denial, not a transient network issue). The GitHub
REST API's `/pages` endpoint is also blocked ("Access to this GitHub API
path is not permitted through this proxy"). **I cannot perform a literal,
direct verification of the live `https://stanleyshen7916-creator.github.io/
AI-HighSchool-Learning-System/` deployment from this environment.** This is
reported honestly rather than fabricated or silently skipped.

**A second, independent reason RC-02 cannot be meaningfully completed right
now**: per `CLAUDE.md`'s own Git Workflow ("Single branch in active use:
`main` — also the GitHub Pages deploy source"), GitHub Pages serves `main`,
not this Sprint's working branch. `git log` confirms `main`'s HEAD is still
`b96bbed` (Sprint AI-100～AI-102) — **4 commits behind** this branch, meaning
Sprint AI-103 through AI-107's entire body of work (Content Import Runtime,
Repository Baseline docs, Material Detail/`MaterialContentView`, the PAT-1
report, and both AI-107 bug fixes) is not live on GitHub Pages yet regardless
of network access. Verifying the *current* live Pages site would only
re-confirm the pre-AI-103 state, not this Release Candidate's actual content.

## Substitute verification performed

Real Chromium (Playwright), against this branch's actual, real repository
files served locally (the same bytes GitHub Pages will serve once this
branch reaches `main`) — covering all 9 areas RC-02 names (Material Detail/
Practice/Exam share a URL with Material Center/Quiz respectively, so 7
unique page loads):

| Area | Page | Console Errors | Runtime Errors | HTTP ≥400 responses | Broken internal links |
|---|---|---:|---:|---:|---:|
| Home | index.html | 0 | 0 | 0 | 0 |
| Material Center / Material Detail | materials.html | 0 | 0 | 0 | 0 |
| Summary | summary.html | 0 | 0 | 0 | 0 |
| Practice / Exam | quiz.html | 0 | 0 | 0 | 0 |
| Wrong Book | wrongbook.html | 0 | 0 | 0 | 0 |
| Review | review.html | 0 | 0 | 0 | 0 |
| Dashboard | dashboard.html | 0 | 0 | 0 | 0 |

Method: every network response (images, CSS, JS, fonts) was monitored for
HTTP status ≥400 (the closest local equivalent to "no 404 / no missing
asset"); every internal `<a href>` was resolved against the real filesystem
(broken-link check); console + uncaught JS errors were captured via
Playwright's `console`/`pageerror` events. This is in addition to — not a
duplicate of — Sprint AI-107's own full PAT re-run (124/125 real-browser
assertions PASS across real upload/click/navigation flows on this same
branch).

## Recommendation

RC-02 cannot be honestly marked PASS against its literal wording ("實際驗證
GitHub Pages") until two things happen, neither of which is this Sprint's to
do unilaterally: (1) this branch is merged to `main` by the human developer
(per this repository's own Git Workflow and this session's explicit "never
push to a different branch without explicit permission" constraint), and (2)
either a network-unrestricted environment or the repository owner performs
the live-URL check. What *can* be certified now — and is — is that the exact
content that will go live is verified clean via the substitute method above.
Flagging this explicitly for PMO rather than silently declaring PASS on
an untested live URL.

## Result: **Not independently verifiable from this environment.**
Substitute local verification: **PASS** (0 console/runtime errors, 0 broken
assets/links across all 7 unique pages). Recommend a live-URL check once
merged to `main`, by a human or a session with `*.github.io` network access.
