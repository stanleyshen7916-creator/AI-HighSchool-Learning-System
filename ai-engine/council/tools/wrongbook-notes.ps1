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
#   3. the writer AI (default Claude Code with the Sonnet model - set AHS_NOTES_CLAUDE_MODEL to change it;
#      AHS_NOTES_WRITER=agy|gemini|codex switches writer, Claude then reviews and backs it up) writes the notes
#      with tools/wrongbook-notes-prompt.md -> edits js/data/WrongBookNotesData.js only;
#      if the writer is missing, fails, hangs or breaks the format, Claude Code writes the batch instead;
#   3b. notes the writer could not confirm (basis not marked [confirmed]) are rewritten by Claude Code;
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
$AllowedTools = 'Read,Write,Edit,Glob,Grep,WebSearch,WebFetch'
$ReviewFile = Join-Path $RepoRoot 'ai-engine\council\data\wrongbook_notes\review.json'
$BeforeIdsFile = Join-Path $WorkDir 'ids-before.json'
$PreferredWriter = if ($env:AHS_NOTES_WRITER) { $env:AHS_NOTES_WRITER.Trim().ToLower() } else { 'claude' }
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

# Runs one AI CLI headless in the repo, as a separate process, writing the heartbeat while it
# works (each question takes minutes). Returns @{ code; tail }.
function Invoke-Agent([string]$agent, [string]$prompt) {
  $outFile = Join-Path $WorkDir "$agent-output.txt"
  switch ($agent) {
    # Sonnet by default: plenty for high-school solutions and uses far less of the plan's usage than Opus
    'claude' {
      $cm = if ($env:AHS_NOTES_CLAUDE_MODEL) { $env:AHS_NOTES_CLAUDE_MODEL } else { 'sonnet' }
      $cmd = "claude -p `"$prompt`" --model $cm --allowedTools `"$AllowedTools`" --permission-mode acceptEdits --output-format text"; $hours = 3
    }
    # auto_edit: edits are approved, shell commands are not (the prompt forbids them anyway)
    'gemini' {
      $model = if ($env:AHS_NOTES_GEMINI_MODEL) { " -m $($env:AHS_NOTES_GEMINI_MODEL)" } else { '' }
      # GOOGLE_GENAI_USE_GCA: always use the "Sign in with Google" login (the Google AI Pro quota),
      # even if settings.json has no auth type saved yet
      $cmd = "set GOOGLE_GENAI_USE_GCA=true&& gemini -p `"$prompt`" --approval-mode auto_edit --output-format text$model"; $hours = 1.5
    }
    # Antigravity CLI (Google AI Pro login): print mode, edits approved, nothing else
    'agy' { $cmd = "agy -p `"$prompt`" --mode accept-edits --output-format text"; $hours = 1.5 }
    'codex' { $cmd = "codex exec --full-auto `"$prompt`""; $hours = 1.5 }
    default { return @{ code = 1; tail = "unknown writer '$agent' (use agy, gemini, claude or codex)" } }
  }
  $cmdLine = "/d /s /c `"$cmd > `"$outFile`" 2>&1`""
  $proc = Start-Process -FilePath $env:ComSpec -ArgumentList $cmdLine -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru
  $null = $proc.Handle  # keeps ExitCode readable after the process ends
  $limit = (Get-Date).AddHours($hours)
  $timedOut = $false
  while (-not $proc.HasExited) {
    if ((Get-Date) -gt $limit) { & taskkill /PID $proc.Id /T /F | Out-Null; $timedOut = $true; break }
    Beat
    Start-Sleep -Seconds 5
  }
  $proc.WaitForExit()
  Beat
  $out = ''
  if (Test-Path $outFile) { $out = [System.IO.File]::ReadAllText($outFile, $utf8) }
  $tail = (($out.Trim() -split "`n") | Select-Object -Last 15) -join "`n"
  if ($timedOut) { return @{ code = 124; tail = "$agent did not finish within $hours hours" } }
  return @{ code = $proc.ExitCode; tail = $tail }
}

# '' when the notes file is the only change and the format test passes; otherwise the reason.
function Check-Notes {
  Save-Status @{ step = 'checking' }
  $extra = @(Changed-Paths | Where-Object { $_ -ne $NotesFile })
  if ($extra.Count -gt 0) {
    Invoke-Git (@('checkout', '--') + $extra) | Out-Null
    return ('changed other files: ' + ($extra -join ', '))
  }
  $t = Invoke-Node @('tests/regression/WrongBookDeleteRegression.js')
  if ($t.code -ne 0) { return ('format test failed: ' + ((($t.out -split "`n") | Where-Object { $_ -match 'FAIL' } | Select-Object -First 8) -join ' / ')) }
  return ''
}

# The AI writes only a small JSON file (new-notes.json); reading/editing the whole notes file
# (hundreds of KB) cost most of the tokens. WrongBookNotesMerge.js then merges it in.
$StagingRel = 'ai-engine/council/data/wrongbook_notes/new-notes.json'
function Write-Notes([string]$agent, [string]$listRel, [int]$n, [switch]$Review) {
  $staging = Join-Path $RepoRoot ($StagingRel -replace '/', '\')
  [System.IO.File]::WriteAllText($staging, '{}', $utf8)
  $mode = if ($Review) { ', in review mode (see the review-mode section)' } else { '' }
  $prompt = "Follow every instruction in ai-engine/council/tools/wrongbook-notes-prompt.md$mode. The list is $listRel ($n items). Write the notes to the output file $StagingRel."
  $r = Invoke-Agent $agent $prompt
  if ($r.code -ne 0) { return "$agent failed: $($r.tail)" }
  $m = Invoke-Node @('scripts/maintenance/WrongBookNotesMerge.js', '--in', $StagingRel)
  if ($m.code -ne 0) { return "merge failed: $($m.out)" }
  $script:status.lastMerge = $m.out
  if ($m.out -match 'merged 0 added, 0 replaced') { return "$agent wrote no notes: $($r.tail)" }
  return (Check-Notes)
}

function Run-Once([string]$reason) {
  $script:status = @{ state = 'running'; step = 'update'; reason = $reason; startedAt = (Get-Date).ToString('o') }
  Save-Status @{}
  $fail = { param($code, $detail) Save-Status @{ state = 'error'; error = $code; message = $detail; finishedAt = (Get-Date).ToString('o') } }

  foreach ($tool in @('git', 'gh', 'node')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { return (& $fail "no_$tool" "$tool is not installed or not on PATH") }
  }
  $hasClaude = [bool](Get-Command claude -ErrorAction SilentlyContinue)
  $writer = $PreferredWriter
  if (-not (Get-Command $writer -ErrorAction SilentlyContinue)) { $writer = 'claude' }
  if ($writer -eq 'claude' -and -not $hasClaude) { return (& $fail 'no_claude' "neither $PreferredWriter nor claude is installed or on PATH") }
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

  Save-Status @{ step = 'writing'; total = $pending.total; batch = $count; writer = $writer }
  $before = Note-Count
  Invoke-Node @('scripts/maintenance/WrongBookNotesPending.js', '--ids-out', $BeforeIdsFile) | Out-Null
  $relPending = 'ai-engine/council/data/wrongbook_notes/pending.json'

  $check = Write-Notes $writer $relPending $count
  $writerNote = ''
  if ($check) {
    Invoke-Git @('checkout', '--', $NotesFile) | Out-Null
    if ($writer -eq 'claude' -or -not $hasClaude) { return (& $fail 'claude_failed' $check) }
    # the writer could not do it (quota, not signed in, hang, bad format): Claude writes this batch
    $writerNote = "$writer failed, Claude wrote this batch: $check"
    Save-Status @{ writer = 'claude'; writerError = $check }
    $check = Write-Notes 'claude' $relPending $count
    if ($check) { Invoke-Git @('checkout', '--', $NotesFile) | Out-Null; return (& $fail 'claude_failed' $check) }
    $writer = 'claude'
  }

  # notes the writer could not confirm go to Claude for an independent rewrite
  $reviewed = 0
  if ($writer -ne 'claude' -and $hasClaude) {
    $n = Invoke-Node @('scripts/maintenance/WrongBookNotesPending.js', '--review', '--before', $BeforeIdsFile, '--pending', $PendingFile, '--out', $ReviewFile)
    $toReview = 0
    if ($n.code -eq 0) { $toReview = [int](($n.out -split "`n") | Select-Object -Last 1) }
    if ($toReview -gt 0) {
      Save-Status @{ step = 'reviewing'; review = $toReview }
      $snapshot = [System.IO.File]::ReadAllText((Join-Path $RepoRoot $NotesFile), $utf8)
      $check = Write-Notes 'claude' 'ai-engine/council/data/wrongbook_notes/review.json' $toReview -Review
      if ($check) {
        # keep the writer's notes (still marked as unconfirmed) rather than losing the batch
        [System.IO.File]::WriteAllText((Join-Path $RepoRoot $NotesFile), $snapshot, $utf8)
        $writerNote = "$writerNote Claude review failed, unconfirmed notes kept: $check".Trim()
      } else {
        $reviewed = $toReview
      }
    }
  }

  $added = (Note-Count) - $before
  if ($added -le 0) { return (Save-Status @{ state = 'done'; step = 'done'; added = 0; message = "$writer added no notes"; finishedAt = (Get-Date).ToString('o') }) }
  Save-Status @{ reviewed = $reviewed; writerNote = $writerNote }

  Save-Status @{ step = 'publishing'; added = $added }
  $id = "$([DateTimeOffset]::Now.ToUnixTimeMilliseconds())_wrongbook-notes"
  $date = Get-Date -Format 'MM/dd'
  $msg = "$date wrongbook notes | auto-generated key notes for $added question(s)`n`nGenerated on this computer by ai-engine/council/tools/wrongbook-notes.ps1. Writer: $writer; reviewed by Claude: $reviewed.`n"
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
