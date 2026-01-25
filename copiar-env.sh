#!/bin/bash

# Script para copiar archivos .env.example a cada proyecto

echo "📋 Copiando archivos .env.example..."

# Verificar que existe la carpeta env-files
if [ ! -d "env-files" ]; then
    echo "❌ Error: No se encuentra la carpeta env-files"
    exit 1
fi

# Nota: Este proyecto es un monorepo Next.js, no necesita carpetas separadas

# Copiar archivos
echo ""
echo "📦 Copiando archivos..."

# Copiar archivos .env a cada workspace
echo "📦 Copiando archivos .env a cada workspace..."

# Backend
if [ -f "env-files/api.env.example" ]; then
    if [ ! -f "backend/.env" ]; then
        cp "env-files/api.env.example" "backend/.env"
        echo "✅ backend/.env creado"
    fi
fi

# Frontend (opcional, si necesita .env.local)
if [ -f "env-files/app-client.env.example" ]; then
    if [ ! -f "frontend/.env.local" ]; then
        cp "env-files/app-client.env.example" "frontend/.env.local"
        echo "✅ frontend/.env.local creado"
    fi
fi

# Backoffice (opcional, si necesita .env.local)
if [ -f "env-files/app-admin.env.example" ]; then
    if [ ! -f "backoffice/.env.local" ]; then
        cp "env-files/app-admin.env.example" "backoffice/.env.local"
        echo "✅ backoffice/.env.local creado"
    fi
fi

echo ""
echo "✅ ¡Archivos .env copiados correctamente!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Revisar los archivos .env y ajustar si es necesario"
echo "   2. Ver README.md para iniciar cada proyecto por separado"
echo ""


