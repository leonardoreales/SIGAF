# SIGAF — Arranque completo de desarrollo
# Uso: .\dev-start.ps1
# Requiere: ngrok instalado y configurado con authtoken

$NGROK_DOMAIN = "reappoint-grass-tinkling.ngrok-free.dev"

Write-Host "Limpiando procesos previos..." -ForegroundColor Yellow
Stop-Process -Name "ngrok" -ErrorAction SilentlyContinue
Stop-Process -Name "node" -ErrorAction SilentlyContinue

Write-Host "Iniciando SIGAF backend + tunnel ngrok..." -ForegroundColor Cyan

# Backend en background (usando npm.cmd para evitar problemas de política de ejecución)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm.cmd run dev:api" -WindowStyle Normal

Start-Sleep -Seconds 3

# ngrok tunnel en background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http --url=$NGROK_DOMAIN 3000" -WindowStyle Normal

Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Green
Write-Host "Tunnel:   https://$NGROK_DOMAIN" -ForegroundColor Green
Write-Host ""
Write-Host "SIGAF_API_URL en n8n = https://$NGROK_DOMAIN" -ForegroundColor Yellow
