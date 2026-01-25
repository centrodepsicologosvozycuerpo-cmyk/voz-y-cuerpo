# =============================================================================
# Script para levantar los 3 proyectos en Windows
# 
# MODOS DE USO:
#   .\start-all.ps1           -> Desarrollo con hot reload
#   .\start-all.ps1 -Build    -> Build de producción (genera archivos estáticos)
#   .\start-all.ps1 -Prod     -> Sirve los builds de producción localmente
#
# URLS:
#   Backend (API):     http://localhost:3002
#   Backoffice:        http://localhost:3001
#   Frontend:          http://localhost:3000
# =============================================================================

param(
    [switch]$Build,
    [switch]$Prod
)

# Configuración de colores
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    White = "White"
}

# Directorio base
$BaseDir = $PSScriptRoot
if (-not $BaseDir) {
    $BaseDir = (Get-Location).Path
}

# Determinar modo
$Mode = "dev"
if ($Build) { $Mode = "build" }
if ($Prod) { $Mode = "prod" }

# Banner inicial
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
$modeText = switch ($Mode) {
    "build" { "Build de Producción" }
    "prod" { "Modo Producción" }
    default { "Modo Desarrollo" }
}
Write-Host "  🧠 App Psicólogos - $modeText" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Verificar que estamos en el directorio raíz
if (-not (Test-Path "$BaseDir\backend") -or -not (Test-Path "$BaseDir\frontend") -or -not (Test-Path "$BaseDir\backoffice")) {
    Write-Host "❌ Error: Este script debe ejecutarse desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# =============================================================================
# FUNCIONES AUXILIARES
# =============================================================================

function Test-Port {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $null -ne $connection
    }
    catch {
        return $false
    }
}

function Stop-PortProcess {
    param([int]$Port)
    if (Test-Port -Port $Port) {
        Write-Host "⚠️  Puerto $Port en uso, liberando..." -ForegroundColor Yellow
        try {
            $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                         Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $processes) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 1
        }
        catch {
            Write-Host "   No se pudo liberar el puerto $Port automáticamente" -ForegroundColor Yellow
        }
    }
}

function Install-Dependencies {
    param(
        [string]$Path,
        [string]$Name
    )
    $nodeModulesPath = Join-Path $Path "node_modules"
    $packageJsonPath = Join-Path $Path "package.json"
    $packageLockPath = Join-Path $Path "package-lock.json"
    
    # Verificar si package.json existe
    if (-not (Test-Path $packageJsonPath)) {
        Write-Host "⚠️  No se encontró package.json en $Name, saltando instalación..." -ForegroundColor Yellow
        return
    }
    
    # Verificar si node_modules existe y si package-lock.json es más reciente
    $needsInstall = $false
    if (-not (Test-Path $nodeModulesPath)) {
        $needsInstall = $true
        Write-Host "📦 node_modules no existe, instalando dependencias de $Name..." -ForegroundColor Yellow
    } elseif (Test-Path $packageLockPath) {
        # Comparar fechas de modificación
        $packageJsonTime = (Get-Item $packageJsonPath).LastWriteTime
        $packageLockTime = (Get-Item $packageLockPath).LastWriteTime
        $nodeModulesTime = (Get-Item $nodeModulesPath).LastWriteTime
        
        # Si package.json es más reciente que package-lock.json o node_modules, reinstalar
        if ($packageJsonTime -gt $packageLockTime -or $packageJsonTime -gt $nodeModulesTime) {
            $needsInstall = $true
            Write-Host "📦 Detectados cambios en package.json, actualizando dependencias de $Name..." -ForegroundColor Yellow
        }
    } else {
        # Si no hay package-lock.json, instalar
        $needsInstall = $true
        Write-Host "📦 Instalando dependencias de $Name..." -ForegroundColor Yellow
    }
    
    if ($needsInstall) {
        Push-Location $Path
        
        # Usar siempre el registro público de npm para evitar problemas de autenticación
        Write-Host "   Instalando desde registro público de npm..." -ForegroundColor Cyan
        npm install --registry https://registry.npmjs.org/ --legacy-peer-deps
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error instalando dependencias de $Name" -ForegroundColor Red
            Write-Host "   Intentá ejecutar manualmente: cd $Path && npm install --legacy-peer-deps" -ForegroundColor Yellow
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Host "   ✅ Dependencias de $Name instaladas" -ForegroundColor Green
    } else {
        Write-Host "   ✅ Dependencias de $Name ya están actualizadas" -ForegroundColor Green
    }
}

