# Plataforma de Gestión para Equipo de Psicología
## Documento de Funcionalidades y Características

---

# 1. SITIO WEB PÚBLICO (FRONTEND)

## A) Resumen Ejecutivo

El sitio web público es una plataforma profesional diseñada para un equipo de psicólogos que permite a los visitantes:
- Conocer los servicios y modalidades de atención ofrecidas (terapia individual, de pareja, familiar y online)
- Explorar el perfil de cada profesional del equipo, con sus especialidades y enfoques terapéuticos
- Reservar turnos de manera autónoma, seleccionando profesional, fecha, horario y modalidad
- Cancelar o gestionar sus turnos de forma online
- Acceder a información de contacto directo con los profesionales vía email o WhatsApp

El sitio está optimizado para verse correctamente en cualquier dispositivo (computadora, tablet o celular) y cuenta con un diseño moderno y profesional que transmite confianza y calidez.

---

## B) Secciones y Páginas del Sitio

### 1. INICIO (Página Principal)

**Objetivo:** Presentar el equipo y sus valores, captar la atención del visitante y guiarlo hacia la reserva de turnos.

**Elementos que incluye:**
- **Carrusel de videos:** Banner principal con 5 videos profesionales en rotación automática, que comunican el enfoque humano y profesional del equipo
- **Mensaje principal:** Título destacado "Tu bienestar emocional es nuestra prioridad" con descripción del equipo
- **Botones de acción:** "Reservar Turno" y "Conocer al Equipo"
- **Tarjetas de valores:** 4 cards con los pilares del servicio:
  - Atención Personalizada
  - Equipo Multidisciplinario
  - Flexibilidad de Horarios
  - Confidencialidad
- **Vista previa de servicios:** Presentación de Terapia Individual, de Pareja y Familiar con enlaces a más información
- **Llamado a acción:** Sección destacada invitando a reservar turno online

**Acciones del usuario:** Navegar a otras secciones, iniciar reserva de turno, conocer al equipo.

**Contenido:** Los textos actuales están incorporados en el sitio. *Pueden migrarse a administración desde el panel si se requiere editarlos frecuentemente.*

---

### 2. NUESTRO EQUIPO

**Objetivo:** Presentar a cada profesional del equipo con su información relevante para que el paciente pueda elegir con quién atenderse.

**Elementos que incluye:**
- Título y descripción introductoria
- Listado de profesionales en formato de tarjetas (cards), mostrando:
  - Foto del profesional
  - Nombre completo y título profesional
  - Especialidades (etiquetas)
  - Modalidades de atención (online/presencial)
  - Breve descripción del enfoque
  - Botón "Ver Perfil Completo"

**Acciones del usuario:** Ver lista de profesionales, acceder al perfil detallado de cada uno.

**Contenido:** ✅ Administrable desde el Panel (backoffice). Los profesionales se cargan y actualizan desde el panel de administración.

---

### 3. PERFIL DEL PROFESIONAL

**Objetivo:** Mostrar información detallada de un profesional específico para que el paciente conozca su experiencia y especialización.

**Elementos que incluye:**
- Foto del profesional (tamaño grande)
- Nombre completo y título
- Sección "Sobre mi trabajo" (descripción extendida)
- Especialidades (listado con etiquetas)
- Modalidades de atención
- Idiomas que maneja
- Enfoque terapéutico
- Botón destacado "Reservar Turno con [Nombre]"
- Enlace para volver al listado del equipo

**Acciones del usuario:** Leer información del profesional, iniciar reserva directamente con ese profesional.

**Contenido:** ✅ Administrable desde el Panel.

---

### 4. SERVICIOS

**Objetivo:** Describir las modalidades de terapia disponibles para que el visitante entienda cuál se adapta mejor a sus necesidades.

