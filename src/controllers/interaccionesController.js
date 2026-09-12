const interaccionesService = require('../services/interaccionesService');
const { validate, parsePagination, parseId } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const SCHEMA = {
  propiedad_id: { type: 'integer', required: true, min: 1 },
  cliente_compra_id: { type: 'integer', min: 1 },
  tipo_interaccion: { type: 'enum', required: true, values: ['visita', 'llamada', 'mensaje', 'email'] },
  fecha: { type: 'date' },
  notas: { type: 'string' },
  estado_negociacion: { type: 'enum', values: ['sin_interes', 'en_conversacion', 'oferta', 'vendida'] },
};

const listar = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { data, total } = await interaccionesService.listar(req.query, { limit, offset });
  ok(res, data, { page, limit, total });
});

const obtener = asyncHandler(async (req, res) => {
  ok(res, await interaccionesService.obtener(parseId(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA);
  ok(res, await interaccionesService.crear(data, req.user), null, 201);
});

module.exports = { listar, obtener, crear };