function Setup-EnvFiles {
    # Configurar archivos .env si no existen
    if (-not (Test-Path "$BaseDir\backend\.env")) {
        if (Test-Path "$BaseDir\env-files\api.env.example") {
            Copy-Item "$BaseDir\env-files\api.env.example" "$BaseDir\backend\.env" -Force
            Write-Host "   ✅ backend/.env creado" -ForegroundColor Green
        }
    }
    
    if (-not (Test-Path "$BaseDir\frontend\.env.local")) {
        if (Test-Path "$BaseDir\env-files\app-client.env.example") {
            Copy-Item "$BaseDir\env-files\app-client.env.example" "$BaseDir\frontend\.env.local" -Force
            Write-Host "   ✅ frontend/.env.local creado" -ForegroundColor Green
        }
    }
    
    if (-not (Test-Path "$BaseDir\backoffice\.env.local")) {
        if (Test-Path "$BaseDir\env-files\app-admin.env.example") {
            Copy-Item "$BaseDir\env-files\app-admin.env.example" "$BaseDir\backoffice\.env.local" -Force
            Write-Host "   ✅ backoffice/.env.local creado" -ForegroundColor Green
        }
    }
}

function Wait-ForBackend {
    Write-Host "   Esperando a que el Backend esté listo..." -ForegroundColor Yellow
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
                Write-Host "   ✅ Backend listo" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # Ignorar errores, seguir esperando
        }
        Start-Sleep -Seconds 1
    }
    Write-Host "   ⚠️  Backend tardando en iniciar (continuando de todos modos...)" -ForegroundColor Yellow
    return $false
}

# =============================================================================
# MODO BUILD: Genera archivos estáticos para producción
# =============================================================================
if ($Mode -eq "build") {
    Write-Host "🏗️  Generando builds de producción..." -ForegroundColor Cyan
    Write-Host ""
    
    # Instalar dependencias
    Install-Dependencies -Path "$BaseDir\backend" -Name "Backend"
    Install-Dependencies -Path "$BaseDir\backoffice" -Name "Backoffice"
    Install-Dependencies -Path "$BaseDir\frontend" -Name "Frontend"
    
    # Build Backend
    Write-Host "▶️  Building Backend..." -ForegroundColor Green
    Push-Location "$BaseDir\backend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en build de Backend" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "   ✅ Backend build completado" -ForegroundColor Green
    
    # Build Frontend (Static Export)
    Write-Host "▶️  Building Frontend (Static Export)..." -ForegroundColor Green
    Push-Location "$BaseDir\frontend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en build de Frontend" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "   ✅ Frontend build completado -> ./frontend/out/" -ForegroundColor Green
    
    # Build Backoffice (Static Export)
    Write-Host "▶️  Building Backoffice (Static Export)..." -ForegroundColor Green
    Push-Location "$BaseDir\backoffice"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en build de Backoffice" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host "   ✅ Backoffice build completado -> ./backoffice/out/" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  ✅ Builds completados" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
    Write-Host "  Archivos generados:" -ForegroundColor Cyan
    Write-Host "  📁 Frontend:   ./frontend/out/"
    Write-Host "  📁 Backoffice: ./backoffice/out/"
    Write-Host "  📁 Backend:    ./backend/.next/"
    Write-Host ""
    Write-Host "  Para probar localmente:" -ForegroundColor Cyan
    Write-Host "  .\start-all.ps1 -Prod"
    Write-Host ""
    exit 0
}

