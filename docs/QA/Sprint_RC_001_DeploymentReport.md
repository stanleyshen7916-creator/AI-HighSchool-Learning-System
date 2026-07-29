# DeploymentReport.md — Sprint RC-001｜Repository Release

## 1. Commit

- **Commit**: `cb222c6` — "Release v1.0.0-MVP｜Production Learning Pipeline Complete（AI-015F～AI-021）"
- 38 files changed, 2532 insertions(+), 32 deletions(-) — a single consolidated release commit, per this Sprint's explicit "one release commit, not split history" instruction.
- Pre-push safety check: `git fetch origin main` + `git merge-base --is-ancestor origin/main HEAD` → **FAST-FORWARD OK**.

## 2. Push to `main`

- `git push origin HEAD:main` → **SUCCEEDED**.
- Verified via `git ls-remote origin main` immediately after push: `cb222c66d98b2b2361ca8421b18cbc6be8cdf9a9 refs/heads/main`.
- Re-verified via GitHub API (`get_commit` on `main`) during this report: `sha: cb222c66d98b2b2361ca8421b18cbc6be8cdf9a9`, matches local commit exactly. **CONFIRMED live on `origin/main`.**

## 3. GitHub Pages Deployment

- Repository has exactly one workflow: `pages-build-deployment` (id `306040741`), GitHub's built-in automatic Pages deployment (not a custom Actions YAML file).
- Queried `list_workflow_runs` filtered to `branch: main`. The most recent run:
  - **Run ID**: `30442276287`
  - **head_sha**: `cb222c66d98b2b2361ca8421b18cbc6be8cdf9a9` (exact match to the release commit)
  - **status**: `completed`
  - **conclusion**: `success`
  - **created_at**: `2026-07-29T10:05:18Z` (~14s after the commit's author timestamp `10:05:04Z`, consistent with an automatic post-push trigger)
- **GitHub Pages deployment for the release commit SUCCEEDED.**

## 4. Release Tag — `v1.0.0-MVP`

- Local annotated tag `v1.0.0-MVP` created successfully, pointing at `cb222c6`.
- `git push origin v1.0.0-MVP` attempted **4 times** (initial attempt + 3 retries with exponential backoff: 2s, 4s, 8s between attempts, per this session's established git-push-retry protocol). **All 4 attempts failed identically**:
  ```
  error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403
  send-pack: unexpected disconnect while reading sideband packet
  fatal: the remote end hung up unexpectedly
  Everything up-to-date
  ```
- **Diagnosis**: The git remote for this session is a local git proxy service (`http://127.0.0.1:41729/git/...`), distinct from the external CCR egress proxy (`$HTTPS_PROXY`, port 40523). Checked `$HTTPS_PROXY/__agentproxy/status` — `recentRelayFailures` was empty, meaning the CCR egress-proxy layer is **not** the source of this rejection (it would log a relay failure if it were blocking the request). The branch push to the identical remote succeeded moments earlier without any error. This isolates the 403 to a restriction the local git service applies specifically to **tag-ref pushes**, not to branch-ref pushes.
- Confirmed via `list_tags` (GitHub API) that `origin` has **zero tags** — the tag genuinely never reached the remote.
- Per `/root/.ccr/README.md`'s documented guidance for 403/407 responses ("Do not retry or route around it — report the blocked host"), no further retries or workarounds (force push, alternate routing, credential changes) were attempted.
- **Status: `v1.0.0-MVP` exists locally only, pointing at `cb222c6`. It is NOT present on `origin`.** This is a real, reportable environment/permission limitation, not a defect in the release content itself.

## 5. GitHub Release

- Not created. A GitHub Release conventionally targets an existing tag; since the tag could not be pushed to `origin`, no reliable target exists for a Release object. No dedicated "create release" MCP tool was located in this session's available toolset (`ToolSearch` for GitHub Actions/deployment tools returned `actions_list`/`actions_get`/`get_job_logs`/file-branch-PR-repo tools only).
- The full intended Release content (MVP Summary / Completed Modules / Known Limitations / QA Summary / PAT Summary) already exists at `docs/Release/Release_v1.0.0-MVP.md` and can be used verbatim once PMO decides how to proceed on the tag limitation (see Recommendation below).

## 6. Summary

| Verification Item | Result |
|---|---|
| Commit created (single, consolidated) | ✅ `cb222c6` |
| Push to `main` | ✅ SUCCEEDED, confirmed live on `origin/main` |
| GitHub Pages deployment | ✅ SUCCEEDED (run `30442276287`, conclusion `success`) |
| Release Tag `v1.0.0-MVP` pushed to `origin` | ❌ FAILED — HTTP 403, local git service, tag-refs only, non-retriable per environment policy |
| GitHub Release created | ⏸ Not attempted — blocked on tag limitation above |

## Recommendation to PMO

The code release itself — the part with actual production consequence (repository content, GitHub Pages live deployment) — is **complete and verified**. The tag-push failure is a scoped, isolated environment/permission restriction on this session's git service, not a defect in the MVP work or a failure of the deployment. Per this Sprint's own instruction ("If deployment fails: STOP. Collect logs. Report to PMO."), this is reported rather than worked around. Suggested options for PMO to choose from in a future Sprint:
1. A human developer (who owns actual `git commit`/`push` per the project's role split) pushes the existing local tag `v1.0.0-MVP` from an environment with tag-push permission.
2. PMO treats the `main` branch's HEAD commit (`cb222c6`) itself as the de facto v1.0.0-MVP reference point (commit SHA is a valid, permanent, immutable pointer even without a formal tag) until the tag can be pushed.
