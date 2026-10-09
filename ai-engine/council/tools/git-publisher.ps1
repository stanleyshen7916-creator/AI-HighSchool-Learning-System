# git-publisher.ps1 - commits and pushes materials published from the upload page.
#
# The upload engine runs in Docker without git or GitHub credentials, so after a
# successful publish it only writes a request into <data dir>\git_queue
# (see platform/GitPublishQueue.js). This script runs on the host (started by
# the engine launcher .bat), uses the host's own git + credentials, and writes
# the result back for the upload page to show.
#
# main is protected by a ruleset (changes only through a pull request, and the
# "Verify + Test + Playwright" check must pass), so a publish goes:
#   commit on local main -> push to branch publish/<tm_N>-<id> -> gh pr create
#   -> wait for the checks -> gh pr merge --squash (retried while the ruleset
#   still refuses) -> git reset --keep origin/main (moves local main onto the
#   squash commit, keeping newer uncommitted work).
# Safety:
#   - only the paths listed in the request are staged and committed
#     (git commit -- <paths>), never anything else in the working tree;
#   - only runs when the repo is on main;
#   - if the checks fail the PR is left open (nothing merged) and the reason
#     plus the PR link are reported.
# Needs the host's git and gh (GitHub CLI), both already signed in.
# Kept ASCII-only on purpose: Windows PowerShell 5.1 reads BOM-less scripts as ANSI.
param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][string]$QueueDir
)

$mutex = New-Object System.Threading.Mutex($false, 'AHS-Council-GitPublisher')
if (-not $mutex.WaitOne(0)) { Write-Host 'git-publisher is already running.'; exit 0 }

$utf8 = New-Object System.Text.UTF8Encoding($false)
New-Item -ItemType Directory -Force -Path $QueueDir | Out-Null
$RepoRoot = (Resolve-Path $RepoRoot).Path
Write-Host "git-publisher: repo=$RepoRoot queue=$QueueDir"
Write-Host 'Keep this window open while publishing materials.'

function Invoke-Git([string[]]$GitArgs) {
  # "$_" turns stderr ErrorRecords back into plain text (git writes progress to stderr)
  $out = & git -C $RepoRoot @GitArgs 2>&1 | ForEach-Object { "$_" } | Out-String
  return @{ code = $LASTEXITCODE; out = $out.Trim() }
}

function Invoke-Gh([string[]]$GhArgs) {
  Push-Location $RepoRoot
  try { $out = & gh @GhArgs 2>&1 | ForEach-Object { "$_" } | Out-String } finally { Pop-Location }
  return @{ code = $LASTEXITCODE; out = $out.Trim() }
}

# progress shown on the upload page while the request is pending (steps take minutes)
function Set-Progress([string]$id, [string]$step) {
  [System.IO.File]::WriteAllText((Join-Path $QueueDir "$id.progress.txt"), $step, $utf8)
  Write-Host "$(Get-Date -Format 'HH:mm:ss')   $step"
}

