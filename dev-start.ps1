# SIGAF — Arranque completo de desarrollo
# Uso: .\dev-start.ps1
# Requiere: ngrok instalado y configurado con authtoken

$NGROK_DOMAIN = "reappoint-grass-tinkling.ngrok-free.dev"
$root = $PSScriptRoot

Write-Host "Limpiando procesos previos..." -ForegroundColor Yellow
Stop-Process -Name "ngrok" -ErrorAction SilentlyContinue -Force
Stop-Process -Name "node"  -ErrorAction SilentlyContinue -Force

Write-Host ""
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor Green
Write-Host "  Tunnel:   https://$NGROK_DOMAIN" -ForegroundColor Cyan
Write-Host "  n8n URL:  https://$NGROK_DOMAIN" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ctrl+C para detener todo." -ForegroundColor DarkGray
Write-Host "─────────────────────────────────────────" -ForegroundColor DarkGray

$apiJob = Start-Job -Name "SIGAF-API" -ScriptBlock {
    Set-Location $using:root
    npm.cmd run dev:api 2>&1
}

Start-Sleep -Seconds 3

$ngrokJob = Start-Job -Name "SIGAF-NGROK" -ScriptBlock {
    $domain = $using:NGROK_DOMAIN
    ngrok http --url=$domain 3000 2>&1
}

try {
    while ($true) {
        Receive-Job $apiJob   | ForEach-Object { Write-Host "[API]   $_" -ForegroundColor Green }
        Receive-Job $ngrokJob | ForEach-Object { Write-Host "[NGROK] $_" -ForegroundColor Cyan }
        Start-Sleep -Milliseconds 400
    }
} finally {
    Write-Host "`nDeteniendo procesos..." -ForegroundColor Yellow
    Stop-Job    $apiJob, $ngrokJob -ErrorAction SilentlyContinue
    Remove-Job  $apiJob, $ngrokJob -ErrorAction SilentlyContinue
    Stop-Process -Name "ngrok" -ErrorAction SilentlyContinue -Force
    Stop-Process -Name "node"  -ErrorAction SilentlyContinue -Force
    Write-Host "Listo." -ForegroundColor DarkGray
}
