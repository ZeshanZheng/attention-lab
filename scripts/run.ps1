param(
    [ValidateSet('install', 'typecheck', 'test', 'build', 'demo', 'verify')]
    [string]$Task = 'verify'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeRoot = Join-Path $projectRoot '.tools/node-v24.12.0-win-x64'
$nodeExecutable = Join-Path $nodeRoot 'node.exe'
if (-not (Test-Path -LiteralPath $nodeExecutable)) { throw 'Run scripts/setup.ps1 first.' }
$previousPath = $env:PATH
Push-Location $projectRoot
try {
    $env:PATH = "$nodeRoot;$previousPath"
    $npmCli = Join-Path $nodeRoot 'node_modules/npm/bin/npm-cli.js'
    if ($Task -eq 'install') {
        $lockPath = Join-Path $projectRoot 'package-lock.json'
        if (Test-Path -LiteralPath $lockPath) { & $nodeExecutable $npmCli ci --cache (Join-Path $projectRoot '.tools/npm-cache') }
        else { & $nodeExecutable $npmCli install --cache (Join-Path $projectRoot '.tools/npm-cache') }
    } else {
        & $nodeExecutable $npmCli run $Task
    }
    if ($LASTEXITCODE -ne 0) { throw "Task '$Task' failed (exit code $LASTEXITCODE)." }
} finally {
    $env:PATH = $previousPath
    Pop-Location
}
