# ═══════════════════════════════════════════════════════════════
# SIGAF — Script de importación a Supabase
# Ejecutar desde la raíz del proyecto: .\Backend\migration\supabase_import.ps1
# ═══════════════════════════════════════════════════════════════
#
# Antes de ejecutar: reemplaza los valores de las variables de abajo
# con los datos de tu proyecto Supabase.
#
# Dónde obtenerlos:
#   Supabase Dashboard → Settings → Database → Connection string
#   Seleccionar modo: "URI" (Direct connection)
#   Ejemplo: postgresql://postgres:[tu-password]@[host].supabase.co:5432/postgres
# ═══════════════════════════════════════════════════════════════

$SUPABASE_HOST     = "aws-1-us-east-1.pooler.supabase.com"
$SUPABASE_PASSWORD = "NcXjX9knQKtm3v13"
$SUPABASE_USER     = "postgres.baqvgyjtqdbypoudcons"
$SUPABASE_DB       = "postgres"
$SUPABASE_PORT     = "5432"

$PG_BIN  = "C:\Program Files\PostgreSQL\18\bin"
$MIGRATION_DIR = "$PSScriptRoot"

# ── Validación básica ────────────────────────────────────────────
if ($SUPABASE_HOST -like "*REEMPLAZAR*" -or $SUPABASE_PASSWORD -like "*REEMPLAZAR*") {
    Write-Host "ERROR: Debes reemplazar SUPABASE_HOST y SUPABASE_PASSWORD en este script." -ForegroundColor Red
    exit 1
}

$env:PGPASSWORD = $SUPABASE_PASSWORD
$connStr = "postgresql://${SUPABASE_USER}:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SIGAF → Supabase Migration" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Host: $SUPABASE_HOST"
Write-Host "  DB:   $SUPABASE_DB"
Write-Host ""

# ── PASO 1: Verificar conexión ───────────────────────────────────
Write-Host "[1/3] Verificando conexion a Supabase..." -ForegroundColor Yellow
$testResult = & "$PG_BIN\psql.exe" $connStr -c "SELECT current_database(), version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo conectar a Supabase." -ForegroundColor Red
    Write-Host $testResult
    exit 1
}
Write-Host "  Conexion OK" -ForegroundColor Green

# ── PASO 2: Aplicar schema ──────────────────────────────────────
Write-Host "[2/3] Aplicando schema..." -ForegroundColor Yellow
$schemaResult = & "$PG_BIN\psql.exe" $connStr -f "$MIGRATION_DIR\supabase_schema.sql" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ADVERTENCIA al aplicar schema (puede ser normal si las tablas ya existen):" -ForegroundColor Yellow
    Write-Host $schemaResult
} else {
    Write-Host "  Schema aplicado OK" -ForegroundColor Green
}

# ── PASO 3: Importar datos ──────────────────────────────────────
Write-Host "[3/3] Importando datos (~11500 activos)..." -ForegroundColor Yellow
Write-Host "  Esto puede tardar 1-2 minutos..."
$dataResult = & "$PG_BIN\psql.exe" $connStr `
    --set ON_ERROR_STOP=0 `
    -f "$MIGRATION_DIR\supabase_data.sql" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ADVERTENCIA durante importacion de datos:" -ForegroundColor Yellow
    Write-Host ($dataResult | Select-Object -Last 20 | Out-String)
} else {
    Write-Host "  Datos importados OK" -ForegroundColor Green
}

# ── Verificación final ───────────────────────────────────────────
Write-Host ""
Write-Host "Verificando conteo de activos..." -ForegroundColor Yellow
$count = & "$PG_BIN\psql.exe" $connStr -t -c "SELECT COUNT(*) FROM assets;" 2>&1
Write-Host "  Activos en Supabase: $($count.Trim())" -ForegroundColor Cyan

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Migracion completada!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:"
Write-Host "  1. Copia el connection string de Supabase"
Write-Host "  2. Actualiza Backend\api\.env con los nuevos valores"
Write-Host "  3. Actualiza el credential Actas_AF en n8n"
Write-Host ""