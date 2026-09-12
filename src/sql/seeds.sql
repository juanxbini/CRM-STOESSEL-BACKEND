-- =====================================================================
-- CRM Stoessel Propiedades - Datos iniciales
-- Admin por defecto: admin@stoessel.local / admin123
-- Usuario de prueba:  vendedor@stoessel.local / vendedor123
-- (los hashes se generan con pgcrypto, compatibles con bcryptjs)
-- =====================================================================

INSERT INTO usuarios (nombre, email, telefono, password_hash, rol)
VALUES
  ('Administrador', 'admin@stoessel.local', '+54 9 11 0000-0000', crypt('admin123', gen_salt('bf', 10)), 'admin'),
  ('Vendedor Demo', 'vendedor@stoessel.local', '+54 9 11 1111-1111', crypt('vendedor123', gen_salt('bf', 10)), 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO configuracion (clave, valor) VALUES
  ('nombre', 'Stoessel Propiedades'),
  ('telefono', ''),
  ('email', ''),
  ('direccion', ''),
  ('comision_default', '3')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO propietarios (nombre, telefono, email, ciudad, direccion)
SELECT * FROM (VALUES
  ('Juan Pérez',     '+54 9 11 2222-2222', 'juan.perez@example.com',  'Buenos Aires', 'Av. Corrientes 1234'),
  ('María González', '+54 9 11 3333-3333', 'maria.g@example.com',     'La Plata',     'Calle 7 N 850'),
  ('Carlos Ruiz',    '+54 9 11 4444-4444', 'carlos.ruiz@example.com', 'Buenos Aires', 'Av. Santa Fe 4500')
) AS v(nombre, telefono, email, ciudad, direccion)
WHERE NOT EXISTS (SELECT 1 FROM propietarios);

INSERT INTO propiedades (propietario_id, usuario_id, direccion, tipo, habitaciones, banos, m2_construidos, m2_terreno, zona, precio_venta, precio_alquiler, estado, descripcion, comision_estado, fecha_operacion)
SELECT * FROM (VALUES
  (1, 1, 'Av. Corrientes 1234, 5 B',    'departamento'::tipo_propiedad, 2,    1,    65.00,  NULL::numeric, 'Centro',   120000.00, NULL::numeric, 'disponible'::estado_propiedad, 'Departamento luminoso, 2 ambientes, balcón al frente.', NULL::estado_comision, NULL::date),
  (2, 2, 'Calle 7 N 850',               'casa'::tipo_propiedad,         4,    2,    180.00, 400.00,        'La Plata', 250000.00, NULL,          'disponible'::estado_propiedad, 'Casa con jardín y garage doble.', NULL, NULL),
  (3, 2, 'Av. Santa Fe 4500, 12 A',     'departamento'::tipo_propiedad, 3,    2,    95.00,  NULL,          'Palermo',  210000.00, 1500.00,       'vendida'::estado_propiedad,    'Piso alto con vista abierta.', 'pendiente'::estado_comision, CURRENT_DATE - 20),
  (1, 1, 'Lote 12, Barrio Los Robles',  'terreno'::tipo_propiedad,      NULL, NULL, NULL,   800.00,        'Pilar',    60000.00,  NULL,          'en_tramite'::estado_propiedad, 'Terreno en barrio cerrado, todos los servicios.', NULL, NULL)
) AS v(propietario_id, usuario_id, direccion, tipo, habitaciones, banos, m2_construidos, m2_terreno, zona, precio_venta, precio_alquiler, estado, descripcion, comision_estado, fecha_operacion)
WHERE NOT EXISTS (SELECT 1 FROM propiedades);

INSERT INTO clientes_compra (nombre, telefono, email, ciudad_interes, presupuesto_max, tipo_buscando, estado)
SELECT * FROM (VALUES
  ('Lucía Fernández', '+54 9 11 5555-5555', 'lucia.f@example.com',  'Buenos Aires', 150000.00, 'departamento'::tipo_propiedad, 'interesado'::estado_cliente),
  ('Martín López',    '+54 9 11 6666-6666', 'martin.l@example.com', 'La Plata',     300000.00, 'casa'::tipo_propiedad,         'visito'::estado_cliente),
  ('Ana Torres',      '+54 9 11 7777-7777', 'ana.t@example.com',    'Palermo',      220000.00, 'departamento'::tipo_propiedad, 'compro'::estado_cliente)
) AS v(nombre, telefono, email, ciudad_interes, presupuesto_max, tipo_buscando, estado)
WHERE NOT EXISTS (SELECT 1 FROM clientes_compra);

INSERT INTO posibles_propietarios (nombre, telefono, email, zona_interes, tipo_propiedad, motivacion, estado, usuario_id, proximo_seguimiento)
SELECT * FROM (VALUES
  ('Roberto Díaz',  '+54 9 11 8888-8888', 'roberto.d@example.com', 'Belgrano', 'departamento'::tipo_propiedad, 'Quiere vender para mudarse al exterior', 'contactado'::estado_lead, 2, CURRENT_DATE + 3),
  ('Silvia Romero', '+54 9 11 9999-9999', 'silvia.r@example.com',  'Pilar',    'casa'::tipo_propiedad,         'Herencia, necesita tasación',            'interesado'::estado_lead, 1, CURRENT_DATE + 7)
) AS v(nombre, telefono, email, zona_interes, tipo_propiedad, motivacion, estado, usuario_id, proximo_seguimiento)
WHERE NOT EXISTS (SELECT 1 FROM posibles_propietarios);

INSERT INTO gestion_inmueble (propiedad_id, cliente_compra_id, usuario_id, tipo_interaccion, notas, estado_negociacion, fecha)
SELECT * FROM (VALUES
  (1, 1, 2, 'visita'::tipo_interaccion,  'Visitó el departamento, le gustó el balcón.', 'en_conversacion'::estado_negociacion, NOW() - INTERVAL '5 days'),
  (2, 2, 2, 'llamada'::tipo_interaccion, 'Consultó por financiación.',                  'oferta'::estado_negociacion,          NOW() - INTERVAL '2 days'),
  (3, 3, 1, 'email'::tipo_interaccion,   'Se cerró la operación.',                      'vendida'::estado_negociacion,         NOW() - INTERVAL '20 days')
) AS v(propiedad_id, cliente_compra_id, usuario_id, tipo_interaccion, notas, estado_negociacion, fecha)
WHERE NOT EXISTS (SELECT 1 FROM gestion_inmueble);
