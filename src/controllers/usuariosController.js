const usuariosService = require('../services/usuariosService');
const { validate, parsePagination, parseId } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const SCHEMA = {
  nombre: { type: 'string', required: true, maxLength: 255 },
  email: { type: 'email', required: true },
  password: { type: 'string', required: true, minLength: 6 },
  telefono: { type: 'string', maxLength: 30 },
  rol: { type: 'enum', values: ['admin', 'user'] },
  estado: { type: 'enum', values: ['activo', 'inactivo'] },
};

const listar = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 50 });
  const { data, total } = await usuariosService.listar(req.query, { limit, offset });
  ok(res, data, { page, limit, total });
});

const obtener = asyncHandler(async (req, res) => {
  ok(res, await usuariosService.obtener(parseId(req.params.id)));
});

const crear = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA);
  ok(res, await usuariosService.crear(data, req.user), null, 201);
});

const actualizar = asyncHandler(async (req, res) => {
  const data = validate(req.body, SCHEMA, { partial: true });
  ok(res, await usuariosService.actualizar(parseId(req.params.id), data, req.user));
});

const eliminar = asyncHandler(async (req, res) => {
  await usuariosService.eliminar(parseId(req.params.id), req.user);
  ok(res, { message: 'Usuario eliminado.' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
