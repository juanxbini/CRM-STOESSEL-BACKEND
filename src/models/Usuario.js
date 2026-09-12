const { query } = require('../config/database');
const { buildSet, buildInsert, whereBuilder } = require('../utils/sqlHelpers');

const PUBLIC_COLS = 'id, nombre, email, telefono, rol, estado, fecha_registro, ultimo_acceso';

const Usuario = {
  async findById(id) {
    const { rows } = await query(`SELECT ${PUBLIC_COLS} FROM usuarios WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  /** Incluye password_hash: usar solo para login. */
  async findByEmailWithPassword(email) {
    const { rows } = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findAll({ search, rol, estado } = {}, { limit = 50, offset = 0 } = {}) {
    const w = whereBuilder();
    w.search(['nombre', 'email'], search).add('rol = ?', rol).add('estado = ?', estado);
    const { rows } = await query(
      `SELECT ${PUBLIC_COLS} FROM usuarios ${w.clause()} ORDER BY nombre ASC LIMIT $${w.nextIndex()} OFFSET $${w.nextIndex() + 1}`,
      [...w.values, limit, offset]
    );
    const { rows: c } = await query(`SELECT COUNT(*)::int AS total FROM usuarios ${w.clause()}`, w.values);
    return { data: rows, total: c[0].total };
  },

  async create(data) {
    const { text, values } = buildInsert('usuarios', data);
    const { rows } = await query(text.replace('RETURNING *', `RETURNING ${PUBLIC_COLS}`), values);
    return rows[0];
  },

  async update(id, data) {
    const { set, values, count } = buildSet(data);
    if (!count) return Usuario.findById(id);
    const { rows } = await query(
      `UPDATE usuarios SET ${set} WHERE id = $${count + 1} RETURNING ${PUBLIC_COLS}`,
      [...values, id]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM usuarios WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async touchUltimoAcceso(id) {
    await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [id]);
  },

  async countAdminsActivos() {
    const { rows } = await query(`SELECT COUNT(*)::int AS total FROM usuarios WHERE rol = 'admin' AND estado = 'activo'`);
    return rows[0].total;
  },
};

module.exports = Usuario;
