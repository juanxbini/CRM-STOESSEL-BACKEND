const env = require('../config/environment');
const { MENSAJES } = require('../utils/errorMessages');

/** 404 para rutas inexistentes. */
const notFoundHandler = (req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/** Traduce errores de PostgreSQL a respuestas HTTP con sentido. */
const mapPgError = (err) => {
  switch (err.code) {
    case '23505': // unique_violation
      return { status: 409, message: 'Ya existe un registro con esos datos.', details: err.detail };
    case '23503': // foreign_key_violation
      return { status: 409, message: 'La operación viola una relación con otros registros (referencia inexistente o en uso).', details: err.detail };
    case '22P02': // invalid_text_representation (ej: enum inválido)
    case '23502': // not_null_violation
    case '22001': // string too long
    case '22003': // numeric out of range
      return { status: 400, message: 'Datos inválidos para la base de datos.', details: err.message };
    default:
      return null;
  }
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || MENSAJES.ERROR_INTERNO;
  let details = err.details || null;

  if (err.code && typeof err.code === 'string') {
    const mapped = mapPgError(err);
    if (mapped) ({ status, message, details } = mapped);
  }

  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el tamaño máximo permitido.' : `Error de carga: ${err.message}`;
  }

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON inválido en el cuerpo de la petición.';
  }

  if (status >= 500) {
    console.error('💥', err);
    if (env.isProduction && !err.isOperational) message = MENSAJES.ERROR_INTERNO;
  }

  res.status(status).json({
    ok: false,
    message,
    ...(details ? { details } : {}),
    ...(!env.isProduction && status >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { errorHandler, notFoundHandler };
