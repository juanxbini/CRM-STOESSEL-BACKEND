# CRM Stoessel Propiedades - Backend

API REST en Node.js + Express + PostgreSQL con autenticación JWT, roles (admin/user), auditoría automática, fotos en Cloudinary y estructura de emails con Resend.

## Setup local con Docker

1. `npm install`
2. Crear `.env` basado en `.env.example` (los valores por defecto ya sirven para desarrollo)
3. `docker compose up -d` (inicia PostgreSQL en Docker y ejecuta `init.sql` + `seeds.sql` la primera vez)
4. `npm run dev`

El servidor corre en `http://localhost:5000`.

> El contenedor expone PostgreSQL en el puerto **5440** del host (`DB_PORT=5440`) para no chocar con otras instancias de Postgres locales. Adentro del contenedor sigue siendo 5432.

### Usuarios de prueba (seeds)

| Email                    | Password     | Rol   |
|--------------------------|--------------|-------|
| admin@stoessel.local     | admin123     | admin |
| vendedor@stoessel.local  | vendedor123  | user  |

## Database

### Local (Docker)

```bash
# Iniciar
docker compose up -d

# Ver logs
docker compose logs -f postgres

# Detener
docker compose down

# Limpiar datos (⚠️ borra todo y vuelve a correr init.sql + seeds.sql al levantar)
docker compose down -v

# Conectar a la BD
docker exec -it stoessel_crm_db psql -U postgres -d stoessel_propiedades
```

- Las tablas se crean automáticamente con `src/sql/init.sql`
- Los datos de prueba se insertan con `src/sql/seeds.sql` (idempotente: no duplica si ya hay datos)
- Los hashes de password de los seeds se generan con `pgcrypto` (compatibles con bcryptjs)

### Producción (Railway)

- PostgreSQL hosteada en Railway
- Railway provee `DATABASE_URL`: si está definida, tiene prioridad sobre `DB_HOST/DB_PORT/...`
- Ejecutar el esquema una sola vez: `npm run db:init` (corre `init.sql` + `seeds.sql` contra la base del `.env` / `DATABASE_URL`)
- Solo seeds: `npm run db:seed`

## Estructura

```
src/
├── config/        database (pool pg), environment, jwt, cloudinary
├── middleware/    auth (JWT), roleCheck (admin), errorHandler, logger (morgan)
├── routes/        un router por recurso, montados en app.js bajo /api
├── controllers/   validan input (utils/validators) y responden { ok, data, meta }
├── services/      lógica de negocio + registro de auditoría
├── models/        acceso a datos (SQL parametrizado con pg)
├── utils/         validators, hashPassword, generateToken, errorMessages, sqlHelpers
└── sql/           init.sql (esquema) y seeds.sql (datos iniciales)
```

Formato de respuesta:

```json
{ "ok": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 42 } }
{ "ok": false, "message": "Datos inválidos.", "details": { "email": "Email inválido." } }
```

## Autenticación

- `POST /api/auth/login` devuelve `accessToken` (7 días) y `refreshToken` (30 días)
- Enviar `Authorization: Bearer <accessToken>` en cada request
- `POST /api/auth/refresh` con `{ refreshToken }` renueva ambos tokens
- Los tokens son stateless; el logout descarta los tokens del lado del cliente

## Permisos

| Acción                                   | Admin | User |
|------------------------------------------|:-----:|:----:|
| Crear / editar propiedades, propietarios, clientes, leads, interacciones | ✅ | ✅ |
| Cambiar estado de propiedad              | ✅ | ✅ |
| Eliminar cualquier registro              | ✅ | ❌ |
| Gestionar usuarios (`/api/usuarios`)     | ✅ | ❌ |
| Ver auditoría (`/api/auditoria`)         | ✅ | ❌ |
| Editar datos de la inmobiliaria          | ✅ | ❌ |
| Ver reportes                             | ✅ | ✅ |

## API

### Auth
```
POST   /api/auth/login              { email, password }
POST   /api/auth/refresh            { refreshToken }
POST   /api/auth/register           (admin) alta de usuario
GET    /api/auth/me
PUT    /api/auth/me                 { nombre, telefono }
PUT    /api/auth/me/password        { passwordActual, passwordNueva }
POST   /api/auth/logout
```

