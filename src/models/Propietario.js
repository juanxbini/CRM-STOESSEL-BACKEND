const { query } = require('../config/database');
const { buildSet, buildInsert, whereBuilder } = require('../utils/sqlHelpers');

const Propietario = {
  async findAll({ search, estado, ciudad } = {}, { limit = 20, offset = 0 } = {}) {
    const w = whereBuilder();
    w.search(['p.nombre', 'p.email', 'p.telefono'], search).add('p.estado = ?', estado).ilike('p.ciudad', ciudad);
    const sql = `
      SELECT p.*, (SELECT COUNT(*)::int FROM propiedades pr WHERE pr.propietario_id = p.id) AS cantidad_propiedades
      FROM propietarios p ${w.clause()}
      ORDER BY p.nombre ASC
      LIMIT $${w.nextIndex()} OFFSET $${w.nextIndex() + 1}`;
    const { rows } = await query(sql, [...w.values, limit, offset]);
    const { rows: c } = await query(`SELECT COUNT(*)::int AS total FROM propietarios p ${w.clause()}`, w.values);
    return { data: rows, total: c[0].total };
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM propietarios WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findPropiedades(id) {
    const { rows } = await query(
      'SELECT id, direccion, tipo, zona, estado, precio_venta, precio_alquiler, fotos_cloudinary, fecha_ingreso FROM propiedades WHERE propietario_id = $1 ORDER BY fecha_ingreso DESC',
      [id]
    );
    return rows;
  },

  async create(data) {
    const { text, values } = buildInsert('propietarios', data);
    const { rows } = await query(text, values);
    return rows[0];
  },

  async update(id, data) {
    const { set, values, count } = buildSet(data);
    if (!count) return Propietario.findById(id);
    const { rows } = await query(`UPDATE propietarios SET ${set} WHERE id = $${count + 1} RETURNING *`, [...values, id]);
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM propietarios WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Propietario;
