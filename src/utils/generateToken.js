const jwt = require('jsonwebtoken');
const config = require('../config/jwt');

const basePayload = (usuario) => ({ sub: usuario.id, email: usuario.email, rol: usuario.rol });

const generateAccessToken = (usuario) =>
  jwt.sign({ ...basePayload(usuario), type: 'access' }, config.secret, {
    expiresIn: config.expire,
    issuer: config.issuer,
  });

const generateRefreshToken = (usuario) =>
  jwt.sign({ sub: usuario.id, type: 'refresh' }, config.refreshSecret, {
    expiresIn: config.refreshExpire,
    issuer: config.issuer,
  });

const verifyAccessToken = (token) => jwt.verify(token, config.secret, { issuer: config.issuer });
const verifyRefreshToken = (token) => jwt.verify(token, config.refreshSecret, { issuer: config.issuer });

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
