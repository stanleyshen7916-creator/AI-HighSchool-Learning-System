# wrongbook-notes.ps1 - writes the "key notes" (zhong dian zheng li) for new wrong-book questions.
#
# Runs on the host (not in Docker): it needs the host's node, git, gh and the
# Claude Code CLI (claude), all signed in. Started at Windows logon by the
# shortcut that install-wrongbook-notes-autostart.ps1 creates, and by the
# engine launcher .bat. Stays running (minimized) and:
#   - runs once shortly after start (the "every boot" run);
#   - runs again whenever the wrong-book page button asks for it: the engine
#     (POST /api/platform/wrongbook-notes/run) writes <DataDir>\wrongbook_notes\run.request.
# One run:
#   1. fast-forward local main to origin/main;
#   2. node scripts/maintenance/WrongBookNotesPending.js -> questions still in the
#      wrong book that have no note yet (needs SUPABASE_SERVICE_ROLE_KEY, read from the
#      environment or from %USERPROFILE%\.ahs\supabase-service-role.key);
#   3. claude -p with tools/wrongbook-notes-prompt.md -> edits js/data/WrongBookNotesData.js only;
#   4. refuses to publish if any other tracked file changed, or the regression test fails;
#   5. queues the file for git-publisher.ps1 (branch -> PR -> checks -> squash merge).
# Progress goes to <DataDir>\wrongbook_notes\status.json, which the page shows.
# Kept ASCII-only on purpose: Windows PowerShell 5.1 reads BOM-less scripts as ANSI.
param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][string]$DataDir,
  [int]$BootDelaySeconds = 60,
  [int]$MaxPerRun = 15,
  [switch]$NoInitialRun
)

$mutex = New-Object System.Threading.Mutex($false, 'AHS-WrongBookNotes-Worker')
if (-not $mutex.WaitOne(0)) { Write-Host 'wrongbook-notes is already running.'; exit 0 }

$utf8 = New-Object System.Text.UTF8Encoding($false)
# claude / node print UTF-8 (Chinese); read their output as UTF-8, not the ANSI code page
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$RepoRoot = (Resolve-Path $RepoRoot).Path
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$DataDir = (Resolve-Path $DataDir).Path
$WorkDir = Join-Path $DataDir 'wrongbook_notes'
$QueueDir = Join-Path $DataDir 'git_queue'
New-Item -ItemType Directory -Force -Path $WorkDir, $QueueDir | Out-Null
$Trigger = Join-Path $WorkDir 'run.request'
$StatusFile = Join-Path $WorkDir 'status.json'
$Heartbeat = Join-Path $WorkDir 'worker.heartbeat'
$NotesFile = 'js/data/WrongBookNotesData.js'
$PendingFile = Join-Path $RepoRoot 'ai-engine\council\data\wrongbook_notes\pending.json'
$PromptFile = Join-Path $RepoRoot 'ai-engine\council\tools\wrongbook-notes-prompt.md'
$Publisher = Join-Path $RepoRoot 'ai-engine\council\tools\git-publisher.ps1'
$AllowedTools = 'Read,Edit,Glob,Grep,WebSearch,WebFetch,Bash(node tests/regression/WrongBookDeleteRegression.js)'
Write-Host "wrongbook-notes: repo=$RepoRoot data=$DataDir"
Write-Host 'Keep this window open (it may stay minimized).'

$script:status = @{ state = 'idle' }
function Save-Status([hashtable]$changes) {
  foreach ($k in $changes.Keys) { $script:status[$k] = $changes[$k] }
  $script:status.updatedAt = (Get-Date).ToString('o')
  [System.IO.File]::WriteAllText($StatusFile, ($script:status | ConvertTo-Json -Compress), $utf8)
  Write-Host "$(Get-Date -Format 'HH:mm:ss')   $($script:status.state) $($script:status.step) $($script:status.error) $($script:status.message)"
}
function Beat { [System.IO.File]::WriteAllText($Heartbeat, (Get-Date).ToString('o'), $utf8) }

