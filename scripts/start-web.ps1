param([int]$Port = 8787)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$runtimeDir = Join-Path $projectRoot '.python-deps-web-v3'
$marker = Join-Path $runtimeDir '.ready'
if (-not (Test-Path -LiteralPath $marker) -or -not (Test-Path -LiteralPath (Join-Path $runtimeDir 'langgraph/checkpoint/sqlite/aio.py'))) {
    python -m pip install --upgrade --target $runtimeDir -r backend/requirements.lock.txt
    if ($LASTEXITCODE -ne 0) { throw '依赖安装失败，请检查网络及 Python 版本。' }
    Set-Content -LiteralPath $marker -Value 'installed' -Encoding utf8
}
$configFile = Join-Path $projectRoot 'backend/.env'
if (-not (Test-Path -LiteralPath $configFile)) {
    $accessToken = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
    $template = Get-Content -LiteralPath 'backend/.env.example' -Raw
    $template = $template.Replace('replace_with_long_random_token', $accessToken)
    [System.IO.File]::WriteAllText($configFile, $template, [System.Text.UTF8Encoding]::new($false))
}
$tokenLine = Get-Content -LiteralPath $configFile | Where-Object { $_ -match '^APP_ACCESS_TOKEN=' } | Select-Object -First 1
Write-Host ('电脑访问：http://localhost:' + $Port)
Write-Host '手机访问：http://电脑局域网IP:端口（同一Wi-Fi）'

Write-Host '使用用户名和密码注册，无需邀请码；登录后刷新可自动恢复。'
Write-Host '助手默认使用 SQLite 长期记忆；也支持配置 PostgreSQL。DeepSeek 密钥只填写到 backend/.env。'
$previousPythonPath = $env:PYTHONPATH
$previousTracing = $env:LANGSMITH_TRACING
try {
    $env:PYTHONPATH = $runtimeDir
    $env:LANGSMITH_TRACING = 'false'
    python -m uvicorn backend.app:app --host 0.0.0.0 --port $Port --env-file backend/.env --no-access-log
} finally {
    $env:PYTHONPATH = $previousPythonPath
    $env:LANGSMITH_TRACING = $previousTracing
}
