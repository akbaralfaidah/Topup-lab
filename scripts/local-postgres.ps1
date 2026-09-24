param([ValidateSet('start', 'stop', 'status')][string]$Action = 'status')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pgRoot = Join-Path $projectRoot 'runtime/postgresql17'
$pgControl = Join-Path $pgRoot 'distribution/pgsql/bin/pg_ctl.exe'
$pgData = Join-Path $pgRoot 'data'
if (!(Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION'))) {
  throw 'Local PostgreSQL is not initialized. See docs/phase-3-live-validation.md.'
}
if ((Get-Content -LiteralPath (Join-Path $pgData 'PG_VERSION')).Trim() -ne '17') {
  throw 'This helper only operates the project-local PostgreSQL 17 cluster.'
}
if ($Action -eq 'start') {
  & $pgControl -D $pgData status *> $null
  if ($LASTEXITCODE -eq 0) { Write-Output 'Local PostgreSQL is already running.'; exit 0 }
  $process = Start-Process -FilePath $pgControl -ArgumentList @('-D', ('"' + $pgData + '"'), '-l', ('"' + (Join-Path $pgRoot 'server.log') + '"'), '-w', '-t', '30', 'start') -WindowStyle Hidden -PassThru
  # Wait for pg_ctl, not the long-lived server process it launches.
  if (!$process.WaitForExit(40000)) { throw 'Local PostgreSQL startup timed out.' }
  exit $process.ExitCode
}
if ($Action -eq 'stop') {
  & $pgControl -D $pgData -m fast -w stop
  exit $LASTEXITCODE
}
& $pgControl -D $pgData status
exit $LASTEXITCODE