**Elementos que incluye:**
- Título y descripción general
- 4 tarjetas de servicios:
  - **Terapia Individual:** Sesiones personalizadas para ansiedad, depresión, autoestima, duelo y desarrollo personal
  - **Terapia de Pareja:** Trabajo en comunicación, resolución de conflictos, intimidad, infidelidad y separación
  - **Terapia Familiar:** Enfoque sistémico para conflictos, comunicación y transiciones familiares
  - **Terapia Online:** Sesiones virtuales con la misma calidad que presencial, desde cualquier lugar
- Sección de consulta: "¿Tenés dudas sobre qué servicio es para vos?"
- Botones de Contactar y Reservar Turno

**Acciones del usuario:** Informarse sobre cada tipo de terapia, ir a contacto o reservar.

**Contenido:** Los textos están incorporados en el sitio. *Pueden migrarse a administración desde el panel.*

---

### 5. PREGUNTAS FRECUENTES (FAQ)

**Objetivo:** Resolver las dudas más comunes de los potenciales pacientes para facilitar la decisión de reservar.

**Elementos que incluye:**
- Título y descripción
- 8 preguntas frecuentes con respuestas desplegables:
  - ¿Cómo funciona el sistema de turnos online?
  - ¿Cuánto duran las sesiones?
  - ¿Puedo cancelar o modificar mi turno?
  - ¿Qué modalidades de terapia ofrecen?
  - ¿Cómo sé qué profesional es el adecuado para mí?
  - ¿Los turnos tienen costo?
  - ¿Qué pasa si llego tarde a mi sesión?
  - ¿Mantienen confidencialidad?
- Sección de ayuda adicional con botones de Contactar y Reservar

**Acciones del usuario:** Leer respuestas, contactar o reservar.

**Contenido:** Los textos están incorporados. *Pueden migrarse a administración desde el panel.*

---

### 6. CONTACTO

**Objetivo:** Facilitar la comunicación directa entre el visitante y los profesionales del equipo.

**Elementos que incluye:**
- Título y descripción
- **Tarjetas de contacto por profesional** (dinámicas):
  - Foto
  - Nombre y título
  - Email con enlace directo (abre el cliente de correo)
  - Teléfono con botón "Enviar WhatsApp"
- **Información de ubicaciones:**
  - CABA
  - Zona Norte
  - GBA
  - Nota: "Las direcciones exactas se coordinan al momento de reservar"
- **Horarios de atención:**
  - Lunes a Viernes: 9:00 - 20:00
  - Sábados: Consultar disponibilidad
  - Domingos: Cerrado

**Acciones del usuario:** Enviar email, abrir chat de WhatsApp con mensaje pre-armado.

**Contenido:** ✅ Los datos de contacto de profesionales se administran desde el Panel.

---

### 7. POLÍTICAS DE PRIVACIDAD

**Objetivo:** Informar al usuario sobre el tratamiento de sus datos personales, cumpliendo normativas de protección de datos.

**Elementos que incluye:**
- 8 secciones de políticas:
  1. Información que recopilamos
  2. Uso de la información
  3. Confidencialidad
  4. Seguridad de los datos
  5. Tus derechos (acceso, rectificación, eliminación)
  6. Cookies y tecnologías similares
  7. Cambios en esta política
  8. Contacto
- Fecha de última actualización

**Contenido:** Texto estándar incorporado. *Puede editarse si se requiere.*

---

### 8. RESERVAR TURNO (Sistema de Turnos Online)

El sistema de reserva de turnos consta de varias pantallas que guían al usuario paso a paso:

#### 8.1 Selección de Profesional

**Objetivo:** Permitir al usuario elegir con qué profesional quiere agendar su sesión.

**Elementos que incluye:**
- Explicación del proceso en 5 pasos simples
- Tarjetas de profesionales disponibles con:
  - Foto
  - Nombre y título
  - Especialidades principales
  - Modalidades (online/presencial)
  - Botón "Ver Disponibilidad"

#### 8.2 Calendario y Horarios Disponibles

**Objetivo:** Mostrar la disponibilidad real del profesional para que el usuario elija fecha y hora.

