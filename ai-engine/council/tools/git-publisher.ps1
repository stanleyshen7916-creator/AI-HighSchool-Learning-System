# git-publisher.ps1 - commits and pushes materials published from the upload page.
#
# The upload engine runs in Docker without git or GitHub credentials, so after a
# successful publish it only writes a request into <data dir>\git_queue
# (see platform/GitPublishQueue.js). This script runs on the host (started by
# the engine launcher .bat), uses the host's own git + credentials, and writes
# the result back for the upload page to show.
#
# Safety:
#   - only the paths listed in the request are staged and committed
#     (git commit -- <paths>), never anything else in the working tree;
#   - only pushes when the repo is on main;
#   - a rejected push is retried once after "git pull --rebase --autostash".
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

function Publish-Request($req, [string]$id) {
  $log = New-Object System.Collections.Generic.List[string]
  $branch = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).out
  if ($branch -ne 'main') {
    return @{ ok = $false; error = "repo is on branch '$branch', not main; not pushed. Switch to main and publish again, or push manually."; log = '' }
  }
  $paths = @($req.paths)

  $r = Invoke-Git (@('add', '--') + $paths); $log.Add("git add: $($r.out)")
  if ($r.code -ne 0) { return @{ ok = $false; error = 'git add failed'; log = ($log -join "`n") } }

  $msgFile = Join-Path $QueueDir "$id.message.txt"
  $r = Invoke-Git (@('commit', '-F', $msgFile, '--') + $paths); $log.Add("git commit: $($r.out)")
  if ($r.code -ne 0) { return @{ ok = $false; error = 'git commit failed (nothing changed, or a hook rejected it)'; log = ($log -join "`n") } }
  $commit = (Invoke-Git @('rev-parse', '--short', 'HEAD')).out

  $r = Invoke-Git @('push', 'origin', 'main'); $log.Add("git push: $($r.out)")
  if ($r.code -ne 0) {
    $r = Invoke-Git @('pull', '--rebase', '--autostash', 'origin', 'main'); $log.Add("git pull --rebase: $($r.out)")
    if ($r.code -ne 0) {
      return @{ ok = $false; commit = $commit; error = 'push rejected and rebase failed; the commit is saved locally, resolve and push manually'; log = ($log -join "`n") }
    }
    $commit = (Invoke-Git @('rev-parse', '--short', 'HEAD')).out
    $r = Invoke-Git @('push', 'origin', 'main'); $log.Add("git push (retry): $($r.out)")
    if ($r.code -ne 0) {
      return @{ ok = $false; commit = $commit; error = 'git push failed; the commit is saved locally, push manually'; log = ($log -join "`n") }
    }
  }
  return @{ ok = $true; commit = $commit; error = $null; log = ($log -join "`n") }
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
