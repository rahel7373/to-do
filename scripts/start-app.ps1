# 업무 관리 실행 스크립트
# - 서버(포트 3111)가 꺼져 있으면 조용히 켠다. (이미 켜져 있으면 그대로 둔다)
# - 서버가 준비되면 기본 브라우저로 초기 화면을 연다.
# 데이터는 브라우저(localStorage)의 localhost:3111 주소에 저장되므로 포트를 바꾸지 않는다.
param([int]$Port = 3111, [switch]$NoBrowser)

$ErrorActionPreference = "SilentlyContinue"
$dir = Split-Path -Parent $PSScriptRoot
$url = "http://localhost:$Port"

function Test-Up {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2 | Out-Null
    return $true
  } catch { return $false }
}

if (-not (Test-Up)) {
  # 빌드 결과가 없으면 먼저 빌드한다 (코드를 고친 뒤에는 npm run build를 다시 해 둔다).
  if (-not (Test-Path (Join-Path $dir ".next\BUILD_ID"))) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run build" `
      -WorkingDirectory $dir -WindowStyle Hidden -Wait
  }
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start -- -p $Port" `
    -WorkingDirectory $dir -WindowStyle Hidden
  # 최대 90초까지 서버가 뜨기를 기다린다.
  for ($i = 0; $i -lt 90; $i++) {
    if (Test-Up) { break }
    Start-Sleep -Seconds 1
  }
}

if (-not $NoBrowser) { Start-Process $url }