**Elementos que incluye:**
- Información del profesional seleccionado
- **Filtro de modalidad:** Botones para filtrar entre "Todas", "Online" o "Presencial"
- **Calendario interactivo de 21 días:**
  - Vista semanal con días numerados
  - Indicador de cantidad de turnos disponibles por día
  - Días sin disponibilidad deshabilitados
  - Día actual destacado
- **Horarios disponibles:** Al seleccionar un día, se muestran los horarios con:
  - Hora de inicio y fin
  - Modalidad (etiqueta)
  - Ubicación (si aplica)
- Botón "Actualizar" para refrescar disponibilidad en tiempo real

**Acciones del usuario:** Filtrar por modalidad, seleccionar día, elegir horario.

**Contenido:** ✅ La disponibilidad se administra desde el Panel por cada profesional.

#### 8.3 Datos de Contacto (Confirmación)

**Objetivo:** Recopilar los datos del paciente para confirmar la reserva.

**Elementos que incluye:**
- Formulario con campos:
  - Nombre completo (obligatorio)
  - Email (obligatorio)
  - Teléfono (obligatorio)
  - Aceptación de políticas de privacidad (obligatorio)
- Botón "Confirmar Reserva"

**Acciones del usuario:** Completar datos, aceptar políticas, confirmar.

#### 8.4 Turno Confirmado (Éxito)

**Objetivo:** Confirmar la reserva exitosa y ofrecer acciones adicionales.

**Elementos que incluye:**
- Ícono de confirmación (check verde)
- Mensaje "¡Turno Confirmado!"
- **Detalles del turno:**
  - Profesional
  - Fecha y hora completa
  - Modalidad
  - Ubicación (si aplica)
- **Botones de acción:**
  - "Agregar al Calendario" (descarga archivo .ics)
  - "Enviar por WhatsApp" (comparte detalles)
  - "Cancelar Turno" (inicia proceso de cancelación)
- Nota importante sobre modificaciones y política de cancelación (12 horas antes)
- Botón "Volver al Inicio"

#### 8.5 Cancelar Turno

**Objetivo:** Permitir al usuario cancelar su turno de forma autónoma.

**Elementos que incluye:**
- Detalles del turno a cancelar
- Validación de tiempo (permite cancelar si faltan más de 12 horas)
- Mensaje de advertencia si ya no se puede cancelar automáticamente
- Formulario de confirmación de cancelación
- Botón "Volver al Inicio"

---

## C) Componentes Destacados

### 1. CARRUSEL DE VIDEOS (Hero Banner)

**Descripción:** Banner principal con 5 videos profesionales que rotan automáticamente cada 8 segundos con transiciones suaves de desvanecimiento.

**Funcionalidades:**
- Reproducción automática en bucle
- Indicadores de navegación (puntos) para cambiar manualmente
- Overlay oscuro para mejor legibilidad del texto superpuesto
- Contenido fijo centrado (título, descripción y botones)
- Adaptable a diferentes tamaños de pantalla

**Valor:** Transmite profesionalismo y cercanía, captando la atención del visitante desde el primer momento.

**Contenido:** Los 5 videos están incorporados. *Se pueden cambiar subiendo nuevos archivos.*

---

### 2. TARJETAS DE PROFESIONALES

**Descripción:** Componente visual que presenta la información de cada profesional de forma clara y atractiva.

**Funcionalidades:**
- Foto del profesional
- Datos principales y especialidades
- Etiquetas visuales de modalidades
- Animación sutil al pasar el cursor
- Botones de acción contextuales

**Valor:** Permite al usuario identificar rápidamente al profesional más adecuado para sus necesidades.

---

### 3. CALENDARIO INTERACTIVO DE TURNOS

**Descripción:** Sistema de selección de fecha y hora con visualización clara de disponibilidad.

**Funcionalidades:**
- Vista de 21 días futuros
- Conteo de turnos disponibles por día
- Filtros por modalidad
- Actualización en tiempo real
- Horarios ordenados cronológicamente
- Información de ubicación para turnos presenciales

