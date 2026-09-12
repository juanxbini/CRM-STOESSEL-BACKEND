-- =====================================================================
-- CRM Stoessel Propiedades - Esquema inicial (PostgreSQL)
-- Se ejecuta automáticamente al levantar el contenedor (docker-compose)
-- o manualmente con: npm run db:init
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Tipos enumerados ----------
DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_registro AS ENUM ('activo', 'inactivo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_propiedad AS ENUM ('casa', 'departamento', 'terreno', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_propiedad AS ENUM ('disponible', 'vendida', 'alquilada', 'en_tramite');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_comision AS ENUM ('pendiente', 'pagada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_cliente AS ENUM ('interesado', 'visito', 'compro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_lead AS ENUM ('contactado', 'interesado', 'rechazado', 'convertido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_interaccion AS ENUM ('visita', 'llamada', 'mensaje', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_negociacion AS ENUM ('sin_interes', 'en_conversacion', 'oferta', 'vendida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Usuarios ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  telefono        VARCHAR(30),
  password_hash   VARCHAR(255) NOT NULL,
  rol             rol_usuario NOT NULL DEFAULT 'user',
  estado          estado_registro NOT NULL DEFAULT 'activo',
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_acceso   TIMESTAMPTZ
);

-- ---------- Propietarios ----------
CREATE TABLE IF NOT EXISTS propietarios (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  telefono        VARCHAR(30),
  email           VARCHAR(255),
  ciudad          VARCHAR(100),
  direccion       VARCHAR(255),
  notas           TEXT,
  estado          estado_registro NOT NULL DEFAULT 'activo',
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Propiedades ----------
CREATE TABLE IF NOT EXISTS propiedades (
  id                  SERIAL PRIMARY KEY,
  propietario_id      INT NOT NULL REFERENCES propietarios(id) ON DELETE RESTRICT,
  usuario_id          INT REFERENCES usuarios(id) ON DELETE SET NULL,
  direccion           VARCHAR(255) NOT NULL,
  tipo                tipo_propiedad NOT NULL DEFAULT 'casa',
  habitaciones        INT,
  banos               INT,
  m2_construidos      DECIMAL(8,2),
  m2_terreno          DECIMAL(8,2),
  zona                VARCHAR(100),
  precio_venta        DECIMAL(12,2),
  precio_alquiler     DECIMAL(12,2),
  estado              estado_propiedad NOT NULL DEFAULT 'disponible',
  descripcion         TEXT,
  fotos_cloudinary    JSONB NOT NULL DEFAULT '[]'::jsonb,
  comision_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 3,
  comision_estado     estado_comision,
  fecha_operacion     DATE,
  fecha_ingreso       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Clientes (compradores / inquilinos) ----------
CREATE TABLE IF NOT EXISTS clientes_compra (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  telefono        VARCHAR(30),
  email           VARCHAR(255),
  ciudad_interes  VARCHAR(100),
  presupuesto_max DECIMAL(12,2),
  tipo_buscando   tipo_propiedad,
  estado          estado_cliente NOT NULL DEFAULT 'interesado',
  notas           TEXT,
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Leads (posibles propietarios) ----------
CREATE TABLE IF NOT EXISTS posibles_propietarios (
  id                    SERIAL PRIMARY KEY,
  nombre                VARCHAR(255) NOT NULL,
  telefono              VARCHAR(30),
  email                 VARCHAR(255),
  zona_interes          VARCHAR(100),
  tipo_propiedad        tipo_propiedad,
  motivacion            VARCHAR(255),
  estado                estado_lead NOT NULL DEFAULT 'contactado',
  notas                 TEXT,
  usuario_id            INT REFERENCES usuarios(id) ON DELETE SET NULL,
  propietario_id        INT REFERENCES propietarios(id) ON DELETE SET NULL,
  fecha_primer_contacto TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proximo_seguimiento   DATE
);

-- ---------- Interacciones (gestión de inmueble) ----------
CREATE TABLE IF NOT EXISTS gestion_inmueble (
  id                 SERIAL PRIMARY KEY,
  propiedad_id       INT NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  cliente_compra_id  INT REFERENCES clientes_compra(id) ON DELETE SET NULL,
  usuario_id         INT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_interaccion   tipo_interaccion NOT NULL,
  fecha              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notas              TEXT,
  estado_negociacion estado_negociacion NOT NULL DEFAULT 'en_conversacion'
);

-- ---------- Auditoría ----------
CREATE TABLE IF NOT EXISTS auditoria (
  id           SERIAL PRIMARY KEY,
  usuario_id   INT REFERENCES usuarios(id) ON DELETE SET NULL,
  accion       VARCHAR(50) NOT NULL,
  tabla        VARCHAR(100) NOT NULL,
  registro_id  INT,
  descripcion  TEXT,
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Configuración de la inmobiliaria ----------
CREATE TABLE IF NOT EXISTS configuracion (
  clave  VARCHAR(100) PRIMARY KEY,
  valor  TEXT
);

-- ---------- Índices ----------
CREATE INDEX IF NOT EXISTS idx_propiedades_propietario ON propiedades(propietario_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_estado      ON propiedades(estado);
CREATE INDEX IF NOT EXISTS idx_propiedades_usuario     ON propiedades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_zona        ON propiedades(zona);
CREATE INDEX IF NOT EXISTS idx_interacciones_propiedad ON gestion_inmueble(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_cliente   ON gestion_inmueble(cliente_compra_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_usuario   ON gestion_inmueble(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email          ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_leads_estado            ON posibles_propietarios(estado);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario       ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha         ON auditoria(fecha DESC);

-- ---------- Trigger: fecha_modificacion automática ----------
CREATE OR REPLACE FUNCTION set_fecha_modificacion() RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_modificacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_propiedades_modificacion ON propiedades;
CREATE TRIGGER trg_propiedades_modificacion
  BEFORE UPDATE ON propiedades
  FOR EACH ROW EXECUTE FUNCTION set_fecha_modificacion();
