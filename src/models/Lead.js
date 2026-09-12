const { query } = require('../config/database');
const { buildSet, buildInsert, whereBuilder } = require('../utils/sqlHelpers');

const SELECT_BASE = `
  SELECT l.*, u.nombre AS usuario_nombre, po.nombre AS propietario_nombre
  FROM posibles_propietarios l
  LEFT JOIN usuarios u ON u.id = l.usuario_id
  LEFT JOIN propietarios po ON po.id = l.propietario_id`;

const Lead = {
  async findAll({ search, estado, tipo_propiedad, usuario_id, seguimiento_hasta } = {}, { limit = 20, offset = 0 } = {}) {
    const w = whereBuilder();
    w.search(['l.nombre', 'l.email', 'l.telefono', 'l.zona_interes'], search)
      .add('l.estado = ?', estado)
      .add('l.tipo_propiedad = ?', tipo_propiedad)
      .add('l.usuario_id = ?', usuario_id)
      .add('l.proximo_seguimiento <= ?', seguimiento_hasta);
    const { rows } = await query(
      `${SELECT_BASE} ${w.clause()} ORDER BY l.proximo_seguimiento ASC NULLS LAST, l.fecha_primer_contacto DESC
       LIMIT $${w.nextIndex()} OFFSET $${w.nextIndex() + 1}`,
      [...w.values, limit, offset]
    );
    const { rows: c } = await query(`SELECT COUNT(*)::int AS total FROM posibles_propietarios l ${w.clause()}`, w.values);
    return { data: rows, total: c[0].total };
  },

  async findById(id) {
    const { rows } = await query(`${SELECT_BASE} WHERE l.id = $1`, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const { text, values } = buildInsert('posibles_propietarios', data);
    const { rows } = await query(text, values);
    return Lead.findById(rows[0].id);
  },

  async update(id, data, client) {
    const { set, values, count } = buildSet(data);
    if (!count) return Lead.findById(id);
    const runner = client || { query };
    const { rowCount } = await runner.query(`UPDATE posibles_propietarios SET ${set} WHERE id = $${count + 1}`, [...values, id]);
    return rowCount ? Lead.findById(id) : null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM posibles_propietarios WHERE id = $1', [id]);
    return rowCount > 0;
  },

  /** Leads con seguimiento vencido o para los próximos N días. */
  async proximosSeguimientos(dias = 7, limit = 10) {
    const { rows } = await query(
      `${SELECT_BASE}
       WHERE l.estado IN ('contactado', 'interesado')
         AND l.proximo_seguimiento IS NOT NULL
         AND l.proximo_seguimiento <= CURRENT_DATE + $1::int
       ORDER BY l.proximo_seguimiento ASC LIMIT $2`,
      [dias, limit]
    );
    return rows;
  },
};

module.exports = Lead;