**Valor:** Facilita la reserva autónoma sin necesidad de contactar al profesional, mostrando solo horarios realmente disponibles.

---

### 4. BOTONES DE WHATSAPP

**Descripción:** Enlaces directos para iniciar conversaciones de WhatsApp con mensaje pre-cargado.

**Ubicaciones:**
- Página de Contacto (por cada profesional)
- Confirmación de turno
- Recordatorios

**Valor:** Reduce la fricción de contacto, permitiendo comunicación instantánea con un solo clic.

---

### 5. FORMULARIO DE RESERVA

**Descripción:** Formulario simple y seguro para completar la reserva de turnos.

**Funcionalidades:**
- Validación de campos en tiempo real
- Campos obligatorios claramente marcados
- Enlace a políticas de privacidad
- Feedback visual durante el envío
- Mensajes de error claros

**Valor:** Proceso de reserva rápido y sin complicaciones.

---

### 6. DESCARGA DE ARCHIVO DE CALENDARIO (.ICS)

**Descripción:** Generación automática de archivo para agregar el turno al calendario del usuario.

**Funcionalidades:**
- Compatible con Google Calendar, Outlook, Apple Calendar, etc.
- Incluye todos los detalles del turno
- Descarga automática con un clic

**Valor:** Ayuda al paciente a no olvidar su turno al agregarlo directamente a su agenda.

---

## D) Experiencia de Usuario

### Diseño Responsivo
- ✅ El sitio se adapta automáticamente a cualquier dispositivo
- ✅ Navegación optimizada para móviles
- ✅ Botones y elementos táctiles de tamaño adecuado
- ✅ Imágenes y videos optimizados para carga rápida

### Velocidad y Rendimiento
- ✅ Carga optimizada de videos (precarga de metadatos)
- ✅ Imágenes optimizadas automáticamente
- ✅ Transiciones y animaciones suaves
- ✅ Actualización de disponibilidad en tiempo real

### Accesibilidad
- ✅ Estructura semántica de contenido
- ✅ Textos alternativos en imágenes
- ✅ Contraste adecuado de colores
- ✅ Navegación por teclado disponible
- ✅ Etiquetas ARIA en elementos interactivos

### SEO (Posicionamiento en Buscadores)
- ✅ Títulos descriptivos por página
- ✅ Meta descripción optimizada
- ✅ URLs amigables y descriptivas
- ✅ Estructura de encabezados correcta
- ✅ Contenido en español

---

# 2. PANEL DE ADMINISTRACIÓN (BACKOFFICE)

## A) Resumen Ejecutivo

El Panel de Administración es una herramienta interna que permite a los profesionales del equipo gestionar de forma autónoma:
- Su disponibilidad horaria semanal y excepciones
- Los turnos reservados por pacientes
- La información de sus pacientes (fichas, notas, archivos)
- Los perfiles de profesionales del equipo
- Solicitudes de alta/baja de nuevos profesionales

El acceso es individual por profesional mediante usuario y contraseña, garantizando que cada uno vea y gestione únicamente su propia información.

---

## B) Módulos del Panel

### 1. MI CALENDARIO (Disponibilidad Semanal)

**Objetivo:** Configurar los horarios regulares de atención para cada día de la semana.

**Funcionalidades:**
- **Vista por día de la semana:** Domingo a Sábado
- **Agregar rangos horarios:** Definir múltiples franjas por día
- **Configurar por rango:**
  - Hora de inicio y fin
  - Duración de cada turno (en minutos)
  - Tiempo de descanso entre turnos (buffer)
- **Editar rangos existentes:** Modificar horarios en tiempo real
- **Eliminar rangos:** Quitar horarios que ya no apliquen

**Uso típico:** "Los lunes atiendo de 9:00 a 13:00 y de 15:00 a 19:00, con turnos de 50 minutos y 10 minutos de descanso."

