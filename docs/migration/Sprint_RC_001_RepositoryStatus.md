# RepositoryStatus.md — Sprint RC-001｜Repository Release

## Final Repository State (post-release)

- **`main` branch HEAD**: `cb222c6` — "Release v1.0.0-MVP｜Production Learning Pipeline Complete（AI-015F～AI-021）", confirmed live on `origin/main` (verified via `git ls-remote` at push time and GitHub API `get_commit` during this report).
- **GitHub Pages**: deployed successfully for `cb222c6` (workflow run `30442276287`, `pages-build-deployment`, conclusion `success`). GitHub Pages is now serving the MVP release content.
- **Release Tag `v1.0.0-MVP`**: exists **locally only**, pointing at `cb222c6`. Not present on `origin` (`list_tags` on the remote returns empty) due to a confirmed, non-retriable HTTP 403 from the local git service specifically on tag-ref pushes. Full detail in `docs/QA/Sprint_RC_001_DeploymentReport.md`.
- **GitHub Release object**: not created, blocked on the tag limitation above.

## Repository Content Confirmed on `origin/main`

All Discovery Phase (AI-015F/G, AI-016, AI-017), Implementation Phase (AI-018, AI-019, AI-020), and Acceptance Phase (AI-021) deliverables are present in commit `cb222c6`:
- 8 code/wiring files modified across AI-018/AI-019/AI-020 (`ReviewGeneratorRuntime.js`, `MaterialQuestionCard.js`, `review.html`, `AppReview.js`, `ReviewGeneratorV1.js`, `Dashboard.js`, `AppDashboard.js`, `dashboard.html`)
- 2 new production files (`LearningHistoryModel.js`, `LearningHistoryModelV1.js`)
- 28 documentation deliverables under `docs/Architecture/`, `docs/QA/`, `docs/migration/`
- `docs/Release/Release_v1.0.0-MVP.md` (this release's Release Note / ReleaseReport)
- Full file list in `ChangedFiles.txt`.

## Version Metadata — Deliberately Untouched

Per CLAUDE.md's protection of `docs/PMO/` and this Sprint's literal Deliverables list (which names specific files, not these):
- `docs/PMO/VERSION.json` — still reads `v0.6.6-beta.5`. Not bumped to `v1.0.0` by this Sprint; flagged here as a decision for PMO to make explicitly in a future Sprint, since `docs/PMO/` is out of Claude's scope to modify without an explicit instruction naming it.
- `package.json`'s `"version"` field — still reads `0.6.8`. Same reasoning; not bumped.

## Untracked, Intentionally Excluded from the Release Commit

- `node_modules/` — npm-install artifact, never part of the authorized static-site deliverable (consistent with this project's entire history: no build tooling, no Node server in production).
- `package-lock.json` — same reasoning, npm tooling artifact only.

## Architecture / Blueprint Status (unchanged by this Sprint)

Per this Sprint's own Forbidden list ("Do NOT modify Runtime/UI/Architecture. Do NOT add features, refactor, or optimize beyond deployment needs"), RC-001 made **zero** source-code changes of its own — it packaged and released exactly the code already accepted through Sprint AI-021's PAT. Architecture status remains as recorded in `docs/QA/Sprint_AI_021_ProductionAcceptanceChecklist.md`:
- MVP Status: COMPLETE
- Production Pipeline: LOCKED
- Repository Truth: LOCKED

## Outstanding Item for PMO

The single open item from this Sprint is the tag/Release-object gap described in `docs/QA/Sprint_RC_001_DeploymentReport.md` — the code and live deployment are unaffected and fully verified; only the formal Git tag ref and GitHub Release object on `origin` remain pending a resolution path PMO selects.
