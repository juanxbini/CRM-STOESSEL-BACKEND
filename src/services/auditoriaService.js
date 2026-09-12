const Auditoria = require('../models/Auditoria');

const ACCIONES = { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', LOGIN: 'LOGIN', UPLOAD: 'UPLOAD', CONVERT: 'CONVERT' };

/**
 * Registra una acción en la auditoría. No bloquea ni rompe la operación principal si falla.
 * @param {object} usuario  req.user
 * @param {string} accion   ACCIONES.*
 * @param {string} tabla    nombre lógico de la entidad ('propiedades', 'clientes', ...)
 * @param {number|null} registroId
 * @param {string} descripcion
 */
const registrar = (usuario, accion, tabla, registroId = null, descripcion = null) =>
  Auditoria.create({ usuario_id: usuario ? usuario.id : null, accion, tabla, registro_id: registroId, descripcion })
    .catch((err) => console.error('⚠️  No se pudo registrar la auditoría:', err.message));

/** Describe qué campos cambiaron entre el registro anterior y los datos nuevos. */
const describirCambios = (anterior, cambios) => {
  const difs = Object.entries(cambios)
    .filter(([k, v]) => v !== undefined && String(anterior[k] ?? '') !== String(v ?? ''))
    .map(([k, v]) => `${k}: "${anterior[k] ?? ''}" → "${v ?? ''}"`);
  return difs.length ? difs.join('; ') : 'Sin cambios de datos';
};

const listar = (filters, pagination) => Auditoria.findAll(filters, pagination);

module.exports = { ACCIONES, registrar, describirCambios, listar };