function Publish-Request($req, [string]$id) {
  $log = New-Object System.Collections.Generic.List[string]
  $fail = { param($msg, $extra) $h = @{ ok = $false; error = $msg; log = ($log -join "`n") }; if ($extra) { $extra.Keys | ForEach-Object { $h[$_] = $extra[$_] } }; return $h }
  $branch = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).out
  if ($branch -ne 'main') {
    return (& $fail "repo is on branch '$branch', not main; not pushed. Switch to main and publish again." $null)
  }
  $paths = @($req.paths)

  # Start from the current remote main. Local main must not carry commits that
  # are not on origin/main (a previous failed request) - they would ride along
  # into this PR. Fast-forward if behind (fails safely on conflicting edits).
  $r = Invoke-Git @('fetch', 'origin', 'main'); $log.Add("git fetch: $($r.out)")
  # 2026-10-09: a new material (tm_N) must not take an id already used on GitHub
  # main by a different material (the engine numbered from a stale checkout once).
  # Same metadata as GitHub = an earlier run of this request already landed.
  if ($req.materialId -match '^tm_\d+$') {
    $meta = "docs/TeachingMaterials/materials/$($req.materialId)/metadata.json"
    $exists = Invoke-Git @('cat-file', '-e', "origin/main:$meta")
    if ($exists.code -eq 0) {
      $same = Invoke-Git @('diff', '--quiet', 'origin/main', '--', $meta)
      if ($same.code -ne 0) {
        return (& $fail "$($req.materialId) is already used on GitHub by a different material; not pushed. Delete the draft and publish it again from the upload page to get a new number." $null)
      }
    }
  }
  $ahead = (Invoke-Git @('rev-list', '--count', 'origin/main..HEAD')).out
  if ($ahead -ne '0') {
    return (& $fail "local main has $ahead commit(s) that are not on GitHub (an earlier publish did not finish); not pushed. Resolve them first." $null)
  }
  $r = Invoke-Git @('merge', '--ff-only', 'origin/main'); $log.Add("git merge --ff-only: $($r.out)")
  if ($r.code -ne 0) { return (& $fail 'could not update local main to GitHub main (local edits conflict); not pushed' $null) }

  Set-Progress $id 'commit'
  $r = Invoke-Git (@('add', '--') + $paths); $log.Add("git add: $($r.out)")
  if ($r.code -ne 0) { return (& $fail 'git add failed' $null) }
  $msgFile = Join-Path $QueueDir "$id.message.txt"
  $r = Invoke-Git (@('commit', '-F', $msgFile, '--') + $paths); $log.Add("git commit: $($r.out)")
  if ($r.code -ne 0) { return (& $fail 'git commit failed (nothing changed, or a hook rejected it)' $null) }
  $commit = (Invoke-Git @('rev-parse', '--short', 'HEAD')).out

  Set-Progress $id 'push'
  $pubBranch = "publish/$($req.materialId)-$($id.Split('_')[0])"
  $r = Invoke-Git @('push', 'origin', "HEAD:refs/heads/$pubBranch"); $log.Add("git push: $($r.out)")
  if ($r.code -ne 0) { return (& $fail 'git push of the publish branch failed; the commit is saved on local main' @{ commit = $commit }) }

  Set-Progress $id 'pr'
  $title = (Get-Content -LiteralPath $msgFile -Encoding UTF8 -TotalCount 1)
  $r = Invoke-Gh @('pr', 'create', '--base', 'main', '--head', $pubBranch, '--title', $title, '--body-file', $msgFile); $log.Add("gh pr create: $($r.out)")
  if ($r.code -ne 0) { return (& $fail 'gh pr create failed' @{ commit = $commit }) }
  $prUrl = ($r.out -split "`n" | Where-Object { $_ -match '^https://github\.com/.+/pull/\d+' } | Select-Object -Last 1)

  # wait for the required checks (usually 4-5 minutes); give up after 30 minutes
  Set-Progress $id 'checks'
  $deadline = (Get-Date).AddMinutes(30)
  while ($true) {
    Start-Sleep -Seconds 20
    [System.IO.File]::WriteAllText((Join-Path $QueueDir 'publisher.heartbeat'), (Get-Date).ToString('o'), $utf8)
    $buckets = @((Invoke-Gh @('pr', 'checks', $prUrl, '--json', 'bucket', '-q', '.[].bucket')).out -split "`n" | Where-Object { $_ })
    if ($buckets -contains 'fail' -or $buckets -contains 'cancel') {
      return (& $fail 'the automated checks failed; nothing was merged. Open the PR to see why.' @{ commit = $commit; pr = $prUrl })
    }
    if ($buckets.Count -gt 0 -and -not ($buckets -contains 'pending')) { break }
    if ((Get-Date) -gt $deadline) {
      return (& $fail 'the automated checks did not finish within 30 minutes; the PR is left open' @{ commit = $commit; pr = $prUrl })
    }
  }

  # The ruleset can still refuse the merge for a short while after the checks
  # report (a second required run not registered yet) - retry until the deadline.
  Set-Progress $id 'merge'
  while ($true) {
    $r = Invoke-Gh @('pr', 'merge', $prUrl, '--squash', '--delete-branch'); $log.Add("gh pr merge: $($r.out)")
    if ($r.code -eq 0) { break }
    if ((Get-Date) -gt $deadline) { return (& $fail 'gh pr merge kept failing for 30 minutes; the PR is left open' @{ commit = $commit; pr = $prUrl }) }
    Start-Sleep -Seconds 20
    [System.IO.File]::WriteAllText((Join-Path $QueueDir 'publisher.heartbeat'), (Get-Date).ToString('o'), $utf8)
  }

  # Move local main onto the squash commit. Its files equal the local commit's,
  # so "reset --keep" only moves the branch; it keeps any newer uncommitted work
  # (e.g. the next publish) and refuses instead of overwriting it. (A rebase here
  # replays the local commit onto the squash and conflicts.)
  $r = Invoke-Git @('fetch', 'origin', 'main'); $log.Add("git fetch: $($r.out)")
  $r = Invoke-Git @('reset', '--keep', 'origin/main'); $log.Add("git reset --keep: $($r.out)")
  if ($r.code -ne 0) {
    return (& $fail 'merged on GitHub, but local main could not be moved to it; run "git reset --keep origin/main" by hand' @{ commit = $commit; pr = $prUrl })
  }
  $merged = (Invoke-Git @('rev-parse', '--short', 'HEAD')).out
  return @{ ok = $true; commit = $merged; pr = $prUrl; error = $null; log = ($log -join "`n") }
}

while ($true) {
  [System.IO.File]::WriteAllText((Join-Path $QueueDir 'publisher.heartbeat'), (Get-Date).ToString('o'), $utf8)
  Get-ChildItem -Path $QueueDir -Filter '*.request.json' | Sort-Object Name | ForEach-Object {
    $id = $_.Name -replace '\.request\.json$', ''
    $resultFile = Join-Path $QueueDir "$id.result.json"
    if (Test-Path $resultFile) { return }
    Write-Host "$(Get-Date -Format 'HH:mm:ss') publishing $id ..."
    try {
      $req = [System.IO.File]::ReadAllText($_.FullName, $utf8) | ConvertFrom-Json
      $result = Publish-Request $req $id
    } catch {
      $result = @{ ok = $false; error = "publisher error: $($_.Exception.Message)"; log = '' }
    }
    $result.finishedAt = (Get-Date).ToString('o')
    [System.IO.File]::WriteAllText($resultFile, ($result | ConvertTo-Json -Compress), $utf8)
    Write-Host "$(Get-Date -Format 'HH:mm:ss') $id -> ok=$($result.ok) $($result.commit) $($result.error)"
  }
  Start-Sleep -Seconds 3
}
