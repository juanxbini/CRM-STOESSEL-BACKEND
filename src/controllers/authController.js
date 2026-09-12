const authService = require('../services/authService');
const usuariosService = require('../services/usuariosService');
const { validate } = require('../utils/validators');
const { asyncHandler, ok } = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = validate(req.body, {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true },
  });
  const result = await authService.login(email, password);
  ok(res, result);
});

/** Alta de usuario (solo Admin). Equivale a POST /api/usuarios. */
const register = asyncHandler(async (req, res) => {
  const data = validate(req.body, {
    nombre: { type: 'string', required: true, maxLength: 255 },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 6 },
    telefono: { type: 'string', maxLength: 30 },
    rol: { type: 'enum', values: ['admin', 'user'] },
  });
  const usuario = await usuariosService.crear(data, req.user);
  ok(res, usuario, null, 201);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  ok(res, result);
});

const me = asyncHandler(async (req, res) => {
  ok(res, req.user);
});

/** Logout: los tokens son stateless, el cliente los descarta. */
const logout = asyncHandler(async (req, res) => {
  ok(res, { message: 'Sesión cerrada.' });
});

const cambiarPassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNueva } = validate(req.body, {
    passwordActual: { type: 'string', required: true },
    passwordNueva: { type: 'string', required: true, minLength: 6 },
  });
  await authService.cambiarPassword(req.user.id, passwordActual, passwordNueva);
  ok(res, { message: 'Contraseña actualizada.' });
});

const actualizarPerfil = asyncHandler(async (req, res) => {
  const data = validate(req.body, {
    nombre: { type: 'string', maxLength: 255 },
    telefono: { type: 'string', maxLength: 30 },
  }, { partial: true });
  const usuario = await usuariosService.actualizar(req.user.id, data, req.user);
  ok(res, usuario);
});

module.exports = { login, register, refresh, me, logout, cambiarPassword, actualizarPerfil };
