# Configuración de Almacenamiento en la Nube

Este documento explica cómo configurar **Backblaze B2** y **Cloudinary** para el almacenamiento y optimización de imágenes de la aplicación.

## Arquitectura

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Usuario   │────▶│   Backend API   │────▶│  Backblaze B2   │
│  (upload)   │     │  (Next.js)      │     │  (storage)      │
└─────────────┘     └─────────────────┘     └────────┬────────┘
                                                     │
┌─────────────┐     ┌─────────────────┐              │
│   Usuario   │◀────│   Cloudinary    │◀─────────────┘
│  (view)     │     │  (CDN + resize) │   (fetch URL)
└─────────────┘     └─────────────────┘
```

1. Las imágenes se suben al backend
2. El backend las guarda en **Backblaze B2** (storage barato)
3. Cuando se muestran, **Cloudinary** las obtiene de B2 y las optimiza on-the-fly
4. El usuario recibe imágenes optimizadas (WebP/AVIF, resize automático)

---

## Parte 1: Configuración de Backblaze B2

### 1.1 Crear cuenta

1. Ir a https://www.backblaze.com/b2/cloud-storage.html
2. Click en **"Get Started Free"**
3. Completar el registro
4. **Plan gratuito incluye:** 10 GB storage + 1 GB/día de descarga

### 1.2 Crear un Bucket

1. En el dashboard, ir a **"Buckets"** → **"Create a Bucket"**
2. Configurar:

| Campo | Valor | Motivo |
|-------|-------|--------|
| **Bucket Unique Name** | `psicologos-app-media` | Nombre único global |
| **Files in Bucket are** | **Public** | Para que Cloudinary pueda acceder |
| **Default Encryption** | **Disable** | No necesario para imágenes públicas |
| **Object Lock** | **Disable** | Necesitamos poder actualizar/eliminar |

3. Click en **"Create a Bucket"**

### 1.3 Crear Application Key

1. Ir a **"App Keys"** en el menú lateral
2. Click en **"Add a New Application Key"**
3. Configurar:

| Campo | Valor |
|-------|-------|
| **Name of Key** | `psicologos-app-key` |
| **Allow access to Bucket(s)** | Seleccionar tu bucket |
| **Type of Access** | **Read and Write** |
| **File name prefix** | Dejar vacío |
| **Duration (seconds)** | Dejar vacío (sin expiración) |

4. Click en **"Create New Key"**
5. ⚠️ **IMPORTANTE:** Copiar inmediatamente:
   - `keyID` → Va en `B2_KEY_ID`
   - `applicationKey` → Va en `B2_APPLICATION_KEY` (solo se muestra una vez!)

### 1.4 Obtener el Endpoint

El endpoint depende de la región donde se creó tu bucket:

1. Ir a **"Buckets"** y ver los detalles de tu bucket
2. Buscar **"Endpoint"** - tendrá un formato como: `s3.us-west-004.backblazeb2.com`
3. La región es la parte del medio (ej: `us-west-004`)

**Endpoints por región:**
| Región | Endpoint |
|--------|----------|
| US West | `https://s3.us-west-004.backblazeb2.com` |
| US West (legacy) | `https://s3.us-west-000.backblazeb2.com` |
| EU Central | `https://s3.eu-central-003.backblazeb2.com` |

### 1.5 Variables de entorno para B2

```bash
# Backblaze B2 - Storage
B2_KEY_ID="tu_key_id_aqui"
B2_APPLICATION_KEY="tu_application_key_aqui"
B2_BUCKET_NAME="psicologos-app-media"
B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
B2_REGION="us-west-004"
```

---

## Parte 2: Configuración de Cloudinary

### 2.1 Crear cuenta

1. Ir a https://cloudinary.com
2. Click en **"Sign Up for Free"**
3. Completar el registro
4. **Plan gratuito incluye:** 25 créditos/mes (~25GB de ancho de banda)

### 2.2 Obtener credenciales

1. Una vez logueado, ir al **Dashboard**
2. En la sección **"Product Environment Credentials"** vas a ver:
   - **Cloud Name** → Va en `CLOUDINARY_CLOUD_NAME`
   - **API Key** → Va en `CLOUDINARY_API_KEY`
   - **API Secret** → Va en `CLOUDINARY_API_SECRET`

### 2.3 Variables de entorno para Cloudinary

```bash
# Cloudinary - Optimización de imágenes
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="tu_api_secret_aqui"
```

---

## Parte 3: Configuración en el Proyecto

