const Usuario = require('../models/Usuario');
const { comparePassword, hashPassword } = require('../utils/hashPassword');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { unauthorized, forbidden, badRequest, MENSAJES } = require('../utils/errorMessages');
const auditoria = require('./auditoriaService');

const buildTokens = (usuario) => ({
  accessToken: generateAccessToken(usuario),
  refreshToken: generateRefreshToken(usuario),
});

const sanitize = (u) => {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
};

const login = async (email, password) => {
  const usuario = await Usuario.findByEmailWithPassword(email);
  if (!usuario) throw unauthorized(MENSAJES.CREDENCIALES_INVALIDAS);

  const valid = await comparePassword(password, usuario.password_hash);
  if (!valid) throw unauthorized(MENSAJES.CREDENCIALES_INVALIDAS);
  if (usuario.estado !== 'activo') throw forbidden(MENSAJES.USUARIO_INACTIVO);

  await Usuario.touchUltimoAcceso(usuario.id);
  auditoria.registrar(usuario, auditoria.ACCIONES.LOGIN, 'usuarios', usuario.id, `Inicio de sesión de ${usuario.email}`);

  return { usuario: sanitize(usuario), ...buildTokens(usuario) };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw badRequest('Falta el refresh token.');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw unauthorized(MENSAJES.TOKEN_INVALIDO);
  }
  if (payload.type !== 'refresh') throw unauthorized(MENSAJES.TOKEN_INVALIDO);

  const usuario = await Usuario.findById(payload.sub);
  if (!usuario) throw unauthorized(MENSAJES.TOKEN_INVALIDO);
  if (usuario.estado !== 'activo') throw forbidden(MENSAJES.USUARIO_INACTIVO);

  return { usuario, ...buildTokens(usuario) };
};

const cambiarPassword = async (usuarioId, passwordActual, passwordNueva) => {
  const usuario = await Usuario.findByEmailWithPassword((await Usuario.findById(usuarioId)).email);
  const valid = await comparePassword(passwordActual, usuario.password_hash);
  if (!valid) throw badRequest('La contraseña actual es incorrecta.');
  await Usuario.update(usuarioId, { password_hash: await hashPassword(passwordNueva) });
  return true;
};

module.exports = { login, refresh, cambiarPassword, sanitize };
