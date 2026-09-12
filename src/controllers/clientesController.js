const clientesService = require('../services/clientesService');
const { validate, parsePagination, parseId } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const SCHEMA = {
  nombre: { type: 'string', required: true, maxLength: 255 },
  telefono: { type: 'string', maxLength: 30 },
  email: { type: 'email' },
  ciudad_interes: { type: 'string', maxLength: 100 },
  presupuesto_max: { type: 'number', min: 0 },
  tipo_buscando: { type: 'enum', values: ['casa', 'departamento', 'terreno', 'otro'] },
  estado: { type: 'enum', values: ['interesado', 'visito', 'compro'] },
  notas: { type: 'string' },
};

const listar = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { data, total } = await clientesService.listar(req.query, { limit, offset });
  ok(res, data, { page, limit, total });
});

const obtener = asyncHandler(async (req, res) => {
  ok(res, await clientesService.obtenerConHistorial(parseId(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA);
  ok(res, await clientesService.crear(data, req.user), null, 201);
});

const actualizar = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA, { partial: true });
  ok(res, await clientesService.actualizar(parseId(req.params.id), data, req.user));
});

const eliminar = asyncHandler(async (req, res) => {
  await clientesService.eliminar(parseId(req.params.id), req.user);
  ok(res, { message: 'Cliente eliminado.' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