**Resultado en el sitio:** Los horarios configurados aquí determinan qué turnos ve el paciente como disponibles en el calendario público.

---

### 2. DÍAS ESPECIALES (Excepciones)

**Objetivo:** Gestionar días específicos con horarios diferentes o bloquear días completos.

**Funcionalidades:**
- **Agregar día especial:**
  - Seleccionar fecha del calendario
  - Marcar como "No disponible" (día bloqueado completo)
  - O definir horarios personalizados para esa fecha
- **Copiar horarios semanales:** Opción de copiar la configuración del día de la semana correspondiente
- **Configurar rangos específicos:**
  - Hora de inicio y fin
  - Modalidad (online/presencial)
  - Ubicación (para presencial)
  - Duración del turno y buffer
- **Editar días configurados:** Modificar excepciones ya creadas
- **Eliminar excepciones:** Volver al horario semanal normal

**Uso típico:** "El viernes 15 no atiendo porque tengo un congreso" o "El sábado 20 atiendo excepcionalmente de 10:00 a 14:00."

**Resultado en el sitio:** Los días bloqueados no muestran disponibilidad; los días con horario especial muestran esos turnos específicos.

---

### 3. MIS TURNOS

**Objetivo:** Visualizar y gestionar los turnos reservados por pacientes.

**Funcionalidades:**
- **Turnos Próximos:** Lista de turnos agendados a futuro mostrando:
  - Nombre del paciente
  - Email y teléfono
  - Fecha y hora
  - Modalidad (online/presencial)
  - Botón para cancelar turno
- **Turnos Pasados:** Historial de turnos ya realizados
- **Cancelación de turno:**
  - Confirmación requerida
  - Generación automática de enlaces para notificar al paciente (WhatsApp y email)

**Resultado:** Al cancelar, el horario vuelve a estar disponible para otros pacientes.

---

### 4. PACIENTES

**Objetivo:** Mantener un registro completo de los pacientes del profesional.

**Funcionalidades:**

#### Listado de Pacientes
- **Búsqueda:** Por nombre, apellido o localidad
- **Filtros:**
  - Por obra social (con/sin)
  - Por frecuencia (con reservas/sin reservas)
- **Vista en tabla:** Nombre, edad, localidad, obra social, fecha de alta, última atención
- **Acciones:** Editar perfil, eliminar paciente
- **Botón:** "Nuevo Paciente"

#### Ficha del Paciente (Detalle)
Organizada en 4 pestañas:

**Pestaña DATOS:**
- Nombre y apellido
- Fecha de nacimiento (edad calculada automáticamente)
- Dirección completa (calle, localidad, provincia)
- Contacto de emergencia (nombre, rol, teléfono)
- Obra social (nombre y número de carnet si aplica)
- Fecha de última atención
- Botón "Guardar Cambios"

**Pestaña ADJUNTOS:**
- Subir archivos (PDF, DOC, DOCX, TXT, MD) hasta 10MB
- Tabla de archivos:
  - Nombre, tipo, tamaño, fecha
  - Botones: Descargar, Eliminar

**Pestaña NOTAS:**
- Campo para agregar notas internas sobre el paciente
- Historial de notas con fecha y hora
- Las notas son privadas del profesional

**Pestaña RESERVAS:**
- Botón "Reservar Horario" (reserva interna para ese paciente)
- Lista de reservas activas
- Opción de convertir reserva en turno confirmado

**Nuevo Paciente:**
- Formulario completo con todos los campos de la ficha
- Validación de campos obligatorios
- Alta inmediata en el sistema

---

### 5. PROFESIONALES

**Objetivo:** Gestionar el equipo de profesionales que aparece en el sitio público.

**Funcionalidades:**
- **Ver profesionales activos:**
  - Nombre, título, especialidades, modalidades
  - Botón para editar perfil
  - Botón para solicitar baja