### Propiedades
```
GET    /api/propiedades             ?search&estado&tipo&zona&propietario_id&usuario_id&precio_min&precio_max&orden&page&limit
POST   /api/propiedades
GET    /api/propiedades/zonas
GET    /api/propiedades/:id
PUT    /api/propiedades/:id
PATCH  /api/propiedades/:id/estado  { estado }
DELETE /api/propiedades/:id         (admin)
POST   /api/propiedades/:id/upload-fotos   multipart, campo "fotos" (hasta 10 imágenes de 5 MB)
DELETE /api/propiedades/:id/fotos   { public_id }
```

Al pasar una propiedad a `vendida` o `alquilada` se completa automáticamente `fecha_operacion` (hoy) y `comision_estado = 'pendiente'` si no se indican.

### Propietarios
```
GET    /api/propietarios            ?search&estado&ciudad&page&limit
POST   /api/propietarios
GET    /api/propietarios/:id        (incluye propiedades vinculadas)
PUT    /api/propietarios/:id
DELETE /api/propietarios/:id        (admin; 409 si tiene propiedades)
```

### Clientes
```
GET    /api/clientes                ?search&estado&tipo_buscando&ciudad_interes&page&limit
POST   /api/clientes
GET    /api/clientes/:id            (incluye historial de interacciones)
PUT    /api/clientes/:id
DELETE /api/clientes/:id            (admin)
```

### Leads
```
GET    /api/leads                   ?search&estado&tipo_propiedad&usuario_id&seguimiento_hasta&page&limit
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
PUT    /api/leads/:id/convertir     { ciudad?, direccion?, notas? } → crea propietario y marca el lead como convertido
DELETE /api/leads/:id               (admin)
```

### Interacciones
```
GET    /api/interacciones           ?propiedad_id&cliente_id&usuario_id&tipo&estado_negociacion&desde&hasta&page&limit
POST   /api/interacciones           { propiedad_id, cliente_compra_id?, tipo_interaccion, fecha?, notas?, estado_negociacion? }
GET    /api/interacciones/:id
```

### Reportes
```
GET    /api/reportes/dashboard      KPIs, próximos seguimientos, últimas interacciones
GET    /api/reportes/ventas         ?desde&hasta   operaciones por mes + detalle
GET    /api/reportes/comisiones     ?estado=pendiente|pagada
GET    /api/reportes/por-zona
```

### Usuarios (admin)
```
GET    /api/usuarios                ?search&rol&estado
POST   /api/usuarios                { nombre, email, password, telefono?, rol? }
GET    /api/usuarios/:id
PUT    /api/usuarios/:id            { nombre?, email?, password?, telefono?, rol?, estado? }
DELETE /api/usuarios/:id
```

### Auditoría (admin)
```
GET    /api/auditoria               ?usuario&accion&tabla&registro_id&desde&hasta&page&limit
```
Acciones registradas automáticamente: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `UPLOAD`, `CONVERT`.

### Configuración
```
GET    /api/configuracion
PUT    /api/configuracion           (admin) { nombre, telefono, email, direccion, comision_default }
```

## Cloudinary

Cargar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en `.env`. Hasta entonces el upload responde `503`. Solo se guarda en la BD la URL y el `public_id` de cada foto (`fotos_cloudinary` JSONB).

## Emails (Resend)

`src/services/emailService.js` tiene la estructura (`enviarConfirmacionOperacion`, `enviarRecordatorioSeguimiento`, `enviarNotificacion`). Sin `RESEND_API_KEY` los envíos se simulan por consola. Las plantillas y los disparadores se implementan en una fase posterior.

## Deploy a Railway

- Conectar el repo de GitHub y elegir la carpeta `backend` como root
- Agregar las variables de `.env.example` (Railway inyecta `DATABASE_URL` del plugin de Postgres)
- `CORS_ORIGIN` debe incluir la URL del frontend en Vercel
- Ejecutar `npm run db:init` una sola vez (por ejemplo desde un shell de Railway o localmente apuntando `DATABASE_URL` a la base de producción)
- Auto-deploy en push a `main`. No necesita Docker en Railway (usa la BD hosteada); el `Dockerfile` queda disponible si se prefiere ese modo.
