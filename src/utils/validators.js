const { badRequest } = require('./errorMessages');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mini validador declarativo.
 * schema = { campo: { required, type: 'string'|'number'|'integer'|'email'|'enum'|'date'|'array'|'boolean', values: [...], min, max, maxLength } }
 * Devuelve el objeto saneado (solo los campos del schema) o lanza 400 con detalle por campo.
 */
const validate = (data = {}, schema = {}, { partial = false } = {}) => {
  const errors = {};
  const clean = {};

  for (const [campo, rules] of Object.entries(schema)) {
    let value = data[campo];
    const vacio = value === undefined || value === null || value === '';

    if (vacio) {
      if (rules.required && !partial) errors[campo] = 'Es obligatorio.';
      else if (value !== undefined && !rules.required) clean[campo] = null;
      continue;
    }

    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') { errors[campo] = 'Debe ser texto.'; continue; }
        value = value.trim();
        if (rules.maxLength && value.length > rules.maxLength) { errors[campo] = `Máximo ${rules.maxLength} caracteres.`; continue; }
        if (rules.minLength && value.length < rules.minLength) { errors[campo] = `Mínimo ${rules.minLength} caracteres.`; continue; }
        break;
      case 'email':
        if (typeof value !== 'string' || !EMAIL_RE.test(value.trim())) { errors[campo] = 'Email inválido.'; continue; }
        value = value.trim().toLowerCase();
        break;
      case 'number':
      case 'integer': {
        const n = Number(value);
        if (Number.isNaN(n)) { errors[campo] = 'Debe ser numérico.'; continue; }
        if (rules.type === 'integer' && !Number.isInteger(n)) { errors[campo] = 'Debe ser un entero.'; continue; }
        if (rules.min !== undefined && n < rules.min) { errors[campo] = `Mínimo ${rules.min}.`; continue; }
        if (rules.max !== undefined && n > rules.max) { errors[campo] = `Máximo ${rules.max}.`; continue; }
        value = n;
        break;
      }
      case 'enum':
        if (!rules.values.includes(value)) { errors[campo] = `Valor inválido. Opciones: ${rules.values.join(', ')}.`; continue; }
        break;
      case 'date': {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) { errors[campo] = 'Fecha inválida.'; continue; }
        value = typeof value === 'string' ? value : d.toISOString();
        break;
      }
      case 'boolean':
        if (typeof value === 'string') value = value === 'true';
        if (typeof value !== 'boolean') { errors[campo] = 'Debe ser booleano.'; continue; }
        break;
      case 'array':
        if (!Array.isArray(value)) { errors[campo] = 'Debe ser una lista.'; continue; }
        break;
      default:
        break;
    }
    clean[campo] = value;
  }

  if (Object.keys(errors).length) throw badRequest('Datos inválidos.', errors);
  return clean;
};

/** Parsea paginación desde query string. */
const parsePagination = (query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
};

const parseId = (raw, nombre = 'id') => {
  const id = parseInt(raw, 10);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`${nombre} inválido.`);
  return id;
};

module.exports = { validate, parsePagination, parseId, EMAIL_RE };