- **Editar profesional:**
  - Nombre y título
  - Email y WhatsApp de contacto
  - Especialidades (separadas por coma)
  - Modalidades de atención
  - Idiomas
  - Enfoque terapéutico
  - Descripción de actividades
  - Foto (subida de imagen)

- **Solicitar alta de nuevo profesional:**
  - Formulario completo con todos los datos
  - Incluye credenciales de acceso (email y contraseña inicial)
  - Subida de foto
  - La solicitud queda pendiente de aprobación

- **Solicitar baja de profesional:**
  - Confirmación requerida
  - Genera solicitud pendiente de aprobación

---

### 6. SOLICITUDES (Sistema de Votación)

**Objetivo:** Implementar un sistema democrático para aprobar cambios importantes (altas/bajas de profesionales).

**Funcionalidades:**
- **Solicitudes pendientes:**
  - Tipo (Alta/Baja de profesional)
  - Datos del profesional involucrado
  - Quién creó la solicitud
  - Contador de aprobaciones y rechazos
  - Botones: Aprobar / Rechazar
- **Solicitudes resueltas:** Historial con estado final (Aprobada/Rechazada)

**Regla de aprobación:** Las solicitudes requieren aprobación unánime de los demás profesionales del equipo.

**Resultado:** Al aprobarse, el profesional se agrega o elimina automáticamente del sitio público.

---

## C) Gestión del Carrusel de Videos

**Estado actual:** El carrusel del sitio cuenta con 5 videos pre-cargados que rotan automáticamente en el banner principal.

**Contenido actual:**
- banner1.mp4
- banner2.mp4
- banner3.mp4
- banner4.mp4
- banner5.mp4

**Administración actual:** Los videos están incorporados directamente en el sitio. Para cambiarlos se requiere reemplazo de archivos.

**Propuesta de mejora:** Crear un módulo en el Panel de Administración para:
- Subir nuevos videos o imágenes
- Ordenar los elementos del carrusel
- Activar/desactivar elementos
- Programar elementos por fechas (opcional)

---

## D) Accesos y Seguridad

### Inicio de Sesión
- Acceso mediante email y contraseña
- Pantalla de login dedicada
- Redirección automática al panel si ya está autenticado
- Cierre de sesión desde el panel

### Credenciales
- Cada profesional tiene sus propias credenciales
- Las contraseñas se definen al crear el profesional
- Se recomienda cambiar la contraseña inicial

### Perfiles y Permisos
- Cada profesional accede únicamente a:
  - Su propia disponibilidad
  - Sus propios turnos
  - Sus propios pacientes
- Todos pueden ver y editar perfiles de profesionales
- El sistema de solicitudes garantiza que los cambios importantes sean consensuados

### Seguridad de Datos
- Los datos de pacientes son privados por profesional
- Las notas y archivos adjuntos solo son visibles para el profesional que los creó
- El sistema registra las notificaciones enviadas (log de emails y WhatsApp)

---

# 3. INTEGRACIONES

## WhatsApp

**Descripción:** Integración para comunicación directa con pacientes.

**Uso actual:**
- Botón de contacto por profesional en página de Contacto
- Mensaje pre-armado al hacer clic
- Links de notificación de cancelación para que el profesional envíe

**Funcionamiento:** Al hacer clic, se abre WhatsApp Web o la aplicación con el mensaje ya escrito.

---

## Email

**Descripción:** Sistema de notificaciones por correo electrónico.

**Notificaciones configuradas:**
- Confirmación de turno al paciente
- Recordatorio de turno (horas antes)
- Aviso de cancelación

**Estado:** Sistema preparado con templates de email. *Requiere configuración de servicio de envío para producción.*

---

## Calendario (Archivo .ICS)

**Descripción:** Generación de archivo de calendario para que el paciente agregue el turno a su agenda.

**Compatible con:**
- Google Calendar
- Microsoft Outlook
- Apple Calendar
- Cualquier aplicación que soporte formato iCalendar

