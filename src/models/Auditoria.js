const { query } = require('../config/database');
const { whereBuilder } = require('../utils/sqlHelpers');

const Auditoria = {
  async create({ usuario_id, accion, tabla, registro_id = null, descripcion = null }) {
    const { rows } = await query(
      'INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [usuario_id, accion, tabla, registro_id, descripcion]
    );
    return rows[0];
  },

  async findAll({ usuario, accion, tabla, registro_id, desde, hasta } = {}, { limit = 50, offset = 0 } = {}) {
    const w = whereBuilder();
    w.add('a.usuario_id = ?', usuario)
      .add('a.accion = ?', accion)
      .add('a.tabla = ?', tabla)
      .add('a.registro_id = ?', registro_id)
      .add('a.fecha >= ?', desde)
      .add('a.fecha <= ?', hasta);
    const { rows } = await query(
      `SELECT a.*, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
       ${w.clause()} ORDER BY a.fecha DESC LIMIT $${w.nextIndex()} OFFSET $${w.nextIndex() + 1}`,
      [...w.values, limit, offset]
    );
    const { rows: c } = await query(`SELECT COUNT(*)::int AS total FROM auditoria a ${w.clause()}`, w.values);
    return { data: rows, total: c[0].total };
  },
};

module.exports = Auditoria;
