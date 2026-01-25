# =============================================================================
# Script para detener todos los servicios en Windows
# Ejecutar: .\stop-all.ps1
# =============================================================================

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "  🛑 Deteniendo servicios de App Psicólogos" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Función para matar procesos en un puerto
function Stop-PortProcess {
    param(
        [int]$Port,
        [string]$Name
    )
    
    Write-Host "🔍 Buscando procesos en puerto $Port ($Name)..." -ForegroundColor Cyan
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                     Select-Object -ExpandProperty OwningProcess -Unique
        
        $found = $false
        foreach ($processId in $processes) {
            # Ignorar PID 0 (proceso del sistema)
            if ($processId -eq 0) {
                continue
            }
            
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "   ⏹️  Deteniendo $($process.ProcessName) (PID: $processId)..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                $found = $true
            }
        }
        
        if (-not $found) {
            Write-Host "   ✅ Puerto $Port libre (ningún proceso encontrado)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   ✅ Puerto $Port libre" -ForegroundColor Green
    }
}

# Detener procesos en los puertos
Stop-PortProcess -Port 3002 -Name "Backend"
Stop-PortProcess -Port 3001 -Name "Backoffice"
Stop-PortProcess -Port 3000 -Name "Frontend"

# También intentar cerrar las ventanas de PowerShell de los servicios
Write-Host ""
Write-Host "🔍 Buscando ventanas de PowerShell de servicios..." -ForegroundColor Cyan

$foundWindows = $false

# Método 1: Buscar por títulos de ventana
$serviceTitles = @("Backend-3002", "Backoffice-3001", "Frontend-3000", "Backend", "Frontend", "Backoffice")
foreach ($title in $serviceTitles) {
    $windows = Get-Process powershell -ErrorAction SilentlyContinue | 
               Where-Object { $_.MainWindowTitle -like "*$title*" -and $_.MainWindowTitle -ne "" }
    
    if ($windows) {
        foreach ($window in $windows) {
            Write-Host "   ⏹️  Cerrando ventana: $($window.MainWindowTitle) (PID: $($window.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $window.Id -Force -ErrorAction SilentlyContinue
            $foundWindows = $true
        }
    }
}

# Método 2: Buscar procesos de PowerShell que están ejecutando los scripts temporales
$tempScripts = @(
    "start-Backend-3002.ps1",
    "start-Backoffice-3001.ps1",
    "start-Frontend-3000.ps1"
)

# Obtener todos los procesos de PowerShell una sola vez
$powershellProcs = Get-Process powershell -ErrorAction SilentlyContinue

foreach ($scriptName in $tempScripts) {
    $scriptPath = Join-Path $env:TEMP $scriptName
    if (Test-Path $scriptPath) {
        # Buscar procesos de PowerShell que están ejecutando este script
        foreach ($psProc in $powershellProcs) {
            try {
                $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($psProc.Id)" -ErrorAction SilentlyContinue).CommandLine
                if ($cmdLine -and $cmdLine -like "*$scriptName*") {
                    Write-Host "   ⏹️  Cerrando PowerShell ejecutando $scriptName (PID: $($psProc.Id))..." -ForegroundColor Yellow
                    Stop-Process -Id $psProc.Id -Force -ErrorAction SilentlyContinue
                    $foundWindows = $true
                }
            }
            catch {
                # Ignorar errores al obtener la línea de comandos
            }
        }
    }
}

# También buscar procesos de Node.js que puedan estar corriendo en los puertos
Write-Host ""
Write-Host "🔍 Buscando procesos de Node.js restantes..." -ForegroundColor Cyan

$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($nodeProc in $nodeProcesses) {
        # Verificar si el proceso está usando alguno de nuestros puertos
        $connections = Get-NetTCPConnection -OwningProcess $nodeProc.Id -ErrorAction SilentlyContinue
        $ourPorts = $connections | Where-Object { $_.LocalPort -in @(3000, 3001, 3002) }
        
        if ($ourPorts) {
            Write-Host "   ⏹️  Deteniendo proceso Node.js (PID: $($nodeProc.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $nodeProc.Id -Force -ErrorAction SilentlyContinue
            $foundWindows = $true
        }
    }
}

if (-not $foundWindows) {
    Write-Host "   ✅ No se encontraron ventanas de servicios abiertas" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "  ✅ Todos los servicios detenidos" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

