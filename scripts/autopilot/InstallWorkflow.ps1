# 將 Autopilot 工作流匯入本機 Docker 的 n8n（會把 .token 填入暫存副本，不寫回 repo）
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$container = 'ai-workflow-mvp-n8n'
$tokenFile = Join-Path $dir '.token'
if (-not (Test-Path $tokenFile)) {
  $bytes = New-Object byte[] 24; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  [IO.File]::WriteAllText($tokenFile, (($bytes | ForEach-Object { $_.ToString('x2') }) -join ''))
}
$token = (Get-Content $tokenFile -Raw).Trim()
$json = (Get-Content (Join-Path $dir 'AutopilotWorkflow.template.json') -Raw -Encoding UTF8).Replace('__AUTOPILOT_TOKEN__', $token)
$tmp = Join-Path $env:TEMP 'AutopilotWorkflow.json'
[IO.File]::WriteAllText($tmp, $json, (New-Object Text.UTF8Encoding($false)))
docker cp $tmp "${container}:/tmp/AutopilotWorkflow.json"
docker exec $container n8n import:workflow --input=/tmp/AutopilotWorkflow.json
docker exec $container n8n publish:workflow --id=AutopilotRunner01
docker exec $container rm -f /tmp/AutopilotWorkflow.json
Remove-Item $tmp -Force
docker restart $container | Out-Null
Write-Host 'Autopilot workflow installed and published. n8n restarted.'
