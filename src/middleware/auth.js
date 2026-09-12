const { verifyAccessToken } = require('../utils/generateToken');
const Usuario = require('../models/Usuario');
const { unauthorized, forbidden, MENSAJES } = require('../utils/errorMessages');

/**
 * Verifica el JWT del header Authorization: Bearer <token>
 * y carga req.user con el usuario vigente de la base de datos.
 */
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return next(unauthorized());

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return next(unauthorized(MENSAJES.TOKEN_INVALIDO));
    }
    if (payload.type !== 'access') return next(unauthorized(MENSAJES.TOKEN_INVALIDO));

    const usuario = await Usuario.findById(payload.sub);
    if (!usuario) return next(unauthorized(MENSAJES.TOKEN_INVALIDO));
    if (usuario.estado !== 'activo') return next(forbidden(MENSAJES.USUARIO_INACTIVO));

    req.user = usuario;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = auth;