### 3.1 Agregar variables de entorno

Editar el archivo `.env` en la carpeta `backend/`:

```bash
# ... otras variables existentes ...

# Backblaze B2 - Storage
B2_KEY_ID="tu_key_id"
B2_APPLICATION_KEY="tu_application_key"
B2_BUCKET_NAME="psicologos-app-media"
B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
B2_REGION="us-west-004"

# Cloudinary - Optimización de imágenes
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
```

### 3.2 Verificar configuración

Reiniciar el servidor y verificar en la consola:

```
✅ Backblaze B2 storage enabled
✅ Cloudinary image optimization enabled
```

O usar el endpoint de debug:

```bash
curl http://localhost:3002/api/debug/storage
```

Respuesta esperada:
```json
{
  "storage": {
    "provider": "backblaze_b2",
    "configured": {
      "B2_KEY_ID": true,
      "B2_APPLICATION_KEY": true,
      "B2_BUCKET_NAME": true,
      "B2_ENDPOINT": true
    }
  },
  "imageOptimization": {
    "provider": "cloudinary",
    "configured": {
      "CLOUDINARY_CLOUD_NAME": true,
      "CLOUDINARY_API_KEY": true,
      "CLOUDINARY_API_SECRET": true
    }
  },
  "summary": {
    "storageReady": true,
    "cloudStorageReady": true,
    "imageOptimizationReady": true
  }
}
```

---

## Parte 4: Modo Desarrollo (Sin configurar servicios)

Si no configurás las variables de entorno, la aplicación funciona en **modo local**:

- Las imágenes se guardan en `backend/uploads/`
- No hay optimización de Cloudinary (se sirven directamente)
- Perfecto para desarrollo y testing

```
ℹ️  Using local filesystem storage (B2 not configured)
ℹ️  Cloudinary not configured - using direct URLs
```

---

## Transformaciones de Imagen Disponibles

Cloudinary aplica estas transformaciones automáticamente:

| Tipo | Dimensiones | Uso |
|------|-------------|-----|
| `thumbnail` | 150x150 | Miniaturas en listas |
| `avatar` | 200x200 | Foto de perfil pequeña |
| `card` | 400x300 | Cards de profesionales |
| `profile` | 600x600 | Página de perfil |
| `hero` | 1200x600 | Banners grandes |
| `original` | Sin cambio | Solo optimización (WebP/AVIF) |

**Ejemplo de URL transformada:**
```
Original: https://f004.backblazeb2.com/file/bucket/image.jpg
Optimizada: https://res.cloudinary.com/cloud/image/fetch/w_200,h_200,c_fill,g_face,q_auto,f_auto/https%3A%2F%2Ff004...
```

---

## Costos Estimados

### Backblaze B2 (muy económico)
- **Storage:** $0.005/GB/mes
- **Descarga:** $0.01/GB (primeros 1GB/día gratis)
- **Clase A ops (upload):** $0.004/10,000
- **Clase B ops (download):** Gratis

**Ejemplo:** 10GB de fotos = ~$0.05/mes

### Cloudinary (plan gratuito generoso)
- **25 créditos/mes gratis**
- 1 crédito ≈ 1GB de bandwidth o 1000 transformaciones
- Para sitios pequeños/medianos, el plan gratuito alcanza

---

## Troubleshooting

### Error: "Access Denied" al subir a B2
- Verificar que la Application Key tenga permisos de **Read and Write**
- Verificar que el bucket name sea correcto

### Error: "Bucket not found"
- Verificar que `B2_BUCKET_NAME` coincida exactamente con el nombre del bucket

### Cloudinary no transforma imágenes
- Verificar que el bucket de B2 sea **público**
- Cloudinary necesita poder acceder a la URL de la imagen

### Las imágenes cargan lento
- Cloudinary cachea las imágenes después del primer request
- El primer request puede ser lento mientras Cloudinary obtiene la imagen de B2

---

## Seguridad

### Archivos de pacientes
Los archivos de pacientes (PDFs, documentos) se almacenan en una carpeta separada y NO son públicos. Se acceden únicamente a través de la API autenticada.

### Fotos de profesionales
Las fotos de profesionales son públicas (se muestran en el sitio web), por lo que es seguro que estén en un bucket público.

### Producción
En producción, considerar:
- Usar un bucket **privado** para archivos de pacientes
- Generar URLs pre-firmadas (presigned URLs) para acceso temporal
- Encriptar archivos sensibles antes de subir
