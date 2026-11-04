# Éclat Studio API — Express + MySQL

Backend adaptado para desplegar en Render y conectarse a MySQL en Aiven. Incluye autenticación JWT y reservas con aprobación profesional.

## 1. Instalación local

```bash
npm install
cp .env.example .env
npm run dev
```

Completa `.env` con las credenciales de Aiven. No subas `.env` a GitHub ni lo incluyas en el ZIP que compartas.

Comprueba el servidor en `GET /api/health`.

## 2. Migración de la base de datos existente

No borres ni recrees la base de datos. Ejecuta una sola vez `migrations/001_reservas_aprobacion.sql` sobre la misma base que ya usa el backend.

La migración:
- Añade `Profesionales.usuario_id` para vincular el perfil profesional con su cuenta.
- Crea `Horarios` (1=lunes, 2=martes, ..., 7=domingo).
- Añade un índice para las consultas de citas.

Después de ejecutarla, asigna una cuenta de usuario a cada profesional. Ejemplo: sustituye los correos por los correos reales de las cuentas que hayas registrado y ejecuta las consultas por separado:

```sql
UPDATE Usuarios
SET rol = 'PROFESIONAL'
WHERE email = 'correo-profesional@ejemplo.com';

UPDATE Profesionales
SET usuario_id = (
  SELECT id FROM Usuarios WHERE email = 'correo-profesional@ejemplo.com'
)
WHERE id = 1;
```

Repite para cada profesional y verifica que `usuario_id` no quede en NULL. No asignes una misma cuenta a dos profesionales.

Configura los horarios de ejemplo según la jornada real (ajusta los IDs y horas):

```sql
-- Lunes a viernes, de 09:00 a 17:00
INSERT INTO Horarios (profesional_id, dia_semana, hora_inicio, hora_fin)
VALUES
(1, 1, '09:00:00', '17:00:00'),
(1, 2, '09:00:00', '17:00:00'),
(1, 3, '09:00:00', '17:00:00'),
(1, 4, '09:00:00', '17:00:00'),
(1, 5, '09:00:00', '17:00:00');
```

La disponibilidad se calcula usando la duración del servicio (`Servicios.duracion_minutos`) y bloques de 30 minutos. Una reserva debe caber completa dentro de un horario. Las citas `PENDIENTE` y `CONFIRMADA` bloquean el horario; `CANCELADA` y `COMPLETADA` no lo bloquean.

## 3. Flujo de reserva

1. Un usuario con rol `CLIENTE` consulta servicios y profesionales.
2. Consulta horarios con `GET /api/appointments/availability?servicio_id=1&profesional_id=1&fecha=2026-12-10`.
3. Envía la solicitud con `POST /api/appointments`.
4. La cita se crea como `PENDIENTE`.
5. El profesional vinculado a esa cita puede aprobar con `PATCH /api/appointments/:id/confirmar` o rechazar con `PATCH /api/appointments/:id/rechazar`.
6. El cliente puede cancelar su propia cita con `PATCH /api/appointments/:id/cancelar`.
7. El profesional puede marcar una cita confirmada como atendida con `PATCH /api/appointments/:id/atendida`.

Todas las rutas `/api/appointments` requieren `Authorization: Bearer <token>`. El servidor toma el ID del cliente desde el token; ignora cualquier `usuario_id` que envíe el navegador. El profesional sólo ve y modifica citas asociadas a su perfil.

## 4. Endpoints

- `POST /api/auth/register` — registro público (siempre rol CLIENTE).
- `POST /api/auth/login` — inicio de sesión.
- `GET /api/services` — catálogo de servicios.
- `GET /api/professionals` — profesionales activos.
- `GET /api/appointments` — citas visibles para el rol autenticado.
- `GET /api/appointments/availability` — horarios libres.
- `POST /api/appointments` — crear solicitud pendiente (CLIENTE).
- `PATCH /api/appointments/:id/confirmar` — aprobar (PROFESIONAL/ADMIN).
- `PATCH /api/appointments/:id/rechazar` — rechazar (PROFESIONAL/ADMIN).
- `PATCH /api/appointments/:id/cancelar` — cancelar (cliente dueño, profesional asignado o ADMIN).
- `PATCH /api/appointments/:id/atendida` — finalizar (PROFESIONAL/ADMIN).

## 5. Variables de entorno

- `PORT`: Render la proporciona automáticamente.
- `FRONTEND_URL`: URL pública de Vercel. Puedes separar varios orígenes con comas.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: credenciales Aiven.
- `DB_SSL=true`: conexión TLS.
- `JWT_SECRET`: secreto aleatorio largo (mínimo 32 caracteres).
- `APP_TIMEZONE=America/Bogota`.

## 6. Despliegue en Render

- Crea un Web Service desde el repositorio.
- Si el repositorio contiene esta carpeta como raíz, configura Root Directory `backend` (si el backend está dentro de una carpeta `backend`).
- Build Command: `npm install`.
- Start Command: `npm start`.
- Agrega las variables del `.env` en Render → Environment. No agregues el archivo `.env`.
- `FRONTEND_URL` debe contener el dominio real del frontend de Vercel.
- Verifica `https://TU-SERVICIO.onrender.com/api/health`.

## Notas

- La tabla de estados de este proyecto usa `PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `COMPLETADA`; no se cambia a `ATENDIDA` para no romper el esquema existente. En la interfaz se muestra `COMPLETADA` como “Atendida”.
- La migración es de una sola ejecución. Haz un respaldo antes de aplicarla.
- El backend evita conflictos de reservas concurrentes bloqueando la fila del profesional durante la transacción.
- Antes de producción, configura los horarios reales, vincula las cuentas profesionales y prueba los permisos con cuentas separadas de cliente, profesional y administrador.
