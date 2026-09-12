const { query } = require('../config/database');
const { buildSet, buildInsert, whereBuilder } = require('../utils/sqlHelpers');

const Cliente = {
  async findAll({ search, estado, tipo_buscando, ciudad_interes } = {}, { limit = 20, offset = 0 } = {}) {
    const w = whereBuilder();
    w.search(['nombre', 'email', 'telefono'], search)
      .add('estado = ?', estado)
      .add('tipo_buscando = ?', tipo_buscando)
      .ilike('ciudad_interes', ciudad_interes);
    const { rows } = await query(
      `SELECT c.*, (SELECT COUNT(*)::int FROM gestion_inmueble g WHERE g.cliente_compra_id = c.id) AS cantidad_interacciones
       FROM clientes_compra c ${w.clause()} ORDER BY c.fecha_registro DESC
       LIMIT $${w.nextIndex()} OFFSET $${w.nextIndex() + 1}`,
      [...w.values, limit, offset]
    );
    const { rows: c } = await query(`SELECT COUNT(*)::int AS total FROM clientes_compra ${w.clause()}`, w.values);
    return { data: rows, total: c[0].total };
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM clientes_compra WHERE id = $1', [id]);
    return rows[0] || null;
  },

  /** Historial de interacciones del cliente con las propiedades que vio. */
  async findHistorial(id) {
    const { rows } = await query(
      `SELECT g.id, g.tipo_interaccion, g.fecha, g.notas, g.estado_negociacion,
              pr.id AS propiedad_id, pr.direccion AS propiedad_direccion, pr.zona AS propiedad_zona, pr.estado AS propiedad_estado,
              u.nombre AS usuario_nombre
       FROM gestion_inmueble g
       JOIN propiedades pr ON pr.id = g.propiedad_id
       LEFT JOIN usuarios u ON u.id = g.usuario_id
       WHERE g.cliente_compra_id = $1
       ORDER BY g.fecha DESC`,
      [id]
    );
    return rows;
  },

  async create(data) {
    const { text, values } = buildInsert('clientes_compra', data);
    const { rows } = await query(text, values);
    return rows[0];
  },

  async update(id, data) {
    const { set, values, count } = buildSet(data);
    if (!count) return Cliente.findById(id);
    const { rows } = await query(`UPDATE clientes_compra SET ${set} WHERE id = $${count + 1} RETURNING *`, [...values, id]);
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM clientes_compra WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Cliente;
