const { query } = require('../config/database');
const { buildInsert, whereBuilder } = require('../utils/sqlHelpers');

const SELECT_BASE = `
  SELECT g.*,
         pr.direccion AS propiedad_direccion, pr.zona AS propiedad_zona,
         c.nombre AS cliente_nombre,
         u.nombre AS usuario_nombre
  FROM gestion_inmueble g
  JOIN propiedades pr ON pr.id = g.propiedad_id
  LEFT JOIN clientes_compra c ON c.id = g.cliente_compra_id
  LEFT JOIN usuarios u ON u.id = g.usuario_id`;

const Interaccion = {
  async findAll({ propiedad_id, cliente_id, usuario_id, tipo, estado_negociacion, desde, hasta } = {}, { limit = 20, offset = 0 } = {}) {
    const w = whereBuilder();
    w.add('g.propiedad_id = ?', propiedad_id)
      .add('g.cliente_compra_id = ?', cliente_id)
      .add('g.usuario_id = ?', usuario_id)
      .add('g.tipo_interaccion = ?', tipo)
      .add('g.estado_negociacion = ?', estado_negociacion)
      .add('g.fecha >= ?', desde)
      .add('g.fecha <= ?', hasta);
    const { rows } = await query(
      `${SELECT_BASE} ${w.clause()} ORDER BY g.fecha DESC LIMIT $${w.nextIndex()} OFFSET $${w.nextIndex() + 1}`,
      [...w.values, limit, offset]
    );
    const { rows: c } = await query(`SELECT COUNT(*)::int AS total FROM gestion_inmueble g ${w.clause()}`, w.values);
    return { data: rows, total: c[0].total };
  },

  async findById(id) {
    const { rows } = await query(`${SELECT_BASE} WHERE g.id = $1`, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const { text, values } = buildInsert('gestion_inmueble', data);
    const { rows } = await query(text, values);
    return Interaccion.findById(rows[0].id);
  },

  async ultimas(limit = 8) {
    const { rows } = await query(`${SELECT_BASE} ORDER BY g.fecha DESC LIMIT $1`, [limit]);
    return rows;
  },
};

module.exports = Interaccion;
