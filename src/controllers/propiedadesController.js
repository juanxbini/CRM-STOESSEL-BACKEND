const propiedadesService = require('../services/propiedadesService');
const { validate, parsePagination, parseId } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const TIPOS = ['casa', 'departamento', 'terreno', 'otro'];
const ESTADOS = ['disponible', 'vendida', 'alquilada', 'en_tramite'];

const SCHEMA = {
  propietario_id: { type: 'integer', required: true, min: 1 },
  usuario_id: { type: 'integer', min: 1 },
  direccion: { type: 'string', required: true, maxLength: 255 },
  tipo: { type: 'enum', values: TIPOS },
  habitaciones: { type: 'integer', min: 0 },
  banos: { type: 'integer', min: 0 },
  m2_construidos: { type: 'number', min: 0 },
  m2_terreno: { type: 'number', min: 0 },
  zona: { type: 'string', maxLength: 100 },
  precio_venta: { type: 'number', min: 0 },
  precio_alquiler: { type: 'number', min: 0 },
  estado: { type: 'enum', values: ESTADOS },
  descripcion: { type: 'string' },
  comision_porcentaje: { type: 'number', min: 0, max: 100 },
  comision_estado: { type: 'enum', values: ['pendiente', 'pagada'] },
  fecha_operacion: { type: 'date' },
};

const listar = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { data, total } = await propiedadesService.listar(req.query, { limit, offset });
  ok(res, data, { page, limit, total });
});

const obtener = asyncHandler(async (req, res) => {
  ok(res, await propiedadesService.obtener(parseId(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA);
  ok(res, await propiedadesService.crear(data, req.user), null, 201);
});

const actualizar = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA, { partial: true });
  ok(res, await propiedadesService.actualizar(parseId(req.params.id), data, req.user));
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const { estado } = validate(req.body, { estado: { type: 'enum', values: ESTADOS, required: true } });
  ok(res, await propiedadesService.cambiarEstado(parseId(req.params.id), estado, req.user));
});

const eliminar = asyncHandler(async (req, res) => {
  await propiedadesService.eliminar(parseId(req.params.id), req.user);
  ok(res, { message: 'Propiedad eliminada.' });
});

const subirFotos = asyncHandler(async (req, res) => {
  const fotos = await propiedadesService.subirFotos(parseId(req.params.id), req.files, req.user);
  ok(res, fotos, null, 201);
});

const eliminarFoto = asyncHandler(async (req, res) => {
  const { public_id } = validate(req.body, { public_id: { type: 'string', required: true } });
  ok(res, await propiedadesService.eliminarFoto(parseId(req.params.id), public_id, req.user));
});

const zonas = asyncHandler(async (req, res) => {
  ok(res, await propiedadesService.zonas());
});

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar, subirFotos, eliminarFoto, zonas };
