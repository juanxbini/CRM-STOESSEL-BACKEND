const propietariosService = require('../services/propietariosService');
const { validate, parsePagination, parseId } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const SCHEMA = {
  nombre: { type: 'string', required: true, maxLength: 255 },
  telefono: { type: 'string', maxLength: 30 },
  email: { type: 'email' },
  ciudad: { type: 'string', maxLength: 100 },
  direccion: { type: 'string', maxLength: 255 },
  notas: { type: 'string' },
  estado: { type: 'enum', values: ['activo', 'inactivo'] },
};

const listar = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { data, total } = await propietariosService.listar(req.query, { limit, offset });
  ok(res, data, { page, limit, total });
});

const obtener = asyncHandler(async (req, res) => {
  ok(res, await propietariosService.obtenerConPropiedades(parseId(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA);
  ok(res, await propietariosService.crear(data, req.user), null, 201);
});

const actualizar = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA, { partial: true });
  ok(res, await propietariosService.actualizar(parseId(req.params.id), data, req.user));
});

const eliminar = asyncHandler(async (req, res) => {
  await propietariosService.eliminar(parseId(req.params.id), req.user);
  ok(res, { message: 'Propietario eliminado.' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
