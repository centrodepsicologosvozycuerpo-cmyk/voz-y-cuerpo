# Sistema de Turnos - 3 Proyectos Independientes

Este repositorio contiene 3 proyectos completamente independientes:

- **Frontend**: Aplicación pública para pacientes (web institucional, landing, reserva de turnos)
- **Backoffice**: Panel de administración para profesionales
- **Backend**: API REST con Next.js, Prisma y base de datos

## Requisitos

- Node.js 18+ 
- npm o yarn
- Base de datos (PostgreSQL o SQLite)

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Windows - Recomendado)

**Para levantar TODO automáticamente:**
```powershell
.\start-all.ps1
```

Este script:
- ✅ Configura variables de entorno automáticamente
- ✅ Instala dependencias si faltan
- ✅ Configura la base de datos
- ✅ Levanta los 3 proyectos en ventanas separadas

**Para detener todos los servicios:**
```powershell
.\stop-all.ps1
```

**Solo configurar .env:**
```powershell
.\copiar-env.ps1
```

**Linux/Mac:**
```bash
chmod +x copiar-env.sh && ./copiar-env.sh
```

### Opción 2: Manual

#### 1. Backend (PRIMERO - puerto 3002)

```bash
cd backend
npm install
cp ../env-files/api.env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

✅ Debe estar corriendo en `http://localhost:3002`

#### 2. Frontend (puerto 3000)

En una **nueva terminal**:
```bash
cd frontend
npm install
cp ../env-files/app-client.env.example .env.local
npm run dev
```

✅ Debe estar corriendo en `http://localhost:3000`

#### 3. Backoffice (puerto 3001)

En una **nueva terminal**:
```bash
cd backoffice
npm install
cp ../env-files/app-admin.env.example .env.local
npm run dev
```

✅ Debe estar corriendo en `http://localhost:3001`

> **💡 Tip:** Necesitas 3 terminales abiertas, una para cada proyecto. El backend debe iniciarse primero.

## Variables de Entorno

Cada proyecto necesita su propio archivo `.env` o `.env.local`:

- **Backend**: Ver `env-files/api.env.example`
- **Frontend**: Ver `env-files/app-client.env.example`
- **Backoffice**: Ver `env-files/app-admin.env.example`

Importante: `NEXT_PUBLIC_API_URL` en frontend y backoffice debe apuntar a la URL del backend.

## Scripts Disponibles

### Backend
- `npm run dev` - Inicia servidor de desarrollo (puerto 3002)
- `npm run build` - Build para producción
- `npm run start` - Inicia servidor de producción
- `npm run db:migrate` - Ejecuta migraciones
- `npm run db:seed` - Pobla la base de datos
- `npm run db:studio` - Abre Prisma Studio

### Frontend
- `npm run dev` - Inicia servidor de desarrollo (puerto 3000)
- `npm run build` - Build para producción
- `npm run start` - Inicia servidor de producción

### Backoffice
- `npm run dev` - Inicia servidor de desarrollo (puerto 3001)
- `npm run build` - Build para producción
- `npm run start` - Inicia servidor de producción

## Arquitectura

- **Frontend** y **Backoffice** son aplicaciones Next.js independientes que hacen fetch a la API del **Backend**
- **Backend** expone una API REST en `/api/*` usando Next.js API Routes
- La comunicación entre proyectos es mediante HTTP (fetch)
- Cada proyecto tiene su propio `package.json` y puede ejecutarse independientemente

## Desarrollo

1. Iniciar el backend primero: `cd backend && npm run dev`
2. Luego iniciar frontend y/o backoffice según necesites
3. Los proyectos se comunican mediante la variable `NEXT_PUBLIC_API_URL`

## Notas

- No hay monorepo ni workspaces - cada proyecto es completamente independiente
- Cada proyecto tiene su propio `node_modules` y `package-lock.json`
- Los proyectos comparten el mismo repositorio Git pero son independientes a nivel de dependencias
