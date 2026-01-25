# Contrato de API REST

## Base URL

**Producción**: `https://api.midominio.com` (si es pública) o URL interna de Render (si es privada)
**Desarrollo**: `http://localhost:3001`

## Autenticación

### Método: Cookies HttpOnly + JWT

1. **Login**: `POST /api/auth/login`
   - Recibe: `{ email, password }`
   - Responde: Cookie `session` (HttpOnly, Secure, SameSite=Strict)
   - Retorna: `{ user: { id, email, role, professionalId } }`

2. **Logout**: `POST /api/auth/logout`
   - Elimina cookie de sesión

3. **Me**: `GET /api/auth/me`
   - Retorna usuario actual desde cookie

### Roles

- `ADMIN`: Acceso completo
- `PROFESSIONAL`: Acceso a sus propios datos
- `PUBLIC`: Sin autenticación (solo lectura pública)

## Endpoints Públicos (Sin Autenticación)

### GET /api/professionals
Lista profesionales activos.

**Response:**
```json
{
  "professionals": [
    {
      "id": "string",
      "slug": "string",
      "fullName": "string",
      "title": "string",
      "modalities": ["online", "presencial"],
      "specialties": ["ansiedad", "depresión"],
      "languages": ["español"],
      "approach": "string"
    }
  ]
}
```

### GET /api/availability
Obtiene slots disponibles.

**Query Params:**
- `professionalSlug` (required): Slug del profesional
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `modality` (optional): "online" | "presencial"

**Response:**
```json
{
  "professional": {
    "id": "string",
    "fullName": "string"
  },
  "slots": [
    {
      "startAt": "2024-01-15T10:00:00Z",
      "endAt": "2024-01-15T10:50:00Z",
      "modality": "online",
      "locationLabel": "string"
    }
  ]
}
```

### POST /api/appointments
Crea un turno.

**Body:**
```json
{
  "professionalId": "string",
  "startAt": "2024-01-15T10:00:00Z",
  "modality": "online",
  "clientName": "string",
  "clientEmail": "string",
  "clientPhone": "string",
  "acceptPolicies": true
}
```

**Response:**
```json
{
  "appointment": {
    "id": "string",
    "confirmationToken": "string",
    "cancelToken": "string"
  }
}
```

### POST /api/appointments/cancel
Cancela un turno.

**Body:**
```json
{
  "cancelToken": "string"
}
```

## Endpoints Protegidos (Requieren Autenticación)

### Pacientes

#### GET /api/patients
Lista pacientes del profesional autenticado.

**Query Params:**
- `search` (optional): Búsqueda por nombre/apellido/localidad
- `hasInsurance` (optional): "true" | "false"
- `isFrequent` (optional): "true" | "false"

**Roles**: `PROFESSIONAL`, `ADMIN`

**Response:**
```json
{
  "patients": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "fullName": "string",
      "age": 30,
      "city": "string",
      "province": "string",
      "hasInsurance": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "lastVisitAt": "2024-01-15T10:00:00Z",
      "isFrequent": false
    }
  ]
}
```

#### POST /api/patients
Crea un paciente.

**Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "birthDate": "1990-01-15T00:00:00Z",
  "address": "string",
  "city": "string",
  "province": "string",
  "emergencyName": "string",
  "emergencyRole": "string",
  "emergencyPhone": "string",
  "hasInsurance": false,
  "insuranceName": "string",
  "insuranceCardNumber": "string"
}
```

**Roles**: `PROFESSIONAL`, `ADMIN`

#### GET /api/patients/:id
Obtiene detalles de un paciente.

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

**Response:**
```json
{
  "patient": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "birthDate": "1990-01-15T00:00:00Z",
    "age": 30,
    "address": "string",
    "city": "string",
    "province": "string",
    "emergencyName": "string",
    "emergencyRole": "string",
    "emergencyPhone": "string",
    "hasInsurance": true,
    "insuranceName": "string",
    "insuranceCardNumber": "string",
    "createdAt": "2024-01-15T10:00:00Z",
    "lastVisitAt": "2024-01-15T10:00:00Z",
    "files": [...],
    "notes": [...],
    "slotHolds": [...]
  }
}
```

#### PUT /api/patients/:id
Actualiza un paciente.

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

#### DELETE /api/patients/:id
Elimina un paciente.

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

### Archivos de Pacientes

#### POST /api/patients/:id/files
Sube un archivo adjunto.

**Content-Type**: `multipart/form-data`
**Body**: `file` (File)

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

**Response:**
```json
{
  "file": {
    "id": "string",
    "originalName": "string",
    "mimeType": "string",
    "size": 1024,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /api/patients/:id/files/:fileId
Descarga un archivo.

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

**Response**: Binary file stream

#### DELETE /api/patients/:id/files/:fileId
Elimina un archivo.

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

### Notas de Pacientes

#### POST /api/patients/:id/notes
Crea una nota.

**Body:**
```json
{
  "content": "string"
}
```

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

#### PUT /api/patients/:id/notes/:noteId
Actualiza una nota.

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

#### DELETE /api/patients/:id/notes/:noteId
Elimina una nota.

**Roles**: `PROFESSIONAL` (solo sus pacientes), `ADMIN` (todos)

### Reservas de Slots (SlotHolds)

#### GET /api/holds
Lista reservas del profesional.

**Query Params:**
- `from` (optional): ISO date string
- `to` (optional): ISO date string
- `professionalId` (optional): Solo para ADMIN

**Roles**: `PROFESSIONAL`, `ADMIN`

#### POST /api/holds
Crea reservas de slots.

**Body:**
```json
{
  "patientId": "string",
  "startAt": "2024-01-15T10:00:00Z",
  "endAt": "2024-01-15T10:50:00Z",
  "recurrence": "single" | "weekly",
  "weeks": 8
}
```

**Roles**: `PROFESSIONAL`, `ADMIN`

#### DELETE /api/holds/:id
Elimina una reserva.

**Roles**: `PROFESSIONAL` (solo sus reservas), `ADMIN` (todas)

#### POST /api/holds/:id/convert-to-appointment
Convierte reserva en turno confirmado.

**Roles**: `PROFESSIONAL` (solo sus reservas), `ADMIN` (todas)

### Turnos del Panel

#### GET /api/panel/appointments
Lista turnos del profesional.

**Roles**: `PROFESSIONAL`, `ADMIN`

#### POST /api/panel/appointments/cancel
Cancela un turno (desde el panel).

**Body:**
```json
{
  "appointmentId": "string"
}
```

**Roles**: `PROFESSIONAL`, `ADMIN`

### Disponibilidad del Panel

#### GET /api/panel/availability
Obtiene disponibilidad configurada del profesional.

**Roles**: `PROFESSIONAL`, `ADMIN`

#### POST /api/panel/availability
Actualiza disponibilidad semanal.

**Roles**: `PROFESSIONAL`, `ADMIN`

## Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: Sin permisos
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej: slot ocupado)
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Error del servidor

## Manejo de Errores

**Formato estándar:**
```json
{
  "error": "Mensaje de error legible",
  "code": "ERROR_CODE",
  "details": {} // Solo en desarrollo
}
```

## Rate Limiting

- **Públicos**: 100 requests/minuto por IP
- **Autenticados**: 200 requests/minuto por usuario
- **Login**: 5 intentos/minuto por IP

## CORS

Solo permitido para:
- `https://app.midominio.com` (app-client)
- `https://admin.midominio.com` (app-admin)

Métodos permitidos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
Headers permitidos: `Content-Type`, `Authorization`