# =============================================================================
# MODO PRODUCCIÓN: Sirve los builds estáticos localmente
# =============================================================================
if ($Mode -eq "prod") {
    # Verificar que existan los builds
    if (-not (Test-Path "$BaseDir\frontend\out")) {
        Write-Host "❌ No existe el build del Frontend. Ejecutá primero:" -ForegroundColor Red
        Write-Host "   .\start-all.ps1 -Build" -ForegroundColor Yellow
        exit 1
    }
    if (-not (Test-Path "$BaseDir\backoffice\out")) {
        Write-Host "❌ No existe el build del Backoffice. Ejecutá primero:" -ForegroundColor Red
        Write-Host "   .\start-all.ps1 -Build" -ForegroundColor Yellow
        exit 1
    }
    
    # Liberar puertos
    Stop-PortProcess -Port 3000
    Stop-PortProcess -Port 3001
    Stop-PortProcess -Port 3002
    
    # Crear archivos temporales para logs
    $backendLog = Join-Path $env:TEMP "backend.log"
    $frontendLog = Join-Path $env:TEMP "frontend.log"
    $backofficeLog = Join-Path $env:TEMP "backoffice.log"
    
    # Iniciar Backend
    Write-Host "▶️  Iniciando Backend (API) en puerto 3002..." -ForegroundColor Green
    $backendJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npm run start
    } -ArgumentList "$BaseDir\backend"
    
    # Esperar a que el backend esté listo
    Wait-ForBackend
    
    # Servir Frontend estático
    Write-Host "▶️  Sirviendo Frontend (estático) en puerto 3000..." -ForegroundColor Green
    $frontendJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npx serve -l 3000 -s
    } -ArgumentList "$BaseDir\frontend\out"
    
    # Servir Backoffice estático
    Write-Host "▶️  Sirviendo Backoffice (estático) en puerto 3001..." -ForegroundColor Green
    $backofficeJob = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        npx serve -l 3001 -s
    } -ArgumentList "$BaseDir\backoffice\out"
    
    Start-Sleep -Seconds 3
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  ✅ Modo Producción - Servicios corriendo" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
    Write-Host "  🌐 Frontend (Cliente):  http://localhost:3000" -ForegroundColor Green
    Write-Host "  🔧 Backoffice (Admin):  http://localhost:3001" -ForegroundColor Green
    Write-Host "  ⚡ Backend (API):       http://localhost:3002" -ForegroundColor Green
    Write-Host ""
    Write-Host "Presiona Ctrl+C para detener todos los servicios" -ForegroundColor Yellow
    Write-Host ""
    
    # Esperar hasta que el usuario cancele
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            # Verificar que los jobs sigan corriendo
            if ($backendJob.State -eq "Failed") {
                Write-Host "⚠️  Backend se detuvo inesperadamente" -ForegroundColor Red
                Receive-Job $backendJob
            }
        }
    }
    finally {
        Write-Host ""
        Write-Host "🛑 Deteniendo todos los servicios..." -ForegroundColor Yellow
        Stop-Job $backendJob, $frontendJob, $backofficeJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob, $frontendJob, $backofficeJob -Force -ErrorAction SilentlyContinue
        Stop-PortProcess -Port 3000
        Stop-PortProcess -Port 3001
        Stop-PortProcess -Port 3002
        Write-Host "✅ Todos los servicios detenidos" -ForegroundColor Green
    }
    exit 0
}

# =============================================================================
# MODO DESARROLLO (default): Hot reload para trabajar
# =============================================================================

# Verificar puertos y liberar si es necesario
Write-Host "🔍 Verificando puertos disponibles..." -ForegroundColor Blue
Stop-PortProcess -Port 3000
Stop-PortProcess -Port 3001
Stop-PortProcess -Port 3002
Write-Host "✅ Puertos disponibles" -ForegroundColor Green
Write-Host ""

# Configurar archivos .env
Write-Host "📝 Verificando archivos de configuración..." -ForegroundColor Blue
Setup-EnvFiles
Write-Host ""

# Instalar dependencias si es necesario
Write-Host "📦 Verificando dependencias..." -ForegroundColor Blue
Install-Dependencies -Path "$BaseDir\backend" -Name "Backend"
Install-Dependencies -Path "$BaseDir\backoffice" -Name "Backoffice"
Install-Dependencies -Path "$BaseDir\frontend" -Name "Frontend"
Write-Host "✅ Dependencias verificadas" -ForegroundColor Green
Write-Host ""

# Preparar base de datos
Write-Host "🗄️  Verificando base de datos..." -ForegroundColor Yellow
    Push-Location "$BaseDir\backend"

# Leer DATABASE_URL del .env
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue | Where-Object { $_ -match "^DATABASE_URL=" }
$isPostgreSQL = $false
if ($envContent) {
    $dbUrl = ($envContent -split "=")[1] -replace '"', ''
    if ($dbUrl -match "postgresql://") {
        $isPostgreSQL = $true
    }
}

