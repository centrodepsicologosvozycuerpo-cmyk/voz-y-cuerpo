# Script para copiar archivos .env.example a cada proyecto

Write-Host "📋 Copiando archivos .env.example..." -ForegroundColor Green

# Verificar que existe la carpeta env-files
if (-not (Test-Path "env-files")) {
    Write-Host "❌ Error: No se encuentra la carpeta env-files" -ForegroundColor Red
    exit 1
}

# Crear directorios si no existen (solo si son necesarios)
# Nota: Este proyecto es un monorepo Next.js, no necesita carpetas separadas

# Copiar archivos
Write-Host ""
Write-Host "📦 Copiando archivos..." -ForegroundColor Cyan

# Copiar archivos .env a cada workspace
Write-Host "📦 Copiando archivos .env a cada workspace..." -ForegroundColor Cyan

# Backend
if (Test-Path "env-files\api.env.example") {
    if (-not (Test-Path "backend\.env")) {
        Copy-Item "env-files\api.env.example" "backend\.env" -Force
        Write-Host "✅ backend/.env creado" -ForegroundColor Green
    }
}

# Frontend (opcional, si necesita .env.local)
if (Test-Path "env-files\app-client.env.example") {
    if (-not (Test-Path "frontend\.env.local")) {
        Copy-Item "env-files\app-client.env.example" "frontend\.env.local" -Force
        Write-Host "✅ frontend/.env.local creado" -ForegroundColor Green
    }
}

# Backoffice (opcional, si necesita .env.local)
if (Test-Path "env-files\app-admin.env.example") {
    if (-not (Test-Path "backoffice\.env.local")) {
        Copy-Item "env-files\app-admin.env.example" "backoffice\.env.local" -Force
        Write-Host "✅ backoffice/.env.local creado" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ ¡Archivos .env copiados correctamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Revisar los archivos .env y ajustar si es necesario" -ForegroundColor White
Write-Host "   2. Ver README.md para iniciar cada proyecto por separado" -ForegroundColor White
Write-Host ""

