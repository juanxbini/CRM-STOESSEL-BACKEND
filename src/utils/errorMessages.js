/**
 * Error de aplicación con status HTTP.
 * Usar: throw new AppError('Mensaje', 404)
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

const MENSAJES = {
  NO_AUTENTICADO: 'No autenticado. Iniciá sesión para continuar.',
  TOKEN_INVALIDO: 'Token inválido o expirado.',
  SIN_PERMISOS: 'No tenés permisos para realizar esta acción.',
  USUARIO_INACTIVO: 'El usuario está inactivo. Contactá a un administrador.',
  CREDENCIALES_INVALIDAS: 'Email o contraseña incorrectos.',
  NO_ENCONTRADO: (entidad = 'Recurso') => `${entidad} no encontrado/a.`,
  EMAIL_EN_USO: 'Ya existe un usuario con ese email.',
  VALIDACION: 'Datos inválidos.',
  ERROR_INTERNO: 'Error interno del servidor.',
  CLOUDINARY_NO_CONFIGURADO: 'Cloudinary no está configurado en el servidor.',
};

const badRequest = (msg = MENSAJES.VALIDACION, details) => new AppError(msg, 400, details);
const unauthorized = (msg = MENSAJES.NO_AUTENTICADO) => new AppError(msg, 401);
const forbidden = (msg = MENSAJES.SIN_PERMISOS) => new AppError(msg, 403);
const notFound = (entidad) => new AppError(MENSAJES.NO_ENCONTRADO(entidad), 404);
const conflict = (msg) => new AppError(msg, 409);

module.exports = { AppError, MENSAJES, badRequest, unauthorized, forbidden, notFound, conflict };
