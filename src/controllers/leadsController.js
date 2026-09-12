const leadsService = require('../services/leadsService');
const { validate, parsePagination, parseId } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const SCHEMA = {
  nombre: { type: 'string', required: true, maxLength: 255 },
  telefono: { type: 'string', maxLength: 30 },
  email: { type: 'email' },
  zona_interes: { type: 'string', maxLength: 100 },
  tipo_propiedad: { type: 'enum', values: ['casa', 'departamento', 'terreno', 'otro'] },
  motivacion: { type: 'string', maxLength: 255 },
  estado: { type: 'enum', values: ['contactado', 'interesado', 'rechazado', 'convertido'] },
  notas: { type: 'string' },
  usuario_id: { type: 'integer', min: 1 },
  fecha_primer_contacto: { type: 'date' },
  proximo_seguimiento: { type: 'date' },
};

const listar = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { data, total } = await leadsService.listar(req.query, { limit, offset });
  ok(res, data, { page, limit, total });
});

const obtener = asyncHandler(async (req, res) => {
  ok(res, await leadsService.obtener(parseId(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA);
  ok(res, await leadsService.crear(data, req.user), null, 201);
});

const actualizar = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA, { partial: true });
  ok(res, await leadsService.actualizar(parseId(req.params.id), data, req.user));
});

const eliminar = asyncHandler(async (req, res) => {
  await leadsService.eliminar(parseId(req.params.id), req.user);
  ok(res, { message: 'Lead eliminado.' });
});

const convertir = asyncHandler(async (req, res) => {
  const extra = validate(req.body, {
    nombre: { type: 'string', maxLength: 255 },
    telefono: { type: 'string', maxLength: 30 },
    email: { type: 'email' },
    ciudad: { type: 'string', maxLength: 100 },
    direccion: { type: 'string', maxLength: 255 },
    notas: { type: 'string' },
  }, { partial: true });
  ok(res, await leadsService.convertir(parseId(req.params.id), extra, req.user), null, 201);
});

module.exports = { listar, obtener, crear, actualizar, eliminar, convertir };
