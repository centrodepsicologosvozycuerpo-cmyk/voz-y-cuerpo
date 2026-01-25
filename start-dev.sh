#!/bin/bash

# =============================================================================
# Script para levantar los 3 proyectos
# 
# MODOS DE USO:
#   ./start-dev.sh           → Desarrollo con hot reload
#   ./start-dev.sh --build   → Build de producción (genera archivos estáticos)
#   ./start-dev.sh --prod    → Sirve los builds de producción localmente
#
# URLS:
#   Backend (API):     http://localhost:3002
#   Backoffice:        http://localhost:3001
#   Frontend:          http://localhost:3000
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Modo (dev, build, prod)
MODE="${1:-dev}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🧠 App Psicólogos - $([ "$MODE" = "--build" ] && echo "Build de Producción" || ([ "$MODE" = "--prod" ] && echo "Modo Producción" || echo "Modo Desarrollo"))${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Función para verificar si un puerto está en uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Función para matar procesos en un puerto
kill_port() {
    if check_port $1; then
        echo -e "${YELLOW}⚠️  Puerto $1 en uso, liberando...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Función para instalar dependencias si no existen
install_deps() {
    local dir=$1
    local name=$2
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependencias de $name...${NC}"
        cd "$dir"
        npm install
        cd "$BASE_DIR"
    fi
}

# Función de limpieza al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Deteniendo todos los servicios...${NC}"
    
    # Matar procesos por puerto
    kill_port 3000
    kill_port 3001
    kill_port 3002
    
    # Matar procesos hijos
    jobs -p | xargs -r kill 2>/dev/null || true
    
    echo -e "${GREEN}✅ Todos los servicios detenidos${NC}"
    exit 0
}

# Capturar señales de interrupción
trap cleanup SIGINT SIGTERM

