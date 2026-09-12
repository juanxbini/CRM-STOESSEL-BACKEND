/** Envuelve controladores async para que los errores lleguen a errorHandler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Respuesta estándar de éxito. */
const ok = (res, data, meta, status = 200) => res.status(status).json({ ok: true, data, ...(meta ? { meta } : {}) });

module.exports = { asyncHandler, ok };
