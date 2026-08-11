# Sprint AI-108｜Release Candidate — RC-03 Build Consistency Report

## Working tree — Local vs Committed

At the start of this Sprint's work: `git status` was clean (no uncommitted/untracked
files), branch `claude/code-usage-explanation-zyx8n3` up to date with its remote —
confirmed before any RC-08 work began. During RC-01, this Sprint's own audit cleanup
(`MaterialSubjectTabs.js` removal + 2 debug-statement removals + doc correction) produced
the only changes in the working tree; these are committed as part of this Sprint's own
deliverable (see the accompanying commit) — by the time this Sprint's commit lands, the
working tree is clean again with **zero** Local-Only / Uncommitted / Untracked drift.

## Branch vs Remote

`claude/code-usage-explanation-zyx8n3` (this Sprint's designated branch) tracks its own
`origin/claude/code-usage-explanation-zyx8n3` 1:1 — every commit through Sprint AI-107 is
already pushed; this Sprint's commit will be pushed identically (fast-forward, verified via
`git merge-base --is-ancestor origin/main HEAD` before push, per this session's established
safety practice). **No build drift** between this local repository and its own remote branch.

## Branch vs `main` (the GitHub Pages deploy source)

**This is the one real, structural inconsistency this audit must surface, not paper over.**
Per `CLAUDE.md`'s own Git Workflow, `main` is both "the single branch in active use" and "the
GitHub Pages deploy source." `git log` shows:

```
origin/main HEAD:  b96bbed  Sprint AI-100～AI-102｜AI Gateway Foundation, Question Pipeline, and Frontend Integration
This branch HEAD:  (Sprint AI-108, 5 commits ahead of main)
  8e442ab  Sprint AI-107｜Release Stabilization
  9697a30  Sprint AI-106｜Platform Acceptance Test（PAT-1）— Report
  77e2503  repo hygiene｜ignore node_modules, track package-lock.json
  02c52e0  Sprint AI-103～AI-105｜Content Import Runtime, Repository Baseline Sync, Platform Integration & MVP Completion
```

`main` does not yet contain any of Sprint AI-103 through AI-108's work. This branch is a
strict fast-forward of `main` (`git merge-base --is-ancestor origin/main HEAD` → true) — there
is no divergent/conflicting history, only unmerged forward progress. This is the expected,
by-design state for a feature-branch workflow mid-Sprint-sequence, not an error — but it means:

- The literal "Repository 與 GitHub Pages 一致" check (RC-03's own wording) cannot be
  satisfied until this branch is merged into `main`, because Pages serves `main`.
- RC-02's GitHub Pages finding (main 4 commits behind) and this finding describe the same
  underlying fact from two angles; not a new, separate problem.
- Per this session's explicit operating constraint ("never push to a different branch
  without explicit permission"), merging this branch into `main` is a decision for the human
  developer / PMO, not something performed unilaterally as part of this audit.

## Recommendation

Repository-internal build consistency (working tree, this branch vs. its own remote): **PASS**,
zero drift. Branch-vs-`main`/Pages consistency: **not yet applicable** — by design, pending a
human-authorized merge of this branch into `main`. Recommend: once PMO approves this Release
Candidate, the human developer fast-forward-merges `claude/code-usage-explanation-zyx8n3` into
`main` (a clean fast-forward, no conflicts expected — verified above), after which RC-02's
GitHub Pages check can be meaningfully re-run against the live site.

## Result: **PASS** (repository-internal); `main`/Pages sync explicitly deferred to
post-approval human merge, not silently assumed.