**Información incluida:**
- Título del evento
- Fecha y hora de inicio/fin
- Descripción con detalles del turno
- Estado confirmado

---

## Integraciones Sugeridas (No implementadas)

Las siguientes integraciones podrían sumarse en futuras versiones:

- **Google Maps:** Mostrar ubicación de consultorios en un mapa interactivo
- **Pasarela de Pagos:** Cobro de seña o turno completo online (MercadoPago, Stripe)
- **Google Calendar Sync:** Sincronización bidireccional con el calendario del profesional
- **Redes Sociales:** Enlaces a Instagram, Facebook, LinkedIn del equipo

---

# 4. PRÓXIMAS MEJORAS POSIBLES

## Mejoras de Contenido y Diseño

1. **Gestión de carrusel desde el panel:** Subir, ordenar y programar videos/imágenes del banner principal
2. **Administración de textos del sitio:** Editar contenidos de páginas estáticas (Inicio, Servicios, FAQ) desde el backoffice
3. **Blog o sección de artículos:** Publicar contenido informativo sobre salud mental
4. **Testimonios de pacientes:** Sección con reseñas (anónimas o con permiso)
5. **Galería de imágenes:** Mostrar instalaciones de consultorios

## Mejoras Funcionales

6. **Sistema de pagos online:** Cobrar seña o turno completo mediante MercadoPago o similar
7. **Recordatorios automáticos por WhatsApp:** Envío real de mensajes automáticos (requiere API de WhatsApp Business)
8. **Sistema de videollamadas integrado:** Iniciar sesión online directamente desde la plataforma
9. **Formulario de pre-consulta:** Cuestionario previo a la primera sesión
10. **Multi-idioma:** Versión del sitio en inglés u otros idiomas
11. **Historial clínico digital:** Evolución y seguimiento de tratamientos
12. **Sistema de recurrencia:** Turnos automáticos semanales/quincenales para pacientes regulares
13. **Notificaciones push:** Alertas en el navegador para recordatorios

## Mejoras Administrativas

14. **Dashboard con estadísticas:** Métricas de turnos, cancelaciones, nuevos pacientes
15. **Exportación de datos:** Descargar listados de pacientes y turnos en Excel
16. **Roles diferenciados:** Administrador con permisos extendidos vs. profesionales
17. **Auditoría de cambios:** Registro detallado de modificaciones en el sistema
18. **Backup automático:** Respaldo periódico de la base de datos
19. **Gestión de múltiples ubicaciones:** Configurar diferentes consultorios con sus direcciones

---

# ANEXO: Estructura de Páginas

## Sitio Público

| Página | URL | Contenido Administrable |
|--------|-----|------------------------|
| Inicio | / | Parcial (videos fijos, textos fijos) |
| Equipo | /equipo | ✅ Sí (desde panel) |
| Perfil Profesional | /equipo/perfil | ✅ Sí (desde panel) |
| Servicios | /servicios | No (textos fijos) |
| Preguntas Frecuentes | /faq | No (textos fijos) |
| Contacto | /contacto | ✅ Sí (datos de profesionales) |
| Políticas | /politicas | No (textos fijos) |
| Reservar Turno | /turnos | ✅ Sí (disponibilidad desde panel) |
| Selección de Horario | /turnos/profesional | ✅ Sí (disponibilidad desde panel) |
| Confirmar Turno | /turnos/confirmar | Automático |
| Turno Confirmado | /turnos/exito | Automático |
| Cancelar Turno | /turnos/cancelar | Automático |

## Panel de Administración

| Módulo | Funcionalidad Principal |
|--------|------------------------|
| Mi Calendario | Configurar horarios semanales |
| Días Especiales | Excepciones y bloqueos |
| Mis Turnos | Ver y gestionar turnos |
| Pacientes | Fichas, notas y archivos |
| Profesionales | Alta, baja y edición |
| Solicitudes | Aprobación de cambios |

---

*Documento generado para presentación al cliente.*
*Fecha: Diciembre 2025*



