param()
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $projectRoot '.tools'
$nodeVersion = '24.12.0'
$archiveName = "node-v$nodeVersion-win-x64.zip"
$nodeRoot = Join-Path $toolsRoot "node-v$nodeVersion-win-x64"
$nodeExecutable = Join-Path $nodeRoot 'node.exe'
if (-not (Test-Path -LiteralPath $nodeExecutable)) {
    if (-not [Environment]::Is64BitOperatingSystem) { throw 'This setup requires 64-bit Windows.' }
    New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null
    $archivePath = Join-Path $toolsRoot $archiveName
    $manifestPath = Join-Path $toolsRoot 'SHASUMS256.txt'
    $downloadRoot = "https://nodejs.org/dist/v$nodeVersion"
    Invoke-WebRequest -Uri "$downloadRoot/SHASUMS256.txt" -OutFile $manifestPath -UseBasicParsing
    Invoke-WebRequest -Uri "$downloadRoot/$archiveName" -OutFile $archivePath -UseBasicParsing
    $manifestLine = Get-Content -LiteralPath $manifestPath | Where-Object { $_ -match "  $([regex]::Escape($archiveName))$" }
    if (@($manifestLine).Count -ne 1) { throw 'Cannot find a unique official checksum for the Node.js archive.' }
    $expectedHash = ($manifestLine -split '\s+')[0]
    $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
    if ($actualHash -ne $expectedHash) { throw 'Node.js archive checksum does not match the official manifest.' }
    Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsRoot -Force
}
& $nodeExecutable --version
if ($LASTEXITCODE -ne 0) { throw 'Node.js startup failed.' }
Write-Output 'Project-local Node.js is ready. System PATH was not changed.'
