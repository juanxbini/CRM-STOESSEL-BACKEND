const { query } = require('../config/database');
const { buildSet, buildInsert, whereBuilder } = require('../utils/sqlHelpers');

const SELECT_BASE = `
  SELECT pr.*,
         po.nombre AS propietario_nombre,
         po.telefono AS propietario_telefono,
         u.nombre  AS usuario_nombre
  FROM propiedades pr
  JOIN propietarios po ON po.id = pr.propietario_id
  LEFT JOIN usuarios u ON u.id = pr.usuario_id`;

const Propiedad = {
  async findAll(filters = {}, { limit = 20, offset = 0 } = {}) {
    const { search, estado, tipo, zona, propietario_id, usuario_id, precio_min, precio_max, habitaciones_min, orden } = filters;
    const w = whereBuilder();
    w.search(['pr.direccion', 'pr.zona', 'pr.descripcion', 'po.nombre'], search)
      .add('pr.estado = ?', estado)
      .add('pr.tipo = ?', tipo)
      .ilike('pr.zona', zona)
      .add('pr.propietario_id = ?', propietario_id)
      .add('pr.usuario_id = ?', usuario_id)
      .add('pr.precio_venta >= ?', precio_min)
      .add('pr.precio_venta <= ?', precio_max)
      .add('pr.habitaciones >= ?', habitaciones_min);

    const ordenes = {
      recientes: 'pr.fecha_ingreso DESC',
      precio_asc: 'pr.precio_venta ASC NULLS LAST',
      precio_desc: 'pr.precio_venta DESC NULLS LAST',
      zona: 'pr.zona ASC, pr.direccion ASC',
    };
    const orderBy = ordenes[orden] || ordenes.recientes;

    const { rows } = await query(
      `${SELECT_BASE} ${w.clause()} ORDER BY ${orderBy} LIMIT $${w.nextIndex()} OFFSET $${w.nextIndex() + 1}`,
      [...w.values, limit, offset]
    );
    const { rows: c } = await query(
      `SELECT COUNT(*)::int AS total FROM propiedades pr JOIN propietarios po ON po.id = pr.propietario_id ${w.clause()}`,
      w.values
    );
    return { data: rows, total: c[0].total };
  },

  async findById(id) {
    const { rows } = await query(`${SELECT_BASE} WHERE pr.id = $1`, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const { text, values } = buildInsert('propiedades', data);
    const { rows } = await query(text, values);
    return Propiedad.findById(rows[0].id);
  },

  async update(id, data) {
    const { set, values, count } = buildSet(data);
    if (!count) return Propiedad.findById(id);
    const { rowCount } = await query(`UPDATE propiedades SET ${set} WHERE id = $${count + 1}`, [...values, id]);
    return rowCount ? Propiedad.findById(id) : null;
  },

  async remove(id) {
    const { rowCount } = await query('DELETE FROM propiedades WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async setFotos(id, fotos) {
    const { rows } = await query(
      'UPDATE propiedades SET fotos_cloudinary = $1::jsonb WHERE id = $2 RETURNING fotos_cloudinary',
      [JSON.stringify(fotos), id]
    );
    return rows[0] ? rows[0].fotos_cloudinary : null;
  },

  async zonas() {
    const { rows } = await query('SELECT DISTINCT zona FROM propiedades WHERE zona IS NOT NULL ORDER BY zona');
    return rows.map((r) => r.zona);
  },
};

module.exports = Propiedad;