function Invoke-Git([string[]]$GitArgs) {
  $out = & git -C $RepoRoot @GitArgs 2>&1 | ForEach-Object { "$_" } | Out-String
  return @{ code = $LASTEXITCODE; out = $out.Trim() }
}
function Invoke-Node([string[]]$NodeArgs) {
  Push-Location $RepoRoot
  try { $out = & node @NodeArgs 2>&1 | ForEach-Object { "$_" } | Out-String } finally { Pop-Location }
  return @{ code = $LASTEXITCODE; out = $out.Trim() }
}
function Get-ServiceKey {
  if ($env:SUPABASE_SERVICE_ROLE_KEY) { return $env:SUPABASE_SERVICE_ROLE_KEY.Trim() }
  $f = Join-Path $env:USERPROFILE '.ahs\supabase-service-role.key'
  if (Test-Path $f) { return ([System.IO.File]::ReadAllText($f)).Trim() }
  return ''
}
function Note-Count {
  $r = Invoke-Node @('-e', "console.log(require('./scripts/maintenance/WrongBookNotesPending.js').existingNoteIds('$NotesFile').length)")
  if ($r.code -ne 0) { return -1 }
  return [int]($r.out -split "`n" | Select-Object -Last 1)
}
function Changed-Paths {
  # tracked files that differ from HEAD (staged or not); untracked files are ignored
  $r = Invoke-Git @('diff', '--name-only', 'HEAD')
  return @($r.out -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
}
function Publisher-Alive {
  $hb = Join-Path $QueueDir 'publisher.heartbeat'
  if (-not (Test-Path $hb)) { return $false }
  return ((Get-Date) - (Get-Item $hb).LastWriteTime).TotalSeconds -lt 15
}
function Pending-Publish {
  # an earlier batch of notes still waiting for its PR to merge
  return @(Get-ChildItem -Path $QueueDir -Filter '*_wrongbook-notes.request.json' -ErrorAction SilentlyContinue | Where-Object {
    -not (Test-Path (Join-Path $QueueDir ($_.Name -replace '\.request\.json$', '.result.json')))
  }).Count -gt 0
}

function Run-Once([string]$reason) {
  $script:status = @{ state = 'running'; step = 'update'; reason = $reason; startedAt = (Get-Date).ToString('o') }
  Save-Status @{}
  $fail = { param($code, $detail) Save-Status @{ state = 'error'; error = $code; message = $detail; finishedAt = (Get-Date).ToString('o') } }

  foreach ($tool in @('git', 'gh', 'node', 'claude')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { return (& $fail "no_$tool" "$tool is not installed or not on PATH") }
  }
  $key = Get-ServiceKey
  if (-not $key) { return (& $fail 'no_key' 'SUPABASE_SERVICE_ROLE_KEY not set and %USERPROFILE%\.ahs\supabase-service-role.key missing') }
  if (Pending-Publish) { return (& $fail 'busy' 'the previous batch is still being published') }

  $branch = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).out
  if ($branch -ne 'main') { return (& $fail 'not_main' "repo is on branch '$branch', not main") }
  # a notes file left over from an earlier failed run is discarded (only that one file),
  # and the four generated data files git-publisher.ps1 rebuilds on every publish are reset
  $generated = @('docs/TeachingMaterials/index.json', 'docs/TeachingMaterials/import-log.json', 'js/data/TeachingMaterialData.js', 'js/data/RepositoryStatus.js')
  Invoke-Git (@('checkout', '--', $NotesFile) + $generated) | Out-Null
  if ((Changed-Paths).Count -gt 0) { return (& $fail 'dirty' ('uncommitted changes: ' + ((Changed-Paths) -join ', '))) }
  $r = Invoke-Git @('fetch', 'origin', 'main')
  if ($r.code -ne 0) { return (& $fail 'update_failed' $r.out) }
  $r = Invoke-Git @('merge', '--ff-only', 'origin/main')
  if ($r.code -ne 0) { return (& $fail 'update_failed' $r.out) }

  Save-Status @{ step = 'pending' }
  $env:SUPABASE_SERVICE_ROLE_KEY = $key
  $r = Invoke-Node @('scripts/maintenance/WrongBookNotesPending.js', '--out', $PendingFile, '--max', "$MaxPerRun")
  Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
  if ($r.code -ne 0) { return (& $fail 'pending_failed' $r.out) }
  $pending = [System.IO.File]::ReadAllText($PendingFile, $utf8) | ConvertFrom-Json
  $count = @($pending.items).Count
  if ($count -eq 0) {
    return (Save-Status @{ state = 'done'; step = 'done'; added = 0; total = 0; message = 'no new wrong-book questions'; finishedAt = (Get-Date).ToString('o') })
  }

  Save-Status @{ step = 'writing'; total = $pending.total; batch = $count }
  $before = Note-Count
  $prompt = "Follow every instruction in ai-engine/council/tools/wrongbook-notes-prompt.md. The pending list is ai-engine/council/data/wrongbook_notes/pending.json ($count items)."
  Push-Location $RepoRoot
  try {
    $out = & claude -p $prompt --allowedTools $AllowedTools --permission-mode acceptEdits --output-format text 2>&1 | ForEach-Object { "$_" } | Out-String
    $claudeCode = $LASTEXITCODE
  } finally { Pop-Location }
  Beat
  $tail = (($out.Trim() -split "`n") | Select-Object -Last 20) -join "`n"
  if ($claudeCode -ne 0) { Invoke-Git @('checkout', '--', $NotesFile) | Out-Null; return (& $fail 'claude_failed' $tail) }

  Save-Status @{ step = 'checking'; claudeOutput = $tail }
  $extra = @(Changed-Paths | Where-Object { $_ -ne $NotesFile })
  if ($extra.Count -gt 0) {
    Invoke-Git @('checkout', '--', $NotesFile) | Out-Null
    return (& $fail 'extra_changes' ('Claude changed other files; nothing published: ' + ($extra -join ', ')))
  }
  $t = Invoke-Node @('tests/regression/WrongBookDeleteRegression.js')
  if ($t.code -ne 0) {
    Invoke-Git @('checkout', '--', $NotesFile) | Out-Null
    return (& $fail 'test_failed' ((($t.out -split "`n") | Where-Object { $_ -match 'FAIL' } | Select-Object -First 10) -join "`n"))
  }
  $added = (Note-Count) - $before
  if ($added -le 0) { return (Save-Status @{ state = 'done'; step = 'done'; added = 0; message = 'Claude added no notes'; finishedAt = (Get-Date).ToString('o') }) }

  Save-Status @{ step = 'publishing'; added = $added }
  $id = "$([DateTimeOffset]::Now.ToUnixTimeMilliseconds())_wrongbook-notes"
  $date = Get-Date -Format 'MM/dd'
  $msg = "$date wrongbook notes | auto-generated key notes for $added question(s)`n`nGenerated on this computer by ai-engine/council/tools/wrongbook-notes.ps1 (Claude Code CLI).`n"
  [System.IO.File]::WriteAllText((Join-Path $QueueDir "$id.message.txt"), $msg, $utf8)
  $req = @{ materialId = 'wrongbook-notes'; paths = @($NotesFile); createdAt = (Get-Date).ToString('o') }
  [System.IO.File]::WriteAllText((Join-Path $QueueDir "$id.request.json"), ($req | ConvertTo-Json -Compress), $utf8)
  if (-not (Publisher-Alive)) {
    Start-Process powershell -WindowStyle Minimized -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$Publisher`"", '-RepoRoot', "`"$RepoRoot`"", '-QueueDir', "`"$QueueDir`"")
  }
  $resultFile = Join-Path $QueueDir "$id.result.json"
  $deadline = (Get-Date).AddMinutes(45)
  while (-not (Test-Path $resultFile)) {
    if ((Get-Date) -gt $deadline) { return (& $fail 'publish_failed' 'no result from git-publisher within 45 minutes') }
    $p = Join-Path $QueueDir "$id.progress.txt"
    if (Test-Path $p) { $script:status.publishStep = ([System.IO.File]::ReadAllText($p)).Trim() }
    Save-Status @{}
    Beat
    Start-Sleep -Seconds 10
  }
  $res = ([System.IO.File]::ReadAllText($resultFile, $utf8)).TrimStart([char]0xFEFF) | ConvertFrom-Json
  if (-not $res.ok) { return (& $fail 'publish_failed' "$($res.error) $($res.pr)") }
  Save-Status @{ state = 'done'; step = 'done'; pr = $res.pr; commit = $res.commit; finishedAt = (Get-Date).ToString('o') }
}

function Safe-Run([string]$reason) {
  try { Run-Once $reason } catch { Save-Status @{ state = 'error'; error = 'worker_error'; message = $_.Exception.Message; finishedAt = (Get-Date).ToString('o') } }
}

if (-not $NoInitialRun) {
  Save-Status @{ state = 'waiting'; step = 'boot'; message = "first run in $BootDelaySeconds s" }
  for ($i = 0; $i -lt $BootDelaySeconds; $i += 5) { Beat; Start-Sleep -Seconds 5 }
  Safe-Run 'boot'
} else {
  Save-Status @{ state = 'idle' }
}

while ($true) {
  Beat
  if (Test-Path $Trigger) {
    Remove-Item -LiteralPath $Trigger -Force -ErrorAction SilentlyContinue
    Safe-Run 'button'
  }
  Start-Sleep -Seconds 5
}