# =============================================================================
# MODO BUILD: Genera archivos estáticos para producción
# =============================================================================
if [ "$MODE" = "--build" ]; then
    echo -e "${CYAN}🏗️  Generando builds de producción...${NC}"
    echo ""
    
    # Instalar dependencias
    install_deps "$BASE_DIR/backend" "Backend"
    install_deps "$BASE_DIR/backoffice" "Backoffice"
    install_deps "$BASE_DIR/frontend" "Frontend"
    
    # Build Backend
    echo -e "${GREEN}▶️  Building Backend...${NC}"
    cd "$BASE_DIR/backend"
    npm run build
    echo -e "${GREEN}   ✅ Backend build completado${NC}"
    
    # Build Frontend (Static Export)
    echo -e "${GREEN}▶️  Building Frontend (Static Export)...${NC}"
    cd "$BASE_DIR/frontend"
    npm run build
    echo -e "${GREEN}   ✅ Frontend build completado → ./frontend/out/${NC}"
    
    # Build Backoffice (Static Export)
    echo -e "${GREEN}▶️  Building Backoffice (Static Export)...${NC}"
    cd "$BASE_DIR/backoffice"
    npm run build
    echo -e "${GREEN}   ✅ Backoffice build completado → ./backoffice/out/${NC}"
    
    cd "$BASE_DIR"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ Builds completados${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${CYAN}Archivos generados:${NC}"
    echo -e "  📁 Frontend:   ./frontend/out/"
    echo -e "  📁 Backoffice: ./backoffice/out/"
    echo -e "  📁 Backend:    ./backend/.next/"
    echo ""
    echo -e "  ${CYAN}Para probar localmente:${NC}"
    echo -e "  ./start-dev.sh --prod"
    echo ""
    exit 0
fi

# =============================================================================
# MODO PRODUCCIÓN: Sirve los builds estáticos localmente
# =============================================================================
if [ "$MODE" = "--prod" ]; then
    # Verificar que existan los builds
    if [ ! -d "$BASE_DIR/frontend/out" ]; then
        echo -e "${RED}❌ No existe el build del Frontend. Ejecutá primero:${NC}"
        echo -e "   ./start-dev.sh --build"
        exit 1
    fi
    if [ ! -d "$BASE_DIR/backoffice/out" ]; then
        echo -e "${RED}❌ No existe el build del Backoffice. Ejecutá primero:${NC}"
        echo -e "   ./start-dev.sh --build"
        exit 1
    fi
    
    # Verificar que npx serve esté disponible
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx no está disponible. Instalá Node.js${NC}"
        exit 1
    fi
    
    # Liberar puertos
    kill_port 3000
    kill_port 3001
    kill_port 3002
    
    # Iniciar Backend
    echo -e "${GREEN}▶️  Iniciando Backend (API) en puerto 3002...${NC}"
    cd "$BASE_DIR/backend"
    npm run start > /tmp/backend.log 2>&1 &
    cd "$BASE_DIR"
    
    # Esperar a que el backend esté listo
    echo -e "${YELLOW}   Esperando a que el Backend esté listo...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3002 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Backend listo${NC}"
            break
        fi
        sleep 1
    done
    
    # Servir Frontend estático
    echo -e "${GREEN}▶️  Sirviendo Frontend (estático) en puerto 3000...${NC}"
    cd "$BASE_DIR/frontend/out"
    npx serve -l 3000 -s > /tmp/frontend.log 2>&1 &
    cd "$BASE_DIR"
    
    # Servir Backoffice estático
    echo -e "${GREEN}▶️  Sirviendo Backoffice (estático) en puerto 3001...${NC}"
    cd "$BASE_DIR/backoffice/out"
    npx serve -l 3001 -s > /tmp/backoffice.log 2>&1 &
    cd "$BASE_DIR"
    
    sleep 3
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ Modo Producción - Servicios corriendo${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${GREEN}🌐 Frontend (Cliente):${NC}  http://localhost:3000"
    echo -e "  ${GREEN}🔧 Backoffice (Admin):${NC}  http://localhost:3001"
    echo -e "  ${GREEN}⚡ Backend (API):${NC}       http://localhost:3002"
    echo ""
    echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
    echo ""
    
    tail -f /tmp/backend.log /tmp/backoffice.log /tmp/frontend.log 2>/dev/null || wait
    exit 0
fi

# =============================================================================
# MODO DESARROLLO (default): Hot reload para trabajar
# =============================================================================

# Verificar puertos y liberar si es necesario
echo -e "${BLUE}🔍 Verificando puertos disponibles...${NC}"
kill_port 3000
kill_port 3001
kill_port 3002
echo -e "${GREEN}✅ Puertos disponibles${NC}"
echo ""

# Instalar dependencias si es necesario
echo -e "${BLUE}📦 Verificando dependencias...${NC}"
install_deps "$BASE_DIR/backend" "Backend"
install_deps "$BASE_DIR/backoffice" "Backoffice"
install_deps "$BASE_DIR/frontend" "Frontend"
echo -e "${GREEN}✅ Dependencias verificadas${NC}"
echo ""

# Preparar base de datos si no existe
if [ ! -f "$BASE_DIR/backend/prisma/dev.db" ]; then
    echo -e "${YELLOW}🗄️  Inicializando base de datos...${NC}"
    cd "$BASE_DIR/backend"
    npx prisma generate
    npx prisma db push
    npm run db:seed
    cd "$BASE_DIR"
    echo -e "${GREEN}✅ Base de datos inicializada${NC}"
    echo ""
fi

# Iniciar servicios
echo -e "${BLUE}🚀 Iniciando servicios en modo desarrollo...${NC}"
echo ""

# Iniciar Backend (API) en puerto 3002
echo -e "${GREEN}▶️  Iniciando Backend (API) en puerto 3002...${NC}"
cd "$BASE_DIR/backend"
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd "$BASE_DIR"

# Esperar a que el backend esté listo
echo -e "${YELLOW}   Esperando a que el Backend esté listo...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3002 > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Backend listo${NC}"
        break
    fi
    sleep 1
done

# Iniciar Backoffice en puerto 3001
echo -e "${GREEN}▶️  Iniciando Backoffice (Admin) en puerto 3001...${NC}"
cd "$BASE_DIR/backoffice"
npm run dev > /tmp/backoffice.log 2>&1 &
BACKOFFICE_PID=$!
cd "$BASE_DIR"

# Iniciar Frontend en puerto 3000
echo -e "${GREEN}▶️  Iniciando Frontend (Cliente) en puerto 3000...${NC}"
cd "$BASE_DIR/frontend"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd "$BASE_DIR"

# Esperar unos segundos para que inicien
sleep 5

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Modo Desarrollo - Servicios corriendo${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}🌐 Frontend (Cliente):${NC}  http://localhost:3000"
echo -e "  ${GREEN}🔧 Backoffice (Admin):${NC}  http://localhost:3001"
echo -e "  ${GREEN}⚡ Backend (API):${NC}       http://localhost:3002"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Logs disponibles en:${NC}"
echo -e "   - Backend:    /tmp/backend.log"
echo -e "   - Backoffice: /tmp/backoffice.log"
echo -e "   - Frontend:   /tmp/frontend.log"
echo ""
echo -e "${CYAN}💡 TIP: Los cambios en el código se reflejan automáticamente (hot reload)${NC}"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Mantener el script corriendo y mostrar logs combinados
tail -f /tmp/backend.log /tmp/backoffice.log /tmp/frontend.log 2>/dev/null || wait