if ($isPostgreSQL) {
    # PostgreSQL: ejecutar migraciones
    Write-Host "   Detectado PostgreSQL, ejecutando migraciones..." -ForegroundColor Cyan
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error generando cliente de Prisma" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    # Verificar si hay mismatch de provider en migration_lock.toml
    $migrationLockPath = "prisma\migrations\migration_lock.toml"
    $needsProviderSwitch = $false
    if (Test-Path $migrationLockPath) {
        $lockContent = Get-Content $migrationLockPath
        if ($lockContent -match 'provider = "sqlite"') {
            $needsProviderSwitch = $true
        }
    }
    
    if ($needsProviderSwitch) {
        Write-Host "   ⚠️  Detectado cambio de SQLite a PostgreSQL..." -ForegroundColor Yellow
        Write-Host "   Eliminando migraciones antiguas y creando nuevas para PostgreSQL..." -ForegroundColor Yellow
        
        # Respaldar migraciones antiguas (opcional, por si acaso)
        $migrationsBackup = "prisma\migrations_backup_sqlite"
        if (Test-Path "prisma\migrations") {
            if (-not (Test-Path $migrationsBackup)) {
                Copy-Item -Path "prisma\migrations" -Destination $migrationsBackup -Recurse -Force
                Write-Host "   📦 Migraciones SQLite respaldadas en: $migrationsBackup" -ForegroundColor Cyan
            }
            Remove-Item -Path "prisma\migrations" -Recurse -Force
        }
        
        # Crear nuevas migraciones para PostgreSQL
        Write-Host "   Creando migración inicial para PostgreSQL..." -ForegroundColor Cyan
        npx prisma migrate dev --name init_postgresql --create-only
        if ($LASTEXITCODE -eq 0) {
            npx prisma migrate deploy
        } else {
            # Si falla, intentar migrate dev normal (crea la migración y la aplica)
            Write-Host "   Intentando migrate dev (creará y aplicará migración)..." -ForegroundColor Cyan
            npx prisma migrate dev --name init_postgresql
        }
    } else {
        # Migraciones normales
        npx prisma migrate deploy
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Error en migraciones, intentando migrate dev..." -ForegroundColor Yellow
            npx prisma migrate dev
        }
    }
    
    # Ejecutar seed solo si es necesario (el seed verifica si hay datos existentes)
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.'db:seed') {
            # Solo ejecutar seed si fue una migración nueva (needsProviderSwitch)
            # El seed mismo verifica si hay datos y no los borra si existen
            if ($needsProviderSwitch) {
                Write-Host "   Ejecutando seed inicial..." -ForegroundColor Cyan
                npm run db:seed
            } else {
                Write-Host "   Verificando datos iniciales (seed solo si está vacío)..." -ForegroundColor Cyan
                npm run db:seed
            }
        }
    }
    Write-Host "✅ Base de datos PostgreSQL lista" -ForegroundColor Green
} else {
    # SQLite: verificar si existe la base de datos
    $dbPath = "$BaseDir\backend\prisma\dev.db"
    if (-not (Test-Path $dbPath)) {
        Write-Host "   Inicializando base de datos SQLite..." -ForegroundColor Cyan
    npx prisma generate
    npx prisma db push
    npm run db:seed
        Write-Host "✅ Base de datos SQLite inicializada" -ForegroundColor Green
    } else {
        Write-Host "✅ Base de datos SQLite ya existe" -ForegroundColor Green
    }
}

Pop-Location
    Write-Host ""

# Iniciar servicios
Write-Host "🚀 Iniciando servicios en modo desarrollo..." -ForegroundColor Blue
Write-Host ""

# Función para crear ventana de PowerShell
function Start-DevService {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Color
    )
    
    $script = @"
`$Host.UI.RawUI.WindowTitle = '$Name'
Set-Location '$Path'
Write-Host '🚀 Iniciando $Name...' -ForegroundColor $Color
Write-Host ''
npm run dev
Write-Host ''
Write-Host 'Servicio detenido. Presiona cualquier tecla para cerrar...' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
    
    $tempScript = Join-Path $env:TEMP "start-$Name.ps1"
    $script | Out-File -FilePath $tempScript -Encoding UTF8 -Force
    
    Start-Process powershell -ArgumentList "-NoExit", "-File", $tempScript
}

# Levantar Backend primero
Write-Host "▶️  Iniciando Backend (API) en puerto 3002..." -ForegroundColor Green
Start-DevService -Name "Backend-3002" -Path "$BaseDir\backend" -Color "Blue"
Start-Sleep -Seconds 5

# Esperar a que el backend esté listo
Wait-ForBackend

# Levantar Backoffice
Write-Host "▶️  Iniciando Backoffice (Admin) en puerto 3001..." -ForegroundColor Green
Start-DevService -Name "Backoffice-3001" -Path "$BaseDir\backoffice" -Color "Yellow"
Start-Sleep -Seconds 2

# Levantar Frontend
Write-Host "▶️  Iniciando Frontend (Cliente) en puerto 3000..." -ForegroundColor Green
Start-DevService -Name "Frontend-3000" -Path "$BaseDir\frontend" -Color "Green"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "  ✅ Modo Desarrollo - Servicios corriendo" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "  🌐 Frontend (Cliente):  http://localhost:3000" -ForegroundColor Green
Write-Host "  🔧 Backoffice (Admin):  http://localhost:3001" -ForegroundColor Green
Write-Host "  ⚡ Backend (API):       http://localhost:3002" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 TIP: Los cambios en el código se reflejan automáticamente (hot reload)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Se abrieron 3 ventanas de PowerShell, una para cada servicio." -ForegroundColor Yellow
Write-Host "   Para detener todos los servicios, cierra las 3 ventanas." -ForegroundColor Yellow
Write-Host ""
Write-Host "   También puedes ejecutar: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host ""

